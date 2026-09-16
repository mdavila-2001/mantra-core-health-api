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

/** Márgenes y medidas del PDF oficial del encuentro, en puntos. */
const PAGE_MARGIN = 50;
const TITLE_FONT_SIZE = 18;
const SECTION_FONT_SIZE = 13;
const BODY_FONT_SIZE = 10;
const FOOTER_FONT_SIZE = 8;
const SECTION_GAP_BEFORE = 14;
const LINE_GAP = 4;
const SIN_DATOS = 'Sin datos registrados.';
const SIN_IDENTIFICAR = 'Sin identificar';

/** Resultado de renderizar el PDF: los bytes y el nombre sugerido de archivo. */
export interface EncounterPdfResult {
  buffer: Buffer;
  fileName: string;
}

/** Una sección del papel: un título y sus líneas ya formateadas para imprimir. */
export interface SeccionDelPapel {
  readonly titulo: string;
  readonly lineas: readonly string[];
}

/**
 * El contenido del PDF oficial, ya resuelto a texto plano — sin nada de
 * `pdfkit` todavía. Es lo que el spec assertúa directamente: cada campo es
 * la línea exacta que termina impresa, no una estructura que hay que
 * reinterpretar.
 */
export interface PapelDelEncuentro {
  readonly titulo: string;
  readonly encabezado: readonly string[];
  readonly secciones: readonly SeccionDelPapel[];
  readonly pie: string;
  readonly contentHash: string;
  readonly encounterId: string;
}

/** Fecha y hora en formato es-BO, o un guion si no se conoce. */
function formatearFecha(fecha: Date | null | undefined): string {
  if (!fecha) return '—';
  return new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(fecha);
}

/** Resuelve un `code_concept_id` a «CÓDIGO — display», o un guion si no está. */
function etiqueta(
  conceptsById: ReadonlyMap<string, CatalogConcepts>,
  conceptId: string | undefined,
): string {
  if (!conceptId) return '—';
  const concepto = conceptsById.get(conceptId);
  if (!concepto) return '—';
  return `${concepto.code} — ${concepto.display}`;
}

/** Los datos ya resueltos que `armarPapel` necesita para armar el texto. */
export interface DatosDelPapel {
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
export function armarPapel(datos: DatosDelPapel): PapelDelEncuentro {
  const encabezado = [
    `Paciente: ${datos.patientName}`,
    `Profesional: ${datos.practitionerName}`,
    `Inicio: ${formatearFecha(datos.startAt)}`,
    `Cierre: ${formatearFecha(datos.endAt)}`,
  ];

  const lineasDeNotas = datos.notas.flatMap(({ version }) => {
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

  const lineasDeDiagnosticos = datos.conditions.map(
    (condition) =>
      `CIE-10 ${etiqueta(datos.conceptsById, condition.codeConceptId)}`,
  );

  const lineasDePrescripciones = datos.medicationRequests.map((request) =>
    [
      etiqueta(datos.conceptsById, request.medicationConceptId),
      request.doseText,
      request.frequencyText,
    ]
      .filter(Boolean)
      .join(' · '),
  );

  const lineasDePlan = datos.carePlans.flatMap((plan) => {
    const lineas: string[] = [];
    if (plan.goalText) lineas.push(`Meta: ${plan.goalText}`);
    for (const activity of plan.activities) {
      lineas.push(
        `- ${etiqueta(datos.conceptsById, activity.activityConceptId)}`,
      );
    }
    return lineas;
  });

  const lineasDeDocumentos = datos.documents.flatMap((documento) =>
    documento.files.map(
      (file) =>
        `- ${datos.fileNamesById.get(file.fileId) ?? 'archivo adjunto'}`,
    ),
  );

  const secciones: SeccionDelPapel[] = [
    {
      titulo: 'Notas de evolución',
      lineas: lineasDeNotas.length > 0 ? lineasDeNotas : [SIN_DATOS],
    },
    {
      titulo: 'Diagnósticos',
      lineas:
        lineasDeDiagnosticos.length > 0 ? lineasDeDiagnosticos : [SIN_DATOS],
    },
    {
      titulo: 'Prescripciones',
      lineas:
        lineasDePrescripciones.length > 0
          ? lineasDePrescripciones
          : [SIN_DATOS],
    },
    {
      titulo: 'Plan de cuidados',
      lineas: lineasDePlan.length > 0 ? lineasDePlan : [SIN_DATOS],
    },
    {
      titulo: 'Documentos',
      lineas: lineasDeDocumentos.length > 0 ? lineasDeDocumentos : [SIN_DATOS],
    },
  ];

  const pie = `Sello digital: SHA-256 ${datos.contentHash} · sellado el ${formatearFecha(
    datos.sealedAt,
  )} · cerrado por ${datos.practitionerName}`;

  return {
    titulo: 'Encuentro clínico oficial',
    encabezado,
    secciones,
    pie,
    contentHash: datos.contentHash,
    encounterId: datos.encounterId,
  };
}

/**
 * Dibuja el papel con `pdfkit`. Lo único de este archivo que toca la
 * librería: todo el contenido ya llega resuelto a texto en `papel`.
 */
export function dibujar(papel: PapelDelEncuentro): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: PAGE_MARGIN,
      info: {
        Title: `Encuentro clínico oficial ${papel.encounterId}`,
        Subject: 'Documento oficial de encuentro clínico cerrado',
        Keywords: `sello:${papel.contentHash}`,
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(TITLE_FONT_SIZE).text(papel.titulo);
    doc.moveDown(0.5);
    doc.fontSize(BODY_FONT_SIZE);
    for (const linea of papel.encabezado) doc.text(linea);

    for (const seccion of papel.secciones) {
      doc.moveDown(SECTION_GAP_BEFORE / 10);
      doc.fontSize(SECTION_FONT_SIZE).text(seccion.titulo);
      doc.moveDown(0.3);
      for (const linea of seccion.lineas) {
        doc.fontSize(BODY_FONT_SIZE).text(linea, { lineGap: LINE_GAP });
      }
    }

    doc.moveDown(SECTION_GAP_BEFORE / 10);
    doc.fontSize(FOOTER_FONT_SIZE).text(papel.pie);

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
    await this.clinicalRead.assertPuedeLeerHistoria(
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

    const [headers, conditions, medicationRequests, carePlans, documents] =
      await Promise.all([
        this.notesRepo.findHeadersByEncounter(em, encounterId),
        this.conditionsRepo.findByEncounter(em, encounterId),
        this.medicationRequestsRepo.findByEncounter(em, encounterId),
        this.carePlansRepo.findByEncounter(em, encounterId),
        this.documentsRepo.findByEncounter(em, encounterId),
      ]);

    const versionIds = headers
      .map((header) => header.currentVersionId)
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
      : SIN_IDENTIFICAR;

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

    const papel = armarPapel({
      encounterId,
      startAt: encounter.startAt ?? null,
      endAt: encounter.endAt ?? null,
      patientName,
      practitionerName,
      notas: headers.map((header) => ({
        version: header.currentVersionId
          ? versionsById.get(header.currentVersionId)
          : undefined,
      })),
      conditions,
      medicationRequests,
      conceptsById,
      carePlans,
      documents,
      fileNamesById,
      contentHash: encounter.contentHash,
      sealedAt: encounter.sealedAt ?? null,
    });

    const buffer = await dibujar(papel);

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
    if (!patientProfile) return SIN_IDENTIFICAR;
    const person = await this.personsRepo.findById(
      em,
      patientProfile.profileId,
    );
    return this.displayNameOf(person) ?? SIN_IDENTIFICAR;
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
    if (!practitionerProfile) return SIN_IDENTIFICAR;
    const person = await this.personsRepo.findById(
      em,
      practitionerProfile.profileId,
    );
    return this.displayNameOf(person) ?? SIN_IDENTIFICAR;
  }

  private displayNameOf(person: Persons | null): string | undefined {
    if (!person) return undefined;
    return person.displayName ?? composePersonDisplayName(person);
  }
}
