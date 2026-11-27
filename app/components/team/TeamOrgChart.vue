<template>
    <div class="org-chart" :class="{ 'is-narrow': narrow }" :aria-label="t('team.peopleAria')">
        <div class="org-scroll">
            <div class="org-roots">
                <TeamOrgNode
                    v-for="root in roots"
                    :key="root.id"
                    :member="root"
                    :reports-of="reportsOf"
                    :by-id="byId"
                    :label-mode="labelMode"
                    :narrow="narrow"
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
import { computed } from "vue";
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
    overflow-x: auto;
    padding: 6px 4vw 20px;
}

.org-roots {
    display: flex;
    justify-content: center;
    gap: 40px;
    width: max-content;
    min-width: 100%;
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
