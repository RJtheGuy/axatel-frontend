<template>
    <section class="cms-testimonial" :data-variant="value.variant || 'default'">
        <blockquote v-html="value.quote"></blockquote>

        <div class="attribution">
            <img
                v-if="value.avatar?.url"
                class="avatar"
                :src="value.avatar.url"
                :alt="plainName"
                width="56"
                height="56"
                loading="lazy"
            />
            <div>
                <div v-if="value.name" class="name" v-html="value.name"></div>
                <div v-if="value.role" class="role" v-html="value.role"></div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { unwrapParagraph } from "~/composables/richtext";

const props = defineProps<{
    value: {
        quote: string;
        name?: string;
        role?: string;
        avatar?: { url: string };
        variant?: "default" | "accent" | "muted";
    };
}>();

// img alt needs plain text, not markup - strip tags rather than v-html.
const plainName = computed(() => unwrapParagraph(props.value.name).replace(/<[^>]+>/g, ""));
</script>

<style scoped>
.cms-testimonial {
    max-width: 860px;
    margin: 72px auto;
    padding: 0 8vw;
    text-align: center;
}

blockquote {
    margin: 0 0 28px;
}

blockquote :deep(p) {
    margin: 0;
    font-size: clamp(1.2rem, 2.4vw, 1.75rem);
    font-weight: 200;
    line-height: 1.5;
    color: var(--ax-color-text-primary);
}

.attribution {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    text-align: left;
}

.avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid var(--ax-color-border-soft);
}

/* Per the block's docstring: name and role are separate fields
   precisely so they can be styled independently. */
.name :deep(p) {
    margin: 0;
    font-weight: 700;
    color: var(--ax-color-text-primary);
}

.role :deep(p) {
    margin: 2px 0 0;
    color: var(--ax-color-text-muted);
    font-size: 0.8rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

/* Section variant - see "Stile della sezione" in the Wagtail admin. */
.cms-testimonial[data-variant="accent"] blockquote :deep(p) {
    color: var(--ax-color-accent-red-soft);
}

.cms-testimonial[data-variant="muted"] blockquote :deep(p) {
    color: var(--ax-color-text-secondary);
    font-weight: 300;
}
</style>
