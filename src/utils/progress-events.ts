interface ProgressData {
  progress: number;
  phase?: string;
  totalProgressAmount?: number;
  isIndeterminate?: boolean;
}

type EventCallback = (data: ProgressData | void) => void;

class ProgressEventEmitter {
  private listeners: Map<string, Array<EventCallback>> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, data?: ProgressData) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(callback => callback(data));
    }
  }
}

export const progressEvents = new ProgressEventEmitter(); 
