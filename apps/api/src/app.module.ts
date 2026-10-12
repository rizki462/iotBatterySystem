import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesModule } from './devices/devices.module.js';
import { ReadingsModule } from './readings/readings.module.js';
import { CommandsModule } from './commands/commands.module.js';
import { AuthModule } from './auth/auth.module.js';
import { IngestModule } from './ingest/ingest.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true, // Hanya untuk tahap pengembangan lokal agar tabel otomatis dibuat
    }),
    DevicesModule,
    ReadingsModule,
    CommandsModule,
    AuthModule,
    IngestModule,
  ],
})
class AppModule {}

export { AppModule };