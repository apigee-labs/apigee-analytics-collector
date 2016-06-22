# apigee-analytics-forwarder
This is a tool for forwarding analytics data from Edge to Apigee Analytics. It leverages Edge Management API to retrieve data from Cloud or On-Prem orgs and forwards it to Apigee Analytics.

#### <a name="installation"></a>Installation
`apigee-analytics-forwarder` is a Node.js module and you can install it using npm:

##### Requirements
NPM 2.x or greater and Node.js 4.x.

**The following information is required to forward traffic data to Apigee:**

1. **apigee_mgmt_api_uri** This can be obtained from your Apigee Administrator e.g. `https://{hostname}/v1`
2. **apigee_mgmt_api_email** This account requires access to open `/stats api` 
3. **apigee_mgmt_api_password**
4. **apigee_analytics_client_id** please submit a ticket with Apigee Support to obtain apigee_analytics_client_id and apigee_analytics_secret
5. **apigee_analytics_secret**

##### Installation using NPM
Unzip `apigee-analytics-forwarder_*.zip` file, cd into the folder where it was expanded and install with NPM:
```bash
cd apigee-analytics-forwarder
npm install -g
```

*NOTE*: The `-g` option places the apigee-analytics-forwarder command in your PATH. On "\*nix"-based machines, `sudo` may be required with the `-g` option. If you do not use `-g`, then you need to add the apigee-analytics-cli command to your PATH manually. Typically, the `-g` option places modules in: `/usr/local/lib/node_modules/apigee-analytics-cli` on *nix-based machines.

#### Parameters

```bash
$ apigee-analytics-forwarder export traffic --help

  Usage: apigee-analytics-forwarder-export-traffic [options]

  Export data from the management API

  Options:

    -h, --help                                                     output usage information
    -D, --dimension <dimension>                                    The traffic dimension to collect. Valid dimensions: apiproducts, developer, apps, apiproxy(default)
    -d, --days <days>                                              The number of days to collect in retrograde. 3 by default
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
--apigee_analytics_client_id $apigee_analytics_client_id --apigee_analytics_secret $apigee_analytics_secret -S
```

Up to this point, because apigee-analytics-forwarder was run with `-S` flag, so no data has been forwarded to Apigee, what you actually see in the output of the data that is about to be transmitted to Apigee when the forwarder runs without `-S` flag. Therefore, please ensure to remove `-S` flag to forward data. Also, note no sensitive data is transmitted throughout this process.

##### Now, let's forward some data
To forward data to Apigee run the forwarder without the `-S` or `--standard_output` flags. A successful data transmission will result in a payload like one below:

```bash
$ apigee-analytics-forwarder export traffic --include_orgs abcde -p $ae_password --apigee_mgmt_api_uri https://api.enterprise.apigee.com/v1 --apigee_mgmt_api_email $ae_username \
--apigee_analytics_client_id $apigee_analytics_client_id --apigee_analytics_secret $apigee_analytics_secret
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

#### Scheduling

It is highly recommended to leverage a job scheduler to execute this job once on a daily basis. Cron and Windows Task Scheduler respectively for *nix and Windows systems are suggested.

#### TODO

 - [ ] Support CLI Replay capabilities from saved files.

### References

##### Debug or verbose mode
This tool comes enabled with debug module. This is particularly useful to troubleshoot or review what the tool does behind scenes. 

To enable debug/verbose mode prefix the command with `-v` like the command below:

```bash
$ apigee-analytics-forwarder export traffic --include_orgs abcde -p $ae_password --apigee_mgmt_api_uri https://api.enterprise.apigee.com/v1 --apigee_mgmt_api_email $ae_username \
--apigee_analytics_client_id $apigee_analytics_client_id --apigee_analytics_secret $apigee_analytics_secret -v
```


##### Install From Repo - Deprecated (no longer publicly available)
```bash
$ git clone https://github.com/apigee/apigee-analytics-forwarder.git
$ cd apigee-analytics-forwarder
$ sudo npm install -g
```
**NOTE**: To update to the latest release, execute `git pull` followed by `sudo npm uninstall -g` and `sudo npm install -g`. 

#### Sample data sent to Apigee
This is a sample snippet of data sent extracted by this tool. In this sample, data from one org (amer-demo29), two environments (test and prod), hourly for time_range_start and time_range_end, and the number of API requests.

**Note that there's no sensitive data along with it.**
```javascript
{
  "entities": [
    {
      "org": "amer-demo29",
      "env": "test",
      "time_range_start": "05/29/2016 00:00",
      "time_range_end": "06/01/2016 00:00",
      "traffic": {
        "environments": [
          {
            "dimensions": [
              {
                "metrics": [
                  {
                    "name": "message_count",
                    "values": [
                      {
                        "timestamp": 1464721200000,
                        "value": "1.0"
                      },
                      {
                        "timestamp": 1464717600000,
                        "value": "1.0"
                      }
                    ]
                  }
                ],
                "name": "oidc-authentication"
              }
            ],
            "name": "test"
          }
        ],
        "metaData": {
          "errors": [],
          "notices": [
            "Table used: amer-demo29.test.agg_api",
            "query served by:d62441a4-0951-4b90-abd3-318e86c23cf6",
            "source pg:ruapdb01r.us-ea.4.apigee.com"
          ]
        }
      }
    },
    {
      "org": "amer-demo29",
      "env": "prod",
      "time_range_start": "05/29/2016 00:00",
      "time_range_end": "06/01/2016 00:00",
      "traffic": {
        "environments": [
          {
            "metrics": [],
            "name": "prod"
          }
        ],
        "metaData": {
          "errors": [],
          "notices": [
            "Table used: amer-demo29.prod.agg_api",
            "source pg:ruapdb01r.us-ea.4.apigee.com",
            "query served by:72a4b01c-1c63-4233-997e-28c19c71e6ef"
          ]
        }
      }
    }
  ]
}
```


#### API

In order to forward traffic to Apigee, this CLI tool requires access to [Apigee-Analytics-Forwarder-API](https://gitlab.apigee.com/nucleus/apigee-analytics-cli-api).

#### FAQ
**Is any proprietary information collected?**
No. Apigee will not collect any proprietary or user identifiable data. All data is visible and can be recorded locally.

**Is the connection with Apigee secure?**
Yes. The solution will connect with Apigee via secure HTTPs service run by Apigee secured with Basic Auth.

**What type of overhead is incurred?**
There is very little processing overhead on systems and to Edge Org.

**What type of data is transmitted to Apigee?**
See sample above.

**Is there a way to submit data manually to Apigee Forwarder API?**
Absolutely. apigee-analytics-forwarder tool was designed to automate the work of extracting and posting the data to Apigee. However, analytics data from Edge can be exported by sending it to the API directly.
Here's a cURL example to accomplish this:

```bash
$ curl https://nucleus-api-prod.apigee.com/v1/apigee-analytics-cli-api/traffic/orgs/{org_name}/{apiproducts|devs|apps|apis} -v -X POST -H 'Content-Type:application/json' -u {apigee_analytics_client_id}:{apigee_analytics_secret} -d '{"environments":[{"dimensions":[{"metrics":[{"name":"sum(message_count)","values":[{"timestamp":1458943200000,"value":"3.0"},{"timestamp":1458939600000,"value":"7.0"},{"timestamp":1458936000000,"value":"4.0"},{"timestamp":1458932400000,"value":"5.0"}]}],"name":"forecastweather-grunt-plugin-api"},{"metrics":[{"name":"sum(message_count)","values":[{"timestamp":1458943200000,"value":"0.0"},{"timestamp":1458939600000,"value":"0.0"},{"timestamp":1458936000000,"value":"0.0"},{"timestamp":1458932400000,"value":"0.0"}]}],"name":"weather-swagger-tools"},{"metrics":[{"name":"sum(message_count)","values":[{"timestamp":1458943200000,"value":"0.0"},{"timestamp":1458939600000,"value":"0.0"},{"timestamp":1458936000000,"value":"0.0"},{"timestamp":1458932400000,"value":"0.0"}]}],"name":"api-proxy-nodejs-basic-auth"}],"name":"test"}],"metaData":{"errors":[],"notices":["query served by:ff0ec974-421b-4801-9074-4f9d1ca81fe2","Table used: testmyapi.test.agg_api","source pg:b9c4765e-60d6-4455-9265-5ce1e2e5f13c"]}}'
```

**Note that payload above submitted is the same as the data extracted from Apigee Analytics Management API. For more information on this, check [Apigee Documentation](http://docs.apigee.com/management/apis/get/organizations/%7Borg_name%7D/environments/%7Benv_name%7D/stats/%7Bdimension_name%7D-0).**
Here's a sample of a cURL api request to the stats API:

```bash
curl -X GET -u {apigee_mgmt_api_email}:{apigee_mgmt_api_password} https://api.enterprise.apigee.com/v1/organizations/{org_name}/environments/{env}/stats/apiproxy?select=sum%28message_count%29&timeRange=06%2F06%2F2016%2000%3A00~06%2F09%2F2016%2000%3A00&timeUnit=hour&limit=14400&offset=0```
```
**Note that if records exceed 14400 records, bumping up offset will be required.**

**What if the Mgmt. API server doesn't have access to the outside world to forward data?**
There are a few options here:
- **1. Use another box that has access to the external world and the private cloud Mgmt. API** Given that apigee-analytics-forwarder talks to the Mgmt. API, the tool can retrieve analytics data from any box with access to mgmt. api and forward it to Apigee.
- **2. Send data directly through apigee-analytics-forwarder API** Follow the answer in FAQ for the question *Is there a way to submit data manually to Apigee Forwarder API?*
- ~~3. Export analytics data as a file and replay them from a box with external access (TBD) Pending until forwarder support replaying-file capabilities. Kept here to track the need for it. Captured in TODO section. This is the least preferred way as it requires manual work by the user. The forwarding will require two steps: 1) generating the files from a box with access to the management api and save the output as a file, 2) copy files generated from step one to box with external access, and then 3) run the forwarder tool again from a machine with access to Apigee Analytics Forwarder API and consume files previously exported.~~ 

#### Support

- [Apigee Community](http://community.apigee.com)
- [Open a Github issue](https://github.com/apigee/apigee-analytics-forwarder/issues)

#### License
Apache 2.0 Apigee Corporation