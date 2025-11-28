export class Camera {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.target = null;
        this.smoothing = 0.1; // Smooth camera follow (0 = instant, 1 = no follow)
    }

    setTarget(target) {
        this.target = target;
    }

    update() {
        if (this.target) {
            // Smoothly move camera towards target
            const targetX = this.target.position.x;
            const targetY = this.target.position.y;
            
            this.x += (targetX - this.x) * this.smoothing;
            this.y += (targetY - this.y) * this.smoothing;
        }
    }

    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x + this.width / 2,
            y: worldY - this.y + this.height / 2
        };
    }

    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x - this.width / 2,
            y: screenY + this.y - this.height / 2
        };
    }
}