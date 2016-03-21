# apigee-nucleus-cli
Apigee Nucleus CLI is multipurpose Command-Line Tool leveraged by Nucleus team to export, import or transfer data from Edge Management API to Nucleus.

| Gitlabs Repo   | https://gitlab.apigee.com/nucleus/apigee-nucleus-cli/tree/master  |
| -------------- |:-----------------------------------------------------------------:|  

#### Parameters

```bash
$ apigee-nucleus-cli export traffic --help

  Usage: apigee-nucleus-cli-export-traffic [options]

  Export data from the management API

  Options:

    -h, --help                 output usage information
    -m, --mgmt_uri [mgmt_uri]  URL to management API
    -e, --email                Email registered on the Management API
    -p, --password             Password associated to the email account
    -o, --output <path>        Path and filename to save output

```


### Export Traffic Data

```bash
$ apigee-nucleus-cli export traffic                                                                                                                 
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
 
![apigee-nucleus-cli-export-traffic-flow](https://gitlab.apigee.com/nucleus/apigee-nucleus-cli/raw/master/images/apigee-nucleus-cli-export-traffic-flow.png)