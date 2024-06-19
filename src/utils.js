
// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2016-present Datadog, Inc.

import { execSync } from 'node:child_process';

export function AddEnv(envs, name, value) {
    let present = false;
    for (let env of envs) {
        if (env.name === name) {
            env.value = "true";
            present = true;
            break;
        }
    }
    if (!present) {
        envs.push({
            "name": name,
            "value": "true"
        });
    }
}

export function EnableCWS(envs) {
    AddEnv(envs, "DD_RUNTIME_SECURITY_CONFIG_ENABLED", "true");
    AddEnv(envs, "DD_RUNTIME_SECURITY_CONFIG_EBPFLESS_ENABLED", "true");
}

export function RetrieveEntrypoint(image, verbose = false) {
    if (verbose) {
        console.log("🛜 retrieve entry point from docker image");
    }

    execSync(`docker pull ${image}`, (err) => {
        if (err) {
            console.error("could not execute command: ", err)
            return
        }
    })

    let output = execSync(`docker inspect ${image} -f '{{json .Config.Entrypoint}}'`).toString();
    return JSON.parse(output);
}
