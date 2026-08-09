<template>
    <section class="cms-partners">
        <h2 v-if="value.heading" v-html="unwrapParagraph(value.heading)"></h2>
        <div class="logos">
            <!-- NOTE: PartnerLogosBlock stores only a list of images —
                 no per-logo name or website. If those are needed (the
                 homepage Partners.vue takes name + website), the block
                 in core/blocks_sections.py has to gain a StructBlock
                 with image + name + url instead of a bare
                 ListBlock(ImageChooserBlock()). -->
            <div v-for="(logo, i) in logos" :key="i" class="logo">
                <img
                    v-if="logo?.url"
                    :src="logo.url"
                    :alt="logo.alt || logo.title || ''"
                    width="160"
                    height="56"
                    loading="lazy"
                    decoding="async"
                />
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { unwrapParagraph } from "~/composables/richtext";

const props = defineProps<{
    value: { heading?: string; logos?: Array<{ url: string; alt?: string; title?: string }> };
}>();

const logos = computed(() => props.value.logos ?? []);
</script>

<style scoped>
.cms-partners {
    padding: 64px 8vw;
}

h2 {
    margin: 0 0 30px;
    font-size: clamp(1.3rem, 2.4vw, 1.8rem);
    font-weight: 300;
}

.logos {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 18px;
}

.logo {
    min-height: 100px;
    display: grid;
    place-items: center;
    border: 1px solid var(--ax-color-border-soft);
    border-radius: var(--ax-card-radius);
    background: rgba(246, 251, 255, 0.92);
}

.logo img {
    max-width: 70%;
    max-height: 56px;
    object-fit: contain;
}
</style>
