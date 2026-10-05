import {
    AdditiveBlending,
    BufferAttribute,
    BufferGeometry,
    Color,
    Points,
    ShaderMaterial,
    type IUniform,
    type Scene
} from "three";
import vertexShader from "../../shaders/render.vert?raw";
import fragmentShader from "../../shaders/render.frag?raw";
import { FlowField } from "./FlowField";
import type { ForceVector } from "./FlowField";
import { ShapeFactory } from "./ShapeFactory";
import type { SequenceStage } from "./SequenceManager";
import { DEFAULT_WING_IMAGE } from "../../utils/resolveImage";
import axatelLogo from "../../assets/immagini/Axatel.svg";

export class ParticleSystem {
    public readonly PARTICLE_COUNT: number;
    private readonly MIN_SHARED_PREFIX_WORDS = 5;
    private readonly TEXT_FREE_PARTICLE_STEP = 24;
    private readonly SUFFIX_CARRIER_PARTICLE_STEP = 1;
    private readonly SUFFIX_TRANSITION_DURATION = 0.38;
    private readonly SUFFIX_DISSOLVE_RATIO = 0.35;
    private worldHalfWidth = 60;
    private worldHalfHeight = 34;
    private worldCacheKey = "120x68";
    private readonly canvas: HTMLCanvasElement;
    private readonly positions: Float32Array;
    private readonly velocities: Float32Array;
    private readonly particleOpacities: Float32Array;
    private targetPositions: Float32Array | null = null;
    private readonly geometry: BufferGeometry;
    private readonly material: ShaderMaterial;
    private readonly flowForce: ForceVector = { x: 0, y: 0 };
    private readonly mouseLatch: Float32Array;
    private readonly uniforms: {
        uTime: IUniform<number>;
        uPointSize: IUniform<number>;
        uColor: IUniform<Color>;
        uOpacity: IUniform<number>;
        uPixelRatio: IUniform<number>;
    };
    private currentStageType: SequenceStage["type"] = "flow";
    private currentStageId = "flow";
    private readonly formationCache = new Map<string, Float32Array>();
    private mouseX = 0;
    private mouseY = 0;
    private hasMouse = false;
    private anchorOffsetY = 0;
    private formationSuppressed = false;
    private lastPhraseText: string | null = null;
    private lastPhraseFormation: Float32Array | null = null;
    private lockedPrefixParticles: Uint8Array | null = null;
    private suffixCarrierParticles: Uint8Array | null = null;
    private dissolvingSuffixParticles: Uint8Array | null = null;
    private suffixTransitionElapsed = 0;
    // Tempo (s) entro cui una formazione deve risultare completamente composta.
    private readonly FORMATION_SETTLE_DURATION = 1;
    private formationElapsed = 0;

    private clamp01(value: number): number {
        return Math.min(1, Math.max(0, value));
    }

    private toWords(value: string): string[] {
        return value
            .toLowerCase()
            .trim()
            .split(/\s+/)
            .filter((word) => word.length > 0);
    }

    private countSharedPrefixWords(left: string, right: string): number {
        const leftWords = this.toWords(left);
        const rightWords = this.toWords(right);
        const max = Math.min(leftWords.length, rightWords.length);

        let shared = 0;
        for (let i = 0; i < max; i++) {
            if (leftWords[i] !== rightWords[i]) {
                break;
            }
            shared += 1;
        }

        return shared;
    }

    private countSuffixCharacters(value: string, prefixWordCount: number): number {
        return this.toWords(value)
            .slice(prefixWordCount)
            .join("")
            .length;
    }

    private isFreeTextParticleIndex(index: number): boolean {
        return index % this.TEXT_FREE_PARTICLE_STEP === 0;
    }

    private blendSharedPrefixTargets(
        previous: Float32Array,
        next: Float32Array,
        previousSuffixBounds: { minX: number; maxX: number; minY: number; maxY: number } | null,
        nextSuffixBounds: { minX: number; maxX: number; minY: number; maxY: number } | null
    ): Float32Array {
        const result = new Float32Array(next.length);
        const lockedParticles = new Uint8Array(this.PARTICLE_COUNT);
        const carrierParticles = new Uint8Array(this.PARTICLE_COUNT);
        const dissolvingParticles = new Uint8Array(this.PARTICLE_COUNT);
        const suffixTargets: Array<{ x: number; y: number }> = [];
        const carriers: number[] = [];
        const paddingX = 0.9;
        const paddingY = 2.4;
        const isInsideBounds = (
            x: number,
            y: number,
            bounds: { minX: number; maxX: number; minY: number; maxY: number } | null
        ): boolean => {
            return Boolean(
                bounds &&
                x >= bounds.minX - paddingX &&
                x <= bounds.maxX + paddingX &&
                y >= bounds.minY - paddingY &&
                y <= bounds.maxY + paddingY
            );
        };

        for (let index = 0; index < next.length; index += 3) {
            const particleIndex = index / 3;
            const nextX = next[index]!;
            const nextY = next[index + 1]!;

            if (isInsideBounds(nextX, nextY, nextSuffixBounds)) {
                suffixTargets.push({ x: nextX, y: nextY });
            }

            if (particleIndex % this.SUFFIX_CARRIER_PARTICLE_STEP === 0) {
                carriers.push(particleIndex);
            }
        }

        let suffixCursor = 0;
        const carrierSet = new Set(carriers);

        for (let index = 0; index < next.length; index += 3) {
            const particleIndex = index / 3;
            const prevX = previous[index]!;
            const prevY = previous[index + 1]!;
            const wasInSuffix = isInsideBounds(prevX, prevY, previousSuffixBounds);
            const isNextSuffixTarget = isInsideBounds(next[index]!, next[index + 1]!, nextSuffixBounds);
            const isFreeTextParticle = this.isFreeTextParticleIndex(particleIndex);
            const isLockedPrefixParticle = !wasInSuffix && !isFreeTextParticle;

            if (isLockedPrefixParticle) {
                lockedParticles[particleIndex] = 1;
                result[index] = prevX + (Math.random() - 0.5) * 0.04;
                result[index + 1] = prevY + (Math.random() - 0.5) * 0.04;
                result[index + 2] = 0;
                continue;
            }

            if (isNextSuffixTarget) {
                result[index] = next[index]!;
                result[index + 1] = next[index + 1]!;
                result[index + 2] = 0;
                continue;
            }

            const suffixTarget = suffixTargets[suffixCursor % Math.max(1, suffixTargets.length)];
            const isCarrier = carrierSet.has(particleIndex);

            if (isCarrier && suffixTarget) {
                carrierParticles[particleIndex] = 1;
                suffixCursor += 1;
                result[index] = suffixTarget.x;
                result[index + 1] = suffixTarget.y;
                result[index + 2] = 0;
                continue;
            }

            if (wasInSuffix) {
                dissolvingParticles[particleIndex] = 1;
            }

            if (!wasInSuffix) {
                result[index] = previous[index]!;
                result[index + 1] = previous[index + 1]!;
                result[index + 2] = 0;
                continue;
            }

            result[index] = previous[index]!;
            result[index + 1] = previous[index + 1]!;
            result[index + 2] = 0;
        }

        this.lockedPrefixParticles = lockedParticles;
        this.suffixCarrierParticles = carrierParticles;
        this.dissolvingSuffixParticles = dissolvingParticles;
        this.suffixTransitionElapsed = 0;
        return result;
    }

    constructor(scene: Scene, canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const viewportArea = window.innerWidth * window.innerHeight;
        this.PARTICLE_COUNT = viewportArea > 3_200_000
            ? Math.min(42000, Math.round((viewportArea / 3_200_000) * 24000))
            : viewportArea > 1_600_000
                ? 18000
                : 9000;
        this.positions = new Float32Array(this.PARTICLE_COUNT * 3);
        this.velocities = new Float32Array(this.PARTICLE_COUNT * 3);
        this.particleOpacities = new Float32Array(this.PARTICLE_COUNT).fill(1);
        this.mouseLatch = new Float32Array(this.PARTICLE_COUNT);

        this.uniforms = {
            uTime: { value: 0 },
            uPointSize: { value: 2.1 },
            uColor: { value: new Color(0x79cfff) },
            uOpacity: { value: 0.76 },
            uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.5) }
        };

        for (let i = 0; i < this.PARTICLE_COUNT; i++) {
            const index = i * 3;
            this.positions[index] = (Math.random() * 2 - 1) * this.worldHalfWidth;
            this.positions[index + 1] = (Math.random() * 2 - 1) * this.worldHalfHeight;
            this.positions[index + 2] = 0;
            this.velocities[index] = (Math.random() - 0.5) * 0.02;
            this.velocities[index + 1] = (Math.random() - 0.5) * 0.02;
            this.velocities[index + 2] = 0;
        }

        this.geometry = new BufferGeometry();
        this.geometry.setAttribute(
            "position",
            new BufferAttribute(this.positions, 3)
        );
        this.geometry.setAttribute(
            "aOpacity",
            new BufferAttribute(this.particleOpacities, 1)
        );

        this.material = new ShaderMaterial({
            transparent: true,
            depthTest: false,
            blending: AdditiveBlending,
            vertexShader,
            fragmentShader,
            uniforms: this.uniforms
        });

        const points = new Points(this.geometry, this.material);
        points.frustumCulled = false;
        scene.add(points);
    }

    public resize(pixelRatio: number): void {
        this.uniforms.uPixelRatio.value = Math.min(pixelRatio, 1.5);
    }

    private getPixelsPerWorldUnit(): number {
        const heightPx = this.canvas.clientHeight || window.innerHeight;
        return heightPx / Math.max(1, this.worldHalfHeight * 2);
    }

    public setMousePosition(x: number, y: number): void {
        this.mouseX = x;
        this.mouseY = y;
        this.hasMouse = true;
    }

    public clearMouse(): void {
        this.hasMouse = false;
        this.mouseLatch.fill(0);
    }

    public setAnchorOffsetY(offsetY: number): void {
        this.anchorOffsetY = Math.max(0, offsetY);
    }

    public setFormationSuppressed(suppressed: boolean): void {
        this.formationSuppressed = suppressed;
    }

    public async releaseToAmbientFlow(): Promise<void> {
        await this.setStage({
            id: "ambient-flow",
            type: "flow",
            duration: 9999
        });

        for (let i = 0; i < this.PARTICLE_COUNT; i++) {
            const index = i * 3;
            const px = this.positions[index]!;
            const py = this.positions[index + 1]!;
            const distance = Math.hypot(px, py);
            const angle = distance > 0.001
                ? Math.atan2(py, px)
                : Math.random() * Math.PI * 2;
            const tangent = angle + Math.PI / 2;
            const radialSpeed = 0.08 + Math.random() * 0.16;
            const tangentSpeed = (Math.random() - 0.5) * 0.09;

            this.velocities[index] = Math.cos(angle) * radialSpeed + Math.cos(tangent) * tangentSpeed;
            this.velocities[index + 1] = Math.sin(angle) * radialSpeed + Math.sin(tangent) * tangentSpeed;
            this.velocities[index + 2] = 0;
        }
    }

    public setWorldBounds(width: number, height: number): void {
        this.worldHalfWidth = Math.max(18, width / 2);
        this.worldHalfHeight = Math.max(12, height / 2);
        const nextWorldCacheKey = `${Math.round(this.worldHalfWidth * 20)}x${Math.round(this.worldHalfHeight * 20)}`;
        if (nextWorldCacheKey !== this.worldCacheKey) {
            this.worldCacheKey = nextWorldCacheKey;
            this.formationCache.clear();
        }
    }

    public dispose(): void {
        this.geometry.dispose();
        this.material.dispose();
    }

    public async setStage(stage: SequenceStage): Promise<void> {
        const previousPhraseText = this.lastPhraseText;
        const previousPhraseFormation = this.lastPhraseFormation;
        const wasTextStage = this.currentStageType === "text";

        if (this.currentStageType === stage.type && stage.type === "flow") {
            return;
        }

        this.currentStageType = stage.type;
        this.currentStageId = stage.id;

        if (stage.type === "flow") {
            this.targetPositions = null;
            this.particleOpacities.fill(1);
            (this.geometry.attributes.aOpacity as BufferAttribute).needsUpdate = true;
            this.lockedPrefixParticles = null;
            this.suffixCarrierParticles = null;
            this.dissolvingSuffixParticles = null;
            this.lastPhraseText = null;
            this.lastPhraseFormation = null;
            this.uniforms.uOpacity.value = 0.74;
            this.uniforms.uPointSize.value = 2.2;
            return;
        }

        if (stage.type === "scatter") {
            this.targetPositions = this.createScatterTargets();
            this.formationElapsed = 0;
            this.lockedPrefixParticles = null;
            this.suffixCarrierParticles = null;
            this.dissolvingSuffixParticles = null;
            this.uniforms.uOpacity.value = 0.82;
            this.uniforms.uPointSize.value = 2.25;
            return;
        }

        const text = stage.text || "AXATEL";
        const cacheKey = `${this.worldCacheKey}:${stage.type}:${text}:${stage.asset || ""}:${stage.fontSizeReference || ""}`;
        let formation = this.formationCache.get(cacheKey);

        if (!formation) {
            if (stage.type === "composite") {
                formation = await ShapeFactory.createCompositeFormation(
                    text,
                    stage.asset || DEFAULT_WING_IMAGE,
                    this.PARTICLE_COUNT,
                    this.worldHalfWidth * 2,
                    this.worldHalfHeight * 2,
                    this.getPixelsPerWorldUnit(),
                    stage.id === "angel-bpm",
                    stage.fontSizeReference
                );
            } else if (stage.type === "logo") {
                const isCustomLogoAsset = Boolean(stage.asset);
                const logoWidth = isCustomLogoAsset
                    ? this.worldHalfWidth * 2 * 0.92
                    : this.worldHalfWidth * 2 * 0.69;
                const logoHeight = isCustomLogoAsset
                    ? this.worldHalfHeight * 2 * 0.92
                    : this.worldHalfHeight * 2 * 0.42;
                const logoAssetUrl = stage.asset || axatelLogo;
                try {
                    formation = await ShapeFactory.createSvgFormation(
                        logoAssetUrl,
                        this.PARTICLE_COUNT,
                        logoWidth,
                        logoHeight,
                        stage.id === "forced-cases-logo" || stage.id === "forced-quote-logo"
                            ? { ignoreLightPixels: false, ignoreDarkPixels: true }
                            : isCustomLogoAsset ? undefined : { ignoreDarkPixels: true }
                    );
                } catch (error) {
                    console.warn(`[ParticleSystem] Could not load hero logo "${logoAssetUrl}"; displaying "${text}" instead.`, error);
                    formation = ShapeFactory.createTextFormation(
                        text,
                        this.PARTICLE_COUNT,
                        logoWidth,
                        logoHeight
                    );
                }
            } else {
                const isNarrowWorld = this.worldHalfWidth / Math.max(1, this.worldHalfHeight) < 0.82;
                const isQuoteStage = /^forced-text$/.test(stage.id) && /\nCEO,\s*Axatel$/i.test(text.trim());
                const textWidth = this.worldHalfWidth * 2 * (isNarrowWorld ? 0.76 : isQuoteStage ? 0.94 : 0.92);
                const textHeight = this.worldHalfHeight * 2 * (isNarrowWorld ? 0.9 : isQuoteStage ? 0.94 : 0.84);
                formation = ShapeFactory.createTextFormation(
                    text,
                    this.PARTICLE_COUNT,
                    textWidth,
                    textHeight
                );
            }

            this.formationCache.set(cacheKey, formation);
        }

        const rawFormation = formation;
        this.particleOpacities.fill(1);
        (this.geometry.attributes.aOpacity as BufferAttribute).needsUpdate = true;
        this.lockedPrefixParticles = null;
        this.suffixCarrierParticles = null;
        this.dissolvingSuffixParticles = null;

        if (
            stage.type === "text" &&
            stage.id.startsWith("phrase-") &&
            wasTextStage &&
            previousPhraseText &&
            previousPhraseFormation
        ) {
            const nextPhraseText = (stage.text || "").trim();
            const sharedPrefixWords = this.countSharedPrefixWords(previousPhraseText, nextPhraseText);
            const previousSuffixLength = this.countSuffixCharacters(previousPhraseText, sharedPrefixWords);
            const nextSuffixLength = this.countSuffixCharacters(nextPhraseText, sharedPrefixWords);

            if (
                sharedPrefixWords >= this.MIN_SHARED_PREFIX_WORDS &&
                nextSuffixLength <= previousSuffixLength
            ) {
                const previousSuffixBounds = ShapeFactory.getTextSuffixBounds(
                    previousPhraseText,
                    sharedPrefixWords,
                    this.worldHalfWidth * 2 * (this.worldHalfWidth / Math.max(1, this.worldHalfHeight) < 0.82 ? 0.76 : 0.92),
                    this.worldHalfHeight * 2 * (this.worldHalfWidth / Math.max(1, this.worldHalfHeight) < 0.82 ? 0.9 : 0.84)
                );
                const nextSuffixBounds = ShapeFactory.getTextSuffixBounds(
                    nextPhraseText,
                    sharedPrefixWords,
                    this.worldHalfWidth * 2 * (this.worldHalfWidth / Math.max(1, this.worldHalfHeight) < 0.82 ? 0.76 : 0.92),
                    this.worldHalfHeight * 2 * (this.worldHalfWidth / Math.max(1, this.worldHalfHeight) < 0.82 ? 0.9 : 0.84)
                );
                formation = this.blendSharedPrefixTargets(
                    previousPhraseFormation,
                    rawFormation,
                    previousSuffixBounds,
                    nextSuffixBounds
                );
            }
        }

        const isNarrowWorld = this.worldHalfWidth / Math.max(1, this.worldHalfHeight) < 0.82;
        this.targetPositions = formation;
        this.formationElapsed = 0;
        if (stage.id === "angel-bpm") {
            const counts = new Map<string, number>();
            const keys: string[] = [];
            for (let i = 0; i < this.PARTICLE_COUNT; i++) {
                const key = `${formation[i * 3]},${formation[i * 3 + 1]}`;
                keys.push(key);
                counts.set(key, (counts.get(key) ?? 0) + 1);
            }
            // Additive blending must not brighten grid cells that carry multiple particles.
            for (let i = 0; i < this.PARTICLE_COUNT; i++) {
                this.particleOpacities[i] = 1 / counts.get(keys[i]!)!;
            }
        }
        this.uniforms.uOpacity.value = stage.type === "logo" ? 1.0 : isNarrowWorld ? 0.84 : 0.9;
        this.uniforms.uPointSize.value = stage.type === "logo" ? 3.9 : isNarrowWorld ? 2.45 : 2.7;

        if (stage.type === "text" && stage.id.startsWith("phrase-")) {
            this.lastPhraseText = (stage.text || "").trim();
            this.lastPhraseFormation = rawFormation;
        }

    }

    public update(
        delta: number,
        elapsed: number,
        flowField: FlowField,
        stageProgress: number
    ): void {
        this.uniforms.uTime.value = elapsed;

        if (this.suffixCarrierParticles || this.dissolvingSuffixParticles) {
            this.suffixTransitionElapsed = Math.min(
                this.SUFFIX_TRANSITION_DURATION,
                this.suffixTransitionElapsed + delta
            );
        }

        const isForcedLogoStage = this.currentStageType === "logo" && this.currentStageId.startsWith("forced-");
        const isQuoteLogoStage = this.currentStageId === "forced-quote-logo";
        const logoEndBoost = this.currentStageType === "logo" && !isForcedLogoStage
            ? this.clamp01((stageProgress - 0.72) / 0.28)
            : 0;
        const logoEndBoostEase = logoEndBoost * logoEndBoost;

        const hasTarget = this.targetPositions !== null && !this.formationSuppressed;

        if (hasTarget) {
            this.formationElapsed = Math.min(
                this.FORMATION_SETTLE_DURATION,
                this.formationElapsed + delta
            );
        }

        // La rampa irrigidisce la molla finché la scritta non è composta entro FORMATION_SETTLE_DURATION.
        const settleRamp = this.clamp01(this.formationElapsed / this.FORMATION_SETTLE_DURATION);
        const settleBoost = settleRamp * settleRamp;
        const attraction = hasTarget
            ? 0.26 + settleBoost * 0.5 + stageProgress * 0.06 + logoEndBoostEase * 0.16
            : 0.022;
        const friction = hasTarget
            ? 0.68 - settleBoost * 0.14 - logoEndBoostEase * 0.08
            : 0.965;
        const maxSpeed = hasTarget
            ? 2.2 + logoEndBoostEase * 1.6
            : 0.3;
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        this.resize(pixelRatio);

        const halfX = this.worldHalfWidth;
        const halfY = this.worldHalfHeight;
        const target = hasTarget ? this.targetPositions : null;
        const isLogoStage = this.currentStageType === "logo";
        const isTextStage = this.currentStageType === "text" || this.currentStageType === "composite";
        const isAnchoredFormationStage = isLogoStage || isTextStage || this.currentStageType === "scatter";
        const allowOutOfViewByScroll = isAnchoredFormationStage && this.anchorOffsetY > 0.0001;
        // On portrait screens (phones) the hero headline fills the width,
        // so the quote logo sits in the empty band above it instead of on
        // the right, where it used to overlap the headline.
        const isPortraitViewport = halfY > halfX * 1.1;
        const forcedLogoOffsetX = isQuoteLogoStage
            ? (isPortraitViewport ? 0 : halfX * 0.48)
            : isForcedLogoStage
                ? halfX * 0.06
                : 0;
        const forcedLogoOffsetY = isQuoteLogoStage && isPortraitViewport ? halfY * 0.6 : 0;
        const suffixTransitionProgress = this.clamp01(
            this.suffixTransitionElapsed / this.SUFFIX_TRANSITION_DURATION
        );
        const isSuffixDissolving = suffixTransitionProgress < this.SUFFIX_DISSOLVE_RATIO;

        let logoScaleX = 1;
        let logoScaleY = 1;

        if (isLogoStage && !isForcedLogoStage) {
            const rampProgress = this.clamp01((stageProgress - 0.2) / 0.8);
            const rampEase = rampProgress * rampProgress * (3 - 2 * rampProgress);

            logoScaleX = 1.0 + rampEase * 6.5;
            logoScaleY = 1.0 + rampEase * 7.2;
            this.uniforms.uPointSize.value = 3.0 - rampEase * 1.5;
            this.uniforms.uOpacity.value = 1;
        } else if (isLogoStage) {
            // Forced section logos must remain stable and visible.
            logoScaleX = isQuoteLogoStage ? 0.62 : 1;
            logoScaleY = isQuoteLogoStage ? 0.62 : 1;
            this.uniforms.uPointSize.value = 3.9;
            this.uniforms.uOpacity.value = 1;
        }

        for (let i = 0; i < this.PARTICLE_COUNT; i++) {
            const index = i * 3;
            let px = this.positions[index]!;
            let py = this.positions[index + 1]!;
            let isReleasedLogoParticle = false;
            let isDissolvingLogoParticle = false;
            let isFreeTextParticle = false;
            let isFreeLogoParticle = false;
            const isLockedPrefixParticle = this.lockedPrefixParticles?.[i] === 1;
            const isSuffixCarrierParticle = this.suffixCarrierParticles?.[i] === 1;
            const isDissolvingSuffixParticle = this.dissolvingSuffixParticles?.[i] === 1;

            flowField.getForce(px, py, this.flowForce);
            let fx = this.flowForce.x;
            let fy = this.flowForce.y;

            // Per-particle phase offsets break coherent waves into scattered turbulence.
            const chaosX = Math.sin(i * 17.389 + elapsed * 1.9) * 0.02;
            const chaosY = Math.cos(i * 41.713 - elapsed * 1.7) * 0.02;
            fx += chaosX;
            fy += chaosY;

            let tx = 0;
            let ty = 0;
            if (target) {
                if (isLogoStage && !isForcedLogoStage) {
                    const dissolveThreshold = 0.48 + ((i * 73 + 19) % 101) / 100 * 0.36;
                    isDissolvingLogoParticle = stageProgress >= dissolveThreshold;
                    isReleasedLogoParticle = isDissolvingLogoParticle;
                    this.particleOpacities[i] = 1;
                } else if (this.currentStageId !== "angel-bpm") {
                    this.particleOpacities[i] = 1;
                }

                isFreeTextParticle = isTextStage &&
                    this.isFreeTextParticleIndex(i) &&
                    !isLockedPrefixParticle &&
                    (!isSuffixCarrierParticle || isSuffixDissolving);
                isFreeLogoParticle = isLogoStage && !isForcedLogoStage &&
                    stageProgress < 0.28 && i % 40 === 0;

                if (!isFreeTextParticle && !isFreeLogoParticle) {
                    fx *= 0.12;
                    fy *= 0.12;
                }

                tx = target[index]!;
                ty = target[index + 1]!;

                if (isLogoStage) {
                    tx *= logoScaleX;
                    ty *= logoScaleY;

                    if (forcedLogoOffsetX !== 0) {
                        tx += forcedLogoOffsetX;
                    }
                    if (forcedLogoOffsetY !== 0) {
                        ty += forcedLogoOffsetY;
                    }

                }

                if (isAnchoredFormationStage) {
                    ty -= this.anchorOffsetY;
                }

                if (!isFreeTextParticle && !isFreeLogoParticle && !isReleasedLogoParticle && !isDissolvingSuffixParticle) {
                    const particleAttraction = isLockedPrefixParticle ? 0.38 : attraction;
                    fx += (tx - px) * particleAttraction;
                    fy += (ty - py) * particleAttraction;
                }
            }

            if (isDissolvingLogoParticle) {
                const directionLength = Math.hypot(tx, ty);
                const direction = directionLength > 0.001
                    ? Math.atan2(ty, tx)
                    : i * 2.399963229728653;
                const directionX = Math.cos(direction);
                const directionY = Math.sin(direction);
                const finalExplosion = this.clamp01((stageProgress - 0.84) / 0.16);
                const drift = 0.025 + finalExplosion * 0.32;
                fx += directionX * drift + Math.sin(i * 2.17 + elapsed * 3) * 0.025;
                fy += directionY * drift + Math.cos(i * 1.73 - elapsed * 3) * 0.025;
            }

            if (isDissolvingSuffixParticle) {
                const dissolveDirection = Math.sign(px - target![index]!) || (i % 2 === 0 ? 1 : -1);
                const dissolveStrength = isSuffixDissolving ? 0.1 : 0.03;
                fx += dissolveDirection * dissolveStrength;
                fy += Math.sin(i * 0.71 + elapsed * 5) * dissolveStrength;
            }

            const isFreeParticle = !target || isFreeTextParticle || isFreeLogoParticle || isReleasedLogoParticle || isDissolvingSuffixParticle;
            let latch = this.mouseLatch[i]!;

            if (latch > 0) {
                latch = Math.max(0, latch - delta);
            }

            if (isFreeParticle && (this.hasMouse || latch > 0)) {
                const dx = this.mouseX - px;
                const dy = this.mouseY - py;
                const distance = Math.hypot(dx, dy);
                const mouseRadius = Math.min(halfX, halfY) * 0.7;
                const inRange = distance < mouseRadius;

                let distanceFalloff = 0;
                if (inRange) {
                    const t = 1 - distance / mouseRadius;
                    distanceFalloff = t * t;

                    if (distanceFalloff > 0.06) {
                        latch = Math.max(latch, 0.09 + distanceFalloff * 0.26);
                    }
                }

                if (latch > 0 && distance > 0.0001) {
                    const latchRatio = this.clamp01(latch / 0.35);
                    const holdPull = 0.015 + latchRatio * 0.08;
                    const livePull = distanceFalloff * 0.2;
                    const mousePull = holdPull + livePull;

                    fx += (dx / distance) * mousePull;
                    fy += (dy / distance) * mousePull;
                }
            }

            this.mouseLatch[i] = latch;

            let vx = this.velocities[index]! + fx;
            let vy = this.velocities[index + 1]! + fy;

            if (isLockedPrefixParticle && target) {
                vx = 0;
                vy = 0;
                px = target[index]!;
                py = target[index + 1]! - (isAnchoredFormationStage ? this.anchorOffsetY : 0);
            }

            vx *= friction;
            vy *= friction;

            const speed = Math.hypot(vx, vy);
            if (speed > maxSpeed) {
                const scale = maxSpeed / speed;
                vx *= scale;
                vy *= scale;
            }

            px += vx * delta * 60;
            py += vy * delta * 60;

            if (isLogoStage && !isForcedLogoStage) {
                // Keep the burst in view so the same particles can form the next title.
                const safeX = halfX * 0.94;
                const safeY = halfY * 0.94;
                if (Math.abs(px) > safeX) {
                    px = Math.sign(px) * safeX;
                    vx = -Math.sign(px) * Math.abs(vx) * 0.65;
                }
                if (Math.abs(py) > safeY) {
                    py = Math.sign(py) * safeY;
                    vy = -Math.sign(py) * Math.abs(vy) * 0.65;
                }
            } else if (target && isFreeParticle) {
                const ambientHalfX = halfX * 1.35;
                const ambientHalfY = halfY * 1.35;

                if (px > ambientHalfX || px < -ambientHalfX || py > ambientHalfY || py < -ambientHalfY) {
                    px = (Math.random() * 2 - 1) * ambientHalfX;
                    py = (Math.random() * 2 - 1) * ambientHalfY;
                    vx = (Math.random() - 0.5) * 0.08;
                    vy = (Math.random() - 0.5) * 0.08;
                }
            } else if (!target) {
                if (px > halfX) {
                    px = -halfX + Math.random() * 2.2;
                    py += (Math.random() - 0.5) * 4;
                }
                if (px < -halfX) {
                    px = halfX - Math.random() * 2.2;
                    py += (Math.random() - 0.5) * 4;
                }
                if (py > halfY) {
                    py = -halfY + Math.random() * 2.2;
                    px += (Math.random() - 0.5) * 4;
                }
                if (py < -halfY) {
                    py = halfY - Math.random() * 2.2;
                    px += (Math.random() - 0.5) * 4;
                }
            } else {
                if (isLogoStage || allowOutOfViewByScroll) {
                    // During final logo zoom, released particles are allowed to leave the viewport.
                    this.positions[index] = px;
                    this.positions[index + 1] = py;
                    this.velocities[index] = vx;
                    this.velocities[index + 1] = vy;
                    continue;
                }

                // Keep target stages fully inside the visible world to avoid clipped glyphs/logos.
                const safeX = halfX - 0.05;
                const safeY = halfY - 0.05;

                if (px > safeX) {
                    px = safeX;
                    vx *= 0.65;
                }
                if (px < -safeX) {
                    px = -safeX;
                    vx *= 0.65;
                }
                if (py > safeY) {
                    py = safeY;
                    vy *= 0.65;
                }
                if (py < -safeY) {
                    py = -safeY;
                    vy *= 0.65;
                }
            }

            this.positions[index] = px;
            this.positions[index + 1] = py;
            this.velocities[index] = vx;
            this.velocities[index + 1] = vy;
        }

        (this.geometry.attributes.position as BufferAttribute).needsUpdate = true;
        if (isLogoStage && !isForcedLogoStage) {
            (this.geometry.attributes.aOpacity as BufferAttribute).needsUpdate = true;
        }
    }

    private createScatterTargets(): Float32Array {
        const result = new Float32Array(this.PARTICLE_COUNT * 3);

        for (let i = 0; i < this.PARTICLE_COUNT; i++) {
            const index = i * 3;
            result[index] = (Math.random() * 2 - 1) * this.worldHalfWidth * 0.995;
            result[index + 1] = (Math.random() * 2 - 1) * this.worldHalfHeight * 0.995;
            result[index + 2] = 0;
        }

        return result;
    }

}
