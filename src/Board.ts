import { Drawable } from "./Engine";
import { Hexagon, Vec2 } from "./Geometry";

/**
 * Represents a single tile in the game board.
 */
export class Tile extends Hexagon implements Drawable {
    private static readonly SIZE: number = 10;
    private green: number = 0;
    /**
     * Create a new tile centered at `center` (measured in tiles)
     */
    constructor(center: Vec2) {
        super(new Vec2(center.x * 3 / 2 * Tile.SIZE, (center.x + 2 * center.y) * Math.sqrt(3) / 2 * Tile.SIZE), Tile.SIZE);
    }
    draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = 'hsl(' + (this.green++) + ',100%,50%)'; // TODO
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.beginPath();
        this.points.forEach(v => ctx.lineTo(v.x, v.y));
        ctx.fill();
        ctx.stroke();
    }
}

/**
 * Represents the game board.
 */
export class Board implements Drawable {
    private readonly tiles: Tile[];
    /**
     * Construct a new game board with a specified size.
     */
    constructor(radius: number) {
        this.tiles = [];
        for (let x = -radius; x <= radius; x++) {
            for (let y = -radius; y <= radius; y++) {
                if (Math.abs(x + y) <= radius) {
                    this.tiles.push(new Tile(new Vec2(x, y)));
                }
            }
        }
    }
    draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(150, 100);
        this.tiles.forEach(tile => tile.draw(ctx));
        ctx.restore();
    }
}