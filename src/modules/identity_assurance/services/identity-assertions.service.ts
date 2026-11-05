import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  requireTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { IDA } from '../identity_assurance.concepts';
import {
  IdentityAssertionsRepository,
  IdentityFraudSignalsRepository,
} from '../repositories';
import { RevokeAssertionDto, AssertionRevokedResponseDto } from '../dto';
import { IdentityVerificationEffectsService } from './identity-verification-effects.service';
import { IdentityCaseScope } from './identity-case-scope.service';
import { IdentityAssuranceErrorReason } from '../identity_assurance.error-reasons';
import { assertResourceInTenant } from '../../../common/tenant/resource-scope';

/**
 * UC-27-11: revocación de una aserción de identidad. Única mutación permitida en
 * la tabla inmutable (metadatos de revocación); el guard `revoked_at IS NULL`
 * evita doble revocación. Opcionalmente deriva una señal de fraude.
 */
@Injectable()
export class IdentityAssertionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param assertionsRepo - Valor de assertions repo requerido por la operación.
   * @param fraudRepo - Valor de fraud repo requerido por la operación.
   * @param effects - Efectos de dominio al revocar.
   * @param scope - Alcance por tenant de los casos.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly assertionsRepo: IdentityAssertionsRepository,
    private readonly fraudRepo: IdentityFraudSignalsRepository,
    private readonly effects: IdentityVerificationEffectsService,
    private readonly scope: IdentityCaseScope,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IdentityAssertionsService.name);
  }

  /** UC-27-11: revoca una aserción vigente y marca el caso como revocado. */
  async revoke(
    assertionId: string,
    dto: RevokeAssertionDto,
    actor: AuthenticatedUser,
  ): Promise<AssertionRevokedResponseDto> {
    this.logger.info(
      { operation: 'ida.assertion.revoke', actorId: actor.id, assertionId },
      'Revoking identity assertion',
    );
    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      // La aserción no lleva tenant: lo hereda del sujeto de su caso. Ajena e
      // inexistente responden igual y la aserción no se toca.
      const found = await this.assertionsRepo.findById(tx, assertionId);
      const ownCase = found
        ? await this.scope.findAuthorizedCase(
            tx,
            found.identityVerificationCaseId,
            tenantId,
          )
        : null;
      const assertion = assertResourceInTenant(
        found,
        ownCase ? tenantId : null,
        tenantId,
        {
          message: 'Aserción de identidad no encontrada',
          reason: IdentityAssuranceErrorReason.ASSERTION_NOT_AVAILABLE,
        },
      );
      if (assertion.revokedAt) {
        throw new ConflictException('La aserción ya está revocada', {
          assertionId,
        });
      }

      const now = new Date();
      assertion.revokedAt = now;
      assertion.revocationReasonConceptId =
        dto.revocationReasonConceptId ?? IDA.REVOCATION_FRAUD;

      const kase = assertResourceInTenant(ownCase, tenantId, tenantId, {
        message: 'Caso de verificación no encontrado',
        reason: IdentityAssuranceErrorReason.CASE_NOT_AVAILABLE,
      });
      kase.statusConceptId = IDA.CASE_REVOKED;
      touch(kase, actor.id);

      // P13: el sello público cae con la aserción. Va en la misma transacción
      // porque una aserción revocada con el perfil todavía luciendo
      // «Verificado» es exactamente el estado que este carril hace imposible.
      await this.effects.applyRevoked(tx, kase, actor.id, 'REVOKED');

      if (dto.raiseFraudSignal) {
        if (!dto.fraudSignalTypeConceptId || !dto.fraudSeverityConceptId) {
          throw new PreconditionFailedException(
            'Para derivar una señal de fraude se requieren tipo y severidad',
            { assertionId },
          );
        }
        this.fraudRepo.create(tx, {
          identityVerificationCaseId: kase.id,
          signalTypeConceptId: dto.fraudSignalTypeConceptId,
          severityConceptId: dto.fraudSeverityConceptId,
          evidenceReference: `assertion:${assertion.id}`,
          resolutionConceptId: IDA.FRAUD_OPEN,
        });
      }

      await tx.flush();
      return {
        id: assertion.id,
        revokedAt: assertion.revokedAt,
        caseStatus: kase.statusConceptId,
      };
    });
  }
}
