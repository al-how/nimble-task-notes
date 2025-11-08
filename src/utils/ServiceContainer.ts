/**
 * ServiceContainer: Dependency injection with lazy loading
 *
 * Services are registered with factory functions but not instantiated
 * until first access. This dramatically reduces plugin load time.
 *
 * Benefits:
 * - Faster plugin startup (no unused service initialization)
 * - Lower memory usage on startup
 * - Clear dependency graph
 * - Easy to test (mock services)
 *
 * Example:
 * ```typescript
 * container.register('taskService', () => new TaskService(this));
 * const service = container.get('taskService'); // Instantiated on first call
 * ```
 */
export class ServiceContainer {
	private services = new Map<string, any>();
	private factories = new Map<string, () => any>();

	/**
	 * Register a service factory.
	 * Service is NOT created until first get() call.
	 *
	 * @param key - Unique service identifier
	 * @param factory - Factory function that creates the service
	 */
	register<T>(key: string, factory: () => T): void {
		if (this.factories.has(key)) {
			console.warn(`ServiceContainer: Overwriting factory for '${key}'`);
		}
		this.factories.set(key, factory);
	}

	/**
	 * Get a service instance.
	 * Creates the service on first call (lazy loading).
	 *
	 * @param key - Service identifier
	 * @returns Service instance
	 * @throws Error if service not registered
	 */
	get<T>(key: string): T {
		// Return cached instance if exists
		if (this.services.has(key)) {
			return this.services.get(key) as T;
		}

		// Get factory and create instance
		const factory = this.factories.get(key);
		if (!factory) {
			throw new Error(
				`ServiceContainer: Service '${key}' not registered. Available: ${Array.from(this.factories.keys()).join(', ')}`,
			);
		}

		// Create and cache instance
		const instance = factory();
		this.services.set(key, instance);

		console.log(`ServiceContainer: Lazy-loaded '${key}'`);
		return instance as T;
	}

	/**
	 * Check if a service has been instantiated.
	 *
	 * @param key - Service identifier
	 * @returns true if service instance exists
	 */
	has(key: string): boolean {
		return this.services.has(key);
	}

	/**
	 * Check if a service factory is registered.
	 *
	 * @param key - Service identifier
	 * @returns true if factory registered
	 */
	isRegistered(key: string): boolean {
		return this.factories.has(key);
	}

	/**
	 * Clear all services and factories.
	 * Call this in plugin.onunload() to prevent memory leaks.
	 */
	clear(): void {
		// Call destroy() on services that have it
		for (const [key, service] of this.services) {
			if (service && typeof service.destroy === 'function') {
				console.log(`ServiceContainer: Destroying '${key}'`);
				service.destroy();
			}
		}

		this.services.clear();
		this.factories.clear();
	}

	/**
	 * Get list of registered service names.
	 * Useful for debugging.
	 */
	getRegisteredServices(): string[] {
		return Array.from(this.factories.keys());
	}

	/**
	 * Get list of instantiated service names.
	 * Useful for debugging.
	 */
	getInstantiatedServices(): string[] {
		return Array.from(this.services.keys());
	}
}
