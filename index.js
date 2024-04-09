#!/usr/bin/env node

import yargs from "yargs";
import { readFile, writeFile } from 'node:fs';
import { PatchRawTaskDef } from "./src/ecs/patcher.js";
import { PatchRawDeployment } from "./src/eks/patcher.js";

const options = yargs.usage("Usage: -a <api key> -e '[<entry point>]'")
    .option("a", { alias: "apiKey", describe: "API key", type: "string", demandOption: false })
    .option("s", { alias: "site", describe: "site", type: "string", demandOption: false, default: "datadoghq.com" })
    .option("i", { alias: "input", describe: "input file", type: "string", demandOption: false })
    .option("o", { alias: "ouput", describe: "output file", type: "string", demandOption: false })
    .option("v", { alias: "verbose", describe: "verbose mode", type: "boolean", demandOption: false })
    .option("n", { alias: "service", describe: "service name", type: "string", demandOption: false })
    .option("p", { alias: "containers", describe: "container names to patch", type: "string", array: true, demandOption: false })
    .option("e", { alias: "entryPoint", describe: "entry point argument", type: "string", demandOption: false, default: "/init.sh" })
    .option("d", { alias: "agentImage", describe: "datadog agent image", type: "string", demandOption: false, default: "datadog/agent:latest" })
    .option("c", { alias: "cwsInstImage", describe: "cws-instrumentation image", type: "string", demandOption: false, default: "datadog/cws-instrumentation:latest" })
    .option("k", { alias: "eks", describe: "eks deployment mode", type: "bool", demandOption: false })
    .wrap(yargs.terminalWidth())
    .argv;

let pathOrStdin = options.input ? options.input : 0;

readFile(pathOrStdin, 'utf8', (err, rawData) => {
    if (err) {
        console.error(err);
        return;
    }

    let entryPoint = JSON.parse(options.entryPoint);

    let output = "";

    if (options.eks) {
        output = PatchRawDeployment(rawData,
            options.apiKey,
            options.site,
            options.service,
            entryPoint,
            options.ddAgentImage,
            options.ddCwsInstImage,
            options.containers,
            options.verbose
        );
    } else {
        output = PatchRawTaskDef(rawData,
            options.apiKey,
            options.site,
            options.service,
            entryPoint,
            options.ddAgentImage,
            options.ddCwsInstImage,
            options.containers,
            options.verbose
        );
    }

    if (!options.output) {
        console.log(output);
    } else {
        writeFile(options.output, output, err => {
            if (err) {
                console.error(err);
            }
        });
    }
});