<template>
    <section class="process" :aria-labelledby="headingId">
        <h2 :id="headingId">{{ heading || t("process.heading") }}</h2>
        <ol>
            <li v-for="(step, index) in shown" :key="index">
                <span class="num" aria-hidden="true">{{ String(index + 1).padStart(2, "0") }}</span>
                <h3>{{ step.title }}</h3>
                <p v-if="step.text">{{ step.text }}</p>
            </li>
        </ol>
    </section>
</template>

<script setup lang="ts">
// Axatel's own five-step process (same as the homepage), on the solution
// pages. The "Come lavoriamo" block in the CMS can give its own title and
// steps; left empty, the standard ones are shown in the visitor's language.
import { computed, useId } from "vue";

const props = defineProps<{
    heading?: string;
    steps?: Array<{ title?: string | null; text?: string | null }>;
}>();

const { t, tm, rt } = useI18n();
const headingId = `process-${useId()}`;
const own = computed(() => (props.steps ?? []).filter((step) => step?.title));
const shown = computed(() =>
    own.value.length
        ? own.value.map((step) => ({ title: step.title || "", text: step.text || "" }))
        : (tm("process.steps") as Array<{ title: any; text: any }>).map((step) => ({ title: rt(step.title), text: rt(step.text) }))
);
</script>

<style scoped>
.process {
    margin: 40px 0 0;
    padding-top: 28px;
    border-top: 1px solid rgba(11, 53, 91, 0.1);
}

h2 {
    margin: 0 0 20px;
    color: #0b355b;
    font-size: clamp(1.35rem, 2.4vw, 1.7rem);
    font-weight: 500;
}

ol {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 14px;
    margin: 0;
    padding: 0;
    list-style: none;
}

/* On laptops (about 1280-1440 px) five 160 px columns fit but break the step
   names ("Programmiam-o"): from tablet width up, at least 180 px each (4 + 1). */
@media (min-width: 769px) {
    ol {
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }
}

li {
    padding: 18px;
    border: 1px solid rgba(11, 53, 91, 0.1);
    border-radius: 14px;
    background: #fff;
}

.num {
    color: #c52317;
    font-size: 0.78rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}

h3 {
    margin: 8px 0 6px;
    color: #0b355b;
    font-size: 0.95rem;
    hyphens: auto;
    overflow-wrap: break-word;
    font-weight: 600;
}

p {
    margin: 0;
    color: #274e72;
    font-size: 0.88rem;
    line-height: 1.5;
}
</style>
