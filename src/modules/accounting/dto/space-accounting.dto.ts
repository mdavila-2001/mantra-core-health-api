import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, ValidateIf } from 'class-validator';

/** `GET /accounting/infrastructure-items?practiceId` y `GET /accounting/cost-centers?practiceId`. */
export class PracticeQueryDto {
  /** Práctica del tenant activo. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  practiceId!: string;
}

/** `PATCH /accounting/infrastructure-items/:id {careSpaceId}` (F5f). */
export class LocateInfrastructureItemDto {
  /** Espacio de la misma práctica; `null` lo desubica. */
  @ApiProperty({ format: 'uuid', nullable: true })
  @ValidateIf((_o, v) => v !== null)
  @IsUUID()
  careSpaceId!: string | null;
}

/** `POST /accounting/cost-centers/:id/unit-link {clinicalUnitId}` (F5f). */
export class LinkCostCenterUnitDto {
  /** Unidad clínica de la misma práctica. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  clinicalUnitId!: string;
}
