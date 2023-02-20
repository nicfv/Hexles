/**
 * Represents an RGB color value.
 */
export class Color {
    constructor(public red: number, public green: number, public blue: number) { }
    /**
     * Return the `rgb(...)` string of this color.
     */
    public toString(): string {
        return 'rgb(' + this.red + ',' + this.green + ',' + this.blue + ')';
    }
}