/**
 * Represents an `(x,y)` coordinate pair.
 */
export class Vec2 {
    constructor(public x: number, public y: number) { }
    /**
     * Compute the euclidean length of this vector.
     */
    public length(): number {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }
    /**
     * `a + b`
     */
    public static add(a: Vec2, b: Vec2): Vec2 {
        return new Vec2(a.x + b.x, a.y + b.y); // TODO: Remove these functions?
    }
    /**
     * `a - b`
     */
    public static sub(a: Vec2, b: Vec2): Vec2 {
        return new Vec2(a.x - b.x, a.y - b.y);
    }
    /**
     * `a * b` (by element)
     */
    public static mult(a: Vec2, b: Vec2): Vec2 {
        return new Vec2(a.x * b.x, a.y * b.y);
    }
    /**
     * Compute the euclidean distance between `a` and `b`
     */
    public static dist(a: Vec2, b: Vec2): number {
        return this.sub(a, b).length();
    }
}

/**
 * Represents a regular 6-sided polygon.
 */
export class Hexagon {
    /**
     * The vertices that make up the hexagon.
     */
    protected readonly points: Vec2[] = [];
    /**
     * Create a new hexagon located at `center` with side length of `size`
     */
    constructor(center: Vec2, size: number) {
        const SIDES: number = 6;
        for (let i = 0; i <= SIDES; i++) {
            const ANGLE: number = i / SIDES * 2 * Math.PI;
            this.points.push(new Vec2(
                center.x + size * Math.cos(ANGLE),
                center.y + size * Math.sin(ANGLE)
            ));
        }
    }
}