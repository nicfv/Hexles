import { Canvas } from "./Engine";
import { Game } from "./Game";

const CANV = new Canvas(document.body, 300, 200, 'white', 50, { width: 600, height: 400 });

// const game = new Game(1, 10, 5, 'Green', 'random', 0.25);
const game = new Game(0, 10, 5, 'Green', 'fair', 0);

CANV.tick = () => {
    CANV.clear();
    CANV.draw(game);
};

CANV.onkeydown = key => {
    switch (key) {
        case ('a'): {
            game.humanInput('CCW');
            break;
        }
        case ('d'): {
            game.humanInput('CW');
            break;
        }
        case (' '): {
            game.humanSelect();
        }
    }
};