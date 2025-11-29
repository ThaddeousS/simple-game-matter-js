import { Tool } from './tool.js';
import { Entity } from '../../game/entity/entity.js'

export class EntityTool extends Tool {
    constructor(editor) {
        super(editor, 'Add Entity');
    }

    onActivate() {
        this.editor.game.render.canvas.style.cursor = 'crosshair';
    }

    onDeactivate() {
        this.editor.game.render.canvas.style.cursor = 'grab';
    }

    onMouseDown(e, worldPos) {
        // Create a new entity at mouse position
        const entityConfig = {
            x: worldPos.x,
            y: worldPos.y,
            width: 50,
            height: 50,
            color: '#3498db',
            label: `entity_${Date.now()}`
        };
        
        const newEntity = new Entity(entityConfig, this.editor.game.world);
        this.editor.game.entities.push(newEntity);
    }
}