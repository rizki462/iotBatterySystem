import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngestController } from './ingest.controller.js';
import { Reading } from '../readings/reading.entity.js';
import { Command } from '../commands/command.entity.js';
import { Device } from '../devices/device.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Reading, Command, Device])],
  controllers: [IngestController],
})
export class IngestModule {}
