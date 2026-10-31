import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { LabInboxItemDto } from './reception.dto';

/** Ámbito de la bandeja: laboratorio (con patología) o imagenología. */
export const WORKLIST_SCOPES = ['LAB', 'IMAGING'] as const;
export type WorklistScope = (typeof WORKLIST_SCOPES)[number];

const STATES = [
  'PENDING',
  'RECEIVED',
  'IN_PROCESS',
  'REPORTED',
  'CANCELLED',
] as const;

/**
 * Cuerpo de `POST /diagnostics/service-requests/worklist`. `POST` de lectura:
 * la búsqueda por paciente es PHI y no viaja en la URL.
 */
export class WorklistQueryDto {
  @ApiProperty({ enum: WORKLIST_SCOPES })
  @IsIn(WORKLIST_SCOPES)
  scope!: WorklistScope;

  @ApiPropertyOptional({
    enum: STATES,
    isArray: true,
    description:
      'Estados derivados a incluir. Omitido = todos (PENDING, RECEIVED, IN_PROCESS, REPORTED, CANCELLED)',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ArrayUnique()
  @IsIn(STATES, { each: true })
  states?: (typeof STATES)[number][];

  @ApiPropertyOptional({ description: 'Cursor opaco (`nextCursor`)' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  cursor?: string;

  @ApiPropertyOptional({ default: 25, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    minLength: 2,
    maxLength: 80,
    description: 'Nombre o código del paciente (sin tildes ni mayúsculas)',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  patientQuery?: string;
}

/** Una orden de la bandeja del ejecutor, con su estado derivado y su detalle. */
export class WorklistItemDto extends LabInboxItemDto {
  @ApiProperty({
    enum: STATES,
    description:
      'Derivado, no guardado: PENDING (sin acesión ni estudio), RECEIVED (acesión, muestra recibida o estudio de imagen), IN_PROCESS (orden de trabajo abierta; en imagen, informe en curso), REPORTED (informe liberado), CANCELLED (revocada o satisfecha por informe previo)',
  })
  state!: (typeof STATES)[number];

  @ApiProperty({ enum: WORKLIST_SCOPES })
  scope!: WorklistScope;
}

export class WorklistPageDto {
  @ApiProperty({ type: [WorklistItemDto] }) items!: WorklistItemDto[];
  @ApiProperty() count!: number;
  @ApiProperty() limit!: number;
  @ApiProperty({ type: String, nullable: true }) nextCursor!: string | null;
}
