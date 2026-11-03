import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DIR } from '../../directory/directory.concepts';
import { TenantMemberships } from '../../directory/entities/tenant_memberships.entity';
import { JurisdictionAuthorizations } from '../../profiles/entities/jurisdiction_authorizations.entity';
import { PersonAccountLinks } from '../../profiles/entities/person_account_links.entity';
import { PROF } from '../../profiles/profiles.concepts';
import { Files } from '../../common/entities/files.entity';
import { Consents } from '../../consent/entities/consents.entity';
import { assertResourceInTenant } from '../../../common/tenant/resource-scope';
import { IdentityAuthorities } from '../entities/identity_authorities.entity';
import type { IdentityVerificationCases } from '../entities/identity_verification_cases.entity';
import { IdentityVerificationCasesRepository } from '../repositories';
import { IDA } from '../identity_assurance.concepts';
import { IdentityAssuranceErrorReason } from '../identity_assurance.error-reasons';

/** Vigencia `[from, until)` de una fila con ventana de validez. */
const inRange = (from: Date, until: Date | undefined, now: Date): boolean =>
  from instanceof Date &&
  Number.isFinite(from.getTime()) &&
  from <= now &&
  (until == null ||
    (until instanceof Date && Number.isFinite(until.getTime()) && until > now));

/** Sujeto de un caso, tal como lo guarda `identity_verification_cases`. */
export interface CaseSubject {
  /** Clase de sujeto (`IDA.SUBJECT_*`). */
  readonly subjectTypeConceptId: string;
  /** Id del sujeto (persona, autorización de matrícula o tenant). */
  readonly subjectEntityId: string;
}

/**
 * Alcance por tenant de los casos de verificación de identidad.
 *
 * `identity_verification_cases` no tiene `tenant_id`, así que el tenant de un
 * caso **se deriva de su sujeto**:
 *  - sujeto tenant: el propio `subject_entity_id` es el tenant;
 *  - sujeto persona (paciente o profesional): sus cuentas activas
 *    (`person_account_links`) tienen una membresía activa en el tenant;
 *  - matrícula profesional: se resuelve a su profesional y se aplica lo anterior.
 *
 * Cualquier sujeto que no se pueda resolver, o de una clase desconocida, queda
 * fuera de alcance (se deniega por defecto). Un caso ajeno responde exactamente
 * igual que uno inexistente.
 */
@Injectable()
export class IdentityCaseScope {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param casesRepo - Casos de verificación.
   */
  constructor(
    private readonly casesRepo: IdentityVerificationCasesRepository,
  ) {}

  /**
   * Carga un caso por UUID exigiendo que su sujeto pertenezca al tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param caseId - UUID del caso.
   * @param tenantId - Tenant activo (`requireTenantId()`).
   * @returns El caso, ya acotado al tenant.
   * @throws ResourceNotFoundException `IDENTITY_CASE_NOT_AVAILABLE`, igual para ajeno e inexistente.
   */
  async loadAuthorizedCase(
    tx: EntityManager,
    caseId: string,
    tenantId: string,
  ): Promise<IdentityVerificationCases> {
    const kase = await this.findAuthorizedCase(tx, caseId, tenantId);
    return assertResourceInTenant(kase, kase ? tenantId : null, tenantId, {
      message: 'Caso de verificación no encontrado',
      reason: IdentityAssuranceErrorReason.CASE_NOT_AVAILABLE,
    });
  }

  /**
   * Como {@link loadAuthorizedCase}, pero devuelve `null` en vez de lanzar: para
   * los agregados hijos (aserción, revisión) que responden con su propio
   * mensaje y `reason` cuando el caso del que cuelgan es ajeno.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param caseId - UUID del caso.
   * @param tenantId - Tenant activo.
   * @returns El caso si existe y su sujeto pertenece al tenant; si no, `null`.
   */
  async findAuthorizedCase(
    tx: EntityManager,
    caseId: string,
    tenantId: string,
  ): Promise<IdentityVerificationCases | null> {
    const kase = await this.casesRepo.findById(tx, caseId);
    if (!kase) return null;
    return (await this.subjectInTenant(tx, kase, tenantId)) ? kase : null;
  }

  /**
   * Exige que el sujeto de un caso por abrir pertenezca al tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param subject - Clase e id del sujeto.
   * @param tenantId - Tenant activo.
   * @throws ResourceNotFoundException `IDENTITY_SUBJECT_NOT_AVAILABLE`.
   */
  async assertSubjectInTenant(
    tx: EntityManager,
    subject: CaseSubject,
    tenantId: string,
  ): Promise<void> {
    const owned = await this.subjectInTenant(tx, subject, tenantId);
    assertResourceInTenant(subject, owned ? tenantId : null, tenantId, {
      message: 'Sujeto de verificación no encontrado',
      reason: IdentityAssuranceErrorReason.SUBJECT_NOT_AVAILABLE,
    });
  }

  /**
   * Exige que una autoridad de identidad pertenezca al tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param authorityId - Autoridad citada (si no se cita ninguna, no hace nada).
   * @param tenantId - Tenant activo.
   * @throws ResourceNotFoundException `IDENTITY_AUTHORITY_NOT_AVAILABLE`.
   */
  async assertAuthorityInTenant(
    tx: EntityManager,
    authorityId: string | undefined,
    tenantId: string,
  ): Promise<void> {
    if (!authorityId) return;
    const authority = await tx.findOne(IdentityAuthorities, {
      id: authorityId,
    });
    assertResourceInTenant(authority, authority?.tenantId, tenantId, {
      message: 'Autoridad de identidad no encontrada',
      reason: IdentityAssuranceErrorReason.AUTHORITY_NOT_AVAILABLE,
    });
  }

  /**
   * La evidencia sólo puede enlazar archivos y consentimientos del mismo tenant
   * y, si el sujeto es un paciente, el consentimiento tiene que ser suyo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param kase - Caso al que se agrega la evidencia.
   * @param refs - Archivo y consentimiento citados por la evidencia.
   * @param tenantId - Tenant activo.
   * @throws ResourceNotFoundException uniforme si alguno no pertenece.
   */
  async assertEvidenceReferences(
    tx: EntityManager,
    kase: CaseSubject,
    refs: {
      /** Archivo con la evidencia. */
      evidenceFileId?: string;
      /** Consentimiento bajo el que se recolectó. */
      collectedUnderConsentId?: string;
    },
    tenantId: string,
  ): Promise<void> {
    if (refs.evidenceFileId) {
      const file = await tx.findOne(Files, { id: refs.evidenceFileId });
      assertResourceInTenant(file, file?.tenantId, tenantId, {
        message: 'Archivo de evidencia no encontrado',
        reason: IdentityAssuranceErrorReason.EVIDENCE_FILE_NOT_AVAILABLE,
      });
    }
    if (refs.collectedUnderConsentId) {
      const consent = await tx.findOne(Consents, {
        id: refs.collectedUnderConsentId,
      });
      const sameSubject =
        kase.subjectTypeConceptId !== IDA.SUBJECT_PATIENT_IDENTITY ||
        consent?.patientProfileId === kase.subjectEntityId;
      assertResourceInTenant(
        consent,
        sameSubject ? consent?.tenantId : null,
        tenantId,
        {
          message: 'Consentimiento no encontrado',
          reason: IdentityAssuranceErrorReason.CONSENT_NOT_AVAILABLE,
        },
      );
    }
  }

  /**
   * Si el sujeto del caso pertenece al tenant dado.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param subject - Clase e id del sujeto.
   * @param tenantId - Tenant a contrastar.
   * @returns `true` sólo si el vínculo con el tenant está probado.
   */
  async subjectInTenant(
    tx: EntityManager,
    subject: CaseSubject,
    tenantId: string,
  ): Promise<boolean> {
    if (subject.subjectTypeConceptId === IDA.SUBJECT_TENANT_IDENTITY) {
      return subject.subjectEntityId === tenantId;
    }

    let personId: string | undefined;
    if (subject.subjectTypeConceptId === IDA.SUBJECT_PRACTITIONER_LICENSE) {
      const authorization = await tx.findOne(JurisdictionAuthorizations, {
        id: subject.subjectEntityId,
      });
      personId = authorization?.practitionerProfileId;
    } else if (
      subject.subjectTypeConceptId === IDA.SUBJECT_PATIENT_IDENTITY ||
      subject.subjectTypeConceptId === IDA.SUBJECT_PRACTITIONER_IDENTITY
    ) {
      personId = subject.subjectEntityId;
    }
    if (!personId) return false;

    const now = new Date();
    const links = await tx.find(PersonAccountLinks, {
      personId,
      statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
    });
    const userIds = links
      .filter((link) => inRange(link.validFrom, link.validTo, now))
      .map((link) => link.userId);
    if (userIds.length === 0) return false;

    const memberships = await tx.find(TenantMemberships, {
      userId: { $in: userIds },
      tenantId,
      statusConceptId: DIR.MEMBERSHIP_ACTIVE,
    });
    return memberships.some((member) =>
      inRange(member.startDate, member.endDate, now),
    );
  }

  /**
   * Deja sólo los casos cuyo sujeto pertenece al tenant, con memoria por sujeto.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param cases - Casos candidatos.
   * @param tenantId - Tenant activo.
   * @returns Los casos del tenant, en el mismo orden.
   */
  async filterToTenant(
    tx: EntityManager,
    cases: readonly IdentityVerificationCases[],
    tenantId: string,
  ): Promise<IdentityVerificationCases[]> {
    const memo = new Map<string, boolean>();
    const kept: IdentityVerificationCases[] = [];
    for (const kase of cases) {
      const key = `${kase.subjectTypeConceptId}:${kase.subjectEntityId}`;
      let owned = memo.get(key);
      if (owned === undefined) {
        owned = await this.subjectInTenant(tx, kase, tenantId);
        memo.set(key, owned);
      }
      if (owned) kept.push(kase);
    }
    return kept;
  }
}
