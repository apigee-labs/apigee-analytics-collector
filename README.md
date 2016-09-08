# apigee-analytics-collector
This is a commandline utility to send the API call volume report back to Apigee. Any Edge Private Cloud installation could use this utility. `apigee-analytics-collector` internally leverages Edge Management APIs to retrieve and report data to Apigee.

<a href="http://www.youtube.com/watch?feature=player_embedded&v=wPV15S5azZs
" target="_blank"><img src="http://img.youtube.com/vi/wPV15S5azZs/0.jpg" 
alt="Apigee Analytics Collector Screencast" width="480" height="360" border="10" /></a>

## <a name="installation"></a>Installation
`apigee-analytics-collector` is a Node.js module and you can install it using npm.

## Requirements
npm 2.x or greater and Node.js 4.x.

**The following information is required to forward traffic data to Apigee:**

1. **apigee_mgmt_api_uri** This can be obtained from your Apigee Administrator e.g. `https://{hostname}/v1`
2. **apigee_mgmt_api_email** This account requires access to open `/stats api` 
3. **apigee_mgmt_api_password**
4. **apigee_analytics_client_id** please submit a ticket with Apigee Support to obtain apigee_analytics_client_id and apigee_analytics_secret
5. **apigee_analytics_secret**

## Installation using npm

```bash
npm install apigee-analytics-collector -g
```

*NOTE*: The `-g` option places the apigee-analytics-collector command in your PATH. On "\*nix"-based machines, `sudo` may be required with the `-g` option. If you do not use `-g`, then you need to add the apigee-analytics-cli command to your PATH manually. Typically, the `-g` option places modules in: `/usr/local/lib/node_modules/apigee-analytics-cli` on *nix-based machines.

## Parameters

```bash
$ apigee-analytics-collector export traffic --help

  Usage: apigee-analytics-collector-export-traffic [options]

  Export data from the management API

  Options:

    -h, --help                                                     output usage information
    -D, --dimension <dimension>                                    The traffic dimension to collect. Valid dimensions: apiproducts, devs, apps, apiproxy(default)
    -d, --days <days>                                              The number of days to collect in retrograde. 3 by default
    -m, --apigee_mgmt_api_uri <apigee_mgmt_api_uri>                URL to management API
    -u, --apigee_mgmt_api_email <apigee_mgmt_api_email>            Email registered on the Management API. See .env file to setup default value
    -p, --apigee_mgmt_api_password <apigee_mgmt_api_password>      Password associated to the management api email account
    -i, --include_orgs <items>                                     Include orgs from this list (comma separated) 
    -x, --exclude_orgs <items>                                     Exclude orgs from this list (comma separated)
    -n, --include_envs <items>                                     Include environments from this list (comma separated) 
    -e, --exclude_envs <items>                                     Exclude envs from this list (comma separated)
    -o, --output <path>                                            Path and filename to save output
    -s, --time_range_start <time_range_start>                      Time range start for querying traffic stats e.g. "03/01/2016 00:00"
    -z, --time_range_end <time_range_end>                          Time range end for querying traffic stats e.g. "04/01/2016 24:00"
    -t, --time_unit <time_unit>                                    Time unit for traffic stats. Default week. Default units by hour. Valid time units: second, minute, hour, day, week
    -U, --apigee_analytics_api_url <apigee_analytics_api_url>      apigee analytics URL to submit the traffic output. Send a request to 360@apigee.com to request credentials.
    -S, --standard_output                                          output through the terminal (stdout).
    -c, --apigee_analytics_client_id <apigee_analytics_client_id>  cliend_id used to authenticate against apigee analytics api
    -r, --apigee_analytics_secret <apigee_analytics_secret>        secret used to authenticate againts apigee analytics api
    -R, --include_curl_commands                                    include sample cURL commands for debugging
    -v, --verbose                                                  make the operation more talkative
```

## Getting started

For instance, here's the command to retrieve traffic data and standard output print from `abcde` org for the last three days:
```bash
$ apigee-analytics-collector export traffic --include_orgs abcde -p $ae_password --apigee_mgmt_api_uri https://api.enterprise.apigee.com/v1 --apigee_mgmt_api_email $ae_username \
--apigee_analytics_client_id $apigee_analytics_client_id --apigee_analytics_secret $apigee_analytics_secret -S
```

Up to this point, because apigee-analytics-collector was run with `-S` flag, so no data has been forwarded to Apigee, what you actually see in the output of the data that is about to be transmitted to Apigee when the collector runs without `-S` flag. Therefore, please ensure to remove `-S` flag to forward data. Also, note no sensitive data is transmitted throughout this process.

## Report Usage
To report the usage to Apigee, run the collector without the `-S` or `--standard_output` flags. A successful data transmission will result in a payload like one below:

```bash
$ apigee-analytics-collector export traffic --include_orgs abcde -p $ae_password --apigee_mgmt_api_uri https://api.enterprise.apigee.com/v1 --apigee_mgmt_api_email $ae_username \
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

You're done. Check other arguments to customize your workflow. And please be mindful of providing large time ranges and windows, by default it is set to 3 full days, which is more than enough to catch up if apigee-analytics-collector stopped running for a few hours.

## Scheduling

It is highly recommended to leverage a job scheduler to execute this job once on a daily basis. Cron and Windows Task Scheduler respectively for *nix and Windows systems are suggested.

## Debug or Verbose mode
This tool comes enabled with debug module. This is particularly useful to troubleshoot or review what the tool does behind scenes. 

To enable debug/verbose mode prefix the command with `-v` like the command below:

```bash
$ apigee-analytics-collector export traffic --include_orgs abcde -p $ae_password --apigee_mgmt_api_uri https://api.enterprise.apigee.com/v1 --apigee_mgmt_api_email $ae_username \
--apigee_analytics_client_id $apigee_analytics_client_id --apigee_analytics_secret $apigee_analytics_secret -v
```

## Sample Report
Here is a snippet of the report sent to Apigee with this tool. In this sample, data from one org (amer-demo29), two environments (test and prod), hourly for time_range_start and time_range_end, and the number of API requests.


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

## FAQ
**When does this utility send data to Apigee?**
The Apigee Analytics Collector is a command line utility to generate and report API usage. Private Cloud customers decide when they want to run this utility. The whole process could be automated by scheduling a cron-job that periodically report the information back to Apigee. It’s recommended to run this job at least once a day.

**Can I affect the data transmission schedule?**
Yes. You can schedule a job or manually execute the command to report the usage information. 

**If the data transmission is interrupted, does it retry?**
No. There is no retry mechanism built into the utility. If the utility fails to transmit the data, you will notice an error.

**Is there a dead-letter queue?**
No.

**Where should this utility be executed? from where is the data sent?  Which Edge node?**
Customers can run the utility from any server that has access to Edge components. They can also install & run this utility from any Edge node, preferably the Management Server.  Executing this utility does not impact the run time traffic. However it queries the Analytics component using Edge management APIs.  Hence it’s recommended to run during non-peak hours. Also note, this utility requires the Internet access to report the data back to Apigee.

**What ports does it use?  What outbound firewall settings do we need to change?**
This utility makes use of the management APIs to collect usage information from an Edge environment. Usually these ports are configured during Edge installation. This utility requires the Internet access to report the data back to Apigee.  For forwarding analytics back to Apigee, it uses port 443.

**Does this tool securely transmit usage report back to Apigee?**
Yes. This utility uses HTTPs to transmit the usage information back to Apigee. HTTPs offers transport layer security.

**What is the volume of data buffered and sent?  Is the data wiped out after transmission?**
This utility does not store any data by default. If you use the `-S` option in CLI, then the information is printed on the console. 

**What if my Edge environment does have access to Internet? How does this utility help?**
This utility uses Apigee management APIs to report usage information. If your Edge installation can’t be reached from outside or does not have access to internet, use Apigee Management APIs to pull the analytics from your Edge installation. Then use Apigee Analytics Collector APIs to report the usage to Apigee. Read `What if the Mgmt. API server doesn't have access to the outside world to forward data?` for details.

**How do you distinguish between production and non-prod nodes?**
This utility captures the environment details as part of the reporting. Customers will specify the Orgs and Environments from which the data has to be collected. This is configured as part of the CLI command.

**Will I need to set this up on an all-in-one install?**
No. You can run this utility from any server (or your PC) that has access to internet. As a prerequisite you need to have node.js installed.

**Does it use node.js? What version?  Which npm modules?  Where can I find the list of prerequisites?**
Yes. NPM 2.x or greater and Node.js 4.x.   

**What if I don't want to use this script to send this data? How can I disable it?  Will it affect other systems?**
You are not obligated to use this tool. You could use the management APIs directly, generate the usage report by yourself and invoke Apigee Collector API in the cloud to transmit the data yourself. This tool is built to ease that effort. If you still wish do it yourself, please check the README section on the Github for details.

**Is data transmission going to be contractually required?  If so, how am I supposed to set this up in my air gapped environment.**
Yes. You are required to report the usage information. But you are not obligated to use this tool. If you like to use this tool, but have specific requirements, questions or concerns we will be happy to schedule a call to discuss them.
 
**What benefits do I get by using this utility?**
This utility is built to help Customers who are required to share the API usage report to Apigee as per contractual agreements. 

**Where should I report bugs/errors that I find this utility?**
Please raise a Support ticket with [Apigee](http://apigee.com/about/support/portal)

**Who supports this utility?**
If you run into issues or need help, please raise a support ticket.

**What is the performance impact of running this tool?**
This is a very lightweight utility that introduces a minimum CPU & memory load on the server. However it’s advised to execute this utility during non-peak hours. You can also schedule to a job to execute this utility on a daily basis. This reduces the query execution time.

**What happens if scheduled job fails?**
If the scheduled job fails, you will see an error. There is no retry built into this utility. Hence the usage information is not reported to Apigee. You need to fix the scheduler and run again.

**Do we need to run this utility in DMZ ?**
No. You could run this tool directly on the Edge management server. 
	
**I don’t want to invest in extra hardware. Can I run this tool in any of the apigee nodes?**
No, you don’t have to. This is a lightweight node.js based utility that either can be run from your laptop or PC or from an Edge node (like Management Server). 

**Does this tool collect any sensitive information?**
No. We deeply care about our customer’s data. This utility only reports basic details such as org name, environment name, API proxy name and the API usage information back to Apigee. The README document also has sample data being captured by this tool.

**Does it collect both production and nonproduction traffic?**
Apigee customers have complete control over this. The CLI (Command Line Interface) gives an option to include or/and exclude specific Edge Organizations and environments for reporting purposes.

**Is there an option not to report usage information of specific API proxies?**
No. At this time, the utility reports usage information of all API proxies within the selected Org and Environment. 

**What if the Mgmt. API server doesn't have access to the outside world to forward data?**
There are a few options here:
- **Use another box that has access to the external world and the private cloud Mgmt. API** Given that apigee-analytics-collector talks to the Mgmt. API, the tool can retrieve analytics data from any box with access to mgmt. api and forward it to Apigee.
- **Send data directly through apigee-analytics-collector API** The `apigee-analytics-collector` tool was designed to automate the work of extracting and posting the data to Apigee. However, analytics data from Edge can be exported by sending it to the API directly. Here's a cURL example to accomplish this:

```bash
$ curl https://nucleus-api-prod.apigee.com/v1/apigee-analytics-cli-api/traffic/orgs/{org_name}/apis -v -X POST -H 'Content-Type:application/json' -u {apigee_analytics_client_id}:{apigee_analytics_secret} -d '{"environments":[{"dimensions":[{"metrics":[{"name":"sum(message_count)","values":[{"timestamp":1458943200000,"value":"3.0"},{"timestamp":1458939600000,"value":"7.0"},{"timestamp":1458936000000,"value":"4.0"},{"timestamp":1458932400000,"value":"5.0"}]}],"name":"forecastweather-grunt-plugin-api"},{"metrics":[{"name":"sum(message_count)","values":[{"timestamp":1458943200000,"value":"0.0"},{"timestamp":1458939600000,"value":"0.0"},{"timestamp":1458936000000,"value":"0.0"},{"timestamp":1458932400000,"value":"0.0"}]}],"name":"weather-swagger-tools"},{"metrics":[{"name":"sum(message_count)","values":[{"timestamp":1458943200000,"value":"0.0"},{"timestamp":1458939600000,"value":"0.0"},{"timestamp":1458936000000,"value":"0.0"},{"timestamp":1458932400000,"value":"0.0"}]}],"name":"api-proxy-nodejs-basic-auth"}],"name":"test"}],"metaData":{"errors":[],"notices":["query served by:ff0ec974-421b-4801-9074-4f9d1ca81fe2","Table used: testmyapi.test.agg_api","source pg:b9c4765e-60d6-4455-9265-5ce1e2e5f13c"]}}'
```

**Note that payload above submitted is the same as the data extracted from Apigee Analytics Management API. For more information on this, check [Apigee Documentation](http://docs.apigee.com/management/apis/get/organizations/%7Borg_name%7D/environments/%7Benv_name%7D/stats/%7Bdimension_name%7D-0).**

Here's a sample of a cURL api request to the stats API:
```bash
curl -X GET -u {apigee_mgmt_api_email}:{apigee_mgmt_api_password} https://api.enterprise.apigee.com/v1/organizations/{org_name}/environments/{env}/stats/apiproxy?select=sum%28message_count%29&timeRange=06%2F06%2F2016%2000%3A00~06%2F09%2F2016%2000%3A00&timeUnit=hour&limit=14400&offset=0
```
***Note that if records exceed 14400 records, bumping up offset will be required.***

## Support
- [Apigee Community](http://community.apigee.com)
- [Apigee Support](http://apigee.com/about/support/portal)

## License
Apache 2.0 Apigee Corporation
