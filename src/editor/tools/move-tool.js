import { TransformTool } from './transform-tool.js';
import Matter from 'matter-js';

export class MoveTool extends TransformTool {
    constructor(editor, entity) {
        super(editor, entity, 'Move');
        this.dragMode = 'free'; // 'free', 'x', 'y'
        this.dragOffset = { x: 0, y: 0 };
        this.widgetSize = 60;
        this.arrowSize = 15;
    }

    onMouseDown(e, worldPos) {
        if (!this.entity) return;
        
        const widgetInteraction = this.getWidgetInteraction(worldPos);
        
        if (widgetInteraction) {
            this.dragMode = widgetInteraction;
            this.isDragging = true;
            this.dragOffset.x = this.entity.body.position.x - worldPos.x;
            this.dragOffset.y = this.entity.body.position.y - worldPos.y;
        }
    }

    onMouseMove(e, worldPos) {
        if (!this.isDragging || !this.entity) return;
        
        const { Body } = Matter;
        const targetX = worldPos.x + this.dragOffset.x;
        const targetY = worldPos.y + this.dragOffset.y;
        
        switch(this.dragMode) {
            case 'free':
                Body.setPosition(this.entity.body, { x: targetX, y: targetY });
                break;
            case 'x':
                Body.setPosition(this.entity.body, { x: targetX, y: this.entity.body.position.y });
                break;
            case 'y':
                Body.setPosition(this.entity.body, { x: this.entity.body.position.x, y: targetY });
                break;
        }
    }

    onMouseUp(e, worldPos) {
        this.isDragging = false;
    }

    getWidgetInteraction(worldPos) {
        if (!this.entity) return null;
        
        const pos = this.entity.body.position;
        const dx = worldPos.x - pos.x;
        const dy = worldPos.y - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Check center circle (free move)
        if (dist < 15) return 'free';
        
        // Check arrows
        if (Math.abs(dy) < 10 && Math.abs(dx) > 15 && Math.abs(dx) < this.widgetSize) return 'x';
        if (Math.abs(dx) < 10 && Math.abs(dy) > 15 && Math.abs(dy) < this.widgetSize) return 'y';
        
        return null;
    }

    renderWidget(ctx, camera) {
        if (!this.entity) return;
        
        const { x: screenX, y: screenY, scale } = this.getScreenPosition(camera);
        const widgetScale = this.widgetSize * scale;
        const arrowScale = this.arrowSize * scale;
        
        // Draw center circle (free move)
        this.renderHandle(ctx, screenX, screenY, scale, '#ffff00', 15);
        
        // Draw X-axis arrows (red)
        this.renderArrow(ctx, screenX + 15 * scale, screenY, screenX + widgetScale, screenY, scale, '#ff0000', this.arrowSize);
        this.renderArrow(ctx, screenX - 15 * scale, screenY, screenX - widgetScale, screenY, scale, '#ff0000', this.arrowSize);
        
        // Draw Y-axis arrows (green)
        this.renderArrow(ctx, screenX, screenY + 15 * scale, screenX, screenY + widgetScale, scale, '#00ff00', this.arrowSize);
        this.renderArrow(ctx, screenX, screenY - 15 * scale, screenX, screenY - widgetScale, scale, '#00ff00', this.arrowSize);
    }
}