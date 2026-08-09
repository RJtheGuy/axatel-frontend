export interface ForceVector {
    x: number;
    y: number;
}

export class FlowField {
    private scale = 0.035;
    private strength = 0.017;
    private time = 0;

    public update(delta: number): void {
        this.time += delta * 0.12;
    }

    public getForce(
        x: number,
        y: number,
        out: ForceVector
    ): void {
        const nx = x * this.scale;
        const ny = y * this.scale;

        const angle =
            Math.sin(nx + this.time) * 1.8 +
            Math.cos(ny * 1.35 - this.time * 0.8) * 1.35 +
            Math.sin((nx + ny) * 0.72 + this.time * 0.45) * 0.75;

        out.x = Math.cos(angle) * this.strength;
        out.y = Math.sin(angle) * this.strength;
    }
}
