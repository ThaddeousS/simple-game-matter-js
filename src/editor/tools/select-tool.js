import { Tool } from './tool.js';
import Matter from 'matter-js';

export class SelectTool extends Tool {
    constructor(editor) {
        super(editor, 'Select');
        this.selectedEntity = null;
        this.isDraggingEntity = false;
        this.dragOffset = { x: 0, y: 0 };
    }

    onActivate() {
        this.editor.game.render.canvas.style.cursor = 'default';
    }

    onDeactivate() {
        this.selectedEntity = null;
        this.isDraggingEntity = false;
    }

    onMouseDown(e, worldPos) {
        // Find entity at mouse position
        const entities = [...this.editor.game.entities, this.editor.game.player];
        
        for (let entity of entities) {
            if (this.isPointInEntity(worldPos, entity)) {
                this.selectedEntity = entity;
                this.isDraggingEntity = true;
                this.dragOffset.x = entity.body.position.x - worldPos.x;
                this.dragOffset.y = entity.body.position.y - worldPos.y;
                return;
            }
        }
        
        this.selectedEntity = null;
    }

    onMouseMove(e, worldPos) {
        if (this.isDraggingEntity && this.selectedEntity) {
            const { Body } = Matter;
            Body.setPosition(this.selectedEntity.body, {
                x: worldPos.x + this.dragOffset.x,
                y: worldPos.y + this.dragOffset.y
            });
        }
    }

    onMouseUp(e, worldPos) {
        this.isDraggingEntity = false;
    }

    isPointInEntity(point, entity) {
        const body = entity.body;
        const dx = point.x - body.position.x;
        const dy = point.y - body.position.y;
        
        if (entity.config.shape === 'circle') {
            const distSq = dx * dx + dy * dy;
            return distSq <= entity.config.radius * entity.config.radius;
        } else {
            // Rectangle (simplified, doesn't account for rotation)
            const halfWidth = entity.config.width / 2;
            const halfHeight = entity.config.height / 2;
            return Math.abs(dx) <= halfWidth && Math.abs(dy) <= halfHeight;
        }
    }
}