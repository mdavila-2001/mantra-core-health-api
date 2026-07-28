import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /geo/trips` (UC-13-06). */
export class StartTripDto {
  /**
   * Identificador asociado a tracking session.
   */
  @ApiProperty({
    description: 'Sesión de tracking OPEN a la que pertenece el viaje',
    format: 'uuid',
  })
  @IsUUID()
  trackingSessionId!: string;

  /**
   * Identificador asociado a origin address.
   */
  @ApiPropertyOptional({ description: 'Dirección de origen', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  originAddressId?: string;

  /**
   * Identificador asociado a destination address.
   */
  @ApiPropertyOptional({ description: 'Dirección de destino', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  destinationAddressId?: string;
}
