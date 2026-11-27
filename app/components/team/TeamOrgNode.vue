<template>
    <div class="org-branch" :class="{ 'is-root': level === 0 }">
        <!-- A person: pill with the photo on the left, role and name on the right.
             An area: a plain box with its name. -->
        <component
            :is="clickable ? 'button' : 'div'"
            :type="clickable ? 'button' : undefined"
            class="org-card"
            :class="[`tone-${tone}`, { 'is-area': isArea, 'is-clickable': clickable }]"
            :aria-label="clickable ? t('team.discover', { name: member.name }) : undefined"
            @click="clickable && emit('select', member)"
        >
            <span v-if="!isArea" class="org-photo">
                <ContentResponsiveImage v-if="member.image" :src="member.image" :alt="member.name" :width="160" :height="160" sizes="96px" />
                <span v-else class="org-initials" aria-hidden="true">{{ initials(member.name) }}</span>
            </span>
            <span class="org-text">
                <span v-if="!isArea && showRole" class="org-role">{{ member.role }}</span>
                <span class="org-name">{{ member.name }}</span>
                <span v-if="!isArea && showDept" class="org-dept">{{ t("team.department", { name: member.department }) }}</span>
            </span>
        </component>

        <template v-if="kids.length">
            <span class="org-stem" aria-hidden="true"></span>

            <!-- Many boxes with nothing under them (e.g. the areas): two staggered
                 rows, each box hanging from the same dotted line, as in the slide. -->
            <div v-if="staggered && !narrow" class="org-stagger" :style="staggerStyle">
                <span class="org-bus" aria-hidden="true"></span>
                <div
                    v-for="(kid, i) in kids"
                    :key="kid.id"
                    class="org-slot"
                    :class="i % 2 ? 'is-low' : 'is-high'"
                    :style="{ gridColumn: `${i + 1} / span 2`, gridRow: `${(i % 2) + 1}` }"
                >
                    <TeamOrgNode :member="kid" :reports-of="reportsOf" :by-id="byId" :label-mode="labelMode" :narrow="narrow" :level="level + 1" @select="(m) => emit('select', m)" />
                </div>
            </div>

            <div v-else class="org-kids" :class="{ 'is-single': kids.length === 1 }">
                <div v-for="kid in kids" :key="kid.id" class="org-kid">
                    <TeamOrgNode :member="kid" :reports-of="reportsOf" :by-id="byId" :label-mode="labelMode" :narrow="narrow" :level="level + 1" @select="(m) => emit('select', m)" />
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
/**
 * One box of the organigramma and, under it, the people / areas that report
 * to it (update 80). Colours by place in the chart, as in the company slide:
 * the top of the company dark blue, people with a team teal, people without
 * a team mint, areas light blue.
 */
import { computed } from "vue";
import type { TeamMember } from "../../data/team";

const props = defineProps<{
    member: TeamMember;
    reportsOf: Record<string, string[]>;
    byId: Map<string, TeamMember>;
    labelMode: string;
    narrow: boolean;
    level: number;
}>();
const emit = defineEmits<{ select: [member: TeamMember] }>();
const { t } = useI18n();

const kids = computed(() => (props.reportsOf[props.member.id] ?? []).map((id) => props.byId.get(id)!).filter(Boolean));
const isArea = computed(() => props.member.kind === "area");
const isLeaf = (m: TeamMember) => !(props.reportsOf[m.id] ?? []).length;
const staggered = computed(() => kids.value.length > 3 && kids.value.every(isLeaf));

const staggerStyle = computed(() => {
    const n = kids.value.length;
    return {
        gridTemplateColumns: `repeat(${n + 1}, minmax(0, 1fr))`,
        width: `${(n + 1) * 150}px`,
        "--edge": `${100 / (n + 1)}%`,
    };
});

const tone = computed(() => {
    if (isArea.value) return "area";
    if (props.level === 0) return "top";
    return kids.value.length ? "lead" : "staff";
});

// An area opens a profile only if it has a description.
const clickable = computed(() => !isArea.value || Boolean((props.member.description || "").trim()));
const showRole = computed(() => props.labelMode !== "none" && Boolean((props.member.role || "").trim()));
const showDept = computed(() => ["department", "both"].includes(props.labelMode) && Boolean((props.member.department || "").trim()));

function initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
}
</script>

<style scoped>
.org-branch {
    --line: rgba(121, 207, 255, 0.55);
    --gap-y: 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

/* Cards */
.org-card {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 18px;
    box-sizing: border-box;
    width: 340px;
    min-height: 84px;
    padding: 8px 22px 8px 8px;
    border: 0;
    border-radius: 46px 12px 12px 46px;
    color: #fff;
    font: inherit;
    text-align: left;
    box-shadow: 0 14px 30px rgba(0, 0, 0, 0.28);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.org-card.is-clickable {
    cursor: pointer;
}

.org-card.is-clickable:hover,
.org-card.is-clickable:focus-visible {
    transform: translateY(-3px);
    box-shadow: 0 18px 38px rgba(0, 0, 0, 0.36), 0 0 0 2px #ff7568;
}

.org-card:focus-visible {
    outline: none;
}

.tone-top { background: #0b355b; }
.tone-lead { background: #1496b5; }
.tone-staff { background: #74c9b8; color: #062a40; }

.org-card.is-area {
    justify-content: center;
    width: 280px;
    min-height: 64px;
    height: 64px;
    padding: 8px 18px;
    border-radius: 12px;
    background: #2ec0e0;
    color: #062a40;
    text-align: center;
}

.org-photo {
    flex: none;
    width: 76px;
    height: 76px;
    overflow: hidden;
    border: 4px solid rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    background: #08263f;
    box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.12);
}

.org-photo :deep(img) {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
}

.org-initials {
    display: grid;
    width: 100%;
    height: 100%;
    place-items: center;
    color: #e8f7ff;
    font-size: 1.3rem;
    font-weight: 700;
}

.org-text {
    display: grid;
    gap: 3px;
    min-width: 0;
}

.org-role {
    font-size: 0.86rem;
    line-height: 1.3;
    opacity: 0.92;
}

.org-name {
    font-size: 1rem;
    font-weight: 800;
    line-height: 1.25;
}

.is-area .org-name {
    font-weight: 600;
}

.org-dept {
    justify-self: start;
    margin-top: 2px;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(2, 7, 18, 0.25);
    font-size: 0.64rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

/* Dotted connecting lines */
.org-stem {
    width: 0;
    height: var(--gap-y);
    border-left: 2px dotted var(--line);
}

.org-kids {
    display: flex;
    justify-content: center;
}

.org-kid {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--gap-y) 18px 0;
}

/* Vertical line down to each card, and the shared horizontal line. */
.org-kid::before {
    content: "";
    position: absolute;
    top: 0;
    left: 50%;
    height: var(--gap-y);
    border-left: 2px dotted var(--line);
}

.org-kid::after {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    border-top: 2px dotted var(--line);
}

.org-kid:first-child::after { left: 50%; }
.org-kid:last-child::after { right: 50%; }
.org-kids.is-single .org-kid::after { display: none; }

/* Staggered boxes: n boxes on n + 1 columns, every box two columns wide,
   odd ones one row lower, so each line drops between the boxes above. */
.org-stagger {
    --row: 64px;
    --row-gap: 18px;
    position: relative;
    display: grid;
    row-gap: var(--row-gap);
    padding-top: var(--gap-y);
}

.org-bus {
    position: absolute;
    top: 0;
    right: var(--edge);
    left: var(--edge);
    border-top: 2px dotted var(--line);
}

.org-slot {
    position: relative;
    display: flex;
    justify-content: center;
    min-width: 0;
    padding: 0 12px;
}

.org-slot > :deep(.org-branch),
.org-slot :deep(.org-card.is-area) {
    width: 100%;
}

.org-slot::before {
    content: "";
    position: absolute;
    bottom: 100%;
    left: 50%;
    height: var(--gap-y);
    border-left: 2px dotted var(--line);
}

.org-slot.is-low::before {
    height: calc(var(--gap-y) + var(--row) + var(--row-gap));
}

</style>

<style>
/* Narrow layout (set on the chart wrapper): kept unscoped so it reaches every level. */
.org-chart.is-narrow .org-branch {
    align-items: stretch;
}

.org-chart.is-narrow .org-card,
.org-chart.is-narrow .org-card.is-area {
    width: 100%;
}

.org-chart.is-narrow .org-card.is-area {
    justify-content: flex-start;
    height: auto;
    text-align: left;
}

.org-chart.is-narrow .org-stem {
    display: none;
}

.org-chart.is-narrow .org-kids {
    display: block;
    margin: 12px 0 0 22px;
    padding-left: 16px;
    border-left: 2px dotted rgba(121, 207, 255, 0.55);
}

.org-chart.is-narrow .org-kid {
    display: block;
    padding: 0 0 12px;
}

.org-chart.is-narrow .org-kid::before,
.org-chart.is-narrow .org-kid::after {
    display: none;
}
</style>
