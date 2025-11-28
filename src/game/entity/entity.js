import Matter from 'matter-js';

export class Entity {
    constructor(config, world) {
        const { Bodies, World } = Matter;
        
        // Store reference to world for cleanup
        this.world = world;
        
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
            isStatic: config.isStatic || config.static || false, // Support both isStatic and static
            label: config.label || 'entity',
            health: config.health !== undefined ? config.health : 100,
            maxHealth: config.maxHealth || 100,
            healthDisplay: config.healthDisplay || 'none', // 'bar', 'text', or 'none'
            collisions: config.collisions !== undefined ? config.collisions : 'on' // 'on' or 'off'
        };

        // Health properties
        this.health = this.config.health;
        this.maxHealth = this.config.maxHealth;
        this.healthDisplay = this.config.healthDisplay;
        this.isDestroyed = false;

        // Determine if this is a sensor (no collisions)
        const isSensor = this.config.collisions === 'off';

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
                    isSensor: isSensor,
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
                    isSensor: isSensor,
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

    takeDamage(amount) {
        if (this.isDestroyed) return;
        
        this.health -= amount;
        if (this.health < 0) {
            this.health = 0;
        }
    }

    heal(amount) {
        if (this.isDestroyed) return;
        
        this.health += amount;
        if (this.health > this.maxHealth) {
            this.health = this.maxHealth;
        }
    }

    destroy() {
        if (this.isDestroyed) return;
        
        const { World } = Matter;
        World.remove(this.world, this.body);
        this.isDestroyed = true;
    }

    renderHealth(ctx, camera) {
        if (this.isDestroyed || this.healthDisplay === 'none') return;

        const pos = this.body.position;
        
        // Calculate screen position relative to camera
        const screenX = pos.x - camera.x + camera.width / 2;
        const screenY = pos.y - camera.y + camera.height / 2;

        // Position health display above the entity
        const offsetY = this.config.shape === 'circle' ? this.config.radius + 20 : this.config.height / 2 + 20;

        if (this.healthDisplay === 'bar') {
            this.renderHealthBar(ctx, screenX, screenY - offsetY);
        } else if (this.healthDisplay === 'text') {
            this.renderHealthText(ctx, screenX, screenY - offsetY);
        }
    }

    renderHealthBar(ctx, x, y) {
        const barWidth = 50;
        const barHeight = 6;
        const healthPercent = this.health / this.maxHealth;

        // Background (red)
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x - barWidth / 2, y, barWidth, barHeight);

        // Health (green)
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(x - barWidth / 2, y, barWidth * healthPercent, barHeight);

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - barWidth / 2, y, barWidth, barHeight);
    }

    renderHealthText(ctx, x, y) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.round(this.health)}/${this.maxHealth}`, x, y);
    }

    renderDebugLabel(ctx, camera) {
        if (this.isDestroyed) return;

        const pos = this.body.position;
        
        // Calculate screen position relative to camera
        const screenX = pos.x - camera.x + camera.width / 2;
        const screenY = pos.y - camera.y + camera.height / 2;

        // Draw label centered on entity
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.config.label, screenX, screenY);

        // Draw collision indicator
        if (this.config.collisions === 'off') {
            ctx.fillStyle = '#ff00ff';
            ctx.font = '8px Arial';
            ctx.fillText('[NO COLLISION]', screenX, screenY + 12);
        }
    }

    // Empty update method to be overridden by subclasses
    update(input) {
        // Override in subclasses
    }
}