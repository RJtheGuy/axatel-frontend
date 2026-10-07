<template>
    <!-- Tags of the page (CMS field "Tags"), shown like on a success story. -->
    <ul v-if="tags.length" class="meta-tags" :class="{ 'is-dark': dark }" role="list">
        <li v-for="tag in tags" :key="tag">#{{ tag }}</li>
    </ul>
</template>

<script setup lang="ts">
defineProps<{ tags: string[]; dark?: boolean }>();
</script>

<style scoped>
.meta-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 20px 0 0;
    padding: 0;
    list-style: none;
}

.meta-tags li {
    padding: 6px 14px;
    border: 1px solid rgba(11, 53, 91, 0.16);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.7);
    color: #274e72;
    font-size: 0.76rem;
    letter-spacing: 0.03em;
}

.meta-tags.is-dark li {
    border-color: var(--ax-color-border-soft);
    background: transparent;
    color: var(--ax-color-text-secondary);
}
</style>
