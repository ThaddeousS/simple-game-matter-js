import { TransformTool } from './transform-tool.js';
import Matter from 'matter-js';

export class RotateTool extends TransformTool {
    constructor(editor, entity) {
        super(editor, entity, 'Rotate');
        this.rotationStart = 0;
        this.widgetRadius = 70;
    }

    onMouseDown(e, worldPos) {
        if (!this.entity) return;
        
        const pos = this.entity.body.position;
        const dx = worldPos.x - pos.x;
        const dy = worldPos.y - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 50 && dist < 90) {
            this.isDragging = true;
            const angle = Math.atan2(dy, dx);
            this.rotationStart = angle - this.entity.body.angle;
        }
    }

    onMouseMove(e, worldPos) {
        if (!this.isDragging || !this.entity) return;
        
        const { Body } = Matter;
        const angle = Math.atan2(
            worldPos.y - this.entity.body.position.y,
            worldPos.x - this.entity.body.position.x
        );
        Body.setAngle(this.entity.body, angle - this.rotationStart);
    }

    onMouseUp(e, worldPos) {
        this.isDragging = false;
    }

    renderWidget(ctx, camera) {
        if (!this.entity) return;
        
        const { x: screenX, y: screenY, scale } = this.getScreenPosition(camera);
        const radius = this.widgetRadius * scale;
        
        // Draw rotation circle
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 4 * scale;
        ctx.setLineDash([10 * scale, 5 * scale]);
        ctx.beginPath();
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw rotation handle at current angle
        const handleAngle = this.entity.body.angle;
        const handleX = screenX + Math.cos(handleAngle) * radius;
        const handleY = screenY + Math.sin(handleAngle) * radius;
        
        this.renderHandle(ctx, handleX, handleY, scale, '#00ffff', 10);
        
        // Draw line from center to handle
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.moveTo(screenX, screenY);
        ctx.lineTo(handleX, handleY);
        ctx.stroke();
        
        // Draw angle arc
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.arc(screenX, screenY, radius * 0.5, 0, handleAngle);
        ctx.stroke();
        
        // Draw angle text
        const degrees = Math.round((handleAngle * 180 / Math.PI) % 360);
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${14 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(`${degrees}°`, screenX, screenY - radius - 15 * scale);
    }
}