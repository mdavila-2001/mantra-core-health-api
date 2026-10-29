import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, ValidateIf } from 'class-validator';

/** Cuerpo de `PATCH /accounting/infrastructure-items/:id`. */
export class LocateInfrastructureItemDto {
  @ApiProperty({
    format: 'uuid',
    nullable: true,
    description:
      'Espacio (practice.care_spaces) donde está el activo, de la misma práctica; `null` lo desubica',
  })
  @ValidateIf((_object, value) => value !== null)
  @IsUUID()
  careSpaceId!: string | null;
}

/** Cuerpo de `POST /accounting/cost-centers/:id/unit-link`. */
export class LinkCostCenterUnitDto {
  @ApiProperty({
    format: 'uuid',
    description:
      'Unidad clínica (practice.clinical_units) de la misma práctica',
  })
  @IsUUID()
  clinicalUnitId!: string;
}

/** Un activo de infraestructura con su ubicación. */
export class InfrastructureItemLocationDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) practiceId!: string;
  @ApiProperty({ format: 'uuid', nullable: true }) careSpaceId!: string | null;
}

/** Un centro de costo con su unidad. */
export class CostCenterUnitLinkDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) practiceId!: string;
  @ApiProperty({ format: 'uuid', nullable: true }) clinicalUnitId!:
    string | null;
}
