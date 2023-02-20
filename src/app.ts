import { Canvas } from "./Engine";
import { Board } from "./Game";

const CANV = new Canvas(document.body, 300, 200, 'white', 50, { width: 600, height: 400 });

const board = new Board(5);

CANV.tick = () => {
    CANV.clear();
    CANV.draw(board);
};