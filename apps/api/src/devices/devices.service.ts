import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './device.entity.js';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device) private deviceRepo: Repository<Device>,
  ) {}

  async findAll(): Promise<Device[]> {
    return this.deviceRepo.find({ order: { last_seen_at: 'DESC' } });
  }

  async findOne(id: string): Promise<Device> {
    const device = await this.deviceRepo.findOne({ where: { id } });
    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }
    return device;
  }
}
