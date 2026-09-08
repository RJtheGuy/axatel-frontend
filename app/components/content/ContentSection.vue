<template>
    <section class="content-section">
        <div class="section-heading">
            <span aria-hidden="true"></span>
            <h2>{{ section.title }}</h2>
        </div>
        <div class="section-copy">
            <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
            <ul v-if="section.highlights?.length" class="highlights">
                <li v-for="highlight in section.highlights" :key="highlight">{{ highlight }}</li>
            </ul>
        </div>
    </section>
</template>

<script setup lang="ts">
import type { ContentSectionData } from "../../types/contentPage";

defineProps<{ section: ContentSectionData }>();
</script>

<style scoped>
.content-section {
    max-width: 760px;
    padding: 28px 0 0;
}

.section-heading span {
    display: none;
}

.section-heading h2 {
    margin: 0 0 12px;
    padding-left: 14px;
    border-left: 4px solid #c52317;
    color: #0b355b;
    font-size: clamp(1.12rem, 1.8vw, 1.36rem);
    line-height: 1.3;
}

.section-copy p {
    margin: 0 0 14px;
    color: #274e72;
    line-height: 1.72;
}

.section-copy p:first-child {
    margin-top: 0;
}

.highlights {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 20px 0 6px;
    padding: 0;
    list-style: none;
}

.highlights li {
    padding: 6px 10px;
    border: 1px solid rgba(234, 63, 48, 0.28);
    border-radius: 999px;
    background: rgba(234, 63, 48, 0.12);
    color: #0b355b;
    font-size: 0.75rem;
    font-weight: 700;
}
</style>