import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Tipos de branch aceptados en la creación (mapeados a concept ids). */
export type BranchTypeCode = 'CLINIC' | 'OFFICE';

/** Cuerpo de `POST /tenants/{tenantId}/branches` (UC-04-04). */
export class CreateBranchDto {
  @ApiProperty({ description: 'Código de la sede, único dentro del tenant', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  @ApiProperty({ description: 'Nombre de la sede', maxLength: 300 })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  name!: string;

  @ApiPropertyOptional({ description: 'Tipo de sede', enum: ['CLINIC', 'OFFICE'] })
  @IsOptional()
  @IsIn(['CLINIC', 'OFFICE'])
  branchType?: BranchTypeCode;

  @ApiPropertyOptional({ description: 'Zona horaria IANA', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;

  @ApiPropertyOptional({ description: 'Latitud geográfica', example: -12.0464, minimum: -90, maximum: 90 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitud geográfica', example: -77.0428, minimum: -180, maximum: 180 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}
