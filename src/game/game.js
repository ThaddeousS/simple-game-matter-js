import Matter from 'matter-js';
import { Camera } from '../camera/camera.js';
import { InputHandler } from '../input/input-handler.js';

export class Game {
    constructor() {
        // Module aliases
        const { Engine, Render, Runner } = Matter;

        // Create engine
        this.engine = Engine.create();
        this.world = this.engine.world;

        // Create renderer
        this.render = Render.create({
            element: document.body,
            engine: this.engine,
            options: {
                width: window.innerWidth,
                height: window.innerHeight,
                wireframes: false,
                background: '#2c3e50'
            }
        });

        // Initialize camera
        this.camera = new Camera(0, 0, window.innerWidth, window.innerHeight);

        // Initialize input
        this.input = new InputHandler();

        // Load default level data
        this.levelData = this.getDefaultLevel();
        this.createWorld();

        // Setup event listeners
        this.setupEvents();

        // Create and start the runner
        this.runner = Runner.create();
        Runner.run(this.runner, this.engine);
        Render.run(this.render);

        // Game loop
        this.gameLoop();
    }

    getDefaultLevel() {
        return {
            "worldSize": 3000,
            "wallThickness": 50,
            "boundaries": {
                "enabled": true
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

    setupEvents() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.render.canvas.width = window.innerWidth;
            this.render.canvas.height = window.innerHeight;
            this.camera.width = window.innerWidth;
            this.camera.height = window.innerHeight;
        });

        // Handle spacebar to add objects and R to reset
        window.addEventListener('keydown', (e) => {
            if (e.key === ' ') {
                e.preventDefault();
                this.addBoxAtCenter();
            } else if (e.key === 'r' || e.key === 'R') {
                this.resetWorld();
            } else if (e.key === 'l' || e.key === 'L') {
                document.getElementById('levelFileInput').click();
            }
        });

        // Handle file input for loading custom levels
        const fileInput = document.getElementById('levelFileInput');
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadLevelFromFile(file);
            }
            // Reset the input so the same file can be loaded again
            e.target.value = '';
        });
    }

    addBoxAtCenter() {
        const { Bodies, World } = Matter;
        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
        
        const box = Bodies.rectangle(
            this.camera.x,
            this.camera.y,
            50,
            50,
            {
                render: { fillStyle: colors[Math.floor(Math.random() * colors.length)] }
            }
        );
        
        World.add(this.world, box);
    }

    resetWorld() {
        const { World } = Matter;
        World.clear(this.world);
        this.engine.world = this.world;
        this.createWorld();
        this.camera.x = 0;
        this.camera.y = 0;
    }

    updateCamera() {
        // Handle camera movement with arrow keys
        if (this.input.isPressed('ArrowLeft') || this.input.isPressed('a') || this.input.isPressed('A')) {
            this.camera.moveLeft();
        }
        if (this.input.isPressed('ArrowRight') || this.input.isPressed('d') || this.input.isPressed('D')) {
            this.camera.moveRight();
        }
        if (this.input.isPressed('ArrowUp') || this.input.isPressed('w') || this.input.isPressed('W')) {
            this.camera.moveUp();
        }
        if (this.input.isPressed('ArrowDown') || this.input.isPressed('s') || this.input.isPressed('S')) {
            this.camera.moveDown();
        }

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
        document.getElementById('camera-pos').textContent = 
            `Camera: (${Math.round(this.camera.x)}, ${Math.round(this.camera.y)})`;
    }

    gameLoop() {
        this.updateCamera();
        requestAnimationFrame(() => this.gameLoop());
    }
}