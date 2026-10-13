import { Reading, StatsStatus, Command, Device } from '../types/iot';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('iot_auth_token');
};

export const setAuthToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('iot_auth_token', token);
  }
};

export const removeAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('iot_auth_token');
  }
};

async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const errorData = await res.json();
      errorMsg = errorData.message || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ access_token: string; user: { id: number; email: string } }> {
    const data = await fetchJson<{ access_token: string; user: { id: number; email: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(data.access_token);
    return data;
  },

  async getProfile(): Promise<{ id: number; email: string }> {
    return fetchJson<{ id: number; email: string }>('/auth/me');
  },

  // Telemetry & Stats
  async getStats(deviceId?: string): Promise<StatsStatus> {
    const query = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : '';
    return fetchJson<StatsStatus>(`/stats/status${query}`);
  },

  async getReadings(params?: { device_id?: string; from?: string; to?: string; limit?: number }): Promise<Reading[]> {
    const searchParams = new URLSearchParams();
    if (params?.device_id) searchParams.append('device_id', params.device_id);
    if (params?.from) searchParams.append('from', params.from);
    if (params?.to) searchParams.append('to', params.to);
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const qs = searchParams.toString();
    return fetchJson<Reading[]>(`/readings${qs ? `?${qs}` : ''}`);
  },

  // Devices
  async getDevices(): Promise<Device[]> {
    return fetchJson<Device[]>('/devices');
  },

  async sendCommand(
    deviceId: string,
    type: string,
    payload?: Record<string, unknown> | string
  ): Promise<unknown> {
    const payloadStr = typeof payload === 'object' ? JSON.stringify(payload) : payload;
    return fetchJson('/commands', {
      method: 'POST',
      body: JSON.stringify({
        device_id: deviceId,
        type,
        payload: payloadStr,
      }),
    });
  },

  async getCommands(deviceId?: string, pendingOnly: boolean = false): Promise<Command[]> {
    const searchParams = new URLSearchParams();
    if (deviceId) searchParams.append('device_id', deviceId);
    if (pendingOnly) searchParams.append('pending', 'true');
    const qs = searchParams.toString();
    return fetchJson<Command[]>(`/commands${qs ? `?${qs}` : ''}`);
  },
};
