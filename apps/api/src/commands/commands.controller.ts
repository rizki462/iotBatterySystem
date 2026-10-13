import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { CommandsService } from './commands.service.js';
import { CreateCommandDto } from './dto/create-command.dto.js';

@Controller('commands')
export class CommandsController {
  constructor(private readonly commandsService: CommandsService) {}

  @Post()
  async createCommand(@Body() dto: CreateCommandDto) {
    const cmd = await this.commandsService.createCommand(dto);
    return {
      ok: true,
      command: cmd,
      message: 'Command queued and will be delivered on next device wake-up cycle',
    };
  }

  @Get()
  async getCommands(
    @Query('device_id') deviceId?: string,
    @Query('pending') pending?: string,
  ) {
    const pendingOnly = pending === 'true';
    return this.commandsService.getCommands(deviceId, pendingOnly);
  }
}
