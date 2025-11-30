export class TextureLoader {
  constructor() {
    this.cache = new Map(); // Cache loaded textures
  }

  // Create a procedural texture on a canvas
  createProceduralTexture(type, width = 16, height = 16) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (type === "checkerboard") {
      // Red/blue checkerboard
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const isRed =
            (Math.floor(x / (width / 2)) + Math.floor(y / (height / 2))) % 2 ===
            0;
          ctx.fillStyle = isRed ? "#FF0000" : "#0000FF";
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    return canvas;
  }

  // Load texture from data URL or create procedural texture
  loadTexture(dataUrl, onSuccess, onError) {
    // Check cache first
    if (this.cache.has(dataUrl)) {
      if (onSuccess) onSuccess(this.cache.get(dataUrl));
      return this.cache.get(dataUrl);
    }

    // Check if it's a procedural texture request
    if (dataUrl.startsWith("canvas://")) {
      const type = dataUrl.replace("canvas://", "");
      const canvas = this.createProceduralTexture(type);
      this.cache.set(dataUrl, canvas);
      if (onSuccess) onSuccess(canvas);
      return canvas;
    }

    // Load from data URL
    const img = new Image();

    img.onload = () => {
      this.cache.set(dataUrl, img);
      if (onSuccess) onSuccess(img);
    };

    img.onerror = (error) => {
      if (onError) onError(error);
    };

    img.src = dataUrl;
    return null; // Will be available after onload
  }

  // Apply texture to entity body
  applyTextureToBody(
    body,
    dataUrl,
    xScale = 1,
    yScale = 1,
    onSuccess,
    onError
  ) {
    const textureImage = this.loadTexture(
      dataUrl,
      (img) => {
        // Store texture data in sprite
        body.render.sprite = {
          texture: dataUrl,
          xScale: xScale,
          yScale: yScale,
          _image: img,
        };

        // Make body invisible so custom sprite shows
        body.render.visible = false;

        if (onSuccess) onSuccess(dataUrl);
      },
      onError
    );

    // If texture is already cached, it will be available immediately
    if (textureImage) {
      body.render.sprite = {
        texture: dataUrl,
        xScale: xScale,
        yScale: yScale,
        _image: textureImage,
      };
      body.render.visible = false;
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}
