import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class IngestDto {
  @IsString()
  @IsNotEmpty()
  device_id: string;

  @IsNumber()
  vcap: number;

  @IsString()
  status: string;

  @IsNumber()
  predicted_v: number;

  @IsNumber()
  sleep_s: number;

  @IsString()
  reset_reason: string;

  @IsNumber()
  boot_count: number;

  @IsNumber()
  wifi_ms: number;

  @IsNumber()
  active_ms: number;
}