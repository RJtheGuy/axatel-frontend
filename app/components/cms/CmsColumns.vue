<template>
    <section class="cms-columns">
        <div class="col">
            <!-- Nested StreamBlocks: each side is itself a list of
                 blocks, so BlockRenderer recurses. -->
            <CmsBlockRenderer :blocks="value.left ?? []" />
        </div>
        <div class="col">
            <CmsBlockRenderer :blocks="value.right ?? []" />
        </div>
    </section>
</template>

<script setup lang="ts">
defineProps<{
    value: {
        left?: Array<{ type: string; value: any; id: string }>;
        right?: Array<{ type: string; value: any; id: string }>;
    };
}>();
</script>

<style scoped>
.cms-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    padding: 40px 8vw;
}

/* Children already carry their own horizontal padding; cancel it so
   the two columns don't end up double-inset. */
.col :deep(> *) {
    padding-left: 0;
    padding-right: 0;
    margin-left: 0;
    margin-right: 0;
}

@media (max-width: 820px) {
    .cms-columns {
        grid-template-columns: 1fr;
    }
}
</style>
