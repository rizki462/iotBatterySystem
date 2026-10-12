import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('commands')
export class Command {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  device_id: string;

  @Column()
  type: string; // contoh: 'restart', 'sleep'

  @Column({ nullable: true })
  payload: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  delivered_at: Date | null;
}