import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import vm from "node:vm";
import test from "node:test";
import { computed, reactive, ref, watch } from "vue";

const component = readFileSync(new URL("../app/pages/contatti.vue", import.meta.url), "utf8");
const script = component.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/^import .*;\r?\n/gm, "");

function setup(tipo) {
    const requests = [];
    const context = vm.createContext({
        FormData,
        console,
        reactive,
        computed,
        ref,
        watch,
        useRoute: () => ({ query: { tipo } }),
        // The form is translated: the Italian texts the assertions read.
        useI18n: () => ({
            t: (key) => ({
                "contact.missingCandidate": "Inserisci il nome e almeno un recapito: e-mail o telefono.",
                "contact.missingContact": "Inserisci nome, azienda e almeno un recapito: e-mail o telefono.",
                "contact.partnerMessage": "Vorrei parlare con Axatel di una possibile partnership."
            })[key] ?? key,
            locale: { value: "it" }
        }),
        useLocalePath: () => (path) => path,
        useSeoMeta() {},
        usePrivacyConsent: () => ({ text: { value: "Ho letto l'informativa privacy." } }),
        useRuntimeConfig: () => ({ public: { apiBase: "/api/v2" } }),
        $fetch: async (url, options) => requests.push({ url, body: options.body })
    });
    vm.runInContext(stripTypeScriptTypes(script.replace("import.meta.server", "false")) +
        "\nconsent.value = true;\nglobalThis.state = { form, submitForm, submitError, submitted };", context);
    return { ...context.state, requests };
}

test("candidature accepts name and phone without company and omits hidden contact fields", async () => {
    const state = setup("candidatura");
    Object.assign(state.form, {
        name: "Mario Rossi", phone: "123456789", company: "Old company",
        interests: ["Old interest"], message: "La mia candidatura",
        attachment: new File(["CV"], "cv.pdf", { type: "application/pdf" })
    });
    await state.submitForm();
    assert.equal(state.requests.length, 1);
    const body = state.requests[0].body;
    assert.equal(body.get("company"), "");
    assert.deepEqual(body.getAll("interests"), []);
    assert.equal(body.get("submission_type"), "candidate");
    assert.equal(body.get("attachment").name, "cv.pdf");
    assert.equal(body.get("message"), "La mia candidatura");
    assert.equal(state.submitted.value, true);
});

test("switching mode clears the unmounted CV input and previous feedback", () => {
    const state = setup("candidatura");
    state.form.attachment = new File(["CV"], "cv.pdf");
    state.submitError.value = "Previous error";
    state.submitted.value = true;
    state.form.submission_type = "contact";
    assert.equal(state.form.attachment, null);
    assert.equal(state.submitError.value, "");
    assert.equal(state.submitted.value, false);
});

test("name and at least one contact stay required for candidature", async () => {
    for (const fields of [{ name: " ", email: "test@example.com" }, { name: "Mario", email: " ", phone: " " }]) {
        const state = setup("candidatura");
        Object.assign(state.form, fields);
        await state.submitForm();
        assert.equal(state.requests.length, 0);
        assert.match(state.submitError.value, /nome e almeno un recapito/);
    }
});

test("contact and partner still require company and keep interests, but not a stale CV", async () => {
    for (const tipo of [undefined, "partner"]) {
        const state = setup(tipo);
        Object.assign(state.form, { name: "Mario", email: "test@example.com" });
        await state.submitForm();
        assert.equal(state.requests.length, 0);
        assert.match(state.submitError.value, /azienda/);
        Object.assign(state.form, {
            company: "Axatel", interests: ["Progetti IoT personalizzati"],
            attachment: new File(["Old CV"], "old.pdf")
        });
        await state.submitForm();
        const body = state.requests[0].body;
        assert.equal(body.get("company"), "Axatel");
        assert.deepEqual(body.getAll("interests"), ["Progetti IoT personalizzati"]);
        assert.equal(body.get("attachment"), null);
    }
});
