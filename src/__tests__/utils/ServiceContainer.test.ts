import { ServiceContainer } from "../../utils/ServiceContainer";

describe("ServiceContainer", () => {
	let container: ServiceContainer;
	let mockService: any;
	let factoryCalls: number;

	beforeEach(() => {
		container = new ServiceContainer();
		factoryCalls = 0;
		mockService = {
			name: "TestService",
			doSomething: jest.fn(),
		};
	});

	describe("register", () => {
		it("should register a service factory", () => {
			container.register("test", () => mockService);

			expect(container.isRegistered("test")).toBe(true);
		});

		it("should not instantiate service on registration", () => {
			const factory = jest.fn(() => mockService);
			container.register("test", factory);

			expect(factory).not.toHaveBeenCalled();
			expect(container.has("test")).toBe(false);
		});

		it("should allow overwriting existing factory", () => {
			const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

			container.register("test", () => ({ name: "First" }));
			container.register("test", () => ({ name: "Second" }));

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining("Overwriting factory for 'test'"),
			);

			consoleSpy.mockRestore();
		});
	});

	describe("get", () => {
		it("should create service on first get() call", () => {
			const factory = jest.fn(() => mockService);
			container.register("test", factory);

			const service = container.get("test");

			expect(factory).toHaveBeenCalledTimes(1);
			expect(service).toBe(mockService);
			expect(container.has("test")).toBe(true);
		});

		it("should return cached instance on subsequent calls", () => {
			const factory = jest.fn(() => mockService);
			container.register("test", factory);

			const service1 = container.get("test");
			const service2 = container.get("test");
			const service3 = container.get("test");

			expect(factory).toHaveBeenCalledTimes(1);
			expect(service1).toBe(mockService);
			expect(service2).toBe(mockService);
			expect(service3).toBe(mockService);
			expect(service1).toBe(service2);
			expect(service2).toBe(service3);
		});

		it("should throw error for unregistered service", () => {
			expect(() => container.get("nonexistent")).toThrow(
				"Service 'nonexistent' not registered",
			);
		});

		it("should list available services in error message", () => {
			container.register("service1", () => ({}));
			container.register("service2", () => ({}));

			try {
				container.get("nonexistent");
				fail("Should have thrown error");
			} catch (error: any) {
				expect(error.message).toContain("service1");
				expect(error.message).toContain("service2");
			}
		});

		it("should log when lazy-loading a service", () => {
			const consoleSpy = jest.spyOn(console, "log").mockImplementation();

			container.register("test", () => mockService);
			container.get("test");

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining("Lazy-loaded 'test'"),
			);

			consoleSpy.mockRestore();
		});
	});

	describe("has", () => {
		it("should return false for uninstantiated service", () => {
			container.register("test", () => mockService);

			expect(container.has("test")).toBe(false);
		});

		it("should return true for instantiated service", () => {
			container.register("test", () => mockService);
			container.get("test");

			expect(container.has("test")).toBe(true);
		});

		it("should return false for unregistered service", () => {
			expect(container.has("nonexistent")).toBe(false);
		});
	});

	describe("isRegistered", () => {
		it("should return true for registered factory", () => {
			container.register("test", () => mockService);

			expect(container.isRegistered("test")).toBe(true);
		});

		it("should return false for unregistered factory", () => {
			expect(container.isRegistered("nonexistent")).toBe(false);
		});
	});

	describe("clear", () => {
		it("should clear all services and factories", () => {
			container.register("service1", () => ({ name: "Service1" }));
			container.register("service2", () => ({ name: "Service2" }));

			container.get("service1");

			container.clear();

			expect(container.isRegistered("service1")).toBe(false);
			expect(container.isRegistered("service2")).toBe(false);
			expect(container.has("service1")).toBe(false);
		});

		it("should call destroy() on services that have it", () => {
			const destroySpy = jest.fn();
			const serviceWithDestroy = {
				name: "TestService",
				destroy: destroySpy,
			};

			container.register("test", () => serviceWithDestroy);
			container.get("test");

			container.clear();

			expect(destroySpy).toHaveBeenCalledTimes(1);
		});

		it("should not fail for services without destroy()", () => {
			container.register("test", () => ({ name: "NoDestroy" }));
			container.get("test");

			expect(() => container.clear()).not.toThrow();
		});

		it("should log when destroying services", () => {
			const consoleSpy = jest.spyOn(console, "log").mockImplementation();
			const serviceWithDestroy = {
				name: "TestService",
				destroy: jest.fn(),
			};

			container.register("test", () => serviceWithDestroy);
			container.get("test");
			container.clear();

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining("Destroying 'test'"),
			);

			consoleSpy.mockRestore();
		});
	});

	describe("getRegisteredServices", () => {
		it("should return list of registered service names", () => {
			container.register("service1", () => ({}));
			container.register("service2", () => ({}));
			container.register("service3", () => ({}));

			const registered = container.getRegisteredServices();

			expect(registered).toEqual(["service1", "service2", "service3"]);
		});

		it("should return empty array when no services registered", () => {
			const registered = container.getRegisteredServices();

			expect(registered).toEqual([]);
		});
	});

	describe("getInstantiatedServices", () => {
		it("should return list of instantiated service names", () => {
			container.register("service1", () => ({ name: "Service1" }));
			container.register("service2", () => ({ name: "Service2" }));
			container.register("service3", () => ({ name: "Service3" }));

			container.get("service1");
			container.get("service3");

			const instantiated = container.getInstantiatedServices();

			expect(instantiated).toEqual(["service1", "service3"]);
		});

		it("should return empty array when no services instantiated", () => {
			container.register("service1", () => ({}));

			const instantiated = container.getInstantiatedServices();

			expect(instantiated).toEqual([]);
		});
	});

	describe("lazy loading behavior", () => {
		it("should only instantiate services when needed", () => {
			const factory1 = jest.fn(() => ({ name: "Service1" }));
			const factory2 = jest.fn(() => ({ name: "Service2" }));
			const factory3 = jest.fn(() => ({ name: "Service3" }));

			container.register("service1", factory1);
			container.register("service2", factory2);
			container.register("service3", factory3);

			// None instantiated yet
			expect(factory1).not.toHaveBeenCalled();
			expect(factory2).not.toHaveBeenCalled();
			expect(factory3).not.toHaveBeenCalled();

			// Get only service1
			container.get("service1");

			// Only service1 should be instantiated
			expect(factory1).toHaveBeenCalledTimes(1);
			expect(factory2).not.toHaveBeenCalled();
			expect(factory3).not.toHaveBeenCalled();
		});

		it("should support different service types", () => {
			class MyService {
				constructor(public name: string) {}
			}

			container.register("class", () => new MyService("Test"));
			container.register("object", () => ({ type: "object" }));
			container.register("function", () => () => "result");
			container.register("primitive", () => 42);

			expect(container.get<MyService>("class")).toBeInstanceOf(MyService);
			expect(container.get<any>("object")).toEqual({ type: "object" });
			expect(typeof container.get<any>("function")).toBe("function");
			expect(container.get<number>("primitive")).toBe(42);
		});
	});

	describe("memory management", () => {
		it("should allow re-registration after clear", () => {
			container.register("test", () => ({ name: "First" }));
			container.get("test");

			container.clear();

			container.register("test", () => ({ name: "Second" }));
			const service = container.get("test");

			expect(service.name).toBe("Second");
		});

		it("should not retain instances after clear", () => {
			const firstInstance = { name: "First" };
			container.register("test", () => firstInstance);

			const service1 = container.get("test");
			expect(service1).toBe(firstInstance);

			container.clear();
			container.register("test", () => ({ name: "Second" }));

			const service2 = container.get("test");
			expect(service2).not.toBe(firstInstance);
		});
	});
});
