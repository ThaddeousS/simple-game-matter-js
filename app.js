import { Game } from './src/game/game.js';

const init = () => {
    window.addEventListener('load', () => {
        const game = new Game();
    });
};

init();