import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * Cuerpo del latido. Lista blanca estricta (`forbidNonWhitelisted` en el pipe
 * global): un cliente NO puede mandar `receivedAt`, `sentAt` ni ningún otro
 * campo; el instante lo pone el servidor con su reloj.
 */
export class HeartbeatDto {
  @ApiProperty({ example: 'worker-messaging', maxLength: 64 })
  @IsString()
  @Matches(/^[a-z0-9][a-z0-9_-]{0,63}$/)
  instanceId!: string;

  @ApiProperty({ enum: ['api', 'worker', 'database', 'service'] })
  @IsIn(['api', 'worker', 'database', 'service'])
  type!: 'api' | 'worker' | 'database' | 'service';

  @ApiPropertyOptional({ maxLength: 64, example: '0.0.1' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  version?: string;
}

export class HeartbeatAcceptedDto {
  @ApiProperty({ example: true })
  accepted!: true;
}
