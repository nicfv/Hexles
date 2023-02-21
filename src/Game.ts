import { Color } from "./Color";
import { Drawable } from "./Engine";
import { Hexagon, Vec2 } from "./Geometry";

type Direction = 'North' | 'NorthWest' | 'SouthWest' | 'South' | 'SouthEast' | 'NorthEast';

abstract class Player {
    private static id_count: number = 0;
    private readonly id: number;
    constructor(public readonly color: Color) {
        this.id = Player.id_count++;
    }
    public equals(other: Player): boolean {
        return this.id === other.id;
    }
}

export class Human extends Player {
    constructor(color: Color) {
        super(color);
    }
}

/**
 * Represents a single tile in the game board.
 */
export class Tile extends Hexagon implements Drawable {
    private static readonly size: number = 10;
    private static readonly DirectionMap: { [K in Direction]: Vec2 } = {
        'North': new Vec2(0, -1),
        'NorthEast': new Vec2(1, -1),
        'NorthWest': new Vec2(-1, 0),
        'South': new Vec2(0, 1),
        'SouthEast': new Vec2(1, 0),
        'SouthWest': new Vec2(-1, 1),
    };
    private readonly center: Vec2;
    private owner: Player | undefined;
    /**
     * Create a new tile centered at `center` (measured in tiles)
     */
    constructor(center: Vec2) {
        super(new Vec2(center.x * 3 / 2 * Tile.size, (center.x + 2 * center.y) * Math.sqrt(3) / 2 * Tile.size), Tile.size);
        this.center = center;
    }
    /**
     * Determine if tis tile has yet to be captured.
     */
    public isNeutral(): boolean {
        return this.owner === undefined;
    }
    /**
     * Make an attempt to capture this tile.
     */
    public capture(player: Player): void {
        if (this.isNeutral()) {
            this.owner = player;
        }
    }
    /**
     * Return `true` if `player` is the owner of this tile.
     */
    public isOwnedBy(player: Player): boolean {
        return this.owner?.equals(player) ?? false;
    }
    /**
     * Return the center of the bordering tile in the specified direction.
     */
    public getBorderingTileCenter(direction: Direction): Vec2 {
        return Vec2.add(this.center, Tile.DirectionMap[direction]);
    }
    draw(ctx: CanvasRenderingContext2D): void {
        if (this.owner instanceof Player) {
            ctx.fillStyle = this.owner.color.toString();
        } else {
            ctx.fillStyle = 'lightgray';
        }
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.beginPath();
        this.points.forEach(v => ctx.lineTo(v.x, v.y));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
}

/**
 * Represents the game board.
 */
export class Board implements Drawable {
    private readonly tiles: { [i: string]: Tile } = {};
    /**
     * Construct a new game board with a specified size.
     */
    constructor(radius: number) {
        for (let x = -radius; x <= radius; x++) {
            for (let y = -radius; y <= radius; y++) {
                if (Math.abs(x + y) <= radius) {
                    this.tiles[x + ',' + y] = new Tile(new Vec2(x, y));
                }
            }
        }
    }
    public SET_PLAYER_IN_CENTER_THIS_IS_A_TESTING_FUNCTION(player: Player): void {
        this.tiles['0,0'].capture(player);
    }
    private getNeutralBorderingTiles(player: Player, direction: Direction): Tile[] {
        return Object.values(this.tiles) // Return array of tiles
            .filter(tile => tile.isOwnedBy(player)) // Filter only tiles that player owns
            .map(tile => tile.getBorderingTileCenter(direction)) // Get each bordering tile in that specified direction
            .map(center => this.tiles[center.x + ',' + center.y]) // Map (x,y) keys back to their corresponding tiles
            .filter(tile => tile?.isNeutral()); // Filter only to the neutral tiles
    }
    /**
     * Returns the number of tiles a player can capture in any specified direction.
     * For AI players, this number is the weight/likelihood of capturing in that specific direction.
     */
    public captureWeight(player: Player, direction: Direction): number {
        return this.getNeutralBorderingTiles(player, direction).length;
    }
    /**
     * Cause `player` to capture tiles in direction `direction`.
     */
    public captureTiles(player: Player, direction: Direction): void {
        this.getNeutralBorderingTiles(player, direction)
            .forEach(tile => tile.capture(player));
    }
    /**
     * Determine if `player` has any legal moves left on this board.
     */
    public hasLegalMoves(player: Player): boolean {
        return this.captureWeight(player, 'North') === 0 &&
            this.captureWeight(player, 'NorthEast') === 0 &&
            this.captureWeight(player, 'NorthWest') === 0 &&
            this.captureWeight(player, 'SouthEast') === 0 &&
            this.captureWeight(player, 'SouthWest') === 0 &&
            this.captureWeight(player, 'South') === 0;
    }
    draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(150, 100);
        Object.values(this.tiles).forEach(tile => tile.draw(ctx));
        ctx.restore();
    }
}