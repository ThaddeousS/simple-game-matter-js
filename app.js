import { Game } from './src/game/game.js';

const init = () => {
    window.addEventListener('load', async () => {
        const game = new Game();
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