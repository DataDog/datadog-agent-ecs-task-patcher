# cws-fargate-td-patcher

This tool can be used to patch existing task definition in order to integrate the Datadog Agent as a side car and to apply the CWS instrumentation to the application.

## Build docker image

```
docker build . -t datadog/cws-fargate-td-patcher:latest
```

## How to use

### Usage

```
docker run -i datadog/cws-fargate-td-patcher:latest \
cws-fargate-td-patcher --help
```

####


### ECS example

#### nginx

Apply the instrumentation on all the containers.

```
cat examples/nginx-ecs-td.json | docker run -i datadog/cws-fargate-td-patcher:latest cws-fargate-td-patcher -a <API-KEY> \
-e /docker-entrypoint.sh nginx -g "daemon off;"
```

Apply the instrumentation on a specific container name.

```
 cat examples/nginx-ecs-td.json | docker run -i datadog/cws-fargate-td-patcher:latest cws-fargate-td-patcher -a <API-KEY> \
 -p nginx -e /docker-entrypoint.sh nginx -g "daemon off;"
 ```

 ### EKS example

 ### nginx

 Apply the instrumentation on all the containers.

 ```
 cat examples/nginx-eks.yaml | docker run -i datadog/cws-fargate-td-patcher:latest cws-fargate-td-patcher -k -a <API-KEY> \
-e /docker-entrypoint.sh nginx -g "daemon off;"
 ```