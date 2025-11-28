export class Camera {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = 5;
    }

    moveLeft() {
        this.x -= this.speed;
    }

    moveRight() {
        this.x += this.speed;
    }

    moveUp() {
        this.y -= this.speed;
    }

    moveDown() {
        this.y += this.speed;
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