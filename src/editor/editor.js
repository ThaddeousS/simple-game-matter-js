import { SelectTool } from './tools/select-tool.js';
import { EntityTool } from './tools/entity-tool.js';
import { DeleteTool } from './tools/delete-tool.js';
import Matter from 'matter-js';

export class Editor {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.currentTool = 'select';
        
        // Mouse navigation
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.cameraStartX = 0;
        this.cameraStartY = 0;
        
        // Toolbar resizing
        this.leftToolbarWidth = 180;
        this.rightToolbarWidth = 220;
        this.minToolbarWidth = 150;
        this.maxToolbarWidth = 500;
        this.isResizingLeft = false;
        this.isResizingRight = false;
        this.resizeStartX = 0;
        this.resizeStartWidth = 0;
        
        // Initial game state for reset
        this.initialGameState = null;
        
        // Initialize tools
        this.tools = {
            select: new SelectTool(this),
            entity: new EntityTool(this),
            delete: new DeleteTool(this)
        };
        this.currentTool = this.tools.select;
        this.currentTool.activate();
        
        this.createEditorUI();
        this.setupMouseNavigation();
        this.setupResizeHandles();
        this.setupToolListeners();
    }

    createEditorUI() {
        // Create editor overlay container
        this.editorContainer = document.createElement('div');
        this.editorContainer.id = 'editor-container';
        this.editorContainer.style.cssText = `
            display: none;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 200;
            pointer-events: none;
        `;

        // Create top toolbar
        this.topToolbar = document.createElement('div');
        this.topToolbar.id = 'editor-top-toolbar';
        this.topToolbar.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 60px;
            background: rgba(30, 30, 30, 0.95);
            border-bottom: 2px solid #3498db;
            pointer-events: all;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 20px;
            gap: 15px;
        `;
        this.topToolbar.innerHTML = `
            <button class="editor-btn" id="editor-reset-btn" style="background: #f39c12;">Reset</button>
            <button class="editor-btn" id="editor-save-btn">Save</button>
            <button class="editor-btn" id="editor-load-btn">Load</button>
            <button class="editor-btn" id="editor-exit-btn" style="background: #e74c3c;">Exit</button>
        `;

        // Create left toolbar
        this.leftToolbar = document.createElement('div');
        this.leftToolbar.id = 'editor-left-toolbar';
        this.leftToolbar.style.cssText = `
            position: absolute;
            top: 60px;
            left: 0;
            width: ${this.leftToolbarWidth}px;
            height: calc(100% - 60px);
            background: rgba(30, 30, 30, 0.95);
            border-right: 2px solid #3498db;
            pointer-events: all;
            overflow-y: auto;
            padding: 15px;
            color: white;
        `;
        this.leftToolbar.innerHTML = `
            <h3 style="margin-top: 0; font-size: 16px;">Tools</h3>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <button class="editor-tool-btn" id="tool-select">Select</button>
                <button class="editor-tool-btn" id="tool-entity">Add Entity</button>
                <button class="editor-tool-btn" id="tool-delete">Delete</button>
            </div>
        `;

        // Create left resize handle
        this.leftResizeHandle = document.createElement('div');
        this.leftResizeHandle.id = 'editor-left-resize';
        this.leftResizeHandle.style.cssText = `
            position: absolute;
            top: 60px;
            left: ${this.leftToolbarWidth}px;
            width: 6px;
            height: calc(100% - 60px);
            cursor: ew-resize;
            pointer-events: all;
            z-index: 1;
        `;

        // Create right toolbar
        this.rightToolbar = document.createElement('div');
        this.rightToolbar.id = 'editor-right-toolbar';
        this.rightToolbar.style.cssText = `
            position: absolute;
            top: 60px;
            right: 0;
            width: ${this.rightToolbarWidth}px;
            height: calc(100% - 60px);
            background: rgba(30, 30, 30, 0.95);
            border-left: 2px solid #3498db;
            pointer-events: all;
            overflow-y: auto;
            padding: 15px;
            color: white;
        `;
        this.rightToolbar.innerHTML = `
            <h3 style="margin-top: 0; font-size: 16px;">Properties</h3>
            <div id="editor-properties">
                <p style="color: #aaa; font-size: 13px;">Select an object to edit properties</p>
            </div>
        `;

        // Create right resize handle
        this.rightResizeHandle = document.createElement('div');
        this.rightResizeHandle.id = 'editor-right-resize';
        this.rightResizeHandle.style.cssText = `
            position: absolute;
            top: 60px;
            right: ${this.rightToolbarWidth}px;
            width: 6px;
            height: calc(100% - 60px);
            cursor: ew-resize;
            pointer-events: all;
            z-index: 1;
        `;

        // Append toolbars and handles to container
        this.editorContainer.appendChild(this.topToolbar);
        this.editorContainer.appendChild(this.leftToolbar);
        this.editorContainer.appendChild(this.leftResizeHandle);
        this.editorContainer.appendChild(this.rightToolbar);
        this.editorContainer.appendChild(this.rightResizeHandle);

        // Append to body
        document.body.appendChild(this.editorContainer);

        // Add event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Reset button
        document.getElementById('editor-reset-btn').addEventListener('click', () => {
            this.resetToInitialState();
        });
        
        // Exit button
        document.getElementById('editor-exit-btn').addEventListener('click', () => {
            this.toggle();
        });

        // Tool buttons
        document.getElementById('tool-select').addEventListener('click', () => {
            this.selectTool('select');
        });
        document.getElementById('tool-entity').addEventListener('click', () => {
            this.selectTool('entity');
        });
        document.getElementById('tool-delete').addEventListener('click', () => {
            this.selectTool('delete');
        });
    }

    setupMouseNavigation() {
        const canvas = this.game.render.canvas;
        
        canvas.addEventListener('mousedown', (e) => {
            if (!this.isActive || this.isResizingLeft || this.isResizingRight) return;
            
            // Only start dragging if using Select tool
            if (this.currentTool === this.tools.select) {
                // Start dragging only if not clicking on an entity
                const rect = canvas.getBoundingClientRect();
                const screenX = e.clientX - rect.left;
                const screenY = e.clientY - rect.top;
                const worldPos = this.currentTool.screenToWorld(screenX, screenY);
                
                const entities = [...this.game.entities, this.game.player];
                const clickedEntity = entities.find(entity => 
                    this.tools.select.isPointInEntity(worldPos, entity)
                );
                
                if (!clickedEntity) {
                    this.isDragging = true;
                    this.dragStartX = e.clientX;
                    this.dragStartY = e.clientY;
                    this.cameraStartX = this.game.camera.x;
                    this.cameraStartY = this.game.camera.y;
                    canvas.style.cursor = 'grabbing';
                }
            }
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (!this.isActive) return;
            
            if (this.isDragging && !this.isResizingLeft && !this.isResizingRight) {
                // Calculate camera movement in world space (accounting for zoom)
                const deltaScreenX = e.clientX - this.dragStartX;
                const deltaScreenY = e.clientY - this.dragStartY;
                
                // Convert screen space delta to world space delta
                const scale = this.game.camera.width / (this.game.camera.width / this.game.camera.zoom);
                const deltaWorldX = deltaScreenX / scale;
                const deltaWorldY = deltaScreenY / scale;
                
                // Update camera position (invert for natural dragging)
                this.game.camera.x = this.cameraStartX - deltaWorldX;
                this.game.camera.y = this.cameraStartY - deltaWorldY;
            }
        });
        
        canvas.addEventListener('mouseup', () => {
            if (!this.isActive) return;
            
            this.isDragging = false;
        });
        
        canvas.addEventListener('mouseleave', () => {
            if (!this.isActive) return;
            
            this.isDragging = false;
        });
    }

    selectTool(toolName) {
        // Deactivate current tool
        if (this.currentTool) {
            this.currentTool.deactivate();
        }

        // Remove active class from all tool buttons
        document.querySelectorAll('.editor-tool-btn').forEach(btn => {
            btn.style.background = '#3498db';
        });

        // Activate new tool
        if (this.tools[toolName]) {
            this.currentTool = this.tools[toolName];
            this.currentTool.activate();
            
            // Add active class to selected tool button
            const selectedBtn = document.getElementById(`tool-${toolName}`);
            if (selectedBtn) {
                selectedBtn.style.background = '#2ecc71';
            }
        }
    }

    toggle() {
        this.isActive = !this.isActive;
        this.editorContainer.style.display = this.isActive ? 'block' : 'none';
        
        const canvas = this.game.render.canvas;
        
        if (this.isActive) {
            // Entering editor mode
            this.game.pauseSimulation();
            canvas.style.cursor = 'grab';
        } else {
            // Exiting editor mode
            this.game.resumeSimulation();
            canvas.style.cursor = 'default';
            this.isDragging = false;
        }
    }

    show() {
        this.isActive = true;
        this.editorContainer.style.display = 'block';
        this.game.pauseSimulation();
        this.game.render.canvas.style.cursor = 'grab';
    }

    hide() {
        this.isActive = false;
        this.editorContainer.style.display = 'none';
        this.game.resumeSimulation();
        this.game.render.canvas.style.cursor = 'default';
        this.isDragging = false;
    }

    setupResizeHandles() {
        // Left resize handle
        this.leftResizeHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.isResizingLeft = true;
            this.resizeStartX = e.clientX;
            this.resizeStartWidth = this.leftToolbarWidth;
            document.body.style.cursor = 'ew-resize';
        });

        // Right resize handle
        this.rightResizeHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.isResizingRight = true;
            this.resizeStartX = e.clientX;
            this.resizeStartWidth = this.rightToolbarWidth;
            document.body.style.cursor = 'ew-resize';
        });

        // Global mouse move
        document.addEventListener('mousemove', (e) => {
            if (this.isResizingLeft) {
                const delta = e.clientX - this.resizeStartX;
                const newWidth = Math.max(
                    this.minToolbarWidth,
                    Math.min(this.maxToolbarWidth, this.resizeStartWidth + delta)
                );
                this.leftToolbarWidth = newWidth;
                this.updateLeftToolbarWidth();
            } else if (this.isResizingRight) {
                const delta = this.resizeStartX - e.clientX;
                const newWidth = Math.max(
                    this.minToolbarWidth,
                    Math.min(this.maxToolbarWidth, this.resizeStartWidth + delta)
                );
                this.rightToolbarWidth = newWidth;
                this.updateRightToolbarWidth();
            }
        });

        // Global mouse up
        document.addEventListener('mouseup', () => {
            if (this.isResizingLeft || this.isResizingRight) {
                this.isResizingLeft = false;
                this.isResizingRight = false;
                document.body.style.cursor = '';
            }
        });
    }

    setupToolListeners() {
        const canvas = this.game.render.canvas;
        
        canvas.addEventListener('mousedown', (e) => {
            if (!this.isActive || this.isDragging) return;
            
            const rect = canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            const worldPos = this.currentTool.screenToWorld(screenX, screenY);
            
            this.currentTool.onMouseDown(e, worldPos);
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (!this.isActive) return;
            
            const rect = canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            const worldPos = this.currentTool.screenToWorld(screenX, screenY);
            
            this.currentTool.onMouseMove(e, worldPos);
        });
        
        canvas.addEventListener('mouseup', (e) => {
            if (!this.isActive) return;
            
            const rect = canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            const worldPos = this.currentTool.screenToWorld(screenX, screenY);
            
            this.currentTool.onMouseUp(e, worldPos);
        });
        
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            this.currentTool.onKeyDown(e);
        });
    }

    updateLeftToolbarWidth() {
        this.leftToolbar.style.width = `${this.leftToolbarWidth}px`;
        this.leftResizeHandle.style.left = `${this.leftToolbarWidth}px`;
    }

    updateRightToolbarWidth() {
        this.rightToolbar.style.width = `${this.rightToolbarWidth}px`;
        this.rightResizeHandle.style.right = `${this.rightToolbarWidth}px`;
    }

    saveInitialState() {
        const { Body } = Matter;
        
        this.initialGameState = {
            playerPosition: { ...this.game.player.body.position },
            playerVelocity: { ...this.game.player.body.velocity },
            playerAngle: this.game.player.body.angle,
            playerAngularVelocity: this.game.player.body.angularVelocity,
            playerHealth: this.game.player.health,
            cameraPosition: { x: this.game.camera.x, y: this.game.camera.y },
            cameraZoom: this.game.camera.zoom,
            entities: this.game.entities.map(entity => ({
                position: { ...entity.body.position },
                velocity: { ...entity.body.velocity },
                angle: entity.body.angle,
                angularVelocity: entity.body.angularVelocity,
                health: entity.health,
                isDestroyed: entity.isDestroyed
            })),
            triggers: this.game.triggers.map(trigger => ({
                entitiesInside: new Set(trigger.entitiesInside)
            }))
        };
    }

    resetToInitialState() {
        if (!this.initialGameState) {
            // If no initial state saved, save current state as initial
            this.saveInitialState();
            return;
        }
        
        const { Body } = Matter;
        
        // Restore player state
        Body.setPosition(this.game.player.body, this.initialGameState.playerPosition);
        Body.setVelocity(this.game.player.body, this.initialGameState.playerVelocity);
        Body.setAngle(this.game.player.body, this.initialGameState.playerAngle);
        Body.setAngularVelocity(this.game.player.body, this.initialGameState.playerAngularVelocity);
        this.game.player.health = this.initialGameState.playerHealth;
        
        // If player was destroyed, restore it
        if (this.game.player.isDestroyed) {
            this.game.player.isDestroyed = false;
            const { World } = Matter;
            World.add(this.game.world, this.game.player.body);
        }
        
        // Restore camera
        this.game.camera.x = this.initialGameState.cameraPosition.x;
        this.game.camera.y = this.initialGameState.cameraPosition.y;
        this.game.camera.zoom = this.initialGameState.cameraZoom;
        
        // Restore entities
        this.game.entities.forEach((entity, index) => {
            if (this.initialGameState.entities[index]) {
                const savedEntity = this.initialGameState.entities[index];
                Body.setPosition(entity.body, savedEntity.position);
                Body.setVelocity(entity.body, savedEntity.velocity);
                Body.setAngle(entity.body, savedEntity.angle);
                Body.setAngularVelocity(entity.body, savedEntity.angularVelocity);
                entity.health = savedEntity.health;
                entity.isDestroyed = savedEntity.isDestroyed;
            }
        });
        
        // Restore triggers
        this.game.triggers.forEach((trigger, index) => {
            if (this.initialGameState.triggers[index]) {
                trigger.entitiesInside = new Set(this.initialGameState.triggers[index].entitiesInside);
            }
        });
        
        // Hide game over dialog if visible
        this.game.hideGameOver();
    }
}