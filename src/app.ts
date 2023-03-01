import { Canvas } from "./Engine";
import { Hexles } from "./Game";

const CANV = new Canvas(document.body, 300, 200, 'cornflowerblue', false, true, 50, { width: 600, height: 400 });

CANV.tick = () => {
    CANV.clear();
    CANV.draw(Hexles.handle());
};

CANV.onkeydown = key => {
    switch (key.toLowerCase()) {
        case ('arrowup'):
        case ('w'): {
            Hexles.receiveInput('up');
            break;
        }
        case ('arrowdown'):
        case ('s'): {
            Hexles.receiveInput('down');
            break;
        }
        case ('arrowleft'):
        case ('a'): {
            Hexles.receiveInput('CCW');
            break;
        }
        case ('arrowright'):
        case ('d'): {
            Hexles.receiveInput('CW');
            break;
        }
        case ('enter'):
        case (' '): {
            Hexles.receiveInput('select');
            break;
        }
        case ('backspace'):
        case ('escape'): {
            Hexles.receiveInput('back');
            break;
        }
    }
};