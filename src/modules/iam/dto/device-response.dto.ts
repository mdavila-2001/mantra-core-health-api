import { ApiProperty } from '@nestjs/swagger';

/** Respuesta al registrar un dispositivo (UC-01-05). */
export class DeviceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty()
  trusted!: boolean;
}
