# apigee-analytics-forwarder
This is a tool for forwarding analytics data from Edge to Apigee Analytics. It leverages Edge Management API to retrieve data from Cloud or On-Prem orgs and forwards it to Apigee Analytics.

#### <a name="installation"></a>Installation

##### Private Repo
`sh
`

`apigee-analytics-cli` is a Node.js module and you can install it using npm:

`npm install -g apigee-analytics-cli`

*NOTE*: The `-g` option places the apigee-analytics-cli command in your PATH. On "\*nix"-based machines, `sudo` may be required with the `-g` option. If you do not use `-g`, then you need to add the apigee-analytics-cli command to your PATH manually. Typically, the `-g` option places modules in: `/usr/local/lib/node_modules/apigee-analytics-cli` on *nix-based machines.

#### Parameters

```bash
$ apigee-analytics-cli export traffic --help

  Usage: apigee-analytics-cli-export-traffic [options]

  Export data from the management API

  Options:

    -h, --help                                                 output usage information
    -D, --dimension <dimension>                                The traffic dimension to collect. Valid dimensions: apiproducts, developer, apps, apiproxy(default)
    -d, --days <days>                                          The number of days to collect in retrograde. 3 by default
    -w, --window <window>                                      The number days to collect per request.  For example, you can collect a month of traffic one day at a time, 3 days at a time or 'N' days at a time.  Using this results in shorter-lived AX requests and can be used to reduce timeouts from AX API. 3 by default
    -m, --apigee_mgmt_api_uri <apigee_mgmt_api_uri>            URL to management API
    -u, --apigee_mgmt_api_email <apigee_mgmt_api_email>        Email registered on the Management API. See .env file to setup default value
    -p, --apigee_mgmt_api_password <apigee_mgmt_api_password>  Password associated to the email account
    -i, --include_orgs <items>                                 Include orgs from this list
    -x, --exclude_orgs <items>                                 Exclude orgs from this list
    -n, --include_envs <items>                                 Include environments from this list
    -e, --exclude_envs <items>                                 Exclude envs from this list
    -o, --output <path>                                        Path and filename to save output
    -s, --time_range_start <time_range_start>                  Time range start for querying traffic stats e.g. "03/01/2016 00:00"
    -e, --time_range_end <time_range_end>                      Time range end for querying traffic stats e.g. "04/01/2016 24:00"
    -t, --time_unit <time_unit>                                Time unit for traffic stats. Default week. Default units by hour. Valid time units: second, minute, hour, day, week
    -U, --apigee_analytics_api_url <apigee_analytics_api_url>  apigee analytics URL to submit the traffic output. Send a request to 360@apigee.com to request credentials.
    -S, --standard_output                                      output through the terminal (stdout). Output is sent to apigee-analytics api by default
    -c, --apigee_analytics_client_id                           cliend_id used to authenticate against apigee analytics api
    -r, --apigee_analytics_secret                              secret used to authenticate againts apigee analytics api
    -R, --include_curl_commands                                include sample cURL commands for debugging
    -v, --verbose                                              make the operation more talkative

```


For instance, to generate traffic data from nucleus organization for the last three days, here's the command:
```bash
$ apigee-analytics-cli export traffic --include_orgs=nucleus -d 3 -v
```

### Export Traffic Data

```bash
$ apigee-analytics-cli export traffic
{
  "environments" : [ {
    "metrics" : [ {
      "name" : "sum(message_count)",
      "values" : [ {
        "timestamp" : 1458518400000,
        "value" : "3197.0"
      }, {
        "timestamp" : 1457913600000,
        "value" : "12511.0"
      }, {
        "timestamp" : 1457308800000,
        "value" : "114.0"
      }, {
        "timestamp" : 1456704000000,
        "value" : "14.0"
      } ]
    } ],
    "name" : "test"
  } ],
  "metaData" : {
    "errors" : [ ],
    "notices" : [ "Table used: nucleus.test.agg_api", "query served by:f40183be-bad5-415d-af89-595e8fcb1fab", "source pg:3531549e-2563-4758-86ca-2de7ee7ca761" ]
  }
}
```

The following diagram illustrates the process of exporting traffic data from Apigee Edge through the Management API:

![apigee-analytics-cli-export-traffic-flow](https://gitlab.apigee.com/nucleus/apigee-analytics-cli/raw/master/images/apigee-analytics-cli-export-traffic-flow.png)

#### Environment variables
Environment variable can be set via arguments or ```.env``` file:

```bash
apigee_mgmt_api_uri=https://api.enterprise.apigee.com/v1
apigee_mgmt_api_email=sample@apigee.com
apigee_mgmt_api_password=MyPasswordHere
apigee_analytics_api_url=https://nucleus-api-test.apigee.com/v1/apigee-analytics-cli-api/traffic/orgs
apigee_analytics_client_id={client_id_email_360@apigee.com}
apigee_analytics_secret=myScr3tHe4e
```

#### TODO
[] Support CLI Replay capabilities from saved files.

### References

#### API
In order to push traffic to Apigee, this CLI tool requires access to [Apigee-Analytics-CLI-API](https://gitlab.apigee.com/nucleus/apigee-analytics-cli-api).

This API is accessible through this URL:
```bash
curl https://nucleus-api-test.apigee.com/v1/apigee-analytics-cli-api/traffic/orgs/{org_name} -v -X POST -H 'Content-Type:application/json' -u credentials:password
```