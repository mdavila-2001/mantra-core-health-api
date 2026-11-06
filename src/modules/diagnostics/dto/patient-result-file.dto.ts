import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { DiagnosticReportFiles } from '../entities';
import {
  reportFileRoleOf,
  type ReportFileRole,
} from '../report-drafts.concepts';

/**
 * Un archivo del informe: lo que se descarga.
 *
 * No transporta el contenido ni una URL firmada. El `fileId` va a
 * `GET /common/files/{id}/content`, que ya resuelve bytes, tipo y nombre y que
 * ya decide si quien pide puede descargarlo. Duplicar acá esa descarga sería
 * una segunda implementación de algo que funciona.
 */
export class DiagnosticResultFileDto {
  /** Identificador del enlace informe↔archivo. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Archivo en `common.files`; se descarga por `/common/files/{id}/content`. */
  @ApiProperty({ format: 'uuid' }) fileId!: string;

  /** Qué es el archivo dentro del informe (concept id). */
  @ApiProperty({ format: 'uuid' }) contentRoleConceptId!: string;

  /**
   * The same content role without UUIDs: `OFFICIAL` is the signed PDF of a
   * published report, `ANNEX` one of its annexes, `null` any other file.
   */
  @ApiProperty({ enum: ['OFFICIAL', 'ANNEX'], nullable: true })
  role!: ReportFileRole | null;

  /** Formato de presentación (concept id), si se declaró. */
  @ApiPropertyOptional({ format: 'uuid' })
  presentationFormatConceptId?: string;

  /** Posición dentro del informe. */
  @ApiPropertyOptional() ordinal?: number;
}

/** A version file as the patient sees it. */
export function toPatientResultFileDto(
  file: DiagnosticReportFiles,
): DiagnosticResultFileDto {
  return {
    id: file.id,
    fileId: file.fileId,
    contentRoleConceptId: file.contentRoleConceptId,
    role: reportFileRoleOf(file.contentRoleConceptId),
    presentationFormatConceptId: file.presentationFormatConceptId,
    ordinal: file.ordinal,
  };
}
