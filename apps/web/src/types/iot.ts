export interface Reading {
  id: number;
  device_id: string;
  received_at: string;
  vcap: number;
  status: 'safe' | 'medium' | 'critical' | string;
  predicted_v: number;
  sleep_s: number;
  reset_reason: string;
  boot_count: number;
  wifi_ms: number;
  active_ms: number;
}

export interface Device {
  id: string;
  name: string;
  device_key_hash?: string;
  last_seen_at: string | null;
}

export interface Command {
  id: number;
  device_id: string;
  type: 'restart' | 'sleep' | string;
  payload: string | null;
  created_at: string;
  delivered_at: string | null;
}

export interface StatsStatus {
  device: Device | null;
  is_online: boolean;
  seconds_since_last_seen: number | null;
  latest_reading: Reading | null;
  status_distribution: {
    safe: number;
    medium: number;
    critical: number;
  };
  today_summary: {
    total_packets: number;
    min_vcap: number | null;
    max_vcap: number | null;
    avg_vcap: number | null;
    avg_wifi_ms: number | null;
    avg_active_ms: number | null;
  };
  all_devices: Device[];
}
