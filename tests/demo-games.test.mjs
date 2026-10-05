import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import vm from "node:vm";
import test from "node:test";
import { ref, computed } from "vue";

function game(name, exports) {
    const file = readFileSync(new URL(`../app/components/dashboard/demo/gioco/${name}.vue`, import.meta.url), "utf8");
    const script = file.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
        .replace(/^import .*?\r?\n/gm, "");
    let now = 0;
    let nextId = 0;
    let stored = "[]";
    const timers = new Map();
    const ticks = new Set();
    const cleanup = [];
    const events = [];
    const target = {
        getBoundingClientRect: () => ({ left: 200, top: 300, width: 360, height: 240, right: 560, bottom: 540 }),
        setPointerCapture() {},
        hasPointerCapture: () => false,
        releasePointerCapture() {}
    };
    const context = vm.createContext({
        ref, computed,
        defineEmits: () => (event) => events.push(event),
        onMounted: (callback) => callback(),
        onUnmounted: (callback) => cleanup.push(callback),
        gsap: { ticker: { add: (fn) => ticks.add(fn), remove: (fn) => ticks.delete(fn), deltaRatio: () => 1 } },
        performance: { now: () => now },
        crypto: { randomUUID: () => String(++nextId) },
        localStorage: { getItem: () => stored, setItem: (key, value) => { stored = value; } },
        setTimeout: (fn, delay) => { const id = ++nextId; timers.set(id, { fn, at: now + delay }); return id; },
        clearTimeout: (id) => timers.delete(id),
        ResizeObserver: class { observe() {} disconnect() {} }
    });
    vm.runInContext(stripTypeScriptTypes(script) + `\nglobalThis.state = {${exports}};`, context);
    const advance = (ms) => {
        const end = now + ms;
        while (now < end) {
            now = Math.min(end, now + 1000 / 60);
            for (const [id, timer] of timers) if (timer.at <= now) { timers.delete(id); timer.fn(); }
            for (const tick of ticks) tick();
        }
    };
    return {
        ...context.state, events, target, advance,
        event: (overrides = {}) => ({
            pointerType: "mouse", pointerId: 1, isPrimary: true, currentTarget: target,
            clientX: 200, clientY: 420, ...overrides
        }),
        alarms: () => JSON.parse(stored),
        unmount: () => cleanup.forEach((callback) => callback()),
        pending: () => timers.size + ticks.size
    };
}

test("AngelRiver saves exactly 5m at maximum without leaving, drains and cannot refill during the same hover", () => {
    const g = game("AngelRiver", "onPointerEnter,onPointerLeave,onPointerDown,waterLevel,isRaining");
    g.onPointerEnter(g.event());
    g.advance(4600);
    assert.equal(g.alarms().length, 1);
    assert.equal(g.alarms()[0].value, 5);
    assert.equal(g.isRaining.value, false);
    assert.equal(g.events.filter((event) => event === "alarm").length, 1);
    g.onPointerDown(g.event());
    g.advance(30000);
    assert.equal(g.waterLevel.value, 0);
    assert.equal(g.alarms().length, 1);
    g.unmount();
    assert.equal(g.pending(), 0);
});

test("AngelRiver rearms on a new mouse entry and records partial floods only once", () => {
    const g = game("AngelRiver", "onPointerEnter,onPointerLeave,waterLevel");
    g.onPointerEnter(g.event());
    g.advance(2500);
    g.onPointerLeave(g.event());
    g.advance(10000);
    assert.equal(g.alarms().length, 1);
    assert.ok(g.alarms()[0].value > 2.1 && g.alarms()[0].value < 5);
    g.onPointerEnter(g.event());
    g.advance(4600);
    assert.equal(g.alarms().length, 2);
    assert.equal(g.alarms()[0].value, 5);
    g.advance(30000);
    assert.equal(g.alarms().length, 2);
});

test("AngelRiver touch cancellation drains safely and a new press rearms", () => {
    const g = game("AngelRiver", "onPointerDown,onPointerEnd,onPointerCaptureLost,isRaining");
    g.onPointerDown(g.event({ pointerType: "touch" }));
    g.advance(500);
    g.onPointerEnd(g.event({ pointerType: "touch", pointerId: 2 }));
    assert.equal(g.isRaining.value, true);
    g.onPointerCaptureLost();
    assert.equal(g.isRaining.value, false);
    g.advance(3000);
    assert.equal(g.alarms().length, 0);
    g.onPointerDown(g.event({ pointerType: "touch" }));
    g.advance(4600);
    assert.equal(g.alarms().length, 1);
});

test("AngelRiver reentry immediately after maximum starts a distinct cycle", () => {
    const g = game("AngelRiver", "onPointerEnter,onPointerLeave");
    g.onPointerEnter(g.event());
    g.advance(4600);
    g.onPointerLeave(g.event());
    g.onPointerEnter(g.event());
    g.advance(4600);
    assert.equal(g.alarms().length, 2);
    assert.equal(g.events.filter((e) => e === "alarm").length, 2);
});

test("AngelBridge alarms once per hover, closes without pointer leave and rearms on reentry", () => {
    const g = game("AngelBridge", "onPointerEnter,onPointerLeave,currentValue");
    g.onPointerEnter(g.event());
    g.advance(15000);
    assert.equal(g.alarms().length, 1);
    assert.equal(g.events.filter((e) => e === "alarm").length, 1);
    assert.equal(g.currentValue.value, 0);
    g.onPointerLeave(g.event());
    g.onPointerEnter(g.event());
    g.advance(15000);
    assert.equal(g.alarms().length, 2);
    g.unmount();
    assert.equal(g.pending(), 0);
});

test("AngelBridge early release closes without false alarms and cancellation stops opening", () => {
    const g = game("AngelBridge", "onPointerDown,onPointerEnd,onPointerCaptureLost,currentValue");
    g.onPointerDown(g.event({ pointerType: "touch" }));
    g.advance(200);
    g.onPointerEnd(g.event({ pointerType: "touch" }));
    g.advance(2000);
    assert.equal(g.currentValue.value, 0);
    assert.equal(g.alarms().length, 0);
    g.onPointerDown(g.event({ pointerType: "touch" }));
    g.advance(200);
    g.onPointerCaptureLost();
    g.advance(2000);
    assert.equal(g.currentValue.value, 0);
    g.unmount();
    assert.equal(g.pending(), 0);
});

test("TrafficAlert reaches congestion while hovered, clears with hysteresis and has bounded speeds", () => {
    const g = game("TrafficAlert", "onPointerEnter,onPointerLeave,avgSpeed,cars,isAlarm");
    g.onPointerEnter(g.event());
    g.advance(60000);
    assert.equal(g.isAlarm.value, true);
    assert.equal(g.events.filter((e) => e === "alarm").length, 1);
    assert.ok(g.avgSpeed.value >= 5 && g.avgSpeed.value <= 20);
    assert.ok(g.cars.value.every((car) => car.speed >= 5 && car.speed <= 60));
    g.onPointerLeave(g.event());
    g.advance(60000);
    assert.equal(g.isAlarm.value, false);
    assert.equal(g.alarms().length, 1);
    assert.equal(g.alarms()[0].name, "Traffico");
    g.onPointerEnter(g.event());
    g.advance(60000);
    assert.equal(g.events.filter((e) => e === "alarm").length, 2);
    g.unmount();
    assert.equal(g.pending(), 0);
});

test("GeoAngel measures touch coordinates relative to the card and resets after impact", () => {
    const g = game("GeoAngel", "onPointerDown,onPointerMove,onPointerEnd,currentValue,isAlarm");
    g.onPointerDown(g.event({ pointerType: "touch", clientX: 310 }));
    g.advance(10);
    g.onPointerMove(g.event({ pointerType: "touch", clientX: 320 }));
    g.advance(10);
    g.onPointerMove(g.event({ pointerType: "touch", clientX: 450 }));
    assert.equal(g.isAlarm.value, true);
    assert.ok(g.currentValue.value < 3, "viewport offset must not inflate a small impact");
    g.advance(1300);
    assert.equal(g.alarms().length, 1);
    assert.equal(g.isAlarm.value, false);
    g.onPointerEnd(g.event({ pointerType: "touch" }));
    g.unmount();
    assert.equal(g.pending(), 0);
});

test("GeoAngel ignores stationary movement and clears pending alarm on unmount", () => {
    const g = game("GeoAngel", "onPointerDown,onPointerMove,onPointerCaptureLost,isAlarm");
    g.onPointerDown(g.event({ pointerType: "touch", clientX: 380 }));
    g.advance(10);
    g.onPointerMove(g.event({ pointerType: "touch", clientX: 380 }));
    g.onPointerCaptureLost();
    assert.equal(g.isAlarm.value, false);
    g.onPointerDown(g.event({ pointerType: "touch", clientX: 300 }));
    g.advance(10);
    g.onPointerMove(g.event({ pointerType: "touch", clientX: 380 }));
    g.onPointerCaptureLost();
    assert.equal(g.isAlarm.value, true);
    g.unmount();
    g.advance(2000);
    assert.equal(g.alarms().length, 0);
    assert.equal(g.pending(), 0);
});

test("AngelRoadSite ignores slow movement, detects fast impact and cancels timers on unmount", () => {
    const g = game("AngelRoadSite", "card,sign,onPointerDown,onPointerMove,onPointerEnd,isAlarm,signFallen");
    g.card.value = g.target;
    g.sign.value = { getBoundingClientRect: () => ({ left: 330, right: 430, top: 330, bottom: 480 }) };
    const hit = (delay) => {
        g.onPointerDown(g.event({ pointerType: "touch", clientX: 300 }));
        g.advance(delay);
        g.onPointerMove(g.event({ pointerType: "touch", clientX: 350 }));
        g.advance(delay);
        g.onPointerMove(g.event({ pointerType: "touch", clientX: 450 }));
        g.onPointerEnd(g.event({ pointerType: "touch" }));
    };
    hit(500);
    assert.equal(g.isAlarm.value, false);
    hit(10);
    assert.equal(g.isAlarm.value, true);
    assert.equal(g.signFallen.value, true);
    g.advance(1600);
    assert.equal(g.alarms().length, 1);
    assert.equal(g.isAlarm.value, false);
    assert.equal(g.signFallen.value, false);
    hit(10);
    g.unmount();
    assert.equal(g.pending(), 0);
    g.advance(2000);
    assert.equal(g.alarms().length, 1);
});
