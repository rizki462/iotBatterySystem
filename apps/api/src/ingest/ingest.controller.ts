import { Controller, Post, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { IngestDto } from './dto/ingest.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Reading } from '../readings/reading.entity.js';
import { Command } from '../commands/command.entity.js';

@Controller('ingest')
export class IngestController {
  constructor(
    @InjectRepository(Reading) private readingRepo: Repository<Reading>,
    @InjectRepository(Command) private commandRepo: Repository<Command>,
  ) {}

  @Post()
  async handleIngest(@Headers('x-device-key') deviceKey: string, @Body() dto: IngestDto) {
    // Validasi sederhana device key dari env (bisa dikembangkan nanti via database)
    if (!deviceKey || deviceKey !== process.env.DEVICE_KEY) {
      throw new UnauthorizedException('Invalid Device Key');
    }

    // 1. Simpan data pembacaan sensor ke database
    const reading = this.readingRepo.create(dto);
    await this.readingRepo.save(reading);

    // 2. Cek apakah ada command yang belum dikirim untuk device ini
    const pendingCommand = await this.commandRepo.findOne({
      where: {
        device_id: dto.device_id,
        delivered_at: IsNull(),
      },
      order: { created_at: 'ASC' },
    });

    let cmdToRun = 'none';
    if (pendingCommand) {
      cmdToRun = pendingCommand.type;
      pendingCommand.delivered_at = new Date();
      await this.commandRepo.save(pendingCommand);
    }

    // 3. Balas ke ESP32 sesuai kontrak API
    return {
      ok: true,
      cmd: cmdToRun,
    };
  }
}