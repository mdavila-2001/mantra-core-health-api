import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import {
  EXTERNAL_SYSTEM_FORMATS,
  type ExternalSystemFormat,
} from '../../domain/sync/external-system';

/**
 * El sistema propio de una conexión de farmacia (FAR-C9 · C9-3). La clave va
 * solo en el cuerpo, nunca en la URL, y no vuelve a salir en ninguna respuesta.
 */
export class ConfigureExternalSystemDto {
  @ApiProperty({ enum: EXTERNAL_SYSTEM_FORMATS })
  @IsIn(EXTERNAL_SYSTEM_FORMATS)
  format!: ExternalSystemFormat;

  @ApiProperty({
    description: 'Dirección que la plataforma va a llamar (http o https)',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(500)
  baseUrl!: string;

  @ApiProperty({
    description: 'Código de la farmacia (o de la cadena) en ese sistema',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  externalPharmacyCode!: string;

  @ApiProperty({
    description: 'Clave de la farmacia en ese sistema',
    writeOnly: true,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  apiKey!: string;
}

/** Lo que se muestra del sistema de la farmacia. Sin clave. */
export class ExternalSystemSummaryDto {
  @ApiProperty({ enum: EXTERNAL_SYSTEM_FORMATS })
  format!: ExternalSystemFormat;

  @ApiProperty()
  baseUrl!: string;

  @ApiProperty()
  externalPharmacyCode!: string;

  @ApiProperty()
  apiKeyConfigured!: boolean;

  @ApiProperty({ format: 'date-time' })
  configuredAt!: string;
}

/** Resultado de guardar: el sistema tal como quedó y que respondió al probarlo. */
export class ExternalSystemResponseDto {
  @ApiProperty({ type: ExternalSystemSummaryDto })
  system!: ExternalSystemSummaryDto;

  @ApiProperty({ enum: ['OK'] })
  probe!: 'OK';
}

/** Resultado de probar: de quién es el sistema que respondió. */
export class ExternalSystemProbeDto {
  @ApiProperty({ enum: ['OK'] })
  status!: 'OK';

  @ApiProperty({ enum: ['PHARMACY', 'SERVER'] })
  source!: 'PHARMACY' | 'SERVER';
}
