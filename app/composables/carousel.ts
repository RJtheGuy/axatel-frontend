/**
 * Single canonical carousel composable.
 *
 * REPLACES BOTH the old `carousel.ts` and `carousel_with_stop.ts`.
 * Those two exported identically-named symbols (useCarousel,
 * CarouselOptions, CarouselController), so Nuxt auto-import silently
 * dropped one of them and logged a "Duplicated imports" warning on every
 * build. Which implementation a component got depended on whether it used
 * auto-import or an explicit `import ... from "~/composables/carousel"` —
 * two different behaviours in one app, decided by import style.
 *
 * This is the `_with_stop` implementation, kept because it is strictly
 * better on three counts:
 *   1. hover-pause (container mouseenter/mouseleave)
 *   2. ResizeObserver on the track — REQUIRED once the case list is
 *      fetched from the CMS, because the track width changes after mount
 *      when API data arrives. The old carousel.ts computed loopWidth once
 *      and never recovered from a late width change.
 *   3. continuous wrap (position += loopWidth) instead of resetting to 0,
 *      which avoided a visible one-frame pop at the loop boundary.
 *
 * DELETE `app/composables/carousel_with_stop.ts` after dropping this in.
 */

export interface CarouselOptions {
    container: HTMLElement
    track: HTMLElement
    speed?: number
}

export interface CarouselController {
    destroy(): void
    pause(): void
    resume(): void
    /** Recompute loop width — call after the item list changes. */
    updateWidth(): void
}

export function useCarousel({
    container,
    track,
    speed = 1
}: CarouselOptions): CarouselController {

    let position = 0
    let paused = false
    let isHovered = false
    let loopWidth = 0
    let animationFrameId: number | null = null
    let resizeObserver: ResizeObserver | null = null

    const computeWidth = () => {
        // Il track contiene due copie della lista.
        // La metà corrisponde alla larghezza della lista originale.
        loopWidth = track.scrollWidth / 2

        if (loopWidth > 0) {
            // Keep position in a stable interval to avoid visual jumps after resizes.
            position = ((position % loopWidth) + loopWidth) % loopWidth
            position = -position
            track.style.transform = `translate3d(${position}px, 0, 0)`
        }
    }

    const onResize = () => requestAnimationFrame(computeWidth)
    const onMouseEnter = () => { isHovered = true }
    const onMouseLeave = () => { isHovered = false }

    const tick = () => {
        if (paused || isHovered) {
            animationFrameId = requestAnimationFrame(tick)
            return
        }

        if (!loopWidth) {
            computeWidth() // Fallback se non era ancora pronto
        }

        position -= speed

        // Continuous wrap: preserves overflow and avoids one-frame pop.
        while (position <= -loopWidth) {
            position += loopWidth
        }

        track.style.transform = `translate3d(${position}px, 0, 0)`
        animationFrameId = requestAnimationFrame(tick)
    }

    // Inizializzazione
    requestAnimationFrame(computeWidth)

    container.addEventListener("mouseenter", onMouseEnter)
    container.addEventListener("mouseleave", onMouseLeave)
    window.addEventListener("resize", onResize)

    resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(computeWidth)
    })
    resizeObserver.observe(track)

    animationFrameId = requestAnimationFrame(tick)

    return {
        pause() { paused = true },
        resume() { paused = false },
        updateWidth() { computeWidth() },
        destroy() {
            if (animationFrameId) cancelAnimationFrame(animationFrameId)
            container.removeEventListener("mouseenter", onMouseEnter)
            container.removeEventListener("mouseleave", onMouseLeave)
            window.removeEventListener("resize", onResize)
            resizeObserver?.disconnect()
        }
    }
}
