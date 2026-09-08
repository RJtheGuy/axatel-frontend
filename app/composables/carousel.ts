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

    function computeWidth() {

        // Il track contiene due copie della lista.
        // La metà corrisponde alla larghezza della lista originale.
        loopWidth = track.scrollWidth / 2

    }

    function onResize() {

        requestAnimationFrame(computeWidth)

    }

    function tick() {

        if (paused) {

            animationFrameId = requestAnimationFrame(tick)

            return

        }

        if (!loopWidth) {

            computeWidth()

        }

        position -= speed

        if (position <= -loopWidth) {

            position = 0

        }

        track.style.transform =
            `translate3d(${position}px,0,0)`

        animationFrameId =
            requestAnimationFrame(tick)

    }

    requestAnimationFrame(computeWidth)

    window.addEventListener(
        "resize",
        onResize
    )

    animationFrameId =
        requestAnimationFrame(tick)

    return {

        pause() {

            paused = true

        },

        resume() {

            paused = false

        },

        updateWidth() {

            computeWidth()

        },

        destroy() {

            if (animationFrameId !== null) {

                cancelAnimationFrame(
                    animationFrameId
                )

            }

            window.removeEventListener(
                "resize",
                onResize
            )

        }

    }

}