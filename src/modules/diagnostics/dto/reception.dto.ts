import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { SpecimenDetailDto } from './specimens.dto';

/**
 * Cuerpo de `POST /diagnostics/service-requests/inbox`: la bandeja de órdenes
 * que el laboratorio del tenant activo tiene por recibir.
 *
 * Es un `POST` de lectura a propósito: la búsqueda por paciente es PHI (un
 * nombre, un código de paciente) y en una query string terminaría en los logs
 * de acceso, en el historial del navegador y en cualquier proxy del camino. El
 * cursor y el tope viajan en el mismo cuerpo para que la bandeja tenga un solo
 * contrato, con o sin búsqueda.
 */
export class LabInboxQueryDto {
  /** Cursor opaco devuelto por la página anterior. */
  @ApiPropertyOptional({
    description: 'Cursor opaco devuelto por la página anterior (`nextCursor`)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  cursor?: string;

  /** Tope de filas de la página. */
  @ApiPropertyOptional({ default: 25, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  /**
   * Texto a buscar en el nombre o en el código del paciente. Sin distinguir
   * mayúsculas ni tildes.
   */
  @ApiPropertyOptional({
    minLength: 2,
    maxLength: 80,
    description:
      'Nombre o código del paciente (sin distinguir mayúsculas ni tildes)',
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

/** Una orden de la bandeja de recepción. */
export class LabInboxItemDto {
  /** La orden de servicio (`clinical.service_requests`). */
  @ApiProperty({ format: 'uuid' }) serviceRequestId!: string;

  /** Paciente de la orden. */
  @ApiProperty({ format: 'uuid' }) patientProfileId!: string;

  /** Nombre pintable del paciente, si se conoce. */
  @ApiProperty({ type: String, nullable: true })
  patientDisplayName!: string | null;

  /** Código de paciente (historia clínica), si se conoce. */
  @ApiProperty({ type: String, nullable: true }) patientCode!: string | null;

  /** Estudio pedido (concept id). */
  @ApiProperty({ format: 'uuid' }) codeConceptId!: string;

  /** Nombre del estudio pedido, del catálogo. */
  @ApiProperty({ type: String, nullable: true }) codeDisplay!: string | null;

  /** Categoría de la orden (laboratorio o anatomía patológica). */
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  categoryConceptId!: string | null;

  /** Prioridad de la orden (concept id). */
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  priorityConceptId!: string | null;

  /** Estado de la orden (concept id). */
  @ApiProperty({ format: 'uuid' }) statusConceptId!: string;

  /** Profesional que pidió el estudio, si consta. */
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  requesterProfileId!: string | null;

  /** Organización que emitió la orden (su custodio). */
  @ApiProperty({ format: 'uuid' }) requestingTenantId!: string;

  /** Nombre de la organización que emitió la orden. */
  @ApiProperty({ type: String, nullable: true })
  requestingTenantName!: string | null;

  /** Cuándo se emitió la orden. */
  @ApiProperty({ type: String, format: 'date-time' }) requestedAt!: Date;

  /**
   * Muestras que este laboratorio ya recibió para la orden y todavía no
   * acesionó, con sus contenedores y su cadena de custodia. Vacío mientras
   * nadie recibió nada; un espécimen rechazado sigue acá con su estado, para
   * que se vea por qué hace falta otra muestra.
   */
  @ApiProperty({ type: [SpecimenDetailDto] })
  specimens!: SpecimenDetailDto[];
}

/** Página de la bandeja de recepción. */
export class LabInboxPageDto {
  /** Las órdenes de la página, de la más vieja a la más nueva. */
  @ApiProperty({ type: [LabInboxItemDto] }) items!: LabInboxItemDto[];

  /** Cuántas filas trae la página. */
  @ApiProperty() count!: number;

  /** Tope pedido. */
  @ApiProperty() limit!: number;

  /** Cursor de la página siguiente, o `null` si no hay más. */
  @ApiProperty({ type: String, nullable: true }) nextCursor!: string | null;
}
