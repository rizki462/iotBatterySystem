import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReadingsController } from './readings.controller.js';
import { StatsController } from './stats.controller.js';
import { ReadingsService } from './readings.service.js';
import { Reading } from './reading.entity.js';
import { Device } from '../devices/device.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Reading, Device])],
  controllers: [ReadingsController, StatsController],
  providers: [ReadingsService],
  exports: [ReadingsService],
})
export class ReadingsModule {}
