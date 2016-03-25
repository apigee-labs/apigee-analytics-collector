# apigee-analytics-cli
Apigee Nucleus CLI is multipurpose Command-Line Tool to export, import or transfer data from Edge Management API to Nucleus.

| Gitlabs Repo   | https://gitlab.apigee.com/nucleus/apigee-analytics-cli.git  |
| -------------- |:-----------------------------------------------------------------:|  


#### Parameters

```bash
$ apigee-analytics-cli export traffic --help

  Usage: apigee-analytics-cli-export-traffic [options]

  Export data from the management API

  Options:

    -h, --help                                                 output usage information
    -m, --apigee_mgmt_api_uri <apigee_mgmt_api_uri>            URL to management API
    -u, --apigee_mgmt_api_email <apigee_mgmt_api_email>        Email registered on the Management API
    -p, --apigee_mgmt_api_password <apigee_mgmt_api_password>  Password associated to the email account
    -i, --include_orgs <items>                                 Include orgs from this list
    -x, --exclude_orgs <items>                                 Exclude orgs from this list
    -n, --include_envs <items>                                 Include environments from this list
    -e, --exclude_envs <items>                                 Exclude envs from this list
    -o, --output <path>                                        Path to save output files
    -s, --time_range_start <time_range_start>                  Time range start for querying traffic stats e.g. "03/01/2016 00:00"
    -e, --time_range_end <time_range_end>                      Time range end for querying traffic stats e.g. "03/31/2016 24:00"
    -t, --time_unit <time_unit>                                Time unit for traffic stats. Default week.
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
Environment variable can be set via ```.env``` file with the following environment variables:

```bash
apigee_mgmt_api_uri=https://api.enterprise.apigee.com/v1
apigee_mgmt_api_email=sample@apigee.com
apigee_mgmt_api_password=MyPasswordHere
```

#### Enable Debugger
The following command enables debug entries through standard output:
```
$ DEBUG=* apigee-analytics-cli export traffic --include_orgs nucleus --include_envs=prod,test -d 5 | pbcopy
```