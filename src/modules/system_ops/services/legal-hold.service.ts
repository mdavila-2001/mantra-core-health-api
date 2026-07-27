import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { GovernanceRepository, LegalHoldRepository } from '../repositories';
import { SYSOPS } from '../system_ops.concepts';
import {
  CreateLegalHoldDto,
  IdResultDto,
  ReleaseLegalHoldDto,
  StatusResultDto,
} from '../dto';

/**
 * UC-11-08: coloca / levanta un legal hold sobre un objetivo.
 *
 * Un objetivo no puede tener dos holds ACTIVE simultáneos (unique parcial en BD;
 * verificación previa aquí). Levantar exige que el hold esté ACTIVE. Cada cambio
 * queda en `governance_change_log`. Los holds ACTIVE excluyen objetivos del
 * barrido de retención (UC-11-05).
 */
@Injectable()
export class LegalHoldService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: LegalHoldRepository,
    private readonly governanceRepo: GovernanceRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LegalHoldService.name);
  }

  /** UC-11-08: coloca un legal hold (ACTIVE) sobre un objetivo. */
  async place(
    dto: CreateLegalHoldDto,
    actor: AuthenticatedUser,
  ): Promise<IdResultDto> {
    return this.em.transactional(async (tx) => {
      const active = await this.repo.findActive(
        tx,
        dto.tenantId,
        dto.targetTypeConceptId,
        dto.targetId,
      );
      if (active) {
        throw new ConflictException(
          'Ya existe un legal hold ACTIVE para ese objetivo',
          {
            targetId: dto.targetId,
          },
        );
      }
      const hold = this.repo.create(tx, {
        tenantId: dto.tenantId,
        targetTypeConceptId: dto.targetTypeConceptId,
        targetId: dto.targetId,
        reasonConceptId: dto.reasonConceptId,
        authorityReference: dto.authorityReference,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : new Date(),
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      this.governanceRepo.recordChange(tx, {
        targetType: 'legal_holds',
        targetId: hold.id,
        actionConceptId: SYSOPS.ACTION_CREATE,
        changedByUserId: actor.id,
        newSnapshotJson: { targetId: dto.targetId, status: 'ACTIVE' },
      });
      this.logger.info(
        { operation: 'sysops.legalhold.place', holdId: hold.id },
        'Legal hold placed',
      );
      return { id: hold.id };
    });
  }

  /** UC-11-08: levanta un legal hold ACTIVE (-> RELEASED). */
  async release(
    id: string,
    dto: ReleaseLegalHoldDto,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.em.transactional(async (tx) => {
      const hold = await this.repo.findById(tx, id);
      if (!hold)
        throw new ResourceNotFoundException('Legal hold no encontrado', { id });
      if (hold.statusConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException('El legal hold no está ACTIVE', {
          id,
        });
      }
      hold.statusConceptId = CONCEPTS.STATE_REVOKED;
      hold.endsAt = new Date();
      touch(hold, actor.id);
      this.governanceRepo.recordChange(tx, {
        targetType: 'legal_holds',
        targetId: hold.id,
        actionConceptId: SYSOPS.ACTION_RELEASE,
        changedByUserId: actor.id,
        previousSnapshotJson: { status: 'ACTIVE' },
        newSnapshotJson: { status: 'RELEASED' },
        reason: dto.reason,
      });
      this.logger.info(
        { operation: 'sysops.legalhold.release', holdId: hold.id },
        'Legal hold released',
      );
      return { ok: true };
    });
  }
}
