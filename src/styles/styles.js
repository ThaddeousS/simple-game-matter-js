export class Styles {
  // Dialog styles
  static gameOverDialog = `
                display: none;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 40px;
                border-radius: 10px;
                text-align: center;
                z-index: 100;
                border: 2px solid #e74c3c;
            `;

  static gameOverTitle = `
                margin: 0 0 20px 0;
                color: #e74c3c;
                font-size: 48px;
            `;

  static gameOverMessage = `
                margin: 0 0 30px 0;
                font-size: 18px;
            `;

  static gameOverButton = `
                padding: 15px 40px;
                font-size: 18px;
                background: #e74c3c;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
            `;

  // Debug panel styles
  static debugPanel = `
                position: absolute;
                top: 10px;
                left: 10px;
                color: white;
                background: rgba(0, 0, 0, 0.7);
                padding: 15px;
                border-radius: 5px;
                font-size: 14px;
                z-index: 10;
            `;

  static debugHeader = `
                cursor: pointer;
                user-select: none;
                border-bottom: 1px solid rgba(255,255,255,0.3);
                padding-bottom: 5px;
                margin-bottom: 5px;
            `;

  static debugStatus = `
                border-top: 1px solid rgba(255,255,255,0.3);
                padding-top: 5px;
                margin-top: 5px;
            `;

  // Editor styles
  static editorContainer = `
                display: none;
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 200;
                pointer-events: none;
            `;

  static editorTopToolbar = `
                position: absolute;
                top: 0;
                left: 180px;
                right: 220px;
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

  static editorLeftToolbar = `
                position: absolute;
                top: 60px;
                left: 0;
                bottom: 20px;
                background: rgba(30, 30, 30, 0.95);
                border-right: 2px solid #3498db;
                border-top: 2px solid #3498db;
                border-bottom: 2px solid #3498db;
                border-top-right-radius: 8px;
                border-bottom-right-radius: 8px;
                pointer-events: all;
                overflow-y: auto;
                padding: 15px;
                color: white;
            `;

  static editorRightToolbar = `
                position: absolute;
                top: 60px;
                right: 0;
                bottom: 20px;
                background: rgba(30, 30, 30, 0.95);
                border-left: 2px solid #3498db;
                border-top: 2px solid #3498db;
                border-bottom: 2px solid #3498db;
                border-top-left-radius: 8px;
                border-bottom-left-radius: 8px;
                pointer-events: all;
                overflow-y: auto;
                padding: 15px;
                color: white;
            `;

  static editorButton = `
                padding: 8px 20px;
                font-size: 14px;
                background: #3498db;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                user-select: none;
            `;

  static editorToolButton = `
                padding: 10px;
                font-size: 13px;
                background: #3498db;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                text-align: left;
                user-select: none;
            `;

  static editorTabButton = `
                background: #555;
                color: white;
                border: none;
                padding: 4px 12px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 11px;
            `;

  static editorTabButtonActive = `
                background: #3498db;
                color: white;
                border: none;
                padding: 4px 12px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 11px;
            `;

  static editorExpandButton = `
                background: #3498db;
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 11px;
            `;

  // Hierarchy styles
  static hierarchyGroup = `
                margin-bottom: 10px;
            `;

  static hierarchyGroupHeader = `
                background: #444;
                padding: 5px 8px;
                border-radius: 3px;
                font-weight: bold;
                font-size: 12px;
                cursor: pointer;
                user-select: none;
                margin-bottom: 5px;
            `;

  static hierarchyGroupContent = `
                display: flex;
                flex-direction: column;
                gap: 3px;
                padding-left: 10px;
            `;

  static hierarchyItem = `
                background: #555;
                padding: 5px 8px;
                border-radius: 3px;
                font-size: 11px;
                cursor: pointer;
                transition: background 0.2s;
            `;

  static hierarchyItemHover = `
                background: #666;
                padding: 5px 8px;
                border-radius: 3px;
                font-size: 11px;
                cursor: pointer;
                transition: background 0.2s;
            `;

  // Common utility styles
  static flexRow = `
                display: flex;
                flex-direction: row;
            `;

  static flexColumn = `
                display: flex;
                flex-direction: column;
            `;

  static buttonPrimary = `
                background: #3498db;
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 11px;
            `;

  static buttonSuccess = `
                background: #27ae60;
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 11px;
            `;

  static buttonDanger = `
                background: #e74c3c;
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                line-height: 1;
            `;

  static buttonWarning = `
                background: #9b59b6;
                color: white;
                border: none;
                padding: 8px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                font-size: 14px;
            `;

  static inputText = `
                flex: 1;
                background: #444;
                color: white;
                border: 1px solid #555;
                padding: 4px 8px;
                border-radius: 3px;
                font-size: 11px;
            `;

  // Context menu styles
  static contextMenu = `
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

  static contextMenuEntity = `
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

  static contextMenuHeader = `
                color: white;
                font-weight: bold;
                font-size: 12px;
                padding: 5px 10px;
                border-bottom: 1px solid #ffff00;
                margin-bottom: 5px;
            `;

  static contextMenuHeaderBlue = `
                color: white;
                font-weight: bold;
                font-size: 12px;
                padding: 5px 10px;
                border-bottom: 1px solid #3498db;
                margin-bottom: 5px;
            `;

  static contextMenuItem = `
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

  static contextMenuIcon = `
                font-size: 16px;
                width: 20px;
                text-align: center;
            `;

  static entityColorBox = `
                width: 12px;
                height: 12px;
                border: 1px solid rgba(255, 255, 255, 0.3);
            `;

  // Collision group styles
  static collisionGroupItem = `
                display: flex;
                align-items: center;
                gap: 4px;
                margin-bottom: 4px;
                padding: 4px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 3px;
            `;

  static collisionGroupInput = `
                flex: 1;
                background: #2c3e50;
                color: white;
                border: 1px solid #555;
                padding: 4px 8px;
                border-radius: 3px;
                font-size: 11px;
            `;

  static collisionGroupRemoveButton = `
                background: #e74c3c;
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                line-height: 1;
            `;

  // Dialog styles
  static modalDialog = `
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
}
