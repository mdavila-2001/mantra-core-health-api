import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { ConflictException, type AuthenticatedUser } from '../../../common';
import { AccessPoliciesRepository } from '../repositories';
import { CreateAccessPolicyDto, AuthzIdResponseDto, type Effect } from '../dto';
import { AUTHZ } from '../authz.concepts';

/** Traducción efecto → concept id. */
export const EFFECT_CONCEPT: Record<Effect, string> = {
  ALLOW: AUTHZ.EFFECT_ALLOW,
  DENY: AUTHZ.EFFECT_DENY,
};

/**
 * UC-06-02 — Política de acceso ABAC con enmascaramiento. La prioridad es única
 * por `(tenant_id, target_resource)` para dar un desempate determinista; `deny`
 * gana sobre `allow` en la evaluación (PDP).
 */
@Injectable()
export class AuthzPoliciesService {
  constructor(
    private readonly em: EntityManager,
    private readonly policiesRepo: AccessPoliciesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthzPoliciesService.name);
  }

  /** UC-06-02: publica una política ABAC para un tenant. */
  async create(
    tenantId: string,
    dto: CreateAccessPolicyDto,
    actor: AuthenticatedUser,
  ): Promise<AuthzIdResponseDto> {
    this.logger.info(
      { operation: 'authz.access-policy.create', tenantId, effect: dto.effect },
      'Publishing access policy',
    );
    return this.em.transactional(async (tx) => {
      if (dto.priority !== undefined) {
        const clash = await this.policiesRepo.findByTenantTargetPriority(
          tx,
          tenantId,
          dto.targetResource,
          dto.priority,
        );
        if (clash) {
          throw new ConflictException('Ya existe una política activa con esa prioridad para el recurso', {
            tenantId,
            targetResource: dto.targetResource,
            priority: dto.priority,
          });
        }
      }
      const policy = this.policiesRepo.create(tx, {
        tenantId,
        name: dto.name,
        effectConceptId: EFFECT_CONCEPT[dto.effect],
        targetResource: dto.targetResource,
        conditionJson: dto.conditionJson,
        priority: dto.priority,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: policy.id, status: 'ACTIVE', createdAt: policy.createdAt };
    });
  }
}
