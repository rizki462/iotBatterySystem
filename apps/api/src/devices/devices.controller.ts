import { Controller, Get, Param } from '@nestjs/common';
import { DevicesService } from './devices.service.js';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  async findAll() {
    return this.devicesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.devicesService.findOne(id);
  }
}
