import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import vm from "node:vm";
import test from "node:test";

function loadClass(filename, className, globals = {}) {
    const source = readFileSync(new URL(`../app/classes/hero/${filename}`, import.meta.url), "utf8")
        .replace(/^import[\s\S]*?from\s+["'][^"']+["'];\r?\n/gm, "")
        .replace(`export class ${className}`, `class ${className}`);
    const context = vm.createContext(globals);
    vm.runInContext(stripTypeScriptTypes(source) + `\nglobalThis.subject = ${className};`, context);
    return context.subject;
}

test("opaque black SVG background is excluded while white logo strokes remain", () => {
    const deterministicMath = Object.create(Math);
    deterministicMath.random = () => 0.5;
    const factory = loadClass("ShapeFactory.ts", "ShapeFactory", { Math: deterministicMath });
    const pixels = new Uint8ClampedArray(12 * 12 * 4);
    for (let i = 3; i < pixels.length; i += 4) pixels[i] = 255;
    for (const [x, y] of [[3, 3], [9, 3], [3, 9], [9, 9]]) {
        const offset = (y * 12 + x) * 4;
        pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 254;
    }
    const canvas = { width: 12, height: 12, getContext: () => ({ getImageData: () => ({ data: pixels }) }) };
    const formation = factory.createFormationFromCanvas(canvas, 16, 12, 12, {
        ignoreDarkPixels: true, useOpaqueBounds: true, preserveAspect: true
    });
    const unique = new Set();
    for (let i = 0; i < formation.length; i += 3) unique.add(`${formation[i]},${formation[i + 1]}`);
    assert.deepEqual([...unique].sort(), ["-6,-6", "-6,6", "6,-6", "6,6"]);
    const unfiltered = factory.createFormationFromCanvas(canvas, 16, 12, 12);
    const original = new Set();
    for (let i = 0; i < unfiltered.length; i += 3) original.add(`${unfiltered[i]},${unfiltered[i + 1]}`);
    assert.equal(original.size, 16, "custom images retain their original background sampling");
});

test("SVG decoding forwards the explicit dark-pixel mask without filtering white strokes", async () => {
    let samplingOptions;
    const factory = loadClass("ShapeFactory.ts", "ShapeFactory", {
        document: { createElement: () => ({ getContext: () => ({ clearRect() {}, drawImage() {} }) }) },
        Image: class {
            width = 619;
            height = 143;
            async decode() {}
        }
    });
    factory.createFormationFromCanvas = (canvas, count, width, height, options) => {
        samplingOptions = options;
        return new Float32Array(count * 3);
    };
    await factory.createSvgFormation("Axatel.svg", 10, 20, 10, { ignoreDarkPixels: true });
    assert.equal(samplingOptions.ignoreDarkPixels, true);
    assert.equal(samplingOptions.ignoreLightPixels, false);
    await factory.createSvgFormation("custom.svg", 10, 20, 10);
    assert.equal(samplingOptions.ignoreDarkPixels, undefined);
});

test("only the final bundled Axatel logo stage enables the background mask", async () => {
    const calls = [];
    const factory = {
        createSvgFormation: async (...args) => {
            calls.push(args);
            return new Float32Array(30);
        }
    };
    const ParticleSystem = loadClass("ParticleSystem.ts", "ParticleSystem", {
        ShapeFactory: factory, axatelLogo: "/_nuxt/Axatel.svg", DEFAULT_WING_IMAGE: "wing.png"
    });
    const system = Object.create(ParticleSystem.prototype);
    Object.assign(system, {
        PARTICLE_COUNT: 10, worldHalfWidth: 30, worldHalfHeight: 20,
        worldCacheKey: "test", formationCache: new Map(),
        uniforms: { uOpacity: { value: 0 }, uPointSize: { value: 0 } }
    });
    await system.setStage({ id: "logo", type: "logo", text: "AXATEL", duration: 9 });
    assert.equal(calls[0][0], "/_nuxt/Axatel.svg");
    assert.equal(calls[0][4].ignoreDarkPixels, true);
    await system.setStage({ id: "custom", type: "logo", asset: "custom.svg", duration: 9 });
    assert.equal(calls[1][0], "custom.svg");
    assert.equal(calls[1][4], undefined);
    await system.setStage({ id: "wing", type: "logo", asset: "wing.png", duration: 9 });
    assert.equal(calls[2][4], undefined);
});
