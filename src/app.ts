import { Canvas } from "./Engine";
import { Hexagon } from "./Hexagon";

const CANV = new Canvas(document.body, 300, 200, 'white', 50, { width: 600, height: 400 });

const hex = new Hexagon();

CANV.onpointerdown = (x, y) => console.log(x, y, 'down');
CANV.onpointermove = (x, y) => console.log(x, y, 'move');
CANV.onpointerup = (x, y) => console.log(x, y, 'up');
CANV.onkeydown = k => {
    console.log(k + ' down');
    switch (k.toLowerCase()) {
        case ('a'): {
            hex.move(-5, 0);
            break;
        }
        case ('w'): {
            hex.move(0, -5);
            break;
        }
        case ('s'): {
            hex.move(0, 5);
            break;
        }
        case ('d'): {
            hex.move(5, 0);
            break;
        }
    }
};
CANV.onkeyup = k => console.log(k + ' up');

CANV.tick = () => {
    CANV.clear();
    CANV.draw(hex);
};