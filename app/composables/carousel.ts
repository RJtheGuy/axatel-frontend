
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
