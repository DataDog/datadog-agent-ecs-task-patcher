# cws-fargate-td-patcher

This tool can be used to patch existing task definition in order to integrate the Datadog Agent as a side car and to apply the CWS instrumentation to the application.

⚠️ **This tool is not production ready yet, please review carefully the generated output.**

## Build docker image

```
docker build . -t datadog/cws-fargate-td-patcher:latest
```

## How to use

### Usage

```
docker run -i datadog/cws-fargate-td-patcher:latest \
cws-fargate-td-patcher --help

Usage: -a <api key> -e '[<entry point>]'

Options:
  --help              Show help  [boolean]
  --version           Show version number  [boolean]
  -a, --apiKey        API key  [string]
  -s, --site          site  [string] [default: "datadoghq.com"]
  -i, --input         input file  [string]
  -o, --ouput         output file  [string]
  -v, --verbose       verbose mode  [boolean]
  -n, --service       service name  [string]
  -p, --containers    container names to patch  [array]
  -e, --entryPoint    entry point argument  [string] [default: "/init.sh"]
  -d, --agentImage    datadog agent image  [string] [default: "datadog/agent:latest"]
  -c, --cwsInstImage  cws-instrumentation image  [string] [default: "datadog/cws-instrumentation:latest"]
  -k, --eks           eks deployment mode
```

## How does it work

The following modification are applied to the task definition or the deployment.

1. Add the Datadog Agent Sidecar
2. Add the CWS-Instrumentation init container
3. Add a volume which is used to share the `cws-instrumentation` binary
4. Patch the original workload container to :
    1. Add the `cws-instrumentation` volume.
    2. Wrap the entry-point of the application with the `cws-instrumentation` binary.

## Examples

### ECS example

#### nginx

Apply the instrumentation on all the containers.

```
cat examples/nginx-ecs-td.json | docker run -i datadog/cws-fargate-td-patcher:latest cws-fargate-td-patcher -a <API-KEY> \
-e '["/docker-entrypoint.sh", "nginx", "-g", "daemon off;"]'
```

Note that the `-e` is used to specify the original entry-point of the workload container.

Apply the instrumentation on a specific container name.

```
 cat examples/nginx-ecs-td.json | docker run -i datadog/cws-fargate-td-patcher:latest cws-fargate-td-patcher -a <API-KEY> -p nginx \
-e '["/docker-entrypoint.sh", "nginx", "-g", "daemon off;"]'
 ```

 ### EKS Deployment example

 ### nginx

 Apply the instrumentation on all the containers.

 ```
 cat examples/nginx-eks.yaml | docker run -i datadog/cws-fargate-td-patcher:latest cws-fargate-td-patcher -k -a <API-KEY> \
-e '["/docker-entrypoint.sh", "nginx", "-g", "daemon off;"]'
 ```