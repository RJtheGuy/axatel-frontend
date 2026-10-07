<template>
    <section class="process" aria-labelledby="process-heading">
        <h2 id="process-heading">{{ t("process.heading") }}</h2>
        <ol>
            <li v-for="(step, index) in steps" :key="index">
                <span class="num" aria-hidden="true">{{ String(index + 1).padStart(2, "0") }}</span>
                <h3>{{ rt(step.title) }}</h3>
                <p>{{ rt(step.text) }}</p>
            </li>
        </ol>
    </section>
</template>

<script setup lang="ts">
// Axatel's own five-step process (same as the homepage), shown on every
// solution page as the "how it works" part of the layout.
import { computed } from "vue";

const { t, tm, rt } = useI18n();
const steps = computed(() => tm("process.steps") as Array<{ title: any; text: any }>);
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
