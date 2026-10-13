import { Controller, Get, Query } from '@nestjs/common';
import { ReadingsService } from './readings.service.js';

@Controller('stats')
export class StatsController {
  constructor(private readonly readingsService: ReadingsService) {}

  @Get('status')
  async getStatus(@Query('device_id') deviceId?: string) {
    return this.readingsService.getStatsStatus(deviceId);
  }
}
