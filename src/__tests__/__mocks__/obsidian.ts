/**
 * Mock implementations of Obsidian API for testing
 */

export class Events {
	private handlers: Map<string, Function[]> = new Map();

	on(event: string, callback: Function): any {
		if (!this.handlers.has(event)) {
			this.handlers.set(event, []);
		}
		this.handlers.get(event)!.push(callback);
		return {};
	}

	off(event: string, callback: Function): void {
		const handlers = this.handlers.get(event);
		if (handlers) {
			const index = handlers.indexOf(callback);
			if (index > -1) {
				handlers.splice(index, 1);
			}
		}
	}

	trigger(event: string, ...args: any[]): void {
		const handlers = this.handlers.get(event);
		if (handlers) {
			handlers.forEach(handler => handler(...args));
		}
	}
}

export class TFile {
	path: string;
	basename: string;
	extension: string;
	stat: { mtime: number; ctime: number; size: number };

	constructor(path: string) {
		this.path = path;
		const parts = path.split('/');
		const filename = parts[parts.length - 1];
		const dotIndex = filename.lastIndexOf('.');
		this.basename = dotIndex > 0 ? filename.substring(0, dotIndex) : filename;
		this.extension = dotIndex > 0 ? filename.substring(dotIndex + 1) : '';
		this.stat = {
			mtime: Date.now(),
			ctime: Date.now(),
			size: 0,
		};
	}
}

export class TFolder {
	path: string;
	name: string;

	constructor(path: string) {
		this.path = path;
		const parts = path.split('/');
		this.name = parts[parts.length - 1];
	}
}

export class Notice {
	message: string;
	constructor(message: string) {
		this.message = message;
	}
}

export class Modal {
	app: any;
	contentEl: HTMLElement;

	constructor(app: any) {
		this.app = app;
		this.contentEl = document.createElement('div');
	}

	open() {}
	close() {}
	onOpen() {}
	onClose() {}
}

export class Vault {
	files: Map<string, TFile> = new Map();

	async read(file: TFile): Promise<string> {
		return '';
	}

	async modify(file: TFile, data: string): Promise<void> {}

	async create(path: string, data: string): Promise<TFile> {
		const file = new TFile(path);
		this.files.set(path, file);
		return file;
	}

	async delete(file: TFile): Promise<void> {
		this.files.delete(file.path);
	}

	getAbstractFileByPath(path: string): TFile | null {
		return this.files.get(path) || null;
	}

	getMarkdownFiles(): TFile[] {
		return Array.from(this.files.values()).filter(f => f.extension === 'md');
	}

	getFiles(): TFile[] {
		return Array.from(this.files.values());
	}
}

export class MetadataCache {
	private cache: Map<string, any> = new Map();

	getFileCache(file: TFile): any {
		return this.cache.get(file.path) || null;
	}

	getCache(path: string): any {
		return this.cache.get(path) || null;
	}

	setFileCache(file: TFile, cache: any): void {
		this.cache.set(file.path, cache);
	}

	on(event: string, callback: (...args: any[]) => void): any {
		return {};
	}

	off(event: string, callback: (...args: any[]) => void): void {}
}

export class App {
	vault: Vault = new Vault();
	metadataCache: MetadataCache = new MetadataCache();
}

export const normalizePath = (path: string): string => {
	return path.replace(/\\/g, '/');
};

export const moment = {
	unix: (timestamp: number) => ({
		format: (format: string) => new Date(timestamp * 1000).toISOString(),
	}),
};
