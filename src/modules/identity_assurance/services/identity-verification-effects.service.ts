import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, touch } from '../../../common';
import { PROF } from '../../profiles/profiles.concepts';
import { JurisdictionAuthorizationsRepository } from '../../profiles/infrastructure/repositories';
import { PractitionerAdmissionsService } from '../../profiles/application/services/practitioner-admissions.service';
import { TenantsRepository } from '../../directory/repositories';
import { PharmacyOperatingRequirementsService } from '../../directory/services/pharmacy-operating-requirements.service';
import { DIR } from '../../directory/directory.concepts';
import { CommunityVerificationService } from '../../community/services';
import { COMM } from '../../community/community.concepts';
import { IDA } from '../identity_assurance.concepts';
import type { IdentityVerificationCases } from '../entities';

/**
 * Traduce un caso de verificación resuelto al cambio de estado que le
 * corresponde en su dominio: una matrícula pasa a activa, una institución a
 * verificada.
 *
 * Vive aparte de `IdentityChecksService` porque son dos responsabilidades
 * distintas: aquél gobierna la máquina de estados de la verificación (genérica
 * y compartida por las tres verticales), y ésta sabe qué significa "verificado"
 * para cada tipo de sujeto. Mezclarlas obligaría al motor de verificación a
 * conocer `profiles` y `directory`, y a crecer con cada vertical nueva.
 *
 * La identidad de una persona (paciente o profesional) NO tiene efecto aquí a
 * propósito: la aserción activa en `identity_assertions` ya es la fuente de
 * verdad que consulta el guard de cuenta verificada, y duplicarla en una columna
 * de `profiles` crearía dos verdades que se pueden desincronizar.
 *
 * ## El sello del perfil público (P13)
 *
 * Desde P13 el efecto incluye el sello «Verificado» de `community`. Antes no:
 * `verified_badges` no tenía ningún camino de escritura, así que un profesional
 * podía pasar la verificación de matrícula —H-01, que ya funciona— y **no ganar
 * el sello**, mientras que un perfil sin verificar nada podía lucirlo si alguien
 * metía la fila a mano. En una red de salud, que el sello sea confiable ES el
 * producto.
 *
 * El puente va acá y no en `identity_assurance` a secas por la misma razón que
 * el resto de este archivo: este servicio sabe qué significa «verificado» para
 * cada dominio; el motor de verificación no tiene por qué conocer community.
 */
@Injectable()
export class IdentityVerificationEffectsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param authorizationsRepo - Valor de authorizations repo requerido por la operación.
   * @param admissions - Admisiones de profesionales: recibe la matrícula verificada como revisión.
   * @param tenantsRepo - Valor de tenants repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   * @param operatingRequirements - Requisitos para operar de farmacias y laboratorios.
   */
  constructor(
    private readonly authorizationsRepo: JurisdictionAuthorizationsRepository,
    private readonly admissions: PractitionerAdmissionsService,
    private readonly tenantsRepo: TenantsRepository,
    private readonly verification: CommunityVerificationService,
    private readonly logger: PinoLogger,
    private readonly operatingRequirements: PharmacyOperatingRequirementsService,
  ) {
    this.logger.setContext(IdentityVerificationEffectsService.name);
  }

  /**
   * Aplica el efecto de dominio de un caso recién verificado.
   *
   * Corre dentro de la misma transacción que cerró el caso: si el efecto falla,
   * el caso no debe quedar verificado sin que su dominio lo refleje.
   *
   * @param tx - Transacción activa.
   * @param kase - Caso ya verificado.
   * @param actorUserId - Quién registró el resultado (el worker de sistema).
   */
  async applyVerified(
    tx: EntityManager,
    kase: IdentityVerificationCases,
    actorUserId: string,
  ): Promise<void> {
    switch (kase.subjectTypeConceptId) {
      case IDA.SUBJECT_PRACTITIONER_LICENSE:
        await this.activateLicense(
          tx,
          kase.subjectEntityId,
          actorUserId,
          kase.id,
        );
        return;
      case IDA.SUBJECT_TENANT_IDENTITY:
        await this.verifyTenant(tx, kase.subjectEntityId, actorUserId);
        return;
      default:
        // Identidad de persona: la aserción emitida ya es el efecto.
        return;
    }
  }

  /**
   * Aplica el efecto de dominio de un caso que dejó de estar verificado.
   *
   * Es la otra mitad de `applyVerified`, y sin ella el sello sería una promesa
   * que sólo se puede hacer y nunca deshacer: una matrícula revocada dejaría el
   * perfil luciendo «Verificado» para siempre.
   *
   * **No revierte el efecto de dominio** —la matrícula y el tenant siguen su
   * propia máquina de estados, que no es de este carril—: baja el sello, que es
   * lo que ve el público.
   *
   * @param tx - Transacción activa.
   * @param kase - Caso revocado o vencido.
   * @param actorUserId - Quién lo registró.
   * @param reason - Si la autoridad retiró el respaldo o si sólo venció.
   */
  async applyRevoked(
    tx: EntityManager,
    kase: IdentityVerificationCases,
    actorUserId: string,
    reason: 'REVOKED' | 'EXPIRED' = 'REVOKED',
  ): Promise<void> {
    const targetId = await this.publicSubjectOf(tx, kase);
    if (!targetId) return;

    const { revoked } = await this.verification.applyRevoked(
      tx,
      targetId,
      actorUserId,
      reason,
    );

    this.logger.info(
      {
        operation: 'ida.effects.badge-revoke',
        caseId: kase.id,
        targetId,
        revoked,
        motivo: reason,
      },
      'Public verified badge revoked after the case lost its backing',
    );
  }

  /**
   * El sujeto que el perfil público proyecta, para el caso dado.
   *
   * Una matrícula verificada respalda al **profesional**, no a la fila de la
   * matrícula: el perfil público apunta al primero. Un caso de otro tipo no
   * tiene sello asociado y devuelve `null`.
   */
  private async publicSubjectOf(
    tx: EntityManager,
    kase: IdentityVerificationCases,
  ): Promise<string | null> {
    if (kase.subjectTypeConceptId === IDA.SUBJECT_TENANT_IDENTITY) {
      return kase.subjectEntityId;
    }
    if (kase.subjectTypeConceptId !== IDA.SUBJECT_PRACTITIONER_LICENSE) {
      return null;
    }
    const authorization = await this.authorizationsRepo.findById(
      tx,
      kase.subjectEntityId,
    );
    return authorization?.practitionerProfileId ?? null;
  }

  /**
   * Registra la matrícula verificada por la autoridad externa como revisión de
   * su requisito en la admisión del profesional.
   *
   * ## Qué ya no hace (v4.2.67 · D-01)
   *
   * Antes activaba la matrícula, **verificaba al profesional** (escribía
   * `PRACT_VERIF_VERIFIED`, abría la agenda) y le concedía el sello público, todo
   * por el solo hecho de que la autoridad confirmara UNA matrícula: sin revisar
   * sus títulos ni su identidad y sin cuatro ojos. Un veredicto de la autoridad
   * es evidencia, no la resolución: ahora queda como revisión VERIFICADA del
   * ítem (fuente: registro del Ministerio; referencia: este caso) y el cierre
   * —verificar al profesional, concederle el check— es de la admisión.
   *
   * Si el profesional no tiene una admisión abierta (ya verificado, o una ficha
   * de directorio sin cuenta), sólo se activa la matrícula: no hay a quién
   * verificar ni de quién aprobar.
   *
   * @param tx - Transacción activa.
   * @param authorizationId - Autorización jurisdiccional verificada.
   * @param actorUserId - Quién registró el resultado.
   * @param identityCaseId - El caso de verificación que la respalda.
   */
  private async activateLicense(
    tx: EntityManager,
    authorizationId: string,
    actorUserId: string,
    identityCaseId: string,
  ): Promise<void> {
    const authorization = await this.authorizationsRepo.findById(
      tx,
      authorizationId,
    );
    if (!authorization) {
      // El caso apunta a una licencia que ya no existe. No se aborta el cierre
      // del caso —el veredicto de la autoridad es un hecho— pero queda visible.
      this.logger.warn(
        { operation: 'ida.effects.license', authorizationId },
        'Verified license case points to a jurisdiction authorization that no longer exists',
      );
      return;
    }

    const recorded = await this.admissions.recordExternalLicenseVerification(
      tx,
      {
        authorizationId,
        practitionerProfileId: authorization.practitionerProfileId,
        identityCaseId,
        actorUserId,
      },
    );
    if (!recorded) {
      authorization.stateConceptId = PROF.AUTH_ACTIVE;
      authorization.verifiedByUserId = actorUserId;
      authorization.verifiedAt = new Date();
      authorization.verificationSourceUri = `identity_verification_case:${identityCaseId}`;
      touch(authorization, actorUserId);
    }

    this.logger.info(
      {
        operation: 'ida.effects.license',
        authorizationId,
        practitionerProfileId: authorization.practitionerProfileId,
        recordedInAdmission: recorded,
      },
      'Medical license verified by the authority and recorded',
    );
  }

  /**
   * Marca la institución como verificada y activa.
   *
   * Hace lo mismo que `DirectoryTenantsService.verify` pero sin exigir que el
   * tenant siga en PENDIENTE: aquí el veredicto llega de una autoridad externa
   * y puede alcanzar a un tenant que ya estaba operando.
   *
   * @param tx - Transacción activa.
   * @param tenantId - Institución verificada.
   * @param actorUserId - Quién registró el resultado.
   */
  private async verifyTenant(
    tx: EntityManager,
    tenantId: string,
    actorUserId: string,
  ): Promise<void> {
    const tenant = await this.tenantsRepo.findById(tx, tenantId);
    if (!tenant) {
      this.logger.warn(
        { operation: 'ida.effects.tenant', tenantId },
        'Verified institution case points to a tenant that no longer exists',
      );
      return;
    }

    // P50 y P51: activar una farmacia o un laboratorio pendiente exige sus
    // papeles (y, la farmacia, el punto de su casa central), igual que la
    // verificación de la plataforma (`DirectoryTenantsService.verify`). El
    // veredicto de la autoridad prueba la identidad de la institución, no que
    // presentó la licencia o el certificado sanitario: sin este control, este
    // camino la dejaba operando sin ellos. Si faltan, el caso de verificación
    // se cierra igual —la identidad sí quedó probada— pero el tenant sigue
    // pendiente, sin sello público, y el motivo queda en el log.
    if (tenant.statusConceptId === DIR.TENANT_PENDING) {
      const operating = await this.operatingRequirements.evaluateForTenant(
        tx,
        tenant,
      );
      if (operating && !operating.readiness.ready) {
        this.logger.warn(
          {
            operation: 'ida.effects.tenant',
            tenantId,
            reason:
              operating.kind === 'PHARMACY'
                ? 'pharmacy-not-ready'
                : 'laboratory-not-ready',
            missing: operating.readiness.missing,
          },
          'Institution identity verified but kept pending: operating requirements missing',
        );
        return;
      }
    }

    tenant.verificationStatusConceptId = CONCEPTS.TENANT_VERIFIED;
    if (tenant.statusConceptId === DIR.TENANT_PENDING) {
      tenant.statusConceptId = CONCEPTS.TENANT_ACTIVE;
    }
    touch(tenant, actorUserId);

    await this.verification.applyVerified(tx, {
      targetId: tenantId,
      methodConceptId: COMM.BADGE_METHOD_AUTHORITY_CHECK,
      actorUserId,
      evidenceRef: `tenant:${tenantId}`,
    });

    this.logger.info(
      { operation: 'ida.effects.tenant', tenantId },
      'Institution verified after external verification',
    );
  }
}
