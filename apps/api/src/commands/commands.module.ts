import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommandsController } from './commands.controller.js';
import { CommandsService } from './commands.service.js';
import { Command } from './command.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Command])],
  controllers: [CommandsController],
  providers: [CommandsService],
  exports: [CommandsService, TypeOrmModule],
})
export class CommandsModule {}
