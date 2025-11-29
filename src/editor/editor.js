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
        
        // Track entities that have been manually deleted (to not recreate on reset)
        this.deletedEntityIds = new Set();
        
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
            
            // Only start camera dragging if Ctrl key is held
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault(); // Prevent default Ctrl+click behavior
                this.isDragging = true;
                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;
                this.cameraStartX = this.game.camera.x;
                this.cameraStartY = this.game.camera.y;
                canvas.style.cursor = 'grabbing';
            }
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (!this.isActive) return;
            
            // Update cursor based on Ctrl key state
            if (!this.isDragging && !this.isResizingLeft && !this.isResizingRight) {
                if (e.ctrlKey || e.metaKey) {
                    canvas.style.cursor = 'grab';
                } else if (this.currentTool) {
                    // Restore tool cursor
                    if (this.currentTool === this.tools.select) {
                        canvas.style.cursor = 'default';
                    } else if (this.currentTool === this.tools.entity) {
                        canvas.style.cursor = 'crosshair';
                    } else if (this.currentTool === this.tools.delete) {
                        canvas.style.cursor = 'not-allowed';
                    }
                }
            }
            
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
            
            if (this.isDragging) {
                this.isDragging = false;
                // Reset cursor based on current tool
                if (this.currentTool) {
                    if (this.currentTool === this.tools.select) {
                        canvas.style.cursor = 'default';
                    } else if (this.currentTool === this.tools.entity) {
                        canvas.style.cursor = 'crosshair';
                    } else if (this.currentTool === this.tools.delete) {
                        canvas.style.cursor = 'not-allowed';
                    }
                }
            }
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

    updatePropertiesPanel() {
        const propertiesDiv = document.getElementById('editor-properties');
        if (!propertiesDiv) return;
        
        // Get selected entity from select tool
        const selectedEntity = this.currentTool === this.tools.select ? this.tools.select.selectedEntity : null;
        
        if (!selectedEntity) {
            propertiesDiv.innerHTML = '<p style="color: #aaa; font-size: 13px;">Select an object to edit properties</p>';
            return;
        }
        
        const entity = selectedEntity;
        const config = entity.config;
        
        // Build properties form
        let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';
        
        // Label
        html += this.createPropertyInput('Label', 'label', config.label, 'text');
        
        // Position
        html += '<div style="border-top: 1px solid #555; padding-top: 8px;">';
        html += '<div style="color: #3498db; font-weight: bold; font-size: 12px; margin-bottom: 6px;">Position</div>';
        html += this.createPropertyInput('X', 'x', Math.round(entity.body.position.x), 'number');
        html += this.createPropertyInput('Y', 'y', Math.round(entity.body.position.y), 'number');
        html += '</div>';
        
        // Size/Dimensions
        html += '<div style="border-top: 1px solid #555; padding-top: 8px;">';
        html += '<div style="color: #3498db; font-weight: bold; font-size: 12px; margin-bottom: 6px;">Size</div>';
        if (config.shape === 'circle') {
            html += this.createPropertyInput('Radius', 'radius', Math.round(config.radius), 'number');
        } else {
            html += this.createPropertyInput('Width', 'width', Math.round(config.width), 'number');
            html += this.createPropertyInput('Height', 'height', Math.round(config.height), 'number');
        }
        html += '</div>';
        
        // Rotation
        html += '<div style="border-top: 1px solid #555; padding-top: 8px;">';
        html += '<div style="color: #3498db; font-weight: bold; font-size: 12px; margin-bottom: 6px;">Rotation</div>';
        const degrees = Math.round((entity.body.angle * 180 / Math.PI) % 360);
        html += this.createPropertyInput('Angle (°)', 'angle', degrees, 'number');
        html += '</div>';
        
        // Visual
        html += '<div style="border-top: 1px solid #555; padding-top: 8px;">';
        html += '<div style="color: #3498db; font-weight: bold; font-size: 12px; margin-bottom: 6px;">Visual</div>';
        html += this.createPropertyInput('Color', 'color', config.color, 'color');
        html += this.createPropertyInput('Shape', 'shape', config.shape || 'rectangle', 'select', ['rectangle', 'circle']);
        html += '</div>';
        
        // Physics
        html += '<div style="border-top: 1px solid #555; padding-top: 8px;">';
        html += '<div style="color: #3498db; font-weight: bold; font-size: 12px; margin-bottom: 6px;">Physics</div>';
        html += this.createPropertyInput('Static', 'isStatic', entity.body.isStatic, 'checkbox');
        html += this.createPropertyInput('Friction', 'friction', config.friction !== undefined ? config.friction : 0.1, 'number', 0.01, 0, 1);
        html += this.createPropertyInput('Restitution', 'restitution', config.restitution !== undefined ? config.restitution : 0, 'number', 0.01, 0, 1);
        html += this.createPropertyInput('Density', 'density', config.density !== undefined ? config.density : 0.001, 'number', 0.001, 0, 1);
        html += '</div>';
        
        // Collision
        html += '<div style="border-top: 1px solid #555; padding-top: 8px;">';
        html += '<div style="color: #3498db; font-weight: bold; font-size: 12px; margin-bottom: 6px;">Collision</div>';
        html += this.createPropertyInput('Collisions', 'collisions', config.collisions || 'default', 'select', ['default', 'off']);
        html += '</div>';
        
        // Health
        html += '<div style="border-top: 1px solid #555; padding-top: 8px;">';
        html += '<div style="color: #3498db; font-weight: bold; font-size: 12px; margin-bottom: 6px;">Health</div>';
        html += this.createPropertyInput('Health', 'health', config.health !== undefined ? config.health : 100, 'number');
        html += this.createPropertyInput('Max Health', 'maxHealth', config.maxHealth !== undefined ? config.maxHealth : 100, 'number');
        html += this.createPropertyInput('Display', 'healthDisplay', config.healthDisplay || 'none', 'select', ['none', 'bar', 'text']);
        html += '</div>';
        
        html += '</div>';
        
        propertiesDiv.innerHTML = html;
        
        // Add event listeners to all inputs
        this.attachPropertyListeners(selectedEntity);
    }

    createPropertyInput(label, property, value, type, step = 1, min = null, max = null, options = []) {
        const inputId = `prop-${property}`;
        let inputHtml = '';
        
        if (type === 'checkbox') {
            inputHtml = `
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                    <label style="color: white; font-size: 12px;">${label}</label>
                    <input type="checkbox" id="${inputId}" ${value ? 'checked' : ''} 
                        style="width: 18px; height: 18px; cursor: pointer;">
                </div>
            `;
        } else if (type === 'color') {
            inputHtml = `
                <div style="margin-bottom: 6px;">
                    <label style="color: white; font-size: 12px; display: block; margin-bottom: 3px;">${label}</label>
                    <input type="color" id="${inputId}" value="${value}" 
                        style="width: 100%; height: 30px; cursor: pointer; border: 1px solid #555; background: transparent;">
                </div>
            `;
        } else if (type === 'select') {
            inputHtml = `
                <div style="margin-bottom: 6px;">
                    <label style="color: white; font-size: 12px; display: block; margin-bottom: 3px;">${label}</label>
                    <select id="${inputId}" 
                        style="width: 100%; padding: 6px; background: #2c3e50; color: white; border: 1px solid #555; border-radius: 3px; font-size: 12px;">
                        ${options.map(opt => `<option value="${opt}" ${opt === value ? 'selected' : ''}>${opt}</option>`).join('')}
                    </select>
                </div>
            `;
        } else {
            const minAttr = min !== null ? `min="${min}"` : '';
            const maxAttr = max !== null ? `max="${max}"` : '';
            const stepAttr = `step="${step}"`;
            inputHtml = `
                <div style="margin-bottom: 6px;">
                    <label style="color: white; font-size: 12px; display: block; margin-bottom: 3px;">${label}</label>
                    <input type="${type}" id="${inputId}" value="${value}" ${minAttr} ${maxAttr} ${stepAttr}
                        style="width: 100%; padding: 6px; background: #2c3e50; color: white; border: 1px solid #555; border-radius: 3px; font-size: 12px;">
                </div>
            `;
        }
        
        return inputHtml;
    }

    attachPropertyListeners(entity) {
        const { Body } = Matter;
        
        // Label
        const labelInput = document.getElementById('prop-label');
        if (labelInput) {
            labelInput.addEventListener('input', (e) => {
                entity.updateConfigProperty('label', e.target.value);
            });
        }
        
        // Position
        const xInput = document.getElementById('prop-x');
        const yInput = document.getElementById('prop-y');
        if (xInput && yInput) {
            xInput.addEventListener('input', (e) => {
                Body.setPosition(entity.body, { x: parseFloat(e.target.value), y: entity.body.position.y });
            });
            yInput.addEventListener('input', (e) => {
                Body.setPosition(entity.body, { x: entity.body.position.x, y: parseFloat(e.target.value) });
            });
        }
        
        // Size
        if (entity.config.shape === 'circle') {
            const radiusInput = document.getElementById('prop-radius');
            if (radiusInput) {
                radiusInput.addEventListener('input', (e) => {
                    const newRadius = parseFloat(e.target.value);
                    Body.scale(entity.body, newRadius / entity.config.radius, newRadius / entity.config.radius);
                    entity.updateConfigProperty('radius', newRadius);
                    this.updatePropertiesPanel();
                });
            }
        } else {
            const widthInput = document.getElementById('prop-width');
            const heightInput = document.getElementById('prop-height');
            if (widthInput) {
                widthInput.addEventListener('input', (e) => {
                    const newWidth = parseFloat(e.target.value);
                    Body.scale(entity.body, newWidth / entity.config.width, 1);
                    entity.updateConfigProperty('width', newWidth);
                    this.updatePropertiesPanel();
                });
            }
            if (heightInput) {
                heightInput.addEventListener('input', (e) => {
                    const newHeight = parseFloat(e.target.value);
                    Body.scale(entity.body, 1, newHeight / entity.config.height);
                    entity.updateConfigProperty('height', newHeight);
                    this.updatePropertiesPanel();
                });
            }
        }
        
        // Rotation
        const angleInput = document.getElementById('prop-angle');
        if (angleInput) {
            angleInput.addEventListener('input', (e) => {
                const degrees = parseFloat(e.target.value);
                Body.setAngle(entity.body, degrees * Math.PI / 180);
                this.updatePropertiesPanel();
            });
        }
        
        // Color
        const colorInput = document.getElementById('prop-color');
        if (colorInput) {
            colorInput.addEventListener('input', (e) => {
                entity.updateConfigProperty('color', e.target.value);
                entity.body.render.fillStyle = e.target.value;
            });
        }
        
        // Shape (would require recreation)
        const shapeInput = document.getElementById('prop-shape');
        if (shapeInput) {
            shapeInput.addEventListener('change', (e) => {
                // Shape changes require entity recreation - not implemented yet
                alert('Shape changes require recreation - not yet implemented');
            });
        }
        
        // Physics
        const staticInput = document.getElementById('prop-isStatic');
        if (staticInput) {
            staticInput.addEventListener('change', (e) => {
                Body.setStatic(entity.body, e.target.checked);
                entity.updateConfigProperty('isStatic', e.target.checked);
            });
        }
        
        const frictionInput = document.getElementById('prop-friction');
        if (frictionInput) {
            frictionInput.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                entity.updateConfigProperty('friction', value);
                entity.body.friction = value;
            });
        }
        
        const restitutionInput = document.getElementById('prop-restitution');
        if (restitutionInput) {
            restitutionInput.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                entity.updateConfigProperty('restitution', value);
                entity.body.restitution = value;
            });
        }
        
        const densityInput = document.getElementById('prop-density');
        if (densityInput) {
            densityInput.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                entity.updateConfigProperty('density', value);
                Body.setDensity(entity.body, value);
            });
        }
        
        // Collision
        const collisionsInput = document.getElementById('prop-collisions');
        if (collisionsInput) {
            collisionsInput.addEventListener('change', (e) => {
                entity.updateConfigProperty('collisions', e.target.value);
                entity.body.collisionFilter.group = e.target.value === 'off' ? -1 : 0;
            });
        }
        
        // Health
        const healthInput = document.getElementById('prop-health');
        if (healthInput) {
            healthInput.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                entity.updateConfigProperty('health', value);
                entity.health = value;
            });
        }
        
        const maxHealthInput = document.getElementById('prop-maxHealth');
        if (maxHealthInput) {
            maxHealthInput.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                entity.updateConfigProperty('maxHealth', value);
                entity.maxHealth = value;
            });
        }
        
        const healthDisplayInput = document.getElementById('prop-healthDisplay');
        if (healthDisplayInput) {
            healthDisplayInput.addEventListener('change', (e) => {
                entity.updateConfigProperty('healthDisplay', e.target.value);
                entity.healthDisplay = e.target.value;
            });
        }
    }

    toggle() {
        this.isActive = !this.isActive;
        this.editorContainer.style.display = this.isActive ? 'block' : 'none';
        
        const canvas = this.game.render.canvas;
        
        if (this.isActive) {
            // Entering editor mode - auto reset to initial state
            this.resetToInitialState();
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
        
        // Setup save button
        const saveBtn = document.getElementById('editor-save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.showSaveDialog();
            });
        }
        
        // Setup load button
        const loadBtn = document.getElementById('editor-load-btn');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                this.showLoadDialog();
            });
        }
        
        // Prevent default context menu when in editor mode
        canvas.addEventListener('contextmenu', (e) => {
            if (this.isActive) {
                e.preventDefault();
            }
        });
        
        canvas.addEventListener('mousedown', (e) => {
            if (!this.isActive || this.isDragging) return;
            
            // Don't trigger tool events if clicking on context menu
            if (e.target.closest('#entity-context-menu') || e.target.closest('#select-context-menu')) return;
            
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
            // Store complete entity data including configs for recreation
            entities: this.game.entities.map(entity => ({
                // Physical state
                position: { ...entity.body.position },
                velocity: { ...entity.body.velocity },
                angle: entity.body.angle,
                angularVelocity: entity.body.angularVelocity,
                health: entity.health,
                isDestroyed: entity.isDestroyed,
                // Complete config for recreation
                config: entity.getEntityConfig().get(),
                // Reference to original entity for matching
                bodyId: entity.body.id
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
        
        const { Body, World } = Matter;
        
        // Restore player state
        Body.setPosition(this.game.player.body, this.initialGameState.playerPosition);
        Body.setVelocity(this.game.player.body, this.initialGameState.playerVelocity);
        Body.setAngle(this.game.player.body, this.initialGameState.playerAngle);
        Body.setAngularVelocity(this.game.player.body, this.initialGameState.playerAngularVelocity);
        this.game.player.health = this.initialGameState.playerHealth;
        
        // If player was destroyed, restore it
        if (this.game.player.isDestroyed) {
            this.game.player.isDestroyed = false;
            World.add(this.game.world, this.game.player.body);
        }
        
        // Restore camera
        this.game.camera.x = this.initialGameState.cameraPosition.x;
        this.game.camera.y = this.initialGameState.cameraPosition.y;
        this.game.camera.zoom = this.initialGameState.cameraZoom;
        
        // Build a map of current entities by body ID
        const currentEntitiesMap = new Map();
        this.game.entities.forEach(entity => {
            currentEntitiesMap.set(entity.body.id, entity);
        });
        
        // Build a map of initial entities by body ID
        const initialEntitiesMap = new Map();
        this.initialGameState.entities.forEach(savedEntity => {
            initialEntitiesMap.set(savedEntity.bodyId, savedEntity);
        });
        
        // Find entities to remove (exist now but didn't exist initially)
        const entitiesToRemove = [];
        this.game.entities.forEach(entity => {
            if (!initialEntitiesMap.has(entity.body.id)) {
                entitiesToRemove.push(entity);
            }
        });
        
        // Remove entities that were created during edit mode
        entitiesToRemove.forEach(entity => {
            entity.destroy();
            const index = this.game.entities.indexOf(entity);
            if (index > -1) {
                this.game.entities.splice(index, 1);
            }
        });
        
        // Restore or recreate entities that existed initially
        const restoredEntities = [];
        this.initialGameState.entities.forEach(savedEntity => {
            // Skip entities that were manually deleted
            if (this.deletedEntityIds.has(savedEntity.bodyId)) {
                return;
            }
            
            const currentEntity = currentEntitiesMap.get(savedEntity.bodyId);
            
            if (currentEntity) {
                // Entity still exists, restore its state
                Body.setPosition(currentEntity.body, savedEntity.position);
                Body.setVelocity(currentEntity.body, savedEntity.velocity);
                Body.setAngle(currentEntity.body, savedEntity.angle);
                Body.setAngularVelocity(currentEntity.body, savedEntity.angularVelocity);
                currentEntity.health = savedEntity.health;
                currentEntity.isDestroyed = savedEntity.isDestroyed;
                
                // If entity was destroyed, restore it to the world
                if (savedEntity.isDestroyed === false && currentEntity.isDestroyed) {
                    currentEntity.isDestroyed = false;
                    World.add(this.game.world, currentEntity.body);
                }
                
                restoredEntities.push(currentEntity);
            } else {
                // Entity was deleted but NOT manually (e.g., destroyed by game logic)
                // Recreate it from saved config
                const recreatedEntity = new Entity(savedEntity.config, this.game.world);
                
                // Set the physical state to match saved state
                Body.setPosition(recreatedEntity.body, savedEntity.position);
                Body.setVelocity(recreatedEntity.body, savedEntity.velocity);
                Body.setAngle(recreatedEntity.body, savedEntity.angle);
                Body.setAngularVelocity(recreatedEntity.body, savedEntity.angularVelocity);
                recreatedEntity.health = savedEntity.health;
                recreatedEntity.isDestroyed = savedEntity.isDestroyed;
                
                restoredEntities.push(recreatedEntity);
            }
        });
        
        // Replace entities array with restored entities
        this.game.entities = restoredEntities;
        
        // Restore triggers
        this.game.triggers.forEach((trigger, index) => {
            if (this.initialGameState.triggers[index]) {
                trigger.entitiesInside = new Set(this.initialGameState.triggers[index].entitiesInside);
            }
        });
        
        // Hide game over dialog if visible
        this.game.hideGameOver();
        
        // Clear any selection
        if (this.tools.select) {
            this.tools.select.selectedEntity = null;
        }
        
        // Update properties panel
        this.updatePropertiesPanel();
    }

    showSaveDialog() {
        // Create a modal dialog for save options
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(30, 30, 30, 0.98);
            border: 2px solid #3498db;
            border-radius: 8px;
            padding: 20px;
            z-index: 10000;
            min-width: 300px;
        `;
        
        dialog.innerHTML = `
            <h3 style="margin-top: 0; color: #3498db;">Save Level</h3>
            <p style="color: #aaa; font-size: 14px;">Choose what to save:</p>
            <div style="display: flex; flex-direction: column; gap: 10px; margin: 20px 0;">
                <button id="save-level-btn" style="padding: 10px; background: #2ecc71; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                    Save Level Config
                </button>
                <button id="save-game-btn" style="padding: 10px; background: #9b59b6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                    Save Game Config
                </button>
            </div>
            <button id="cancel-save-btn" style="padding: 8px 16px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; width: 100%;">
                Cancel
            </button>
        `;
        
        document.body.appendChild(dialog);
        
        // Event listeners
        document.getElementById('save-level-btn').addEventListener('click', () => {
            document.body.removeChild(dialog);
            this.exportLevelConfig();
        });
        
        document.getElementById('save-game-btn').addEventListener('click', () => {
            document.body.removeChild(dialog);
            this.exportGameConfig();
        });
        
        document.getElementById('cancel-save-btn').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
    }

    showLoadDialog() {
        // Create a modal dialog for load options
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(30, 30, 30, 0.98);
            border: 2px solid #3498db;
            border-radius: 8px;
            padding: 20px;
            z-index: 10000;
            min-width: 300px;
        `;
        
        dialog.innerHTML = `
            <h3 style="margin-top: 0; color: #3498db;">Load Config</h3>
            <p style="color: #aaa; font-size: 14px;">Choose what to load:</p>
            <div style="display: flex; flex-direction: column; gap: 10px; margin: 20px 0;">
                <button id="load-level-btn" style="padding: 10px; background: #2ecc71; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                    Load Level Config
                </button>
                <button id="load-game-btn" style="padding: 10px; background: #9b59b6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                    Load Game Config
                </button>
            </div>
            <button id="cancel-load-btn" style="padding: 8px 16px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; width: 100%;">
                Cancel
            </button>
        `;
        
        document.body.appendChild(dialog);
        
        // Create hidden file inputs
        const levelFileInput = document.createElement('input');
        levelFileInput.type = 'file';
        levelFileInput.accept = '.json';
        levelFileInput.style.display = 'none';
        document.body.appendChild(levelFileInput);
        
        const gameFileInput = document.createElement('input');
        gameFileInput.type = 'file';
        gameFileInput.accept = '.json';
        gameFileInput.style.display = 'none';
        document.body.appendChild(gameFileInput);
        
        // Event listeners
        document.getElementById('load-level-btn').addEventListener('click', () => {
            document.body.removeChild(dialog);
            levelFileInput.click();
        });
        
        document.getElementById('load-game-btn').addEventListener('click', () => {
            document.body.removeChild(dialog);
            gameFileInput.click();
        });
        
        document.getElementById('cancel-load-btn').addEventListener('click', () => {
            document.body.removeChild(dialog);
            document.body.removeChild(levelFileInput);
            document.body.removeChild(gameFileInput);
        });
        
        // File input handlers
        levelFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await this.loadLevelConfigFromFile(file);
            }
            document.body.removeChild(levelFileInput);
            document.body.removeChild(gameFileInput);
        });
        
        gameFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await this.loadGameConfigFromFile(file);
            }
            document.body.removeChild(levelFileInput);
            document.body.removeChild(gameFileInput);
        });
    }

    async loadLevelConfigFromFile(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const levelConfig = JSON.parse(e.target.result);
                
                // Update the level config instance
                this.game.levelConfigInstance.set(levelConfig);
                this.game.levelData = levelConfig;
                
                // Validate and update zoom
                const configZoom = levelConfig.zoom !== undefined ? levelConfig.zoom : 1;
                const validatedZoom = this.game.validateZoom(configZoom);
                if (validatedZoom !== configZoom) {
                    this.game.levelData.zoom = validatedZoom;
                }
                
                // Reset the world with new level data
                const { World } = Matter;
                World.clear(this.game.world);
                this.game.engine.world = this.game.world;
                this.game.createWorld();
                this.game.createPlayer();
                this.game.camera.setTarget(this.game.player.body);
                this.game.camera.x = 0;
                this.game.camera.y = 0;
                this.game.camera.setZoom(this.game.levelData.zoom);
                this.game.hideGameOver();
                
                // Clear deletion tracking for new level
                this.deletedEntityIds.clear();
                
                // Update editor state
                this.saveInitialState();
                this.updatePropertiesPanel();
                
                alert('Level config loaded successfully!');
            } catch (error) {
                console.error('Error loading level config:', error);
                alert('Error loading level config: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    async loadGameConfigFromFile(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const gameConfig = JSON.parse(e.target.result);
                
                // Update the game config
                this.game.gameConfigInstance.set(gameConfig);
                this.game.gameConfig = gameConfig;
                
                // Apply aspect ratio if changed
                if (gameConfig.aspectRatio) {
                    try {
                        this.game.aspectRatio = this.game.parseAspectRatio(gameConfig.aspectRatio);
                        const dimensions = this.game.calculateCanvasDimensions();
                        this.game.render.canvas.width = dimensions.width;
                        this.game.render.canvas.height = dimensions.height;
                        this.game.camera.width = dimensions.width;
                        this.game.camera.height = dimensions.height;
                        this.game.render.options.width = dimensions.width;
                        this.game.render.options.height = dimensions.height;
                    } catch (error) {
                        console.error('Error applying aspect ratio:', error);
                    }
                }
                
                // Apply debug mode
                if (gameConfig.debug !== undefined) {
                    this.game.debugLabels = gameConfig.debug;
                }
                
                alert('Game config loaded successfully!');
            } catch (error) {
                console.error('Error loading game config:', error);
                alert('Error loading game config: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    exportLevelConfig() {
        try {
            // Build level config from current game state
            const levelConfig = {
                worldSize: this.game.levelData.worldSize || 3000,
                wallThickness: this.game.levelData.wallThickness || 50,
                zoom: this.game.camera.zoom,
                boundaries: {
                    enabled: this.game.levelData.boundaries?.enabled !== false
                },
                overrides: {
                    player: {
                        x: Math.round(this.game.player.body.position.x),
                        y: Math.round(this.game.player.body.position.y)
                    }
                },
                entities: this.game.entities.map(entity => {
                    const config = entity.getEntityConfig().get();
                    return {
                        x: Math.round(entity.body.position.x),
                        y: Math.round(entity.body.position.y),
                        width: config.width,
                        height: config.height,
                        shape: config.shape,
                        radius: config.radius,
                        rotation: Math.round((entity.body.angle * 180 / Math.PI) % 360),
                        color: config.color,
                        strokeColor: config.strokeColor,
                        strokeWidth: config.strokeWidth,
                        friction: config.friction,
                        frictionAir: config.frictionAir,
                        restitution: config.restitution,
                        density: config.density,
                        isStatic: entity.body.isStatic,
                        health: config.health,
                        maxHealth: config.maxHealth,
                        healthDisplay: config.healthDisplay,
                        label: config.label
                    };
                }),
                triggers: this.game.triggers.map(trigger => {
                    const config = trigger.config;
                    return {
                        x: Math.round(trigger.body.position.x),
                        y: Math.round(trigger.body.position.y),
                        width: config.width,
                        height: config.height,
                        rotation: Math.round((trigger.body.angle * 180 / Math.PI) % 360),
                        label: config.label,
                        triggerType: trigger.triggerType,
                        color: config.color
                    };
                })
            };
            
            this.downloadJSON(levelConfig, 'level.json');
        } catch (error) {
            console.error('Error in exportLevelConfig:', error);
            throw error;
        }
    }

    exportGameConfig() {
        try {
            // Get current game config
            const gameConfig = this.game.gameConfig;
            this.downloadJSON(gameConfig, 'game-config.json');
        } catch (error) {
            console.error('Error in exportGameConfig:', error);
            throw error;
        }
    }

    downloadJSON(data, filename) {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Defer cleanup to ensure download completes
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }
}