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
        
        this.createEditorUI();
        this.setupMouseNavigation();
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
            width: 250px;
            height: calc(100% - 60px);
            background: rgba(30, 30, 30, 0.95);
            border-right: 2px solid #3498db;
            pointer-events: all;
            overflow-y: auto;
            padding: 20px;
            color: white;
        `;
        this.leftToolbar.innerHTML = `
            <h3 style="margin-top: 0;">Tools</h3>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button class="editor-tool-btn" id="tool-select">Select</button>
                <button class="editor-tool-btn" id="tool-entity">Add Entity</button>
                <button class="editor-tool-btn" id="tool-trigger">Add Trigger</button>
                <button class="editor-tool-btn" id="tool-delete">Delete</button>
            </div>
        `;

        // Create right toolbar
        this.rightToolbar = document.createElement('div');
        this.rightToolbar.id = 'editor-right-toolbar';
        this.rightToolbar.style.cssText = `
            position: absolute;
            top: 60px;
            right: 0;
            width: 300px;
            height: calc(100% - 60px);
            background: rgba(30, 30, 30, 0.95);
            border-left: 2px solid #3498db;
            pointer-events: all;
            overflow-y: auto;
            padding: 20px;
            color: white;
        `;
        this.rightToolbar.innerHTML = `
            <h3 style="margin-top: 0;">Properties</h3>
            <div id="editor-properties">
                <p style="color: #aaa;">Select an object to edit properties</p>
            </div>
        `;

        // Append toolbars to container
        this.editorContainer.appendChild(this.topToolbar);
        this.editorContainer.appendChild(this.leftToolbar);
        this.editorContainer.appendChild(this.rightToolbar);

        // Append to body
        document.body.appendChild(this.editorContainer);

        // Add event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
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
        document.getElementById('tool-trigger').addEventListener('click', () => {
            this.selectTool('trigger');
        });
        document.getElementById('tool-delete').addEventListener('click', () => {
            this.selectTool('delete');
        });
    }

    setupMouseNavigation() {
        const canvas = this.game.render.canvas;
        
        canvas.addEventListener('mousedown', (e) => {
            if (!this.isActive) return;
            
            // Start dragging
            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            this.cameraStartX = this.game.camera.x;
            this.cameraStartY = this.game.camera.y;
            
            canvas.style.cursor = 'grabbing';
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (!this.isActive) return;
            
            if (this.isDragging) {
                // Calculate camera movement (invert for natural dragging feel)
                const deltaX = (e.clientX - this.dragStartX) / this.game.camera.zoom;
                const deltaY = (e.clientY - this.dragStartY) / this.game.camera.zoom;
                
                this.game.camera.x = this.cameraStartX - deltaX;
                this.game.camera.y = this.cameraStartY - deltaY;
            } else {
                canvas.style.cursor = 'grab';
            }
        });
        
        canvas.addEventListener('mouseup', () => {
            if (!this.isActive) return;
            
            this.isDragging = false;
            canvas.style.cursor = 'grab';
        });
        
        canvas.addEventListener('mouseleave', () => {
            if (!this.isActive) return;
            
            this.isDragging = false;
            canvas.style.cursor = 'grab';
        });
    }

    selectTool(toolName) {
        // Remove active class from all tool buttons
        document.querySelectorAll('.editor-tool-btn').forEach(btn => {
            btn.style.background = '#3498db';
        });

        // Add active class to selected tool
        const selectedBtn = document.getElementById(`tool-${toolName}`);
        if (selectedBtn) {
            selectedBtn.style.background = '#2ecc71';
        }

        this.currentTool = toolName;
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
}