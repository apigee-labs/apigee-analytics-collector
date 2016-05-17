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
npm install -g apigee-analytics-forwarder
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

Up to this point, because apigee-analytics-forwarder was run with `-S` flag, so no data has been forwarded to Apigee, what you actually see in the output of the data that is about to be transmited to Apigee when the forwarder runs without `-S` flag. Therefore, please ensure to remove `-S` flag to forward data. Also note, that no sensitive data is transmitted throughout this process.

##### Now, let's forward data
To forward data to Apigee run the forwarder `-S` or `--standard_output` flags. A successful data transmission will result in a payload like one below:

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
This tools comes enabled with debug module. This is particularly useful to troubleshoot or review what the tool does behind scenes. 

To enable debug/verbose mode prefix the command with `-v` like the command below:

```bash
$ apigee-analytics-forwarder export traffic --include_orgs abcde -p $ae_password --apigee_mgmt_api_uri https://api.enterprise.apigee.com/v1 --apigee_mgmt_api_email $ae_username \
--apigee_analytics_client_id $apigee_analytics_client_id --apigee_analytics_secret $apigee_analytics_secret -v
```


##### Install From Repo - Deprecated (no longer publicly available)
```javascript
$ git clone https://github.com/apigee/apigee-analytics-forwarder.git
$ cd apigee-analytics-forwarder
$ sudo npm install -g
```
**NOTE**: To update to the latest release, execute `git pull` followed by `sudo npm uninstall -g` and `sudo npm install -g`. 


#### API

In order to forward traffic to Apigee, this CLI tool requires access to [Apigee-Analytics-Forwarder-API](https://gitlab.apigee.com/nucleus/apigee-analytics-cli-api).

#### Support

- [Apigee Community](http://community.apigee.com)
- [Open a Github issue](https://github.com/apigee/apigee-analytics-forwarder/issues)

#### License

Apache 2.0 ©