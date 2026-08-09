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

export class ParticleSystem {
    public readonly PARTICLE_COUNT: number;
    private readonly MIN_SHARED_PREFIX_WORDS = 5;
    private readonly TEXT_FREE_PARTICLE_STEP = 24;
    private readonly SUFFIX_CARRIER_PARTICLE_STEP = 1;
    private readonly SUFFIX_TRANSITION_DURATION = 1.1;
    private readonly SUFFIX_DISSOLVE_RATIO = 0.46;
    private worldHalfWidth = 60;
    private worldHalfHeight = 34;
    private worldCacheKey = "120x68";
    private readonly positions: Float32Array;
    private readonly velocities: Float32Array;
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
    private hasPrimedInitialText = false;
    private lastPhraseText: string | null = null;
    private lastPhraseFormation: Float32Array | null = null;
    private lockedPrefixParticles: Uint8Array | null = null;
    private suffixCarrierParticles: Uint8Array | null = null;
    private dissolvingSuffixParticles: Uint8Array | null = null;
    private suffixTransitionElapsed = 0;

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
        const viewportArea = window.innerWidth * window.innerHeight;
        this.PARTICLE_COUNT = viewportArea > 3_200_000
            ? Math.min(42000, Math.round((viewportArea / 3_200_000) * 24000))
            : viewportArea > 1_600_000
                ? 18000
                : 9000;
        this.positions = new Float32Array(this.PARTICLE_COUNT * 3);
        this.velocities = new Float32Array(this.PARTICLE_COUNT * 3);
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
            this.lockedPrefixParticles = null;
            this.suffixCarrierParticles = null;
            this.dissolvingSuffixParticles = null;
            this.uniforms.uOpacity.value = 0.82;
            this.uniforms.uPointSize.value = 2.25;
            return;
        }

        const text = stage.text || "AXATEL";
        const cacheKey = `${this.worldCacheKey}:${stage.type}:${text}`;
        let formation = this.formationCache.get(cacheKey);

        if (!formation) {
            if (stage.type === "logo") {
                const isCustomLogoAsset = Boolean(stage.text && /^\/immagini\//.test(stage.text));
                const logoWidth = isCustomLogoAsset
                    ? this.worldHalfWidth * 2 * 0.92
                    : this.worldHalfWidth * 2 * 0.69;
                const logoHeight = isCustomLogoAsset
                    ? this.worldHalfHeight * 2 * 0.92
                    : this.worldHalfHeight * 2 * 0.42;
                const logoAssetUrl = isCustomLogoAsset ? stage.text! : "/immagini/Axatel.svg";
                try {
                    formation = await ShapeFactory.createSvgFormation(
                        logoAssetUrl,
                        this.PARTICLE_COUNT,
                        logoWidth,
                        logoHeight
                    );
                } catch {
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

            if (sharedPrefixWords >= this.MIN_SHARED_PREFIX_WORDS) {
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
        this.uniforms.uOpacity.value = stage.type === "logo" ? 1.0 : isNarrowWorld ? 0.84 : 0.9;
        this.uniforms.uPointSize.value = stage.type === "logo" ? 3.9 : isNarrowWorld ? 2.45 : 2.7;

        if (stage.type === "text" && stage.id.startsWith("phrase-")) {
            this.lastPhraseText = (stage.text || "").trim();
            this.lastPhraseFormation = rawFormation;
        }

        if (stage.type === "text" && stage.id === "phrase-1" && !this.hasPrimedInitialText) {
            this.primeInitialTextFormation(formation);
            this.hasPrimedInitialText = true;
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
        const logoEndBoost = this.currentStageType === "logo" && !isForcedLogoStage
            ? this.clamp01((stageProgress - 0.78) / 0.22)
            : 0;
        const logoEndBoostEase = logoEndBoost * logoEndBoost;

        const hasTarget = this.targetPositions !== null && !this.formationSuppressed;
        const attraction = hasTarget
            ? 0.042 + stageProgress * 0.05 + logoEndBoostEase * 0.16
            : 0.022;
        const friction = hasTarget
            ? 0.9 - logoEndBoostEase * 0.08
            : 0.965;
        const maxSpeed = hasTarget
            ? 0.5 + logoEndBoostEase * 1.6
            : 0.3;
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        this.resize(pixelRatio);

        const halfX = this.worldHalfWidth;
        const halfY = this.worldHalfHeight;
        const target = hasTarget ? this.targetPositions : null;
        const isLogoStage = this.currentStageType === "logo";
        const isTextStage = this.currentStageType === "text";
        const isAnchoredFormationStage = isLogoStage || isTextStage || this.currentStageType === "scatter";
        const allowOutOfViewByScroll = isAnchoredFormationStage && this.anchorOffsetY > 0.0001;
        const forcedLogoOffsetX = isForcedLogoStage ? halfX * 0.06 : 0;
        const suffixTransitionProgress = this.clamp01(
            this.suffixTransitionElapsed / this.SUFFIX_TRANSITION_DURATION
        );
        const isSuffixDissolving = suffixTransitionProgress < this.SUFFIX_DISSOLVE_RATIO;

        let logoScaleX = 1;
        let logoScaleY = 1;

        if (isLogoStage && !isForcedLogoStage) {
            const holdProgress = this.clamp01(stageProgress / 0.42);
            const rampProgress = this.clamp01((stageProgress - 0.38) / 0.62);
            const rampEase = rampProgress * rampProgress * (3 - 2 * rampProgress);

            // Phase 1: logo visible and slightly wider.
            // Phase 2: hold.
            // Phase 3: aggressive zoom beyond viewport.
            logoScaleX = 1.0 + rampEase * 4.8;
            logoScaleY = 1.0 + rampEase * 5.4;

            this.uniforms.uPointSize.value = 3.9 + rampEase * 1.8;

            const holdOpacity = 1 - holdProgress * 0.03;
            const fadeProgress = this.clamp01((stageProgress - 0.9) / 0.1);
            const dissolve = 1 - fadeProgress * 0.62;
            this.uniforms.uOpacity.value = holdOpacity * dissolve;
        } else if (isLogoStage) {
            // Forced section logos must remain stable and visible.
            logoScaleX = 1;
            logoScaleY = 1;
            this.uniforms.uPointSize.value = 3.9;
            this.uniforms.uOpacity.value = 1;
        }

        for (let i = 0; i < this.PARTICLE_COUNT; i++) {
            const index = i * 3;
            let px = this.positions[index]!;
            let py = this.positions[index + 1]!;
            let isReleasedLogoParticle = false;
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

            if (target) {
                isFreeTextParticle = isTextStage &&
                    this.isFreeTextParticleIndex(i) &&
                    !isLockedPrefixParticle &&
                    (!isSuffixCarrierParticle || isSuffixDissolving);
                isFreeLogoParticle = isLogoStage && (i % 14 === 0);

                if (!isFreeTextParticle && !isFreeLogoParticle) {
                    fx *= 0.12;
                    fy *= 0.12;
                }

                let tx = target[index]!;
                let ty = target[index + 1]!;

                if (isLogoStage) {
                    tx *= logoScaleX;
                    ty *= logoScaleY;

                    if (forcedLogoOffsetX !== 0) {
                        tx += forcedLogoOffsetX;
                    }

                    // As soon as a logo target point moves outside viewport bounds,
                    // release the corresponding particle from shape constraints.
                    if (Math.abs(tx) > halfX || Math.abs(ty) > halfY) {
                        isReleasedLogoParticle = true;
                        const outX = Math.sign(tx) || (Math.random() > 0.5 ? 1 : -1);
                        const outY = Math.sign(ty) || (Math.random() > 0.5 ? 1 : -1);
                        const burst = 0.018 + logoEndBoostEase * 0.07;
                        fx += outX * burst;
                        fy += outY * burst;
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

            if (target && isFreeParticle) {
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

        (this.geometry.attributes
            .position as BufferAttribute).needsUpdate = true;
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

    private primeInitialTextFormation(target: Float32Array): void {
        for (let i = 0; i < this.PARTICLE_COUNT; i++) {
            const index = i * 3;

            // Keep a small free subset to preserve natural motion while text appears immediately.
            if (i % 12 === 0) {
                continue;
            }

            const angle = Math.random() * Math.PI * 2;
            const radius = 3.5 + Math.random() * 9.5;

            this.positions[index] = target[index]! + Math.cos(angle) * radius;
            this.positions[index + 1] = target[index + 1]! + Math.sin(angle) * radius * 0.62;
            this.positions[index + 2] = 0;

            this.velocities[index] = -Math.cos(angle) * 0.045 + (Math.random() - 0.5) * 0.012;
            this.velocities[index + 1] = -Math.sin(angle) * 0.035 + (Math.random() - 0.5) * 0.012;
            this.velocities[index + 2] = 0;
        }

        (this.geometry.attributes.position as BufferAttribute).needsUpdate = true;
    }
}
