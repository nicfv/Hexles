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
    /**
     * Return all bordering tile centers for this tile.
     */
    public getAllBorderingTileCenters(): Vec2[] {
        return [
            Vec2.add(this.center, Tile.DirectionMap.North),
            Vec2.add(this.center, Tile.DirectionMap.NorthEast),
            Vec2.add(this.center, Tile.DirectionMap.NorthWest),
            Vec2.add(this.center, Tile.DirectionMap.South),
            Vec2.add(this.center, Tile.DirectionMap.SouthEast),
            Vec2.add(this.center, Tile.DirectionMap.SouthWest),
        ];
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
        const P = new Human(new Color(255, 0, 0));
        this.tiles[radius + ',-' + radius].capture(P);
        let start = Date.now();
        for (let i = 0; i < 1e4; i++) {
            this.captureTiles(P, 'SouthWest');
            this.captureTiles(P, 'North');
            this.captureTiles(P, 'SouthEast');
        }
        console.log(Date.now() - start, 'capture tiles');
        start = Date.now();
        for (let i = 0; i < 1e4; i++) {
            this.hasLegalMoves(P);
        }
        console.log(Date.now() - start, 'has legal moves 1');
        start = Date.now();
        for (let i = 0; i < 1e4; i++) {
            this.hasLegalMoves2(P);
        }
        console.log(Date.now() - start, 'has legal moves 2');
        start = Date.now();
        for (let i = 0; i < 1e4; i++) {
            this.hasLegalMoves3(P);
        }
        console.log(Date.now() - start, 'has legal moves 3');
    }
    getAllNeutralBorderingTiles(player: Player): Tile[] {
        return Object.values(this.tiles) // Return array of tiles
            .filter(tile => tile.isOwnedBy(player)) // Filter only tiles that player owns
            .map(tile => tile.getAllBorderingTileCenters()) // Get all bordering tiles
            .flat() // Flatten the array
            .map(center => center.x + ',' + center.y) // Translate the `Vec2` into the (x,y) key
            .filter((key, i, arr) => arr.indexOf(key) === i) // Remove duplicate keys
            .map(key => this.tiles[key]) // Map keys back to their corresponding tiles
            .filter(tile => tile?.isNeutral()); // Filter only to the neutral tiles
    }
    getAllNeutralBorderingTiles2(player: Player): Tile[] {
        return [...new Set(Object.values(this.tiles) // Return array of tiles
            .filter(tile => tile.isOwnedBy(player)) // Filter only tiles that player owns
            .map(tile => tile.getAllBorderingTileCenters()) // Get all bordering tiles
            .flat() // Flatten the array
            .map(center => center.x + ',' + center.y))] // Translate the `Vec2` into the (x,y) key
            // Remove duplicate keys
            .map(key => this.tiles[key]) // Map keys back to their corresponding tiles
            .filter(tile => tile?.isNeutral()); // Filter only to the neutral tiles
    }
    private getNeutralBorderingTiles(player: Player, direction: Direction): Tile[] {
        return Object.values(this.tiles) // Return array of tiles
            .filter(tile => tile.isOwnedBy(player)) // Filter only tiles that player owns
            .map(tile => tile.getBorderingTileCenter(direction)) // Get each bordering tile in that specified direction
            .map(center => this.tiles[center.x + ',' + center.y]) // Map (x,y) keys back to their corresponding tiles
            .filter(tile => tile?.isNeutral()); // Filter only to the neutral tiles
    }
    captureTiles(player: Player, direction: Direction): void {
        this.getNeutralBorderingTiles(player, direction)
            .forEach(tile => tile.capture(player));
    }
    hasLegalMoves(player: Player): boolean {
        return this.getAllNeutralBorderingTiles(player).length === 0;
    }
    hasLegalMoves2(player: Player): boolean {
        return this.getAllNeutralBorderingTiles2(player).length === 0;
    }
    hasLegalMoves3(player: Player): boolean {
        return this.getNeutralBorderingTiles(player, 'North').length === 0 &&
            this.getNeutralBorderingTiles(player, 'NorthEast').length === 0 &&
            this.getNeutralBorderingTiles(player, 'NorthWest').length === 0 &&
            this.getNeutralBorderingTiles(player, 'South').length === 0 &&
            this.getNeutralBorderingTiles(player, 'SouthEast').length === 0 &&
            this.getNeutralBorderingTiles(player, 'SouthWest').length === 0;
    }
    draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(150, 100);
        Object.values(this.tiles).forEach(tile => tile.draw(ctx));
        ctx.restore();
    }
}