/**
 * Represents a drawing surface for a game.
 */
export class Canvas {
    private readonly element: HTMLCanvasElement;
    private readonly context: CanvasRenderingContext2D;
    /**
     * Set the callback function for when the mouse or a pointer is moved.
     */
    public onpointermove: (x: number, y: number) => any = () => { };
    /**
     * Set the callback function for when the mouse or a pointer is down.
     */
    public onpointerdown: (x: number, y: number) => any = () => { };
    /**
     * Set the callback function for when the mouse or a pointer is up.
     */
    public onpointerup: (x: number, y: number) => any = () => { };
    /**
     * Set the callback function for when a key is pressed.
     */
    public onkeydown: (key: string) => any = () => { };
    /**
     * Set the callback function for when a key is released.
     */
    public onkeyup: (key: string) => any = () => { };
    /**
     * Set the callback function for every game tick.
     */
    public tick: () => any = () => { };
    /**
     * Create a new `Canvas` and append it onto the `parent` element. The number `dt` specifies the `tick` interval.
     * If `elementSize` is specified, this overrides the size of the HTML canvas element and stretches or compresses the pixels.
     */
    constructor(parent: Element, width: number, height: number, background: string, dt: number, elementSize: { width: number, height: number } = { width: width, height: height }) {
        // Create the canvas and context, and append it to the parent element
        this.element = document.createElement('canvas');
        this.context = this.element.getContext('2d')!;
        parent.appendChild(this.element);
        // Set styling parameters for the canvas
        this.element.style.width = elementSize.width + 'px';
        this.element.style.height = elementSize.height + 'px';
        this.element.style.imageRendering = 'pixelated';
        this.element.style.background = background;
        // Set attributes for the canvas
        this.element.width = width;
        this.element.height = height;
        this.element.tabIndex = 0;
        this.element.focus();
        // Add event listeners
        this.element.addEventListener('pointermove', e => this.onpointermove(e.offsetX, e.offsetY));
        this.element.addEventListener('pointerdown', e => this.onpointerdown(e.offsetX, e.offsetY));
        this.element.addEventListener('pointerup', e => this.onpointerup(e.offsetX, e.offsetY));
        this.element.addEventListener('keydown', e => this.onkeydown(e.key));
        this.element.addEventListener('keyup', e => this.onkeyup(e.key));
        this.element.addEventListener('contextmenu', e => e.preventDefault());
        // Set an interval to call the tick function
        setInterval(() => this.tick(), dt);
    }
    /**
     * Draw a single game object onto the canvas.
     */
    public draw(drawable: Drawable): void {
        drawable.draw(this.context);
    }
    /**
     * Clears the canvas.
     */
    public clear(): void {
        this.context.clearRect(0, 0, this.element.width, this.element.height);
    }
}

/**
 * Game objects must implement this interface in order to be rendered.
 */
export interface Drawable {
    /**
     * Draws the game object onto the canvas.
     */
    draw(ctx: CanvasRenderingContext2D): void;
}