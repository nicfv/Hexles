import { Drawable } from "./Engine";
import { Hexagon, Math2, Vec2 } from "./Geometry";

type Direction = 'North' | 'NorthWest' | 'SouthWest' | 'South' | 'SouthEast' | 'NorthEast';
type Color = 'Red' | 'Orange' | 'Yellow' | 'Green' | 'Cyan' | 'Blue' | 'Violet';
type SpawnMode = 'fair' | 'random';
type Rotation = 'CW' | 'CCW';

/**
 * Represents any player in the game.
 */
abstract class Player {
    private static readonly ColorMap: { [K in Color]: { readonly value: string, inUse: boolean } } = {
        'Red': { value: '#F00', inUse: false },
        'Orange': { value: '#F80', inUse: false },
        'Yellow': { value: '#CD1', inUse: false },
        'Green': { value: '#080', inUse: false },
        'Cyan': { value: '#0CF', inUse: false },
        'Blue': { value: '#00F', inUse: false },
        'Violet': { value: '#C0F', inUse: false },
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
    private owner: Player | undefined;
    private isWall: boolean = false;
    /**
     * Create a new tile centered at `center` (measured in tiles)
     */
    constructor(private readonly center: Vec2) {
        super(new Vec2(center.x * 3 / 2 * Tile.size, (center.x + 2 * center.y) * Math.sqrt(3) / 2 * Tile.size), Tile.size);
    }
    /**
     * Determine if tis tile has yet to be captured.
     */
    public isNeutral(): boolean {
        return this.owner === undefined && !this.isWall;
    }
    /**
     * Build a wall on this tile.
     */
    public buildWall(): void {
        if (this.isNeutral()) {
            this.isWall = true;
        }
    }
    /**
     * Make an attempt to capture this tile, return `true` if the tile was captured.
     */
    public capture(player: Player): boolean {
        if (this.isNeutral()) {
            this.owner = player;
            return true;
        }
        return false;
    }
    /**
     * Uncapture this tile.
     */
    public clear(): void {
        this.owner = undefined;
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
        ctx.fillStyle = this.owner?.getColor() ?? (this.isWall ? 'dimgray' : 'lightgray');
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
    constructor(public readonly radius: number, wallDensity: number = 0, private readonly normalizedCenter: Vec2 = new Vec2(0.5, 0.5)) {
        for (let x = -radius; x <= radius; x++) {
            for (let y = -radius; y <= radius; y++) {
                if (Math.abs(x + y) <= radius) {
                    this.tiles[x + ',' + y] = new Tile(new Vec2(x, y));
                    if (Math.random() < wallDensity) {
                        this.tiles[x + ',' + y].buildWall();
                    }
                }
            }
        }
    }
    private getNeutralBorderingTiles(player: Player, direction: Direction): Tile[] {
        return Object.values(this.tiles) // Return array of tiles
            .filter(tile => tile.isOwnedBy(player)) // Filter only tiles that player owns
            .map(tile => tile.getBorderingTileCenter(direction)) // Get each bordering tile in that specified direction
            .map(center => this.tiles[center.x + ',' + center.y]) // Map (x,y) keys back to their corresponding tiles
            .filter(tile => tile?.isNeutral()); // Filter only to the neutral tiles
    }
    /**
     * Try to spawn `player` at `location` on the board.
     */
    public spawn(player: Player, location: Vec2): boolean {
        const tile: Tile | undefined = this.tiles[location.x + ',' + location.y];
        if (!tile?.isNeutral()) {
            return false;
        }
        tile.capture(player);
        return true;
    }
    /**
     * Spawn `player` at a random location on the board.
     */
    public spawnRandom(player: Player): void {
        const neutralTiles: Tile[] = Object.values(this.tiles).filter(tile => tile.isNeutral());
        if (neutralTiles.length === 0) {
            throw new Error('No neutral tiles left.');
        }
        const tile = neutralTiles[Math2.randomInt(0, neutralTiles.length)];
        tile.capture(player);
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
        return this.captureWeight(player, 'North') > 0 ||
            this.captureWeight(player, 'NorthEast') > 0 ||
            this.captureWeight(player, 'NorthWest') > 0 ||
            this.captureWeight(player, 'SouthEast') > 0 ||
            this.captureWeight(player, 'SouthWest') > 0 ||
            this.captureWeight(player, 'South') > 0;
    }
    /**
     * Clear all tiles on the board.
     */
    public clear(): void {
        Object.values(this.tiles).forEach(tile => tile.clear());
    }
    draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(ctx.canvas.width * this.normalizedCenter.x, ctx.canvas.height * this.normalizedCenter.y);
        Object.values(this.tiles).forEach(tile => tile.draw(ctx));
        ctx.restore();
    }
}

/**
 * Represents a game pad for directional input.
 */
class DPad extends Board {
    private static readonly DirectionOrderCW: Direction[] =
        ['North', 'NorthEast', 'SouthEast', 'South', 'SouthWest', 'NorthWest'];
    private direction: Direction;
    /**
     * Create a new instance of `DPad`
     */
    constructor(private readonly player: Player) {
        super(1, 0, new Vec2(0.875, 0.875));
        this.direction = 'North';
        this.refresh();
    }
    /**
     * Rotate the directional pad left (CCW) or right (CW).
     */
    public rotate(way: Rotation): void {
        const dx: number = (way === 'CW' ? 1 : -1),
            numDirections: number = DPad.DirectionOrderCW.length,
            directionIdx: number = DPad.DirectionOrderCW.indexOf(this.direction) ?? 0,
            nextIdx = (directionIdx + numDirections + dx) % numDirections;
        this.direction = DPad.DirectionOrderCW[nextIdx];
        this.refresh();
    }
    /**
     * Return the direction currently selected by this `DPad`
     */
    public getDirection(): Direction {
        return this.direction;
    }
    private refresh(): void {
        this.clear();
        this.spawn(this.player, new Vec2(0, 0));
        this.captureTiles(this.player, this.direction);
    }
}

/**
 * Stores all the game's core logic.
 */
export class Game implements Drawable {
    private static readonly MIN_PLAYERS: number = 1;
    private static readonly MAX_PLAYERS: number = 6;
    private readonly board: Board;
    private readonly players: Player[];
    private readonly dPads: DPad[];
    private currentPlayer: number;
    /**
     * Start a new game with specified parameters.
     */
    constructor(numHumans: number, numAI: number, boardSize: number, favoriteColor: Color, spawnMode: SpawnMode, wallDensity: number) {
        Player.reset();
        this.players = [];
        this.dPads = [];
        this.currentPlayer = 0;
        numHumans = Math2.clamp(numHumans, 0, Game.MAX_PLAYERS);
        numAI = Math2.clamp(numAI, 0, Game.MAX_PLAYERS);
        numAI = Math2.clamp(numAI, Game.MIN_PLAYERS - numHumans, Game.MAX_PLAYERS - numHumans);
        for (let i = 0; i < numHumans; i++) {
            this.players.push(new Human(favoriteColor));
        }
        for (let i = 0; i < numAI; i++) {
            this.players.push(new AI());
        }
        this.players.forEach(player => this.dPads.push(new DPad(player)));
        this.board = new Board(boardSize, wallDensity);
        this.spawn(spawnMode);
        if (numHumans === 0) {
            this.aiInput();
        }
    }
    private spawn(mode: SpawnMode): void {
        switch (mode) {
            case ('fair'): {
                const spawnPoints: Vec2[] = [
                    // [0] North
                    new Vec2(0, -this.board.radius),
                    // [1] NorthEast
                    new Vec2(this.board.radius, -this.board.radius),
                    // [2] SouthEast
                    new Vec2(this.board.radius, 0),
                    // [3] South
                    new Vec2(0, this.board.radius),
                    // [4] SouthWest
                    new Vec2(-this.board.radius, this.board.radius),
                    // [5] NorthWest
                    new Vec2(-this.board.radius, 0),
                ], spawnLocations: number[][] = [
                    [0],
                    [0, 3],
                    [0, 2, 4],
                    [1, 2, 4, 5],
                    [0, 1, 2, 4, 5],
                    [0, 1, 2, 3, 4, 5],
                ];
                this.players.forEach((player, i) => this.board.spawn(player, spawnPoints[spawnLocations[this.players.length - 1][i]]));
                break;
            }
            case ('random'): {
                this.players.forEach(player => this.board.spawnRandom(player));
                break;
            }
            default: {
                throw new Error('Invalid spawn mode: "' + mode + '"');
            }
        }
    }
    public humanInput(rotation: Rotation): void {
        if (this.players[this.currentPlayer] instanceof Human) {
            this.dPads[this.currentPlayer].rotate(rotation);
        }
    }
    public humanSelect(): void {
        if (this.players[this.currentPlayer] instanceof Human) {
            this.takeTurn();
        }
    }
    private aiInput(): void {
        if (this.players[this.currentPlayer] instanceof AI) {
            const bucketNames: Direction[] = ['North', 'NorthEast', 'NorthWest', 'South', 'SouthEast', 'SouthWest'],
                buckets: number[] = bucketNames.map(name => this.board.captureWeight(this.players[this.currentPlayer], name)),
                selectedDirection = bucketNames[Math2.selectRandomBucket(buckets)]; // Note: is `undefined` when there are no legal moves
            let thinkTicks = 5, selectTicks = 5;
            const aiTick = setInterval(() => {
                if (thinkTicks > 0) {
                    thinkTicks--;
                } else if (this.dPads[this.currentPlayer].getDirection() !== selectedDirection) {
                    this.dPads[this.currentPlayer].rotate('CW');
                } else if (selectTicks > 0) {
                    selectTicks--;
                } else {
                    this.takeTurn();
                    clearInterval(aiTick);
                }
            }, 100);
        }
    }
    private takeTurn(): void {
        const currPlayer = this.players[this.currentPlayer],
            currDir = this.dPads[this.currentPlayer].getDirection();
        if (this.board.captureWeight(currPlayer, currDir) > 0) {
            this.board.captureTiles(currPlayer, currDir);
            let counter = 0;
            do {
                counter++;
                this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
            } while (!this.board.hasLegalMoves(this.players[this.currentPlayer]) && counter < this.players.length);
            if (counter < this.players.length) {
                this.aiInput();
            }
        }
    }
    draw(ctx: CanvasRenderingContext2D): void {
        this.board.draw(ctx);
        this.dPads[this.currentPlayer].draw(ctx);
    }
}