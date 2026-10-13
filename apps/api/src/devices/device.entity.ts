import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('devices')
export class Device {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  device_key_hash: string;

  @Column({ type: 'timestamp', nullable: true })
  last_seen_at: Date;
}