#!/usr/bin/env node

require('dotenv').config();

var program = require('commander'),
    request = require('request-promise'),
    fs = require('fs'),
    path = require('path'),
    dateFormat = require('dateformat'),
    urljoin = require('url-join'),
    debug = require('debug')('apigee-nucleus'),
    chalk = require('chalk');

function list(val) {
  return val.split(',');
}

program
    .description('Export data from the management API')
    .option("-D, --dimension <dimension>", "The traffic dimension to collect. Valid dimensions: apiproducts, developer, apps, apiproxy(default)", /^(apiproducts|developer|apps|apiproxy)$/i, 'apiproxy')
    .option("-d, --days <days>", "The number of days to collect in retrograde. 3 by default", 3, parseInt)
    .option("-w, --window <window>", 'The number days to collect per request.  For example, you can collect a month ' +
                                     'of traffic one day at a time, 3 days at a time or \'N\' days at a time.  Using this ' +
                                     'results in shorter-lived AX requests and can be used to reduce timeouts from AX API. 3 by default', 3, parseInt)
    .option("-m, --apigee_mgmt_api_uri <apigee_mgmt_api_uri>", "URL to management API")
    .option("-u, --apigee_mgmt_api_email <apigee_mgmt_api_email>", "Email registered on the Management API. See .env file to setup default value")
    .option("-p, --apigee_mgmt_api_password <apigee_mgmt_api_password>", "Password associated to the email account")
    .option("-i, --include_orgs <items>", 'Include orgs from this list', list)
    .option("-x, --exclude_orgs <items>", 'Exclude orgs from this list', list)
    .option("-n, --include_envs <items>", 'Include environments from this list',list)
    .option("-e, --exclude_envs <items>", 'Exclude envs from this list', list)
    .option("-o, --output <path>", "Path and filename to save output")
    .option("-s, --time_range_start <time_range_start>", 'Time range start for querying traffic stats e.g. "03/01/2016 00:00"')
    .option("-e, --time_range_end <time_range_end>", 'Time range end for querying traffic stats e.g. "04/01/2016 24:00"')
    .option("-t, --time_unit <time_unit>", 'Time unit for traffic stats. Default week. Default units by hour. Valid time units: second, minute, hour, day, week', /^(second|minute|hour|day|week)$/i, 'hour')
    .parse(process.argv);

extract_traffic(program);

function extract_traffic(options) {
  get_include_orgs_promise(options)
    .then( get_orgs.bind({ options: options }) )
    .then( get_without_excluded_orgs.bind( { options: options } ) )
    .then( get_orgs_with_envs.bind({ options: options }) )
    .then( exclude_envs_from_orgs.bind( { options: options } ) )
    .then( get_traffic.bind( { options: options } ) )
    .then( stream_or_save_traffic.bind( { options: options } ) )
    .catch( function(err) {
      console.log( err.stack );
      throw err;
    })
}

function stream_or_save_traffic(org_env_traffic_promises ) {
  var options = this.options;
  return Promise.all( org_env_traffic_promises )
    .then( function( org_env_traffic_array ) {
      if (options.output) {
        debug('options.output',options.output);
        fs.writeFileSync(options.output, JSON.stringify({"entities": [org_env_traffic_array]}));
        console.log(chalk.green('File saved successfully', options.output));
      } else {
        process.stdout.write(JSON.stringify({ entities: org_env_traffic_array }));
      }
    })
}

function get_traffic( org ) {
  var options = this.options;
  var org_env_window_traffic_promises = [];
  var start_end_dates = get_start_end_dates(options);
  debug( 'start_end_dates', start_end_dates);
  var date_windows = get_date_windows( start_end_dates, options.window );
  debug( 'date_windows', date_windows);
  org.forEach( function( org ) {
    org.envs.forEach( function( env ) {
      date_windows.forEach ( function( date_window ) {
        debug('time range', date_window.start_date_str.concat('~').concat(date_window.end_date_str));
        org_env_window_traffic_promises.push(
            request( get_base_options( options, ['/organizations', org.org, '/environments/', env, '/stats/', options.dimension ], {
              'select': 'sum(message_count)',
              'timeRange': date_window.start_date_str.concat('~').concat(date_window.end_date_str),
              'timeUnit': options["time_unit"]
            } ) )
                .then( function( res ) {
                  var stat = { org: org.org, env: env, traffic: JSON.parse(res),
                    time_range_start: date_window.start_date_str,
                    time_range_end: date_window.end_date_str }
                  return stat;
                } ) );
      });
    })
  }
  );
  return org_env_window_traffic_promises;
}

function get_start_end_dates( options ) {
  var start_today = new Date();
  debug('options.days', options.days);
  start_today.setHours(0,0,0,0);

  // get start date or tomorrow date, if not passed
  var time_range_end = new Date( options["time_range_end"] || new Date((new Date(start_today.getTime())).setDate(start_today.getDate() + 1)));

  // get start date based time range end date minus days retrogade
  var time_range_start = new Date(options["time_range_start"] || new Date((new Date(time_range_end.getTime())).setDate( time_range_end.getDate() - options.days )));
  var time_range_end_str = dateFormat( time_range_end, 'mm/dd/yyyy HH:MM' );
  var time_range_start_str = dateFormat( time_range_start, 'mm/dd/yyyy HH:MM' );

  debug('time_range_start', time_range_start);
  debug('time_range_end', time_range_end);
  return { start_date: time_range_start,
    end_date: time_range_end,
    time_range: time_range_start_str.concat('~').concat(time_range_end_str),
    start_date_str: time_range_start_str,
    end_date_str: time_range_end_str}
}

function get_date_windows( start_end_dates, window ) {
  var date_windows = [],
      start_date = start_end_dates.start_date,
      end_date = start_end_dates.end_date,
      _start_date = start_date,
      _end_date = end_date;
  debug('window', window);
  debug('_start_date', _start_date);
  do {
    var _window_end_date = new Date((new Date(_start_date)).setDate(_start_date.getDate() + parseInt(window)));
    debug('_window_end_date', _window_end_date);
    if (_window_end_date > end_date) _window_end_date = end_date;
    date_windows.push( {
      start_date: _start_date, end_date: _window_end_date,
      start_date_str: dateFormat( _start_date, 'mm/dd/yyyy HH:MM' ),
      end_date_str: dateFormat( _window_end_date, 'mm/dd/yyyy HH:MM' )
    });
    _start_date = _window_end_date;
  } while( _window_end_date < end_date );
  return date_windows;
}

function exclude_envs_from_orgs( orgs ) {
  var options = this.options;
  if(options["exclude_envs"]) {
    orgs.forEach( function(org) {
      org.envs = remove_array( org.envs, options["exclude_envs"]);
    })
  }
  return orgs;
}

function get_include_orgs_promise(options){
  var p = new Promise(
      function(resolve, reject) {
        resolve( options["include_orgs"] );
      });
  return p;
}

function get_without_excluded_orgs( orgs ) {
  var orgs_array = JSON.parse( orgs );
  return remove_array( orgs_array, this.options["exclude_orgs"] );
}

function get_orgs( orgs ) {
  if( orgs )
    return JSON.stringify(orgs);
  else{
    return request( get_base_options( this.options, ['/organizations'] ) );
  }
}

function get_orgs_with_envs( orgs ) {
  debug( orgs );
  var options = this.options;
  if(this.options["include_envs"]) {
    var orgs = orgs.map( function( org ) { return { org: org, envs: options["include_envs"]} });
    return orgs
  }
  else{
    var promises = orgs.map( function( org ) {
      return request( get_base_options( 'options', ['/organizations/', org, '/environments'] ) );
    } );
    return Promise.all(promises)
        .then( function( envs ) {
          var orgs_with_env = envs.map( function( env, index ) {
            return { org: orgs[index], envs: JSON.parse(env) }
          })
          return orgs_with_env;
        } );
  }
}

function remove_array( from, values ) {
  (values||[]).forEach( function( item ) {
    var index = from.indexOf(item);
    if (index > -1) {
      from.splice(index, 1);
    }
  })
  return from;
}

function get_base_options( options, suffixArray, qs ) {
  debug('apigee_mgmt_api_uri',options["apigee_mgmt_api_uri"] || process.env["apigee_mgmt_api_uri"]);
  var default_base_options = {
    uri: urljoin( options["apigee_mgmt_api_uri"] || process.env["apigee_mgmt_api_uri"] ),
    headers: {
      'Authorization': "Basic " + new Buffer( ( options["apigee_mgmt_api_email"] || process.env["apigee_mgmt_api_email"] ) + ":"
          + ( options["apigee_mgmt_api_password"] || process.env["apigee_mgmt_api_password"] )).toString("base64")
    },
    qs: qs
  }
  suffixArray.forEach( function( item ) {
    default_base_options.uri = urljoin( default_base_options.uri, item );
  });
  debug( 'get_base_options', default_base_options.uri );
  return default_base_options;
}