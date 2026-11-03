import { ApiProperty } from '@nestjs/swagger';

/** Respuesta al registrar un dispositivo (UC-01-05). */
export class DeviceResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a user.
   */
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  /**
   * Valor de trusted mantenido por la instancia.
   */
  @ApiProperty()
  trusted!: boolean;
}
