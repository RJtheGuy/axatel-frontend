<template>
    <section class="coming-soon">
        <p class="eyebrow">{{ group }} · {{ eyebrow }}</p>
        <p class="status-label">Prossimamente</p>
        <h2>Stiamo preparando questa pagina.</h2>
        <div class="status-line" aria-hidden="true"><span></span></div>
        <NuxtLink to="/contatti" class="ax-cta-outline">Parla con noi</NuxtLink>
    </section>
</template>

<script setup lang="ts">
defineProps<{
    group: string;
    eyebrow: string;
}>();
</script>

<style scoped>
.coming-soon {
    max-width: 790px;
    padding: 12px 0 40px;
}

.eyebrow,
.status-label {
    color: #c52317;
    font-size: 0.76rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.status-label {
    margin: 56px 0 16px;
}

h2 {
    margin: 0;
    color: #0b355b;
    font-size: clamp(1.3rem, 2vw, 1.7rem);
    line-height: 1.12;
}

.status-line {
    height: 2px;
    margin: 38px 0;
    overflow: hidden;
    background: rgba(11, 53, 91, 0.18);
}

.status-line span {
    width: 34%;
    height: 100%;
    display: block;
    background: #c52317;
    animation: status-progress 2.4s ease-in-out infinite alternate;
}

@keyframes status-progress {
    to { transform: translateX(190%); }
}

@media (prefers-reduced-motion: reduce) {
    .status-line span {
        animation: none;
    }
}

.coming-soon :deep(.ax-cta-outline) {
    color: #0b355b;
    border-color: rgba(197, 35, 23, 0.55);
}
</style>