import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesController } from './devices.controller.js';
import { DevicesService } from './devices.service.js';
import { Device } from './device.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Device])],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService, TypeOrmModule],
})
export class DevicesModule {}
