import Matter from 'matter-js';

export class Player {
    constructor(config, world) {
        const { Bodies, World } = Matter;
        
        // Store configuration
        this.config = {
            x: config.x || 0,
            y: config.y || 0,
            width: config.width || 40,
            height: config.height || 60,
            color: config.color || '#ffcc00',
            strokeColor: config.strokeColor || '#ff9900',
            strokeWidth: config.strokeWidth || 3,
            moveForce: config.moveForce || 0.001,
            jumpForce: config.jumpForce || 0.015,
            maxSpeed: config.maxSpeed || 8,
            friction: config.friction || 0.3,
            frictionAir: config.frictionAir || 0.01,
            density: config.density || 0.002
        };

        // Create the physical body
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
                label: 'player'
            }
        );

        // Add to world
        World.add(world, this.body);
    }

    update(input) {
        const { Body } = Matter;

        // Horizontal movement
        if (input.isActionPressed('moveLeft')) {
            if (this.body.velocity.x > -this.config.maxSpeed) {
                Body.applyForce(this.body, this.body.position, { 
                    x: -this.config.moveForce, 
                    y: 0 
                });
            }
        }
        if (input.isActionPressed('moveRight')) {
            if (this.body.velocity.x < this.config.maxSpeed) {
                Body.applyForce(this.body, this.body.position, { 
                    x: this.config.moveForce, 
                    y: 0 
                });
            }
        }

        // Jump (only if player is roughly on the ground - check vertical velocity)
        if (input.isActionPressed('jump') && Math.abs(this.body.velocity.y) < 1) {
            Body.applyForce(this.body, this.body.position, { 
                x: 0, 
                y: -this.config.jumpForce 
            });
        }
    }

    getPosition() {
        return this.body.position;
    }
}