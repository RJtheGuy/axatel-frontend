<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import fallbackNavigationItems from "../../data/navigation.json";
import corporate from "../../data/corporate.json";
import axatelLogo from '~/assets/immagini/Axatel.svg'

// Same useSiteSettings() composable the layout already uses for the
// chatbot config — one shared fetch of /api/v2/site-settings/, not a
// second one invented just for this component.
const { settings } = useSiteSettings()

// Falls back to the static file if the CMS hasn't been given any nav
// items yet (fresh install, or NavigationSettings.items left empty) —
// same "never break the live site over missing CMS content" pattern
// used everywhere else. Once an editor adds items in Impostazioni →
// Navigazione, this switches over automatically, no code change.
const navigationItems = computed(() => {
    const cmsItems = settings.value?.navigation?.items
    return Array.isArray(cmsItems) && cmsItems.length > 0 ? cmsItems : fallbackNavigationItems
})

const headerCta = computed(() => settings.value?.navigation?.cta ?? {
    visible: true,
    label: "Parla con un esperto",
    url: "/contatti",
})

const hidden = ref(false)
const solid = ref(false)
const menuOpen = ref(false)
const activeMobileItem = ref<string | null>(null)
const copiedContact = ref<"phone" | "email" | null>(null)
const navbarEl = ref<HTMLElement | null>(null)

const THRESHOLD = 74
const DELTA = 10

let lastScroll = 0
let scrollRaf = 0
let copiedTimer: ReturnType<typeof setTimeout> | null = null
let navbarResizeObserver: ResizeObserver | null = null

const updateNavbarHeight = () => {
    const height = navbarEl.value?.getBoundingClientRect().height
    if (height) {
        navbarEl.value?.style.setProperty("--navbar-mobile-height", `${height}px`)
        document.documentElement.style.setProperty("--ax-navbar-height", `${height}px`)
    }
}

const copyContact = async (type: "phone" | "email", value: string) => {
    try {
        await navigator.clipboard.writeText(value)
    } catch {
        const input = document.createElement("textarea")
        input.value = value
        input.style.position = "fixed"
        input.style.opacity = "0"
        document.body.appendChild(input)
        input.select()
        document.execCommand("copy")
        input.remove()
    }

    copiedContact.value = type

    if (copiedTimer) clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
        copiedContact.value = null
        copiedTimer = null
    }, 2000)
}

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

const closeMenu = () => {
    menuOpen.value = false
    activeMobileItem.value = null
}

const toggleMobileItem = (label: string) => {
    activeMobileItem.value = activeMobileItem.value === label ? null : label
}

const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
        closeMenu()
    }
}

watch(menuOpen, (isOpen) => {
    document.body.style.overflow = isOpen ? "hidden" : ""
})

onMounted(() => {
    lastScroll = window.scrollY
    handleScroll()
    updateNavbarHeight()
    navbarResizeObserver = new ResizeObserver(updateNavbarHeight)
    if (navbarEl.value) {
        navbarResizeObserver.observe(navbarEl.value)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener("keydown", handleKeydown)
})

onUnmounted(() => {
    navbarResizeObserver?.disconnect()
    navbarResizeObserver = null
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener("keydown", handleKeydown)
    document.body.style.overflow = ""
    if (scrollRaf) {
        cancelAnimationFrame(scrollRaf)
        scrollRaf = 0
    }
    if (copiedTimer) {
        clearTimeout(copiedTimer)
    }
})
</script>

<template>

<header
    ref="navbarEl"
    class="navbar"
    :class="{
        hidden,
        solid,
        'menu-open': menuOpen
    }"
>
    <!-- <div class="corporate-bar">
        <div class="corporate-inner">
            <span class="corporate-contacts">
                <a :href="corporate.phone.href">{{ corporate.phone.label }}</a>
                <a :href="corporate.email.href">{{ corporate.email.label }}</a>
            </span>
            <div class="corporate-contacts">
                <NuxtLink class="ticket-link" :to="corporate.ticketPortal.href">
                    {{ corporate.ticketPortal.label }}
                </NuxtLink>
            </div>

            <div class="corporate-mobile-actions">
                <div class="corporate-copy-actions">
                    <button
                        class="corporate-icon-button"
                        type="button"
                        aria-label="Copia numero di telefono"
                        title="Copia numero di telefono"
                        @click="copyContact('phone', corporate.phone.label)"
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2c.3-.3.8-.4 1.2-.2a11 11 0 0 0 3.5.6c.5 0 .9.4.9.9V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.5 0 .9.4.9.9A11 11 0 0 0 9 7.4c.1.4 0 .9-.3 1.2l-2.1 2.2Z" />
                        </svg>
                        <span v-if="copiedContact === 'phone'" class="copy-feedback">Copiato</span>
                    </button>

                    <button
                        class="corporate-icon-button"
                        type="button"
                        aria-label="Copia indirizzo email"
                        title="Copia indirizzo email"
                        @click="copyContact('email', corporate.email.label)"
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M3 5h18v14H3V5Zm2 2v.5l7 4.8 7-4.8V7H5Zm14 10V9.9l-7 4.8-7-4.8V17h14Z" />
                        </svg>
                        <span v-if="copiedContact === 'email'" class="copy-feedback">Copiato</span>
                    </button>
                </div>

                <NuxtLink
                    class="mobile-ticket-link"
                    :to="corporate.ticketPortal.href"
                >
                    {{ corporate.ticketPortal.label }}
                </NuxtLink>

                <span class="sr-only" aria-live="polite">
                    {{ copiedContact ? 'Contatto copiato negli appunti' : '' }}
                </span>
            </div>
        </div>
    </div> -->

    <div class="container">

        <NuxtLink class="brand" to="/" aria-label="Axatel, torna alla home" @click="closeMenu">
            <img :src="axatelLogo" width="128" height="30" alt="Axatel Logo" fetchpriority="high" decoding="async">
        </NuxtLink>

        <button
            class="menu-toggle"
            type="button"
            :aria-expanded="menuOpen"
            aria-controls="main-navigation"
            :aria-label="menuOpen ? 'Chiudi menu' : 'Apri menu'"
            @click="menuOpen = !menuOpen"
        >
            <span></span>
            <span></span>
            <span></span>
        </button>

        <nav id="main-navigation" class="menu" aria-label="Navigazione principale">
            <LayoutNavbarItem
                v-for="item in navigationItems"
                :key="item.label"
                :item="item"
                :mobile-expanded="activeMobileItem === item.label"
                @navigate="closeMenu"
                @toggle-mobile="toggleMobileItem"
            />
            <NuxtLink
                v-if="headerCta.visible"
                class="nav-cta ax-cta-outline"
                :to="headerCta.url"
                @click="closeMenu"
            >
                {{ headerCta.label }}
            </NuxtLink>
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

    background:rgba(4, 13, 23, 0.72);
    border-bottom:1px solid rgba(198, 220, 239, 0.12);
    backdrop-filter:blur(18px);
    -webkit-backdrop-filter:blur(18px);

    transform:translateY(0);

    transition:
        transform .45s cubic-bezier(.22,.61,.36,1),
        background-color .35s ease,
        backdrop-filter .35s ease,
        box-shadow .35s ease;
}

.corporate-bar {
    border-bottom:1px solid rgba(198, 220, 239, 0.1);
    background:rgba(1, 7, 14, 0.38);
}

.corporate-inner {
    display:flex;
    width:100%;
    max-width:1480px;
    min-height:30px;
    margin:0 auto;
    padding:0 32px;
    align-items:center;
    justify-content:space-between;
}

.corporate-label {
    color:var(--ax-color-text-muted);
    font-size:0.58rem;
    font-weight:500;
    letter-spacing:0.16em;
    text-transform:uppercase;
}

.corporate-contacts {
    display:flex;
    align-items:center;
    gap:22px;
}

.corporate-mobile-actions {
    display:none;
}

.sr-only {
    position:absolute;
    width:1px;
    height:1px;
    padding:0;
    margin:-1px;
    overflow:hidden;
    clip:rect(0, 0, 0, 0);
    white-space:nowrap;
    border:0;
}

.corporate-contacts a {
    color:var(--ax-color-text-secondary);
    font-size:0.66rem;
    font-weight:350;
    letter-spacing:0.025em;
    line-height:1;
    text-decoration:none;
    transition:color 0.2s ease;
}

.corporate-contacts a:hover,
.corporate-contacts a:focus-visible {
    color:#fff;
}

.corporate-contacts .ticket-link {
    padding:5px 10px;
    border:1px solid rgba(234, 63, 48, 0.6);
    border-radius:4px;
    color:#fff;
    font-size:0.61rem;
    font-weight:500;
    letter-spacing:0.06em;
    text-transform:uppercase;
}

.corporate-contacts .ticket-link:hover,
.corporate-contacts .ticket-link:focus-visible {
    border-color:var(--ax-color-accent-red-soft);
    background:rgba(234, 63, 48, 0.12);
}

.hidden:not(.menu-open){
    transform:translateY(-120%);
    pointer-events:none;
}

.solid{
    background:rgba(4, 13, 23, 0.92);
    box-shadow:0 10px 35px rgba(0, 0, 0, 0.18);
}

.container{
    width:100%;
    max-width:1480px;
    min-height:44px;
    margin:0 auto;
    padding:6px 32px;
    display:flex;
    justify-content:space-between;
    align-items:center;
}

.brand,
.brand img{
    display:block;
    width:116px;
    height:27px;
}

.menu{
    display:flex;
    align-items:center;
    gap:28px;
}

.menu .nav-cta {
    flex:0 0 auto;
    color:#fff;
    font-size:0.68rem;
    font-weight:500;
    letter-spacing:0.07em;
    padding:0.5rem 0.8rem;
    border-radius: 999px;
}

.menu .nav-cta:hover {
    color: #ffffff;
    background:var(--ax-color-accent-red);
}

.menu-toggle {
    display:none;
    width:44px;
    height:44px;
    padding:10px;
    border:0;
    background:transparent;
    cursor:pointer;
}

.menu-toggle span {
    display:block;
    width:22px;
    height:2px;
    margin:5px auto;
    border-radius:2px;
    background:#fff;
    transition:transform 0.2s ease, opacity 0.2s ease;
}

@media (max-width: 1100px) {
    .corporate-inner {
        padding:0 20px;
    }

    .container {
        padding:6px 20px;
    }

    .menu-toggle {
        display:block;
        margin-left:auto;
    }

    .menu-open .menu-toggle span:nth-child(1) {
        transform:translateY(7px) rotate(45deg);
    }

    .menu-open .menu-toggle span:nth-child(2) {
        opacity:0;
    }

    .menu-open .menu-toggle span:nth-child(3) {
        transform:translateY(-7px) rotate(-45deg);
    }

    .menu {
        position:fixed;
        top:var(--navbar-mobile-height, 78px);
        right:0;
        left:0;
        display:none;
        height:calc(100dvh - var(--navbar-mobile-height, 78px));
        padding:18px 24px 40px;
        overflow-y:auto;
        flex-direction:column;
        align-items:stretch;
        gap:0;
        background:rgba(4, 13, 23, 0.98);
        border-top:1px solid var(--ax-color-border-soft);
    }

    .menu-open .menu {
        display:flex;
    }

    .menu .nav-cta {
        align-self:flex-start;
        margin-top:24px;
    }
}

@media (max-width: 640px) {
    .corporate-label {
        display:none;
    }

    .corporate-inner {
        min-height:34px;
        justify-content:center;
    }

    .corporate-contacts {
        display:none;
    }

    .corporate-mobile-actions {
        width:100%;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:8px;
    }

    .corporate-copy-actions {
        display:flex;
        align-items:center;
        gap:8px;
    }

    .corporate-icon-button {
        min-width:34px;
        height:28px;
        padding:0 7px;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        gap:5px;
        border:1px solid rgba(198, 220, 239, 0.22);
        border-radius:4px;
        background:rgba(255, 255, 255, 0.04);
        color:#fff;
        text-decoration:none;
        cursor:pointer;
    }

    .corporate-icon-button svg {
        width:16px;
        height:16px;
        fill:currentColor;
    }

    .mobile-ticket-link {
        min-height:28px;
        padding:0 9px;
        display:inline-flex;
        align-items:center;
        border-color:rgba(234, 63, 48, 0.65);
        border:1px solid rgba(234, 63, 48, 0.65);
        border-radius:4px;
        color:#fff;
        font-size:0.58rem;
        font-weight:600;
        letter-spacing:0.05em;
        text-decoration:none;
        text-transform:uppercase;
    }

    .copy-feedback {
        color:#fff;
        font-size:0.62rem;
        font-weight:600;
        letter-spacing:0.02em;
    }
}

</style>