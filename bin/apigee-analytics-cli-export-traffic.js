#!/usr/bin/env node

require('dotenv').config();

var program = require('commander'),
    request = require('request-promise'),
    fs = require('fs'),
    path = require('path'),
    dateFormat = require('dateformat'),
    urljoin = require('url-join'),
    debug = require('debug')('apigee-nucleus');

program
    .description('Export data from the management API')
    .option("-m, --apigee_mgmt_api_uri <apigee_mgmt_api_uri>", "URL to management API")
    .option("-u, --apigee_mgmt_api_email <apigee_mgmt_api_email>", "Email registered on the Management API")
    .option("-p, --apigee_mgmt_api_password <apigee_mgmt_api_password>", "Password associated to the email account")
    .option("-o, --output <path>", "Path and filename to save output")
    .option("-s, --time_range_start <time_range_start>", 'Time range start for querying traffic stats e.g. "03/01/2016 00:00"')
    .option("-e, --time_range_end <time_range_end>", 'Time range end for querying traffic stats e.g. "03/31/2016 24:00"')
    .option("-t, --time_unit <time_unit>", 'Time unit for traffic stats. Default week.', /^(second|minute|hour|day|week)$/i, 'week')
    .parse(process.argv);

extract_traffic(program);

function extract_traffic(options) {
  request( env_options( options ) )
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
      })
      .catch( function(err) {
        console.log( err.stack );
        throw err;
      })
}

function env_options( options ) {
  var default_options = get_base_options( options );
  debug('retrieving base options', default_options);
  default_options.uri = urljoin( default_options.uri, '/environments/' );
  return default_options;
}

function stats_options(options ) {
  debug('timeunit', options.time_unit);
  var default_options = get_base_options( options );
  default_options.uri = urljoin( default_options.uri, '/environments/', '/test/', '/stats/' );
  debug('stats_options uri', default_options.uri);
  default_options.qs = {
    'select': 'sum(message_count)',
    'timeRange': (options.time_range_start || dateFormat( get_day_of_month( true ), 'mm/dd/yyyy HH:MM' ) )
        .concat('~').concat(options.time_range_end || dateFormat( get_day_of_month( false ), 'mm/dd/yyyy HH:MM' )),
    'timeUnit': options.time_unit || 'week'
  };
  return default_options;
}

function get_base_options( options ) {
  var default_base_options = {
    uri: urljoin( options.apigee_mgmt_api_uri || process.env.apigee_mgmt_api_uri, 'organizations',
        options.apigee_mgmt_api_org || process.env.apigee_mgmt_api_org ), /*'environments',
        options.apigee_mgmt_api_env || process.env.apigee_mgmt_api_env ),*/
    headers: {
      'Authorization': "Basic " + new Buffer( ( options.apigee_mgmt_api_email || process.env.apigee_mgmt_api_email ) + ":"
          + ( options.apigee_mgmt_api_password || process.env.apigee_mgmt_api_password )).toString("base64")
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