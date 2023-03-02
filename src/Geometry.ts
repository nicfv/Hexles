/**
 * Contains advanced mathematical functions.
 */
export class Math2 {
    /**
     * Clamp a number `x` to the range `[min,max]`
     */
    public static clamp(x: number, min: number, max: number): number {
        return (x < min ? min : (x > max ? max : x));
    }
    /**
     * Return a random integer in the range `[min,max)`
     */
    public static randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min) + min);
    }
    /**
     * Select a random element from `arr` of type `T`
     */
    public static selectRandom<T>(arr: T[]): T {
        return arr[Math2.randomInt(0, arr.length)];
    }
    /**
     * Return a weighted random bucket 0-indexed ID from an array of buckets.
     */
    public static selectRandomBucket(bucketSizes: number[]): number {
        const startVal: number[] = [];
        let accumulation = 0;
        for (let s of bucketSizes) {
            accumulation += s;
            startVal.push(accumulation);
        }
        const size = accumulation,
            ran = Math2.randomInt(0, size);
        return startVal.findIndex(s => ran < s);
    }
}

/**
 * Represents an `(x,y)` coordinate pair.
 */
export interface Vec2 {
    x: number;
    y: number;
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
        for (let i = 0; i < SIDES; i++) {
            const ANGLE: number = i / SIDES * 2 * Math.PI;
            this.points.push({
                x: size * Math.cos(ANGLE) + center.x,
                y: size * Math.sin(ANGLE) + center.y,
            });
        }
    }
}