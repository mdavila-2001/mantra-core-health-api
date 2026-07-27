import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Ítem de morosidad: una factura vencida a incluir en la corrida (UC-17-10). */
export class DunningItemInputDto {
  @ApiProperty({
    description: 'Factura morosa (billing.invoices)',
    format: 'uuid',
  })
  @IsUUID()
  invoiceId!: string;

  @ApiPropertyOptional({ description: 'Saldo pendiente', example: '50.00' })
  @IsOptional()
  @IsNumberString()
  outstandingAmount?: string;

  @ApiPropertyOptional({ description: 'Días de mora', example: 30 })
  @IsOptional()
  @IsInt()
  @Min(0)
  daysOverdue?: number;

  @ApiPropertyOptional({ description: 'Recargo por mora', example: '0.00' })
  @IsOptional()
  @IsNumberString()
  dunningFee?: string;

  @ApiPropertyOptional({
    description: 'Socio de negocio (erp.business_partners)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  businessPartnerId?: string;
}

/** Cuerpo de `POST /billing/dunning-runs:execute` (UC-17-10). */
export class ExecuteDunningRunDto {
  @ApiProperty({ description: 'Tenant (directory.tenants)', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ description: 'Número de corrida (único por tenant)' })
  @IsString()
  @MaxLength(60)
  runNumber!: string;

  @ApiPropertyOptional({
    description: 'Fecha de la corrida (ISO); por defecto hoy',
  })
  @IsOptional()
  @IsDateString()
  runDate?: string;

  @ApiPropertyOptional({
    description: 'Nivel de morosidad (concepto)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  dunningLevelConceptId?: string;

  @ApiProperty({
    type: [DunningItemInputDto],
    description: 'Facturas morosas (al menos una)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DunningItemInputDto)
  items!: DunningItemInputDto[];
}

/** Respuesta de una corrida de morosidad. */
export class DunningRunResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  runNumber!: string;

  @ApiProperty({ format: 'uuid' })
  status!: string;

  @ApiProperty()
  itemCount!: number;
}
