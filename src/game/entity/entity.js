import Matter from 'matter-js';

export class Entity {
    constructor(config, world) {
        const { Bodies, World } = Matter;
        
        // Default configuration
        this.config = {
            x: config.x || 0,
            y: config.y || 0,
            width: config.width || 40,
            height: config.height || 40,
            shape: config.shape || 'rectangle', // 'rectangle' or 'circle'
            radius: config.radius || 20, // For circle shapes
            color: config.color || '#ffffff',
            strokeColor: config.strokeColor || null,
            strokeWidth: config.strokeWidth || 0,
            friction: config.friction || 0.3,
            frictionAir: config.frictionAir || 0.01,
            density: config.density || 0.001,
            isStatic: config.isStatic || false,
            label: config.label || 'entity'
        };

        // Create the physical body based on shape
        if (this.config.shape === 'circle') {
            this.body = Bodies.circle(
                this.config.x,
                this.config.y,
                this.config.radius,
                {
                    render: { 
                        fillStyle: this.config.color,
                        strokeStyle: this.config.strokeColor,
                        lineWidth: this.config.strokeWidth
                    },
                    friction: this.config.friction,
                    frictionAir: this.config.frictionAir,
                    density: this.config.density,
                    isStatic: this.config.isStatic,
                    label: this.config.label
                }
            );
        } else {
            // Default to rectangle
            this.body = Bodies.rectangle(
                this.config.x,
                this.config.y,
                this.config.width,
                this.config.height,
                {
                    render: { 
                        fillStyle: this.config.color,
                        strokeStyle: this.config.strokeColor,
                        lineWidth: this.config.strokeWidth
                    },
                    friction: this.config.friction,
                    frictionAir: this.config.frictionAir,
                    density: this.config.density,
                    isStatic: this.config.isStatic,
                    label: this.config.label
                }
            );
        }

        // Add to world
        World.add(world, this.body);
    }

    getPosition() {
        return this.body.position;
    }

    // Empty update method to be overridden by subclasses
    update(input) {
        // Override in subclasses
    }
}