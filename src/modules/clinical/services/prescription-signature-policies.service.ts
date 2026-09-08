import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { PrescriptionSignaturePoliciesRepository } from '../repositories';
import {
  CreatePrescriptionSignaturePolicyDto,
  PrescriptionSignaturePolicyResponseDto,
} from '../dto';
import { PrescriptionSignaturePolicies } from '../entities';

/** Criterio de resolución de la política de firma para una receta concreta. */
export interface SignaturePolicyCriteria {
  /**
   * Valor de medication type mantenido por la instancia.
   */
  medicationType?: string;
  /**
   * Valor de channel mantenido por la instancia.
   */
  channel?: string;
  /**
   * Valor de jurisdiction mantenido por la instancia.
   */
  jurisdiction?: string;
}

/**
 * Política PARAMETRIZABLE de firma de receta (ALOVIDA D-05 / CAN-RX).
 *
 * Administra las políticas (alta, listado y desactivación SIN borrado duro) y
 * resuelve, para una receta, si la firma es obligatoria. Diseño FAIL-SAFE: si un
 * tenant no tiene política vigente que aplique, `isSignatureRequired` devuelve
 * `false` y el flujo de emisión de receta sigue intacto.
 */
@Injectable()
export class PrescriptionSignaturePoliciesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param repo - Valor de repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: PrescriptionSignaturePoliciesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PrescriptionSignaturePoliciesService.name);
  }

  /**
   * Transforma to response.
   *
   * @param policy - Valor de policy requerido por la operación.
   * @returns Resultado de to response conforme al contrato `PrescriptionSignaturePolicyResponseDto`.
   */
  private toResponse(
    policy: PrescriptionSignaturePolicies,
  ): PrescriptionSignaturePolicyResponseDto {
    return {
      id: policy.id,
      tenantId: policy.tenantId,
      jurisdictionCode: policy.jurisdictionCode ?? null,
      medicationTypeConceptId: policy.medicationTypeConceptId ?? null,
      channelConceptId: policy.channelConceptId ?? null,
      signatureRequired: policy.signatureRequired,
      effectiveFrom: policy.effectiveFrom,
      effectiveTo: policy.effectiveTo ?? null,
    };
  }

  /** Número de dimensiones acotadas (no comodín): mide la especificidad. */
  private specificity(policy: PrescriptionSignaturePolicies): number {
    let score = 0;
    if (policy.jurisdictionCode != null) score += 1;
    if (policy.medicationTypeConceptId != null) score += 1;
    if (policy.channelConceptId != null) score += 1;
    return score;
  }

  /** Alta de una política de firma. */
  async create(
    dto: CreatePrescriptionSignaturePolicyDto,
    actor: AuthenticatedUser,
  ): Promise<PrescriptionSignaturePolicyResponseDto> {
    this.logger.info(
      {
        operation: 'clinical.signaturePolicy.create',
        tenantId: dto.tenantId,
        signatureRequired: dto.signatureRequired,
      },
      'Creating prescription signature policy',
    );
    return this.em.transactional(async (tx) => {
      const policy = this.repo.create(tx, {
        tenantId: dto.tenantId,
        jurisdictionCode: dto.jurisdictionCode,
        medicationTypeConceptId: dto.medicationTypeConceptId,
        channelConceptId: dto.channelConceptId,
        signatureRequired: dto.signatureRequired,
        effectiveFrom: dto.effectiveFrom
          ? new Date(dto.effectiveFrom)
          : new Date(),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
        actorUserId: actor.id,
      });
      await tx.flush();
      return this.toResponse(policy);
    });
  }

  /** Listado de políticas de un tenant. */
  async list(
    tenantId: string,
  ): Promise<PrescriptionSignaturePolicyResponseDto[]> {
    const policies = await this.repo.findByTenant(this.em, tenantId);
    return policies.map((p) => this.toResponse(p));
  }

  /**
   * Desactiva una política SIN borrado duro: cierra su vigencia poblando
   * `effective_to = now`. A partir de ese instante deja de resolverse como activa.
   */
  async deactivate(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<PrescriptionSignaturePolicyResponseDto> {
    this.logger.info(
      { operation: 'clinical.signaturePolicy.deactivate', policyId: id },
      'Deactivating prescription signature policy',
    );
    return this.em.transactional(async (tx) => {
      const policy = await this.repo.findById(tx, id);
      if (!policy) {
        throw new ResourceNotFoundException('Política no encontrada', {
          policyId: id,
        });
      }
      const now = new Date();
      // No se sobreescribe una fecha de fin anterior ya pasada.
      if (!policy.effectiveTo || policy.effectiveTo > now) {
        policy.effectiveTo = now;
      }
      touch(policy, actor.id);
      await tx.flush();
      return this.toResponse(policy);
    });
  }

  /**
   * Resuelve si la firma es obligatoria para una receta. Elige la política
   * vigente MÁS ESPECÍFICA que aplique (dimensiones nulas = comodín; desempate
   * por `effective_from` más reciente). FAIL-SAFE: si ninguna aplica, `false`.
   */
  async isSignatureRequired(
    tenantId: string,
    criteria: SignaturePolicyCriteria,
  ): Promise<boolean> {
    const now = new Date();
    const active = await this.repo.findActive(this.em, tenantId, now);

    const applicable = active.filter(
      (p) =>
        (p.jurisdictionCode == null ||
          p.jurisdictionCode === criteria.jurisdiction) &&
        (p.medicationTypeConceptId == null ||
          p.medicationTypeConceptId === criteria.medicationType) &&
        (p.channelConceptId == null || p.channelConceptId === criteria.channel),
    );

    if (applicable.length === 0) {
      // Fail-safe: sin política aplicable, no se exige firma.
      return false;
    }

    const winner = applicable.reduce((best, candidate) => {
      const bestScore = this.specificity(best);
      const candScore = this.specificity(candidate);
      if (candScore > bestScore) return candidate;
      if (candScore < bestScore) return best;
      // Desempate: la vigencia más reciente gana.
      return candidate.effectiveFrom > best.effectiveFrom ? candidate : best;
    });

    return winner.signatureRequired;
  }
}
