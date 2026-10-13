import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Reading } from './reading.entity.js';
import { Device } from '../devices/device.entity.js';

export interface GetReadingsFilter {
  device_id?: string;
  from?: string;
  to?: string;
  limit?: number;
}

@Injectable()
export class ReadingsService {
  constructor(
    @InjectRepository(Reading) private readingRepo: Repository<Reading>,
    @InjectRepository(Device) private deviceRepo: Repository<Device>,
  ) {}

  async getReadings(filter: GetReadingsFilter): Promise<Reading[]> {
    const qb = this.readingRepo.createQueryBuilder('r');

    if (filter.device_id) {
      qb.andWhere('r.device_id = :device_id', { device_id: filter.device_id });
    }

    if (filter.from) {
      qb.andWhere('r.received_at >= :from', { from: new Date(filter.from) });
    }

    if (filter.to) {
      qb.andWhere('r.received_at <= :to', { to: new Date(filter.to) });
    }

    qb.orderBy('r.received_at', 'DESC');
    qb.take(filter.limit ? Math.min(Number(filter.limit), 1000) : 100);

    return await qb.getMany();
  }

  async getStatsStatus(deviceId?: string) {
    const qb = this.readingRepo.createQueryBuilder('r');
    if (deviceId) {
      qb.where('r.device_id = :deviceId', { deviceId });
    }

    // 1. Ambil data pembacaan terbaru
    const latestReading = await qb.clone().orderBy('r.received_at', 'DESC').getOne();

    // 2. Ambil perangkat
    const devices = await this.deviceRepo.find();
    const activeDevice = deviceId
      ? devices.find((d) => d.id === deviceId)
      : devices[0] || null;

    // 3. Hitung proporsi status (safe, medium, critical)
    const statusCountsRaw = await qb
      .clone()
      .select('r.status', 'status')
      .addSelect('COUNT(r.id)', 'count')
      .groupBy('r.status')
      .getRawMany();

    const statusCounts = {
      safe: 0,
      medium: 0,
      critical: 0,
    };
    for (const item of statusCountsRaw) {
      const key = (item.status || '').toLowerCase();
      if (key in statusCounts) {
        statusCounts[key as keyof typeof statusCounts] = parseInt(item.count, 10);
      }
    }

    // 4. Hitung ringkasan hari ini (start of day)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayStatsRaw = await qb
      .clone()
      .andWhere('r.received_at >= :startOfToday', { startOfToday })
      .select('MIN(r.vcap)', 'min_vcap')
      .addSelect('MAX(r.vcap)', 'max_vcap')
      .addSelect('AVG(r.vcap)', 'avg_vcap')
      .addSelect('AVG(r.wifi_ms)', 'avg_wifi_ms')
      .addSelect('AVG(r.active_ms)', 'avg_active_ms')
      .addSelect('COUNT(r.id)', 'total_today')
      .getRawOne();

    // 5. Cek estimasi status online/offline perangkat
    let isOnline = false;
    let secondsSinceLastSeen: number | null = null;
    if (activeDevice && activeDevice.last_seen_at) {
      const diffMs = Date.now() - new Date(activeDevice.last_seen_at).getTime();
      secondsSinceLastSeen = Math.floor(diffMs / 1000);
      // Jika sleep_s diketahui dari latest reading, beri toleransi 60 detik extra
      const expectedInterval = latestReading?.sleep_s ? latestReading.sleep_s + 60 : 1860;
      isOnline = secondsSinceLastSeen <= expectedInterval;
    }

    return {
      device: activeDevice,
      is_online: isOnline,
      seconds_since_last_seen: secondsSinceLastSeen,
      latest_reading: latestReading,
      status_distribution: statusCounts,
      today_summary: {
        total_packets: parseInt(todayStatsRaw?.total_today || '0', 10),
        min_vcap: todayStatsRaw?.min_vcap ? parseFloat(todayStatsRaw.min_vcap) : null,
        max_vcap: todayStatsRaw?.max_vcap ? parseFloat(todayStatsRaw.max_vcap) : null,
        avg_vcap: todayStatsRaw?.avg_vcap ? parseFloat(parseFloat(todayStatsRaw.avg_vcap).toFixed(2)) : null,
        avg_wifi_ms: todayStatsRaw?.avg_wifi_ms ? Math.round(parseFloat(todayStatsRaw.avg_wifi_ms)) : null,
        avg_active_ms: todayStatsRaw?.avg_active_ms ? Math.round(parseFloat(todayStatsRaw.avg_active_ms)) : null,
      },
      all_devices: devices,
    };
  }
}
