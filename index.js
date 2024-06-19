#!/usr/bin/env node

import yargs from "yargs";
import { readFile, writeFile } from 'node:fs';
import { PatchRawTaskDef } from "./src/ecs/patcher.js";
import { PatchRawDeployment } from "./src/eks/patcher.js";

const options = yargs.usage("Usage: -a <api key> -e '[<entry point>]'")
    .option("a", { alias: "apiKey", describe: "Datadog API key", type: "string", demandOption: false })
    .option("s", { alias: "site", describe: "Datadog site", type: "string", demandOption: false, default: "datadoghq.com" })
    .option("i", { alias: "input", describe: "Path to the input file", type: "string", demandOption: false })
    .option("o", { alias: "ouput", describe: "Path to the output file", type: "string", demandOption: false })
    .option("v", { alias: "verbose", describe: "Enable verbose mode", type: "boolean", demandOption: false })
    .option("n", { alias: "service", describe: "Service name", type: "string", demandOption: false })
    .option("p", { alias: "containers", describe: "Container names to patch", type: "string", array: true, demandOption: false })
    .option("e", { alias: "entryPoint", describe: "Entry point arguments", type: "string", demandOption: false })
    .option("d", { alias: "agentImage", describe: "Datadog Agent image", type: "string", demandOption: false, default: "public.ecr.aws/datadog/agent:latest" })
    .option("c", { alias: "cwsInstImage", describe: "CWS instrumentation image", type: "string", demandOption: false, default: "public.ecr.aws/datadog/cws-instrumentation:latest" })
    .option("k", { alias: "eks", describe: "Enable EKS deployment mode", type: "bool", demandOption: false })
    .wrap(yargs.terminalWidth())
    .argv;

let pathOrStdin = options.input ? options.input : 0;

readFile(pathOrStdin, 'utf8', (err, rawData) => {
    if (err) {
        console.error(err);
        return;
    }

    if (!options.entryPoint) {
        console.error("⚠️  entry point not provided, using default value : '/init.sh'");
        options.entryPoint = '["/init.sh"]';
    }

    let entryPoint = JSON.parse(options.entryPoint);

    let output = "";

    if (options.eks) {
        output = PatchRawDeployment(rawData,
            options.apiKey,
            options.site,
            options.service,
            entryPoint,
            options.agentImage,
            options.cwsInstImage,
            options.containers,
            options.verbose
        );
    } else {
        output = PatchRawTaskDef(rawData,
            options.apiKey,
            options.site,
            options.service,
            entryPoint,
            options.agentImage,
            options.cwsInstImage,
            options.containers,
            options.verbose
        );
    }

    if (!options.output) {
        if (options.verbose) {
            console.log("");
        }
        console.log(output);
    } else {
        writeFile(options.output, output, err => {
            if (err) {
                console.error(err);
            }
        });
    }
});