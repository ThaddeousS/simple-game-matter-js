import { Tool } from './tool.js';
import Matter from 'matter-js';
import { MoveTool } from './move-tool.js';
import { RotateTool } from './rotate-tool.js';
import { ScaleTool } from './scale-tool.js';

export class SelectTool extends Tool {
    constructor(editor) {
        super(editor, 'Select');
        this.selectedEntity = null;
        this.highlightColor = '#ffff00';
        this.highlightWidth = 3;
        this.transformMode = 'move';
        this.contextMenu = null;
        this.currentSubTool = null;
        this.createContextMenu();
    }

    createContextMenu() {
        this.contextMenu = document.createElement('div');
        this.contextMenu.id = 'select-context-menu';
        this.contextMenu.style.cssText = `
            display: none;
            position: absolute;
            background: rgba(30, 30, 30, 0.98);
            border: 2px solid #ffff00;
            border-radius: 5px;
            padding: 5px;
            z-index: 1000;
            min-width: 150px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        `;
        document.body.appendChild(this.contextMenu);
        
        document.addEventListener('mousedown', (e) => {
            const canvas = this.editor.game.render.canvas;
            const clickedCanvas = e.target === canvas;
            const clickedMenu = this.contextMenu.contains(e.target);
            
            if (!clickedCanvas && !clickedMenu && this.contextMenu.style.display === 'block') {
                this.hideContextMenu();
            }
        });
    }

    showContextMenu(x, y) {
        this.contextMenu.innerHTML = '';
        
        const header = document.createElement('div');
        header.style.cssText = `
            color: white;
            font-weight: bold;
            font-size: 12px;
            padding: 5px 10px;
            border-bottom: 1px solid #ffff00;
            margin-bottom: 5px;
        `;
        header.textContent = 'Transform Mode';
        this.contextMenu.appendChild(header);
        
        const modes = [
            { name: 'Move', mode: 'move', icon: '↔' },
            { name: 'Rotate', mode: 'rotate', icon: '↻' },
            { name: 'Scale', mode: 'scale', icon: '⇔' }
        ];
        
        modes.forEach(modeData => {
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
                background: ${this.transformMode === modeData.mode ? '#ffff0033' : 'transparent'};
            `;
            
            const icon = document.createElement('span');
            icon.style.cssText = `
                font-size: 16px;
                width: 20px;
                text-align: center;
            `;
            icon.textContent = modeData.icon;
            
            item.appendChild(icon);
            item.appendChild(document.createTextNode(modeData.name));
            
            item.addEventListener('mouseenter', () => {
                if (this.transformMode !== modeData.mode) {
                    item.style.background = '#ffff0022';
                }
            });
            
            item.addEventListener('mouseleave', () => {
                if (this.transformMode !== modeData.mode) {
                    item.style.background = 'transparent';
                }
            });
            
            item.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.setTransformMode(modeData.mode);
                this.hideContextMenu();
            });
            
            this.contextMenu.appendChild(item);
        });
        
        this.contextMenu.style.left = `${x}px`;
        this.contextMenu.style.top = `${y}px`;
        this.contextMenu.style.display = 'block';
        
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
    }

    setTransformMode(mode) {
        this.transformMode = mode;
        
        // Create appropriate sub-tool
        if (this.selectedEntity) {
            switch(mode) {
                case 'move':
                    this.currentSubTool = new MoveTool(this.editor, this.selectedEntity);
                    break;
                case 'rotate':
                    this.currentSubTool = new RotateTool(this.editor, this.selectedEntity);
                    break;
                case 'scale':
                    this.currentSubTool = new ScaleTool(this.editor, this.selectedEntity);
                    break;
            }
        }
    }

    onActivate() {
        this.editor.game.render.canvas.style.cursor = 'default';
        this.transformMode = 'move';
    }

    onDeactivate() {
        this.selectedEntity = null;
        this.currentSubTool = null;
        this.hideContextMenu();
    }

    onMouseDown(e, worldPos) {
        // Right-click on selected entity shows context menu
        if (e.button === 2 && this.selectedEntity && this.isPointInEntity(worldPos, this.selectedEntity)) {
            e.preventDefault();
            this.showContextMenu(e.clientX, e.clientY);
            return;
        }
        
        // Left-click
        if (e.button !== 0) return;
        
        // Check if clicking on sub-tool widget
        let clickedWidget = false;
        if (this.currentSubTool) {
            // Try to interact with the widget
            if (this.currentSubTool.getWidgetInteraction) {
                const interaction = this.currentSubTool.getWidgetInteraction(worldPos);
                if (interaction) {
                    clickedWidget = true;
                    this.currentSubTool.onMouseDown(e, worldPos);
                    return;
                }
            } else if (this.currentSubTool.getScaleHandle) {
                const handle = this.currentSubTool.getScaleHandle(worldPos);
                if (handle) {
                    clickedWidget = true;
                    this.currentSubTool.onMouseDown(e, worldPos);
                    return;
                }
            } else {
                // For rotate tool, check if clicking near the circle
                const pos = this.selectedEntity.body.position;
                const dx = worldPos.x - pos.x;
                const dy = worldPos.y - pos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 50 && dist < 90) {
                    clickedWidget = true;
                    this.currentSubTool.onMouseDown(e, worldPos);
                    return;
                }
            }
        }
        
        // Check for entity selection
        const entities = [...this.editor.game.entities, this.editor.game.player];
        
        let foundEntity = false;
        for (let entity of entities) {
            if (this.isPointInEntity(worldPos, entity)) {
                // Select entity (even if different from current)
                this.selectedEntity = entity;
                this.setTransformMode(this.transformMode);
                foundEntity = true;
                
                // Update properties panel
                this.editor.updatePropertiesPanel();
                
                // Let sub-tool handle the initial click
                if (this.currentSubTool) {
                    this.currentSubTool.onMouseDown(e, worldPos);
                }
                return;
            }
        }
        
        // If no entity or widget was clicked, deselect
        if (!foundEntity && !clickedWidget) {
            this.selectedEntity = null;
            this.currentSubTool = null;
            this.editor.updatePropertiesPanel();
        }
    }

    onMouseMove(e, worldPos) {
        if (this.currentSubTool) {
            this.currentSubTool.onMouseMove(e, worldPos);
        }
    }

    onMouseUp(e, worldPos) {
        if (this.currentSubTool) {
            this.currentSubTool.onMouseUp(e, worldPos);
        }
    }

    onKeyDown(e) {
        if (!this.selectedEntity) return;
        
        const { Body } = Matter;
        const moveAmount = 5;
        const currentPos = this.selectedEntity.body.position;
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                Body.setPosition(this.selectedEntity.body, {
                    x: currentPos.x - moveAmount,
                    y: currentPos.y
                });
                break;
            case 'ArrowRight':
                e.preventDefault();
                Body.setPosition(this.selectedEntity.body, {
                    x: currentPos.x + moveAmount,
                    y: currentPos.y
                });
                break;
            case 'ArrowUp':
                e.preventDefault();
                Body.setPosition(this.selectedEntity.body, {
                    x: currentPos.x,
                    y: currentPos.y - moveAmount
                });
                break;
            case 'ArrowDown':
                e.preventDefault();
                Body.setPosition(this.selectedEntity.body, {
                    x: currentPos.x,
                    y: currentPos.y + moveAmount
                });
                break;
        }
    }

    renderHighlight(ctx, camera) {
        if (!this.selectedEntity) return;
        
        const pos = this.selectedEntity.body.position;
        const viewWidth = camera.width / camera.zoom;
        const scale = camera.width / viewWidth;
        
        const screenX = ((pos.x - camera.x) * scale) + camera.width / 2;
        const screenY = ((pos.y - camera.y) * scale) + camera.height / 2;
        
        ctx.strokeStyle = this.highlightColor;
        ctx.lineWidth = this.highlightWidth;
        
        if (this.selectedEntity.config.shape === 'circle') {
            const radius = this.selectedEntity.config.radius * scale;
            ctx.beginPath();
            ctx.arc(screenX, screenY, radius + 5 * scale, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // For rectangles, we need to get the actual bounds from Matter.js body
            const width = this.selectedEntity.config.width * scale;
            const height = this.selectedEntity.config.height * scale;
            const offset = 5 * scale;
            
            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.rotate(this.selectedEntity.body.angle);
            ctx.strokeRect(
                -width / 2 - offset,
                -height / 2 - offset,
                width + offset * 2,
                height + offset * 2
            );
            ctx.restore();
        }
        
        // Render sub-tool widget
        if (this.currentSubTool && this.currentSubTool.renderWidget) {
            this.currentSubTool.renderWidget(ctx, camera);
        }
        
        // Draw mode indicator
        ctx.fillStyle = this.highlightColor;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        const offset = this.selectedEntity.config.shape === 'circle' 
            ? this.selectedEntity.config.radius 
            : Math.max(this.selectedEntity.config.height / 2, this.selectedEntity.config.width / 2);
        ctx.fillText(this.transformMode.toUpperCase(), screenX, screenY - offset * scale - 20);
    }

    isPointInEntity(point, entity) {
        const body = entity.body;
        const dx = point.x - body.position.x;
        const dy = point.y - body.position.y;
        
        if (entity.config.shape === 'circle') {
            const distSq = dx * dx + dy * dy;
            return distSq <= entity.config.radius * entity.config.radius;
        } else {
            const cos = Math.cos(-body.angle);
            const sin = Math.sin(-body.angle);
            const rotatedX = dx * cos - dy * sin;
            const rotatedY = dx * sin + dy * cos;
            
            const halfWidth = entity.config.width / 2;
            const halfHeight = entity.config.height / 2;
            return Math.abs(rotatedX) <= halfWidth && Math.abs(rotatedY) <= halfHeight;
        }
    }
}