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

    private getRenderPixelRatio(): number {
        return Math.min(window.devicePixelRatio || 1, 1.5);
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
    }

    public start(): void {
        this.timer.reset();
        this.animate();
    }

    public destroy(): void {
        cancelAnimationFrame(this.animationId);
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

    public setForcedLogoAsset(assetUrl: string | null): void {
        this.ambientFlow = false;
        const normalized = assetUrl && assetUrl.trim().length > 0 ? assetUrl.trim() : null;

        if (!normalized) {
            this.setForcedStage(null);
            return;
        }

        this.setForcedStage({
            id: "forced-logo",
            type: "logo",
            text: normalized,
            duration: 9999
        });
    }

    private setForcedStage(stage: SequenceStage | null): void {
        const sameStage =
            this.forcedStage?.type === stage?.type &&
            this.forcedStage?.text === stage?.text;

        if (sameStage) {
            return;
        }

        this.forcedStage = stage;

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
        this.animationId = requestAnimationFrame(this.animate);

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
