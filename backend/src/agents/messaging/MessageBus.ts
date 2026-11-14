/** Minimal event contract for agent-to-agent and platform events. */
export interface SINAEvent<TPayload = unknown> {
  id: string;
  type: string;
  source: string;
  occurredAt: string;
  correlationId?: string;
  payload: TPayload;
}

export type EventHandler<TPayload = unknown> = (
  event: SINAEvent<TPayload>,
) => void | Promise<void>;

export interface MessageBus {
  publish<TPayload>(event: SINAEvent<TPayload>): Promise<void>;
  subscribe<TPayload>(eventType: string, handler: EventHandler<TPayload>): () => void;
}

/**
 * Single-process fallback only. Events are not durable and are lost on restart.
 * Replace with a Redis-backed transport when multi-process delivery is required.
 */
export class InMemoryMessageBus implements MessageBus {
  private readonly handlers = new Map<string, Set<EventHandler<unknown>>>();

  subscribe<TPayload>(eventType: string, handler: EventHandler<TPayload>): () => void {
    const key = eventType.trim();
    if (!key) throw new Error('Event type is required');

    const listeners = this.handlers.get(key) || new Set<EventHandler<unknown>>();
    listeners.add(handler as EventHandler<unknown>);
    this.handlers.set(key, listeners);

    return () => {
      listeners.delete(handler as EventHandler<unknown>);
      if (listeners.size === 0) this.handlers.delete(key);
    };
  }

  async publish<TPayload>(event: SINAEvent<TPayload>): Promise<void> {
    const listeners = this.handlers.get(event.type);
    if (!listeners?.size) return;
    await Promise.all(
      Array.from(listeners).map((handler) =>
        Promise.resolve(handler(event as SINAEvent<unknown>)),
      ),
    );
  }
}
