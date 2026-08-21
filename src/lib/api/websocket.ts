/**
 * WebSocket Realtime Client for Crisis Connect.
 * Connects to WS /ws/dashboard and broadcasts backend telemetry events to subscriber callbacks.
 * Supports auto-reconnect, subscription management, safe parsing, and cleanup.
 */

export type WsStatus = 'disconnected' | 'connecting' | 'connected';

export interface WsEventPayload {
  type: string;
  payload: any;
  timestamp?: string;
}

type EventHandler = (payload: any) => void;

class RealtimeClient {
  private ws: WebSocket | null = null;
  private status: WsStatus = 'disconnected';
  private subscribers: Map<string, Set<EventHandler>> = new Map();
  private reconnectTimer: any = null;
  private reconnectInterval: number = 3000;
  private isExplicitClose: boolean = false;

  private getWsUrl(): string {
    const apiBase =
      (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_BASE_URL : undefined) ??
      'https://crisis-connect-api-dev.onrender.com';
    const wsBase = apiBase.replace(/^http/, 'ws');
    return `${wsBase}/ws/dashboard`;
  }

  public connect(): void {
    if (this.status === 'connected' || this.status === 'connecting') return;

    this.isExplicitClose = false;
    this.status = 'connecting';
    const url = this.getWsUrl();

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.status = 'connected';
        this.reconnectInterval = 3000;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event: MessageEvent) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = () => {
        this.status = 'disconnected';
        this.ws = null;
        if (!this.isExplicitClose) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.warn('[WebSocket] Realtime connection error:', error);
        if (this.ws) {
          this.ws.close();
        }
      };
    } catch (err) {
      console.warn('[WebSocket] Connection initialization failed:', err);
      this.status = 'disconnected';
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.isExplicitClose) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectInterval);
    // Exponential backoff up to 15 seconds max
    this.reconnectInterval = Math.min(this.reconnectInterval * 1.5, 15000);
  }

  private handleMessage(rawData: string): void {
    try {
      // 1. Try parsing structured JSON
      const message: WsEventPayload = JSON.parse(rawData);
      if (message && message.type) {
        this.emit(message.type, message.payload || message);
      }
    } catch (err) {
      // 2. Fallback for raw text formats (e.g. ACK messages or legacy strings)
      if (typeof rawData === 'string' && rawData.startsWith('NEW_INCIDENT:')) {
        const parts = rawData.split(':');
        this.emit('incident.created', { id: parts[1], category: parts[2], severity: parts[3] });
      } else if (typeof rawData === 'string' && rawData.startsWith('DISPATCH_AUTHORIZED:')) {
        const parts = rawData.split(':');
        this.emit('dispatch.authorized', { id: parts[1], incident_id: parts[2] });
      }
    }
  }

  public emit(eventType: string, payload: any): void {
    const handlers = this.subscribers.get(eventType);
    if (handlers) {
      handlers.forEach((fn) => {
        try {
          fn(payload);
        } catch (err) {
          console.error(`[WebSocket] Handler error for event ${eventType}:`, err);
        }
      });
    }
  }

  public subscribe(eventType: string, handler: EventHandler): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(handler);

    // Auto-connect on first subscription if disconnected
    if (this.status === 'disconnected') {
      this.connect();
    }

    // Return cleanup function for useEffect unmounting
    return () => {
      const handlers = this.subscribers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.subscribers.delete(eventType);
        }
      }
    };
  }

  public disconnect(): void {
    this.isExplicitClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.status = 'disconnected';
  }

  public getStatus(): WsStatus {
    return this.status;
  }
}

export const realtimeClient = new RealtimeClient();
