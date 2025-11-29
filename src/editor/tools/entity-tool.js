import { Tool } from './tool.js';
import { Entity } from '../../game/entity/entity.js'

export class EntityTool extends Tool {
    constructor(editor) {
        super(editor, 'Add Entity');
        this.pendingPosition = null;
        this.contextMenu = null;
        this.createContextMenu();
        
        // Define available entity types
        this.entityTypes = [
            { name: 'Box (Small)', width: 30, height: 30, color: '#3498db' },
            { name: 'Box (Medium)', width: 50, height: 50, color: '#3498db' },
            { name: 'Box (Large)', width: 80, height: 80, color: '#3498db' },
            { name: 'Platform (Short)', width: 100, height: 20, color: '#2ecc71' },
            { name: 'Platform (Medium)', width: 200, height: 20, color: '#2ecc71' },
            { name: 'Platform (Long)', width: 300, height: 20, color: '#2ecc71' },
            { name: 'Circle (Small)', shape: 'circle', radius: 20, color: '#e74c3c' },
            { name: 'Circle (Medium)', shape: 'circle', radius: 35, color: '#e74c3c' },
            { name: 'Circle (Large)', shape: 'circle', radius: 50, color: '#e74c3c' },
            { name: 'Wall (Vertical)', width: 20, height: 150, color: '#95a5a6' },
            { name: 'Ramp (Left)', width: 100, height: 60, color: '#f39c12' },
            { name: 'Ramp (Right)', width: 100, height: 60, color: '#f39c12' }
        ];
    }

    createContextMenu() {
        this.contextMenu = document.createElement('div');
        this.contextMenu.id = 'entity-context-menu';
        this.contextMenu.style.cssText = `
            display: none;
            position: absolute;
            background: rgba(30, 30, 30, 0.98);
            border: 2px solid #3498db;
            border-radius: 5px;
            padding: 5px;
            z-index: 1000;
            min-width: 180px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        `;
        document.body.appendChild(this.contextMenu);
        
        // Close menu when clicking elsewhere (but not on canvas during entity tool)
        document.addEventListener('mousedown', (e) => {
            const canvas = this.editor.game.render.canvas;
            const clickedCanvas = e.target === canvas;
            const clickedMenu = this.contextMenu.contains(e.target);
            
            // Only close if not clicking canvas (which will open new menu) and not clicking menu items
            if (!clickedCanvas && !clickedMenu && this.contextMenu.style.display === 'block') {
                this.hideContextMenu();
            }
        });
    }

    showContextMenu(x, y, worldPos) {
        this.pendingPosition = worldPos;
        
        // Clear existing menu items
        this.contextMenu.innerHTML = '';
        
        // Add header
        const header = document.createElement('div');
        header.style.cssText = `
            color: white;
            font-weight: bold;
            font-size: 12px;
            padding: 5px 10px;
            border-bottom: 1px solid #3498db;
            margin-bottom: 5px;
        `;
        header.textContent = 'Select Entity Type';
        this.contextMenu.appendChild(header);
        
        // Add menu items for each entity type
        this.entityTypes.forEach(type => {
            const item = document.createElement('div');
            item.style.cssText = `
                color: white;
                padding: 8px 10px;
                cursor: pointer;
                font-size: 13px;
                border-radius: 3px;
                user-select: none;
                display: flex;
                align-items: center;
                gap: 8px;
            `;
            
            // Add color indicator
            const colorBox = document.createElement('div');
            colorBox.style.cssText = `
                width: 12px;
                height: 12px;
                background: ${type.color};
                border-radius: ${type.shape === 'circle' ? '50%' : '2px'};
                border: 1px solid rgba(255, 255, 255, 0.3);
            `;
            
            item.appendChild(colorBox);
            item.appendChild(document.createTextNode(type.name));
            
            item.addEventListener('mouseenter', () => {
                item.style.background = '#3498db';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.background = 'transparent';
            });
            
            item.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.createEntity(type);
                this.hideContextMenu();
            });
            
            this.contextMenu.appendChild(item);
        });
        
        // Position the menu at click location
        this.contextMenu.style.left = `${x}px`;
        this.contextMenu.style.top = `${y}px`;
        this.contextMenu.style.display = 'block';
        
        // Adjust if menu goes off-screen
        requestAnimationFrame(() => {
            const rect = this.contextMenu.getBoundingClientRect();
            if (rect.right > window.innerWidth) {
                this.contextMenu.style.left = `${window.innerWidth - rect.width - 10}px`;
            }
            if (rect.bottom > window.innerHeight) {
                this.contextMenu.style.top = `${window.innerHeight - rect.height - 10}px`;
            }
        });
    }

    hideContextMenu() {
        this.contextMenu.style.display = 'none';
        this.pendingPosition = null;
    }

    createEntity(type) {
        if (!this.pendingPosition) return;
        
        const entityConfig = {
            x: this.pendingPosition.x,
            y: this.pendingPosition.y,
            label: `${type.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
            color: type.color
        };
        
        // Add shape-specific properties
        if (type.shape === 'circle') {
            entityConfig.shape = 'circle';
            entityConfig.radius = type.radius;
        } else {
            entityConfig.width = type.width;
            entityConfig.height = type.height;
        }
        
        const newEntity = new Entity(entityConfig, this.editor.game.world);
        this.editor.game.entities.push(newEntity);
    }

    onActivate() {
        this.editor.game.render.canvas.style.cursor = 'crosshair';
    }

    onDeactivate() {
        this.hideContextMenu();
        this.editor.game.render.canvas.style.cursor = 'grab';
    }

    onMouseDown(e, worldPos) {
        // If menu is already open, close it and open new one at new position
        if (this.contextMenu.style.display === 'block') {
            this.hideContextMenu();
        }
        
        // Show context menu at click location
        // Store the world position where the click occurred
        this.showContextMenu(e.clientX, e.clientY, worldPos);
    }
}