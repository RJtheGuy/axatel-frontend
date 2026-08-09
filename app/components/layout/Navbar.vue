<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

/* ------------------------------------------------------------------
 * Navigation content comes from the CMS:
 *   Wagtail admin -> Impostazioni -> Navigazione
 *
 * Falls back to the previously hardcoded links whenever the settings
 * fetch fails or nobody has filled the panel in yet, so the navbar can
 * never end up empty. useSiteSettings() already swallows fetch errors
 * and returns null.
 * ------------------------------------------------------------------ */
const { settings } = useSiteSettings()

const DEFAULT_LINKS = [
    { label: 'Applicativi', url: '/#applicativi', open_in_new_tab: false },
    { label: 'Settori', url: '/#settori', open_in_new_tab: false },
]

const links = computed(() =>
    settings.value?.navigation?.links?.length
        ? settings.value.navigation.links
        : DEFAULT_LINKS
)

const cta = computed(() => {
    const c = settings.value?.navigation?.cta
    if (!c) {
        return { visible: true, label: 'Parla con un esperto', url: '/contatti' }
    }
    return {
        visible: c.visible !== false,
        label: c.label || 'Parla con un esperto',
        url: c.url || '/contatti',
    }
})

/* ------------------------------------------------------------------
 * Scroll behaviour - unchanged.
 * ------------------------------------------------------------------ */
const hidden = ref(false)
const solid = ref(false)

const THRESHOLD = 74
const DELTA = 10

let lastScroll = 0
let scrollRaf = 0

const handleScroll = () => {
    const current = window.scrollY

    if(current <= THRESHOLD){
        hidden.value = false
        solid.value = false
        lastScroll = current
        return
    }

    solid.value = true

    if(current > lastScroll + DELTA){
        hidden.value = true
    }

    if(current < lastScroll - DELTA){
        hidden.value = false
    }

    lastScroll = current
}

const onScroll = () => {
    if (scrollRaf) {
        return
    }

    scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0
        handleScroll()
    })
}

onMounted(() => {
    lastScroll = window.scrollY
    handleScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
    if (scrollRaf) {
        cancelAnimationFrame(scrollRaf)
        scrollRaf = 0
    }
})
</script>

<template>

<header
    class="navbar"
    :class="{
        hidden,
        solid
    }"
>

    <div class="container">

        <a href="/" aria-label="Axatel - home">
            <img src="/immagini/Axatel.svg" width="128" height="30" alt="Axatel" fetchpriority="high" decoding="async">
        </a>

        <nav class="menu">
            <a
                v-for="(link, i) in links"
                :key="i"
                :href="link.url"
                :target="link.open_in_new_tab ? '_blank' : undefined"
                :rel="link.open_in_new_tab ? 'noopener noreferrer' : undefined"
            >{{ link.label }}</a>

            <a
                v-if="cta.visible"
                class="nav-cta ax-cta-outline"
                :href="cta.url"
            >{{ cta.label }}</a>
        </nav>

    </div>

</header>

</template>

<style scoped>

.navbar{
    position:fixed;
    top:0;
    left:0;
    width:100%;
    z-index:1000;

    padding:16px 44px;

    transform:translateY(0);

    transition:
        transform .45s cubic-bezier(.22,.61,.36,1),
        background-color .35s ease,
        backdrop-filter .35s ease,
        box-shadow .35s ease;
}

.hidden{
    transform:translateY(-120%);
    pointer-events:none;
}

.solid{

    background:
        linear-gradient(
            to bottom,
            var(--ax-color-overlay-dark-strong) 0%,
            var(--ax-color-overlay-dark-medium) 55%,
            var(--ax-color-overlay-dark-soft) 80%,
            rgba(7,17,29,0) 100%
        );

    backdrop-filter:blur(18px);
    -webkit-backdrop-filter:blur(18px);

}

.container{
    display:flex;
    justify-content:space-between;
    align-items:center;
}

.container img{
    width:128px;
    height:30px;
    display:block;
}

.logo{
    color:white;
    font-size:1rem;
    font-weight:600;
    letter-spacing:.35rem;
    user-select:none;
}

.menu{
    display:flex;
    align-items:center;
    gap:40px;
}

.menu a{
    color:var(--ax-color-text-secondary);
    text-decoration:none;
    font-size:.92rem;
    font-weight:300;
    transition:color .25s ease;
}

.menu a:hover{
    color:var(--ax-color-text-primary);
}

.menu .nav-cta {
    color: var(--ax-color-accent-red-soft);
    font-weight: 700;
    padding: 0.68rem 1rem;
    border-radius: 999px;
}

.menu .nav-cta:hover {
    color: #ffffff;
}

@media (max-width: 900px) {
    .navbar {
        padding: 14px 20px;
    }

    .menu {
        gap: 18px;
    }

    .menu a {
        font-size: 0.82rem;
    }
}

@media (max-width: 640px) {
    .container {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }

    .menu {
        flex-wrap: wrap;
        gap: 12px;
    }
}

</style>