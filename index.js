#!/usr/bin/env node

import yargs from "yargs";
import { readFile, writeFile } from 'node:fs';
import { PatchRawTaskDef } from "./src/ecs/patcher.js";

const options = yargs.usage("Usage: -k <api key>")
    .option("k", { alias: "apiKey", describe: "API key", type: "string", demandOption: false })
    .option("s", { alias: "site", describe: "site", type: "string", demandOption: false })
    .option("i", { alias: "input", describe: "input file", type: "string", demandOption: false })
    .option("o", { alias: "ouput", describe: "output file", type: "string", demandOption: false })
    .option("v", { alias: "verbose", describe: "verbose mode", type: "boolean", demandOption: false })
    .option("n", { alias: "service", describe: "service name", type: "string", demandOption: false })
    .option("e", { alias: "entryPoint", describe: "entry point argument", type: "string", demandOption: false })
    .option("d", { alias: "ddAgentImage", describe: "datadog-agent image", type: "string", demandOption: false })
    .option("c", { alias: "ddCwsInstImage", describe: "cws-instrumentation image", type: "string", demandOption: false })
    .argv;

let pathOrStdin = options.input ? options.input : 0;

readFile(pathOrStdin, 'utf8', (err, rawTaskDef) => {
    if (err) {
        console.error(err);
        return;
    }

    let output = PatchRawTaskDef(rawTaskDef,
        options.apiKey,
        options.site,
        options.service,
        options.entryPoint,
        options.ddAgentImage,
        options.ddCwsInstImage,
        options.verbose
    );

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