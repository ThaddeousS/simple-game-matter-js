import { Tool } from './tool.js';

export class TransformTool extends Tool {
    constructor(editor, entity, label) {
        super(editor, label);
        this.entity = entity;
        this.isDragging = false;
    }

    // Helper to render handles with common styling
    renderHandle(ctx, screenX, screenY, scale, color, size = 12) {
        ctx.fillStyle = color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX, screenY, size * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    // Helper to render arrow
    renderArrow(ctx, startX, startY, endX, endY, scale, color, arrowSize = 15) {
        const angle = Math.atan2(endY - startY, endX - startX);
        
        // Draw line
        ctx.strokeStyle = color;
        ctx.lineWidth = 3 * scale;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // Draw arrow head
        ctx.fillStyle = color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowSize * scale * Math.cos(angle - Math.PI / 6),
            endY - arrowSize * scale * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            endX - arrowSize * scale * Math.cos(angle + Math.PI / 6),
            endY - arrowSize * scale * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    // Helper to convert entity position to screen position
    getScreenPosition(camera) {
        if (!this.entity) return { x: 0, y: 0, scale: 1 };
        
        const pos = this.entity.body.position;
        const viewWidth = camera.width / camera.zoom;
        const scale = camera.width / viewWidth;
        
        const screenX = ((pos.x - camera.x) * scale) + camera.width / 2;
        const screenY = ((pos.y - camera.y) * scale) + camera.height / 2;
        
        return { x: screenX, y: screenY, scale };
    }
}