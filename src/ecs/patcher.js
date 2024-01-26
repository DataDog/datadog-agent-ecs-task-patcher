import { execSync } from 'node:child_process';

const defaultSite = 'datadoghq.com';
const defaultDDAgentImg = 'datadog/agent:latest';
const defaultCwsInstImg = 'datadog/cws-instrumentation:latest';


const datadogAgentContainerName = 'datadog-agent'
const cwsInstrumentationInitContainerName = 'cws-instrumentation-init'

function addDatadogSidecar(containersDef, apiKey, site, service = "", ddAgentImg = "", verbose = false) {
    if (verbose) {
        console.log("📦 add Datadog agent sidecar");
    }

    if (ddAgentImg == "") {
        ddAgentImg = defaultDDAgentImg;
    }

    let def = `{
        "image": "${ddAgentImg}",
        "name": "${datadogAgentContainerName}",
        "environment": [
            {
                "name": "DD_API_KEY",
                "value": "${apiKey}"
            },
            {
                "name": "DD_SITE",
                "value": "${site}"
            },
            {
                "name": "DD_EKS_FARGATE",
                "value": "true"
            },
            {
                "name": "DD_RUNTIME_SECURITY_CONFIG_ENABLED",
                "value": "true"
            },
            {
                "name": "DD_RUNTIME_SECURITY_CONFIG_EBPFLESS_ENABLED",
                "value": "true"
            },
            {
                "name": "DD_SERVICE",
                "value": "${service}"
            }
        ],
        "healthCheck": {
            "command": [
                "CMD-SHELL",
                "/probe.sh"
            ],
            "interval": 30,
            "timeout": 5,
            "retries": 2,
            "startPeriod": 60
        }
    }`;

    for (let container of containersDef) {
        if (container.name === "datadog-agent") {
            // already patched or defined, stop here
            return;
        }
    }

    containersDef.push(JSON.parse(def));
}

function addCWSInstrumentationInit(containersDef, cwsInstImg = "", verbose = false) {
    if (verbose) {
        console.log("🕵️ setup CWS Instrumentation");
    }

    if (!cwsInstImg) {
        cwsInstImg = defaultCwsInstImg;
    }

    let def = `{
        "name": "${cwsInstrumentationInitContainerName}",
        "image": "${cwsInstImg}",
        "essential": false,
        "user": "0",
        "command": [
            "/cws-instrumentation",
            "setup",
            "--cws-volume-mount",
            "/cws-instrumentation-volume"
        ],
        "mountPoints": [
            {
                "sourceVolume": "cws-instrumentation-volume",
                "containerPath": "/cws-instrumentation-volume",
                "readOnly": false
            }
        ]
    }`;

    containersDef.push(JSON.parse(def));
}

function addVolumes(taskDef, verbose = false) {
    if (verbose) {
        console.log("💾 prepare CWS Instrumentation volume");
    }

    let def = `[
        {
            "name": "cws-instrumentation-volume"
        }
    ]`

    let volumes = JSON.parse(def);

    if ('volumes' in taskDef) {
        for (let volume of volumes) {
            taskDef.volumes.push(volume);
        }
    } else {
        taskDef['volumes'] = volumes;
    }
}

function patchContainerCaps(containerDef, verbose = false) {
    if (verbose) {
        console.log("🦾 adapt workload container caps");
    }

    if (!('linuxParameters' in containerDef)) {
        containerDef['linuxParameters'] = {};
    }

    if (!('capabilities' in containerDef.linuxParameters)) {
        containerDef.linuxParameters['capabilities'] = {};
    }

    if (!('add' in containerDef.linuxParameters.capabilities)) {
        containerDef.linuxParameters.capabilities['add'] = [];
    }

    if (!('SYS_PTRACE' in containerDef.linuxParameters.capabilities.add)) {
        containerDef.linuxParameters.capabilities.add.push('SYS_PTRACE');
    }
}

function patchContainerDependsOn(containerDef, verbose = false) {
    if (verbose) {
        console.log("🔗 add depends on Datadog & CWS instrumentation");
    }

    if (!('dependsOn' in containerDef)) {
        containerDef['dependsOn'] = [];
    }

    for (let dep of containerDef.dependsOn) {
        if (datadogAgentContainerName in dep.containerName) {
            return;
        }
    }

    let def = `[
        {
            "containerName": "${datadogAgentContainerName}",
            "condition": "HEALTHY"
        },
        {
            "containerName": "${cwsInstrumentationInitContainerName}",
            "condition": "SUCCESS"
        }
    ]`;

    for (let dep of JSON.parse(def)) {
        containerDef.dependsOn.push(dep);
    }
}

function retrieveEntrypoint(containerDef, verbose = false) {
    if (verbose) {
        console.log("🛜 retrieve entry point from docker image");
    }

    let image = containerDef.image;

    execSync(`docker pull ${image}`, (err) => {
        if (err) {
            console.error("could not execute command: ", err)
            return
        }
    })

    let output = execSync(`docker inspect ${image} -f '{{json .Config.Entrypoint}}'`).toString();
    return JSON.parse(output);
}

// pull the image and patch the entry point
function patchContainerEntryPoint(containerDef, entryPoint = [], verbose = false) {
    if (verbose) {
        console.log("🩹 patch workload entry point");
    }

    if (!('entryPoint' in containerDef)) {
        if (entryPoint.length == 0) {
            entryPoint = retrieveEntrypoint(containerDef, verbose)
        }

        let def = `[
            "/cws-instrumentation-volume/cws-instrumentation",
            "trace",
            "--"
        ]`;

        containerDef['entryPoint'] = JSON.parse(def).concat(entryPoint);
    } else {
        let def = `[
            "/cws-instrumentation-volume/cws-instrumentation",
            "trace",
            "--"
        ]`;

        containerDef['entryPoint'] = JSON.parse(def).concat(containerDef['entryPoint'])
    }
}

// pull the image and patch the entry point
function patchContainerMounts(containerDef, verbose = false) {
    if (verbose) {
        console.log("💾 patch container mounts");
    }

    let def = `[
        {
            "sourceVolume": "cws-instrumentation-volume",
            "containerPath": "/cws-instrumentation-volume",
            "readOnly": true
        }
    ]`

    let mounts = JSON.parse(def);

    if ('mountPoints' in containerDef) {
        for (let mount of mounts) {
            containerDef.mountPoints.push(mount);
        }
    } else {
        containerDef['mountPoints'] = mounts;
    }
}

function cleanupTaskDef(taskDef, verbose = false) {
    if (verbose) {
        console.log("🧹 final cleanup");
    }

    delete taskDef.registeredAt;
    delete taskDef.registeredBy;
    delete taskDef.taskDefinitionArn;
    delete taskDef.compatibilities;
    delete taskDef.revision;
    delete taskDef.status;
    delete taskDef.requiresAttributes;
}

export function PatchTaskDef(taskDef, apiKey, site, service = "", entryPoint = [], agentImg = "", cwsInstImg = "", verbose = false) {
    if (!site) {
        site = defaultSite;
    }

    if (verbose) {
        console.log("start patching")
    }

    // add the datadog-agent sidecar
    addDatadogSidecar(taskDef.containerDefinitions, apiKey, site, service, agentImg, verbose);

    // add the cws-instrumentation init container
    addCWSInstrumentationInit(taskDef.containerDefinitions, cwsInstImg, verbose);

    // add cws intrumentation volume
    addVolumes(taskDef, verbose);

    for (let container of taskDef.containerDefinitions) {
        if (container.name === datadogAgentContainerName || container.name === cwsInstrumentationInitContainerName) {
            continue;
        }

        patchContainerCaps(container, verbose);
        patchContainerDependsOn(container, verbose);
        patchContainerEntryPoint(container, entryPoint, verbose);
        patchContainerMounts(container, verbose);
    }

    //cleaup
    cleanupTaskDef(taskDef, verbose);

    return taskDef
}

export function PatchRawTaskDef(rawTaskDef, apiKey, site, service, entryPoint = [], agentImg = "", cwsInstImg = "", verbose = false) {
    let taskDef = JSON.parse(rawTaskDef);
    return JSON.stringify(PatchTaskDef(taskDef, apiKey, site, service, entryPoint, agentImg, cwsInstImg, verbose), null, 4);
}