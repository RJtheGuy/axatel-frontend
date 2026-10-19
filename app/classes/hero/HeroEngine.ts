// classes/hero/HeroEngine.ts

import {
    MathUtils,
    PerspectiveCamera,
    Scene,
    SRGBColorSpace,
    Timer,
    Vector3,
    WebGLRenderer
} from "three";

import { ParticleSystem } from "./ParticleSystem";
import { FlowField } from "./FlowField";
import type { SequenceManager } from "./SequenceManager";
import type { SequenceStage } from "./SequenceManager";
import { DEFAULT_WING_IMAGE } from "@/utils/resolveImage";

export default class HeroEngine {

    private canvas: HTMLCanvasElement;
    private renderer!: WebGLRenderer;
    private scene!: Scene;
    private camera!: PerspectiveCamera;
    private timer = new Timer();
    private animationId = 0;
    private particleSystem!: ParticleSystem;
    private flowField!: FlowField;
    private sequence: SequenceManager;
    private forcedStage: SequenceStage | null = null;
    private ambientFlow = false;
    private readonly pointerNdc = new Vector3();
    private readonly pointerWorld = new Vector3();
    private readonly pointerDir = new Vector3();

    // Speed (update 54). The loop runs only while the canvas is on screen and
    // the tab is visible. "Calm" visitors (phones and tablets, or "reduce
    // motion" in the system settings) get the particles formed, then a still
    // picture: the loop stops CALM_SECONDS after the last change (a new
    // section, phrase or title wakes it again) and draws at most 30 frames/s.
    private static readonly CALM_SECONDS = 6;
    private readonly calm = HeroEngine.prefersCalm();
    private started = false;
    private looping = false;
    private onScreen = true;
    private awakeUntil = 0;
    private lastFrameAt = 0;
    private visibilityObserver: IntersectionObserver | null = null;

    private static prefersCalm(): boolean {
        if (typeof window === "undefined" || !window.matchMedia) return false;
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches
            || (window.matchMedia("(pointer: coarse)").matches && window.innerWidth <= 1024);
    }

    private getRenderPixelRatio(): number {
        return Math.min(window.devicePixelRatio || 1, this.calm ? 1 : 1.5);
    }

    private getWorldBounds(): { width: number; height: number } {
        const distance = this.camera.position.z;
        const vFov = MathUtils.degToRad(this.camera.fov);
        const height = 2 * Math.tan(vFov / 2) * distance;
        const width = height * this.camera.aspect;
        return { width, height };
    }

    private updateParticleBounds(): void {
        const { width, height } = this.getWorldBounds();
        this.particleSystem.setWorldBounds(width, height);
    }

    private getViewportSize(): { width: number; height: number } {
        const width = this.canvas.clientWidth || window.innerWidth;
        const height = this.canvas.clientHeight || window.innerHeight;
        return {
            width: Math.max(1, width),
            height: Math.max(1, height)
        };
    }

    constructor(canvas: HTMLCanvasElement, sequence: SequenceManager, initialStage?: SequenceStage) {
        this.canvas = canvas;
        this.sequence = sequence;

        this.initRenderer();
        this.initScene();
        this.initCamera();

        this.flowField = new FlowField();
        this.particleSystem = new ParticleSystem(this.scene, this.canvas);
        this.updateParticleBounds();

        this.particleSystem.setStage(initialStage ?? this.sequence.getCurrentStage()).catch(
            (error) => {
                console.error("HeroEngine stage init failed", error);
            }
        );

        this.updateScrollAnchor();

        window.addEventListener("resize", this.onResize);
        window.addEventListener("scroll", this.onScroll, { passive: true });
        window.addEventListener("pointermove", this.onPointerMove);
        window.addEventListener("pointerout", this.onPointerOut);
        window.addEventListener("pointerleave", this.onPointerLeave);
        window.addEventListener("blur", this.onPointerLeave);
        document.addEventListener("visibilitychange", this.onVisibilityChange);

        if (typeof IntersectionObserver !== "undefined") {
            this.visibilityObserver = new IntersectionObserver((entries) => {
                const entry = entries[entries.length - 1];
                this.onScreen = Boolean(entry?.isIntersecting);
                if (this.onScreen) this.wake();
            }, { rootMargin: "120px 0px" });
            this.visibilityObserver.observe(this.canvas);
        }
    }

    public start(): void {
        this.started = true;
        this.wake();
    }

    /** Run the loop again (after a change, or when the canvas comes back on screen). */
    private wake = (): void => {
        if (this.calm) this.awakeUntil = performance.now() + HeroEngine.CALM_SECONDS * 1000;
        if (!this.started || this.looping || !this.canRun()) return;
        this.looping = true;
        this.timer.reset();
        this.animationId = requestAnimationFrame(this.animate);
    };

    private canRun(): boolean {
        if (!this.onScreen || document.hidden) return false;
        return !this.calm || performance.now() < this.awakeUntil;
    }

    private onVisibilityChange = () => {
        if (!document.hidden) this.wake();
    };

    public destroy(): void {
        this.started = false;
        this.looping = false;
        cancelAnimationFrame(this.animationId);
        document.removeEventListener("visibilitychange", this.onVisibilityChange);
        this.visibilityObserver?.disconnect();
        this.visibilityObserver = null;
        window.removeEventListener("resize", this.onResize);
        window.removeEventListener("scroll", this.onScroll);
        window.removeEventListener("pointermove", this.onPointerMove);
        window.removeEventListener("pointerout", this.onPointerOut);
        window.removeEventListener("pointerleave", this.onPointerLeave);
        window.removeEventListener("blur", this.onPointerLeave);
        this.timer.dispose();
        this.particleSystem.dispose();
        this.renderer.dispose();
    }

    public applyPhrases(phrases: string[]): void {
        this.sequence.setPhrases(phrases);
        this.wake();

        if (this.forcedStage || this.ambientFlow) {
            return;
        }

        this.particleSystem
            .setStage(this.sequence.getCurrentStage())
            .catch((error) => {
                console.error("HeroEngine phrase sync failed", error);
            });
    }

    public setFormationSuppressed(suppressed: boolean): void {
        this.particleSystem.setFormationSuppressed(suppressed);
        this.wake();
    }

    public clearForcedStage(): void {
        this.ambientFlow = false;
        this.setForcedStage(null);
    }

    public setAmbientFlow(): void {
        if (this.ambientFlow) {
            return;
        }

        this.ambientFlow = true;
        this.forcedStage = null;
        this.wake();
        this.particleSystem.setFormationSuppressed(false);
        this.particleSystem
            .releaseToAmbientFlow()
            .catch((error) => {
                console.error("HeroEngine ambient flow failed", error);
            });
    }

    public setForcedText(text: string | null): void {
        this.ambientFlow = false;
        const normalized = text && text.trim().length > 0 ? text.trim() : null;

        if (!normalized) {
            this.setForcedStage(null);
            return;
        }

        this.setForcedStage({
            id: "forced-text",
            type: "text",
            text: normalized,
            duration: 9999
        });
    }

    public setForcedLogoAsset(assetUrl: string | null, stageId = "forced-logo"): void {
        this.ambientFlow = false;
        const normalized = assetUrl && assetUrl.trim().length > 0 ? assetUrl.trim() : null;

        if (!normalized) {
            this.setForcedStage(null);
            return;
        }

        this.setForcedStage({
            id: stageId,
            type: "logo",
            text: "AXATEL",
            asset: normalized,
            duration: 9999
        });
    }

    public setForcedComposite(text: string, assetUrl = DEFAULT_WING_IMAGE): void {
        this.ambientFlow = false;
        const normalizedText = text.trim();

        if (!normalizedText) {
            this.setForcedStage(null);
            return;
        }

        this.setForcedStage({
            id: "forced-composite",
            type: "composite",
            text: normalizedText,
            asset: assetUrl,
            duration: 9999
        });
    }

    private setForcedStage(stage: SequenceStage | null): void {
        const sameStage =
            this.forcedStage?.type === stage?.type &&
            this.forcedStage?.text === stage?.text &&
            this.forcedStage?.asset === stage?.asset;

        if (sameStage) {
            return;
        }

        this.forcedStage = stage;
        this.wake();

        if (this.forcedStage) {
            this.particleSystem
                .setStage(this.forcedStage)
                .catch((error) => {
                    console.error("HeroEngine forced stage failed", error);
                });
            return;
        }

        this.particleSystem
            .setStage(this.sequence.getCurrentStage())
            .catch((error) => {
                console.error("HeroEngine restore stage failed", error);
            });
    }

    private animate = (timestamp?: number) => {
        if (!this.canRun()) {
            this.looping = false;
            return;
        }
        this.animationId = requestAnimationFrame(this.animate);

        // Calm: at most 30 frames per second.
        if (this.calm && timestamp !== undefined) {
            if (timestamp - this.lastFrameAt < 32) return;
            this.lastFrameAt = timestamp;
        }

        this.timer.update(timestamp);
        const delta = this.timer.getDelta();
        const elapsed = this.timer.getElapsed();

        if (!this.forcedStage && this.sequence.update(delta)) {
            if (!this.ambientFlow) {
                this.particleSystem
                    .setStage(this.sequence.getCurrentStage())
                    .catch((error) => {
                        console.error("HeroEngine stage transition failed", error);
                    });
            }
        }

        this.flowField.update(delta);

        this.particleSystem.update(
            delta,
            elapsed,
            this.flowField,
            this.forcedStage ? 1 : this.sequence.getProgress()
        );

        this.renderer.render(this.scene, this.camera);
    };

    private initRenderer(): void {
        const { width, height } = this.getViewportSize();

        this.renderer = new WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });

        this.renderer.setPixelRatio(this.getRenderPixelRatio());

        this.renderer.setSize(width, height, false);

        this.renderer.outputColorSpace =
            SRGBColorSpace;

        this.renderer.setClearColor(0x020712, 1);
    }

    private initScene(): void {
        this.scene = new Scene();
    }

    private initCamera(): void {
        const { width, height } = this.getViewportSize();

        this.camera = new PerspectiveCamera(
            45,
            width / height,
            0.1,
            1000
        );

        this.camera.position.set(0, 0, 100);
    }

    private onResize = () => {
        const { width, height } = this.getViewportSize();

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setPixelRatio(this.getRenderPixelRatio());

        this.renderer.setSize(width, height, false);
        this.updateParticleBounds();
        this.particleSystem.resize(this.getRenderPixelRatio());
        this.wake();
        if (this.forcedStage?.type === "composite") {
            this.particleSystem.setStage(this.forcedStage).catch((error) => {
                console.error("HeroEngine title resize failed", error);
            });
        }
        this.updateScrollAnchor();
    };

    private updateScrollAnchor = () => {
        // Keep formation fixed in hero coordinates; visibility is controlled externally.
        this.particleSystem.setAnchorOffsetY(0);
    };

    private onScroll = () => {
        this.updateScrollAnchor();
    };

    private onPointerMove = (event: PointerEvent) => {
        const rect = this.canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);

        this.pointerNdc.set(x, y, 0.5);
        this.pointerNdc.unproject(this.camera);

        this.pointerDir.copy(this.pointerNdc).sub(this.camera.position).normalize();

        const distanceToZ0 = -this.camera.position.z / this.pointerDir.z;
        this.pointerWorld.copy(this.camera.position).addScaledVector(this.pointerDir, distanceToZ0);

        this.particleSystem.setMousePosition(this.pointerWorld.x, this.pointerWorld.y);
    };

    private onPointerLeave = () => {
        this.particleSystem.clearMouse();
    };

    private onPointerOut = (event: PointerEvent) => {
        if (event.relatedTarget === null) {
            this.onPointerLeave();
        }
    };
}
