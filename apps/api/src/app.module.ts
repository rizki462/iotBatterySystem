import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { DevicesModule } from './devices/devices.module.js';
import { ReadingsModule } from './readings/readings.module.js';
import { CommandsModule } from './commands/commands.module.js';
import { AuthModule } from './auth/auth.module.js';
import { IngestModule } from './ingest/ingest.module.js';
import { Device } from './devices/device.entity.js';
import { Reading } from './readings/reading.entity.js';
import { Command } from './commands/command.entity.js';
import { User } from './auth/user.entity.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Device, Reading, Command, User],
      synchronize: true, // Schema sync otomatis untuk mode pengembangan
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),
    DevicesModule,
    ReadingsModule,
    CommandsModule,
    AuthModule,
    IngestModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}