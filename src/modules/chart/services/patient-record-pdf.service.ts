import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PreconditionFailedException,
  getCurrentTenantId,
  type AuthenticatedUser,
} from '../../../common';
import {
  AllergyIntolerancesRepository,
  ConditionsRepository,
  EncountersRepository,
  MedicationRequestsRepository,
} from '../../clinical/repositories';
import { CLIN } from '../../clinical/clinical.concepts';
import { CatalogConceptsRepository } from '../../terminology/repositories';
import type { CatalogConcepts } from '../../terminology/entities';
import { FilesRepository } from '../../common/repositories/files.repository';
import { PatientProfilesRepository } from '../../profiles/repositories/patient-profiles.repository';
import { PersonsRepository } from '../../profiles/repositories/persons.repository';
import { composePersonDisplayName } from '../../profiles/person-name';
import { DataAccessLogRepository } from '../../audit/repositories';
import { AUD } from '../../audit/audit.concepts';
import { ClinicalNotesRepository, DocumentsRepository } from '../repositories';
import { CHART } from '../chart.concepts';
import {
  dibujar,
  type EncounterPdfResult,
  type PapelDelEncuentro,
  type SeccionDelPapel,
} from './encounter-pdf.service';

/** Tope de filas por sección: el papel es un resumen oficial, no una exportación masiva. */
const SECTION_LIMIT = 500;
const SIN_DATOS = 'Sin datos registrados.';
const RESOURCE_TYPE = 'PATIENT_RECORD_PDF';
const PURPOSE = 'PATIENT_ACCESS';

/** Fecha en formato es-BO, o un guion si no se conoce. */
function formatDate(date: Date | null | undefined): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

/** «CÓDIGO — display» de un concepto, o un guion si no se resolvió. */
function conceptLabel(
  conceptsById: ReadonlyMap<string, CatalogConcepts>,
  conceptId: string | undefined,
): string {
  const concept = conceptId ? conceptsById.get(conceptId) : undefined;
  return concept ? `${concept.code} — ${concept.display}` : '—';
}

/**
 * BR-15 (CV-06, TX-32): la historia completa del titular como documento
 * emitido por la API (decisión D-BR15-01, opción a), sellado con un SHA-256
 * del contenido y con rastro en `audit.data_access_log`.
 *
 * Mismas reglas de recorte que `charts/me`: notas sólo por su versión
 * liberada, documentos sólo los visibles para el paciente. El titular sale
 * del claim de la sesión; ninguna ruta acepta un id de paciente.
 */
@Injectable()
export class PatientRecordPdfService {
  constructor(
    private readonly em: EntityManager,
    private readonly encountersRepo: EncountersRepository,
    private readonly conditionsRepo: ConditionsRepository,
    private readonly allergiesRepo: AllergyIntolerancesRepository,
    private readonly medicationRequestsRepo: MedicationRequestsRepository,
    private readonly notesRepo: ClinicalNotesRepository,
    private readonly documentsRepo: DocumentsRepository,
    private readonly catalogConceptsRepo: CatalogConceptsRepository,
    private readonly patientProfilesRepo: PatientProfilesRepository,
    private readonly personsRepo: PersonsRepository,
    private readonly filesRepo: FilesRepository,
    private readonly dataAccessLogRepo: DataAccessLogRepository,
  ) {}

  /**
   * Arma el PDF oficial de la historia del titular.
   *
   * @throws PreconditionFailedException si la sesión no tiene perfil de paciente (422).
   */
  async renderForPatient(
    actor: AuthenticatedUser,
  ): Promise<EncounterPdfResult> {
    const patientProfileId = actor.patientProfileId;
    if (!patientProfileId) {
      throw new PreconditionFailedException(
        'La sesión no tiene perfil de paciente asociado',
        { userId: actor.id },
      );
    }
    const em = this.em.fork();

    const [encounters, conditions, allergies, medications, headers, records] =
      await Promise.all([
        this.encountersRepo.findByPatient(em, patientProfileId, SECTION_LIMIT),
        this.conditionsRepo.findByPatient(em, patientProfileId, SECTION_LIMIT),
        this.allergiesRepo.findByPatient(em, patientProfileId, SECTION_LIMIT),
        this.medicationRequestsRepo.findByPatient(
          em,
          patientProfileId,
          SECTION_LIMIT,
        ),
        this.notesRepo.findHeadersByPatient(
          em,
          patientProfileId,
          SECTION_LIMIT,
        ),
        this.documentsRepo.findRecordsByPatient(
          em,
          patientProfileId,
          SECTION_LIMIT,
        ),
      ]);

    const closed = encounters.filter(
      (e) => e.statusConceptId === CLIN.ENCOUNTER_FINISHED && e.contentHash,
    );
    const released = headers.filter(
      (h) =>
        h.patientReleaseStatusConceptId === CHART.RELEASE_RELEASED &&
        h.currentReleasedVersionId,
    );
    const visibleDocs = records.filter(
      (r) => r.patientVisibilityConceptId === CHART.VISIBILITY_PATIENT_VISIBLE,
    );

    const versionsById = await this.notesRepo.findVersionsByIds(
      em,
      released.map((h) => h.currentReleasedVersionId as string),
    );
    const docFiles = await this.documentsRepo.findFilesForRecords(
      em,
      visibleDocs.map((r) => r.id),
    );
    const files = await Promise.all(
      docFiles.map((f) => this.filesRepo.findById(em, f.fileId)),
    );
    const fileNameById = new Map(
      files
        .filter((f): f is NonNullable<typeof f> => Boolean(f))
        .map((f) => [f.id, f.originalName ?? 'archivo adjunto']),
    );

    const conceptIds = new Set<string>();
    for (const c of conditions) conceptIds.add(c.codeConceptId);
    for (const a of allergies) conceptIds.add(a.substanceConceptId);
    for (const m of medications) conceptIds.add(m.medicationConceptId);
    const conceptsById = await this.catalogConceptsRepo.findByIds(em, [
      ...conceptIds,
    ]);

    const patientName = await this.resolvePatientName(em, patientProfileId);

    const orEmpty = (lines: string[]): string[] =>
      lines.length > 0 ? lines : [SIN_DATOS];
    const sections: SeccionDelPapel[] = [
      {
        titulo: 'Atenciones cerradas',
        lineas: orEmpty(
          closed.map(
            (e) =>
              `${formatDate(e.startAt)} — sello ${(e.contentHash as string).slice(0, 12)}`,
          ),
        ),
      },
      {
        titulo: 'Evoluciones liberadas',
        lineas: orEmpty(
          released.flatMap((h) => {
            const v = versionsById.get(h.currentReleasedVersionId as string);
            if (!v) return [];
            const lines: string[] = [];
            if (v.chiefComplaintText)
              lines.push(`Motivo: ${v.chiefComplaintText}`);
            if (v.subjectiveText) lines.push(`Subjetivo: ${v.subjectiveText}`);
            if (v.objectiveText) lines.push(`Objetivo: ${v.objectiveText}`);
            if (v.assessmentText) lines.push(`Evaluación: ${v.assessmentText}`);
            if (v.planText) lines.push(`Plan: ${v.planText}`);
            return lines;
          }),
        ),
      },
      {
        titulo: 'Diagnósticos',
        lineas: orEmpty(
          conditions.map((c) => conceptLabel(conceptsById, c.codeConceptId)),
        ),
      },
      {
        titulo: 'Alergias',
        lineas: orEmpty(
          allergies.map((a) =>
            conceptLabel(conceptsById, a.substanceConceptId),
          ),
        ),
      },
      {
        titulo: 'Prescripciones',
        lineas: orEmpty(
          medications.map((m) =>
            [
              conceptLabel(conceptsById, m.medicationConceptId),
              m.doseText,
              m.frequencyText,
            ]
              .filter(Boolean)
              .join(' · '),
          ),
        ),
      },
      {
        titulo: 'Documentos visibles',
        lineas: orEmpty(
          docFiles.map(
            (f) => `- ${fileNameById.get(f.fileId) ?? 'archivo adjunto'}`,
          ),
        ),
      },
    ];
    const header = [`Paciente: ${patientName}`];

    // El sello cubre el contenido, no el instante de emisión: dos descargas
    // sin cambios en la historia producen el mismo hash.
    const contentHash = createHash('sha256')
      .update(JSON.stringify({ header, sections }))
      .digest('hex');
    const paper: PapelDelEncuentro = {
      titulo: 'Historia clínica oficial',
      encabezado: header,
      secciones: sections,
      pie: `Sello digital: SHA-256 ${contentHash} · emitido el ${formatDate(new Date())}`,
      contentHash,
      encounterId: patientProfileId,
      metadataTitle: 'Historia clínica oficial del titular',
    };
    const buffer = await dibujar(paper);

    this.dataAccessLogRepo.record(em, {
      userId: actor.id,
      actionConceptId: AUD.ACTION_READ,
      patientProfileId,
      tenantId: getCurrentTenantId(),
      purpose: PURPOSE,
      resourceType: RESOURCE_TYPE,
      resourceId: patientProfileId,
      recordedByUserId: actor.id,
    });
    await em.flush();

    return { buffer, fileName: `historia-${patientProfileId}.pdf` };
  }

  private async resolvePatientName(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<string> {
    const profile = await this.patientProfilesRepo.findById(
      em,
      patientProfileId,
    );
    if (!profile) return 'Sin identificar';
    const person = await this.personsRepo.findById(em, profile.profileId);
    if (!person) return 'Sin identificar';
    return (
      person.displayName ??
      composePersonDisplayName(person) ??
      'Sin identificar'
    );
  }
}
