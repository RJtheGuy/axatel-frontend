export type SequenceStageType = "flow" | "text" | "logo" | "scatter";

export interface SequenceStage {
    id: string;
    type: SequenceStageType;
    duration: number;
    text?: string;
}

export class SequenceManager {
    private readonly MIN_SHARED_PREFIX_WORDS = 5;
    private phrases: string[];
    private steps: SequenceStage[];
    private currentIndex = 0;
    private elapsed = 0;

    constructor(phrases: string[] = [
        "Ogni sensore comunica",
        "Ogni dato conta",
        "Ogni evento viene monitorato",
        "Ogni decisione ha valore"
    ]) {
        this.phrases = [...phrases];
        this.steps = this.buildSteps();
    }

    private arePhrasesEqual(next: string[]): boolean {
        if (next.length !== this.phrases.length) {
            return false;
        }

        for (let i = 0; i < next.length; i++) {
            if (next[i] !== this.phrases[i]) {
                return false;
            }
        }

        return true;
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

    private shouldUseDirectTextTransition(current: string, next: string): boolean {
        return this.countSharedPrefixWords(current, next) >= this.MIN_SHARED_PREFIX_WORDS;
    }

    private buildSteps(): SequenceStage[] {
        const steps: SequenceStage[] = [];

        this.phrases.forEach((text, index) => {
            steps.push({
                id: `phrase-${index + 1}`,
                type: "text",
                text,
                duration: 4.5
            });

            const isLastPhrase = index === this.phrases.length - 1;
            if (isLastPhrase) {
                return;
            }

            const nextText = this.phrases[index + 1] || "";
            if (this.shouldUseDirectTextTransition(text, nextText)) {
                return;
            }

            steps.push({
                id: `flow-${index + 2}`,
                type: "flow",
                duration: 1.1
            });
        });

        steps.push({ id: "logo", type: "logo", text: "AXATEL", duration: 9 });
        steps.push({ id: "flow-loop", type: "flow", duration: 2.8 });

        return steps;
    }

    public setPhrases(phrases: string[]): void {
        const normalized = [...phrases];
        if (this.arePhrasesEqual(normalized)) {
            return;
        }

        this.phrases = normalized;
        this.steps = this.buildSteps();
        this.currentIndex = 0;
        this.elapsed = 0;
    }

    public update(delta: number): boolean {
        let changed = false;
        this.elapsed += delta;

        while (this.elapsed >= this.steps[this.currentIndex].duration) {
            this.elapsed -= this.steps[this.currentIndex].duration;
            this.currentIndex =
                (this.currentIndex + 1) % this.steps.length;
            changed = true;
        }

        return changed;
    }

    public getCurrentStage(): SequenceStage {
        return this.steps[this.currentIndex];
    }

    public getProgress(): number {
        return Math.min(
            1,
            this.elapsed / this.steps[this.currentIndex].duration
        );
    }
}
