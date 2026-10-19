<template>
    <nav v-if="items.length" class="related" :aria-label="title">
        <h2>{{ title }}</h2>
        <div class="related-grid">
            <NuxtLink v-for="item in items" :key="item.slug" :to="localePath(`/soluzioni/${item.slug}`)">
                <span>{{ item.label }}</span>
                <strong>{{ item.title }}</strong>
            </NuxtLink>
        </div>
    </nav>
</template>

<script setup lang="ts">
// "Altre soluzioni" on a solution page: the cards chosen in the CMS for that
// page, or (none chosen) up to 4 other solutions, same group first.
import { computed } from "vue";

const props = defineProps<{
    items: Array<{ slug: string; title: string; label: string }>;
    heading?: string;
}>();

const { t } = useI18n();
const localePath = useLocalePath();
const title = computed(() => props.heading || t("solutions.related"));
</script>

<style scoped>
.related {
    margin: 44px 0 28px;
}

.related h2 {
    margin: 0 0 16px;
    color: #0b355b;
    font-size: 1.3rem;
    font-weight: 500;
}

.related-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
}

.related-grid a {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 18px 20px;
    border: 1px solid rgba(11, 53, 91, 0.12);
    border-radius: 14px;
    background: #fff;
    color: #0b355b;
    text-decoration: none;
    transition: border-color 0.15s ease, transform 0.15s ease;
}

.related-grid a:hover,
.related-grid a:focus-visible {
    border-color: #c52317;
    transform: translateY(-2px);
}

.related-grid span {
    color: #c52317;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
}
</style>
