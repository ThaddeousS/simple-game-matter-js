export class ToolBar {
  constructor(id, baseStyles) {
    this.id = id;
    this.element = null;
    this.baseStyles = baseStyles;
    this.width = null;
    this.isExpanded = false;
  }

  createElement() {
    this.element = document.createElement("div");
    this.element.id = this.id;
    this.element.style.cssText = this.baseStyles;
    return this.element;
  }

  setWidth(width) {
    this.width = width;
    if (this.element) {
      this.element.style.width = `${width}px`;
    }
  }

  show() {
    if (this.element) {
      this.element.style.display = "block";
    }
  }

  hide() {
    if (this.element) {
      this.element.style.display = "none";
    }
  }

  setContent(html) {
    if (this.element) {
      this.element.innerHTML = html;
    }
  }

  appendTo(parent) {
    if (this.element && parent) {
      parent.appendChild(this.element);
    }
  }
}
