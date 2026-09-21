import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import PDFDocument from 'pdfkit';
import {
  CONCEPTS,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  ConditionsRepository,
  MedicationRequestsRepository,
} from '../repositories';
import { ClinicalReadService } from './clinical-read.service';
import { CLIN } from '../clinical.concepts';
import { PROF } from '../../profiles/profiles.concepts';
import type { CatalogConcepts } from '../../terminology/entities';
import { CatalogConceptsRepository } from '../../terminology/repositories';
import { IdentifiersRepository } from '../../common/repositories';
import { PatientProfilesRepository } from '../../profiles/repositories/patient-profiles.repository';
import { HealthPractitionerProfilesRepository } from '../../profiles/repositories/health-practitioner-profiles.repository';
import { PersonsRepository } from '../../profiles/repositories/persons.repository';
import { PractitionerSpecialtiesRepository } from '../../profiles/repositories/practitioner-specialties.repository';
import { JurisdictionAuthorizationsRepository } from '../../profiles/repositories/jurisdiction-authorizations.repository';
import type { Persons } from '../../profiles/entities';
import { composePersonDisplayName } from '../../profiles/person-name';
import { DeclaredCoveragesReader } from '../../insurance/services/declared-coverages-reader';
import type { OwnCoverageDto } from '../../profiles/dto/read-patients.dto';
import { loadAgendaNoticesEnv } from '../../scheduling/notices/agenda-notices.env';
import { dibujarMarcaAlovida, altoDeMarca } from './alovida-mark';
import { dibujarQr } from './prescription-qr';
import { computePrescriptionHash } from './prescription-seal';
import type { MedicationRequests } from '../entities';

/** Márgenes y medidas del PDF oficial de la receta, en puntos. */
const PAGE_MARGIN = 50;
const TITLE_FONT_SIZE = 18;
const SECTION_FONT_SIZE = 13;
const BODY_FONT_SIZE = 10;
const FOOTER_FONT_SIZE = 8;
const LINE_GAP = 4;
const SIN_DATOS = 'Sin datos registrados.';
const SIN_IDENTIFICAR = 'Sin identificar';
const SIN_DATO = '—';

/** El color petróleo de marca, para el isotipo del membrete. */
const COLOR_MARCA: readonly [number, number, number] = [0x0b, 0x3d, 0x4d];

/** Resultado de renderizar el PDF: los bytes y el nombre sugerido de archivo. */
export interface PrescriptionPdfResult {
  buffer: Buffer;
  fileName: string;
}

/** Una sección del papel: un título y sus líneas ya formateadas para imprimir. */
export interface SeccionDeLaReceta {
  readonly titulo: string;
  readonly lineas: readonly string[];
}

/**
 * El contenido del PDF oficial, ya resuelto a texto plano — sin nada de
 * `pdfkit` todavía. Es lo que el spec asertúa directamente: cada campo es la
 * línea exacta que termina impresa, no una estructura que hay que
 * reinterpretar.
 */
export interface PapelDeReceta {
  readonly titulo: string;
  readonly encabezado: readonly string[];
  readonly secciones: readonly SeccionDeLaReceta[];
  readonly pie: string;
  readonly contentHash: string;
  readonly requestId: string;
  readonly qrUrl: string;
  /** El asunto del documento (metadatos del PDF): distingue oficial de copia. */
  readonly subject: string;
  /** Si está definida, el papel lleva marca de agua con este texto. */
  readonly marcaDeAgua?: string;
}

/** Fecha en formato es-BO, o un guion si no se conoce. */
function formatearFecha(fecha: Date | null | undefined): string {
  if (!fecha) return SIN_DATO;
  return new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium' }).format(
    fecha,
  );
}

/** Resuelve un `*_concept_id` a «CÓDIGO — display», o un guion si no está. */
function etiqueta(
  conceptsById: ReadonlyMap<string, CatalogConcepts>,
  conceptId: string | undefined | null,
): string {
  if (!conceptId) return SIN_DATO;
  const concepto = conceptsById.get(conceptId);
  if (!concepto) return SIN_DATO;
  return `${concepto.code} — ${concepto.display}`;
}

/** Edad en años cumplidos, a partir de la fecha de nacimiento. */
function edadEnAnios(nacimiento: Date | undefined, ahora: Date): string {
  if (!nacimiento) return SIN_DATO;
  let anios = ahora.getUTCFullYear() - nacimiento.getUTCFullYear();
  const noCumplioAun =
    ahora.getUTCMonth() < nacimiento.getUTCMonth() ||
    (ahora.getUTCMonth() === nacimiento.getUTCMonth() &&
      ahora.getUTCDate() < nacimiento.getUTCDate());
  if (noCumplioAun) anios -= 1;
  return `${anios} años`;
}

/**
 * La sigla del departamento (LP, SC…), extraída de `catalog_concepts.code`
 * (`geo:bo:department:<sigla>`, ver `bo-geography.catalog.ts`).
 */
function siglaDeDepartamento(
  conceptsById: ReadonlyMap<string, CatalogConcepts>,
  conceptId: string | undefined,
): string | undefined {
  if (!conceptId) return undefined;
  const codigo = conceptsById.get(conceptId)?.code;
  if (!codigo) return undefined;
  return codigo.split(':').pop();
}

/** ¿Este estado es un documento oficial (sellado, sin marca de agua)? */
function esEstadoOficial(statusConceptId: string): boolean {
  return (
    statusConceptId === CLIN.MEDICATION_REQUEST_ISSUED ||
    statusConceptId === CLIN.MEDICATION_REQUEST_COMPLETED
  );
}

/** Lo mínimo del estado de una receta que decide su marca de agua y asunto. */
interface EstadoDeLaReceta {
  readonly statusConceptId: string;
  readonly statusReasonText?: string;
}

/** La etiqueta legible de un estado de receta, para el verify público. */
export type PrescriptionStatusLabel =
  'DRAFT' | 'ISSUED' | 'COMPLETED' | 'INVALIDATED' | 'REPLACED';

/**
 * Traduce el `status_concept_id` a la etiqueta que expone el verify público.
 *
 * `RENEWED`/`ACTIVE` existen en `CLIN` pero ninguna transición de
 * `MedicationsService` los asigna hoy; si alguna vez aparecieran, caen en
 * `'ISSUED'` — el estado con más consecuencias equivocarse hacia "sí es
 * válida" sería DRAFT, y ninguno de los dos es ese.
 */
function etiquetaDeEstado(statusConceptId: string): PrescriptionStatusLabel {
  switch (statusConceptId) {
    case CLIN.MEDICATION_REQUEST_DRAFT:
      return 'DRAFT';
    case CLIN.MEDICATION_REQUEST_COMPLETED:
      return 'COMPLETED';
    case CLIN.MEDICATION_REQUEST_INVALIDATED:
      return 'INVALIDATED';
    case CLIN.MEDICATION_REQUEST_REPLACED:
      return 'REPLACED';
    default:
      return 'ISSUED';
  }
}

/** La matrícula del profesional, tal como la ve el verify público. */
export interface PrescriberLicense {
  readonly number: string;
  readonly authority: string | null;
  readonly state: 'ACTIVE' | 'PENDING';
}

/** Lo que responde `GET /public/prescriptions/:id/verify` — sin PHI. */
export interface PrescriptionVerificationResult {
  readonly id: string;
  readonly status: PrescriptionStatusLabel;
  readonly issuedAt: Date | null;
  readonly contentHash: string | null;
  readonly prescriberLicense: PrescriberLicense | null;
}

/**
 * Texto de la marca de agua para un estado no oficial, o `undefined` si el
 * estado no la necesita.
 *
 * DRAFT es un borrador todavía editable (`editDraft`): «copia de trabajo».
 * INVALIDATED/REPLACED son inmutables pero dejaron de servir: «sin validez»,
 * con el motivo si el profesional lo declaró (`statusReasonText`).
 */
function marcaDeAguaPara(estado: EstadoDeLaReceta): string | undefined {
  if (estado.statusConceptId === CLIN.MEDICATION_REQUEST_DRAFT) {
    return 'COPIA DE TRABAJO - SIN VALIDEZ FARMACÉUTICA';
  }
  if (esEstadoOficial(estado.statusConceptId)) return undefined;
  const motivo = estado.statusReasonText ? ` — ${estado.statusReasonText}` : '';
  return `SIN VALIDEZ FARMACÉUTICA${motivo}`;
}

/** El asunto del documento: lo que un lector ve en las propiedades del PDF. */
function subjectPara(estado: EstadoDeLaReceta): string {
  if (estado.statusConceptId === CLIN.MEDICATION_REQUEST_DRAFT) {
    return 'Copia de trabajo — sin validez farmacéutica';
  }
  if (esEstadoOficial(estado.statusConceptId)) {
    return 'Receta médica oficial';
  }
  return 'Receta sin validez farmacéutica';
}

/** Los datos ya resueltos que {@link armarReceta} necesita para armar el texto. */
export interface DatosDeLaReceta {
  readonly requestId: string;
  readonly status: string;
  readonly statusReasonText?: string;
  readonly createdAt: Date;
  readonly signedAt?: Date;
  readonly issuedAt?: Date;
  readonly patientName: string;
  readonly patientDocument?: string;
  readonly patientDocumentArea?: string;
  readonly patientBirthDate?: Date;
  readonly practitionerName: string;
  readonly practitionerTitle?: string;
  readonly specialtyConceptId?: string;
  readonly licenseNumber?: string;
  readonly regulatoryAuthority?: string;
  readonly licenseVerified: boolean;
  readonly hasLicense: boolean;
  readonly medicationConceptId: string;
  readonly substanceAtcConceptId?: string;
  readonly routeConceptId?: string;
  readonly doseText?: string;
  readonly frequencyText?: string;
  readonly quantityDecimal?: string;
  readonly unitConceptId?: string;
  readonly validFrom?: Date;
  readonly validTo?: Date;
  readonly patientInstructionsText?: string;
  readonly indicationCodeConceptId?: string;
  readonly coverages: readonly OwnCoverageDto[];
  readonly conceptsById: ReadonlyMap<string, CatalogConcepts>;
  readonly contentHash: string;
  readonly qrUrl: string;
  readonly ahora: Date;
}

/**
 * Arma el contenido de la receta — pura, sin `pdfkit` — para que el spec
 * pueda asertar sobre texto exacto sin depender de si `pdfkit` comprime el
 * stream. Mismo patrón que `EncounterPdfService.armarPapel`.
 */
export function armarReceta(datos: DatosDeLaReceta): PapelDeReceta {
  const encabezado = [
    `Folio: ${datos.requestId}`,
    `Fecha: ${formatearFecha(datos.issuedAt ?? datos.createdAt)}`,
  ];

  const estadoMatricula = datos.hasLicense
    ? datos.licenseVerified
      ? 'verificada'
      : 'declarada, pendiente de verificación'
    : undefined;
  const lineasMedico = [
    `Nombre: ${datos.practitionerTitle ? `${datos.practitionerTitle} ` : ''}${datos.practitionerName}`,
    `Especialidad: ${etiqueta(datos.conceptsById, datos.specialtyConceptId)}`,
    datos.hasLicense
      ? `Matrícula: ${datos.licenseNumber}${
          datos.regulatoryAuthority ? ` · ${datos.regulatoryAuthority}` : ''
        } (${estadoMatricula})`
      : 'Matrícula: sin registrar',
    ...(datos.signedAt ? [`Firmada el ${formatearFecha(datos.signedAt)}`] : []),
  ];

  const documento = datos.patientDocument
    ? `${datos.patientDocument}${
        datos.patientDocumentArea ? ` ${datos.patientDocumentArea}` : ''
      }`
    : SIN_DATO;
  const lineasPaciente = [
    `Nombre: ${datos.patientName}`,
    `Documento: ${documento}`,
    `Edad: ${edadEnAnios(datos.patientBirthDate, datos.ahora)}`,
    `Fecha de nacimiento: ${formatearFecha(datos.patientBirthDate)}`,
  ];

  const lineasMedicamento = [
    `Medicamento: ${etiqueta(datos.conceptsById, datos.medicationConceptId)}`,
    ...(datos.substanceAtcConceptId
      ? [
          `Sustancia (ATC): ${etiqueta(datos.conceptsById, datos.substanceAtcConceptId)}`,
        ]
      : []),
    `Vía: ${etiqueta(datos.conceptsById, datos.routeConceptId)}`,
    `Dosis: ${datos.doseText ?? SIN_DATO}`,
    `Frecuencia: ${datos.frequencyText ?? SIN_DATO}`,
    `Cantidad: ${
      datos.quantityDecimal
        ? `${datos.quantityDecimal} ${etiqueta(datos.conceptsById, datos.unitConceptId)}`
        : SIN_DATO
    }`,
    `Vigencia: ${formatearFecha(datos.validFrom)} — ${formatearFecha(datos.validTo)}`,
    ...(datos.indicationCodeConceptId
      ? [
          `Indicación: ${etiqueta(datos.conceptsById, datos.indicationCodeConceptId)}`,
        ]
      : []),
    `Instrucciones al paciente: ${datos.patientInstructionsText ?? SIN_DATOS}`,
  ];

  const coberturasVigentes = [...datos.coverages].sort((a, b) =>
    a.validityStatus === b.validityStatus
      ? 0
      : a.validityStatus === 'CURRENT'
        ? -1
        : 1,
  );
  const lineasCobertura = coberturasVigentes.flatMap((cobertura) => {
    const encabezadoCobertura = `${cobertura.carrierName}${
      cobertura.planName ? ` · ${cobertura.planName}` : ''
    } (${cobertura.verified ? 'verificada' : 'declarada'} · ${cobertura.validityStatus})`;
    const beneficios = cobertura.benefits
      .filter((beneficio) => beneficio.validityStatus === 'CURRENT')
      .map((beneficio) => {
        const partes = [
          beneficio.categoryName ?? 'Beneficio',
          beneficio.coveragePercent
            ? `cobertura ${beneficio.coveragePercent} %`
            : undefined,
          beneficio.copayAmount
            ? `copago ${beneficio.copayAmount} ${cobertura.currencyCode ?? ''}`.trim()
            : undefined,
        ].filter((parte): parte is string => Boolean(parte));
        return `- ${partes.join(' · ')}`;
      });
    return [encabezadoCobertura, ...beneficios];
  });

  const secciones: SeccionDeLaReceta[] = [
    { titulo: 'Profesional', lineas: lineasMedico },
    { titulo: 'Paciente', lineas: lineasPaciente },
    { titulo: 'Detalle farmacológico', lineas: lineasMedicamento },
    {
      titulo: 'Cobertura de seguro',
      lineas:
        lineasCobertura.length > 0
          ? lineasCobertura
          : ['Sin seguro vinculado en AloVida'],
    },
  ];

  const pie = `Sello digital: SHA-256 ${datos.contentHash} · verificar en ${datos.qrUrl}`;

  return {
    titulo: 'Receta médica',
    encabezado,
    secciones,
    pie,
    contentHash: datos.contentHash,
    requestId: datos.requestId,
    qrUrl: datos.qrUrl,
    subject: subjectPara({
      statusConceptId: datos.status,
      statusReasonText: datos.statusReasonText,
    }),
    marcaDeAgua: marcaDeAguaPara({
      statusConceptId: datos.status,
      statusReasonText: datos.statusReasonText,
    }),
  };
}

/**
 * Dibuja el papel con `pdfkit`. Lo único de este archivo que toca la
 * librería: todo el contenido ya llega resuelto a texto en `papel`.
 */
export function dibujar(papel: PapelDeReceta): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: PAGE_MARGIN,
      info: {
        Title: `Receta médica ${papel.requestId}`,
        Subject: papel.subject,
        Keywords: `sello:${papel.contentHash}`,
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Membrete: isotipo + título, arriba a la izquierda.
    const anchoMarca = 36;
    dibujarMarcaAlovida(doc, {
      x: PAGE_MARGIN,
      y: PAGE_MARGIN,
      ancho: anchoMarca,
      color: COLOR_MARCA,
    });
    doc
      .fontSize(TITLE_FONT_SIZE)
      .text(papel.titulo, PAGE_MARGIN + anchoMarca + 12, PAGE_MARGIN + 4);
    doc.moveDown(0.5);
    doc.y =
      PAGE_MARGIN + Math.max(altoDeMarca(anchoMarca), TITLE_FONT_SIZE) + 12;

    doc.fontSize(BODY_FONT_SIZE);
    for (const linea of papel.encabezado) doc.text(linea);

    for (const seccion of papel.secciones) {
      doc.moveDown(1);
      doc.fontSize(SECTION_FONT_SIZE).text(seccion.titulo);
      doc.moveDown(0.3);
      for (const linea of seccion.lineas) {
        doc.fontSize(BODY_FONT_SIZE).text(linea, { lineGap: LINE_GAP });
      }
    }

    // Marca de agua: una diagonal traslúcida, si el documento no es oficial.
    if (papel.marcaDeAgua) {
      doc.save();
      doc.opacity(0.18);
      doc.fillColor('#c0392b');
      doc.fontSize(36);
      doc.rotate(-35, { origin: [doc.page.width / 2, doc.page.height / 2] });
      doc.text(papel.marcaDeAgua, 0, doc.page.height / 2 - 20, {
        align: 'center',
        width: doc.page.width,
      });
      doc.restore();
    }

    // Sello y QR al pie de la última página.
    const piePosY = doc.page.height - PAGE_MARGIN - 90;
    doc.fontSize(FOOTER_FONT_SIZE).fillColor('#000000');
    doc.text(papel.pie, PAGE_MARGIN, piePosY, {
      width: doc.page.width - PAGE_MARGIN * 2 - 100,
    });
    dibujarQr(
      doc,
      papel.qrUrl,
      doc.page.width - PAGE_MARGIN - 90,
      piePosY - 10,
      90,
    );

    doc.end();
  });
}

/**
 * Compone el PDF oficial de una receta (subtarea B.3).
 *
 * Autorización: no cuelga de `ClinicalRecordAccessGuard` — ese guard lee
 * `request.params.patientProfileId`, que esta ruta no tiene (`:id` es la
 * receta), así que sería un no-op. En su lugar: el propio prescriptor pasa
 * siempre (sin depender del turno de hoy), y quien no lo es pasa por
 * `ClinicalReadService.assertPuedeLeerHistoria` — titular, tutor (B.1),
 * quien atiende hoy o con relación vigente, y `SUPERADMIN`.
 */
@Injectable()
export class PrescriptionPdfService {
  constructor(
    private readonly em: EntityManager,
    private readonly requestsRepo: MedicationRequestsRepository,
    private readonly clinicalRead: ClinicalReadService,
    private readonly conditionsRepo: ConditionsRepository,
    private readonly catalogConceptsRepo: CatalogConceptsRepository,
    private readonly patientProfilesRepo: PatientProfilesRepository,
    private readonly practitionerProfilesRepo: HealthPractitionerProfilesRepository,
    private readonly personsRepo: PersonsRepository,
    private readonly specialtiesRepo: PractitionerSpecialtiesRepository,
    private readonly jurisdictionAuthorizationsRepo: JurisdictionAuthorizationsRepository,
    private readonly identifiersRepo: IdentifiersRepository,
    private readonly declaredCoverages: DeclaredCoveragesReader,
  ) {}

  /**
   * Renderiza el PDF oficial de una receta.
   *
   * @throws ResourceNotFoundException si la receta no existe (404, antes de
   *   cualquier chequeo de autorización).
   * @throws ForbiddenException si el actor no puede leer esta receta (403,
   *   delegado a `assertPuedeLeerHistoria`).
   */
  async render(
    requestId: string,
    actor: AuthenticatedUser,
  ): Promise<PrescriptionPdfResult> {
    const em = this.em.fork();
    const request = await this.requestsRepo.findById(em, requestId);
    if (!request) {
      throw new ResourceNotFoundException('Receta no encontrada', {
        requestId,
      });
    }

    await this.assertPuedeVerLaReceta(request, actor);

    const ahora = new Date();
    const [patientName, patientDoc, medico, coverages, indicationCondition] =
      await Promise.all([
        this.resolvePatientName(em, request.patientProfileId),
        this.resolvePatientDocument(em, request.patientProfileId),
        request.prescriberProfileId
          ? this.resolvePractitioner(em, request.prescriberProfileId)
          : Promise.resolve(undefined),
        this.declaredCoverages.read(em, request.patientProfileId),
        request.indicationConditionId
          ? this.conditionsRepo.findById(em, request.indicationConditionId)
          : Promise.resolve(null),
      ]);

    const patientBirthDate = await this.resolvePatientBirthDate(
      em,
      request.patientProfileId,
    );

    const conceptIds = new Set<string>([request.medicationConceptId]);
    if (request.substanceAtcConceptId)
      conceptIds.add(request.substanceAtcConceptId);
    if (request.routeConceptId) conceptIds.add(request.routeConceptId);
    if (request.unitConceptId) conceptIds.add(request.unitConceptId);
    if (medico?.specialtyConceptId) conceptIds.add(medico.specialtyConceptId);
    if (patientDoc?.issuerAdministrativeAreaConceptId)
      conceptIds.add(patientDoc.issuerAdministrativeAreaConceptId);
    if (indicationCondition) conceptIds.add(indicationCondition.codeConceptId);
    const conceptsById = await this.catalogConceptsRepo.findByIds(em, [
      ...conceptIds,
    ]);

    const contentHash = computePrescriptionHash(request);
    const { webAppBaseUrl } = loadAgendaNoticesEnv();
    const qrUrl = `${webAppBaseUrl}/verify/rx/${request.id}`;

    const papel = armarReceta({
      requestId: request.id,
      status: request.statusConceptId,
      statusReasonText: request.statusReasonText,
      createdAt: request.createdAt,
      signedAt: request.signedAt,
      issuedAt: request.issuedAt,
      patientName,
      patientDocument: patientDoc?.value,
      patientDocumentArea: siglaDeDepartamento(
        conceptsById,
        patientDoc?.issuerAdministrativeAreaConceptId,
      ),
      patientBirthDate,
      practitionerName: medico?.name ?? SIN_IDENTIFICAR,
      practitionerTitle: medico?.professionalTitle,
      specialtyConceptId: medico?.specialtyConceptId,
      licenseNumber: medico?.licenseNumber,
      regulatoryAuthority: medico?.regulatoryAuthority,
      licenseVerified: medico?.licenseState === PROF.AUTH_ACTIVE,
      hasLicense: Boolean(medico?.licenseNumber),
      medicationConceptId: request.medicationConceptId,
      substanceAtcConceptId: request.substanceAtcConceptId,
      routeConceptId: request.routeConceptId,
      doseText: request.doseText,
      frequencyText: request.frequencyText,
      quantityDecimal: request.quantityDecimal,
      unitConceptId: request.unitConceptId,
      validFrom: request.validFrom,
      validTo: request.validTo,
      patientInstructionsText: request.patientInstructionsText,
      indicationCodeConceptId: indicationCondition?.codeConceptId,
      coverages,
      conceptsById,
      contentHash,
      qrUrl,
      ahora,
    });

    const buffer = await dibujar(papel);
    return { buffer, fileName: `receta-${request.id}.pdf` };
  }

  /**
   * Lo mínimo para verificar la autenticidad de una receta **sin exponer
   * PHI** (`GET /public/prescriptions/:id/verify`, B.3): ni nombre de
   * paciente, ni medicamento, ni nombre del profesional. Recalcula el hash
   * en vez de confiar en uno persistido — no hay ninguno: la fila es la
   * única fuente de verdad.
   *
   * `contentHash` viaja `null` mientras la receta está en DRAFT: un
   * borrador todavía se edita (`editDraft`), así que el hash cambiaría en
   * cada guardado y publicarlo confundiría más de lo que aclara.
   *
   * @throws ResourceNotFoundException si la receta no existe.
   */
  async verify(requestId: string): Promise<PrescriptionVerificationResult> {
    const em = this.em.fork();
    const request = await this.requestsRepo.findById(em, requestId);
    if (!request) {
      throw new ResourceNotFoundException('Receta no encontrada', {
        requestId,
      });
    }

    const licencia = request.prescriberProfileId
      ? await this.resolvePrescriberLicense(em, request.prescriberProfileId)
      : null;

    return {
      id: request.id,
      status: etiquetaDeEstado(request.statusConceptId),
      issuedAt: request.issuedAt ?? null,
      contentHash:
        request.statusConceptId === CLIN.MEDICATION_REQUEST_DRAFT
          ? null
          : computePrescriptionHash(request),
      prescriberLicense: licencia,
    };
  }

  /** La matrícula nacional del profesional, sin su nombre ni su especialidad. */
  private async resolvePrescriberLicense(
    em: EntityManager,
    practitionerProfileId: string,
  ): Promise<PrescriberLicense | null> {
    const authorizations =
      await this.jurisdictionAuthorizationsRepo.findByPractitioner(
        em,
        practitionerProfileId,
      );
    const matricula = authorizations.find(
      (auth) => auth.jurisdictionConceptId === PROF.JURISDICTION_NATIONAL,
    );
    if (!matricula) return null;
    return {
      number: matricula.licenseNumber,
      authority: matricula.regulatoryAuthority ?? null,
      state:
        matricula.stateConceptId === PROF.AUTH_ACTIVE ? 'ACTIVE' : 'PENDING',
    };
  }

  /**
   * El prescriptor pasa siempre; el resto, por la misma puerta que el
   * expediente clínico.
   */
  private async assertPuedeVerLaReceta(
    request: MedicationRequests,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (
      actor.practitionerProfileId &&
      request.prescriberProfileId === actor.practitionerProfileId
    ) {
      return;
    }
    await this.clinicalRead.assertPuedeLeerHistoria(
      request.patientProfileId,
      actor,
    );
  }

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

  private async resolvePatientBirthDate(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<Date | undefined> {
    const patientProfile = await this.patientProfilesRepo.findById(
      em,
      patientProfileId,
    );
    if (!patientProfile) return undefined;
    const person = await this.personsRepo.findById(
      em,
      patientProfile.profileId,
    );
    return person?.birthDate ?? undefined;
  }

  /** El documento de identidad vigente del paciente, si lo declaró. */
  private async resolvePatientDocument(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<{
    value: string;
    issuerAdministrativeAreaConceptId?: string;
  } | null> {
    const patientProfile = await this.patientProfilesRepo.findById(
      em,
      patientProfileId,
    );
    if (!patientProfile) return null;
    const identificadores = await this.identifiersRepo.findCurrentByOwner(
      em,
      patientProfile.profileId,
    );
    const documento = identificadores.find(
      (fila) => fila.typeConceptId === CONCEPTS.ID_TYPE_NATIONAL,
    );
    if (!documento) return null;
    return {
      value: documento.value,
      issuerAdministrativeAreaConceptId:
        documento.issuerAdministrativeAreaConceptId,
    };
  }

  /** Nombre, especialidad y matrícula del profesional que prescribió. */
  private async resolvePractitioner(
    em: EntityManager,
    practitionerProfileId: string,
  ): Promise<{
    name: string;
    professionalTitle?: string;
    specialtyConceptId?: string;
    licenseNumber?: string;
    regulatoryAuthority?: string;
    licenseState?: string;
  } | null> {
    const practitionerProfile = await this.practitionerProfilesRepo.findById(
      em,
      practitionerProfileId,
    );
    if (!practitionerProfile) return null;
    const [person, specialties, authorizations] = await Promise.all([
      this.personsRepo.findById(em, practitionerProfile.profileId),
      this.specialtiesRepo.findAllByPractitioner(em, practitionerProfileId),
      this.jurisdictionAuthorizationsRepo.findByPractitioner(
        em,
        practitionerProfileId,
      ),
    ]);
    const matricula = authorizations.find(
      (auth) => auth.jurisdictionConceptId === PROF.JURISDICTION_NATIONAL,
    );
    return {
      name: this.displayNameOf(person) ?? SIN_IDENTIFICAR,
      professionalTitle: practitionerProfile.professionalTitle,
      specialtyConceptId: specialties[0]?.specialtyConceptId,
      licenseNumber: matricula?.licenseNumber,
      regulatoryAuthority: matricula?.regulatoryAuthority,
      licenseState: matricula?.stateConceptId,
    };
  }

  private displayNameOf(person: Persons | null): string | undefined {
    if (!person) return undefined;
    return person.displayName ?? composePersonDisplayName(person);
  }
}
