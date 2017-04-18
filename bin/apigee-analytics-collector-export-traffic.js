#!/usr/bin/env node

require('dotenv').config({silent: true});

var program = require('commander'),
    request = require('request-promise'),
    throat = require('throat'),
    fs = require('fs'),
    path = require('path'),
    dateFormat = require('dateformat'),
    urljoin = require('url-join'),
    chalk = require('chalk'),
    curl = require('curl-cmd'),
    qs = require('qs'),
    mask = require('json-mask'),
    CronJob = require('cron').CronJob;

program
    .description('Export data from the management API')
    .option("-A, --aggregate_function <aggregate_function>", "Valid dimensions: avg, apps, min, max, sum (default)", /^(avg|apps|min|max|sum)$/i, 'sum')
    .option("-D, --dimension <dimension>", "The traffic dimension to collect. Valid dimensions: apiproducts, devs, app, apis(default)", /^(apiproducts|devs|apps|apis)$/i, 'apis')
    .option("-d, --days <days>", "The number of days to collect in retrograde. 3 by default", 3, parseInt)

    // added back
    // it was removed because of bug in windows bigger than 24 hours in stats api, which can be fixed by giving large limit. e.g. 1'000'000 records
    .option("-w, --window <window>", 'The number days to collect per request.  For example, you can collect a month ' +
                                     'of traffic one day at a time, 3 days at a time or \'N\' days at a time.  Using this ' +
                                     'results in shorter-lived AX requests and can be used to reduce timeouts from AX API. 3 by default', 3, parseInt)
    .option("-m, --apigee_mgmt_api_uri <apigee_mgmt_api_uri>", "URL to management API")
    .option("-M, --metric <metric>", "Metric to be collected. For list of metrics see http://docs.apigee.com/management/apis/get/organizations/%7Borg_name%7D/environments/%7Benv_name%7D/stats/%7Bdimension_name%7D-0", /^(message_count|tps|is_error|policy_error|target_error|request_processing_latency|request_size|response_processing_latency|response_size|target_response_time|total_response_time|cache_hit|ax_cache_l1_count|ax_cache_executed)/i, "message_count")
    .option("-u, --apigee_mgmt_api_email <apigee_mgmt_api_email>", "Email registered on the Management API. See .env file to setup default value")
    .option("-p, --apigee_mgmt_api_password <apigee_mgmt_api_password>", "Password associated to the management api email account")
    .option("-i, --include_orgs <items>", 'Include orgs from this list (comma separated)', list)
    .option("-x, --exclude_orgs <items>", 'Exclude orgs from this list (comma separated)', list)
    .option("-n, --include_envs <items>", 'Include environments from this list (comma separated)',list)
    .option("-e, --exclude_envs <items>", 'Exclude envs from this list (comma separated)', list)
    .option("-o, --output <path>", "Path and filename to save output")
    .option("-s, --time_range_start <time_range_start>", 'Time range start for querying traffic stats e.g. "03/01/2016 00:00"')
    .option("-z, --time_range_end <time_range_end>", 'Time range end for querying traffic stats e.g. "04/01/2016 24:00"')
    .option("-t, --time_unit <time_unit>", 'Time unit for traffic stats. Default week. Default units by hour. Valid time units: second, minute, hour, day, week', /^(second|minute|hour|day|week)$/i, 'hour')
    .option("-U, --apigee_analytics_api_url <apigee_analytics_api_url>", "apigee analytics URL to submit the traffic output. Send a request to 360@apigee.com to request credentials.", "https://nucleus-api-prod.apigee.com/v1/apigee-analytics-cli-api/traffic/orgs") //"http://localhost:10010/traffic/orgs")
    .option("-S, --standard_output", "output through the terminal (stdout).")
    .option("-c, --apigee_analytics_client_id <apigee_analytics_client_id>", "cliend_id used to authenticate against apigee analytics api")
    .option("-r, --apigee_analytics_secret <apigee_analytics_secret>", "secret used to authenticate againts apigee analytics api")
    .option("-R, --include_curl_commands", "include sample cURL commands for debugging")
    .option("-v, --verbose", "make the operation more talkative")
    .option("-k, --chunks <chunks>", "chunks dimensions in smaller sets. Used to avoid long api requests to analytics api, which may take longer than 1 minute.", 5, parseInt)
    //.option("-N, --run_as_standalone_cronjob","indicate to run as a standalone job in background")
    //.option("-E, --cronjob_schedule <cronjob schedule>","cronjob schedule. Default schedule as \"30 2 * * *\", everyday at 2:30 am. Requires --run_as_standalone_flag","30 2 * * *")
    .parse(process.argv);

// this is required to enable debug as a flag instead of as an environment variable
if( program.verbose ) process.env.DEBUG = '*';
var debug = require('debug')('apigee-nucleus');

if( !program.run_as_standalone_cronjob ) extract_traffic(program);
else {
  debug('executing job with program.cronjob_schedule', program.cronjob_schedule);
  var job = new CronJob({
    cronTime: program.cronjob_schedule,
    onTick: function() {
      extract_traffic(program);
    },
    start: false,
    timeZone: 'America/Los_Angeles'
  });
  job.start();
}

function extract_traffic(options) {
  get_include_orgs_promise(options)
    .then(get_orgs.bind({ options: options } ))
    .then(get_without_excluded_orgs.bind( { options: options } ))
    .then(get_orgs_with_envs.bind({ options: options } ))
    .then(exclude_envs_from_orgs.bind( { options: options } ))
    .then(get_traffic.bind( { options: options } ))
    .then(function resolve_parallel_requests(traffic_data_promises) {
      return Promise.all(traffic_data_promises);
    })
    .then(function(traffic_data) {
      return chunkify_dimensions(traffic_data, options.chunks); 
    })
    .then(post_or_save_traffic.bind( { options: options } ))
    .catch(function(err) {
      console.log( err );
      debug(err.stack);
      process.exit(1);
    });
}

function chunkify_dimensions(org_env_traffic_array, chunks) {
  function chunkify_traffic_dimensions(traffic_environments, chunks) {
    var env_dimensions_chunked = [];
    traffic_environments.forEach(function(traffic_env) {
      while (traffic_env.dimensions.length > 0) {
        env_dimensions_chunked.push({ dimensions: traffic_env.dimensions.splice(0, chunks), name: traffic_env.name });
      }
    });
    return env_dimensions_chunked;
  }
  org_env_traffic_array = [].concat.apply([], org_env_traffic_array); // flatten array
  var oet = org_env_traffic_array.map(function(trafficElement) {
    return chunkify_traffic_dimensions(trafficElement.traffic.environments, chunks) 
      .map(function(dimension_chunk) {
        var trafficElementClone = JSON.parse(JSON.stringify(trafficElement));
        trafficElementClone.traffic.environments = [dimension_chunk];
        return trafficElementClone;
      })
  });
  return [].concat.apply([], oet);
}

function post_or_save_traffic(org_env_traffic_array) {
  var options = this.options;
  debug("org_env_traffic_array", org_env_traffic_array);
  org_env_traffic_array = [].concat.apply([], org_env_traffic_array);
  var org_env_traffic_array_str = JSON.stringify({"entities": org_env_traffic_array});
  if (options.output) {
    debug('options.output',options.output);
    fs.writeFileSync(options.output, org_env_traffic_array_str);
    return console.log(chalk.green('File saved successfully', options.output));
  } else if( options.standard_output ){
    return process.stdout.write(org_env_traffic_array_str);
  }
    return post_traffic( org_env_traffic_array, options );
}

function post_traffic(traffic_array, options) {
  var client_id = options.apigee_analytics_client_id || process.env.apigee_analytics_client_id;
  var secret = options.apigee_analytics_secret || process.env.apigee_analytics_secret;
  var apigee_analytics_api_url = process.env.apigee_analytics_api_url || options.apigee_analytics_api_url;
  if( !client_id || !secret ) throw new Error('apigee_analytics_client_id or apigee_analytics_secret are required.');
  var traffic_array_sent_p = (traffic_array||[]).map( throat( 10, function( org_env_traffic ) {
    var _options = {
      method: 'POST',
      uri: urljoin( apigee_analytics_api_url, org_env_traffic.org, org_env_traffic.dimension ),
      body: org_env_traffic.traffic,
      json: true,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': "Basic " + new Buffer(client_id + ":" + secret).toString("base64")
      }
    };
    debug('post_traffic cURL', generatecURL(_options));
    return request( _options )
        .catch( function(err) {
          debug(err);
          throw new Error("Error calling API " + generatecURL(_options) + err.message);
        });
  }));
  return Promise.all( traffic_array_sent_p )
          .then( process_traffic_response.bind( { traffic_array: traffic_array } ) );
}

function process_traffic_response( data_array ) {
  var traffic_array = this.traffic_array;
  var result = (data_array||[]).map( function( data_item, index ) {
    return { org: traffic_array[index].org, env: traffic_array[index].env,
      time_range_start: traffic_array[index].time_range_start,
      time_range_end: traffic_array[index].time_range_end, response: data_item  };
  });
  process.stdout.write( JSON.stringify(result, null, 2) );
}

function get_traffic( orgs ) {
  var options = this.options;
  var org_env_window_options = [];
  var start_end_dates = get_start_end_dates(options);
  debug( 'start_end_dates', start_end_dates);
  var date_windows = get_date_windows(start_end_dates, options.window);
  debug('date_windows', date_windows);
  debug('get_traffic', orgs);
  (orgs||[]).forEach( function( org ) {
    (org.envs||[]).forEach( function( env ) {
      (date_windows||[]).forEach( function( date_window ) {
            debug('time range', date_window.start_date_str.concat('~').concat(date_window.end_date_str));
            var _options = get_base_options( options, ['/organizations', org.org, '/environments/', env, '/stats/', options.dimension ], {
              'select': options.aggregate_function + '(' + options.metric + ')',
              'timeRange': date_window.start_date_str.concat('~').concat(date_window.end_date_str),
              'timeUnit': options.time_unit,
              'limit': 14400,
              'offset': 0
            } );
            _options.stat = { org: org.org, env: env,
              time_range_start: date_window.start_date_str,
              time_range_end: date_window.end_date_str,
              dimension: options.dimension,
              aggregate_function: options.aggregate_function
            };
            org_env_window_options.push( _options );
          });
        });
      }
  );
  var org_env_window_traffic_promise = get_org_env_window_traffic_promises( org_env_window_options );
  return org_env_window_traffic_promise;
}

function get_org_env_window_traffic_promises( org_env_window_options ) {
  "use strict";
  debug('get_org_env_window_traffic_promises', mask(org_env_window_options, 'qs,stat'));
  var org_env_window_traffic_promise = (org_env_window_options||[]).map( throat( 10, function( org_env_window_option ) {
    return get_all_traffic_for_page_offset(org_env_window_option, 0)
        .then(function(data){
          debug("all_pages_traffic_stats", JSON.stringify(data));
          return data;
        });
  }) );
  return org_env_window_traffic_promise;
}

// here is where we make calls to the management api
function get_all_traffic_for_page_offset(org_env_window_option, offset) {
  "use strict";
  var all_pages_traffic_stats = [];
  function get_traffic_for_page_offset(org_env_window_option, offset) {
    org_env_window_option.qs.offset = offset;
    debug('cURL command',  generatecURL(org_env_window_option) );
    return request( org_env_window_option )
        .then( function(res_array) {
          var parsed_response = JSON.parse(res_array);
          // if there are dimensions within environments, check next page by increasing offset
          if (parsed_response.environments.filter(function(env){return env.dimensions ? true : false; }).length > 0) {

            // clone org_env_window_option
            var org_env_window_option_t = JSON.parse(JSON.stringify(org_env_window_option));
            org_env_window_option_t.stat.traffic = rename_message_count_metric_name(parsed_response, org_env_window_option);
            all_pages_traffic_stats.push(org_env_window_option_t.stat);
            debug('requesting next page');
            return get_traffic_for_page_offset(org_env_window_option, offset + 14400);
          } else{
            return all_pages_traffic_stats;
          }
        } );
  }
  return get_traffic_for_page_offset(org_env_window_option, offset);
}

function rename_message_count_metric_name( stats, options ) {
  (stats.environments||[]).forEach( function( environment ) {
    (environment.dimensions||[]).map( function( dimension ) {
      (dimension.metrics||[]).map( function( metric ) {
        //if( metric.name === 'sum(message_count)' ) metric.name = 'message_count';
        metric.name = options.metric;
      } );
    } );
  }  ); 
  return stats;
}

function get_start_end_dates( options ) {
  var start_today = new Date();
  debug('options.days', options.days);
  start_today.setHours(0,0,0,0);

  // get start date or tomorrow date, if not passed
  var time_range_end = new Date( options.time_range_end || new Date((new Date(start_today.getTime())).setDate(start_today.getDate() + 1)));

  // get start date based time range end date minus days retrogade
  var time_range_start = new Date(options.time_range_start || new Date((new Date(time_range_end.getTime())).setDate( time_range_end.getDate() - options.days )));
  var time_range_end_str = dateFormat( time_range_end, 'mm/dd/yyyy HH:MM' );
  var time_range_start_str = dateFormat( time_range_start, 'mm/dd/yyyy HH:MM' );

  debug('time_range_start', time_range_start);
  debug('time_range_end', time_range_end);
  return { start_date: time_range_start,
    end_date: time_range_end,
    time_range: time_range_start_str.concat('~').concat(time_range_end_str),
    start_date_str: time_range_start_str,
    end_date_str: time_range_end_str};
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
    var _window_end_date = new Date((new Date(_start_date)).setDate(_start_date.getDate() + Math.max(parseInt(window), 1)));
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
  if(options.exclude_envs) {
    (orgs||[]).forEach( function(org) {
      org.envs = remove_array( org.envs, options.exclude_envs );
    });
  }
  return orgs;
}

function get_include_orgs_promise(options){
  var p = new Promise(
      function(resolve, reject) {
        resolve( options.include_orgs );
      });
  return p;
}

function get_without_excluded_orgs( orgs ) {
  var orgs_array = JSON.parse( orgs );
  return remove_array( orgs_array, this.options.exclude_orgs );
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
  if(this.options.include_envs) {
    var orgs = (orgs||[]).map( function( org ) { return { org: org, envs: options.include_envs}; });
    return orgs;
  }
  else{
    var promises = (orgs||[]).map( throat( 10, function( org ) {
      var _options = get_base_options( options, ['/organizations/', org, '/environments'] );
      debug('get_orgs_with_envs', generatecURL(_options));
      return request(_options)
          .catch(function(err) {
            debug(err);
            throw new Error("Error calling API " + generatecURL(_options) + err.message);
          });
    } ) );
    return Promise.all(promises)
        .then( function( envs ) {
          var orgs_with_env = (envs||[]).map( function( env, index ) {
            return { org: orgs[index], envs: JSON.parse(env) };
          });
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
  });
  return from;
}

function get_base_options( options, suffixArray, qs ) {
  var apigee_mgmt_api_uri = options.apigee_mgmt_api_uri || process.env.apigee_mgmt_api_uri;
  var apigee_mgmt_api_email = options.apigee_mgmt_api_email || process.env.apigee_mgmt_api_email;
  var apigee_mgmt_api_password = options.apigee_mgmt_api_password || process.env.apigee_mgmt_api_password;
  debug('apigee_mgmt_api_uri', apigee_mgmt_api_uri);
  if( !apigee_mgmt_api_uri ) throw new Error('Make sure apigee_mgmt_api_uri is set.');
  if( !apigee_mgmt_api_email ) throw new Error('Make sure apigee_mgmt_api_email is set');
  if( !apigee_mgmt_api_password ) throw new Error('Make sure apigee_mgmt_api_password is set');
  var default_base_options = {
    uri: urljoin( apigee_mgmt_api_uri ),
    headers: {
      'Authorization': "Basic " + new Buffer( ( apigee_mgmt_api_email ) + ":" +
  	( apigee_mgmt_api_password )).toString("base64")
    },
    qs: qs
  };
  (suffixArray||[]).forEach( function( item ) {
    default_base_options.uri = urljoin( default_base_options.uri, item );
  });
  debug( 'get_base_options', default_base_options.uri );
  return default_base_options;
}

function generatecURL(options) {
  var curl = 'curl';
  var method = (options.method || 'GET').toUpperCase();
  var body = options.body || {};
  var uri = options.uri;
  var qstring = qs.stringify(options.qs);

  //curl - add the method to the command (no need to add anything for GET)
  if (method === 'POST') {curl += ' -X POST'; }
  else if (method === 'PUT') { curl += ' -X PUT'; }
  else if (method === 'DELETE') { curl += ' -X DELETE'; }
  else { curl += ' -X GET'; }

  //curl - append the path
  curl += ' ' + uri;
  curl += '?' + qstring;

  //curl - add the body
  body = JSON.stringify(body); //only in node module
  if (body !== '"{}"' && method !== 'GET' && method !== 'DELETE') {
    //curl - add in the json obj
    curl += " -d '" + body + "'";
  }
  //log the curl command to the console
  return curl;
}

function list(val) {
  return val.replace(/\s/g,'').split(',');
}
