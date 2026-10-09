import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import PDFDocument from 'pdfkit';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  ConditionsRepository,
  EncountersRepository,
  MedicationRequestsRepository,
} from '../../clinical/repositories';
import type { Encounters } from '../../clinical/entities';
import { ClinicalReadService } from '../../clinical/services';
import { CLIN } from '../../clinical/clinical.concepts';
import type { CatalogConcepts } from '../../terminology/entities';
import { CatalogConceptsRepository } from '../../terminology/repositories';
import { FilesRepository } from '../../common/repositories/files.repository';
import { PatientProfilesRepository } from '../../profiles/repositories/patient-profiles.repository';
import { HealthPractitionerProfilesRepository } from '../../profiles/repositories/health-practitioner-profiles.repository';
import { PersonsRepository } from '../../profiles/repositories/persons.repository';
import type { Persons } from '../../profiles/entities';
import { composePersonDisplayName } from '../../profiles/person-name';
import {
  CarePlansRepository,
  ClinicalNotesRepository,
  DocumentsRepository,
} from '../repositories';
import type { ClinicalNoteHeaders, DocumentRecords } from '../entities';
// BR-15 (CL-31): la variante del titular filtra documentos visibles.
import { CHART } from '../chart.concepts';

/** Márgenes y medidas del PDF oficial del encuentro, en puntos. */
const PAGE_MARGIN = 50;
const TITLE_FONT_SIZE = 18;
const SECTION_FONT_SIZE = 13;
const BODY_FONT_SIZE = 10;
const FOOTER_FONT_SIZE = 8;
const SECTION_GAP_BEFORE = 14;
const LINE_GAP = 4;
const WITHOUT_DATA = 'Sin datos registrados.';
const UNIDENTIFIED = 'Sin identificar';

/** Resultado de renderizar el PDF: los bytes y el nombre sugerido de archivo. */
export interface EncounterPdfResult {
  buffer: Buffer;
  fileName: string;
}

/** Una sección del papel: un título y sus líneas ya formateadas para imprimir. */
export interface RoleSection {
  readonly titulo: string;
  readonly lineas: readonly string[];
}

/**
 * El contenido del PDF oficial, ya resuelto a texto plano — sin nada de
 * `pdfkit` todavía. Es lo que el spec assertúa directamente: cada campo es
 * la línea exacta que termina impresa, no una estructura que hay que
 * reinterpretar.
 */
export interface EncounterRole {
  readonly titulo: string;
  readonly encabezado: readonly string[];
  readonly secciones: readonly RoleSection[];
  readonly pie: string;
  readonly contentHash: string;
  readonly encounterId: string;
}

/** Fecha y hora en formato es-BO, o un guion si no se conoce. */
function formatDate(date: Date | null | undefined): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

/** Resuelve un `code_concept_id` a «CÓDIGO — display», o un guion si no está. */
function label(
  conceptsById: ReadonlyMap<string, CatalogConcepts>,
  conceptId: string | undefined,
): string {
  if (!conceptId) return '—';
  const concept = conceptsById.get(conceptId);
  if (!concept) return '—';
  return `${concept.code} — ${concept.display}`;
}

/** Los datos ya resueltos que `armarPapel` necesita para armar el texto. */
export interface RoleData {
  readonly encounterId: string;
  readonly startAt: Date | null;
  readonly endAt: Date | null;
  readonly patientName: string;
  readonly practitionerName: string;
  readonly notas: ReadonlyArray<{
    readonly version?: {
      readonly subjectiveText?: string;
      readonly objectiveText?: string;
      readonly assessmentText?: string;
      readonly planText?: string;
      readonly chiefComplaintText?: string;
    };
  }>;
  readonly conditions: ReadonlyArray<{ readonly codeConceptId: string }>;
  readonly medicationRequests: ReadonlyArray<{
    readonly medicationConceptId: string;
    readonly doseText?: string;
    readonly frequencyText?: string;
  }>;
  readonly conceptsById: ReadonlyMap<string, CatalogConcepts>;
  readonly carePlans: ReadonlyArray<{
    readonly goalText?: string;
    readonly activities: ReadonlyArray<{ readonly activityConceptId?: string }>;
  }>;
  readonly documents: ReadonlyArray<{
    readonly files: ReadonlyArray<{ readonly fileId: string }>;
  }>;
  readonly fileNamesById: ReadonlyMap<string, string>;
  readonly contentHash: string;
  readonly sealedAt: Date | null;
}

/**
 * Arma el contenido del papel — pura, sin `pdfkit` — para que el spec pueda
 * assertar sobre texto exacto sin depender de si `pdfkit` comprime el stream.
 */
export function buildRole(data: RoleData): EncounterRole {
  const header = [
    `Paciente: ${data.patientName}`,
    `Profesional: ${data.practitionerName}`,
    `Inicio: ${formatDate(data.startAt)}`,
    `Cierre: ${formatDate(data.endAt)}`,
  ];

  const notesLines = data.notas.flatMap(({ version }) => {
    if (!version) return [];
    const lineas: string[] = [];
    if (version.chiefComplaintText)
      lineas.push(`Motivo: ${version.chiefComplaintText}`);
    if (version.subjectiveText)
      lineas.push(`Subjetivo: ${version.subjectiveText}`);
    if (version.objectiveText)
      lineas.push(`Objetivo: ${version.objectiveText}`);
    if (version.assessmentText)
      lineas.push(`Evaluación: ${version.assessmentText}`);
    if (version.planText) lineas.push(`Plan: ${version.planText}`);
    return lineas;
  });

  const diagnosesLines = data.conditions.map(
    (condition) =>
      `CIE-10 ${label(data.conceptsById, condition.codeConceptId)}`,
  );

  const prescriptionsLines = data.medicationRequests.map((request) =>
    [
      label(data.conceptsById, request.medicationConceptId),
      request.doseText,
      request.frequencyText,
    ]
      .filter(Boolean)
      .join(' · '),
  );

  const linesPlan = data.carePlans.flatMap((plan) => {
    const lineas: string[] = [];
    if (plan.goalText) lineas.push(`Meta: ${plan.goalText}`);
    for (const activity of plan.activities) {
      lineas.push(
        `- ${label(data.conceptsById, activity.activityConceptId)}`,
      );
    }
    return lineas;
  });

  const documentsLines = data.documents.flatMap((documento) =>
    documento.files.map(
      (file) =>
        `- ${data.fileNamesById.get(file.fileId) ?? 'archivo adjunto'}`,
    ),
  );

  const sections: RoleSection[] = [
    {
      titulo: 'Notas de evolución',
      lineas: notesLines.length > 0 ? notesLines : [WITHOUT_DATA],
    },
    {
      titulo: 'Diagnósticos',
      lineas:
        diagnosesLines.length > 0 ? diagnosesLines : [WITHOUT_DATA],
    },
    {
      titulo: 'Prescripciones',
      lineas:
        prescriptionsLines.length > 0
          ? prescriptionsLines
          : [WITHOUT_DATA],
    },
    {
      titulo: 'Plan de cuidados',
      lineas: linesPlan.length > 0 ? linesPlan : [WITHOUT_DATA],
    },
    {
      titulo: 'Documentos',
      lineas: documentsLines.length > 0 ? documentsLines : [WITHOUT_DATA],
    },
  ];

  const pie = `Sello digital: SHA-256 ${data.contentHash} · sellado el ${formatDate(
    data.sealedAt,
  )} · cerrado por ${data.practitionerName}`;

  return {
    titulo: 'Encuentro clínico oficial',
    encabezado: header,
    secciones: sections,
    pie,
    contentHash: data.contentHash,
    encounterId: data.encounterId,
  };
}

/**
 * Dibuja el papel con `pdfkit`. Lo único de este archivo que toca la
 * librería: todo el contenido ya llega resuelto a texto en `papel`.
 */
export function draw(role: EncounterRole): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: PAGE_MARGIN,
      info: {
        Title: `Encuentro clínico oficial ${role.encounterId}`,
        Subject: 'Documento oficial de encuentro clínico cerrado',
        Keywords: `sello:${role.contentHash}`,
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(TITLE_FONT_SIZE).text(role.titulo);
    doc.moveDown(0.5);
    doc.fontSize(BODY_FONT_SIZE);
    for (const linea of role.encabezado) doc.text(linea);

    for (const section of role.secciones) {
      doc.moveDown(SECTION_GAP_BEFORE / 10);
      doc.fontSize(SECTION_FONT_SIZE).text(section.titulo);
      doc.moveDown(0.3);
      for (const linea of section.lineas) {
        doc.fontSize(BODY_FONT_SIZE).text(linea, { lineGap: LINE_GAP });
      }
    }

    doc.moveDown(SECTION_GAP_BEFORE / 10);
    doc.fontSize(FOOTER_FONT_SIZE).text(role.pie);

    doc.end();
  });
}

/**
 * Compone el PDF oficial de un encuentro cerrado (C.4): mismos bloques y
 * orden que el papel que el front ya imprime
 * (`shared/utils/clinical-pdf/` del repo del front), con el sello del cierre
 * impreso al pie y en los metadatos del documento.
 *
 * Autorización: no cuelga de `ClinicalRecordAccessGuard`: ese guard lee
 * `request.params.patientProfileId`, que esta ruta no tiene (`:id` es el
 * encuentro), así que sería un no-op. En su lugar resuelve el
 * `patientProfileId` del encuentro y llama a
 * `ClinicalReadService.assertPuedeLeerHistoria`, la misma pregunta que el
 * guard delega.
 */
@Injectable()
export class EncounterPdfService {
  constructor(
    private readonly em: EntityManager,
    private readonly encountersRepo: EncountersRepository,
    private readonly clinicalRead: ClinicalReadService,
    private readonly notesRepo: ClinicalNotesRepository,
    private readonly carePlansRepo: CarePlansRepository,
    private readonly documentsRepo: DocumentsRepository,
    private readonly conditionsRepo: ConditionsRepository,
    private readonly medicationRequestsRepo: MedicationRequestsRepository,
    private readonly catalogConceptsRepo: CatalogConceptsRepository,
    private readonly patientProfilesRepo: PatientProfilesRepository,
    private readonly practitionerProfilesRepo: HealthPractitionerProfilesRepository,
    private readonly personsRepo: PersonsRepository,
    private readonly filesRepo: FilesRepository,
  ) {}

  /**
   * Renderiza el PDF oficial de un encuentro cerrado.
   *
   * @throws ResourceNotFoundException si el encuentro no existe (404).
   * @throws ForbiddenException si el actor no puede leer la historia del
   *   paciente (403, delegado a `assertPuedeLeerHistoria`).
   * @throws PreconditionFailedException si el encuentro no está cerrado (422).
   */
  async render(
    encounterId: string,
    actor: AuthenticatedUser,
  ): Promise<EncounterPdfResult> {
    const em = this.em.fork();
    const encounter = await this.encountersRepo.findById(em, encounterId);
    if (!encounter) {
      throw new ResourceNotFoundException('Encuentro no encontrado', {
        encounterId,
      });
    }

    // El orden importa: 404 primero (el recurso no existe), 403 después (no
    // se puede leer la historia), 422 al final (existe, se puede leer, pero
    // todavía no tiene sello).
    await this.clinicalRead.assertCanReadHistory(
      encounter.patientProfileId,
      actor,
    );

    if (
      encounter.statusConceptId !== CLIN.ENCOUNTER_FINISHED ||
      !encounter.contentHash
    ) {
      throw new PreconditionFailedException('El encuentro no está cerrado', {
        encounterId,
        status: encounter.statusConceptId,
      });
    }

    return this.compose(em, encounter, encounterId, {
      versionIdOf: (header) => header.currentVersionId,
      documentFilter: () => true,
    });
  }

  /**
   * BR-15 (CL-31): variante del **titular** del mismo PDF oficial.
   *
   * Autorización propia, no `assertPuedeLeerHistoria`: el titular sale de la
   * sesión (`actor.patientProfileId`, patrón `forms-me.controller.ts`), nunca
   * de la ruta — el encuentro de otro paciente responde el mismo 404 que uno
   * inexistente (regla del titular fuera de la sesión, BR-15 §5).
   *
   * Reusa `componer()` con dos filtros que son la diferencia entera con
   * `render()`: las notas imprimen la versión **liberada**
   * (`currentReleasedVersionId`), nunca la vigente, y los documentos se
   * recortan a los visibles para el paciente
   * (`patientVisibilityConceptId === VISIBILITY_PATIENT_VISIBLE`). Todo lo
   * demás —diagnósticos, prescripciones, plan de cuidados— es el mismo
   * contenido que ya ve el titular en `/clinical/patients/:id/summary` y
   * `/charts/patients/:id/chart`.
   *
   * @throws ResourceNotFoundException si el encuentro no existe o no es del
   *   titular (404, mismo mensaje que "no existe").
   * @throws PreconditionFailedException si el encuentro no está cerrado (422).
   */
  async renderForPatient(
    encounterId: string,
    actor: AuthenticatedUser,
  ): Promise<EncounterPdfResult> {
    if (!actor.patientProfileId) {
      throw new ResourceNotFoundException('Encuentro no encontrado', {
        encounterId,
      });
    }
    const em = this.em.fork();
    const encounter = await this.encountersRepo.findById(em, encounterId);
    if (!encounter || encounter.patientProfileId !== actor.patientProfileId) {
      throw new ResourceNotFoundException('Encuentro no encontrado', {
        encounterId,
      });
    }

    if (
      encounter.statusConceptId !== CLIN.ENCOUNTER_FINISHED ||
      !encounter.contentHash
    ) {
      throw new PreconditionFailedException('El encuentro no está cerrado', {
        encounterId,
        status: encounter.statusConceptId,
      });
    }

    return this.compose(em, encounter, encounterId, {
      versionIdOf: (header) => header.currentReleasedVersionId,
      documentFilter: (document) =>
        document.patientVisibilityConceptId ===
        CHART.VISIBILITY_PATIENT_VISIBLE,
    });
  }

  /**
   * El cuerpo entero de "juntar los datos y dibujar el papel", común a
   * `render()` (médico, versión vigente, todos los documentos) y
   * `renderForPatient()` (titular, versión liberada, sólo documentos
   * visibles). La única diferencia entre ambos caminos son los dos filtros
   * de `opts`; nada de un flag booleano que ramifique el comportamiento
   * adentro de este método (BR-15 §5).
   */
  private async compose(
    em: EntityManager,
    encounter: Encounters,
    encounterId: string,
    opts: {
      versionIdOf: (header: ClinicalNoteHeaders) => string | undefined;
      documentFilter: (document: DocumentRecords) => boolean;
    },
  ): Promise<EncounterPdfResult> {
    const [headers, conditions, medicationRequests, carePlans, documentsAll] =
      await Promise.all([
        this.notesRepo.findHeadersByEncounter(em, encounterId),
        this.conditionsRepo.findByEncounter(em, encounterId),
        this.medicationRequestsRepo.findByEncounter(em, encounterId),
        this.carePlansRepo.findByEncounter(em, encounterId),
        this.documentsRepo.findByEncounter(em, encounterId),
      ]);
    const documents = documentsAll.filter(opts.documentFilter);

    const versionIds = headers
      .map((header) => opts.versionIdOf(header))
      .filter((id): id is string => Boolean(id));
    const versionsById = await this.notesRepo.findVersionsByIds(em, versionIds);

    // Un solo lote para todos los conceptos del papel: diagnósticos y
    // medicamentos, en la misma llamada (evita N+1 sobre el catálogo).
    const conceptIds = new Set<string>();
    for (const condition of conditions) conceptIds.add(condition.codeConceptId);
    for (const request of medicationRequests)
      conceptIds.add(request.medicationConceptId);
    const conceptsById = await this.catalogConceptsRepo.findByIds(em, [
      ...conceptIds,
    ]);

    const patientName = await this.resolvePatientName(
      em,
      encounter.patientProfileId,
    );
    const practitionerName = encounter.primaryPractitionerId
      ? await this.resolvePractitionerName(em, encounter.primaryPractitionerId)
      : UNIDENTIFIED;

    const fileIds = documents.flatMap((document) =>
      document.files.map((file) => file.fileId),
    );
    const files = await Promise.all(
      fileIds.map((fileId) => this.filesRepo.findById(em, fileId)),
    );
    const fileNamesById = new Map(
      files
        .filter((file): file is NonNullable<typeof file> => Boolean(file))
        .map((file) => [file.id, file.originalName ?? 'archivo adjunto']),
    );

    const role = buildRole({
      encounterId,
      startAt: encounter.startAt ?? null,
      endAt: encounter.endAt ?? null,
      patientName,
      practitionerName,
      notas: headers.map((header) => {
        const versionId = opts.versionIdOf(header);
        return {
          version: versionId ? versionsById.get(versionId) : undefined,
        };
      }),
      conditions,
      medicationRequests,
      conceptsById,
      carePlans,
      documents,
      fileNamesById,
      contentHash: encounter.contentHash!,
      sealedAt: encounter.sealedAt ?? null,
    });

    const buffer = await draw(role);

    return {
      buffer,
      fileName: `encuentro-${encounterId}.pdf`,
    };
  }

  /**
   * `patient_profiles.profile_id` es FK **directa** a `profiles.persons(id)`
   * (CTI: `*_profiles.profile_id == persons.id`, `<<PK,FK>>` en
   * `diagram_05_profiles.puml`) — no hay paso intermedio por
   * `person_profiles` (esa es una fila propia, con su propio `id`, que no
   * comparte uuid con `persons`).
   */
  private async resolvePatientName(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<string> {
    const patientProfile = await this.patientProfilesRepo.findById(
      em,
      patientProfileId,
    );
    if (!patientProfile) return UNIDENTIFIED;
    const person = await this.personsRepo.findById(
      em,
      patientProfile.profileId,
    );
    return this.displayNameOf(person) ?? UNIDENTIFIED;
  }

  /** Misma cadena que {@link resolvePatientName}, para el profesional. */
  private async resolvePractitionerName(
    em: EntityManager,
    practitionerProfileId: string,
  ): Promise<string> {
    const practitionerProfile = await this.practitionerProfilesRepo.findById(
      em,
      practitionerProfileId,
    );
    if (!practitionerProfile) return UNIDENTIFIED;
    const person = await this.personsRepo.findById(
      em,
      practitionerProfile.profileId,
    );
    return this.displayNameOf(person) ?? UNIDENTIFIED;
  }

  private displayNameOf(person: Persons | null): string | undefined {
    if (!person) return undefined;
    return person.displayName ?? composePersonDisplayName(person);
  }
}
