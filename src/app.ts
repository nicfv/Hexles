import { Color } from "./Color";
import { Canvas } from "./Engine";
import { Board, Human } from "./Game";

const CANV = new Canvas(document.body, 300, 200, 'white', 50, { width: 600, height: 400 });

const board = new Board(5),
    you = new Human(new Color(0, 190, 20));

board.SET_PLAYER_IN_CENTER_THIS_IS_A_TESTING_FUNCTION(you);

CANV.tick = () => {
    CANV.clear();
    CANV.draw(board);
};

CANV.onkeydown = key => {
    switch (key) {
        case ('q'): {
            board.captureTiles(you, 'NorthWest');
            break;
        }
        case ('w'): {
            board.captureTiles(you, 'North');
            break;
        }
        case ('e'): {
            board.captureTiles(you, 'NorthEast');
            break;
        }
        case ('a'): {
            board.captureTiles(you, 'SouthWest');
            break;
        }
        case ('s'): {
            board.captureTiles(you, 'South');
            break;
        }
        case ('d'): {
            board.captureTiles(you, 'SouthEast');
            break;
        }
    }
};