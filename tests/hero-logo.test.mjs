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

test("Axatel masks its background while both dashboard wings retain white interiors", async () => {
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
        particleOpacities: new Float32Array(10),
        geometry: { attributes: { aOpacity: { needsUpdate: false } } },
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
    await system.setStage({ id: "forced-cases-logo", type: "logo", asset: "ala.png", duration: 9999 });
    assert.equal(calls[3][0], "ala.png");
    assert.equal(calls[3][4].ignoreLightPixels, false, "the white wing must not be filtered out");
    assert.equal(calls[3][4].ignoreDarkPixels, true);
    assert.equal(calls[3][2], 60 * 0.92, "cases wing fills almost the entire viewport width");
    assert.equal(calls[3][3], 40 * 0.92);
    system.formationCache.clear();
    await system.setStage({ id: "forced-quote-logo", type: "logo", asset: "ala.png", duration: 9999 });
    assert.equal(calls[4][4].ignoreLightPixels, false, "the opening dashboard wing also retains its white interior");
    assert.equal(calls[4][4].ignoreDarkPixels, true);
});

test("wing sampling fills white interiors and excludes transparent and black background", () => {
    const factory = loadClass("ShapeFactory.ts", "ShapeFactory");
    const pixels = new Uint8ClampedArray(15 * 15 * 4);
    for (let y = 3; y <= 9; y += 3) {
        for (let x = 3; x <= 9; x += 3) {
            const offset = (y * 15 + x) * 4;
            pixels.fill(255, offset, offset + 4);
        }
    }
    pixels[3] = 255;
    const canvas = { width: 15, height: 15, getContext: () => ({ getImageData: () => ({ data: pixels }) }) };
    const formation = factory.createFormationFromCanvas(canvas, 9, 6, 6, {
        ignoreLightPixels: false, ignoreDarkPixels: true,
        preserveAspect: true, useOpaqueBounds: true, jitter: false
    });
    const cells = new Set();
    for (let i = 0; i < formation.length; i += 3) cells.add(`${formation[i]},${formation[i + 1]}`);
    assert.equal(cells.size, 9);
    assert.ok(cells.has("0,0"), "the interior receives particles, not just the outline");
});

test("hero sequence returns directly from Axatel to AngelBPM without a pause", () => {
    const sequence = loadClass("SequenceManager.ts", "SequenceManager", {
        angelBpmLogo: "/_nuxt/angel_bpm.png"
    });
    const manager = new sequence(["Frase uno", "Frase due"]);
    const expectedStages = [
        { id: "angel-bpm", type: "composite", text: "AngelBPM", asset: "/_nuxt/angel_bpm.png" },
        { id: "phrase-1", type: "text", text: "Frase uno", asset: undefined },
        { id: "flow-2", type: "flow", text: undefined, asset: undefined },
        { id: "phrase-2", type: "text", text: "Frase due", asset: undefined },
        { id: "logo", type: "logo", text: "AXATEL", asset: undefined }
    ];

    for (const expected of expectedStages) {
        const current = manager.getCurrentStage();
        assert.deepEqual(
            { id: current.id, type: current.type, text: current.text, asset: current.asset },
            expected
        );
        manager.update(current.duration + 0.01);
    }

    assert.equal(manager.getCurrentStage().id, "angel-bpm");
    assert.equal(manager.getCurrentStage().fontSizeReference, "Frase uno");
    manager.setPhrases(["Nuova frase"]);
    assert.equal(manager.getCurrentStage().fontSizeReference, "Nuova frase");
});

test("AngelBPM composite uses the emphasized particle formation", async () => {
    let compositeArguments;
    const system = loadClass("ParticleSystem.ts", "ParticleSystem", {
        ShapeFactory: {
            createCompositeFormation: async (...args) => {
                compositeArguments = args;
                return new Float32Array(args[2] * 3);
            }
        },
        DEFAULT_WING_IMAGE: "wing.png",
        axatelLogo: "Axatel.svg"
    });
    const particleSystem = Object.create(system.prototype);
    Object.assign(particleSystem, {
        currentStageType: "flow",
        currentStageId: "flow",
        PARTICLE_COUNT: 10,
        worldHalfWidth: 30,
        worldHalfHeight: 20,
        worldCacheKey: "test",
        canvas: { clientHeight: 600 },
        formationCache: new Map(),
        uniforms: { uOpacity: { value: 0 }, uPointSize: { value: 0 } },
        particleOpacities: new Float32Array(10),
        geometry: { attributes: { aOpacity: { needsUpdate: false } } }
    });
    const positions = new Float32Array(30).fill(3);
    const velocities = new Float32Array(30).fill(0.2);
    particleSystem.positions = positions;
    particleSystem.velocities = velocities;
    const originalPositions = positions.slice();
    const originalVelocities = velocities.slice();

    await particleSystem.setStage({
        id: "angel-bpm",
        type: "composite",
        text: "AngelBPM",
        asset: "angel_bpm.png",
        fontSizeReference: "Frase uno",
        duration: 6
    });

    assert.equal(compositeArguments[1], "angel_bpm.png");
    assert.equal(compositeArguments[6], true);
    assert.equal(compositeArguments[7], "Frase uno");
    assert.deepEqual(positions, originalPositions, "recomposition retains the previous particle positions");
    assert.deepEqual(velocities, originalVelocities, "recomposition retains particle momentum");
    assert.ok(particleSystem.particleOpacities.every(value => Math.abs(value - 0.1) < 0.0001),
        "ten coincident points contribute the brightness of one cell, not ten");
});

test("AngelBPM samples logo and title on one grid using the dynamic phrase typography and spacing", async () => {
    const drawing = [];
    const context = {
        measureText: () => ({ width: 720, actualBoundingBoxAscent: 130, actualBoundingBoxDescent: 20 }),
        drawImage: (...args) => drawing.push(["image", ...args]),
        fillText: (...args) => drawing.push(["text", ...args])
    };
    const factory = loadClass("ShapeFactory.ts", "ShapeFactory", {
        DEFAULT_WING_IMAGE: "wing.png",
        window: { innerWidth: 1440, innerHeight: 900 },
        document: { createElement: () => ({ getContext: () => context }) },
        Image: class {
            width = 420;
            height = 300;
            async decode() {}
        }
    });
    const textCalls = [];
    let sampling;
    factory.createTextFormation = (text, count, width, height, options) => {
        textCalls.push({ text, width, height, options });
        options.onMetrics?.(180, 0.08);
        return new Float32Array(count * 3);
    };
    factory.createFormationFromCanvas = (canvas, count, width, height, options) => {
        sampling = { canvas, count, width, height, options };
        return new Float32Array(count * 3);
    };
    const formation = await factory.createCompositeFormation(
        "AngelBPM", "angel_bpm.png", 100, 120, 68, 10, true, "Frase dinamica"
    );
    assert.equal(textCalls[0].width, 120 * 0.92);
    assert.equal(textCalls[0].height, 68 * 0.84);
    assert.equal(textCalls.length, 1, "reference typography is measured without separately sampling the title");
    assert.equal(context.font, '350 180px "forma-djr-micro", sans-serif');
    assert.equal(drawing[0][5], 240, "logo height stays proportional to the title");
    assert.equal(drawing[1][1], "AngelBPM");
    assert.equal(sampling.width, 120 * 0.69);
    assert.equal(sampling.height, 68 * 0.42);
    assert.equal(sampling.options.sampleStep, 3);
    assert.equal(sampling.options.jitter, false);
    assert.equal(formation.length, 300);
});

test("a shared geometric grid has exact aligned cells without jitter", () => {
    const factory = loadClass("ShapeFactory.ts", "ShapeFactory");
    const pixels = new Uint8ClampedArray(13 * 13 * 4).fill(255);
    const canvas = { width: 13, height: 13, getContext: () => ({ getImageData: () => ({ data: pixels }) }) };
    const formation = factory.createFormationFromCanvas(canvas, 16, 12, 12, {
        sampleStep: 4, jitter: false, preserveAspect: true, useOpaqueBounds: true
    });
    for (let i = 0; i < 16; i++) {
        assert.equal(formation[i * 3], -6 + (i % 4) * 4);
        assert.equal(formation[i * 3 + 1], 6 - Math.floor(i / 4) * 4);
    }
});

test("Axatel logo disperses without hiding or respawning particles before the next title", () => {
    const ParticleSystem = loadClass("ParticleSystem.ts", "ParticleSystem", {
        ShapeFactory: {},
        DEFAULT_WING_IMAGE: "wing.png",
        axatelLogo: "Axatel.svg",
        window: { devicePixelRatio: 1 }
    });
    const count = 101;
    const system = Object.create(ParticleSystem.prototype);
    const pointAttribute = { needsUpdate: false };
    const opacityAttribute = { needsUpdate: false };
    Object.assign(system, {
        PARTICLE_COUNT: count,
        positions: new Float32Array(count * 3),
        velocities: new Float32Array(count * 3),
        particleOpacities: new Float32Array(count).fill(1),
        mouseLatch: new Float32Array(count),
        uniforms: {
            uTime: { value: 0 },
            uPointSize: { value: 0 },
            uOpacity: { value: 0 },
            uPixelRatio: { value: 1 }
        },
        flowForce: { x: 0, y: 0 },
        targetPositions: new Float32Array(count * 3),
        currentStageType: "logo",
        currentStageId: "logo",
        formationSuppressed: false,
        formationElapsed: 1,
        FORMATION_SETTLE_DURATION: 1,
        anchorOffsetY: 0,
        worldHalfWidth: 100,
        worldHalfHeight: 100,
        hasMouse: false,
        geometry: { attributes: { position: pointAttribute, aOpacity: opacityAttribute } },
        resize() {}
    });
    const flowField = { getForce: (_x, _y, force) => { force.x = 0; force.y = 0; } };

    system.update(1 / 60, 1, flowField, 0.6);
    const earlierPointSize = system.uniforms.uPointSize.value;
    assert.equal(system.particleOpacities[0], 1, "released particles remain visible");
    assert.equal(system.particleOpacities[1], 1, "other logo particles still follow the growing shape");

    system.update(1 / 60, 2, flowField, 0.9);
    assert.ok(system.uniforms.uPointSize.value < earlierPointSize, "points stay small while the logo zooms");
    assert.ok(Math.hypot(system.velocities[0], system.velocities[1]) > 0, "released particles burst outward from the logo");
    assert.equal(opacityAttribute.needsUpdate, true);
    for (let frame = 0; frame < 120; frame++) {
        system.update(1 / 60, 3 + frame / 60, flowField, 0.99);
    }
    assert.ok(system.particleOpacities.every(value => value === 1));
    for (let i = 0; i < count; i++) {
        assert.ok(Math.abs(system.positions[i * 3]) <= 94);
        assert.ok(Math.abs(system.positions[i * 3 + 1]) <= 94);
    }
    system.currentStageType = "composite";
    system.currentStageId = "angel-bpm";
    system.particleOpacities.fill(0.25);
    system.update(1 / 60, 5, flowField, 0.4);
    assert.ok(system.particleOpacities.every(value => value === 0.25),
        "animation preserves the brand's overlap compensation");
    system.currentStageType = "text";
    system.currentStageId = "phrase-1";
    system.update(1 / 60, 6, flowField, 0.4);
    assert.ok(system.particleOpacities.every(value => value === 1),
        "the following phrases retain their original appearance");
});
