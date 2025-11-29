import { Config } from '../config/config.js';

export class GameConfig extends Config {
    constructor(url = null) {
        super(url);
    }

    getDefaultConfig() {
        return {
            canvasWidth: 1200,
            canvasHeight: 800,
            gravity: 1,
            debugMode: false
        };
    }
}