# cws-fargate-td-patcher

This tool can be used to patch existing task definition in order to integrate the Datadog Agent as a side car and to apply the CWS instrumentation to the application.

## Build docker image

```
docker build . -t datadog/cws-fargate-td-patcher:latest
```

## Usage

```
docker run -i datadog/cws-fargate-td-patcher:latest \
cws-fargate-td-patcher --help
```

## Patch example

```
cat nginx-task-def.json | docker run -i datadog/cws-fargate-td-patcher:latest \
cws-fargate-td-patcher -k <API-KEY> -s datadoghq.com -e /docker-entrypoint.sh -n nginx
```
