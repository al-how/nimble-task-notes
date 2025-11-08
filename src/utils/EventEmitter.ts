/**
 * A simple event emitter class for service communication
 */
export class EventEmitter {
  private events: { [key: string]: Array<(...args: any[]) => void> } = {};

  /**
   * Subscribe to an event
   * @param event The event name to listen for
   * @param listener The callback function to execute when the event is triggered
   * @returns The listener for chaining (returns this)
   */
  on(event: string, listener: (...args: any[]) => void): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  /**
   * Emit an event with data
   * @param event The event name to emit
   * @param args The data to pass to the event listeners
   */
  emit(event: string, ...args: any[]): void {
    if (this.events[event]) {
      this.events[event].forEach((listener) => {
        listener(...args);
      });
    }
  }

  /**
   * Remove all listeners for a specific event, or all events if no event specified
   * @param event The event name to clear listeners for
   */
  removeAllListeners(event?: string): void {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}
