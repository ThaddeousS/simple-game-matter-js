export class Config {
    constructor(url = null) {
        this.url = url;
        this.config = null;
    }

    async load() {
        if (this.url) {
            try {
                const response = await fetch(this.url);
                if (!response.ok) {
                    throw new Error(`Failed to load config from ${this.url}: ${response.status}`);
                }
                this.config = await response.json();
                return this.config;
            } catch (error) {
                console.error(`Error loading config from ${this.url}:`, error);
                this.config = this.getDefaultConfig();
                return this.config;
            }
        } else {
            this.config = this.getDefaultConfig();
            return this.config;
        }
    }

    getDefaultConfig() {
        // Override in subclasses
        return {};
    }

    get() {
        return this.config;
    }

    set(config) {
        this.config = config;
    }
}