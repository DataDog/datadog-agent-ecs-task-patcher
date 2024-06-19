import assert from "assert";
import { PatchRawTaskDef } from "../src/ecs/patcher.js";
import { PatchRawDeployment } from "../src/eks/patcher.js";
import { readFile } from 'node:fs';

function assertTaskDefEqual(actual, expected) {
    readFile(actual, 'utf8', (err, rawData) => {
        assert.equal(err, null);

        let output = PatchRawTaskDef(rawData, "aaa", "bbb", "ccc", ["/entry.sh"], "", "", [], false);
        readFile(expected, 'utf8', (err, rawData) => {
            assert.equal(err, null);
            assert.deepEqual(output, rawData);
        })
    })
}

function assertDeploymentEqual(actual, expected) {
    readFile(actual, 'utf8', (err, rawData) => {
        assert.equal(err, null);

        let output = PatchRawDeployment(rawData, "aaa", "bbb", "ccc", ["/entry.sh"], "", "", [], false);
        readFile(expected, 'utf8', (err, rawData) => {
            assert.equal(err, null);
            assert.deepEqual(output, rawData);
        })
    })
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
});