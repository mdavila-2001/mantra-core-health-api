import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ClinicalNoteHeaders,
  ClinicalNoteVersions,
  ClinicalNoteSignatures,
  NoteReleaseEvents,
  PhysicalExamFindings,
} from '../entities';
import { createdBy } from '../../../common';

/** Datos de alta de una cabecera de nota clínica. */
export interface CreateNoteHeaderData {
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a encounter.
   */
  encounterId?: string;
  /**
   * Identificador asociado a note type concept.
   */
  noteTypeConceptId: string;
  /**
   * Identificador asociado a lifecycle status concept.
   */
  lifecycleStatusConceptId: string;
  /**
   * Identificador asociado a patient release status concept.
   */
  patientReleaseStatusConceptId?: string;
  /**
   * Identificador asociado a confidentiality concept.
   */
  confidentialityConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Datos de alta de una versión inmutable de nota. */
export interface CreateNoteVersionData {
  /**
   * Identificador asociado a clinical note.
   */
  clinicalNoteId: string;
  /**
   * Valor de version number mantenido por la instancia.
   */
  versionNumber: number;
  /**
   * Identificador asociado a author profile.
   */
  authorProfileId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de chief complaint text mantenido por la instancia.
   */
  chiefComplaintText?: string;
  /**
   * Valor de subjective text mantenido por la instancia.
   */
  subjectiveText?: string;
  /**
   * Valor de objective text mantenido por la instancia.
   */
  objectiveText?: string;
  /**
   * Valor de assessment text mantenido por la instancia.
   */
  assessmentText?: string;
  /**
   * Valor de plan text mantenido por la instancia.
   */
  planText?: string;
  /**
   * Identificador asociado a supersedes version.
   */
  supersedesVersionId?: string;
  /**
   * Identificador asociado a amendment reason concept.
   */
  amendmentReasonConceptId?: string;
  /**
   * Valor de amendment reason text mantenido por la instancia.
   */
  amendmentReasonText?: string;
  /**
   * Identificador asociado a release eligibility concept.
   */
  releaseEligibilityConceptId?: string;
  /**
   * Identificador asociado a recorded by user.
   */
  recordedByUserId?: string;
}

/** Datos de una firma sobre una versión de nota. */
export interface CreateSignatureData {
  /**
   * Identificador asociado a clinical note version.
   */
  clinicalNoteVersionId: string;
  /**
   * Identificador asociado a signer profile.
   */
  signerProfileId: string;
  /**
   * Identificador asociado a signature type concept.
   */
  signatureTypeConceptId: string;
  /**
   * Valor de signed content hash mantenido por la instancia.
   */
  signedContentHash?: string;
  /**
   * Valor de certificate thumbprint mantenido por la instancia.
   */
  certificateThumbprint?: string;
  /**
   * Valor de signature value encrypted mantenido por la instancia.
   */
  signatureValueEncrypted?: string;
}

/** Datos de un evento de liberación/retención de visibilidad al paciente. */
export interface CreateReleaseEventData {
  /**
   * Identificador asociado a clinical note version.
   */
  clinicalNoteVersionId: string;
  /**
   * Identificador asociado a action concept.
   */
  actionConceptId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId?: string;
  /**
   * Identificador asociado a resulting visibility concept.
   */
  resultingVisibilityConceptId: string;
  /**
   * Identificador asociado a reason concept.
   */
  reasonConceptId?: string;
  /**
   * Valor de policy version mantenido por la instancia.
   */
  policyVersion?: string;
  /**
   * Identificador asociado a recorded by user.
   */
  recordedByUserId?: string;
}

/** Datos de un hallazgo de examen físico. */
export interface CreateExamFindingData {
  /**
   * Identificador asociado a clinical note version.
   */
  clinicalNoteVersionId: string;
  /**
   * Identificador asociado a body system concept.
   */
  bodySystemConceptId: string;
  /**
   * Identificador asociado a finding concept.
   */
  findingConceptId?: string;
  /**
   * Valor de is normal mantenido por la instancia.
   */
  isNormal?: boolean;
  /**
   * Valor de finding text mantenido por la instancia.
   */
  findingText?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Filtro de la página de cabeceras por autor de la versión vigente. */
export interface HeadersPageByAuthorFilter {
  /**
   * Perfil profesional autor de la versión vigente (`v.author_profile_id`).
   */
  authorProfileId: string;
  /** Filtra además por paciente, sin ampliar el alcance por autor. */
  patientProfileId?: string;
  /** Desde (inclusive) sobre `h.created_at`. */
  from?: Date;
  /** Hasta (inclusive) sobre `h.created_at`. */
  to?: Date;
  /** Continuación de keyset: última fila de la página anterior. */
  cursor?: { createdAt: Date; id: string };
  /** Cuántas cabeceras traer. */
  limit: number;
}

/**
 * Acceso a datos del agregado "nota clínica versionada": cabecera, versiones
 * inmutables, firmas, eventos de liberación y hallazgos de examen físico.
 *
 * Los métodos reciben el `EntityManager` activo para que el servicio controle la
 * unidad de trabajo y la transacción; las FK son columnas uuid planas, así que el
 * servicio hace `flush` entre padre e hijo.
 */
@Injectable()
export class ClinicalNotesRepository {
  /**
   * Obtiene find header by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find header by id conforme al contrato `Promise<ClinicalNoteHeaders | null>`.
   */
  findHeaderById(
    em: EntityManager,
    id: string,
  ): Promise<ClinicalNoteHeaders | null> {
    return em.findOne(ClinicalNoteHeaders, { id });
  }

  /**
   * Obtiene find version by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find version by id conforme al contrato `Promise<ClinicalNoteVersions | null>`.
   */
  findVersionById(
    em: EntityManager,
    id: string,
  ): Promise<ClinicalNoteVersions | null> {
    return em.findOne(ClinicalNoteVersions, { id });
  }

  /**
   * Notas del paciente, de la más reciente a la más antigua (UC-40-14).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Paciente cuyo expediente se lee.
   * @param limit - Tope de notas.
   * @returns Cabeceras de nota ordenadas por fecha de alta descendente.
   */
  findHeadersByPatient(
    em: EntityManager,
    patientProfileId: string,
    limit: number,
  ): Promise<ClinicalNoteHeaders[]> {
    return em.find(
      ClinicalNoteHeaders,
      { patientProfileId },
      { orderBy: { createdAt: 'DESC' }, limit },
    );
  }

  /**
   * Cabeceras de nota de un encuentro, en orden de alta (para el sello y el
   * PDF oficial del cierre: el hash tiene que ser determinista).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param encounterId - Encuentro cuyas notas se leen.
   * @returns Cabeceras ordenadas por `createdAt, id`.
   */
  findHeadersByEncounter(
    em: EntityManager,
    encounterId: string,
  ): Promise<ClinicalNoteHeaders[]> {
    return em.find(
      ClinicalNoteHeaders,
      { encounterId },
      { orderBy: { createdAt: 'ASC', id: 'ASC' } },
    );
  }

  /**
   * Página de cabeceras cuya versión vigente es de un autor dado, por keyset.
   *
   * No hay relación mapeada entre cabecera y versión (nota de la clase): el
   * cruce va por SQL crudo, no por `em.find`. El join es sólo para **filtrar**
   * por `v.author_profile_id`; hidratar las cabeceras se hace después con
   * `em.find` sobre los ids, en el orden que trajo el SQL. Es una lectura sin
   * transacción abierta (se corre sobre un `em.fork()`), por eso no se pasa
   * `getTransactionContext()`.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param filter - Autor, filtros opcionales, cursor y tope.
   * @returns Cabeceras de la página, `limit + 1` si hay más, en el orden del SQL.
   */
  async findHeadersPageByAuthor(
    em: EntityManager,
    filter: HeadersPageByAuthorFilter,
  ): Promise<ClinicalNoteHeaders[]> {
    const parametros: unknown[] = [filter.authorProfileId];
    let condiciones = '';

    if (filter.patientProfileId) {
      condiciones += ' AND h.patient_profile_id = ?';
      parametros.push(filter.patientProfileId);
    }
    if (filter.from) {
      condiciones += ' AND h.created_at >= ?';
      parametros.push(filter.from);
    }
    if (filter.to) {
      condiciones += ' AND h.created_at <= ?';
      parametros.push(filter.to);
    }
    // `(a, b) < (c, d)` es comparación de tuplas de Postgres: ordena por
    // `created_at` y desempata por `id` en una sola condición, el mismo orden
    // del `ORDER BY`.
    if (filter.cursor) {
      condiciones += ' AND (h.created_at, h.id) < (?, ?)';
      parametros.push(filter.cursor.createdAt, filter.cursor.id);
    }
    parametros.push(filter.limit);

    const filas = await em.getConnection().execute<{ id: string }[]>(
      `SELECT h.id
         FROM chart.clinical_note_headers h
         JOIN chart.clinical_note_versions v ON v.id = h.current_version_id
        WHERE v.author_profile_id = ?
          ${condiciones}
        ORDER BY h.created_at DESC, h.id DESC
        LIMIT ?`,
      parametros,
      'all',
    );

    if (filas.length === 0) return [];

    const ids = filas.map((fila) => fila.id);
    const cabeceras = await em.find(ClinicalNoteHeaders, { id: { $in: ids } });
    const porId = new Map(cabeceras.map((header) => [header.id, header]));
    // El `IN` de MikroORM no preserva el orden del SQL: se reordena según la
    // secuencia que ya vino ordenada por `created_at DESC, id DESC`.
    return ids
      .map((id) => porId.get(id))
      .filter((header): header is ClinicalNoteHeaders => Boolean(header));
  }

  /**
   * Resuelve un lote de versiones por id, indexadas por id.
   *
   * El expediente muestra el texto de la versión vigente de cada nota: pedirlas
   * de a una sería N+1 sobre la tabla con más filas del módulo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Ids de versión a resolver.
   * @returns Mapa `id -> versión`.
   */
  async findVersionsByIds(
    em: EntityManager,
    ids: string[],
  ): Promise<Map<string, ClinicalNoteVersions>> {
    if (ids.length === 0) return new Map();
    const rows = await em.find(ClinicalNoteVersions, { id: { $in: ids } });
    return new Map(rows.map((row) => [row.id, row]));
  }

  /** Mayor `version_number` existente para una nota (0 si no hay versiones). */
  async maxVersionNumber(
    em: EntityManager,
    clinicalNoteId: string,
  ): Promise<number> {
    const rows = await em.find(
      ClinicalNoteVersions,
      { clinicalNoteId },
      {
        fields: ['versionNumber'],
        orderBy: { versionNumber: 'desc' },
        limit: 1,
      },
    );
    return rows.length ? rows[0].versionNumber : 0;
  }

  /** Firmas existentes de una versión (para validar cofirma sobre firma primaria). */
  findSignatures(
    em: EntityManager,
    versionId: string,
  ): Promise<ClinicalNoteSignatures[]> {
    return em.find(ClinicalNoteSignatures, {
      clinicalNoteVersionId: versionId,
    });
  }

  /**
   * Crea create header.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create header conforme al contrato `ClinicalNoteHeaders`.
   */
  createHeader(
    em: EntityManager,
    data: CreateNoteHeaderData,
  ): ClinicalNoteHeaders {
    return em.create(
      ClinicalNoteHeaders,
      {
        patientProfileId: data.patientProfileId,
        encounterId: data.encounterId,
        noteTypeConceptId: data.noteTypeConceptId,
        lifecycleStatusConceptId: data.lifecycleStatusConceptId,
        patientReleaseStatusConceptId: data.patientReleaseStatusConceptId,
        confidentialityConceptId: data.confidentialityConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create version conforme al contrato `ClinicalNoteVersions`.
   */
  createVersion(
    em: EntityManager,
    data: CreateNoteVersionData,
  ): ClinicalNoteVersions {
    return em.create(
      ClinicalNoteVersions,
      {
        clinicalNoteId: data.clinicalNoteId,
        versionNumber: data.versionNumber,
        authorProfileId: data.authorProfileId,
        statusConceptId: data.statusConceptId,
        chiefComplaintText: data.chiefComplaintText,
        subjectiveText: data.subjectiveText,
        objectiveText: data.objectiveText,
        assessmentText: data.assessmentText,
        planText: data.planText,
        supersedesVersionId: data.supersedesVersionId,
        amendmentReasonConceptId: data.amendmentReasonConceptId,
        amendmentReasonText: data.amendmentReasonText,
        releaseEligibilityConceptId: data.releaseEligibilityConceptId,
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  /**
   * Crea create signature.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create signature conforme al contrato `ClinicalNoteSignatures`.
   */
  createSignature(
    em: EntityManager,
    data: CreateSignatureData,
  ): ClinicalNoteSignatures {
    return em.create(
      ClinicalNoteSignatures,
      {
        clinicalNoteVersionId: data.clinicalNoteVersionId,
        signerProfileId: data.signerProfileId,
        signatureTypeConceptId: data.signatureTypeConceptId,
        signedContentHash: data.signedContentHash,
        certificateThumbprint: data.certificateThumbprint,
        signatureValueEncrypted: data.signatureValueEncrypted,
        signedAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Crea create release event.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create release event conforme al contrato `NoteReleaseEvents`.
   */
  createReleaseEvent(
    em: EntityManager,
    data: CreateReleaseEventData,
  ): NoteReleaseEvents {
    return em.create(
      NoteReleaseEvents,
      {
        clinicalNoteVersionId: data.clinicalNoteVersionId,
        actionConceptId: data.actionConceptId,
        patientProfileId: data.patientProfileId,
        resultingVisibilityConceptId: data.resultingVisibilityConceptId,
        reasonConceptId: data.reasonConceptId,
        policyVersion: data.policyVersion,
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  /**
   * Crea create exam finding.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create exam finding conforme al contrato `PhysicalExamFindings`.
   */
  createExamFinding(
    em: EntityManager,
    data: CreateExamFindingData,
  ): PhysicalExamFindings {
    return em.create(
      PhysicalExamFindings,
      {
        clinicalNoteVersionId: data.clinicalNoteVersionId,
        bodySystemConceptId: data.bodySystemConceptId,
        findingConceptId: data.findingConceptId,
        isNormal: data.isNormal,
        findingText: data.findingText,
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }
}
