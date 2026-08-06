import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { ResourceNotFoundException } from '../../../common';
import { ChartReadRepository } from '../repositories';
import type { ClinicalNoteHeaders, ClinicalNoteVersions } from '../entities';
import {
  ChartNoteDetailDto,
  ChartNoteListItemDto,
  ChartNoteVersionDto,
  ListPatientNotesQueryDto,
  ListPatientNotesResponseDto,
} from '../dto';

const DEFAULT_LIMIT = 25;

/** Lectura del expediente clínico. */
@Injectable()
export class ChartReadService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param chartReadRepo - Repositorio de lectura del expediente.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly chartReadRepo: ChartReadRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ChartReadService.name);
  }

  /** Notas del paciente, con lo justo de la versión vigente para listarlas. */
  async listPatientNotes(
    patientProfileId: string,
    query: ListPatientNotesQueryDto,
  ): Promise<ListPatientNotesResponseDto> {
    const limit = query.limit ?? DEFAULT_LIMIT;
    const offset = query.offset ?? 0;
    const em = this.em.fork();

    const headers = await this.chartReadRepo.findNoteHeaders(
      em,
      { patientProfileId, encounterId: query.encounterId },
      limit,
      offset,
    );

    const page = headers.slice(0, limit);
    const versionIds = page
      .map((header) => header.currentVersionId)
      .filter((id): id is string => Boolean(id));
    const versions = await this.chartReadRepo.findVersionsByIds(em, versionIds);
    const byId = new Map(versions.map((version) => [version.id, version]));

    const items = page.map((header) =>
      this.toListItem(
        header,
        header.currentVersionId
          ? (byId.get(header.currentVersionId) ?? null)
          : null,
      ),
    );

    return { items, count: items.length, limit, offset };
  }

  /** Una nota con su versión vigente y el índice de versiones. */
  async getNote(noteId: string): Promise<ChartNoteDetailDto> {
    const em = this.em.fork();
    const header = await this.chartReadRepo.findNoteHeaderById(em, noteId);
    if (!header) {
      throw new ResourceNotFoundException('Nota no encontrada', { noteId });
    }

    const versions = await this.chartReadRepo.findVersionsByNote(em, noteId);
    const current =
      versions.find((version) => version.id === header.currentVersionId) ??
      null;

    return {
      ...this.toListItem(header, current),
      currentVersion: current ? this.toVersion(current) : null,
      versions: versions.map((version) => this.toVersion(version)),
    };
  }

  /** Proyecta la cabecera junto con su versión vigente. */
  private toListItem(
    header: ClinicalNoteHeaders,
    current: ClinicalNoteVersions | null,
  ): ChartNoteListItemDto {
    return {
      noteId: header.id,
      patientProfileId: header.patientProfileId,
      encounterId: header.encounterId ?? null,
      noteTypeConceptId: header.noteTypeConceptId,
      lifecycleStatusConceptId: header.lifecycleStatusConceptId,
      confidentialityConceptId: header.confidentialityConceptId ?? null,
      currentVersionId: header.currentVersionId ?? null,
      currentVersionNumber: current?.versionNumber ?? null,
      authorProfileId: current?.authorProfileId ?? null,
      chiefComplaintText: current?.chiefComplaintText ?? null,
      signedAt: current?.signedAt?.toISOString() ?? null,
      currentReleasedVersionId: header.currentReleasedVersionId ?? null,
      createdAt: header.createdAt.toISOString(),
    };
  }

  /** Proyecta el cuerpo de una versión. */
  private toVersion(version: ClinicalNoteVersions): ChartNoteVersionDto {
    return {
      id: version.id,
      versionNumber: version.versionNumber,
      authorProfileId: version.authorProfileId,
      statusConceptId: version.statusConceptId,
      chiefComplaintText: version.chiefComplaintText ?? null,
      subjectiveText: version.subjectiveText ?? null,
      objectiveText: version.objectiveText ?? null,
      assessmentText: version.assessmentText ?? null,
      planText: version.planText ?? null,
      supersedesVersionId: version.supersedesVersionId ?? null,
      signedByProfileId: version.signedByProfileId ?? null,
      signedAt: version.signedAt?.toISOString() ?? null,
      recordedAt: version.recordedAt.toISOString(),
    };
  }
}
