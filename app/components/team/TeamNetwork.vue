<template>
    <section
        ref="stageEl"
        class="team-stage"
        :class="{ 'has-selection': selectedMember, 'is-tree': isTree, 'is-narrow-tree': isTree && isNarrow }"
        :style="stageStyle"
    >
        <TeamNeuralBackground :focused="Boolean(selectedMember)" :edges="edges" />

        <header class="team-heading">
            <h1>{{ t("team.title") }}</h1>
            <p>{{ t("team.subtitle") }}</p>
        </header>

        <div class="team-field" :aria-label="t('team.peopleAria')">
            <button
                v-for="(member, index) in members"
                :key="member.id"
                class="team-member"
                :class="{ 'is-selected': selectedMember?.id === member.id }"
                :style="memberStyle(member, index)"
                type="button"
                :aria-label="t('team.discover', { name: member.name })"
                :aria-pressed="selectedMember?.id === member.id"
                @click="selectMember(member)"
            >
                <span class="portrait">
                    <img v-if="member.image" :src="member.image" :alt="member.name" width="180" height="180" loading="lazy" decoding="async" />
                    <span v-else class="initials" aria-hidden="true">{{ initials(member.name) }}</span>
                </span>
                <span class="member-name">{{ member.name }}</span>
                <span v-if="showRole(member)" class="member-role">{{ member.role }}</span>
                <span v-if="showDepartment(member)" class="member-dept">{{ t("team.department", { name: member.department }) }}</span>
            </button>
        </div>

        <Transition name="profile">
            <article v-if="selectedMember" class="member-profile" aria-live="polite">
                <p class="profile-kicker">{{ selectedMember.role || t("team.kicker") }}</p>
                <h2>{{ selectedMember.name }}</h2>
                <p v-if="selectedDepartment" class="profile-dept">{{ t("team.department", { name: selectedDepartment }) }}</p>
                <p>{{ selectedMember.description }}</p>
                <dl v-if="selectedManagers.length || selectedReports.length" class="profile-links">
                    <div v-if="selectedManagers.length">
                        <dt>{{ t("team.reportsTo") }}</dt>
                        <dd>
                            <button v-for="person in selectedManagers" :key="person.id" type="button" @click="selectMember(person)">{{ person.name }}</button>
                        </dd>
                    </div>
                    <div v-if="selectedReports.length">
                        <dt>{{ t("team.directReports") }}</dt>
                        <dd>
                            <button v-for="person in selectedReports" :key="person.id" type="button" @click="selectMember(person)">{{ person.name }}</button>
                        </dd>
                    </div>
                </dl>
                <button type="button" class="back-button" @click="clearSelection">{{ t("team.back") }}</button>
            </article>
        </Transition>
    </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import TeamNeuralBackground from "./TeamNeuralBackground.vue";
import type { TeamMember } from "../../data/team";
import { hasHierarchy, layoutTree } from "../../utils/teamTree";

// labelMode (Impostazioni → Team → Etichetta sotto il nome): what the org
// chart shows under each name: "department" (under department heads),
// "role" (under everyone), "both" or "none".
const props = withDefaults(defineProps<{ members: TeamMember[]; labelMode?: string }>(), { labelMode: "department" });
const stageEl = ref<HTMLElement | null>(null);
const selectedMember = ref<TeamMember | null>(null);
const { t } = useI18n();

// Phones get an indented outline instead of a wide tree. Decided after
// the page has loaded, so the server-rendered HTML always matches.
const isNarrow = ref(false);
let narrowQuery: MediaQueryList | null = null;
const syncNarrow = () => { isNarrow.value = Boolean(narrowQuery?.matches); };
onMounted(() => {
    narrowQuery = window.matchMedia("(max-width: 760px)");
    syncNarrow();
    narrowQuery.addEventListener("change", syncNarrow);
});
onBeforeUnmount(() => narrowQuery?.removeEventListener("change", syncNarrow));

// Org chart when people report to each other (Riporta a in the CMS);
// otherwise the original free-floating network.
const isTree = computed(() => hasHierarchy(props.members));
const tree = computed(() => (isTree.value ? layoutTree(props.members, isNarrow.value ? "narrow" : "wide") : null));
const byId = computed(() => new Map(props.members.map((m) => [m.id, m])));

function positionOf(member: TeamMember): { x: number; y: number } {
    return tree.value?.positions[member.id] ?? member.position;
}

// Lines for the background: only manager → person in tree mode. While a
// profile is open the people are stacked, so no lines are drawn.
const edges = computed(() => (tree.value ? (selectedMember.value ? [] : tree.value.edges) : null));

const stageStyle = computed<Record<string, string>>(() => {
    if (!tree.value) return {};
    const { rows, columns } = tree.value;
    // Each row holds the photo, the labels under it and room for the line.
    const labelSpace = { both: 72, department: 50, role: 44 }[props.labelMode] ?? 24;
    if (isNarrow.value) return { "--tree-height": `${rows * (72 + labelSpace + 40)}px`, "--member-size": "72px" };
    const size = Math.max(70, Math.min(124, Math.floor(1040 / columns) - 26));
    const rowHeight = size + labelSpace + 66;
    return { "--tree-height": `${Math.max(rows * rowHeight, 380)}px`, "--member-size": `${size}px` };
});

const showDepartment = (member: TeamMember) =>
    Boolean(isTree.value && ["department", "both"].includes(props.labelMode) && (member.department || "").trim());
const showRole = (member: TeamMember) =>
    Boolean(isTree.value && ["role", "both"].includes(props.labelMode) && (member.role || "").trim());

const selectedDepartment = computed(() =>
    selectedMember.value && tree.value ? tree.value.departmentOf[selectedMember.value.id] || "" : ""
);
// Main manager first, then the "also reports to" ones; the same for the team.
const selectedManagers = computed(() => {
    const id = selectedMember.value?.id;
    if (!id || !tree.value) return [];
    const ids = [tree.value.managerOf[id], ...(tree.value.alsoManagersOf[id] ?? [])].filter(Boolean) as string[];
    return ids.map((x) => byId.value.get(x)!).filter(Boolean);
});
const selectedReports = computed(() => {
    const id = selectedMember.value?.id;
    if (!id || !tree.value) return [];
    const ids = [...(tree.value.reportsOf[id] ?? []), ...(tree.value.alsoReportsOf[id] ?? [])];
    return [...new Set(ids)].map((x) => byId.value.get(x)!).filter(Boolean);
});

function memberStyle(member: TeamMember, index: number): Record<string, string> {
    // In the org chart people drift less, so the branches stay readable.
    const calm = isTree.value ? 0.35 : 1;
    const horizontal = (4 + (index * 3) % 9) * calm;
    const vertical = (5 + (index * 5) % 10) * calm;
    const direction = index % 2 === 0 ? 1 : -1;
    const position = positionOf(member);

    return {
        "--member-x": `${position.x}%`,
        "--member-y": `${position.y}%`,
        "--float-delay": `${index * -0.73}s`,
        "--float-duration": `${6.2 + (index * 1.13) % 4.8}s`,
        "--drift-x-a": `${horizontal * direction}px`,
        "--drift-y-a": `${-vertical}px`,
        "--drift-x-b": `${-horizontal * 0.72 * direction}px`,
        "--drift-y-b": `${vertical * 0.62}px`,
        "--drift-x-c": `${horizontal * 0.38 * direction}px`,
        "--drift-y-c": `${vertical * 0.9}px`,
        "--drift-rotate": `${direction * (0.6 + index % 3 * 0.35) * calm}deg`,
        "--stack-order": `${index}`
    };
}

// Shown instead of a photo when none was uploaded: "Mario Rossi" → "MR".
function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
}

function selectMember(member: TeamMember): void {
    selectedMember.value = member;
}

function clearSelection(): void {
    selectedMember.value = null;
}
</script>

<style scoped>
.team-stage {
    position: relative;
    width: 100%;
    min-height: 100svh;
    overflow: hidden;
    isolation: isolate;
    background:
        radial-gradient(circle at 50% 48%, rgba(24, 89, 128, 0.28), transparent 38%),
        linear-gradient(145deg, #081727 0%, #020712 72%);
}

.team-heading {
    position: relative;
    z-index: 2;
    width: min(760px, 90vw);
    margin: 0 auto;
    padding-top: calc(var(--ax-navbar-height, 74px) + 2vh);
    text-align: center;
    transition: opacity 0.45s ease, transform 0.45s ease;
}

.team-heading h1 {
    margin: 0;
    color: #f3fbff;
    font-family: Montserrat, system-ui, sans-serif;
    font-size: clamp(4.5rem, 10vw, 8rem);
    font-weight: 350;
    line-height: 0.95;
    text-shadow: 0 0 34px rgba(121, 207, 255, 0.22);
}

.team-heading p {
    margin: 14px 0 0;
    color: var(--ax-color-text-secondary);
    font-size: clamp(1.05rem, 2vw, 1.45rem);
    line-height: 1.4;
}

.team-field {
    position: absolute;
    top: clamp(290px, 34vh, 350px);
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 3;
    transition: top 0.5s ease;
}

.team-member {
    position: absolute;
    top: var(--member-y);
    left: var(--member-x);
    width: var(--member-size, clamp(94px, 9vw, 138px));
    display: grid;
    /* One fixed column: a long name or department label overflows on both
       sides instead of making the photo circle bigger. */
    grid-template-columns: 100%;
    justify-items: center;
    gap: 10px;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--ax-color-text-primary);
    font: inherit;
    cursor: pointer;
    transform: translate(-50%, -50%);
    animation: member-float var(--float-duration) ease-in-out var(--float-delay) infinite;
    transition: top 0.72s cubic-bezier(0.22, 1, 0.36, 1), left 0.72s cubic-bezier(0.22, 1, 0.36, 1), transform 0.72s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease;
}

.portrait {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    display: block;
    overflow: hidden;
    border: 2px solid rgba(121, 207, 255, 0.56);
    border-radius: 50%;
    background: #0b355b;
    box-shadow: 0 0 0 7px rgba(121, 207, 255, 0.05), 0 16px 34px rgba(0, 0, 0, 0.34);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.portrait img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
}

.initials {
    display: grid;
    width: 100%;
    height: 100%;
    place-items: center;
    color: #e8f7ff;
    font-size: clamp(1rem, 2.4vw, 1.6rem);
    font-weight: 600;
    letter-spacing: 0.04em;
}

.member-name {
    width: max-content;
    max-width: 150px;
    color: #e8f7ff;
    font-size: clamp(0.72rem, 1vw, 0.88rem);
    font-weight: 700;
    text-shadow: 0 2px 12px #020712;
}

/* Org chart: the stage grows with the number of rows. */
.team-stage.is-tree:not(.has-selection) {
    min-height: max(100svh, calc(clamp(290px, 34vh, 350px) + var(--tree-height, 0px) + 60px));
}

.team-stage.is-tree:not(.has-selection) .team-field {
    bottom: auto;
    height: var(--tree-height, 60%);
}

.member-dept {
    margin-top: -4px;
    padding: 3px 9px;
    border: 1px solid rgba(255, 117, 104, 0.5);
    border-radius: 999px;
    background: rgba(2, 7, 18, 0.72);
    color: #ffb1a8;
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
}

/* In the org chart the lines run behind the labels: a soft backdrop keeps
   names and roles readable where a line passes. */
.team-stage.is-tree .member-name,
.member-role {
    padding: 1px 7px;
    border-radius: 6px;
    background: rgba(2, 7, 18, 0.66);
}

.member-role {
    max-width: 170px;
    margin-top: -6px;
    color: #79cfff;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    line-height: 1.25;
    text-align: center;
    text-shadow: 0 2px 10px #020712;
}

.has-selection .member-dept,
.has-selection .member-role {
    opacity: 0;
}

.profile-dept {
    margin: 6px 0 0;
    color: #79cfff;
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.profile-links {
    display: grid;
    gap: 10px;
    margin: 0 auto 24px;
    max-width: 470px;
}

.profile-links div {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: baseline;
    gap: 6px 10px;
}

.profile-links dt {
    color: var(--ax-color-text-secondary);
    font-size: 0.8rem;
}

.profile-links dd {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
    margin: 0;
}

.profile-links button {
    padding: 5px 12px;
    border: 1px solid rgba(121, 207, 255, 0.4);
    border-radius: 999px;
    background: transparent;
    color: var(--ax-color-text-primary);
    font: inherit;
    font-size: 0.84rem;
    cursor: pointer;
}

.profile-links button:hover,
.profile-links button:focus-visible {
    border-color: #ff7568;
}

.team-member:hover .portrait,
.team-member:focus-visible .portrait {
    border-color: #ff7568;
    box-shadow: 0 0 0 8px rgba(197, 35, 23, 0.1), 0 18px 42px rgba(0, 0, 0, 0.42);
}

.team-member:focus-visible {
    outline: 2px solid #ff7568;
    outline-offset: 8px;
    border-radius: 50%;
}

.has-selection .team-heading {
    opacity: 0;
    transform: translateY(-24px);
    pointer-events: none;
}

.has-selection .team-field {
    top: 0;
}

.has-selection .team-member {
    top: calc(var(--ax-navbar-height, 74px) + 7vh);
    left: 50%;
    z-index: calc(10 - var(--stack-order));
    transform: translate(calc(-50% + var(--stack-order) * 2px), calc(var(--stack-order) * 2px)) scale(0.82);
    animation: none;
}

.has-selection .team-member:not(.is-selected) .member-name {
    opacity: 0;
}

.has-selection .team-member.is-selected {
    z-index: 20;
    transform: translate(-50%, 0) scale(1);
}

.has-selection .team-member.is-selected .member-name {
    opacity: 0;
}

.member-profile {
    position: absolute;
    top: calc(var(--ax-navbar-height, 74px) + 31vh);
    left: 50%;
    z-index: 4;
    width: min(560px, calc(100vw - 36px));
    padding: 26px 0;
    border-top: 1px solid rgba(121, 207, 255, 0.24);
    text-align: center;
    transform: translateX(-50%);
}

.profile-kicker {
    margin: 0 0 8px;
    color: #ff7568;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.member-profile h2 {
    margin: 0;
    color: var(--ax-color-text-primary);
    font-size: clamp(1.8rem, 4vw, 3rem);
}

.member-profile > p:not(.profile-kicker) {
    max-width: 470px;
    margin: 14px auto 24px;
    color: var(--ax-color-text-secondary);
    line-height: 1.7;
}

.back-button {
    padding: 11px 18px;
    border: 1px solid rgba(255, 117, 104, 0.74);
    background: transparent;
    color: var(--ax-color-text-primary);
    font: inherit;
    font-weight: 800;
    cursor: pointer;
}

.profile-enter-active,
.profile-leave-active {
    transition: opacity 0.35s ease, transform 0.35s ease;
}

.profile-enter-from,
.profile-leave-to {
    opacity: 0;
    transform: translate(-50%, 18px);
}

@keyframes member-float {
    0% {
        transform: translate(-50%, -50%) translate3d(var(--drift-x-a), var(--drift-y-a), 0) rotate(var(--drift-rotate));
    }
    34% {
        transform: translate(-50%, -50%) translate3d(var(--drift-x-b), var(--drift-y-b), 0) rotate(calc(var(--drift-rotate) * -0.7));
    }
    69% {
        transform: translate(-50%, -50%) translate3d(var(--drift-x-c), var(--drift-y-c), 0) rotate(calc(var(--drift-rotate) * 0.4));
    }
    100% {
        transform: translate(-50%, -50%) translate3d(var(--drift-x-a), var(--drift-y-a), 0) rotate(var(--drift-rotate));
    }
}

@media (max-width: 760px) {
    .team-stage {
        min-height: 1120px;
    }

    .team-heading {
        padding-top: calc(var(--ax-navbar-height, 78px) + 1vh);
    }

    .team-heading p {
        margin-top: 10px;
    }

    .team-field {
        top: 260px;
    }

    .team-member {
        width: var(--member-size, 88px);
    }

    .is-narrow-tree .member-name {
        max-width: 120px;
    }

    .team-stage:not(.is-tree) .team-member:nth-child(1) { --member-x: 17% !important; --member-y: 29% !important; }
    .team-stage:not(.is-tree) .team-member:nth-child(2) { --member-x: 49% !important; --member-y: 32% !important; }
    .team-stage:not(.is-tree) .team-member:nth-child(3) { --member-x: 82% !important; --member-y: 29% !important; }
    .team-stage:not(.is-tree) .team-member:nth-child(4) { --member-x: 27% !important; --member-y: 44% !important; }
    .team-stage:not(.is-tree) .team-member:nth-child(5) { --member-x: 70% !important; --member-y: 45% !important; }
    .team-stage:not(.is-tree) .team-member:nth-child(6) { --member-x: 15% !important; --member-y: 59% !important; }
    .team-stage:not(.is-tree) .team-member:nth-child(7) { --member-x: 50% !important; --member-y: 61% !important; }
    .team-stage:not(.is-tree) .team-member:nth-child(8) { --member-x: 84% !important; --member-y: 59% !important; }
    .team-stage:not(.is-tree) .team-member:nth-child(9) { --member-x: 30% !important; --member-y: 76% !important; }
    .team-stage:not(.is-tree) .team-member:nth-child(10) { --member-x: 70% !important; --member-y: 77% !important; }

    .has-selection {
        min-height: 100svh;
    }

    .has-selection .team-member {
        top: calc(var(--ax-navbar-height, 78px) + 3vh);
    }

    .member-profile {
        top: calc(var(--ax-navbar-height, 78px) + 27vh);
    }
}

@media (prefers-reduced-motion: reduce) {
    .team-member {
        animation: none;
    }

    .profile-enter-active,
    .profile-leave-active {
        transition: none;
    }
}
</style>