export class InputHandler {
  constructor() {
    this.keys = {};
    this.modifiers = {
      ctrl: false,
      shift: false,
      alt: false,
      meta: false,
    };
    this.actions = {};
    this.preventDefaultKeys = new Set(); // Keys that should preventDefault
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener("keydown", (e) => {
      this.keys[e.key] = true;
      this.modifiers.ctrl = e.ctrlKey;
      this.modifiers.shift = e.shiftKey;
      this.modifiers.alt = e.altKey;
      this.modifiers.meta = e.metaKey;

      // Prevent default for registered game control keys
      if (this.shouldPreventDefault(e.key, e)) {
        e.preventDefault();
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.key] = false;
      this.modifiers.ctrl = e.ctrlKey;
      this.modifiers.shift = e.shiftKey;
      this.modifiers.alt = e.altKey;
      this.modifiers.meta = e.metaKey;

      // Prevent default for registered game control keys
      if (this.shouldPreventDefault(e.key, e)) {
        e.preventDefault();
      }
    });
  }

  shouldPreventDefault(key, event) {
    // Prevent default for space (prevents page scroll)
    if (key === " ") return true;

    // Prevent default for arrow keys (prevents page scroll)
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
      return true;
    }

    // Prevent default for Ctrl+D (prevents bookmark dialog)
    if ((key === "d" || key === "D") && event.ctrlKey) {
      return true;
    }

    // Prevent default for Ctrl+I (could interfere with browser dev tools in some browsers)
    if ((key === "i" || key === "I") && event.ctrlKey) {
      return true;
    }

    // Prevent default for Ctrl+L (prevents address bar focus)
    if ((key === "l" || key === "L") && event.ctrlKey) {
      return true;
    }

    // Prevent default for Ctrl+Y (prevents redo in some contexts)
    if ((key === "y" || key === "Y") && event.ctrlKey) {
      return true;
    }

    // Check if key is in the preventDefaultKeys set
    if (
      this.preventDefaultKeys.has(key) ||
      this.preventDefaultKeys.has(key.toLowerCase())
    ) {
      return true;
    }

    return false;
  }

  addPreventDefaultKey(key) {
    this.preventDefaultKeys.add(key);
  }

  removePreventDefaultKey(key) {
    this.preventDefaultKeys.delete(key);
  }

  isPressed(key) {
    return this.keys[key] === true;
  }

  isPressedWithCtrl(key) {
    return this.isPressed(key) && this.modifiers.ctrl;
  }

  isPressedWithShift(key) {
    return this.isPressed(key) && this.modifiers.shift;
  }

  isPressedWithAlt(key) {
    return this.isPressed(key) && this.modifiers.alt;
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
