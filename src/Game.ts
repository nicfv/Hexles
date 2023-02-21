import { Drawable } from "./Engine";
import { Hexagon, Math2, Vec2 } from "./Geometry";

type Direction = 'North' | 'NorthWest' | 'SouthWest' | 'South' | 'SouthEast' | 'NorthEast';
type Color = 'Red' | 'Orange' | 'Yellow' | 'Green' | 'Blue' | 'Violet';

/**
 * Represents any player in the game.
 */
abstract class Player {
    private static readonly ColorMap: { [K in Color]: { readonly value: string, inUse: boolean } } = {
        'Red': { value: '#F00', inUse: false },
        'Orange': { value: '#F90', inUse: false },
        'Yellow': { value: '#CC0', inUse: false },
        'Green': { value: '#090', inUse: false },
        'Blue': { value: '#00F', inUse: false },
        'Violet': { value: '#0CF', inUse: false },
    };
    private static id_count: number = 0;
    private readonly id: number;
    /**
     * Create a new player.
     */
    constructor(private readonly color: Color) {
        this.id = Player.id_count++;
        if (Player.ColorMap[color].inUse) {
            // Return the first unused color.
            this.color = <Color>Object.entries(Player.ColorMap).find(([, val]) => !val.inUse)?.[0];
            if (!this.color) {
                throw new Error('All colors are in use.');
            }
        }
        Player.ColorMap[this.color].inUse = true;
    }
    /**
     * Reset the static class values.
     */
    public static reset(): void {
        Player.id_count = 0;
        Object.values(Player.ColorMap).forEach(val => val.inUse = false);
    }
    /**
     * Determine if this player is the object represented by `other`.
     */
    public is(other: Player): boolean {
        return this.id === other.id;
    }
    /**
     * Return the uniqe color of this player.
     */
    public getColor(): string {
        return Player.ColorMap[this.color].value;
    }
}

class Human extends Player {
    constructor(color: Color) {
        super(color);
    }
}

class AI extends Player {
    constructor() {
        super('Red');
    }
}

/**
 * Represents a single tile in the game board.
 */
class Tile extends Hexagon implements Drawable {
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
        return this.owner?.is(player) ?? false;
    }
    /**
     * Return the center of the bordering tile in the specified direction.
     */
    public getBorderingTileCenter(direction: Direction): Vec2 {
        return Vec2.add(this.center, Tile.DirectionMap[direction]);
    }
    draw(ctx: CanvasRenderingContext2D): void {
        if (this.owner instanceof Player) {
            ctx.fillStyle = this.owner.getColor();
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
class Board implements Drawable {
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
    public SET_PLAYER_IN_CENTER_THIS_IS_A_TESTING_FUNCTION(player: Player, center: string = '0,0'): void {
        this.tiles[center].capture(player);
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

/**
 * Stores all the game's core logic.
 */
export class Game implements Drawable {
    private static readonly MAX_PLAYERS: number = 6;
    private static readonly MIN_PLAYERS: number = 1;
    private readonly board: Board;
    private readonly players: Player[];
    constructor(numHumans: number, numAI: number, boardSize: number, favoriteColor: Color) {
        Player.reset();
        this.players = [];
        numHumans = Math2.clamp(numHumans, 0, Game.MAX_PLAYERS);
        numAI = Math2.clamp(numAI, 0, Game.MAX_PLAYERS);
        numAI = Math2.clamp(numAI, Game.MIN_PLAYERS - numHumans, Game.MAX_PLAYERS - numHumans);
        console.log(numHumans, numAI); // TODO
        for (let i = 0; i < numHumans; i++) {
            this.players.push(new Human(favoriteColor));
        }
        for (let i = 0; i < numAI; i++) {
            this.players.push(new AI());
        }
        this.board = new Board(boardSize);
        this.players.forEach((player, i) => this.board.SET_PLAYER_IN_CENTER_THIS_IS_A_TESTING_FUNCTION(player, '0,' + i)); // TODO
    }
    public CAPTURE_TILES_THIS_IS_A_TESTING_FUNCTION(direction: Direction): void {
        this.board.captureTiles(this.players[0], direction);
    }
    draw(ctx: CanvasRenderingContext2D): void {
        this.board.draw(ctx);
    }
}