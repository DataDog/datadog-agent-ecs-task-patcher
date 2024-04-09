// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2016-present Datadog, Inc.

import YAML from 'yaml'
import { RetrieveEntrypoint } from "../utils.js";

const defaultSite = 'datadoghq.com';
const defaultDDAgentImg = 'datadog/agent:latest';
const defaultCwsInstImg = 'datadog/cws-instrumentation:latest';

const datadogAgentContainerName = 'datadog-agent'
const cwsInstrumentationInitContainerName = 'cws-instrumentation-init'

function addDatadogSidecar(spec, apiKey, site, service = "", ddAgentImg = "", verbose = false) {
    if (verbose) {
        console.log("📦 add Datadog agent sidecar");
    }

    if (ddAgentImg == "") {
        ddAgentImg = defaultDDAgentImg;
    }

    let def = `{
        "image": "${ddAgentImg}",
        "name": "${datadogAgentContainerName}",
        "env": [
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
            },
            {
                "name": "DD_KUBERNETES_KUBELET_NODENAME",
                "valueFrom": {
                    "fieldRef": {
                        "apiVersion": "v1",
                        "fieldPath": "spec.nodeName"
                    }
                }
            }
        ]
    }`;

    for (let container of spec.containers) {
        if (container.name === datadogAgentContainerName) {
            // already patched or defined, stop here
            return;
        }
    }

    spec.containers.push(JSON.parse(def));
}

function addCWSInstrumentationInit(spec, cwsInstImg = "", verbose = false) {
    if (verbose) {
        console.log("🕵️ setup CWS Instrumentation");
    }

    if (!cwsInstImg) {
        cwsInstImg = defaultCwsInstImg;
    }

    let def = `{
        "name": "${cwsInstrumentationInitContainerName}",
        "image": "${cwsInstImg}",
        "command": [
            "/cws-instrumentation",
            "setup",
            "--cws-volume-mount",
            "/cws-instrumentation-volume"
        ],
        "volumeMounts": [
            {
                "name": "cws-instrumentation-volume",
                "mountPath": "/cws-instrumentation-volume",
                "readOnly": false
            }
        ],
        "securityContext": {
            "runAsUser": 0
        }
    }`;

    if (!("initContainers" in spec)) {
        spec.initContainers = [];
    }
    spec.initContainers.push(JSON.parse(def));
}

function addVolumes(spec, verbose = false) {
    if (verbose) {
        console.log("💾 prepare CWS Instrumentation volume");
    }

    let def = `{
            "name": "cws-instrumentation-volume"
        }`;

    if (!("volumes" in spec)) {
        spec.volumes = [];
    }
    spec.volumes.push(JSON.parse(def));
}

// pull the image and patch the entry point
function patchContainerEntryPoint(spec, entryPoint = [], verbose = false) {
    if (verbose) {
        console.log("🩹 patch workload entry point");
    }

    if (!('command' in spec)) {
        if (entryPoint.length == 0) {
            entryPoint = RetrieveEntrypoint(spec.image, verbose)
        }

        let def = `[
            "/cws-instrumentation-volume/cws-instrumentation",
            "trace",
            "--"
        ]`;

        spec['command'] = JSON.parse(def).concat(entryPoint);
    } else {
        let def = `[
            "/cws-instrumentation-volume/cws-instrumentation",
            "trace",
            "--"
        ]`;

        spec['command'] = JSON.parse(def).concat(spec['command'])
    }
}

// pull the image and patch the entry point
function patchContainerMounts(spec, verbose = false) {
    if (verbose) {
        console.log("💾 patch container mounts");
    }

    let def = `{
        "name": "cws-instrumentation-volume",
        "mountPath": "/cws-instrumentation-volume",
        "readOnly": true
    }`;

    if (!("volumeMounts" in spec)) {
        spec.volumeMounts = [];
    }
    spec.volumeMounts.push(JSON.parse(def));
}

export function PatchDeployment(deployment, apiKey, site, service = "", entryPoint = [], agentImg = "", cwsInstImg = "", ctnrNames = [], verbose = false) {
    if (!site) {
        site = defaultSite;
    }

    if (verbose) {
        console.log("start patching")
    }

    // add the datadog-agent sidecar
    addDatadogSidecar(deployment.spec.template.spec, apiKey, site, service, agentImg, verbose);


    // add the cws-instrumentation init container
    addCWSInstrumentationInit(deployment.spec.template.spec, cwsInstImg, verbose);

    // add cws intrumentation volume
    addVolumes(deployment.spec.template.spec, verbose);

    for (let container of deployment.spec.template.spec.containers) {
        if (container.name === datadogAgentContainerName || container.name === cwsInstrumentationInitContainerName) {
            continue;
        }

        if (ctnrNames.length > 0 && !ctnrNames.includes(container.name)) {
            continue;
        }

        patchContainerEntryPoint(container, entryPoint, verbose);
        patchContainerMounts(container, verbose);
    }

    return deployment
}

export function PatchRawDeployment(rawDeployment, apiKey, site, service, entryPoint = [], agentImg = "", cwsInstImg = "", ctnrNames = [], verbose = false) {
    let deployment;
    let json = false;

    try {
        deployment = JSON.parse(rawDeployment);
        json = true
    } catch {
        deployment = YAML.parse(rawDeployment);
    }

    let result = PatchDeployment(deployment, apiKey, site, service, entryPoint, agentImg, cwsInstImg, ctnrNames, verbose);

    if (json) {
        return JSON.stringify(result, null, 4);
    }

    return YAML.stringify(result, null, 4);
}