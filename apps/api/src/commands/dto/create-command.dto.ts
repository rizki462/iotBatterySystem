import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCommandDto {
  @IsString()
  @IsNotEmpty()
  device_id: string;

  @IsString()
  @IsNotEmpty()
  type: string; // 'restart', 'sleep'

  @IsString()
  @IsOptional()
  payload?: string;
}
