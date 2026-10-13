import { Controller, Get, Query } from '@nestjs/common';
import { ReadingsService } from './readings.service.js';

@Controller('readings')
export class ReadingsController {
  constructor(private readonly readingsService: ReadingsService) {}

  @Get()
  async getReadings(
    @Query('device_id') deviceId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    return this.readingsService.getReadings({
      device_id: deviceId,
      from,
      to,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
