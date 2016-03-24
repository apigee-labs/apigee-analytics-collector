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
    .option("-m, --apigee_mgmt_api_uri <apigee_mgmt_api_uri>", "URL to management API")
    .option("-u, --apigee_mgmt_api_email <apigee_mgmt_api_email>", "Email registered on the Management API")
    .option("-p, --apigee_mgmt_api_password <apigee_mgmt_api_password>", "Password associated to the email account")
    .option("-i, --include_orgs <items>", 'Include orgs from this list', list)
    .option("-x, --exclude_orgs <items>", 'Exclude orgs from this list', list)
    .option("-n, --include_envs <items>", 'Include environments from this list',list)
    .option("-e, --exclude_envs <items>", 'Exclude envs from this list', list)
    .option("-o, --output <path>", "Path to save output files")
    .option("-s, --time_range_start <time_range_start>", 'Time range start for querying traffic stats e.g. "03/01/2016 00:00"')
    .option("-e, --time_range_end <time_range_end>", 'Time range end for querying traffic stats e.g. "03/31/2016 24:00"')
    .option("-t, --time_unit <time_unit>", 'Time unit for traffic stats. Default week.', /^(second|minute|hour|day|week)$/i, 'week')
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
  var org_env_traffic_promises = [];
  org.forEach( function( org ) {
    org.envs.forEach( function( env ) {
      org_env_traffic_promises.push( request( get_base_options( options, ['/organizations', org.org, '/environments/', env, '/stats/' ], {
                                        'select': 'sum(message_count)',
                                        'timeRange': (options["time_range_start"] || dateFormat( get_day_of_month( true ), 'mm/dd/yyyy HH:MM' ) )
                                            .concat('~').concat(options["time_range_end"] || dateFormat( get_day_of_month( false ), 'mm/dd/yyyy HH:MM' )),
                                        'timeUnit': options["time_unit"] || 'week'
                                      } ) ).then( function( res ) {
                                                      var stat = { org: org.org, env: env, traffic: JSON.parse(res) }
                                                      return stat;
                                                    } ) );
                      })
      }
  );
  /*return Promise.all( org_env_traffic_promises )
      .then( function( org_env_traffic ) {
        return ( org_env_traffic );
      });*/
  return org_env_traffic_promises;
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

function env_options( options ) {
  var default_options = get_base_options( options );
  debug('retrieving base options', default_options);
  default_options.uri = urljoin( default_options.uri, '/environments/' );
  return default_options;
}

function stats_options(options ) {
  debug('timeunit', options["time_unit"]);
  var default_options = get_base_options( options );
  default_options.uri = urljoin( default_options.uri, '/environments/', '/test/', '/stats/' );
  debug('stats_options uri', default_options.uri);
  default_options.qs = {
    'select': 'sum(message_count)',
    'timeRange': (options["time_range_start"] || dateFormat( get_day_of_month( true ), 'mm/dd/yyyy HH:MM' ) )
        .concat('~').concat(options["time_range_end"] || dateFormat( get_day_of_month( false ), 'mm/dd/yyyy HH:MM' )),
    'timeUnit': options["time_unit"] || 'week'
  };
  return default_options;
}

/*function get_base_options( options ) {
  var default_base_options = {
    uri: urljoin( options["apigee_mgmt_api_uri"] || process.env["apigee_mgmt_api_uri"], 'organizations',
        options.apigee_mgmt_api_org || process.env.apigee_mgmt_api_org ),
    headers: {
      'Authorization': "Basic " + new Buffer( ( options["apigee_mgmt_api_email"] || process.env["apigee_mgmt_api_email"] ) + ":"
          + ( options["apigee_mgmt_api_password"] || process.env["apigee_mgmt_api_password"] )).toString("base64")
    }
  }
  return default_base_options;
}*/

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

function get_all_orgs( options, suffixArray ) {
  var default_base_options = {
    uri: urljoin( options["apigee_mgmt_api_uri"] || process.env["apigee_mgmt_api_uri"] ),
    headers: {
      'Authorization': "Basic " + new Buffer( ( options["apigee_mgmt_api_email"] || process.env["apigee_mgmt_api_email"] ) + ":"
          + ( options["apigee_mgmt_api_password"] || process.env["apigee_mgmt_api_password"] )).toString("base64")
    }
  }
  return default_base_options;
}

function get_day_of_month( first ) {
  var date = new Date(), y = date.getFullYear(), m = date.getMonth();
  var day;
  if( first ) day = new Date(y, m, 1);
  else day = new Date(y, m + 1, 0);
  return day;
}

/*  request( env_options( options ) )
 .then( function( envs ) {
 debug('inside promise', envs);
 return request( stats_options( options ) )
 .then(function (message_count) {
 if (options.output) {
 var parsed_path = path.parse(options.output);
 var filename = 'TBD.json';

 // path + filename are provided, so base and name aren't equal
 if (parsed_path.base != parsed_path.name) {
 filename = options.output;
 } else {

 // when only path is provided, create a filename with date and time
 filename = parsed_path.base.concat('/').concat(dateFormat(new Date(), "isoDateTime")).concat('.json');
 }
 fs.writeFileSync(filename, message_count);
 console.log( 'Save file successful. ', filename );
 } else {
 console.log(message_count);
 }
 })
 .catch(function (err) {
 console.log(err.stack);
 })
 })*/

/*
function stream_or_save_traffic(org_env_traffic_promises ) {
  var options = this.options;
  return Promise.all( org_env_traffic_promises )
      .then( function( org_env_traffic_array ) {
        // var index = 0;
        if (options.output) {
          debug('options.output',options.output);
          fs.writeFileSync(options.output, JSON.stringify({"entities": [org_env_traffic_array]}));
          /!*        org_env_traffic_array.forEach( function( org_env_traffic ) {
           var filename = 'traffic'.concat('-').concat(org_env_traffic.org).concat('-').concat(org_env_traffic.env)
           .concat('-').concat(dateFormat(new Date(), "mm-dd-yyyy-HH-MM")).concat('-').concat((index++).toString()).concat('.json');
           debug('writing file', filename);
           fs.writeFileSync(path.join(options.output, filename), JSON.stringify({"entities": [org_env_traffic]}, null, "\t"));
           console.log( 'File saved successfully.', filename );
           })*!/
        } else {
          /!*        org_env_traffic_array.forEach( function( org_env_traffic ) {
           process.stdout.write(JSON.stringify({ entities: [ org_env_traffic ] })+'\n');
           })*!/
          process.stdout.write(JSON.stringify({ entities: org_env_traffic_array }));
        }
      })
}*/
