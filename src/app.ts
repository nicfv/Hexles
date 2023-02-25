import { Canvas } from "./Engine";
import { Game } from "./Game";

const CANV = new Canvas(document.body, 300, 200, 'white', 50, { width: 600, height: 400 });

const game = new Game(1, 10, 5, 'Green', 'random', 0.25);

CANV.tick = () => {
    CANV.clear();
    CANV.draw(game);
};

CANV.onkeydown = key => {
    switch (key) {
        case ('q'): {
            game.CAPTURE_TILES_THIS_IS_A_TESTING_FUNCTION('NorthWest');
            break;
        }
        case ('w'): {
            game.CAPTURE_TILES_THIS_IS_A_TESTING_FUNCTION('North');
            break;
        }
        case ('e'): {
            game.CAPTURE_TILES_THIS_IS_A_TESTING_FUNCTION('NorthEast');
            break;
        }
        case ('a'): {
            game.CAPTURE_TILES_THIS_IS_A_TESTING_FUNCTION('SouthWest');
            break;
        }
        case ('s'): {
            game.CAPTURE_TILES_THIS_IS_A_TESTING_FUNCTION('South');
            break;
        }
        case ('d'): {
            game.CAPTURE_TILES_THIS_IS_A_TESTING_FUNCTION('SouthEast');
            break;
        }
    }
};