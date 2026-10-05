import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import test from "node:test";
import vm from "node:vm";
import { ref } from "vue";

function loadIntro() {
    const file = readFileSync(new URL("../app/components/dashboard/Demo.vue", import.meta.url), "utf8");
    const script = file.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
        .replace(/^import .*?\r?\n/gm, "");
    let mount;
    let unmount;
    let observerCallback;
    let disconnected = 0;
    const timers = new Map();
    const document = { activeElement: null };
    const context = vm.createContext({
        ref, document,
        angelBpmLogo: "angel_bpm.png",
        defineProps: () => ({}),
        onMounted: callback => { mount = callback; },
        onBeforeUnmount: callback => { unmount = callback; },
        IntersectionObserver: class {
            constructor(callback) { observerCallback = callback; }
            observe() {}
            disconnect() { disconnected++; }
        },
        setTimeout: (callback, delay) => { timers.set(1, { callback, delay }); return 1; },
        clearTimeout: id => timers.delete(id)
    });
    vm.runInContext(stripTypeScriptTypes(script) +
        "\nglobalThis.state = { sectionEl, introEl, introDismissed, dismissIntro };", context);
    context.state.sectionEl.value = { focus() {} };
    mount();
    return {
        ...context.state, document, timers, unmount,
        enter: () => observerCallback([{ isIntersecting: true }]),
        outside: () => observerCallback([{ isIntersecting: false }]),
        disconnected: () => disconnected
    };
}

test("demo intro waits for visibility before dismissing after nine seconds", () => {
    const intro = loadIntro();
    intro.outside();
    assert.equal(intro.timers.size, 0);
    assert.equal(intro.introDismissed.value, false);
    intro.enter();
    assert.equal(intro.disconnected(), 0);
    assert.equal(intro.timers.get(1).delay, 9000);
    intro.timers.get(1).callback();
    assert.equal(intro.introDismissed.value, true);
    assert.equal(intro.timers.size, 0);
});

test("click dismisses once and cancels auto-dismiss without leaving focus on hidden content", () => {
    const intro = loadIntro();
    let focused = false;
    intro.sectionEl.value = { focus: () => { focused = true; } };
    intro.introEl.value = {};
    intro.document.activeElement = intro.introEl.value;
    intro.enter();
    intro.dismissIntro();
    assert.equal(intro.introDismissed.value, true);
    assert.equal(intro.timers.size, 0);
    assert.equal(focused, true);
    const disconnected = intro.disconnected();
    intro.dismissIntro();
    assert.equal(intro.disconnected(), disconnected);
    intro.outside();
    intro.enter();
    assert.equal(intro.introDismissed.value, true);
    assert.equal(intro.timers.size, 0, "click prevents any future introduction");
});

test("automatic dismissal reappears only after leaving and returning to demos", () => {
    const intro = loadIntro();
    intro.enter();
    intro.timers.get(1).callback();
    intro.enter();
    assert.equal(intro.introDismissed.value, true);
    assert.equal(intro.timers.size, 0, "remaining in the section does not restart the overlay");
    intro.outside();
    intro.enter();
    assert.equal(intro.introDismissed.value, false);
    assert.equal(intro.timers.get(1).delay, 9000);
});

test("leaving before timeout cancels it and returning starts a full nine seconds", () => {
    const intro = loadIntro();
    intro.enter();
    const firstTimer = intro.timers.get(1);
    intro.enter();
    assert.equal(intro.timers.get(1), firstTimer, "duplicate visibility does not reset the timer");
    intro.outside();
    assert.equal(intro.timers.size, 0);
    intro.enter();
    assert.notEqual(intro.timers.get(1), firstTimer);
    assert.equal(intro.timers.get(1).delay, 9000);
});

test("unmount clears the observer and pending auto-dismiss", () => {
    const intro = loadIntro();
    intro.enter();
    intro.unmount();
    assert.equal(intro.timers.size, 0);
    assert.equal(intro.disconnected(), 1);
});
