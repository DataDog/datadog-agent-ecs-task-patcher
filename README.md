# datadog-agent-ecs-task-patcher

> **Warning**: This tool is not production-ready. Carefully review the generated output.

The `datadog-agent-ecs-task-patcher` is a tool that patches existing task definitions to integrate the Datadog Agent as a sidecar and apply Cloud Workload Security (CWS) instrumentation to your application.

## Build the Docker image

To build the Docker image, run:

```
docker build . -t datadog/datadog-agent-ecs-task-patcher:latest
```

## Usage

To use `datadog-agent-ecs-task-patcher`, run:

```
docker run -i datadog/datadog-agent-ecs-task-patcher:latest datadog-agent-ecs-task-patcher [OPTIONS]
```

### Options

| Option | Default | Description |
| --- | --- | --- |
| `--help` | | Show help |
| `--version` | | Show version number |
| `-a`, `--apiKey` | | **(Required)** Datadog API key |
| `-s`, `--site` | `datadoghq.com` | Datadog site |
| `-i`, `--input` | | Path to the input file |
| `-o`, `--output` | | Path to the output file |
| `-v`, `--verbose` | | Enable verbose mode |
| `-n`, `--service` | | Service name |
| `-p`, `--containers` | | Container names to patch |
| `-e`, `--entryPoint` | `/init.sh` | Entry point arguments |
| `-d`, `--agentImage` | `public.ecr.aws/datadog/agent:latest` | Datadog Agent image |
| `-c`, `--cwsInstImage` | `public.ecr.aws/datadog/cws-instrumentation:latest` | CWS instrumentation image |
| `-k`, `--eks` | | Enable EKS deployment mode |

## How it works

The `datadog-agent-ecs-task-patcher` makes the following modifications to the task definition or deployment:

1. Adds the Datadog Agent as a sidecar container.
2. Adds the CWS instrumentation init container.
3. Adds a volume to share the `cws-instrumentation` binary.
4. Patches the original workload container to:
    - Add the `cws-instrumentation` volume.
    - Wrap the application's entry point with the `cws-instrumentation` binary.

## Examples

### ECS with Nginx

To apply the instrumentation to all containers:

```
cat examples/nginx-ecs-td.json | docker run -i datadog/datadog-agent-ecs-task-patcher:latest datadog-agent-ecs-task-patcher -a <API-KEY> \
-e '["/docker-entrypoint.sh", "nginx", "-g", "daemon off;"]'
```

The `-e` flag specifies the workload container's original entry point.

To apply the instrumentation to a specific container:

 ```
 cat examples/nginx-ecs-td.json | docker run -i datadog/datadog-agent-ecs-task-patcher:latest datadog-agent-ecs-task-patcher -a <API-KEY> -p nginx \
-e '["/docker-entrypoint.sh", "nginx", "-g", "daemon off;"]'
 ```

 ### EKS deployment with Nginx

> **Warning**: Use the following [Agent RBAC deployment instruction](https://docs.datadoghq.com/integrations/eks_fargate/?tab=manual#aws-eks-fargate-rbac) before deploying the Agent as a sidecar.

To apply the instrumentation to all containers:

 ```
 cat examples/nginx-eks.yaml | docker run -i datadog/datadog-agent-ecs-task-patcher:latest datadog-agent-ecs-task-patcher -k -a <API-KEY> \
-e '["/docker-entrypoint.sh", "nginx", "-g", "daemon off;"]'
 ```
