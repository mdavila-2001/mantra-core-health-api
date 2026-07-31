import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, touch } from '../../../common';
import { PROF } from '../../profiles/profiles.concepts';
import {
  HealthPractitionerProfilesRepository,
  JurisdictionAuthorizationsRepository,
} from '../../profiles/repositories';
import { TenantsRepository } from '../../directory/repositories';
import { DIR } from '../../directory/directory.concepts';
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
 */
@Injectable()
export class IdentityVerificationEffectsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param authorizationsRepo - Valor de authorizations repo requerido por la operación.
   * @param practitionersRepo - Valor de practitioners repo requerido por la operación.
   * @param tenantsRepo - Valor de tenants repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly authorizationsRepo: JurisdictionAuthorizationsRepository,
    private readonly practitionersRepo: HealthPractitionerProfilesRepository,
    private readonly tenantsRepo: TenantsRepository,
    private readonly logger: PinoLogger,
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
        await this.activateLicense(tx, kase.subjectEntityId, actorUserId);
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
   * Activa la matrícula verificada y, con ella, al profesional que la sostiene.
   *
   * @param tx - Transacción activa.
   * @param authorizationId - Autorización jurisdiccional verificada.
   * @param actorUserId - Quién registró el resultado.
   */
  private async activateLicense(
    tx: EntityManager,
    authorizationId: string,
    actorUserId: string,
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

    authorization.stateConceptId = PROF.AUTH_ACTIVE;
    touch(authorization, actorUserId);

    // Una matrícula verificada es lo que habilita a ejercer: el profesional
    // deja de estar en onboarding.
    const practitioner = await this.practitionersRepo.findById(
      tx,
      authorization.practitionerProfileId,
    );
    if (practitioner) {
      practitioner.verificationStatusConceptId = PROF.PRACT_VERIF_VERIFIED;
      practitioner.practiceStatusConceptId = PROF.PRACTICE_ACTIVE;
      touch(practitioner, actorUserId);
    }

    this.logger.info(
      {
        operation: 'ida.effects.license',
        authorizationId,
        practitionerProfileId: authorization.practitionerProfileId,
      },
      'Medical license activated after external verification',
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

    tenant.verificationStatusConceptId = CONCEPTS.TENANT_VERIFIED;
    if (tenant.statusConceptId === DIR.TENANT_PENDING) {
      tenant.statusConceptId = CONCEPTS.TENANT_ACTIVE;
    }
    touch(tenant, actorUserId);

    this.logger.info(
      { operation: 'ida.effects.tenant', tenantId },
      'Institution verified after external verification',
    );
  }
}
