import { Drawable } from "./Engine";
import { Hexagon, Math2, Vec2 } from "./Geometry";

type Direction = 'North' | 'NorthWest' | 'SouthWest' | 'South' | 'SouthEast' | 'NorthEast';
type Color = 'Red' | 'Orange' | 'Yellow' | 'Green' | 'Cyan' | 'Blue' | 'Violet';
type SpawnMode = 'fair' | 'random';
type Rotation = 'CW' | 'CCW';
type MenuMove = 'up' | 'down';
type GameState = 'MainMenu' | 'Settings' | 'Game' | 'Paused' | 'Help';
type Input = MenuMove | Rotation | 'select' | 'back';

/**
 * Represents any player in the game.
 */
class Player implements Drawable {
    private static readonly ColorMap: { [K in Color]: { readonly code: string, inUse: boolean } } = {
        'Red': { code: '#F00', inUse: false },
        'Orange': { code: '#F80', inUse: false },
        'Yellow': { code: '#CD1', inUse: false },
        'Green': { code: '#080', inUse: false },
        'Cyan': { code: '#0CF', inUse: false },
        'Blue': { code: '#00F', inUse: false },
        'Violet': { code: '#C0F', inUse: false },
    };
    private readonly dPad: DPad;
    /**
     * Create a new player.
     */
    constructor(private readonly color: Color, public readonly isAI: boolean) {
        if (Player.ColorMap[color].inUse) {
            const unusedColors = Object.entries(Player.ColorMap).filter(([, val]) => !val.inUse).map(([key,]) => <Color>key);
            if (unusedColors.length === 0) {
                throw new Error('All colors are in use.');
            }
            this.color = Math2.selectRandom(unusedColors);
        }
        Player.ColorMap[this.color].inUse = true;
        this.dPad = new DPad(this);
    }
    /**
     * Reset the static class values.
     */
    public static reset(): void {
        Object.values(Player.ColorMap).forEach(val => val.inUse = false);
    }
    /**
     * Determine if this player is the object represented by `other`.
     */
    public is(other: Player): boolean {
        return this.color === other.color;
    }
    /**
     * Return the uniqe color code of this player.
     */
    public getColor(): string {
        return Player.ColorMap[this.color].code;
    }
    /**
     * Return the name of this player.
     */
    public getName(): string {
        return (this.isAI ? '[AI] ' : '') + this.color;
    }
    /**
     * Rotate this player's `DPad` left (CW) or right (CCW)
     */
    public rotate(way: Rotation): void {
        this.dPad.rotate(way);
    }
    /**
     * Return the direction currently selected by this player's `DPad`
     */
    public getDirection(): Direction {
        return this.dPad.getDirection();
    }
    draw(ctx: CanvasRenderingContext2D): void {
        this.dPad.draw(ctx);
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
     * Determine if this tile has yet to be captured.
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
     * Force a capture. Clears other players and walls.
     */
    public forceCapture(player: Player): void {
        this.owner = player;
        this.isWall = false;
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
     * Build a wall at `location`. Should only ever be used in the tutorial.
     */
    public tutorialWall(location: Vec2): void {
        this.tiles[location.x + ',' + location.y].buildWall();
    }
    /**
     * Force `player` to spawn at `location` on the board.
     */
    public spawn(player: Player, location: Vec2): void {
        this.tiles[location.x + ',' + location.y]?.forceCapture(player);
    }
    /**
     * Spawn `player` at a random location on the board.
     */
    public spawnRandom(player: Player): void {
        const neutralTiles: Tile[] = Object.values(this.tiles).filter(tile => tile.isNeutral());
        if (neutralTiles.length === 0) {
            throw new Error('No neutral tiles left.');
        }
        const tile: Tile = Math2.selectRandom(neutralTiles);
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
     * Count the number of tiles that `player` owns.
     */
    public numTilesOwnedBy(player: Player): number {
        return Object.values(this.tiles).filter(tile => tile.isOwnedBy(player)).length;
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
    constructor(private readonly player: Player, overrideCenter?: Vec2) {
        super(1, 0, overrideCenter ?? new Vec2(0.875, 0.8125));
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
 * An interface that manages and displays the turn order.
 */
class TurnOrder implements Drawable {
    private readonly tiles: Tile[];
    private currentPlayer: number;
    private turnNumber: number;
    constructor(private readonly players: Player[], private readonly board: Board, private readonly normalizedCenter: Vec2, private readonly suppressDPad: boolean = false) {
        this.tiles = players.map((_player, i) => new Tile(new Vec2(0, i)));
        this.currentPlayer = -1;
        this.turnNumber = 0;
    }
    /**
     * Advance to the next player or turn.
     */
    public advance(): void {
        let counter = 0;
        do {
            counter++;
            this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
            if (this.currentPlayer === 0) {
                this.turnNumber++; // Note: increment turn number when player ID loops back to 0
            }
        } while (!this.board.hasLegalMoves(this.getCurrentPlayer()) && counter < this.players.length);
    }
    /**
     * Return the player whose turn it currently is.
     */
    public getCurrentPlayer(): Player {
        return this.players[this.currentPlayer];
    }
    /**
     * Return the direction of the current player's `DPad`
     */
    public getCurrentDirection(): Direction {
        return this.getCurrentPlayer().getDirection();
    }
    /**
     * Return some familiar text to display for the current turn information.
     */
    public getTurnText(): string {
        return 'Turn ' + this.turnNumber + ': ' + this.getCurrentPlayer().getName();
    }
    /**
     * Determine if no players have any legal moves left.
     */
    public isGameOver(): boolean {
        return !this.players.some(player => this.board.hasLegalMoves(player));
    }
    draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.normalizedCenter.x * ctx.canvas.width, this.normalizedCenter.y * ctx.canvas.height);
        this.tiles.forEach((tile, i) => {
            tile.forceCapture(this.players[(i + this.currentPlayer) % this.players.length]);
            tile.draw(ctx);
        });
        ctx.restore();
        this.suppressDPad || this.getCurrentPlayer().draw(ctx);
    }
}

/**
 * Represents some text to render on the game surface.
 */
class Text implements Drawable {
    private progress: number = 0;
    constructor(private value: string, private readonly size: number = 12, private readonly normalizedCenter: Vec2 = new Vec2(0, 0), private readonly writing: boolean = false, private readonly style: { align: CanvasTextAlign, base: CanvasTextBaseline } = { align: 'left', base: 'top' }) { }
    /**
     * Set the text of this `Text` element
     */
    public setText(value: string): void {
        this.value = value;
        this.progress = 0;
    }
    draw(ctx: CanvasRenderingContext2D): void {
        if (this.writing) {
            this.progress++;
        } else {
            this.progress = this.value.length;
        }
        ctx.textAlign = this.style.align;
        ctx.textBaseline = this.style.base;
        ctx.font = 'bold ' + this.size + 'px monospace';
        this.value.substring(0, this.progress).split('\n')
            .forEach((line, i) => {
                ctx.fillStyle = ctx.canvas.style.background;
                ctx.fillRect(this.normalizedCenter.x * ctx.canvas.width, this.normalizedCenter.y * ctx.canvas.height + i * this.size, ctx.measureText(line).width, 12);
                ctx.fillStyle = 'black';
                ctx.fillText(line, this.normalizedCenter.x * ctx.canvas.width, this.normalizedCenter.y * ctx.canvas.height + i * this.size);
            });
    }
}

/**
 * Stores all the game's core logic.
 */
class Game implements Drawable {
    private static readonly MIN_PLAYERS: number = 1;
    private static readonly MAX_PLAYERS: number = 6;
    private readonly board: Board;
    private readonly players: Player[];
    private paused: boolean;
    private readonly turnText: Text;
    private readonly turnOrder: TurnOrder;
    private gameOverText: Text | undefined;
    /**
     * Start a new game with specified parameters.
     */
    constructor(numHumans: number, numAI: number, boardSize: number, favoriteColor: Color, spawnMode: SpawnMode, wallDensity: number) {
        Player.reset();
        this.players = [];
        this.paused = false;
        this.board = new Board(boardSize, wallDensity);
        this.turnText = new Text('Start game', 12, new Vec2(0.01, 0.01));
        numHumans = Math2.clamp(numHumans, 0, Game.MAX_PLAYERS);
        numAI = Math2.clamp(numAI, 0, Game.MAX_PLAYERS);
        numAI = Math2.clamp(numAI, Game.MIN_PLAYERS - numHumans, Game.MAX_PLAYERS - numHumans);
        for (let i = 0; i < numHumans; i++) {
            this.players.push(new Player(favoriteColor, false));
        }
        for (let i = 0; i < numAI; i++) {
            this.players.push(new Player(favoriteColor, true));
        }
        this.turnOrder = new TurnOrder(this.players, this.board, new Vec2(0.1, 0.25));
        this.spawn(spawnMode);
        this.nextTurn();
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
    /**
     * Pauses the game.
     */
    public pause(): void {
        this.paused = true;
    }
    /**
     * Unpauses the game.
     */
    public unpause(): void {
        this.paused = false;
    }
    /**
     * Accept human keyboard input.
     */
    public humanInput(rotation: Rotation): void {
        if (!this.turnOrder.getCurrentPlayer().isAI) {
            this.turnOrder.getCurrentPlayer().rotate(rotation);
        }
    }
    /**
     * Make a selection.
     */
    public humanSelect(): void {
        if (this.turnOrder.isGameOver()) {
            this.gameOverText = undefined;
        } else if (!this.turnOrder.getCurrentPlayer().isAI) {
            this.takeTurn();
        }
    }
    private aiInput(): void {
        if (this.turnOrder.getCurrentPlayer().isAI) {
            const bucketNames: Direction[] = ['North', 'NorthEast', 'NorthWest', 'South', 'SouthEast', 'SouthWest'],
                buckets: number[] = bucketNames.map(name => this.board.captureWeight(this.turnOrder.getCurrentPlayer(), name)),
                selectedDirection = bucketNames[Math2.selectRandomBucket(buckets)]; // Note: is `undefined` when there are no legal moves
            let thinkTicks = 5, selectTicks = 5;
            const aiTick = setInterval(() => {
                if (this.paused) {
                    // Do nothing.
                } else if (thinkTicks > 0) {
                    thinkTicks--;
                } else if (this.turnOrder.getCurrentDirection() !== selectedDirection) {
                    this.turnOrder.getCurrentPlayer().rotate('CW');
                } else if (selectTicks > 0) {
                    selectTicks--;
                } else {
                    this.takeTurn();
                    clearInterval(aiTick);
                }
            }, 100);
        }
    }
    /**
     * This function attempts to capture tiles, and on success, advances to the next turn.
     */
    private takeTurn(): void {
        if (this.board.captureWeight(this.turnOrder.getCurrentPlayer(), this.turnOrder.getCurrentDirection()) > 0) {
            this.board.captureTiles(this.turnOrder.getCurrentPlayer(), this.turnOrder.getCurrentDirection());
            this.nextTurn();
        }
    }
    /**
     * This function forces the next turn and does not capture.
     */
    private nextTurn(): void {
        this.turnOrder.advance();
        if (this.turnOrder.isGameOver()) {
            this.turnText.setText('');
            const playerSortByScore: (string | number)[][] = this.players
                .map(player => [player.getName(), this.board.numTilesOwnedBy(player)])
                .sort((a, b) => +b[1] - +a[1]);
            const highScore: number = +playerSortByScore[0][1],
                winners: string[] = playerSortByScore
                    .filter(p => p[1] === highScore)
                    .map(p => p[0] as string);
            let winnerText = '';
            if (winners.length === 1) {
                winnerText = 'Winner! ' + winners[0] + ' captured ' + highScore + ' tiles.';
            } else {
                winnerText = 'Tie for ' + highScore + ' tiles!\n' + winners.join(', ');
            }
            winnerText += '\n\nPress space to close this message\nor ESC to quit.';
            this.gameOverText = new Text(winnerText, 12, new Vec2(0.1, 0.1), true);
        } else {
            this.turnText.setText(this.turnOrder.getTurnText());
            this.aiInput();
        }
    }
    draw(ctx: CanvasRenderingContext2D): void {
        this.board.draw(ctx);
        if (this.turnOrder.isGameOver()) {
            this.gameOverText?.draw(ctx);
        } else {
            this.turnOrder.draw(ctx);
            this.turnText.draw(ctx);
        }
    }
}

/**
 * Represents an in-game menu for selection.
 */
class Menu extends Text {
    private selected: number;
    /**
     * Create a new list of menu options from an array of items.
     */
    constructor(private readonly items: string[]) {
        super('', 12, new Vec2(0.5, 0.5), false, { align: 'center', base: 'middle' });
        this.selected = 0;
        this.refresh();
    }
    /**
     * Move the menu selector up or down.
     */
    public move(way: MenuMove): void {
        switch (way) {
            case ('up'): {
                this.selected--;
                break;
            }
            case ('down'): {
                this.selected++;
                break;
            }
            default: {
                throw new Error('Invalid menu movement: ' + way);
            }
        }
        this.selected = (this.selected + this.items.length) % this.items.length;
        this.refresh();
    }
    /**
     * Return the currently selected text.
     */
    public getSelected(): string {
        return this.items[this.selected];
    }
    /**
     * Reset the text of this menu list.
     */
    private refresh(): void {
        this.setText(this.items.map((item, i) => i === this.selected ? '> ' + item + ' <' : item).join('\n'));
    }
}

/**
 * This class contains all the logic necessary to play the Hexles official online board game.
 */
export class Hexles implements Drawable {
    private static currentState: GameState = 'MainMenu';
    private static game: Game;
    private static helpPage: number;
    private static readonly header: Text = new Text('', 24, new Vec2(0.5, 0.1), false, { align: 'center', base: 'middle' });
    private static readonly tipText: Text = new Text('', 12, new Vec2(0.5, 0.99), true, { align: 'center', base: 'bottom' });
    private static readonly setting: Text = new Text('< 1 >', 12, new Vec2(0.8, 0.8), false, { align: 'center', base: 'middle' });
    private static readonly helpText: Text = new Text('', 12, new Vec2(0.05, 0.2));
    private static readonly creator: Text = new Text('Created by Nicolas Ventura (c) 2023', 12, new Vec2(0.5, 0.9), false, { align: 'center', base: 'middle' });
    private static readonly mainMenu: Menu = new Menu(['Play', 'Help', 'Options']);
    private static readonly pauseMenu: Menu = new Menu(['Resume', 'Quit']);
    private static readonly settings: Menu = new Menu(['Human Players', 'AI Players', 'Board Size', 'Favorite Color', 'Spawn Mode', 'Walls', 'Go Back']);
    private static readonly demoBoard: Board = new Board(1, 0, new Vec2(0.5, 0.3));
    private static readonly NumHumanChoice: number[] = [0, 1, 2, 3, 4, 5, 6];
    private static readonly NumAIChoice: number[] = [0, 1, 2, 3, 4, 5, 6];
    private static readonly BoardSizeChoice: string[] = ['Micro', 'Small', 'Medium', 'Large', 'Huge'];
    private static readonly ColorChoice: Color[] = ['Red', 'Orange', 'Yellow', 'Green', 'Cyan', 'Blue', 'Violet'];
    private static readonly GameModeChoice: string[] = ['Corners', 'Random'];
    private static readonly SpawnWallsChoice: string[] = ['None', 'Light', 'Dense'];
    private static readonly me: Hexles = new Hexles();
    private static readonly gameSettings: { numHumans: number, numAI: number, size: string, favoriteColor: Color, spawnMode: string, wallDensity: string } = {
        numHumans: this.NumHumanChoice[1],
        numAI: this.NumAIChoice[0],
        size: this.BoardSizeChoice[1],
        favoriteColor: this.ColorChoice[0],
        spawnMode: this.GameModeChoice[0],
        wallDensity: this.SpawnWallsChoice[0],
    };
    private static readonly TutorialText: string[] = [
        'This game is called Hexles. Play using the\nkeyboard:\n- arrow keys/WASD (move cursor)\n- space/enter (select)\n- ESC/backspace (cancel/pause)\n\nUse A/D or the arrow keys to navigate\nthrough this tutorial.',
        'Hexles is played on\na hexagonal tiled board\nmuch like this one.\n\nThe aim of the game is\nto capture as many\ntiles as possible.\n\nWhen the board is full,\nthe biggest empire wins.',
        'Players (up to 6 total) take turns\ncapturing tiles.\n\nHuman players always go\nfirst before AI players,\nexcept in this tutorial.\n\nAll players can only\ncapture neutral (light\ngray) tiles.',
        'This interface shows the turn order,\nfrom top to bottom.\n\nThis means that [AI] Blue\ngoes first, then Orange.',
        '[AI] Blue just captured tiles at its\nNortheastern border. (That\ntile turned blue.)\n\nNow it\'s your turn (you\nare playing as orange.)',
        'In one turn, players capture tiles in one\nof 6 directions.\n\nUse A/D or the left and\nright arrow keys to rotate\nthis directional input.\nThis shows the direction\nin which to capture tiles.\n\nPress D or the right arrow key to rotate\nthis until it points South.',
        'Good! Keep going.',
        'Almost there.',
        'Perfect! This directional input shows\nthat you want to capture tiles that are\non your South border.\n\nPress space/enter to\nconfirm your selection.',
        'Switching back to the game board.\nThis is before...\n\nPress space/enter.',
        'And after. Notice you captured a\ntile! You are well on your\nway to victory.\n\nNeed a replay of that?\nPress A/left!\n\nNow it is [AI] Blue\'s\nturn.',
        '[AI] Blue captured North.\n\nNotice how 2 tiles were\ncaptured this time. This\nis because both of\n[AI] Blue\'s tiles had a\nNorthern border.\n\nHexles speeds up the more\nyou expand your empire.',
        'Move the directional input cursor to\nthe Southwest position.\n\nPress D/right once.',
        'Now press space/enter to select.',
        'You just captured 2 more tiles!\n\nLet\'s make this more\ninteresting.',
        'The dark gray tiles are walls.\nWalls are obstacles that\ncan\'t be captured or\ntraversed.\n\nWalls can be toggled\non/off in Options.',
        '[AI] Blue captured Northwest.\n\nDespite the 3 tiles on\nits Northwestern border,\nonly 2 tiles were\ncaptured.\n\nCan you figure out the\nnext move?',
        'Move the cursor to the Southeast position.\n\nRotate the directional\ninput counter clockwise\n(A/left) twice or clockwise\n(D/right) four times.\n\nIn this tutorial you must\nrotate clockwise 4 times.',
        'Rotate it clockwise 3 more times.\n\nPress D/right arrow.',
        'Rotate it clockwise 2 more times.\n\nPress D/right arrow.',
        'Rotate it clockwise 1 more time.\n\nPress D/right arrow.',
        'Now press space/enter to confirm.',
        'You captured 2 more tiles and\nblocked [AI] Blue from\nfurther expanding North!',
        '[AI] Blue captured Northeast and is\nnow out of legal moves.\n\nThat means you can\ncapture tiles until you\nrun out of moves, too.',
        'You first capture tiles at your\nSouthwest border.',
        'Finally, you capture tiles at your\nNortheast border. Capturing\nSoutheast would have\nworked here, too.',
        'No players have any moves left, so it\'s\ngame over. [AI] Blue\ncaptured 7 tiles and\nyou captured 9.\n\nCongratulations, you win\nand officially completed\nthe tutorial!',
    ];
    /**
     * Accept user keyboard input.
     */
    public static receiveInput(inputType: Input): void {
        switch (this.currentState) {
            case ('MainMenu'): {
                switch (inputType) {
                    case ('down'):
                    case ('up'): {
                        this.mainMenu.move(inputType);
                        switch (this.mainMenu.getSelected()) {
                            case ('Play'): {
                                this.tipText.setText('Play Hexles with the current settings.');
                                break;
                            }
                            case ('Help'): {
                                this.tipText.setText('Learn how to play Hexles with a tutorial.');
                                break;
                            }
                            case ('Options'): {
                                this.tipText.setText('Customize your gameplay experience!');
                                break;
                            }
                            default: {
                                this.tipText.setText('');
                            }
                        }
                        break;
                    }
                    case ('select'): {
                        this.tipText.setText('');
                        switch (this.mainMenu.getSelected()) {
                            case ('Play'): {
                                this.game = new Game(this.gameSettings.numHumans, this.gameSettings.numAI, this.BoardSizeChoice.indexOf(this.gameSettings.size) + 1, this.gameSettings.favoriteColor, this.gameSettings.spawnMode === 'Corners' ? 'fair' : 'random', this.SpawnWallsChoice.indexOf(this.gameSettings.wallDensity) / 6);
                                this.currentState = 'Game';
                                break;
                            }
                            case ('Help'): {
                                this.helpPage = 0;
                                this.currentState = 'Help';
                                this.helpText.setText(this.TutorialText[this.helpPage]);
                                this.tipText.setText('Press ESC/backspace any time to exit.');
                                break;
                            }
                            case ('Options'): {
                                this.currentState = 'Settings';
                                this.tipText.setText('Use left and right to change settings.');
                                break;
                            }
                            default: {
                                this.tipText.setText('');
                            }
                        }
                        break;
                    }
                }
                break;
            }
            case ('Settings'): {
                switch (inputType) {
                    case ('down'):
                    case ('up'): {
                        this.settings.move(inputType);
                        switch (this.settings.getSelected()) {
                            case ('Human Players'): {
                                this.setting.setText('< ' + this.gameSettings.numHumans + ' >');
                                break;
                            }
                            case ('AI Players'): {
                                this.setting.setText('< ' + this.gameSettings.numAI + ' >');
                                break;
                            }
                            case ('Board Size'): {
                                this.setting.setText('< ' + this.gameSettings.size + ' >');
                                break;
                            }
                            case ('Favorite Color'): {
                                this.setting.setText('< ' + this.gameSettings.favoriteColor + ' >');
                                break;
                            }
                            case ('Spawn Mode'): {
                                this.setting.setText('< ' + this.gameSettings.spawnMode + ' >');
                                break;
                            }
                            case ('Walls'): {
                                this.setting.setText('< ' + this.gameSettings.wallDensity + ' >');
                                break;
                            }
                            default: {
                                this.setting.setText('');
                            }
                        }
                        break;
                    }
                    case ('CCW'):
                    case ('CW'): {
                        switch (this.settings.getSelected()) {
                            case ('Human Players'): {
                                this.gameSettings.numHumans = this.handleChoice(this.gameSettings.numHumans, this.NumHumanChoice, inputType);
                                this.setting.setText('< ' + this.gameSettings.numHumans + ' >');
                                break;
                            }
                            case ('AI Players'): {
                                this.gameSettings.numAI = this.handleChoice(this.gameSettings.numAI, this.NumAIChoice, inputType);
                                this.setting.setText('< ' + this.gameSettings.numAI + ' >');
                                break;
                            }
                            case ('Board Size'): {
                                this.gameSettings.size = this.handleChoice(this.gameSettings.size, this.BoardSizeChoice, inputType);
                                this.setting.setText('< ' + this.gameSettings.size + ' >');
                                break;
                            }
                            case ('Favorite Color'): {
                                this.gameSettings.favoriteColor = this.handleChoice(this.gameSettings.favoriteColor, this.ColorChoice, inputType);
                                this.setting.setText('< ' + this.gameSettings.favoriteColor + ' >');
                                break;
                            }
                            case ('Spawn Mode'): {
                                this.gameSettings.spawnMode = this.handleChoice(this.gameSettings.spawnMode, this.GameModeChoice, inputType);
                                this.setting.setText('< ' + this.gameSettings.spawnMode + ' >');
                                break;
                            }
                            case ('Walls'): {
                                this.gameSettings.wallDensity = this.handleChoice(this.gameSettings.wallDensity, this.SpawnWallsChoice, inputType);
                                this.setting.setText('< ' + this.gameSettings.wallDensity + ' >');
                                break;
                            }
                            default: {
                                this.setting.setText('');
                            }
                        }
                        break;
                    }
                    case ('select'): {
                        switch (this.settings.getSelected()) {
                            case ('Go Back'): {
                                this.currentState = 'MainMenu';
                                this.tipText.setText('');
                                break;
                            }
                        }
                        break;
                    }
                    case ('back'): {
                        this.currentState = 'MainMenu';
                        this.tipText.setText('');
                        break;
                    }
                }
                break;
            }
            case ('Game'): {
                switch (inputType) {
                    case ('CCW'):
                    case ('CW'): {
                        this.game.humanInput(inputType);
                        break;
                    }
                    case ('select'): {
                        this.game.humanSelect();
                        break;
                    }
                    case ('back'): {
                        this.game.pause();
                        this.currentState = 'Paused';
                        break;
                    }
                }
                break;
            }
            case ('Paused'): {
                switch (inputType) {
                    case ('down'):
                    case ('up'): {
                        this.pauseMenu.move(inputType);
                        switch (this.pauseMenu.getSelected()) {
                            case ('Resume'): {
                                this.tipText.setText('Unpause and go back to the game.');
                                break;
                            }
                            case ('Quit'): {
                                this.tipText.setText('Go back to the main menu.');
                                break;
                            }
                        }
                        break;
                    }
                    case ('select'): {
                        switch (this.pauseMenu.getSelected()) {
                            case ('Resume'): {
                                this.game.unpause();
                                this.currentState = 'Game';
                                break;
                            }
                            case ('Quit'): {
                                this.currentState = 'MainMenu';
                                break;
                            }
                        }
                        break;
                    }
                    case ('back'): {
                        this.game.unpause();
                        this.currentState = 'Game';
                        break;
                    }
                }
                break;
            }
            case ('Help'): {
                switch (inputType) {
                    case ('select'):
                    case ('CW'): {
                        this.helpPage++;
                        break;
                    }
                    case ('CCW'): {
                        this.helpPage--;
                        break;
                    }
                    case ('back'): {
                        this.tipText.setText('');
                        this.currentState = 'MainMenu';
                        break;
                    }
                }
                if (this.helpPage >= 0 && this.helpPage < this.TutorialText.length) {
                    this.helpText.setText(this.TutorialText[this.helpPage]);
                } else {
                    this.tipText.setText('');
                    this.currentState = 'MainMenu';
                }
                break;
            }
            default: {
                throw new Error('Invalid game state: ' + this.currentState);
            }
        }
    }
    /**
     * Scroll through a list of choices of type `T` and based on user input, return the next (or previous) choice.
     */
    private static handleChoice<T>(currentChoice: T, choices: T[], way: Rotation): T {
        let index = choices.indexOf(currentChoice);
        if (way === 'CW') {
            index++;
        } else {
            index--;
        }
        return choices[(index + choices.length) % choices.length];
    }
    private static generateTutorialBoard(step: number): Drawable {
        Player.reset();
        const P: Player[] = [new Player('Blue', true), new Player('Orange', false)],
            board: Board = new Board(2, 0, new Vec2(0.75, 0.5)),
            dpad: DPad = new DPad(P[1], new Vec2(0.75, 0.5)),
            turnOrder: TurnOrder = new TurnOrder(P, board, new Vec2(0.75, 0.5), true);
        board.spawn(P[0], new Vec2(0, 2));
        board.spawn(P[1], new Vec2(0, -2));
        turnOrder.advance();
        if (step > 3) {
            board.captureTiles(P[0], 'NorthEast');
        }
        if (step > 5) {
            dpad.rotate('CW');
        }
        if (step > 6) {
            dpad.rotate('CW');
        }
        if (step > 7) {
            dpad.rotate('CW');
        }
        if (step > 9) {
            board.captureTiles(P[1], 'South');
        }
        if (step > 10) {
            board.captureTiles(P[0], 'North');
        }
        if (step > 12) {
            dpad.rotate('CW');
        }
        if (step > 13) {
            board.captureTiles(P[1], 'SouthWest');
        }
        if (step > 14) {
            board.tutorialWall(new Vec2(-2, 2));
            board.tutorialWall(new Vec2(-1, 1));
            board.tutorialWall(new Vec2(2, -1));
        }
        if (step > 15) {
            board.captureTiles(P[0], 'NorthWest');
        }
        if (step > 17) {
            dpad.rotate('CW');
        }
        if (step > 18) {
            dpad.rotate('CW');
        }
        if (step > 19) {
            dpad.rotate('CW');
        }
        if (step > 20) {
            dpad.rotate('CW');
        }
        if (step > 21) {
            board.captureTiles(P[1], 'SouthEast');
        }
        if (step > 22) {
            board.captureTiles(P[0], 'NorthEast');
        }
        if (step > 23) {
            board.captureTiles(P[1], 'SouthWest');
        }
        if (step > 24) {
            board.captureTiles(P[1], 'NorthEast');
        }
        if (step === 3) {
            return turnOrder;
        }
        if ((step >= 5 && step <= 8) || (step >= 12 && step <= 13) || (step >= 17 && step <= 21)) {
            return dpad;
        }
        return board;
    }
    /**
     * Return an instance handle of `Hexles` (for drawing.)
     */
    public static handle(): Hexles {
        return this.me;
    }
    draw(ctx: CanvasRenderingContext2D): void {
        switch (Hexles.currentState) {
            case ('MainMenu'): {
                Hexles.header.setText('Hexles');
                Hexles.header.draw(ctx);
                Hexles.demoBoard.draw(ctx);
                Hexles.mainMenu.draw(ctx);
                Hexles.creator.draw(ctx);
                Hexles.tipText.draw(ctx);
                break;
            }
            case ('Settings'): {
                Hexles.header.setText('Settings');
                Hexles.header.draw(ctx);
                Hexles.demoBoard.draw(ctx);
                Hexles.settings.draw(ctx);
                Hexles.setting.draw(ctx);
                Hexles.tipText.draw(ctx);
                break;
            }
            case ('Game'): {
                Hexles.game.draw(ctx);
                break;
            }
            case ('Paused'): {
                Hexles.header.setText('Paused');
                Hexles.header.draw(ctx);
                Hexles.demoBoard.draw(ctx);
                Hexles.pauseMenu.draw(ctx);
                Hexles.tipText.draw(ctx);
                break;
            }
            case ('Help'): {
                Hexles.header.setText('Tutorial');
                Hexles.header.draw(ctx);
                Hexles.helpText.draw(ctx);
                Hexles.tipText.draw(ctx);
                if (Hexles.helpPage >= 1) {
                    Hexles.generateTutorialBoard(Hexles.helpPage).draw(ctx);
                }
                break;
            }
            default: {
                throw new Error('Invalid game state: ' + Hexles.currentState);
            }
        }
    }
}