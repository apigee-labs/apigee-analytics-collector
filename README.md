# apigee-analytics-forwarder
This is a tool for forwarding analytics data from Edge to Apigee Analytics. It leverages Edge Management API to retrieve data from Cloud or On-Prem orgs and forwards it to Apigee Analytics.

#### <a name="installation"></a>Installation
`apigee-analytics-forwarder` is a Node.js module and you can install it using npm:

##### Requirements
NPM 2.x or greater and Node.js 4.x.

##### Directly From Repo
```javascript
$ git clone https://github.com/apigee/apigee-analytics-forwarder.git
$ cd apigee-analytics-forwarder
$ sudo npm install -g
```
##### From NPM
This method is available once the team finishes testing.

`npm install -g apigee-analytics-cli`

*NOTE*: The `-g` option places the apigee-analytics-cli command in your PATH. On "\*nix"-based machines, `sudo` may be required with the `-g` option. If you do not use `-g`, then you need to add the apigee-analytics-cli command to your PATH manually. Typically, the `-g` option places modules in: `/usr/local/lib/node_modules/apigee-analytics-cli` on *nix-based machines.

#### Parameters

```bash
$ apigee-analytics-forwarder export traffic --help

  Usage: apigee-analytics-forwarder-export-traffic [options]

  Export data from the management API

  Options:

    -h, --help                                                     output usage information
    -D, --dimension <dimension>                                    The traffic dimension to collect. Valid dimensions: apiproducts, developer, apps, apiproxy(default)
    -d, --days <days>                                              The number of days to collect in retrograde. 3 by default
    -w, --window <window>                                          The number days to collect per request.  For example, you can collect a month of traffic one day at a time, 3 days at a time or 'N' days at a time.  Using this results in shorter-lived AX requests and can be used to reduce timeouts from AX API. 3 by default
    -m, --apigee_mgmt_api_uri <apigee_mgmt_api_uri>                URL to management API
    -u, --apigee_mgmt_api_email <apigee_mgmt_api_email>            Email registered on the Management API. See .env file to setup default value
    -p, --apigee_mgmt_api_password <apigee_mgmt_api_password>      Password associated to the management api email account
    -i, --include_orgs <items>                                     Include orgs from this list
    -x, --exclude_orgs <items>                                     Exclude orgs from this list
    -n, --include_envs <items>                                     Include environments from this list
    -e, --exclude_envs <items>                                     Exclude envs from this list
    -o, --output <path>                                            Path and filename to save output
    -s, --time_range_start <time_range_start>                      Time range start for querying traffic stats e.g. "03/01/2016 00:00"
    -e, --time_range_end <time_range_end>                          Time range end for querying traffic stats e.g. "04/01/2016 24:00"
    -t, --time_unit <time_unit>                                    Time unit for traffic stats. Default week. Default units by hour. Valid time units: second, minute, hour, day, week
    -U, --apigee_analytics_api_url <apigee_analytics_api_url>      apigee analytics URL to submit the traffic output. Send a request to 360@apigee.com to request credentials.
    -S, --standard_output                                          output through the terminal (stdout).
    -c, --apigee_analytics_client_id <apigee_analytics_client_id>  cliend_id used to authenticate against apigee analytics api
    -r, --apigee_analytics_secret <apigee_analytics_secret>        secret used to authenticate againts apigee analytics api
    -R, --include_curl_commands                                    include sample cURL commands for debugging
    -v, --verbose                                                  make the operation more talkative
```

#### Getting started

For instance, here's the command to retrieve traffic data and standard output print from `abcde` org for the last three days:
```bash
$ apigee-analytics-forwarder export traffic --include_orgs abcde -p $ae_password --apigee_mgmt_api_uri https://api.enterprise.apigee.com/v1 --apigee_mgmt_api_email $ae_username \
--apigee_analytics_api_url https://nucleus-api-test.apigee.com/v1/apigee-analytics-cli-api/traffic/orgs --apigee_analytics_client_id $apigee_analytics_client_id \
--apigee_analytics_secret $apigee_analytics_secret -S
```

##### Let's forward data
To forward data to Apigee remove `-S` or `--standard_output` flag.
```bash
$ apigee-analytics-forwarder export traffic --include_orgs abcde -p $ae_password --apigee_mgmt_api_uri https://api.enterprise.apigee.com/v1 --apigee_mgmt_api_email $ae_username \
--apigee_analytics_api_url https://nucleus-api-test.apigee.com/v1/apigee-analytics-cli-api/traffic/orgs --apigee_analytics_client_id $apigee_analytics_client_id \
--apigee_analytics_secret $apigee_analytics_secret
[
  {
    "org": "nucleus",
    "env": "prod",
    "time_range_start": "04/18/2016 00:00",
    "time_range_end": "04/21/2016 00:00",
    "response": [
      {
        "store_org_env_metrics_hourly_v4": 216
      }
    ]
  }
]
```

You're done. Check other arguments to customize your workflow. And please be mindful of providing large time ranges and windows, by default it is set to 3 full days, which is more than enough to catch up if apigee-analytics-forwarder stopped running for a few hours.

#### Environment variables
Environment variables can be set via arguments or ```.env``` file located in the same folder:

```bash
apigee_mgmt_api_uri=https://api.enterprise.apigee.com/v1
apigee_mgmt_api_email=sample@apigee.com
apigee_mgmt_api_password=MyPasswordHere
apigee_analytics_api_url=https://nucleus-api-test.apigee.com/v1/apigee-analytics-cli-api/traffic/orgs
apigee_analytics_client_id={client_id_email_360@apigee.com}
apigee_analytics_secret=myScr3tHe4e
```

#### Scheduling

It is highly recommended to leverage a job scheduler to execute this job once on a daily basis. Cron and Windows Task Scheduler respectively for *nix and Windows systems are suggested.

#### TODO

 - [ ] Support CLI Replay capabilities from saved files.

### References

#### API

In order to forward traffic to Apigee, this CLI tool requires access to [Apigee-Analytics-Forwarder-API](https://gitlab.apigee.com/nucleus/apigee-analytics-cli-api).

#### Support

- [Apigee Community](http://community.apigee.com)
- [Open a Github issue](https://github.com/apigee/apigee-analytics-forwarder/issues)

#### License

Apache 2.0 ©