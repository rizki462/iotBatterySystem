import { Controller, Post, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { IngestDto } from './dto/ingest.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Reading } from '../readings/reading.entity.js';
import { Command } from '../commands/command.entity.js';
import { Device } from '../devices/device.entity.js';

@Controller('ingest')
export class IngestController {
  constructor(
    @InjectRepository(Reading) private readingRepo: Repository<Reading>,
    @InjectRepository(Command) private commandRepo: Repository<Command>,
    @InjectRepository(Device) private deviceRepo: Repository<Device>,
  ) {}

  @Post()
  async handleIngest(@Headers('x-device-key') deviceKey: string, @Body() dto: IngestDto) {
    // 1. Validasi Device Key
    const configuredKey = process.env.DEVICE_KEY;
    if (!deviceKey || (configuredKey && deviceKey !== configuredKey)) {
      throw new UnauthorizedException('Invalid Device Key');
    }

    const now = new Date();

    // 2. Simpan data telemetri ke tabel readings
    const reading = this.readingRepo.create({
      ...dto,
      received_at: now,
    });
    await this.readingRepo.save(reading);

    // 3. Upsert info perangkat & catat last_seen_at
    let device = await this.deviceRepo.findOne({ where: { id: dto.device_id } });
    if (!device) {
      device = this.deviceRepo.create({
        id: dto.device_id,
        name: dto.device_id,
        last_seen_at: now,
      });
    } else {
      device.last_seen_at = now;
    }
    await this.deviceRepo.save(device);

    // 4. Periksa apakah ada antrean perintah pending untuk perangkat ini
    const pendingCommand = await this.commandRepo.findOne({
      where: {
        device_id: dto.device_id,
        delivered_at: IsNull(),
      },
      order: { created_at: 'ASC' },
    });

    if (pendingCommand) {
      pendingCommand.delivered_at = now;
      await this.commandRepo.save(pendingCommand);

      if (pendingCommand.type === 'sleep') {
        let sleepSeconds = 1800;
        if (pendingCommand.payload) {
          try {
            const parsed = JSON.parse(pendingCommand.payload);
            if (typeof parsed.sleep_s === 'number') {
              sleepSeconds = parsed.sleep_s;
            }
          } catch {
            const parsedNum = parseInt(pendingCommand.payload, 10);
            if (!isNaN(parsedNum)) sleepSeconds = parsedNum;
          }
        }
        return {
          ok: true,
          cmd: 'sleep',
          sleep_s: sleepSeconds,
        };
      }

      return {
        ok: true,
        cmd: pendingCommand.type,
      };
    }

    // Default balasan jika tidak ada perintah
    return {
      ok: true,
      cmd: 'none',
    };
  }
}