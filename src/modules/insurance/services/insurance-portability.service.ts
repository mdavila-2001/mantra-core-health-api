import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { createHash, randomUUID } from 'node:crypto';
import {
  CONCEPTS,
  ResourceNotFoundException,
  SEED,
  type AuthenticatedUser,
} from '../../../common';
import { sumarDecimales } from '../../../common/money/decimal-money';
import { CatalogRepository } from '../repositories';
import { InsurancePortabilityRepository } from '../repositories/insurance-portability.repository';
import type {
  PortabilityClaimLineRow,
  PortabilityConditionRow,
  PortabilityEncounterRow,
  PortabilityPolicyRow,
} from '../repositories/insurance-portability.repository';
import { INS } from '../insurance.concepts';
import { resolveInsuranceCurrencyCode } from '../insurance-currency';
import { ProfileOwnershipService } from '../../profiles/services/profile-ownership.service';
import {
  PatientProfilesRepository,
  PersonsRepository,
} from '../../profiles/repositories';
import { IdentifiersRepository } from '../../common/repositories';
import { composePersonDisplayName } from '../../profiles/person-name';
import { CatalogConcepts } from '../../terminology/entities';
import { FileUploadService } from '../../common/services';
import { FileCategory, FileSensitivity } from '../../common/dto';
import { DataReleaseRepository } from '../../health_data/repositories/data-release.repository';
import { HealthProvenanceRepository } from '../../health_data/repositories/health-provenance.repository';
import { DsarRequestsRepository } from '../../audit/repositories/dsar-requests.repository';
import { DataAccessLogRepository } from '../../audit/repositories/data-access-log.repository';
import { AuditTrailService } from '../../audit/services';
import { AUD } from '../../audit/audit.concepts';
import { loadAgendaNoticesEnv } from '../../scheduling/notices/agenda-notices.env';
import { InsurancePortabilityPdfService } from './insurance-portability-pdf.service';
import {
  PortabilityExportFormat,
  type InsurancePortabilityReportDto,
  type PortabilityClaimDto,
  type PortabilityClaimLineDto,
  type PortabilityConditionDto,
  type PortabilityEncounterDto,
  type PortabilityPatientDto,
  type PortabilityPeriodStatsDto,
  type PortabilityPolicyDto,
  type PortabilityExportResultDto,
  type PortabilitySummaryDto,
  type PortabilityVerificationResponseDto,
  type PortabilityYearStatsDto,
  type RequestPortabilityExportDto,
} from '../dto/insurance-portability.dto';

/** Versión del esquema del certificado. Cambia si la forma del JSON cambia. */
const SCHEMA_VERSION = 'alovida.insurance-portability/2';
const ISSUER = 'AloVida';
const MONTHS_36 = 36;

/** Un mapa de concepto → `{code, display}`, resuelto en lote. */
type ConceptMap = Map<string, { code: string; display: string }>;

/** Descarta valores repetidos o ausentes, preservando el orden de aparición. */
function unique(ids: ReadonlyArray<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (id && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

/**
 * Agrega el historial de seguros de UN paciente titular (pólizas, reclamos
 * con su dictamen vigente y diagnósticos) en un certificado sellado con
 * SHA-256, y resuelve su verificación pública — subtarea 3.3 (portabilidad de
 * póliza y siniestralidad a 1 clic).
 *
 * ## Qué persiste, y por qué no una tabla nueva
 *
 * El certificado es un manifiesto más de `health_data.health_export_jobs` +
 * `health_export_manifests` (T-27 §24: «el mecanismo de exportación ya existe
 * y está bien hecho»): el JSON canónico se guarda como `common.files`
 * (`FileUploadService.storeGenerated`), y `content_hash` del manifiesto ES el
 * sello SHA-256 impreso en el PDF y en su QR — el mismo hash que calcula el
 * adaptador de almacenamiento sobre los bytes efectivamente escritos, no uno
 * recalculado aparte (se compara explícitamente; ver {@link export}).
 *
 * ## Por qué el resumen se calcula acá y no en Postgres
 *
 * El tablero de la aseguradora completa (subtarea 3.1) agrega miles de
 * reclamos y por eso corre en SQL. Acá el universo es el historial de UN
 * paciente —decenas de filas, no miles— y las mismas filas que arman el
 * detalle alcanzan para el resumen: repetir la consulta con `SUM()` en
 * Postgres no compraría nada. Los importes se suman con `sumarDecimales`
 * (BigInt, sin coma flotante), nunca con `Number()` + `+`.
 */
@Injectable()
export class InsurancePortabilityService {
  constructor(
    private readonly em: EntityManager,
    private readonly portabilityRepo: InsurancePortabilityRepository,
    private readonly catalogRepo: CatalogRepository,
    private readonly profileOwnership: ProfileOwnershipService,
    private readonly patientsRepo: PatientProfilesRepository,
    private readonly personsRepo: PersonsRepository,
    private readonly identifiersRepo: IdentifiersRepository,
    private readonly fileUpload: FileUploadService,
    private readonly releaseRepo: DataReleaseRepository,
    private readonly provenanceRepo: HealthProvenanceRepository,
    private readonly dsarRepo: DsarRequestsRepository,
    private readonly dataAccessRepo: DataAccessLogRepository,
    private readonly auditTrail: AuditTrailService,
    private readonly pdfService: InsurancePortabilityPdfService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(InsurancePortabilityService.name);
  }

  /**
   * Arma, sella y persiste el certificado de portabilidad del titular.
   *
   * @throws ForbiddenException si el actor no es el titular ni plataforma
   *   (queda registrado en `audit.audit_log`, ver {@link assertOwnership}).
   * @throws ResourceNotFoundException si `targetInsurerTenantId` no
   *   corresponde a ninguna aseguradora.
   */
  async export(
    dto: RequestPortabilityExportDto,
    actor: AuthenticatedUser,
  ): Promise<PortabilityExportResultDto> {
    await this.assertOwnership(dto.patientProfileId, actor);

    if (dto.targetInsurerTenantId) {
      const lookupEm = this.em.fork();
      const carrier = await this.catalogRepo.findCarrierByTenantId(
        lookupEm,
        dto.targetInsurerTenantId,
      );
      if (!carrier) {
        throw new ResourceNotFoundException(
          'La aseguradora declarada no existe',
          { targetInsurerTenantId: dto.targetInsurerTenantId },
        );
      }
    }

    const format = dto.format ?? PortabilityExportFormat.BUNDLE;
    const em = this.em.fork();

    const [patientParts, policyRows, encounterRows, claimRows, conditionRows] =
      await Promise.all([
        this.resolvePatientParts(em, dto.patientProfileId),
        this.portabilityRepo.policiesOfPatient(em, dto.patientProfileId),
        this.portabilityRepo.encountersOfPatient(em, dto.patientProfileId),
        this.portabilityRepo.claimsOfPatient(
          em,
          dto.patientProfileId,
          INS.BILLING_PROVIDER_TYPE_PRACTICE,
          INS.BILLING_PROVIDER_TYPE_PHARMACY,
          INS.BILLING_PROVIDER_TYPE_DIAGNOSTIC_UNIT,
        ),
        this.portabilityRepo.conditionsOfPatient(em, dto.patientProfileId),
      ]);

    const conceptIds = unique([
      patientParts.issuerAdministrativeAreaConceptId,
      ...policyRows.flatMap((row) => [
        row.status_concept_id,
        row.relationship_concept_id,
      ]),
      ...encounterRows.flatMap((row) => [
        row.class_concept_id,
        row.type_concept_id,
        row.status_concept_id,
      ]),
      ...claimRows.flatMap((row) => [
        row.status_concept_id,
        row.billing_provider_type_concept_id,
        row.adjudication_outcome_concept_id,
        row.service_concept_id,
        row.line_decision_concept_id,
      ]),
      ...conditionRows.map((row) => row.clinical_status_concept_id),
    ]);
    const concepts = await this.conceptMap(em, conceptIds);

    const patient = this.buildPatient(patientParts, concepts);
    const policies = policyRows.map((row) => this.buildPolicy(row, concepts));
    const encounters = encounterRows.map((row) =>
      this.buildEncounter(row, concepts),
    );
    const claims = this.buildClaims(claimRows, concepts);
    const conditions = conditionRows.map((row) =>
      this.buildCondition(row, concepts),
    );
    // El resumen compara el DICTAMEN por su concept_id crudo (uuid, contra
    // `INS.ADJ_OUTCOME_*`) y no por el código de texto que ya viaja en
    // `claim.outcome`: el código real de esos dos conceptos no coincide con
    // la clave del mapa (`ADJUDICATION_APPROVED`, no `ADJ_OUTCOME_APPROVED`),
    // así que comparar contra un literal habría sido tan frágil como
    // comparar contra la clave equivocada.
    const outcomeConceptIdByClaim = new Map<string, string | null>();
    for (const row of claimRows) {
      if (!outcomeConceptIdByClaim.has(row.claim_id)) {
        outcomeConceptIdByClaim.set(
          row.claim_id,
          row.adjudication_outcome_concept_id,
        );
      }
    }
    const generatedAt = new Date();
    const summary = this.buildSummary(
      claims,
      policies,
      generatedAt,
      outcomeConceptIdByClaim,
    );

    const certificateId = randomUUID();
    const report: InsurancePortabilityReportDto = {
      schemaVersion: SCHEMA_VERSION,
      certificateId,
      generatedAt: generatedAt.toISOString(),
      issuer: ISSUER,
      patient,
      policies,
      encounters,
      claims,
      conditions,
      summary,
    };
    const canonicalJson = JSON.stringify(report);
    const manifestHash = createHash('sha256')
      .update(canonicalJson)
      .digest('hex');
    const buffer = Buffer.from(canonicalJson, 'utf8');

    const storedFile = await this.fileUpload.storeGenerated(
      {
        buffer,
        originalName: `portabilidad-${certificateId}.json`,
        mimeType: 'application/json',
        category: FileCategory.DOCUMENT,
        sensitivity: FileSensitivity.PHI,
      },
      actor,
    );

    // `manifestHash` se calcula acá, sobre los mismos `buffer` bytes que se
    // acaban de mandar a `storeGenerated`. El adaptador de almacenamiento
    // (`local-disk-file-storage.adapter.ts`, `s3-file-storage.adapter.ts`)
    // calcula SU `contentHash` con el mismo algoritmo sobre el mismo buffer,
    // así que los dos coinciden por construcción — no hace falta pedírselo
    // de vuelta a `FileResponseDto` (que no lo expone: vive en la versión del
    // archivo, `common.file_versions`, no en `common.files`).

    await this.em.transactional(async (tx) => {
      const job = this.releaseRepo.createExportJob(tx, {
        id: certificateId,
        tenantId: SEED.tenantId,
        exportTypeConceptId: CONCEPTS.EXPORT_TYPE_INSURANCE_PORTABILITY,
        requestedByUserId: actor.id,
        purposeOfUseConceptId: AUD.PURPOSE_PATIENT_REQUEST,
        patientProfileId: dto.patientProfileId,
        statusConceptId: CONCEPTS.EXPORT_COMPLETED,
        // Mismo instante que se selló en `report.generatedAt` (:206): el
        // verify público lo devuelve tal cual, y sin esto `requestedAt`
        // tomaría otro `new Date()` después de escribir el archivo.
        requestedAt: generatedAt,
        deliveryDestinationJson: {
          channel: 'PATIENT_SELF_SERVICE',
          format,
          targetInsurerTenantId: dto.targetInsurerTenantId ?? null,
        },
      });

      const manifest = this.releaseRepo.createExportManifest(tx, {
        healthExportJobId: job.id,
        manifestVersion: 1,
        fileId: storedFile.id,
        contentHash: manifestHash,
        recordCount: String(claims.length),
        sizeBytes: String(buffer.byteLength),
      });

      const provenance = this.provenanceRepo.createProvenanceRecord(tx, {
        activityConceptId: CONCEPTS.PROV_EXPORT,
        occurredStartAt: generatedAt,
        responsibleAgentId: actor.id,
        contentHash: manifestHash,
        policyUrisJson: { purposeOfUseConceptId: AUD.PURPOSE_PATIENT_REQUEST },
      });
      // Mismo patrón que `DataReleaseService.exportBundle`: sin este flush,
      // el objetivo de procedencia referenciaría un registro que todavía no
      // llegó a la base.
      await tx.flush();
      this.provenanceRepo.createProvenanceTarget(tx, {
        healthProvenanceRecordId: provenance.id,
        targetTypeConceptId: CONCEPTS.HD_ENTITY_MANIFEST,
        targetId: manifest.id,
      });

      const dsar = this.dsarRepo.create(tx, {
        userId: actor.id,
        typeConceptId: AUD.DSAR_TYPE_PORTABILITY,
        statusConceptId: AUD.DSAR_COMPLETED,
        actorUserId: actor.id,
      });
      // La solicitud se resuelve en el mismo instante en que se emite: no
      // hay ventana "en curso" que gestionar aparte.
      dsar.completedAt = generatedAt;
      dsar.resultFileId = storedFile.id;

      this.dataAccessRepo.record(tx, {
        userId: actor.id,
        actionConceptId: AUD.ACTION_EXPORT,
        patientProfileId: dto.patientProfileId,
        purpose: 'insurance-portability-export',
        legalBasisConceptId: AUD.LEGAL_BASIS_CONSENT,
        resourceType: 'insurance.portability_certificate',
        resourceId: certificateId,
        recordedByUserId: actor.id,
      });

      await this.auditTrail.record(tx, actor, {
        action: 'INSURANCE_PORTABILITY_EXPORTED',
        entity: 'insurance.portability_certificate',
        entityId: certificateId,
      });
    });

    const { webAppBaseUrl } = loadAgendaNoticesEnv();
    return {
      certificateId,
      manifestHash,
      generatedAt: generatedAt.toISOString(),
      format,
      recordCount: claims.length,
      policiesCount: policies.length,
      pdfDownloadUrl: `/insurance/portability/certificates/${certificateId}/pdf`,
      jsonDownloadUrl: `/insurance/portability/certificates/${certificateId}/json`,
      verificationUrl: `${webAppBaseUrl}/verify/portability/${manifestHash}`,
      summary,
    };
  }

  /**
   * El certificado ya emitido, tal como se sirvió (bytes exactos, sin
   * reserializar) — usarlo para descargar el JSON preserva el hash impreso.
   */
  async downloadJson(
    certificateId: string,
    actor: AuthenticatedUser,
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const { manifest } = await this.loadCertificate(certificateId, actor);
    const content = await this.fileUpload.downloadForAuthorizedContext(
      manifest.fileId,
      'insurance.portability.download-json',
    );
    return {
      buffer: content.buffer,
      fileName: `portabilidad-${certificateId}.json`,
    };
  }

  /** El certificado ya emitido, tal como quedó sellado, para armar el PDF. */
  async renderPdf(
    certificateId: string,
    actor: AuthenticatedUser,
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const { manifest } = await this.loadCertificate(certificateId, actor);
    const content = await this.fileUpload.downloadForAuthorizedContext(
      manifest.fileId,
      'insurance.portability.download-pdf',
    );
    const report = JSON.parse(
      content.buffer.toString('utf8'),
    ) as InsurancePortabilityReportDto;
    const { webAppBaseUrl } = loadAgendaNoticesEnv();
    const qrUrl = `${webAppBaseUrl}/verify/portability/${manifest.contentHash}`;
    const buffer = await this.pdfService.render(
      report,
      manifest.contentHash,
      qrUrl,
    );
    return { buffer, fileName: `portabilidad-${certificateId}.pdf` };
  }

  /**
   * Verificación pública de un certificado por su hash, sin PHI: confirma
   * que existe y con qué se emitió, igual que el verify público de recetas.
   */
  async verify(
    manifestHash: string,
  ): Promise<PortabilityVerificationResponseDto> {
    const em = this.em.fork();
    const manifest = await this.releaseRepo.findManifestByContentHash(
      em,
      manifestHash,
    );
    if (!manifest) {
      throw new ResourceNotFoundException('Certificado no encontrado', {
        manifestHash,
      });
    }
    const job = await this.releaseRepo.findExportJobById(
      em,
      manifest.healthExportJobId,
    );
    if (
      !job ||
      job.exportTypeConceptId !== CONCEPTS.EXPORT_TYPE_INSURANCE_PORTABILITY
    ) {
      throw new ResourceNotFoundException('Certificado no encontrado', {
        manifestHash,
      });
    }
    return {
      status: 'VALID',
      certificateId: job.id,
      manifestHash,
      generatedAt: job.requestedAt.toISOString(),
      recordCount: Number(manifest.recordCount),
      algorithm: 'SHA-256',
      issuer: ISSUER,
    };
  }

  /**
   * Exige que el actor sea el titular del historial o plataforma.
   *
   * A diferencia de una comprobación silenciosa, un rechazo acá queda
   * registrado en `audit.audit_log` — es la «alerta» que pide el criterio de
   * aceptación (AC-03-03-D): un intento sobre el perfil de otro no sólo
   * responde 403, deja evidencia.
   */
  private async assertOwnership(
    patientProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const em = this.em.fork();
    try {
      await this.profileOwnership.assertOwnsPatientProfile(
        em,
        patientProfileId,
        actor,
      );
    } catch (error) {
      if (error instanceof ForbiddenException) {
        await this.em.transactional((tx) =>
          this.auditTrail.record(tx, actor, {
            action: 'INSURANCE_PORTABILITY_DENIED',
            entity: 'patient_profile',
            entityId: patientProfileId,
            success: false,
          }),
        );
      }
      throw error;
    }
  }

  /**
   * El trabajo y el manifiesto de un certificado, tras comprobar que el
   * actor es su titular o plataforma.
   *
   * @throws ResourceNotFoundException si no existe, si no es de portabilidad
   *   de seguros, o si su versión 1 del manifiesto no está (nunca debería
   *   faltar: se crea en la misma transacción que el trabajo).
   */
  private async loadCertificate(
    certificateId: string,
    actor: AuthenticatedUser,
  ) {
    const em = this.em.fork();
    const job = await this.releaseRepo.findExportJobById(em, certificateId);
    if (
      !job ||
      job.exportTypeConceptId !== CONCEPTS.EXPORT_TYPE_INSURANCE_PORTABILITY ||
      !job.patientProfileId
    ) {
      throw new ResourceNotFoundException('Certificado no encontrado', {
        certificateId,
      });
    }
    await this.assertOwnership(job.patientProfileId, actor);
    const manifest = await this.releaseRepo.findManifest(em, job.id, 1);
    if (!manifest) {
      throw new ResourceNotFoundException('Certificado no encontrado', {
        certificateId,
      });
    }
    return { job, manifest };
  }

  /** Nombre, documento y departamento de emisión del titular, sin resolver. */
  private async resolvePatientParts(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<{
    fullName: string;
    nationalId: string | null;
    issuerAdministrativeAreaConceptId?: string;
    birthDate: string | null;
  }> {
    const patientProfile = await this.patientsRepo.findById(
      em,
      patientProfileId,
    );
    if (!patientProfile) {
      throw new ResourceNotFoundException('Paciente no encontrado', {
        patientProfileId,
      });
    }
    const person = await this.personsRepo.findById(
      em,
      patientProfile.profileId,
    );
    const identifiers = await this.identifiersRepo.findCurrentByOwner(
      em,
      patientProfile.profileId,
    );
    const nationalIdentifier = identifiers.find(
      (identifier) => identifier.typeConceptId === CONCEPTS.ID_TYPE_NATIONAL,
    );
    return {
      fullName: person ? (composePersonDisplayName(person) ?? '') : '',
      nationalId: nationalIdentifier?.value ?? null,
      issuerAdministrativeAreaConceptId:
        nationalIdentifier?.issuerAdministrativeAreaConceptId,
      birthDate: person?.birthDate
        ? person.birthDate.toISOString().slice(0, 10)
        : null,
    };
  }

  private buildPatient(
    parts: Awaited<
      ReturnType<InsurancePortabilityService['resolvePatientParts']>
    >,
    concepts: ConceptMap,
  ): PortabilityPatientDto {
    const areaCode = parts.issuerAdministrativeAreaConceptId
      ? concepts.get(parts.issuerAdministrativeAreaConceptId)?.code
      : undefined;
    return {
      fullName: parts.fullName || 'Sin identificar',
      nationalId: parts.nationalId,
      nationalIdArea: areaCode ? (areaCode.split(':').pop() ?? null) : null,
      birthDate: parts.birthDate,
    };
  }

  private buildPolicy(
    row: PortabilityPolicyRow,
    concepts: ConceptMap,
  ): PortabilityPolicyDto {
    return {
      coverageId: row.coverage_id,
      carrierName: row.carrier_name,
      planName: row.plan_name,
      productName: row.product_name,
      policyIdentifier: row.policy_identifier,
      memberIdentifier: row.member_identifier,
      // Reserva literal, no `INS.RELATIONSHIP_SELF`: esa constante es el uuid
      // del concepto (para comparar contra la columna), no su código — acá
      // el campo es texto, y el código real de ese concepto SÍ coincide con
      // la clave (`insurance.concepts.ts`), a diferencia de otros como
      // `ADJ_OUTCOME_APPROVED` (ver {@link periodStats}).
      relationship: row.relationship_concept_id
        ? (concepts.get(row.relationship_concept_id)?.code ??
          'RELATIONSHIP_SELF')
        : 'RELATIONSHIP_SELF',
      startDate: row.effective_from,
      endDate: row.effective_to,
      status: row.status_concept_id
        ? (concepts.get(row.status_concept_id)?.code ?? 'UNKNOWN')
        : 'UNKNOWN',
      verified: row.verification_status_concept_id === INS.VERIFY_VERIFIED,
      currencyCode: resolveInsuranceCurrencyCode(
        row.currency_concept_id,
        row.currency_code,
      ),
      monthlyPremiumAmount: row.monthly_premium_amount,
    };
  }

  private buildEncounter(
    row: PortabilityEncounterRow,
    concepts: ConceptMap,
  ): PortabilityEncounterDto {
    return {
      encounterId: row.encounter_id,
      startAt: row.start_at,
      endAt: row.end_at,
      encounterClass: row.class_concept_id
        ? (concepts.get(row.class_concept_id)?.code ?? null)
        : null,
      type: row.type_concept_id
        ? (concepts.get(row.type_concept_id)?.code ?? null)
        : null,
      status: concepts.get(row.status_concept_id)?.code ?? 'UNKNOWN',
      organizationName: row.tenant_name,
      branchName: row.branch_name,
    };
  }

  /** Agrupa las filas planas de reclamo+línea en reclamos con sus ítems. */
  private buildClaims(
    rows: PortabilityClaimLineRow[],
    concepts: ConceptMap,
  ): PortabilityClaimDto[] {
    const byClaim = new Map<string, PortabilityClaimDto>();
    const order: string[] = [];

    for (const row of rows) {
      let claim = byClaim.get(row.claim_id);
      if (!claim) {
        const providerName =
          row.practice_name ??
          row.pharmacy_trade_name ??
          row.pharmacy_legal_name ??
          row.diagnostic_unit_practice_name ??
          null;
        claim = {
          claimId: row.claim_id,
          claimIdentifier: row.claim_identifier,
          submittedAt: row.submitted_at,
          carrierName: row.carrier_name,
          policyIdentifier: row.policy_identifier,
          providerType:
            concepts.get(row.billing_provider_type_concept_id)?.code ??
            'UNKNOWN',
          providerName,
          status: concepts.get(row.status_concept_id)?.code ?? 'UNKNOWN',
          outcome: row.adjudication_outcome_concept_id
            ? (concepts.get(row.adjudication_outcome_concept_id)?.code ?? null)
            : null,
          adjudicatedAt: row.adjudicated_at,
          currencyCode: resolveInsuranceCurrencyCode(
            row.currency_concept_id,
            row.currency_code,
          ),
          billedTotal: row.total_amount ?? '0.00',
          approvedTotal: row.total_approved_amount,
          patientTotal: row.total_patient_amount,
          deniedTotal: row.total_denied_amount,
          diagnosisCode: null,
          lines: [],
        };
        byClaim.set(row.claim_id, claim);
        order.push(row.claim_id);
      }

      if (row.line_id) {
        const line: PortabilityClaimLineDto = {
          lineSequence: row.line_sequence ?? 0,
          serviceName: row.service_concept_id
            ? (concepts.get(row.service_concept_id)?.display ?? null)
            : null,
          referenceType: row.diagnostic_study_offering_id
            ? 'DIAGNOSTIC_STUDY'
            : row.medication_dispensation_line_id
              ? 'MEDICATION_DISPENSATION'
              : null,
          billedAmount: row.billed_amount ?? '0.00',
          patientResponsibilityAmount: row.patient_responsibility_amount,
          decision: row.line_decision_concept_id
            ? (concepts.get(row.line_decision_concept_id)?.code ?? null)
            : null,
          approvedAmount: row.line_approved_amount,
          deniedAmount: row.line_denied_amount,
          policyClauseReference: row.policy_clause_reference,
          denialRationale: row.denial_rationale,
        };
        claim.lines.push(line);
      }
    }

    return order.map((id) => byClaim.get(id)!);
  }

  private buildCondition(
    row: PortabilityConditionRow,
    concepts: ConceptMap,
  ): PortabilityConditionDto {
    const isCoded = row.code_system !== null;
    return {
      code: isCoded ? row.code : null,
      codeSystem: row.code_system,
      display: row.display,
      clinicalStatus: row.clinical_status_concept_id
        ? (concepts.get(row.clinical_status_concept_id)?.code ?? null)
        : null,
      onsetAt: row.onset_at,
      resolvedAt: row.resolved_at,
    };
  }

  /**
   * El resumen actuarial, calculado sobre los mismos reclamos ya armados
   * (ver el porqué en el docstring de la clase).
   */
  private buildSummary(
    claims: PortabilityClaimDto[],
    policies: PortabilityPolicyDto[],
    now: Date,
    outcomeConceptIdByClaim: ReadonlyMap<string, string | null>,
  ): PortabilitySummaryDto {
    const currencyCode =
      claims.find((claim) => claim.currencyCode)?.currencyCode ??
      policies.find((policy) => policy.currencyCode)?.currencyCode ??
      null;

    const since36 = new Date(now);
    since36.setUTCMonth(since36.getUTCMonth() - MONTHS_36);
    const since36Iso = since36.toISOString();

    const allTime = this.periodStats(
      claims,
      null,
      policies,
      now,
      outcomeConceptIdByClaim,
    );
    const last36Months = this.periodStats(
      claims,
      since36Iso,
      policies,
      now,
      outcomeConceptIdByClaim,
    );

    const byYear = this.buildYearStats(claims);

    const claimsOver2000Count = claims.filter(
      (claim) => Number(claim.billedTotal) > 2000,
    ).length;

    return {
      currencyCode,
      allTime,
      last36Months,
      byYear,
      claimsOver2000Count,
      estimatedLossRatioPercent: this.estimatedLossRatio(
        allTime,
        policies,
        currencyCode,
      ),
    };
  }

  private periodStats(
    claims: PortabilityClaimDto[],
    sinceIso: string | null,
    policies: PortabilityPolicyDto[],
    now: Date,
    outcomeConceptIdByClaim: ReadonlyMap<string, string | null>,
  ): PortabilityPeriodStatsDto {
    const filtered = sinceIso
      ? claims.filter(
          (claim) => claim.submittedAt && claim.submittedAt >= sinceIso,
        )
      : claims;

    const approvedCount = filtered.filter(
      (claim) =>
        outcomeConceptIdByClaim.get(claim.claimId) === INS.ADJ_OUTCOME_APPROVED,
    ).length;
    const deniedCount = filtered.filter(
      (claim) =>
        outcomeConceptIdByClaim.get(claim.claimId) === INS.ADJ_OUTCOME_DENIED,
    ).length;
    const pendingCount = filtered.length - approvedCount - deniedCount;

    const dates = filtered
      .map((claim) => claim.submittedAt)
      .filter((value): value is string => value !== null)
      .sort();

    return {
      claimsCount: filtered.length,
      approvedCount,
      deniedCount,
      pendingCount,
      billedAmount:
        sumarDecimales(filtered.map((claim) => claim.billedTotal)) ?? '0.00',
      coveredAmount:
        sumarDecimales(filtered.map((claim) => claim.approvedTotal)) ?? '0.00',
      patientCopayAmount:
        sumarDecimales(filtered.map((claim) => claim.patientTotal)) ?? '0.00',
      deniedAmount:
        sumarDecimales(filtered.map((claim) => claim.deniedTotal)) ?? '0.00',
      firstClaimAt: dates[0] ?? null,
      lastClaimAt: dates[dates.length - 1] ?? null,
      coveredMonths: this.coveredMonths(policies, sinceIso, now),
    };
  }

  /**
   * Meses cubiertos por ALGUNA póliza dentro del período, en decimal.
   *
   * Aproximación deliberada: suma la duración de cada póliza (acotada al
   * período y a "hoy" si sigue vigente) sin descontar solapes entre pólizas
   * simultáneas — es una cota superior, no la siniestralidad exacta que
   * calcula la subtarea 3.1 sobre la población de una aseguradora.
   */
  private coveredMonths(
    policies: PortabilityPolicyDto[],
    sinceIso: string | null,
    now: Date,
  ): string {
    const periodStart = sinceIso ? new Date(sinceIso) : null;
    let totalDays = 0;
    for (const policy of policies) {
      if (!policy.startDate) continue;
      const start = new Date(`${policy.startDate}T00:00:00.000Z`);
      const end = policy.endDate
        ? new Date(`${policy.endDate}T00:00:00.000Z`)
        : now;
      const lo = periodStart && periodStart > start ? periodStart : start;
      const hi = end < now ? end : now;
      const days = (hi.getTime() - lo.getTime()) / (1000 * 60 * 60 * 24);
      if (days > 0) totalDays += days;
    }
    return (totalDays / 30).toFixed(2);
  }

  /**
   * `null` sin prima declarada en ningún plan: nunca se inventa una (regla
   * "sin defaults" del modelo, la misma razón por la que v4.2.14 dejó la
   * prima nullable).
   */
  private estimatedLossRatio(
    allTime: PortabilityPeriodStatsDto,
    policies: PortabilityPolicyDto[],
    currencyCode: string | null,
  ): string | null {
    const premiums = policies.filter(
      (policy) =>
        policy.monthlyPremiumAmount !== null &&
        (policy.currencyCode === currencyCode || currencyCode === null),
    );
    if (premiums.length === 0) return null;
    const monthlyPremium = sumarDecimales(
      premiums.map((policy) => policy.monthlyPremiumAmount),
    );
    if (!monthlyPremium) return null;
    const months = Number(allTime.coveredMonths);
    if (!(months > 0)) return null;
    const denominator = Number(monthlyPremium) * months;
    if (!(denominator > 0)) return null;
    const ratio = (Number(allTime.coveredAmount) / denominator) * 100;
    return ratio.toFixed(2);
  }

  private buildYearStats(
    claims: PortabilityClaimDto[],
  ): PortabilityYearStatsDto[] {
    const byYear = new Map<number, { claims: PortabilityClaimDto[] }>();
    for (const claim of claims) {
      if (!claim.submittedAt) continue;
      const year = Number(claim.submittedAt.slice(0, 4));
      const bucket = byYear.get(year) ?? { claims: [] };
      bucket.claims.push(claim);
      byYear.set(year, bucket);
    }
    return [...byYear.entries()]
      .sort(([a], [b]) => a - b)
      .map(([year, bucket]) => ({
        year,
        claimsCount: bucket.claims.length,
        billedAmount:
          sumarDecimales(bucket.claims.map((claim) => claim.billedTotal)) ??
          '0.00',
        coveredAmount:
          sumarDecimales(bucket.claims.map((claim) => claim.approvedTotal)) ??
          '0.00',
      }));
  }

  /** Códigos y textos de un lote de conceptos, resueltos de una vez. */
  private async conceptMap(
    em: EntityManager,
    ids: ReadonlyArray<string | null | undefined>,
  ): Promise<ConceptMap> {
    const clean = unique(ids);
    if (clean.length === 0) return new Map();
    const concepts = await em.find(CatalogConcepts, { id: { $in: clean } });
    return new Map(
      concepts.map((concept) => [
        concept.id,
        { code: concept.code, display: concept.display },
      ]),
    );
  }
}
