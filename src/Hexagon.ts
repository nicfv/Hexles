import { Drawable } from "./Engine";

export class Hexagon implements Drawable {
    private x: number;
    private y: number;
    constructor() {
        this.x = 0;
        this.y = 0;
    }
    move(dx: number, dy: number) {
        this.x += dx;
        this.y += dy;
    }
    draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 10, 0, 6.28);
        ctx.fill();
    }
}