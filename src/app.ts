import { Canvas } from "./Engine";
import { Game, Menu } from "./Game";

const CANV = new Canvas(document.body, 300, 200, 'cornflowerblue', 50, { width: 600, height: 400 });

const game = new Game(0, 10, 5, 'Green', 'random', 0.25);

const menu = new Menu(['hello', 'option 2', 'yonkers', 'blonker']);

CANV.tick = () => {
    CANV.clear();
    // CANV.draw(game);
    CANV.draw(menu);
};

CANV.onkeydown = key => {
    switch (key) {
        case ('w'): {
            menu.move('up');
            break;
        }
        case ('s'): {
            menu.move('down');
            break;
        }
        case ('a'): {
            game.humanInput('CCW');
            break;
        }
        case ('d'): {
            game.humanInput('CW');
            break;
        }
        case (' '): {
            console.log(menu.getSelected());
            game.humanSelect();
            break;
        }
    }
};