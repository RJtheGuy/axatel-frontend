import { gsap } from "gsap";
import { onMounted, onUnmounted, type Ref } from "vue";

/**
 * Runs `tick` on GSAP's ticker only while `el` is on screen and the tab is
 * visible (update 54, speed). The demo games used to keep animating even
 * when scrolled far away, keeping the phone's processor busy for nothing.
 */
export function useOnScreenTicker(el: Ref<HTMLElement | null | undefined>, tick: () => void): void {
    let onScreen = false;
    let running = false;
    let observer: IntersectionObserver | null = null;

    const sync = () => {
        const shouldRun = onScreen && !document.hidden;
        if (shouldRun && !running) {
            gsap.ticker.add(tick);
            running = true;
        } else if (!shouldRun && running) {
            gsap.ticker.remove(tick);
            running = false;
        }
    };

    onMounted(() => {
        document.addEventListener("visibilitychange", sync);
        if (!el.value || typeof IntersectionObserver === "undefined") {
            onScreen = true;
            sync();
            return;
        }
        observer = new IntersectionObserver((entries) => {
            onScreen = Boolean(entries[entries.length - 1]?.isIntersecting);
            sync();
        }, { rootMargin: "100px 0px" });
        observer.observe(el.value);
    });

    onUnmounted(() => {
        observer?.disconnect();
        observer = null;
        document.removeEventListener("visibilitychange", sync);
        onScreen = false;
        sync();
    });
}
