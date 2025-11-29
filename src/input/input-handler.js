export class InputHandler {
  constructor() {
    this.keys = {};
    this.actions = {};
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener("keydown", (e) => {
      this.keys[e.key] = true;
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.key] = false;
    });
  }

  isPressed(key) {
    return this.keys[key] === true;
  }

  bindAction(actionName, keys) {
    this.actions[actionName] = keys;
  }

  isActionPressed(actionName) {
    const keys = this.actions[actionName];
    if (!keys) return false;
    return keys.some((key) => this.isPressed(key));
  }
}
