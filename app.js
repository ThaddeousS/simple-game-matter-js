import { Game } from './src/game/game.js';

const init = () => {
    let game = undefined;

    window.addEventListener('load', async () => {
        game = new Game();
        await game.initialize();

        const infoHeader = document.getElementById('info-header');
        infoHeader.addEventListener('click', () => {
            game.toggleInfoPanel();
        });
        
        // Setup game over reset button
        const resetButton = document.getElementById('reset-button');
        resetButton.addEventListener('click', () => {
            game.resetWorld();
        });
});
};

init();