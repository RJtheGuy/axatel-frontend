export interface CarouselOptions {
    container: HTMLElement
    track: HTMLElement
    speed?: number
}

export interface CarouselController {
    destroy(): void
    pause(): void
    resume(): void
    updateWidth(): void
}

export function useCarousel({
    container,
    track,
    speed = 1
}: CarouselOptions): CarouselController {

    let position = 0
    let paused = false
    let loopWidth = 0
    let animationFrameId: number | null = null
    let resizeFrameId: number | null = null
    let visible = false

    function stop() {
        if (animationFrameId !== null) cancelAnimationFrame(animationFrameId)
        animationFrameId = null
    }

    function start() {
        if (!paused && visible && !document.hidden && animationFrameId === null) {
            animationFrameId = requestAnimationFrame(tick)
        }
    }

    function computeWidth() {

        // Il track contiene due copie della lista.
        // La metà corrisponde alla larghezza della lista originale.
        loopWidth = track.scrollWidth / 2

    }

    function onResize() {

        if (resizeFrameId !== null) return
        resizeFrameId = requestAnimationFrame(() => {
            resizeFrameId = null
            computeWidth()
        })

    }

    function tick() {

        animationFrameId = null
        if (paused || !visible || document.hidden) return

        if (!loopWidth) {

            computeWidth()

        }

        position -= speed

        if (position <= -loopWidth) {

            position = 0

        }

        track.style.transform =
            `translate3d(${position}px,0,0)`

        start()

    }

    // Visitors who ask their OS for reduced motion get a still row they
    // can scroll themselves, instead of cards that keep sliding away.
    const reducedMotion = typeof window !== "undefined"
        && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

    if (reducedMotion) {
        container.style.overflowX = "auto"
        container.style.scrollSnapType = "x proximity"
        return {
            pause() {},
            resume() {},
            updateWidth() {},
            destroy() {}
        }
    }

    const observer = new IntersectionObserver(entries => {
        visible = entries.some(entry => entry.isIntersecting)
        if (visible) {
            computeWidth()
            start()
        } else {
            stop()
        }
    })
    observer.observe(container)

    const resizeObserver = new ResizeObserver(onResize)
    resizeObserver.observe(track)

    function onVisibilityChange() {
        if (document.hidden) stop()
        else start()
    }

    document.addEventListener("visibilitychange", onVisibilityChange)

    window.addEventListener(
        "resize",
        onResize
    )

    return {

        pause() {

            paused = true
            stop()

        },

        resume() {

            paused = false
            start()

        },

        updateWidth() {

            computeWidth()

        },

        destroy() {

            stop()
            if (resizeFrameId !== null) cancelAnimationFrame(resizeFrameId)
            observer.disconnect()
            resizeObserver.disconnect()
            document.removeEventListener("visibilitychange", onVisibilityChange)

            window.removeEventListener(
                "resize",
                onResize
            )

        }

    }

}