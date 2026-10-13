import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Command } from './command.entity.js';
import { CreateCommandDto } from './dto/create-command.dto.js';

@Injectable()
export class CommandsService {
  constructor(
    @InjectRepository(Command) private commandRepo: Repository<Command>,
  ) {}

  async createCommand(dto: CreateCommandDto): Promise<Command> {
    const command = this.commandRepo.create({
      device_id: dto.device_id,
      type: dto.type,
      payload: dto.payload,
    });
    return this.commandRepo.save(command);
  }

  async getCommands(deviceId?: string, pendingOnly?: boolean): Promise<Command[]> {
    const qb = this.commandRepo.createQueryBuilder('c');

    if (deviceId) {
      qb.andWhere('c.device_id = :deviceId', { deviceId });
    }

    if (pendingOnly) {
      qb.andWhere('c.delivered_at IS NULL');
    }

    qb.orderBy('c.created_at', 'DESC');
    qb.take(50);

    return qb.getMany();
  }
}
