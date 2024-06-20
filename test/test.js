import assert from "assert";
import { PatchRawTaskDef } from "../src/ecs/patcher.js";
import { PatchRawDeployment } from "../src/eks/patcher.js";
import { readFileSync } from 'node:fs';

function assertTaskDefEqual(actual, expected, entrypoint = ["/entry.sh"]) {
    try {
        let rawData = readFileSync(actual, { encoding: 'utf8', flag: 'r' })
        let output = PatchRawTaskDef(rawData, "aaa", "bbb", "ccc", entrypoint, "", "", [], false);

        rawData = readFileSync(expected, { encoding: 'utf8', flag: 'r' })
        assert.deepEqual(output, rawData);
    } catch (err) {
        assert.equal(err, null);
    }
}

function assertDeploymentEqual(actual, expected, entrypoint = ["/entry.sh"]) {
    try {
        let rawData = readFileSync(actual, { encoding: 'utf8', flag: 'r' })
        let output = PatchRawDeployment(rawData, "aaa", "bbb", "ccc", entrypoint, "", "", [], false);

        rawData = readFileSync(expected, { encoding: 'utf8', flag: 'r' })
        assert.deepEqual(output, rawData);
    } catch (err) {
        assert.equal(err, null);
    }
}

describe('ECS', function () {
    describe('without-sidecar', function () {
        it('should generate the expected output', function () {
            assertTaskDefEqual("./test/data/ecs/without-sidecar-input-1.json", "./test/data/ecs/without-sidecar-output-1.json");
        });
    });

    describe('with-sidecar', function () {
        it('should generate the expected output', function () {
            assertTaskDefEqual("./test/data/ecs/with-sidecar-input-1.json", "./test/data/ecs/with-sidecar-output-1.json");
        });
    });

    describe('dependson', function () {
        it('should generate the expected output', function () {
            assertTaskDefEqual("./test/data/ecs/dependson-input-1.json", "./test/data/ecs/dependson-output-1.json");
        });
    });

    describe('entrypoint', function () {
        this.timeout(30000);
        it('should generate the expected output', function () {
            assertTaskDefEqual("./test/data/ecs/entrypoint-input-1.json", "./test/data/ecs/entrypoint-output-1.json", []);
        });
    });
});

describe('EKS', function () {
    describe('without-sidecar', function () {
        it('should generate the expected output', function () {
            assertDeploymentEqual("./test/data/eks/without-sidecar-input-1.yaml", "./test/data/eks/without-sidecar-output-1.yaml");
        });
    });

    describe('with-sidecar', function () {
        it('should generate the expected output', function () {
            assertDeploymentEqual("./test/data/eks/with-sidecar-input-1.yaml", "./test/data/eks/with-sidecar-output-1.yaml");
        });
    });

    describe('multi-yaml', function () {
        it('should generate the expected output', function () {
            assertDeploymentEqual("./test/data/eks/multi-input-1.yaml", "./test/data/eks/multi-output-1.yaml");
        });
    });

    describe('entrypoint', function () {
        this.timeout(30000);
        it('should generate the expected output', function () {
            assertDeploymentEqual("./test/data/eks/entrypoint-input-1.yaml", "./test/data/eks/entrypoint-output-1.yaml", []);
        });
    });
});
