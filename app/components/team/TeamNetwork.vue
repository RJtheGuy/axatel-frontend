<template>
    <section ref="stageEl" class="team-stage" :class="{ 'has-selection': selectedMember }">
        <TeamNeuralBackground :focused="Boolean(selectedMember)" />

        <header class="team-heading">
            <h1>Team</h1>
            <p>Nessuno risolve un problema da solo</p>
        </header>

        <div class="team-field" aria-label="Persone del team Axatel">
            <button
                v-for="(member, index) in members"
                :key="member.id"
                class="team-member"
                :class="{ 'is-selected': selectedMember?.id === member.id }"
                :style="memberStyle(member, index)"
                type="button"
                :aria-label="`Scopri ${member.name}`"
                :aria-pressed="selectedMember?.id === member.id"
                @click="selectMember(member)"
            >
                <span class="portrait">
                    <img :src="member.image" :alt="member.name" width="180" height="180" />
                </span>
                <span class="member-name">{{ member.name }}</span>
            </button>
        </div>

        <Transition name="profile">
            <article v-if="selectedMember" class="member-profile" aria-live="polite">
                <p class="profile-kicker">Il nostro team</p>
                <h2>{{ selectedMember.name }}</h2>
                <p>{{ selectedMember.description }}</p>
                <button type="button" class="back-button" @click="clearSelection">Torna al team</button>
            </article>
        </Transition>
    </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import TeamNeuralBackground from "./TeamNeuralBackground.vue";
import type { TeamMember } from "../../data/team";

defineProps<{ members: TeamMember[] }>();
const stageEl = ref<HTMLElement | null>(null);
const selectedMember = ref<TeamMember | null>(null);

function memberStyle(member: TeamMember, index: number): Record<string, string> {
    const horizontal = 4 + (index * 3) % 9;
    const vertical = 5 + (index * 5) % 10;
    const direction = index % 2 === 0 ? 1 : -1;

    return {
        "--member-x": `${member.position.x}%`,
        "--member-y": `${member.position.y}%`,
        "--float-delay": `${index * -0.73}s`,
        "--float-duration": `${6.2 + (index * 1.13) % 4.8}s`,
        "--drift-x-a": `${horizontal * direction}px`,
        "--drift-y-a": `${-vertical}px`,
        "--drift-x-b": `${-horizontal * 0.72 * direction}px`,
        "--drift-y-b": `${vertical * 0.62}px`,
        "--drift-x-c": `${horizontal * 0.38 * direction}px`,
        "--drift-y-c": `${vertical * 0.9}px`,
        "--drift-rotate": `${direction * (0.6 + index % 3 * 0.35)}deg`,
        "--stack-order": `${index}`
    };
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
    font-family: "forma-djr-micro", sans-serif;
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
    width: clamp(94px, 9vw, 138px);
    display: grid;
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

.member-name {
    width: max-content;
    max-width: 150px;
    color: #e8f7ff;
    font-size: clamp(0.72rem, 1vw, 0.88rem);
    font-weight: 700;
    text-shadow: 0 2px 12px #020712;
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
        width: 88px;
    }

    .team-member:nth-child(1) { --member-x: 17% !important; --member-y: 29% !important; }
    .team-member:nth-child(2) { --member-x: 49% !important; --member-y: 32% !important; }
    .team-member:nth-child(3) { --member-x: 82% !important; --member-y: 29% !important; }
    .team-member:nth-child(4) { --member-x: 27% !important; --member-y: 44% !important; }
    .team-member:nth-child(5) { --member-x: 70% !important; --member-y: 45% !important; }
    .team-member:nth-child(6) { --member-x: 15% !important; --member-y: 59% !important; }
    .team-member:nth-child(7) { --member-x: 50% !important; --member-y: 61% !important; }
    .team-member:nth-child(8) { --member-x: 84% !important; --member-y: 59% !important; }
    .team-member:nth-child(9) { --member-x: 30% !important; --member-y: 76% !important; }
    .team-member:nth-child(10) { --member-x: 70% !important; --member-y: 77% !important; }

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