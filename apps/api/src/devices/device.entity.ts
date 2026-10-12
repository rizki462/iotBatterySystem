import { Entity, Column, PrimaryColumn, CreateDateColumn } from "typeorm";

@Entity('devices')
export class Device {
    
    @PrimaryColumn()
    id: string;

    @Column()
    name: string;

    @Column()
    device_key_has: string;

    @Column()
    last_seen_at: Date;
    
}