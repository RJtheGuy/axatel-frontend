<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { NavigationItem } from "../../types/navigation";
import { isBlogHref, useBlogUpdates } from "../../composables/useBlogUpdates";

const props = defineProps<{
    item: NavigationItem;
    mobileExpanded?: boolean;
}>();

const emit = defineEmits<{
    navigate: [];
    toggleMobile: [label: string];
}>();

const dropdown = ref<HTMLDetailsElement | null>(null);

// "New posts" badge next to the Blog link, and a small dot on the menu and
// group that contain it, so the badge is findable without opening every menu.
const { t } = useI18n();
const { count: newPosts } = useBlogUpdates();
const badgeText = computed(() => (newPosts.value > 9 ? "9+" : String(newPosts.value)));
const badgeLabel = computed(() =>
    newPosts.value === 1 ? t("blog.newPostsOne") : t("blog.newPosts", { count: newPosts.value })
);
const groupHasNew = (group: { links?: Array<{ href?: string }> }) =>
    newPosts.value > 0 && Boolean(group.links?.some((l) => isBlogHref(l.href)));
const itemHasNew = computed(() => (props.item.groups ?? []).some(groupHasNew));
const activeMobileGroup = ref<number | null>(null);

// Desktop dropdown columns. A group with "Colonna" set in the CMS goes in
// that column; the others go under the column that is shortest so far, so
// a long group and two short ones balance out. Inside a column groups keep
// the CMS order. On phones the groups are a plain
// list in CMS order (see the `order` style below).
type NavGroup = NonNullable<NavigationItem["groups"]>[number];
const groupWeight = (group: NavGroup) => 1.4 + (group.links?.length ?? 0);
const dropdownColumns = computed(() => {
    const groups = props.item.groups ?? [];
    const wanted = Math.max(0, ...groups.map((group) => Number(group.column) || 0));
    const count = Math.min(3, Math.max(groups.length > 1 ? 2 : 1, wanted));
    const columns = Array.from({ length: count }, () => ({ entries: [] as Array<{ group: NavGroup; index: number }>, weight: 0 }));
    const put = (column: (typeof columns)[number], group: NavGroup, index: number) => {
        column.entries.push({ group, index });
        column.weight += groupWeight(group);
    };
    // One pass in menu order, so setting a column on one group leaves the
    // groups before it where they were.
    groups.forEach((group, index) => {
        const fixed = Number(group.column) || 0;
        const target = fixed
            ? columns[Math.min(fixed, count) - 1]!
            : columns.reduce((best, column) => (column.weight < best.weight ? column : best));
        put(target, group, index);
    });
    return columns.filter((column) => column.entries.length > 0);
});

const isDesktop = () => window.matchMedia("(min-width: 1101px)").matches;

const openOnHover = () => {
    if (dropdown.value && isDesktop()) {
        dropdown.value.open = true;
    }
};

const closeOnLeave = () => {
    if (dropdown.value && isDesktop()) {
        dropdown.value.open = false;
    }
};

const handleSummaryClick = (event: MouseEvent) => {
    if (isDesktop()) {
        event.preventDefault();
        return;
    }

    event.preventDefault();
    emit("toggleMobile", props.item.label);
};

const toggleMobileGroup = (index: number) => {
    if (isDesktop()) return;

    activeMobileGroup.value = activeMobileGroup.value === index ? null : index;
};

watch(() => props.mobileExpanded, (expanded) => {
    if (dropdown.value && !isDesktop()) {
        dropdown.value.open = Boolean(expanded);
    }

    if (!expanded) {
        activeMobileGroup.value = null;
    }
});
</script>

<template>
    <NuxtLink
        v-if="item.href"
        class="nav-link"
        :to="item.href"
        @click="emit('navigate')"
    >
        {{ item.label }}
        <span v-if="isBlogHref(item.href) && newPosts > 0" class="new-badge" :aria-label="badgeLabel">{{ badgeText }}</span>
    </NuxtLink>

    <details
        v-else
        ref="dropdown"
        class="nav-dropdown"
        @mouseenter="openOnHover"
        @mouseleave="closeOnLeave"
    >
        <summary class="nav-link" @click="handleSummaryClick">
            <span class="summary-label">
                {{ item.label }}
                <span v-if="itemHasNew" class="new-dot" aria-hidden="true" />
            </span>
            <svg class="chevron" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m7 10 5 5 5-5" />
            </svg>
        </summary>

        <div class="dropdown-panel" :style="{ '--dropdown-columns': String(Math.max(dropdownColumns.length, 1)) }">
            <div v-for="(column, columnIndex) in dropdownColumns" :key="columnIndex" class="dropdown-column">
            <section
                v-for="{ group, index: groupIndex } in column.entries"
                :key="group.label"
                class="dropdown-group"
                :class="{ 'group-open': activeMobileGroup === groupIndex }"
                :style="{ order: groupIndex }"
            >
                <button
                    class="group-toggle"
                    type="button"
                    :aria-expanded="activeMobileGroup === groupIndex"
                    @click="toggleMobileGroup(groupIndex)"
                >
                    <span class="summary-label">
                        {{ group.label }}
                        <span v-if="groupHasNew(group)" class="new-dot group-dot" aria-hidden="true" />
                    </span>
                    <svg class="group-chevron" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m7 10 5 5 5-5" />
                    </svg>
                </button>

                <div class="group-links">
                    <NuxtLink
                        v-for="link in group.links"
                        :key="`${group.label}-${link.label}`"
                        :to="link.href"
                        :target="link.open_in_new_tab ? '_blank' : undefined"
                        @click="emit('navigate')"
                    >
                        <span>{{ link.label }}</span>
                        <span
                            v-if="isBlogHref(link.href) && newPosts > 0"
                            class="new-badge"
                            :aria-label="badgeLabel"
                            :title="badgeLabel"
                        >{{ badgeText }}</span>
                    </NuxtLink>
                </div>
            </section>
            </div>
        </div>
    </details>
</template>

<style scoped>
.nav-link {
    display: flex;
    min-height: 36px;
    align-items: center;
    gap: 8px;
    border: 0;
    color: #fff;
    font-size: 0.76rem;
    font-weight: 400;
    letter-spacing: 0.035em;
    line-height: 1.2;
    text-decoration: none;
    cursor: pointer;
    white-space: nowrap;
}

.nav-link:hover,
.nav-link:focus-visible,
.nav-dropdown:hover > .nav-link,
.nav-dropdown:focus-within > .nav-link,
.nav-dropdown[open] > .nav-link {
    color: #fff;
}

.nav-dropdown {
    position: relative;
}

.nav-dropdown::after {
    content: "";
    position: absolute;
    right: 0;
    bottom: 2px;
    left: 0;
    height: 2px;
    background: var(--ax-color-accent-red-soft);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.2s ease;
}

.nav-dropdown:hover::after,
.nav-dropdown:focus-within::after,
.nav-dropdown[open]::after {
    transform: scaleX(1);
}

summary {
    list-style: none;
}

summary::-webkit-details-marker {
    display: none;
}

.chevron {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    transition: transform 0.2s ease;
}

.nav-dropdown:hover .chevron,
.nav-dropdown:focus-within .chevron,
.nav-dropdown[open] .chevron {
    transform: rotate(180deg);
}

.dropdown-panel {
    position: absolute;
    top: calc(100% + 12px);
    left: 50%;
    display: grid;
    grid-template-columns: repeat(var(--dropdown-columns, 2), minmax(180px, 1fr));
    width: max-content;
    min-width: 420px;
    max-width: min(680px, calc(100vw - 40px));
    padding: 24px;
    gap: 24px 34px;
    border: 1px solid var(--ax-color-border-soft);
    border-radius: 8px;
    background: rgba(5, 15, 25, 0.96);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.42);
    backdrop-filter: blur(22px);
    transform: translateX(-50%);
}

.dropdown-column {
    display: flex;
    flex-direction: column;
    gap: 24px;
    min-width: 0;
}

.dropdown-panel::before {
    content: "";
    position: absolute;
    top: -13px;
    left: 0;
    width: 100%;
    height: 13px;
}

.group-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 9px;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--ax-color-text-secondary);
    font-size: 0.64rem;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-align: left;
    text-transform: uppercase;
    cursor: default;
}

.group-toggle::before {
    content: "";
    width: 14px;
    height: 2px;
    flex: 0 0 14px;
    background: var(--ax-color-accent-red-soft);
}

.group-chevron {
    display: none;
    width: 16px;
    height: 16px;
    margin-left: auto;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    transition: transform 0.2s ease;
}

.group-links {
    display: block;
}

.dropdown-group a {
    display: flex;
    min-height: 36px;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    color: #fff;
    font-size: 0.8rem;
    font-weight: 350;
    letter-spacing: 0.025em;
    text-decoration: none;
    transition: color 0.2s ease, transform 0.2s ease;
}

.dropdown-group a:hover,
.dropdown-group a:focus-visible {
    color: var(--ax-color-accent-red-soft);
    transform: translateX(3px);
}

.summary-label {
    position: relative;
    display: inline-flex;
    align-items: center;
}

/* Small red dot: "something new inside this menu". */
.new-dot {
    position: absolute;
    top: -3px;
    right: -8px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--ax-color-accent-red-soft, #e2493d);
    box-shadow: 0 0 0 2px rgba(5, 15, 25, 0.9);
    animation: new-dot-pulse 2.4s ease-out 2;
}

.group-dot {
    position: static;
    margin-left: 8px;
    box-shadow: none;
}

/* Count pill next to the Blog link. */
.new-badge {
    display: inline-grid;
    place-items: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: var(--ax-color-accent-red-soft, #e2493d);
    color: #fff;
    font-size: 0.64rem;
    font-weight: 700;
    letter-spacing: 0;
    line-height: 1;
    font-variant-numeric: tabular-nums;
}

/* Desktop: keep the pill next to the word, not at the far edge. */
@media (min-width: 1101px) {
    .dropdown-group a .new-badge {
        margin-right: auto;
        margin-left: -10px;
    }
}

.dropdown-group a:hover .new-badge,
.dropdown-group a:focus-visible .new-badge {
    color: #fff;
}

@keyframes new-dot-pulse {
    0% {
        box-shadow: 0 0 0 0 rgba(226, 73, 61, 0.6);
    }
    100% {
        box-shadow: 0 0 0 8px rgba(226, 73, 61, 0);
    }
}

@media (prefers-reduced-motion: reduce) {
    .new-dot {
        animation: none;
    }
}

@media (min-width: 1101px) {
    .nav-dropdown > .dropdown-panel {
        display: none;
    }

    .nav-dropdown:hover > .dropdown-panel,
    .nav-dropdown:focus-within > .dropdown-panel,
    .nav-dropdown[open] > .dropdown-panel {
        display: grid;
    }

    .nav-dropdown:nth-last-child(-n + 2) .dropdown-panel {
        right: 0;
        left: auto;
        transform: none;
    }
}

@media (max-width: 1100px) {
    .nav-link {
        width: 100%;
        min-height: 48px;
        justify-content: space-between;
        font-size: 0.94rem;
        letter-spacing: 0.02em;
    }

    .nav-dropdown {
        width: 100%;
        border-bottom: 1px solid rgba(198, 220, 239, 0.14);
    }

    .nav-dropdown::after {
        display: none;
    }

    .dropdown-panel {
        position: static;
        display: flex;
        flex-direction: column;
        width: 100%;
        min-width: 0;
        max-width: none;
        padding: 4px 0 14px 14px;
        gap: 0;
        border: 0;
        background: transparent;
        box-shadow: none;
        backdrop-filter: none;
        transform: none;
    }

    /* Phones: one list in CMS order, whatever the desktop columns. */
    .dropdown-column {
        display: contents;
    }

    .dropdown-group {
        border-left: 1px solid rgba(198, 220, 239, 0.14);
    }

    .group-toggle {
        min-height: 46px;
        margin: 0;
        padding: 0 12px;
        color: #fff;
        font-size: 0.76rem;
        letter-spacing: 0.08em;
        cursor: pointer;
    }

    .group-toggle::before {
        width: 10px;
        flex-basis: 10px;
    }

    .group-chevron {
        display: block;
    }

    .group-open .group-chevron {
        transform: rotate(180deg);
    }

    .group-links {
        display: none;
        padding: 0 14px 10px 30px;
    }

    .group-open .group-links {
        display: block;
    }

    .dropdown-group a {
        min-height: 40px;
    }
}

@media (max-width: 560px) {
    .dropdown-panel {
        gap: 0;
    }
}
</style>