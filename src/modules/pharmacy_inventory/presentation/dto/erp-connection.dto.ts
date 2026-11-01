import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PHARMACY_SYSTEM_CODES } from '../../domain/erp-connection/pharmacy-stock-mode';

export const ERP_CONNECTION_MODES = ['MANUAL', 'CONNECTED'] as const;
export const ERP_CONNECTION_STATUSES = ['MANUAL', 'ACTIVE', 'ERROR'] as const;
export const ERP_CONNECTION_ERROR_REASONS = [
  'UNREACHABLE',
  'AUTH_REJECTED',
] as const;
export const ERP_CONNECTION_CHECK_RESULTS = [
  'OK',
  'UNREACHABLE',
  'AUTH_REJECTED',
] as const;

/** Código con que el sistema de la farmacia conoce a la farmacia o a una sucursal. */
const EXTERNAL_CODE = /^[A-Za-z0-9._-]+$/;
const URL_OPTIONS = {
  protocols: ['http', 'https'],
  require_protocol: true,
  require_tld: false,
  allow_underscores: true,
  disallow_auth: true,
};

/** El código de una sucursal en el sistema de la farmacia. */
export class ErpSiteCodeDto {
  @ApiProperty({ format: 'uuid', description: 'Sede de la plataforma' })
  @IsUUID()
  siteId!: string;

  @ApiProperty({
    example: 'SUC-CENTRO',
    description: 'Código de esa sucursal en el sistema de la farmacia',
  })
  @IsString()
  @Length(1, 100)
  @Matches(EXTERNAL_CODE)
  externalCode!: string;
}

/** Los datos con que se habla con el sistema de la farmacia. */
export class ErpConnectionAccessDto {
  @ApiProperty({ enum: PHARMACY_SYSTEM_CODES })
  @IsIn(PHARMACY_SYSTEM_CODES)
  systemCode!: (typeof PHARMACY_SYSTEM_CODES)[number];

  @ApiProperty({ example: 'https://api.mi-farmacia.bo/alovida-standard' })
  @IsUrl(URL_OPTIONS)
  @Matches(/^[^?#]*$/)
  @MaxLength(500)
  baseUrl!: string;

  @ApiProperty({
    example: 'FARM-001',
    description: 'Código de la farmacia en su sistema',
  })
  @IsString()
  @Length(1, 100)
  @Matches(EXTERNAL_CODE)
  pharmacyCode!: string;

  @ApiPropertyOptional({
    description:
      'Clave que entrega la farmacia. Nunca vuelve en ninguna respuesta; sin ella, se usa la guardada.',
    writeOnly: true,
  })
  @IsOptional()
  @IsString()
  @Length(4, 500)
  apiKey?: string;
}

/** Probar una conexión con los datos del formulario, sin guardarlos. */
export class TestErpConnectionDto extends ErpConnectionAccessDto {}

/** Guardar la conexión de la farmacia con su sistema. */
export class SaveErpConnectionDto {
  @ApiProperty({
    enum: ERP_CONNECTION_MODES,
    description: '«MANUAL» desactiva la conexión y conserva lo cargado',
  })
  @IsIn(ERP_CONNECTION_MODES)
  mode!: (typeof ERP_CONNECTION_MODES)[number];

  @ApiPropertyOptional({ enum: PHARMACY_SYSTEM_CODES })
  @IsOptional()
  @IsIn(PHARMACY_SYSTEM_CODES)
  systemCode?: (typeof PHARMACY_SYSTEM_CODES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl(URL_OPTIONS)
  @Matches(/^[^?#]*$/)
  @MaxLength(500)
  baseUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Matches(EXTERNAL_CODE)
  pharmacyCode?: string;

  @ApiPropertyOptional({
    writeOnly: true,
    description: 'Sin clave, se conserva la anterior',
  })
  @IsOptional()
  @IsString()
  @Length(4, 500)
  apiKey?: string;

  @ApiPropertyOptional({
    type: [ErpSiteCodeDto],
    description:
      'Código de cada sucursal; la que falte usa el código de la sede',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ErpSiteCodeDto)
  siteCodes?: ErpSiteCodeDto[];
}

/** Una sucursal de la farmacia y su código en el sistema de la farmacia. */
export class ErpConnectionSiteDto {
  @ApiProperty({ format: 'uuid' })
  siteId!: string;

  @ApiProperty()
  siteName!: string;

  @ApiProperty({ description: 'Código de la sede en la plataforma' })
  platformCode!: string;

  @ApiProperty({ description: 'Código que se manda al sistema de la farmacia' })
  externalCode!: string;
}

/** La conexión de la farmacia, tal como la ve la pestaña Integración. */
export class ErpConnectionDto {
  @ApiProperty({ format: 'uuid' })
  pharmacyId!: string;

  @ApiProperty({ enum: ERP_CONNECTION_MODES })
  mode!: (typeof ERP_CONNECTION_MODES)[number];

  @ApiProperty({ enum: ERP_CONNECTION_STATUSES })
  status!: (typeof ERP_CONNECTION_STATUSES)[number];

  @ApiPropertyOptional({ enum: ERP_CONNECTION_ERROR_REASONS, nullable: true })
  errorReason!: (typeof ERP_CONNECTION_ERROR_REASONS)[number] | null;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  checkedAt!: string | null;

  @ApiPropertyOptional({ enum: PHARMACY_SYSTEM_CODES, nullable: true })
  systemCode!: (typeof PHARMACY_SYSTEM_CODES)[number] | null;

  @ApiPropertyOptional({ nullable: true })
  baseUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  pharmacyCode!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: '••••1234',
    description: 'Solo los últimos 4 caracteres de la clave',
  })
  keyHint!: string | null;

  @ApiProperty({ description: 'El servidor puede cifrar claves' })
  encryptionConfigured!: boolean;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description:
      'La conexión de farmacia que vincula los productos (`integration-connections`)',
  })
  integrationConnectionId!: string | null;

  @ApiProperty({ type: [ErpConnectionSiteDto] })
  sites!: ErpConnectionSiteDto[];
}

/** El resultado de «Probar conexión». */
export class ErpConnectionTestResultDto {
  @ApiProperty({ enum: ERP_CONNECTION_CHECK_RESULTS })
  result!: (typeof ERP_CONNECTION_CHECK_RESULTS)[number];

  @ApiPropertyOptional({
    type: ErpConnectionDto,
    description: 'Al probar la conexión guardada, cómo quedó',
  })
  connection?: ErpConnectionDto;
}
