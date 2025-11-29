import { Tool } from './tool.js';

export class DeleteTool extends Tool {
    constructor(editor) {
        super(editor, 'Delete');
    }

    onActivate() {
        this.editor.game.render.canvas.style.cursor = 'not-allowed';
    }

    onDeactivate() {
        this.editor.game.render.canvas.style.cursor = 'grab';
    }

    onMouseDown(e, worldPos) {
        // Find and delete entity at mouse position
        const entities = this.editor.game.entities;
        
        for (let i = entities.length - 1; i >= 0; i--) {
            const entity = entities[i];
            if (this.isPointInEntity(worldPos, entity)) {
                entity.destroy();
                this.editor.game.entities.splice(i, 1);
                return;
            }
        }
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