import Matter from 'matter-js';
import { Camera } from '../camera/camera.js';
import { InputHandler } from '../input/input-handler.js';
import { Player } from './entity/player/player.js';

export class Game {
    constructor() {
        // Module aliases
        const { Engine, Render, World, Bodies, Runner } = Matter;

        // Load game config, player config, and level data
        this.gameConfig = this.getDefaultGameConfig();
        this.playerConfig = this.getDefaultPlayerConfig();
        this.levelData = this.getDefaultLevel();
        
        // Set aspect ratio from game config (default to 16:9 if not specified)
        try {
            this.aspectRatio = this.gameConfig.aspectRatio 
                ? this.parseAspectRatio(this.gameConfig.aspectRatio)
                : (16 / 9);
        } catch (error) {
            console.error('Aspect ratio error:', error.message);
            alert(error.message + '\n\nDefaulting to 16:9');
            this.aspectRatio = 16 / 9;
        }
        
        // Calculate initial dimensions maintaining aspect ratio
        const dimensions = this.calculateCanvasDimensions();

        // Create engine
        this.engine = Engine.create();
        this.world = this.engine.world;

        // Create renderer
        this.render = Render.create({
            element: document.body,
            engine: this.engine,
            options: {
                width: dimensions.width,
                height: dimensions.height,
                wireframes: false,
                background: '#2c3e50'
            }
        });

        // Initialize camera
        this.camera = new Camera(0, 0, dimensions.width, dimensions.height);

        // Initialize input
        this.input = new InputHandler();
        
        // Bind input actions
        this.input.bindAction('moveLeft', ['ArrowLeft', 'a', 'A']);
        this.input.bindAction('moveRight', ['ArrowRight', 'd', 'D']);
        this.input.bindAction('jump', ['ArrowUp', 'w', 'W', ' ']);

        // Create world with loaded level data
        this.createWorld();

        // Create player using Player class
        this.player = null;
        this.createPlayer();

        // Set camera to follow player
        this.camera.setTarget(this.player.body);

        // Setup event listeners
        this.setupEvents();

        // Create and start the runner
        this.runner = Runner.create();
        Runner.run(this.runner, this.engine);
        Render.run(this.render);

        // Game loop
        this.gameLoop();
    }

    calculateCanvasDimensions() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const windowAspectRatio = windowWidth / windowHeight;

        let width, height;

        if (windowAspectRatio > this.aspectRatio) {
            // Window is wider than target aspect ratio
            // Fit to height
            height = windowHeight;
            width = height * this.aspectRatio;
        } else {
            // Window is taller than target aspect ratio
            // Fit to width
            width = windowWidth;
            height = width / this.aspectRatio;
        }

        return { width, height };
    }

    parseAspectRatio(aspectRatioString) {
        // Valid aspect ratios
        const validRatios = {
            "16:9": 16 / 9,
            "4:3": 4 / 3,
            "21:9": 21 / 9
        };

        if (typeof aspectRatioString === 'number') {
            // If it's already a number, validate it matches one of our allowed ratios
            const matchingRatio = Object.entries(validRatios).find(
                ([key, value]) => Math.abs(value - aspectRatioString) < 0.0001
            );
            
            if (!matchingRatio) {
                throw new Error(
                    `Invalid aspect ratio: ${aspectRatioString}. ` +
                    `Only the following aspect ratios are supported: "16:9", "4:3", "21:9"`
                );
            }
            return aspectRatioString;
        }

        if (typeof aspectRatioString === 'string') {
            if (!validRatios.hasOwnProperty(aspectRatioString)) {
                throw new Error(
                    `Invalid aspect ratio: "${aspectRatioString}". ` +
                    `Only the following aspect ratios are supported: "16:9", "4:3", "21:9"`
                );
            }
            return validRatios[aspectRatioString];
        }

        throw new Error(
            `Invalid aspect ratio format. ` +
            `Only the following aspect ratios are supported: "16:9", "4:3", "21:9"`
        );
    }

    getDefaultGameConfig() {
        return {
            "aspectRatio": "16:9"
        };
    }

    getDefaultPlayerConfig() {
        return {
            "x": 0,
            "y": -400,
            "width": 40,
            "height": 60,
            "color": "#ffcc00",
            "strokeColor": "#ff9900",
            "strokeWidth": 3,
            "moveForce": 0.001,
            "jumpForce": 0.015,
            "maxSpeed": 8,
            "friction": 0.3,
            "frictionAir": 0.01,
            "density": 0.002
        };
    }

    getDefaultLevel() {
        return {
            "worldSize": 3000,
            "wallThickness": 50,
            "boundaries": {
                "enabled": true
            },
            "overrides": {
                "player": {
                    "x": 0,
                    "y": -400
                }
            },
            "platforms": [
                { "x": -400, "y": 100, "width": 300, "height": 20, "color": "#e74c3c", "isStatic": true },
                { "x": 400, "y": -100, "width": 300, "height": 20, "color": "#3498db", "isStatic": true },
                { "x": 0, "y": 300, "width": 400, "height": 20, "color": "#2ecc71", "isStatic": true },
                { "x": -600, "y": -200, "width": 200, "height": 20, "color": "#f39c12", "isStatic": true },
                { "x": 600, "y": 200, "width": 200, "height": 20, "color": "#9b59b6", "isStatic": true }
            ],
            "boxes": [
                { "x": -200, "y": -300, "size": 50, "color": "#e74c3c" },
                { "x": 300, "y": -200, "size": 40, "color": "#3498db" },
                { "x": -500, "y": 50, "size": 60, "color": "#2ecc71" },
                { "x": 100, "y": 150, "size": 45, "color": "#f39c12" },
                { "x": 450, "y": -50, "size": 55, "color": "#9b59b6" },
                { "x": -350, "y": -100, "size": 35, "color": "#1abc9c" },
                { "x": 200, "y": 250, "size": 50, "color": "#e74c3c" },
                { "x": -100, "y": -150, "size": 40, "color": "#3498db" },
                { "x": 500, "y": 100, "size": 45, "color": "#2ecc71" },
                { "x": -450, "y": 200, "size": 60, "color": "#f39c12" },
                { "x": 150, "y": -250, "size": 50, "color": "#9b59b6" },
                { "x": -250, "y": 150, "size": 55, "color": "#1abc9c" },
                { "x": 350, "y": 50, "size": 40, "color": "#e74c3c" },
                { "x": -150, "y": -50, "size": 45, "color": "#3498db" },
                { "x": 550, "y": -150, "size": 50, "color": "#2ecc71" },
                { "x": -550, "y": -50, "size": 35, "color": "#f39c12" },
                { "x": 50, "y": 350, "size": 60, "color": "#9b59b6" },
                { "x": -400, "y": -250, "size": 45, "color": "#1abc9c" },
                { "x": 400, "y": 300, "size": 50, "color": "#e74c3c" },
                { "x": -300, "y": 250, "size": 40, "color": "#3498db" }
            ],
            "circles": [
                { "x": -100, "y": -200, "radius": 30, "color": "#e74c3c" },
                { "x": 250, "y": -100, "radius": 25, "color": "#3498db" },
                { "x": -400, "y": 100, "radius": 35, "color": "#2ecc71" },
                { "x": 150, "y": 200, "radius": 28, "color": "#f39c12" },
                { "x": 500, "y": -50, "radius": 40, "color": "#9b59b6" },
                { "x": -300, "y": -150, "radius": 22, "color": "#1abc9c" },
                { "x": 300, "y": 150, "radius": 33, "color": "#e74c3c" },
                { "x": -200, "y": 250, "radius": 27, "color": "#3498db" },
                { "x": 450, "y": 50, "radius": 30, "color": "#2ecc71" },
                { "x": -500, "y": -100, "radius": 35, "color": "#f39c12" },
                { "x": 100, "y": -300, "radius": 25, "color": "#9b59b6" },
                { "x": -350, "y": 300, "radius": 38, "color": "#1abc9c" },
                { "x": 350, "y": -200, "radius": 29, "color": "#e74c3c" },
                { "x": -150, "y": 50, "radius": 32, "color": "#3498db" },
                { "x": 550, "y": 150, "radius": 26, "color": "#2ecc71" }
            ]
        };
    }

    loadLevelFromFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const levelData = JSON.parse(e.target.result);
                this.levelData = levelData;
                this.resetWorld();
                console.log('Level loaded successfully!');
            } catch (error) {
                console.error('Error parsing level file:', error);
                alert('Invalid level file format. Please check the JSON structure.');
            }
        };
        reader.readAsText(file);
    }

    loadGameConfigFromFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const gameConfig = JSON.parse(e.target.result);
                this.gameConfig = gameConfig;
                
                // Update aspect ratio if specified in the config
                if (gameConfig.aspectRatio) {
                    try {
                        this.aspectRatio = this.parseAspectRatio(gameConfig.aspectRatio);
                        
                        // Recalculate and update canvas dimensions
                        const dimensions = this.calculateCanvasDimensions();
                        this.render.canvas.width = dimensions.width;
                        this.render.canvas.height = dimensions.height;
                        this.camera.width = dimensions.width;
                        this.camera.height = dimensions.height;
                        this.render.options.width = dimensions.width;
                        this.render.options.height = dimensions.height;
                    } catch (aspectError) {
                        console.error('Aspect ratio error:', aspectError.message);
                        alert(aspectError.message + '\n\nKeeping current aspect ratio.');
                    }
                }
                
                console.log('Game config loaded successfully!');
            } catch (error) {
                console.error('Error parsing game config file:', error);
                alert('Invalid game config file format. Please check the JSON structure.');
            }
        };
        reader.readAsText(file);
    }

    loadPlayerConfigFromFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const playerConfig = JSON.parse(e.target.result);
                this.playerConfig = playerConfig;
                this.resetWorld();
                console.log('Player config loaded successfully!');
            } catch (error) {
                console.error('Error parsing player config file:', error);
                alert('Invalid player config file format. Please check the JSON structure.');
            }
        };
        reader.readAsText(file);
    }

    createWorld() {
        if (!this.levelData) {
            console.warn('Level data not loaded yet');
            return;
        }

        const { Bodies, World } = Matter;
        const level = this.levelData;

        const bodies = [];

        // Create boundaries if enabled
        if (level.boundaries && level.boundaries.enabled) {
            const worldSize = level.worldSize || 3000;
            const wallThickness = level.wallThickness || 50;

            // Ground
            bodies.push(Bodies.rectangle(0, worldSize / 2, worldSize, wallThickness, {
                isStatic: true,
                render: { fillStyle: '#34495e' },
                label: 'ground'
            }));

            // Ceiling
            bodies.push(Bodies.rectangle(0, -worldSize / 2, worldSize, wallThickness, {
                isStatic: true,
                render: { fillStyle: '#34495e' },
                label: 'ceiling'
            }));

            // Left wall
            bodies.push(Bodies.rectangle(-worldSize / 2, 0, wallThickness, worldSize, {
                isStatic: true,
                render: { fillStyle: '#34495e' },
                label: 'leftWall'
            }));

            // Right wall
            bodies.push(Bodies.rectangle(worldSize / 2, 0, wallThickness, worldSize, {
                isStatic: true,
                render: { fillStyle: '#34495e' },
                label: 'rightWall'
            }));
        }

        // Create platforms
        if (level.platforms) {
            level.platforms.forEach((platform, index) => {
                bodies.push(Bodies.rectangle(
                    platform.x,
                    platform.y,
                    platform.width,
                    platform.height,
                    {
                        isStatic: platform.isStatic !== false,
                        render: { fillStyle: platform.color || '#e74c3c' },
                        label: `platform_${index}`
                    }
                ));
            });
        }

        // Create boxes
        if (level.boxes) {
            level.boxes.forEach((box, index) => {
                bodies.push(Bodies.rectangle(
                    box.x,
                    box.y,
                    box.size,
                    box.size,
                    {
                        render: { fillStyle: box.color || '#3498db' },
                        label: `box_${index}`
                    }
                ));
            });
        }

        // Create circles
        if (level.circles) {
            level.circles.forEach((circle, index) => {
                bodies.push(Bodies.circle(
                    circle.x,
                    circle.y,
                    circle.radius,
                    {
                        render: { fillStyle: circle.color || '#2ecc71' },
                        label: `circle_${index}`
                    }
                ));
            });
        }

        // Add all bodies to the world
        World.add(this.world, bodies);
    }

    createPlayer() {
        // Start with base player config
        let playerConfig = { ...this.playerConfig };
        
        // Apply level-specific overrides if they exist
        if (this.levelData.overrides && this.levelData.overrides.player) {
            playerConfig = { ...playerConfig, ...this.levelData.overrides.player };
        }
        
        this.player = new Player(playerConfig, this.world);
    }

    setupEvents() {
        // Handle window resize
        window.addEventListener('resize', () => {
            const dimensions = this.calculateCanvasDimensions();
            this.render.canvas.width = dimensions.width;
            this.render.canvas.height = dimensions.height;
            this.camera.width = dimensions.width;
            this.camera.height = dimensions.height;
            
            // Update render options
            this.render.options.width = dimensions.width;
            this.render.options.height = dimensions.height;
        });

        // Handle R to reset, L to load level, G to load game config, P to load player config
        window.addEventListener('keydown', (e) => {
            if (e.key === 'r' || e.key === 'R') {
                this.resetWorld();
            } else if (e.key === 'l' || e.key === 'L') {
                document.getElementById('levelFileInput').click();
            } else if (e.key === 'g' || e.key === 'G') {
                document.getElementById('gameConfigFileInput').click();
            } else if (e.key === 'p' || e.key === 'P') {
                document.getElementById('playerConfigFileInput').click();
            }
        });

        // Handle file input for loading custom levels
        const levelFileInput = document.getElementById('levelFileInput');
        levelFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadLevelFromFile(file);
            }
            // Reset the input so the same file can be loaded again
            e.target.value = '';
        });

        // Handle file input for loading game config
        const gameConfigFileInput = document.getElementById('gameConfigFileInput');
        gameConfigFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadGameConfigFromFile(file);
            }
            // Reset the input so the same file can be loaded again
            e.target.value = '';
        });

        // Handle file input for loading player config
        const playerConfigFileInput = document.getElementById('playerConfigFileInput');
        playerConfigFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadPlayerConfigFromFile(file);
            }
            // Reset the input so the same file can be loaded again
            e.target.value = '';
        });
    }

    resetWorld() {
        const { World } = Matter;
        World.clear(this.world);
        this.engine.world = this.world;
        this.createWorld();
        this.createPlayer();
        this.camera.setTarget(this.player.body);
        this.camera.x = 0;
        this.camera.y = 0;
    }

    updateCamera() {
        // Update player based on input
        if (this.player) {
            this.player.update(this.input);
        }

        // Update camera to follow player
        this.camera.update();

        // Update the render bounds to follow the camera
        // Matter.js Render.lookAt expects bounds in this format
        const { Render } = Matter;
        Render.lookAt(this.render, {
            min: { 
                x: this.camera.x - this.camera.width / 2, 
                y: this.camera.y - this.camera.height / 2 
            },
            max: { 
                x: this.camera.x + this.camera.width / 2, 
                y: this.camera.y + this.camera.height / 2 
            }
        });

        // Update UI
        if (this.player) {
            const playerPos = this.player.getPosition();
            document.getElementById('camera-pos').textContent = 
                `Camera: (${Math.round(this.camera.x)}, ${Math.round(this.camera.y)}) | Player: (${Math.round(playerPos.x)}, ${Math.round(playerPos.y)})`;
        }
    }

    gameLoop() {
        this.updateCamera();
        requestAnimationFrame(() => this.gameLoop());
    }
}