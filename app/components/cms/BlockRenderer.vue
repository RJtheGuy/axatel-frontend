<template>
    <template v-for="block in blocks" :key="block.id">
        <component
            :is="componentMap[block.type]"
            v-if="componentMap[block.type] && block.value != null"
            :value="block.value"
        />
        <div v-else-if="isDev" class="cms-missing">
            Nessun componente per il blocco "<code>{{ block.type }}</code>"
        </div>
    </template>
</template>

<script setup lang="ts">
/**
 * Maps Wagtail StreamField block types to Vue components.
 *
 * The keys here MUST match the type strings registered in BODY_BLOCKS
 * (core/blocks.py). That list is the single source of truth on the
 * Django side; this map is its counterpart on the frontend. Adding a
 * block server-side means adding one line here — the same "add here +
 * add there" rule the old Blade-partial convention had.
 *
 * Unmapped types render a visible warning in dev and nothing in prod,
 * so a missing component is loud during development but never breaks
 * a live page.
 */
withDefaults(
    defineProps<{
        blocks?: Array<{ type: string; value: any; id: string }>;
    }>(),
    { blocks: () => [] }
);

const isDev = import.meta.dev;

const componentMap: Record<string, any> = {
    hero: resolveComponent("CmsHero"),
    rich_text: resolveComponent("CmsRichText"),
    image: resolveComponent("CmsImage"),
    quote: resolveComponent("CmsQuote"),
    cta: resolveComponent("CmsCta"),
    service_cards: resolveComponent("CmsServiceCards"),
    columns: resolveComponent("CmsColumns"),
    video_embed: resolveComponent("CmsVideoEmbed"),
    download: resolveComponent("CmsDownload"),
    spacer: resolveComponent("CmsSpacer"),
    stats: resolveComponent("CmsStats"),
    network_diagram: resolveComponent("CmsNetworkDiagram"),
    solution_cards: resolveComponent("CmsSolutionCards"),
    feature_grid: resolveComponent("CmsFeatureGrid"),
    testimonial: resolveComponent("CmsTestimonial"),
    partner_logos: resolveComponent("CmsPartnerLogos"),
    portfolio_grid: resolveComponent("CmsPortfolioGrid")
};
</script>

<style scoped>
.cms-missing {
    margin: 12px 8vw;
    padding: 14px 18px;
    border: 1px dashed var(--ax-color-accent-red-soft);
    border-radius: 10px;
    color: var(--ax-color-accent-red-soft);
    font-size: 0.86rem;
}
</style>
