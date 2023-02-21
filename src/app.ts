import { Canvas } from "./Engine";
import { Board } from "./Game";

const CANV = new Canvas(document.body, 300, 200, 'white', 50, { width: 600, height: 400 });

const board = new Board(5);

CANV.tick = () => {
    CANV.clear();
    CANV.draw(board);
};

// const LONG_ARRAY: number[][] = [];
// let startTime: number,
//     endTime: number,
//     final: number[] = [];

// for (let i = 0; i < 1e4; i++) {
//     LONG_ARRAY[i] = [];
//     LONG_ARRAY[i][0] = Math.floor(Math.random() * 1e4);
//     LONG_ARRAY[i][1] = Math.floor(Math.random() * 1e4);
//     LONG_ARRAY[i][2] = Math.floor(Math.random() * 1e4);
// }

// startTime = Date.now();
// for (let i = 0; i < 1e3; i++) {
//     final = LONG_ARRAY.filter((n, i) => LONG_ARRAY.indexOf(n) === i);
// }
// endTime = Date.now();
// console.log(endTime - startTime, 'filter, indexOf', final);

// startTime = Date.now();
// for (let i = 0; i < 1e3; i++) {
//     final = [...new Set(LONG_ARRAY)];
// }
// endTime = Date.now();
// console.log(endTime - startTime, 'new Set', final);

// startTime = Date.now();
// for (let i = 0; i < 1e3; i++) {
//     final = LONG_ARRAY.flat();
// }
// endTime = Date.now();
// console.log(endTime - startTime, 'flat', final);