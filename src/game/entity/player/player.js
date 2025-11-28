import Matter from 'matter-js';
import { Entity } from '../entity.js';

export class Player extends Entity {
    constructor(config, world) {
        // Add player-specific defaults to config
        const playerConfig = {
            ...config,
            label: 'player',
            moveForce: config.moveForce || 0.001,
            jumpForce: config.jumpForce || 0.015,
            maxSpeed: config.maxSpeed || 8
        };

        // Call parent constructor
        super(playerConfig, world);

        // Store player-specific properties
        this.moveForce = playerConfig.moveForce;
        this.jumpForce = playerConfig.jumpForce;
        this.maxSpeed = playerConfig.maxSpeed;
    }

    update(input) {
        // Check if player is destroyed or has no health
        if (this.isDestroyed) return;
        
        if (this.health <= 0) {
            this.destroy();
            return;
        }

        const { Body } = Matter;

        // Horizontal movement
        if (input.isActionPressed('moveLeft')) {
            if (this.body.velocity.x > -this.maxSpeed) {
                Body.applyForce(this.body, this.body.position, { 
                    x: -this.moveForce, 
                    y: 0 
                });
            }
        }
        if (input.isActionPressed('moveRight')) {
            if (this.body.velocity.x < this.maxSpeed) {
                Body.applyForce(this.body, this.body.position, { 
                    x: this.moveForce, 
                    y: 0 
                });
            }
        }

        // Jump (only if player is roughly on the ground - check vertical velocity)
        if (input.isActionPressed('jump') && Math.abs(this.body.velocity.y) < 1) {
            Body.applyForce(this.body, this.body.position, { 
                x: 0, 
                y: -this.jumpForce 
            });
        }
    }
}