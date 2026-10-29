import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /billing/charge-captures/:id/void`. */
export class VoidChargeCaptureDto {
  @ApiProperty({
    description: 'Motivo de la anulación (obligatorio, queda auditado)',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}

/** Cuerpo de `POST /internal/billing/bed-day-charges/run`. */
export class RunBedDayChargesDto {
  @ApiPropertyOptional({
    example: '2026-10-28',
    description:
      'Fecha de servicio hasta la que se devenga (incluida). Por omisión, ayer en la zona de cada sede.',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Debe ser una fecha con formato YYYY-MM-DD',
  })
  date?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Devengar sólo ese encuentro (se usa tras un egreso)',
  })
  @IsOptional()
  @IsUUID()
  encounterId?: string;
}

/** Cuerpo de `POST /internal/billing/or-time-charges/run`. */
export class RunOrTimeChargesDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Devengar sólo ese caso (al completarlo)',
  })
  @IsOptional()
  @IsUUID()
  caseId?: string;
}

/** Un cargo devengado, tal como lo devuelve la API. */
export class ChargeCaptureResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) encounterId!: string;
  @ApiProperty({ enum: ['BED_DAY', 'OR_TIME'] }) sourceKind!:
    'BED_DAY' | 'OR_TIME';
  @ApiProperty() serviceDate!: string;
  @ApiPropertyOptional({ format: 'uuid' }) careSpaceId?: string | null;
  @ApiPropertyOptional() bedCategoryCode?: string | null;
  @ApiProperty() quantity!: string;
  @ApiPropertyOptional({ description: 'Nulo si no había tarifa vigente' })
  unitPrice?: string | null;
  @ApiPropertyOptional({ format: 'uuid' }) currencyConceptId?: string | null;
  @ApiPropertyOptional({ format: 'uuid' }) serviceCatalogId?: string | null;
  @ApiPropertyOptional({ format: 'uuid' }) costCenterId?: string | null;
  @ApiProperty({ enum: ['PENDING', 'INVOICED', 'VOIDED'] })
  status!: 'PENDING' | 'INVOICED' | 'VOIDED';
  @ApiProperty() minimumStayCharge!: boolean;
  @ApiProperty({
    description: 'Sin tarifa vigente: el cargo queda pendiente sin precio',
  })
  tariffMissing!: boolean;
  @ApiPropertyOptional({ format: 'uuid' }) invoiceLineId?: string | null;
  @ApiPropertyOptional() voidReason?: string | null;
  @ApiProperty() createdAt!: Date;
}

/** Cargos pendientes de un encuentro. */
export class PendingChargesResponseDto {
  @ApiProperty({ format: 'uuid' }) encounterId!: string;
  @ApiProperty({ type: [ChargeCaptureResponseDto] })
  items!: ChargeCaptureResponseDto[];
  @ApiProperty() count!: number;
}

/** Resultado del job de día-cama. */
export class BedDayRunResultDto {
  @ApiProperty({ description: 'Sedes revisadas' }) sites!: number;
  @ApiProperty({ description: 'Encuentros revisados' }) encounters!: number;
  @ApiProperty({ description: 'Cargos nuevos' }) created!: number;
  @ApiProperty({ description: 'Cargos que ya existían (idempotencia)' })
  alreadyCaptured!: number;
  @ApiProperty({ description: 'Cargos nuevos sin tarifa vigente' })
  tariffMissing!: number;
  @ApiProperty({ description: 'Cargos pendientes recalculados' })
  repriced!: number;
  @ApiProperty({
    description: 'Cargos pendientes anulados por corrección de la ocupación',
  })
  voidedStale!: number;
  @ApiProperty({ description: 'Noches sin categoría de cama vigente' })
  categoryMissing!: number;

  @ApiProperty({
    description: 'Encuentros cuya sede no tiene zona horaria válida',
  })
  timeZoneMissing!: number;
  @ApiProperty({
    description: 'Choques con otro cargo de la misma cama o encuentro',
  })
  conflicts!: number;
  @ApiProperty({ description: 'Encuentros que fallaron por otra causa' })
  failed!: number;
}

/** Resultado del job de quirófano por tiempo. */
export class OrTimeRunResultDto {
  @ApiProperty() cases!: number;
  @ApiProperty() created!: number;
  @ApiProperty() alreadyCaptured!: number;
  @ApiProperty() tariffMissing!: number;
  @ApiProperty({ description: 'Casos sin tiempos de sala o sin encuentro' })
  notChargeable!: number;
  @ApiProperty() failed!: number;
}
