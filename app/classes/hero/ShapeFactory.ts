import { DEFAULT_WING_IMAGE } from "@/utils/resolveImage";

export class ShapeFactory {
    private static readonly DRAW_WIDTH = 1600;
    private static readonly DRAW_HEIGHT = 520;
    private static readonly FONT_FAMILY = '"forma-djr-micro", sans-serif';
    private static readonly DESKTOP_COMPOSITE_FONT_SIZE = 138;
    private static readonly MOBILE_COMPOSITE_FONT_SIZE = 126;
    // Dimensioni rese in pixel CSS: su desktop la composizione non scala con il viewport.
    private static readonly DESKTOP_COMPOSITE_TEXT_PX = 54;
    private static readonly MOBILE_COMPOSITE_TEXT_PX = 32;
    private static readonly DESKTOP_COMPOSITE_ASSET_PX = 118;
    private static readonly DESKTOP_COMPOSITE_GAP_PX = 26;
    private static readonly DEFAULT_WING_HEIGHT_PX = 76;
    private static readonly DEFAULT_WING_OFFSET_PX = 6;

    public static async createSvgFormation(
        svgUrl: string,
        particleCount: number,
        worldWidth: number,
        worldHeight: number,
        options: { ignoreLightPixels?: boolean; ignoreDarkPixels?: boolean } = {}
    ): Promise<Float32Array> {
        const canvas = document.createElement("canvas");
        canvas.width = ShapeFactory.DRAW_WIDTH;
        canvas.height = ShapeFactory.DRAW_HEIGHT;

        const context = canvas.getContext("2d");
        if (!context) {
            return new Float32Array(particleCount * 3);
        }

        const image = new Image();
        image.crossOrigin = "anonymous";
        image.src = svgUrl;
        await image.decode();

        context.clearRect(0, 0, canvas.width, canvas.height);

        const scale = Math.min(
            canvas.width / image.width,
            canvas.height / image.height,
            1
        );

        const drawWidth = image.width * scale;
        const drawHeight = image.height * scale;
        const xOffset = (canvas.width - drawWidth) / 2;
        const yOffset = (canvas.height - drawHeight) / 2;

        context.drawImage(image, xOffset, yOffset, drawWidth, drawHeight);

        return ShapeFactory.createFormationFromCanvas(
            canvas,
            particleCount,
            worldWidth,
            worldHeight,
            {
                useOpaqueBounds: true,
                preserveAspect: true,
                ignoreDarkPixels: options.ignoreDarkPixels,
                ignoreLightPixels: options.ignoreLightPixels ?? /\.png(?:\?|$)/i.test(svgUrl)
            }
        );
    }

    public static createTextFormation(
        text: string,
        particleCount: number,
        worldWidth: number,
        worldHeight: number,
        options: {
            align?: "left" | "center";
            maxLines?: number;
            fixedFontSize?: number;
            maxScale?: number;
        } = {}
    ): Float32Array {
        const canvas = document.createElement("canvas");
        canvas.width = ShapeFactory.DRAW_WIDTH;
        canvas.height = ShapeFactory.DRAW_HEIGHT;

        const context = canvas.getContext("2d");
        if (!context) {
            return new Float32Array(particleCount * 3);
        }

        context.clearRect(0, 0, canvas.width, canvas.height);

        const isNarrowWorld = worldWidth / Math.max(1, worldHeight) < 0.82;
        const isDesktopQuote = !isNarrowWorld && /\nCEO,\s*Axatel$/i.test(text.trim());
        const { lines, fontSize } = ShapeFactory.layoutTextLines(
            context,
            text,
            canvas.width,
            canvas.height,
            isNarrowWorld
                ? { maxWidthRatio: 0.5, maxLines: options.maxLines ?? 18, maxHeightRatio: 0.98, lineHeightRatio: 0.94, fontWeight: 300, fixedFontSize: options.fixedFontSize }
                : isDesktopQuote
                    ? { maxWidthRatio: 0.98, maxLines: 8, maxHeightRatio: 0.98, lineHeightRatio: 0.92, fontWeight: 350 }
                    : { maxWidthRatio: 0.96, maxLines: options.maxLines, fixedFontSize: options.fixedFontSize }
        );

        const textAlign = options.align ?? "center";
        context.textAlign = textAlign;
        context.textBaseline = "top";
        context.fillStyle = "#fff";

        const lineHeight = fontSize * (isNarrowWorld ? 0.94 : isDesktopQuote ? 0.92 : 1.12);
        const blockHeight = lineHeight * lines.length;
        let y = (canvas.height - blockHeight) / 2;

        for (const line of lines) {
            const lineWeight = isNarrowWorld && /^CEO,\s*Axatel$/i.test(line.trim()) ? 350 : isNarrowWorld ? 300 : 350;
            context.font = `${lineWeight} ${fontSize}px ${ShapeFactory.FONT_FAMILY}`;
            context.fillText(line, textAlign === "left" ? canvas.width * 0.02 : canvas.width / 2, y);
            y += lineHeight;
        }

        return ShapeFactory.createFormationFromCanvas(
            canvas,
            particleCount,
            worldWidth,
            worldHeight,
            {
                useOpaqueBounds: true,
                preserveAspect: true,
                maxScale: options.maxScale
            }
        );
    }

    public static async createCompositeFormation(
        text: string,
        assetUrl: string,
        particleCount: number,
        worldWidth: number,
        worldHeight: number,
        pixelsPerWorldUnit = 0
    ): Promise<Float32Array> {
        const useMobileLayout = window.innerWidth <= 768 || worldWidth / Math.max(1, worldHeight) < 0.82;
        const pxPerUnit = pixelsPerWorldUnit > 0
            ? pixelsPerWorldUnit
            : window.innerHeight / Math.max(1, worldHeight);
        if (assetUrl === DEFAULT_WING_IMAGE) {
            return ShapeFactory.createDefaultWingTitleFormation(
                text, particleCount, worldWidth, worldHeight, pxPerUnit, useMobileLayout
            );
        }
        const assetParticleCount = Math.round(particleCount * (useMobileLayout ? 0.24 : 0.26));
        const textParticleCount = particleCount - assetParticleCount;
        const assetWidth = useMobileLayout
            ? worldWidth * 0.28
            : Math.min(worldWidth * 0.25, (ShapeFactory.DESKTOP_COMPOSITE_ASSET_PX * 1.7) / pxPerUnit);
        const assetHeight = useMobileLayout
            ? worldHeight * 0.72
            : Math.min(worldHeight * 0.96, ShapeFactory.DESKTOP_COMPOSITE_ASSET_PX / pxPerUnit);
        let assetFormation: Float32Array;
        try {
            assetFormation = await ShapeFactory.createSvgFormation(
                assetUrl,
                assetParticleCount,
                assetWidth,
                assetHeight
            );
        } catch (error) {
            if (assetUrl === DEFAULT_WING_IMAGE) {
                throw error;
            }
            console.warn(`[ShapeFactory] Could not load custom hero image "${assetUrl}"; using the default wing.`, error);
            return ShapeFactory.createDefaultWingTitleFormation(
                text, particleCount, worldWidth, worldHeight, pxPerUnit, useMobileLayout
            );
        }
        const textFormation = ShapeFactory.createTextFormation(
            text,
            textParticleCount,
            worldWidth * (useMobileLayout ? 0.6 : 0.46),
            worldHeight * (useMobileLayout ? 0.72 : 0.72),
            {
                align: "left",
                maxLines: useMobileLayout ? 8 : 5,
                fixedFontSize: useMobileLayout ? ShapeFactory.MOBILE_COMPOSITE_FONT_SIZE : ShapeFactory.DESKTOP_COMPOSITE_FONT_SIZE,
                maxScale: useMobileLayout
                    ? (ShapeFactory.MOBILE_COMPOSITE_TEXT_PX / ShapeFactory.MOBILE_COMPOSITE_FONT_SIZE) / pxPerUnit
                    : (ShapeFactory.DESKTOP_COMPOSITE_TEXT_PX / ShapeFactory.DESKTOP_COMPOSITE_FONT_SIZE) / pxPerUnit
            }
        );
        const result = new Float32Array(particleCount * 3);
        const assetOffsetY = 0;
        let assetMinRawX = Number.POSITIVE_INFINITY;
        let assetMaxRawX = Number.NEGATIVE_INFINITY;
        let textMinX = Number.POSITIVE_INFINITY;
        let textMaxX = Number.NEGATIVE_INFINITY;
        let textMaxY = Number.NEGATIVE_INFINITY;

        for (let index = 0; index < assetParticleCount; index++) {
            const assetX = assetFormation[index * 3]!;
            assetMinRawX = Math.min(assetMinRawX, assetX);
            assetMaxRawX = Math.max(assetMaxRawX, assetX);
        }

        for (let index = 0; index < textParticleCount; index++) {
            textMinX = Math.min(textMinX, textFormation[index * 3]!);
            textMaxX = Math.max(textMaxX, textFormation[index * 3]!);
            textMaxY = Math.max(textMaxY, textFormation[index * 3 + 1]!);
        }

        const safeAssetMinX = Number.isFinite(assetMinRawX) ? assetMinRawX : 0;
        const safeAssetMaxX = Number.isFinite(assetMaxRawX) ? assetMaxRawX : 0;
        const safeTextMinX = Number.isFinite(textMinX) ? textMinX : 0;
        const safeTextMaxX = Number.isFinite(textMaxX) ? textMaxX : 0;

        let assetOffsetX: number;
        let textOffsetX: number;
        let textOffsetY: number;

        if (useMobileLayout) {
            assetOffsetX = -worldWidth * 0.36;
            textOffsetX = safeAssetMaxX + assetOffsetX + worldWidth * 0.035 - safeTextMinX;
            textOffsetY = worldHeight * 0.43 - (Number.isFinite(textMaxY) ? textMaxY : 0);
        } else {
            const formationGap = ShapeFactory.DESKTOP_COMPOSITE_GAP_PX / pxPerUnit;
            const textSpan = safeTextMaxX - safeTextMinX;
            // Il testo resta centrato sull'asse: l'ala viene appoggiata alla sua sinistra.
            const textStartX = -textSpan / 2;
            textOffsetX = textStartX - safeTextMinX;
            assetOffsetX = textStartX - formationGap - safeAssetMaxX;
            textOffsetY = 0;
        }

        for (let index = 0; index < assetParticleCount; index++) {
            const source = index * 3;
            result[source] = assetFormation[source]! + assetOffsetX;
            result[source + 1] = assetFormation[source + 1]! + assetOffsetY;
        }

        for (let index = 0; index < textParticleCount; index++) {
            const source = index * 3;
            const target = (assetParticleCount + index) * 3;
            result[target] = textFormation[source]! + textOffsetX;
            result[target + 1] = textFormation[source + 1]! + textOffsetY;
        }

        return result;
    }

    private static async createDefaultWingTitleFormation(
        text: string,
        particleCount: number,
        worldWidth: number,
        worldHeight: number,
        pixelsPerWorldUnit: number,
        useMobileLayout: boolean
    ): Promise<Float32Array> {
        const wingParticleCount = Math.floor(particleCount * 0.15);
        const textParticleCount = particleCount - wingParticleCount * 2;
        const wingWidth = Math.min(worldWidth * 0.14, 92 / pixelsPerWorldUnit);
        const wingHeight = Math.min(worldHeight * 0.55, ShapeFactory.DEFAULT_WING_HEIGHT_PX / pixelsPerWorldUnit);
        const wing = await ShapeFactory.createSvgFormation(
            DEFAULT_WING_IMAGE, wingParticleCount, wingWidth, wingHeight,
            { ignoreLightPixels: false }
        );
        const title = ShapeFactory.createTextFormation(
            text, textParticleCount, worldWidth * 0.6, worldHeight * 0.72,
            {
                align: "center",
                maxLines: useMobileLayout ? 8 : 5,
                fixedFontSize: useMobileLayout ? ShapeFactory.MOBILE_COMPOSITE_FONT_SIZE : ShapeFactory.DESKTOP_COMPOSITE_FONT_SIZE,
                maxScale: useMobileLayout
                    ? (ShapeFactory.MOBILE_COMPOSITE_TEXT_PX / ShapeFactory.MOBILE_COMPOSITE_FONT_SIZE) / pixelsPerWorldUnit
                    : (ShapeFactory.DESKTOP_COMPOSITE_TEXT_PX / ShapeFactory.DESKTOP_COMPOSITE_FONT_SIZE) / pixelsPerWorldUnit
            }
        );
        let textMinX = Number.POSITIVE_INFINITY;
        let textMaxX = Number.NEGATIVE_INFINITY;
        let wingMinX = Number.POSITIVE_INFINITY;
        let wingMinY = Number.POSITIVE_INFINITY;
        let wingMaxY = Number.NEGATIVE_INFINITY;
        for (let index = 0; index < textParticleCount; index++) {
            textMinX = Math.min(textMinX, title[index * 3]!);
            textMaxX = Math.max(textMaxX, title[index * 3]!);
        }
        for (let index = 0; index < wingParticleCount; index++) {
            wingMinX = Math.min(wingMinX, wing[index * 3]!);
            wingMinY = Math.min(wingMinY, wing[index * 3 + 1]!);
            wingMaxY = Math.max(wingMaxY, wing[index * 3 + 1]!);
        }
        const textCenterX = (textMinX + textMaxX) / 2;
        const textHalfWidth = (textMaxX - textMinX) / 2;
        const gap = Math.min(worldWidth * 0.025, 16 / pixelsPerWorldUnit);
        const wingOffsetX = textHalfWidth + gap - wingMinX;
        const wingCenterY = (wingMinY + wingMaxY) / 2;
        const result = new Float32Array(particleCount * 3);
        for (let index = 0; index < wingParticleCount; index++) {
            const source = index * 3;
            const right = (wingParticleCount + index) * 3;
            const x = wing[source]! + wingOffsetX;
            const y = wing[source + 1]! - wingCenterY + ShapeFactory.DEFAULT_WING_OFFSET_PX / pixelsPerWorldUnit;
            result[source] = -x;
            result[source + 1] = y;
            result[right] = x;
            result[right + 1] = y;
        }
        for (let index = 0; index < textParticleCount; index++) {
            const source = index * 3;
            const target = (wingParticleCount * 2 + index) * 3;
            result[target] = title[source]! - textCenterX;
            result[target + 1] = title[source + 1]!;
        }
        return result;
    }

    public static getTextSuffixBounds(
        text: string,
        prefixWordCount: number,
        worldWidth: number,
        worldHeight: number
    ): { minX: number; maxX: number; minY: number; maxY: number } | null {
        const canvas = document.createElement("canvas");
        canvas.width = ShapeFactory.DRAW_WIDTH;
        canvas.height = ShapeFactory.DRAW_HEIGHT;

        const context = canvas.getContext("2d");
        if (!context) {
            return null;
        }

        const isNarrowWorld = worldWidth / Math.max(1, worldHeight) < 0.82;
        const { lines, fontSize } = ShapeFactory.layoutTextLines(
            context,
            text,
            canvas.width,
            canvas.height,
            isNarrowWorld
                ? { maxWidthRatio: 0.5, maxLines: 18, maxHeightRatio: 0.98, lineHeightRatio: 0.94, fontWeight: 300 }
                : { maxWidthRatio: 0.96 }
        );

        context.font = `${isNarrowWorld ? 300 : 350} ${fontSize}px ${ShapeFactory.FONT_FAMILY}`;
        const lineHeight = fontSize * (isNarrowWorld ? 0.94 : 1.12);
        const blockHeight = lineHeight * lines.length;
        let y = (canvas.height - blockHeight) / 2;
        let wordIndex = 0;
        let textMinX = Number.POSITIVE_INFINITY;
        let textMaxX = Number.NEGATIVE_INFINITY;
        let textMinY = Number.POSITIVE_INFINITY;
        let textMaxY = Number.NEGATIVE_INFINITY;
        let minX = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;

        for (const line of lines) {
            const words = line.trim().split(/\s+/).filter(Boolean);
            const lineWidth = context.measureText(line).width;
            let x = (canvas.width - lineWidth) / 2;

            if (lineWidth > 0) {
                textMinX = Math.min(textMinX, x);
                textMaxX = Math.max(textMaxX, x + lineWidth);
                textMinY = Math.min(textMinY, y);
                textMaxY = Math.max(textMaxY, y + fontSize);
            }

            for (const word of words) {
                const wordWidth = context.measureText(word).width;

                if (wordIndex >= prefixWordCount) {
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x + wordWidth);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y + fontSize);
                }

                x += wordWidth + context.measureText(" ").width;
                wordIndex += 1;
            }

            y += lineHeight;
        }

        if (!Number.isFinite(minX) || !Number.isFinite(maxX)) {
            return null;
        }

        if (!Number.isFinite(textMinX) || !Number.isFinite(textMaxX) || !Number.isFinite(textMinY) || !Number.isFinite(textMaxY)) {
            textMinX = 0;
            textMaxX = canvas.width;
            textMinY = 0;
            textMaxY = canvas.height;
        }

        const sourceWidth = Math.max(1, textMaxX - textMinX);
        const sourceHeight = Math.max(1, textMaxY - textMinY);
        const uniformScale = Math.min(worldWidth / sourceWidth, worldHeight / sourceHeight);
        const centerX = textMinX + sourceWidth / 2;
        const centerY = textMinY + sourceHeight / 2;

        return {
            minX: (minX - centerX) * uniformScale,
            maxX: (maxX - centerX) * uniformScale,
            minY: (centerY - maxY) * uniformScale,
            maxY: (centerY - minY) * uniformScale
        };
    }

    private static createFormationFromCanvas(
        canvas: HTMLCanvasElement,
        particleCount: number,
        worldWidth: number,
        worldHeight: number,
        options?: {
            useOpaqueBounds?: boolean;
            preserveAspect?: boolean;
            ignoreLightPixels?: boolean;
            ignoreDarkPixels?: boolean;
            maxScale?: number;
        }
    ): Float32Array {
        const context = canvas.getContext("2d");
        if (!context) {
            return new Float32Array(particleCount * 3);
        }

        const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        ).data;

        const points: number[] = [];
        const step = 3;
        const threshold = 10;

        for (let y = 0; y < canvas.height; y += step) {
            for (let x = 0; x < canvas.width; x += step) {
                const offset = (y * canvas.width + x) * 4;
                const alpha = imageData[offset + 3]!;
                const isLightPixel = options?.ignoreLightPixels === true &&
                    imageData[offset]! > 242 &&
                    imageData[offset + 1]! > 242 &&
                    imageData[offset + 2]! > 242;
                const isDarkPixel = options?.ignoreDarkPixels === true &&
                    imageData[offset]! < 16 &&
                    imageData[offset + 1]! < 16 &&
                    imageData[offset + 2]! < 16;
                if (alpha > threshold && !isLightPixel && !isDarkPixel) {
                    points.push(x, y);
                }
            }
        }

        if (points.length === 0) {
            return new Float32Array(particleCount * 3);
        }

        const result = new Float32Array(particleCount * 3);
        const useOpaqueBounds = options?.useOpaqueBounds === true;
        const preserveAspect = options?.preserveAspect === true;

        let minX = 0;
        let maxX = canvas.width;
        let minY = 0;
        let maxY = canvas.height;

        if (useOpaqueBounds) {
            minX = Number.POSITIVE_INFINITY;
            maxX = Number.NEGATIVE_INFINITY;
            minY = Number.POSITIVE_INFINITY;
            maxY = Number.NEGATIVE_INFINITY;

            for (let i = 0; i < points.length; i += 2) {
                const x = points[i]!;
                const y = points[i + 1]!;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }

            if (!Number.isFinite(minX) || !Number.isFinite(maxX) || !Number.isFinite(minY) || !Number.isFinite(maxY)) {
                minX = 0;
                maxX = canvas.width;
                minY = 0;
                maxY = canvas.height;
            }
        }

        const sourceWidth = Math.max(1, maxX - minX);
        const sourceHeight = Math.max(1, maxY - minY);
        const halfWidth = worldWidth / 2;
        const halfHeight = worldHeight / 2;
        const xScale = worldWidth / sourceWidth;
        const yScale = worldHeight / sourceHeight;
        const fitScale = Math.min(xScale, yScale);
        const uniformScale = options?.maxScale && options.maxScale > 0
            ? Math.min(fitScale, options.maxScale)
            : fitScale;
        const pointCount = points.length / 2;

        for (let i = 0; i < particleCount; i++) {
            const pointIndex = pointCount > particleCount
                ? Math.floor((i / particleCount) * pointCount)
                : i % pointCount;
            const sourceIndex = pointIndex * 2;
            const x = points[sourceIndex]!;
            const y = points[sourceIndex + 1]!;
            const centeredX = x - (minX + sourceWidth / 2);
            const centeredY = (minY + sourceHeight / 2) - y;

            if (preserveAspect) {
                result[i * 3] = centeredX * uniformScale + (Math.random() - 0.5) * uniformScale * 0.12;
                result[i * 3 + 1] = centeredY * uniformScale + (Math.random() - 0.5) * uniformScale * 0.12;
            } else {
                result[i * 3] = centeredX * xScale + (Math.random() - 0.5) * xScale * 0.12;
                result[i * 3 + 1] = centeredY * yScale + (Math.random() - 0.5) * yScale * 0.12;
            }

            result[i * 3] = Math.max(-halfWidth, Math.min(halfWidth, result[i * 3]!));
            result[i * 3 + 1] = Math.max(-halfHeight, Math.min(halfHeight, result[i * 3 + 1]!));
            result[i * 3 + 2] = 0;
        }

        return result;
    }

    private static layoutTextLines(
        context: CanvasRenderingContext2D,
        text: string,
        width: number,
        height: number,
        options: {
            maxWidthRatio?: number;
            maxLines?: number;
            maxHeightRatio?: number;
            lineHeightRatio?: number;
            fontWeight?: number;
            fixedFontSize?: number;
        } = {}
    ): { lines: string[]; fontSize: number } {
        const explicitLines = text.replace(/\r\n?/g, "\n").split("\n");
        if (explicitLines.every((line) => line.trim().length === 0)) {
            return { lines: [""], fontSize: Math.floor(height * 0.5) };
        }

        const maxWidth = width * (options.maxWidthRatio ?? 0.96);
        const maxHeight = height * (options.maxHeightRatio ?? 0.96);
        const maxLines = options.maxLines ?? 4;
        const lineHeightRatio = options.lineHeightRatio ?? 1.12;
        const fontWeight = options.fontWeight ?? 350;
        let fontSize = options.fixedFontSize ?? Math.floor(height * 0.62);

        const buildLines = (size: number): string[] => {
            context.font = `${fontWeight} ${size}px ${ShapeFactory.FONT_FAMILY}`;
            const lines: string[] = [];

            const splitLongWord = (word: string): string[] => {
                if (context.measureText(word).width <= maxWidth) {
                    return [word];
                }

                const chunks: string[] = [];
                let chunk = "";

                for (const char of word) {
                    const candidate = chunk + char;
                    if (chunk.length > 0 && context.measureText(candidate).width > maxWidth) {
                        chunks.push(chunk);
                        chunk = char;
                    } else {
                        chunk = candidate;
                    }
                }

                if (chunk.length > 0) {
                    chunks.push(chunk);
                }

                return chunks;
            };

            for (const explicitLine of explicitLines) {
                const trimmed = explicitLine.trim();

                if (trimmed.length === 0) {
                    lines.push("");
                    continue;
                }

                const words = trimmed.split(/\s+/).filter(Boolean);
                const expandedWords = words.flatMap(splitLongWord);
                let current = "";

                for (const word of expandedWords) {
                    const candidate = current.length > 0
                        ? `${current} ${word}`
                        : word;

                    if (context.measureText(candidate).width <= maxWidth) {
                        current = candidate;
                    } else {
                        if (current.length > 0) {
                            lines.push(current);
                        }
                        current = word;
                    }
                }

                if (current.length > 0) {
                    lines.push(current);
                }
            }

            return lines;
        };

        const getBlockHeight = (size: number, lineCount: number): number => {
            return lineCount * size * lineHeightRatio;
        };

        let lines = buildLines(fontSize);
        while (
            options.fixedFontSize === undefined &&
            (
                lines.length > maxLines ||
                lines.some((line) => context.measureText(line).width > maxWidth) ||
                getBlockHeight(fontSize, lines.length) > maxHeight
            ) &&
            fontSize > 22
        ) {
            fontSize -= 2;
            lines = buildLines(fontSize);
        }

        return { lines, fontSize };
    }
}
