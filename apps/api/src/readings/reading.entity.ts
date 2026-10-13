import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('readings')
export class Reading {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  device_id: string;

  @CreateDateColumn({ type: 'timestamp' })
  received_at: Date;

  @Column('float')
  vcap: number;

  @Column()
  status: string;

  @Column('float')
  predicted_v: number;

  @Column()
  sleep_s: number;

  @Column()
  reset_reason: string;

  @Column()
  boot_count: number;

  @Column()
  wifi_ms: number;

  @Column()
  active_ms: number;
}