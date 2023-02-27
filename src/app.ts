import { Canvas } from "./Engine";
import { Hexles } from "./Game";

const CANV = new Canvas(document.body, 300, 200, 'cornflowerblue', false, true, 50, { width: 600, height: 400 });

CANV.tick = () => {
    CANV.clear();
    CANV.draw(new Hexles());
};

CANV.onkeydown = key => {
    switch (key.toLowerCase()) {
        case ('w'): {
            Hexles.receiveInput('up');
            break;
        }
        case ('s'): {
            Hexles.receiveInput('down');
            break;
        }
        case ('a'): {
            Hexles.receiveInput('CCW');
            break;
        }
        case ('d'): {
            Hexles.receiveInput('CW');
            break;
        }
        case (' '): {
            Hexles.receiveInput('select');
            break;
        }
        case ('escape'): {
            Hexles.receiveInput('back');
            break;
        }
    }
};