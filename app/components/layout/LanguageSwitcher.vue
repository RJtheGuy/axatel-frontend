<template>
    <div ref="root" class="lang-switcher" :class="{ open }">
        <button
            type="button"
            class="lang-toggle"
            :aria-expanded="open"
            aria-haspopup="true"
            :aria-label="`${t('lang.label')}: ${current.name}`"
            @click="open = !open"
        >
            <svg class="globe" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
            </svg>
            <span class="code">{{ current.code.toUpperCase() }}</span>
            <svg class="chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
        </button>

        <ul v-show="open" class="lang-menu" role="menu">
            <li v-for="item in available" :key="item.code" role="none">
                <a
                    role="menuitem"
                    :href="switchLocalePath(item.code)"
                    :hreflang="item.language"
                    :lang="item.code"
                    :aria-current="item.code === locale ? 'true' : undefined"
                    class="lang-option"
                    :class="{ active: item.code === locale }"
                    @click.prevent="choose(item.code)"
                >
                    <span class="code">{{ item.code.toUpperCase() }}</span>
                    <span class="name">{{ item.name }}</span>
                </a>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
/**
 * Language dropdown for the navbar: IT / EN / FR.
 * Links to the same page in the other language (switchLocalePath), so a
 * visitor on /monitoraggio/traffico lands on /en/monitoraggio/traffico.
 * If that page isn't translated yet, it shows in Italian with a notice.
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const emit = defineEmits<{ navigate: [] }>();

const { locale, locales, t } = useI18n();
const switchLocalePath = useSwitchLocalePath();

const open = ref(false);
const root = ref<HTMLElement | null>(null);

type LocaleItem = { code: string; name: string; language?: string };
const available = computed(() => (locales.value as LocaleItem[]).map((l) => ({ ...l, name: l.name ?? l.code })));
const current = computed(() => available.value.find((l) => l.code === locale.value) ?? available.value[0]);

// Tell the keep-language plugin this change of language is intended.
const switching = useState<boolean>("ax-switching-language", () => false);

async function choose(code: string) {
    open.value = false;
    emit("navigate");
    if (code === locale.value) return;
    switching.value = true;
    await navigateTo(switchLocalePath(code));
}

function onDocumentClick(event: MouseEvent) {
    if (open.value && root.value && !root.value.contains(event.target as Node)) open.value = false;
}
function onKey(event: KeyboardEvent) {
    if (event.key === "Escape") open.value = false;
}

onMounted(() => {
    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onKey);
});
onBeforeUnmount(() => {
    document.removeEventListener("click", onDocumentClick);
    document.removeEventListener("keydown", onKey);
});
</script>

<style scoped>
.lang-switcher {
    position: relative;
    flex: 0 0 auto;
}

.lang-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 34px;
    padding: 0 10px;
    border: 1px solid rgba(198, 220, 239, 0.28);
    border-radius: 999px;
    background: transparent;
    color: #fff;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    cursor: pointer;
    transition: border-color 0.15s ease;
}

.lang-toggle:hover,
.open .lang-toggle {
    border-color: rgba(198, 220, 239, 0.7);
}

.lang-toggle:focus-visible,
.lang-option:focus-visible {
    outline: 2px solid #8bd9ff;
    outline-offset: 2px;
}

.globe {
    width: 15px;
    height: 15px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
}

.chevron {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    transition: transform 0.15s ease;
}

.open .chevron {
    transform: rotate(180deg);
}

.lang-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 50;
    min-width: 170px;
    margin: 0;
    padding: 6px;
    list-style: none;
    border: 1px solid rgba(147, 183, 218, 0.22);
    border-radius: 12px;
    background: #07111d;
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
}

.lang-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 9px 10px;
    border-radius: 8px;
    color: #c6dcef;
    font-size: 0.86rem;
    text-decoration: none;
}

.lang-option:hover {
    background: rgba(198, 220, 239, 0.08);
    color: #fff;
}

.lang-option .code {
    width: 22px;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: #8aa3ba;
}

.lang-option.active {
    color: #fff;
}

.lang-option.active .code {
    color: var(--ax-color-accent-red-soft, #ea3f30);
}

@media (max-width: 1100px) {
    .lang-menu {
        position: static;
        margin-top: 8px;
        box-shadow: none;
    }
}
</style>
