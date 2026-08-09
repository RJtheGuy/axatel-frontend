<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue"
import gsap from "gsap"

const background = ref<HTMLElement | null>(null)
const svgEl = ref<SVGSVGElement | null>(null)

const group1 = ref<SVGGElement | null>(null)
const group2 = ref<SVGGElement | null>(null)
const group3 = ref<SVGGElement | null>(null)
const group4 = ref<SVGGElement | null>(null)
const group5 = ref<SVGGElement | null>(null)

const line1 = ref<SVGPathElement | null>(null)
const line2 = ref<SVGPathElement | null>(null)
const line3 = ref<SVGPathElement | null>(null)
const line4 = ref<SVGPathElement | null>(null)
const line5 = ref<SVGPathElement | null>(null)

const glow1 = ref<SVGPathElement | null>(null)
const glow2 = ref<SVGPathElement | null>(null)
const glow3 = ref<SVGPathElement | null>(null)
const glow4 = ref<SVGPathElement | null>(null)
const glow5 = ref<SVGPathElement | null>(null)

const groups = [group1, group2, group3, group4, group5]
const lines = [line1, line2, line3, line4, line5]
const glows = [glow1, glow2, glow3, glow4, glow5]

type Sample = { x: number, y: number }

const SAMPLE_COUNT = 240
const TARGET_HALF_ARC = 55
const LERP_RATE = .1
const BASE_OPACITY = .08
const MAX_OPACITY = .55
const MAX_DIST = 90

let samples: Sample[][] = [[], [], [], [], []]
let lengths: number[] = [0, 0, 0, 0, 0]
let halfWindow: number[] = [6, 6, 6, 6, 6]
let smoothIdx: number[] = [0, 0, 0, 0, 0]
let idleRunning: boolean[] = [false, false, false, false, false]

let opacityTo: ((v: number) => void)[] = []

let idleTimeout: ReturnType<typeof setTimeout>
let rafId = 0
let mouseX = 0
let mouseY = 0
let hasMouse = false

const move = (e: MouseEvent) => {
    mouseX = e.clientX
    mouseY = e.clientY
    hasMouse = true

    const x = (e.clientX / window.innerWidth - .5) * 20
    const y = (e.clientY / window.innerHeight - .5) * 20

    gsap.to(background.value, {
        x,
        y,
        duration: 1.8,
        ease: "power3.out"
    })

    scheduleIdle()
}

const findNearestIndex = (arr: Sample[], x: number, y: number) => {
    let best = 0
    let bestDist = Infinity

    for(let k=0; k<arr.length; k++){
        const dx = arr[k].x - x
        const dy = arr[k].y - y
        const d = dx*dx + dy*dy
        if(d < bestDist){
            bestDist = d
            best = k
        }
    }
    return best
}

const renderGlow = (i: number, idxFloat: number) => {
    const arr = samples[i]
    const glow = glows[i].value
    if(!arr.length || !glow) return

    const N = arr.length
    const center = Math.round(idxFloat)
    const hw = halfWindow[i]
    const start = Math.max(0, center - hw)
    const end = Math.min(N - 1, center + hw)

    let d = ""
    for(let k=start; k<=end; k++){
        const p = arr[k]
        d += (k === start ? `M${p.x} ${p.y} ` : `L${p.x} ${p.y} `)
    }
    glow.setAttribute("d", d)
}

const tick = () => {
    rafId = requestAnimationFrame(tick)

    if(!hasMouse || !svgEl.value) return

    const ctm = svgEl.value.getScreenCTM()
    if(!ctm) return

    const inv = ctm.inverse()
    const pt = svgEl.value.createSVGPoint()
    pt.x = mouseX
    pt.y = mouseY

    const svgPt = pt.matrixTransform(inv)

    groups.forEach((group, i) => {
        if(idleRunning[i]) return

        const arr = samples[i]
        if(!arr.length || !group.value) return

        const currentY = (gsap.getProperty(group.value, "y") as number) || 0
        const localY = svgPt.y - currentY

        const nearestIdx = findNearestIndex(arr, svgPt.x, localY)

        smoothIdx[i] += (nearestIdx - smoothIdx[i]) * LERP_RATE
        renderGlow(i, smoothIdx[i])

        const nearest = arr[Math.round(smoothIdx[i])]
        const dx = svgPt.x - nearest.x
        const dy = localY - nearest.y
        const dist = Math.hypot(dx, dy)
        const proximity = Math.max(0, 1 - dist / MAX_DIST)

        opacityTo[i]?.(BASE_OPACITY + proximity * (MAX_OPACITY - BASE_OPACITY))
    })
}

const idleSweep = () => {
    samples.forEach((arr, i) => {
        if(!arr.length) return

        const N = arr.length
        const obj = { p: 0 }
        idleRunning[i] = true

        gsap.fromTo(obj, { p: 0 }, {
            p: N - 1,
            duration: 7 + i,
            ease: "sine.inOut",
            onUpdate: () => {
                smoothIdx[i] = obj.p
                renderGlow(i, obj.p)
            },
            onComplete: () => {
                idleRunning[i] = false
            }
        })

        opacityTo[i]?.(BASE_OPACITY + .2)
        gsap.delayedCall(2.4, () => opacityTo[i]?.(BASE_OPACITY))
    })
}

const scheduleIdle = () => {
    clearTimeout(idleTimeout)
    idleTimeout = setTimeout(() => {
        idleSweep()
        scheduleIdle()
    }, 15000)
}

onMounted(() => {
    window.addEventListener("mousemove", move)

    gsap.to(group1.value, { y: -6, duration: 9, repeat: -1, yoyo: true, ease: "sine.inOut" })
    gsap.to(group2.value, { y: 8, duration: 11, repeat: -1, yoyo: true, ease: "sine.inOut" })
    gsap.to(group3.value, { y: -5, duration: 13, repeat: -1, yoyo: true, ease: "sine.inOut" })
    gsap.to(group4.value, { y: 7, duration: 15, repeat: -1, yoyo: true, ease: "sine.inOut" })
    gsap.to(group5.value, { y: -6, duration: 17, repeat: -1, yoyo: true, ease: "sine.inOut" })

    lines.forEach((line, i) => {
        if(!line.value) return

        const length = line.value.getTotalLength()
        lengths[i] = length

        const arr: Sample[] = []
        for(let s=0; s<=SAMPLE_COUNT; s++){
            const t = (length/SAMPLE_COUNT)*s
            const p = line.value.getPointAtLength(t)
            arr.push({ x: p.x, y: p.y })
        }
        samples[i] = arr

        halfWindow[i] = Math.max(3, Math.round(TARGET_HALF_ARC * (SAMPLE_COUNT/length)))
        smoothIdx[i] = SAMPLE_COUNT / 2

        const glow = glows[i].value
        if(glow) opacityTo[i] = gsap.quickTo(glow, "opacity", { duration: 1.8, ease: "sine.out" })

        renderGlow(i, smoothIdx[i])
    })

    rafId = requestAnimationFrame(tick)
    scheduleIdle()
})

onUnmounted(() => {
    window.removeEventListener("mousemove", move)
    cancelAnimationFrame(rafId)
    clearTimeout(idleTimeout)
})
</script>

<template>
  <section class="hero">
    
    <button class="cta-top-right">
      Richiedi una demo
    </button>

    <div class="hero-content">
      <p class="hero-tag">
        Monitoraggio in tempo reale
      </p>

      <h1>
        La piattaforma che trasforma i dati in decisioni
      </h1>
    </div>

    <div class="scroll-invite">
      <span>Scopri come funziona</span>
      <svg class="arrow-down" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14M19 12l-7 7-7-7" />
      </svg>
    </div>

    <div ref="background" class="hero-background">
      <svg ref="svgEl" class="terrain" viewBox="0 0 1200 800">
        <defs>
          <filter id="glow" x="-300%" y="-300%" width="700%" height="700%">
            <feGaussianBlur stdDeviation="42" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="fadeGrad" x1="0" x2="1200" y1="0" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#fff" stop-opacity="0" />
            <stop offset="4%" stop-color="#fff" stop-opacity=".08" />
            <stop offset="9%" stop-color="#fff" stop-opacity=".35" />
            <stop offset="15%" stop-color="#fff" stop-opacity=".75" />
            <stop offset="22%" stop-color="#fff" stop-opacity="1" />
            <stop offset="78%" stop-color="#fff" stop-opacity="1" />
            <stop offset="85%" stop-color="#fff" stop-opacity=".75" />
            <stop offset="91%" stop-color="#fff" stop-opacity=".35" />
            <stop offset="96%" stop-color="#fff" stop-opacity=".08" />
            <stop offset="100%" stop-color="#fff" stop-opacity="0" />
          </linearGradient>

          <mask id="fadeMask" maskUnits="userSpaceOnUse" x="0" y="-400" width="1200" height="1400">
            <rect x="0" y="-400" width="1200" height="1400" fill="url(#fadeGrad)" />
          </mask>
        </defs>

        <g ref="group1" mask="url(#fadeMask)">
          <path ref="line1" class="line" d="M0 680 C110 680 110 645 220 645 C350 645 350 574 480 574 C620 574 620 529 760 529 C880 529 880 454 1000 454 C1100 454 1100 390 1200 390" />
          <path ref="glow1" class="line-glow" />
        </g>

        <g ref="group2" mask="url(#fadeMask)">
          <path ref="line2" class="line" d="M0 670 C110 670 110 623 220 623 C350 623 350 527 480 527 C620 527 620 455 760 455 C880 455 880 357 1000 357 C1100 357 1100 270 1200 270" />
          <path ref="glow2" class="line-glow" />
        </g>

        <g ref="group3" mask="url(#fadeMask)">
          <path ref="line3" class="line" d="M0 660 C110 660 110 600 220 600 C350 600 350 480 480 480 C620 480 620 380 760 380 C880 380 880 260 1000 260 C1100 260 1100 150 1200 150" />
          <path ref="glow3" class="line-glow" />
        </g>

        <g ref="group4" mask="url(#fadeMask)">
          <path ref="line4" class="line" d="M0 650 C110 650 110 577 220 577 C350 577 350 433 480 433 C620 433 620 306 760 306 C880 306 880 163 1000 163 C1100 163 1100 30 1200 30" />
          <path ref="glow4" class="line-glow" />
        </g>

        <g ref="group5" mask="url(#fadeMask)">
          <path ref="line5" class="line" d="M0 640 C110 640 110 555 220 555 C350 555 350 386 480 386 C620 386 620 231 760 231 C880 231 880 66 1000 66 C1100 66 1100 -90 1200 -90" />
          <path ref="glow5" class="line-glow" />
        </g>
      </svg>
    </div>
  </section>
</template>

<style scoped>
.hero {
    position: relative;
    height: 100vh;
    display: flex;
    align-items: center;
    overflow: hidden;
    padding: 0 10vw;
}

/* --- BOTTONE IN ALTO A DESTRA (Outline) --- */
.cta-top-right {
    position: absolute;
    top: 30%;
    right: 10vw;
    z-index: 20;
    background: transparent;
    color: #d73a3a;
    border: 1.5px solid #d73a3a;
    padding: 12px 28px;
    border-radius: 999px;
    font-size: 1.3rem;
    font-weight: 500;
    letter-spacing: 0.05rem;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(.22,.61,.36,1);
}

.cta-top-right:hover {
    background: #d73a3a;
    color: #fff;
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(215, 58, 58, 0.2);
}

.hero-content {
    position: relative;
    z-index: 10;
    transform: translateY(-40px);
}

.hero-tag {
    color: #d73a3a;
    text-transform: uppercase;
    letter-spacing: .4rem;
    font-size: 1.2rem;
    margin-bottom: 30px;
}

h1 {
    color: white;
    font-size: 4.8rem;
    line-height: 1.05;
    font-weight: 200;
    max-width: 760px;
}

/* --- SCRITTA DI INVITO IN FONDO --- */
.scroll-invite {
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    color: rgba(255, 255, 255, 0.4);
    pointer-events: none;
}

.scroll-invite span {
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.4rem;
    font-weight: 400;
}

.arrow-down {
    width: 40px;
    height: 40px;
    animation: float 2s infinite ease-in-out;
}

/* Animazione di fluttuazione dell'icona freccia */
@keyframes float {
    0%, 100% {
        transform: translateY(0);
        opacity: 0.4;
    }
    50% {
        transform: translateY(6px);
        opacity: 1;
    }
}

.hero-background {
    position: absolute;
    inset: -5%;
}

.terrain {
    width: 110%;
    height: 110%;
    overflow: visible;
}

.line {
    fill: none;
    stroke: rgba(255,255,255,.08);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
}

.line-glow {
    fill: none;
    stroke: #ffffff;
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
}

/* Adattabilità mobile */
@media (max-width: 768px) {
    h1 {
        font-size: 3rem;
    }
    .cta-top-right {
        top: 24px;
        right: 5vw;
        padding: 10px 20px;
        font-size: 0.75rem;
    }
}
</style>