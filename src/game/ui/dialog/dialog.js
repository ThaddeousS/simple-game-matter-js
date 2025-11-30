export class Dialog {
  constructor() {
    this.dialog = null;
    this.isOpen = false;
  }

  createDialog() {
    // Override in subclasses to create specific dialog structure
    throw new Error("createDialog() must be implemented by subclass");
  }

  open() {
    if (this.dialog) {
      this.dialog.style.display = "block";
      this.isOpen = true;
    }
  }

  close() {
    if (this.dialog) {
      this.dialog.style.display = "none";
      this.isOpen = false;
    }
  }

  dismiss() {
    this.close();
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
}
