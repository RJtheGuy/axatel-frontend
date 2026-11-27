<template>
    <div ref="chartEl" class="org-chart" :class="{ 'is-narrow': outline }" :aria-label="t('team.peopleAria')">
        <div class="org-scroll">
            <div ref="rootsEl" class="org-roots" :style="outline || fit === 1 ? undefined : { zoom: fit }">
                <TeamOrgNode
                    v-for="root in roots"
                    :key="root.id"
                    :member="root"
                    :reports-of="reportsOf"
                    :by-id="byId"
                    :label-mode="labelMode"
                    :narrow="outline"
                    :level="0"
                    @select="(m) => emit('select', m)"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * Organigramma (update 80), drawn like the company slide: boxes joined by
 * dotted lines, top of the company first. Who is under whom comes from
 * "Riporta a" in Impostazioni → Team; entries of type "Area" are plain boxes.
 * Wide screens: a top-down chart (scrolls sideways if it is wider than the
 * screen). Phones: an indented outline.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import TeamOrgNode from "./TeamOrgNode.vue";
import type { TeamMember } from "../../data/team";

const props = defineProps<{
    members: TeamMember[];
    managerOf: Record<string, string | undefined>;
    reportsOf: Record<string, string[]>;
    labelMode: string;
    narrow: boolean;
}>();
const emit = defineEmits<{ select: [member: TeamMember] }>();
const { t } = useI18n();

// Fit the chart to the page (update 81): never a sideways scrollbar. If the
// chart is wider than the page it is shown a little smaller (down to 60%);
// if it would have to be smaller than that, it becomes the indented outline,
// as on phones.
const MIN_FIT = 0.6;
const chartEl = ref<HTMLElement | null>(null);
const rootsEl = ref<HTMLElement | null>(null);
const fit = ref(1);
const tooWide = ref(false);
const outline = computed(() => props.narrow || tooWide.value);

async function measure(): Promise<void> {
    if (props.narrow) return;
    // Back to the chart layout first, if the outline was showing.
    if (tooWide.value) {
        tooWide.value = false;
        await nextTick();
    }
    const roots = rootsEl.value;
    const chart = chartEl.value;
    if (!roots || !chart) return;
    // Lay the chart out at full size for a moment to read its real width.
    const previous = roots.style.zoom;
    roots.style.zoom = "1";
    const natural = roots.scrollWidth;
    roots.style.zoom = previous;
    const available = chart.clientWidth - 32;
    const scale = natural > available ? available / natural : 1;
    if (scale < MIN_FIT) {
        tooWide.value = true;
        fit.value = 1;
    } else {
        fit.value = Math.floor(scale * 1000) / 1000;
    }
}

let observer: ResizeObserver | undefined;
let lastWidth = 0;
onMounted(() => {
    nextTick(measure);
    observer = new ResizeObserver(() => {
        const width = chartEl.value?.clientWidth ?? 0;
        if (width !== lastWidth) {
            lastWidth = width;
            nextTick(measure);
        }
    });
    if (chartEl.value) observer.observe(chartEl.value);
});
onBeforeUnmount(() => observer?.disconnect());
watch(() => [props.members, props.narrow, props.labelMode], () => nextTick(measure));

const byId = computed(() => new Map(props.members.map((m) => [m.id, m])));

// Top of the chart: people with a team first, then the others, in CMS order.
const roots = computed(() => {
    const top = props.members.filter((m) => !props.managerOf[m.id]);
    const withTeam = top.filter((m) => (props.reportsOf[m.id] ?? []).length);
    return [...withTeam, ...top.filter((m) => !withTeam.includes(m))];
});
</script>

<style scoped>
.org-chart {
    position: relative;
    z-index: 3;
    width: 100%;
    padding: 36px 0 90px;
}

.org-scroll {
    padding: 6px 16px 20px;
}

.org-roots {
    display: flex;
    justify-content: center;
    gap: 40px;
    width: max-content;
    margin: 0 auto;
}

.org-chart.is-narrow .org-scroll {
    overflow: visible;
    padding: 0 18px;
}

.org-chart.is-narrow .org-roots {
    display: grid;
    gap: 22px;
    width: auto;
}
</style>
