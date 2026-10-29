import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ResourceNotFoundException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import {
  InfrastructureAccessService,
  type InfraGrant,
} from '../../practice/services/infrastructure-access.service';
import { BillingErrorReason } from '../billing.error-reasons';
import { BILLING_PRACTICE_FAILURE } from '../billing-scope';

/**
 * Autorización de las tarifas y de los cargos devengados (F5e).
 *
 * Reutiliza el evaluador único de la infraestructura (`InfrastructureAccessService`,
 * CONTRATO-F2-F5 §0.3): el rol vale **dentro de su alcance** y el orden es
 * tenant → alcance → permiso (otro tenant, otra sucursal o un id inexistente
 * responden el mismo 404; un recurso visible al que el rol no alcanza, 403
 * `INFRA_ACTION_NOT_ALLOWED` con `details.requiredRoles`).
 *
 * La autoridad sale siempre del recurso **autoritativo** que guarda la base —la
 * cama o la práctica del cargo o de la tarifa—, nunca de un id que mande el cliente
 * para "declarar" su alcance:
 *
 * - un cargo se autoriza contra **su** cama (o, sin cama, contra su práctica);
 * - una tarifa de práctica, contra **las sedes de esa práctica**: para mirarla
 *   basta una; para escribirla hace falta mandar en todas (una tarifa vale en
 *   toda la práctica, y quien sólo manda en una sede no fija el precio de las otras);
 * - una tarifa propia de una sala, contra esa sala.
 */
@Injectable()
export class BillingAccessService {
  /**
   * @param access - Evaluador único de la infraestructura.
   */
  constructor(private readonly access: InfrastructureAccessService) {}

  /**
   * Autoriza una acción sobre una **cama** (o cualquier espacio).
   *
   * @param tx - Transacción o contexto activo.
   * @param actor - Quien pide.
   * @param action - Acción de la política de F5e.
   * @param careSpaceId - Espacio autoritativo.
   * @returns El alcance resuelto.
   */
  forSpace(
    tx: EntityManager,
    actor: AuthenticatedUser,
    action: string,
    careSpaceId: string,
  ): Promise<InfraGrant> {
    return this.access.assertCan(actor, action, { careSpaceId }, tx);
  }

  /**
   * ¿Puede el actor la acción sobre ese espacio? No lanza.
   *
   * @param tx - Transacción o contexto activo.
   * @param actor - Quien pide.
   * @param action - Acción de la política de F5e.
   * @param careSpaceId - Espacio autoritativo.
   */
  async canOnSpace(
    tx: EntityManager,
    actor: AuthenticatedUser,
    action: string,
    careSpaceId: string,
  ): Promise<boolean> {
    try {
      await this.forSpace(tx, actor, action, careSpaceId);
      return true;
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof InsufficientRoleException
      )
        return false;
      throw error;
    }
  }

  /**
   * Autoriza una acción sobre una **práctica** (sus tarifas y sus cargos).
   *
   * @param tx - Transacción o contexto activo.
   * @param actor - Quien pide.
   * @param action - Acción de la política de F5e.
   * @param practiceId - Práctica autoritativa (la de la tarifa o la del cargo).
   * @param mode - `any`: basta una sede de la práctica (lectura); `all`: todas (escritura).
   * @throws ResourceNotFoundException (404) si la práctica no es del tenant o el actor no llega a ninguna de sus sedes.
   * @throws InsufficientRoleException (403) si la ve pero ningún rol suyo permite la acción en el alcance pedido.
   */
  async forPractice(
    tx: EntityManager,
    actor: AuthenticatedUser,
    action: string,
    practiceId: string,
    mode: 'any' | 'all',
  ): Promise<void> {
    const tenantId = requireTenantId();
    const practice = await tx.execute<{ id: string }[]>(
      'select id from practice.practices where id = ? and tenant_id = ?',
      [practiceId, tenantId],
    );
    if (practice.length === 0) throw this.practiceNotFound();
    const sites = await tx.execute<{ id: string }[]>(
      'select id from practice.practice_sites where practice_id = ? and tenant_id = ? order by id',
      [practiceId, tenantId],
    );
    if (sites.length === 0) {
      await this.forPracticeWithoutSites(tx, actor, action, mode);
      return;
    }
    const failures: unknown[] = [];
    let granted = 0;
    for (const site of sites) {
      try {
        await this.access.assertCan(actor, action, { siteId: site.id }, tx);
        granted += 1;
      } catch (error) {
        if (
          !(error instanceof ResourceNotFoundException) &&
          !(error instanceof InsufficientRoleException)
        )
          throw error;
        failures.push(error);
      }
    }
    if (mode === 'any' ? granted > 0 : failures.length === 0) return;
    // Nada cubre al actor: 404 uniforme. Lo ve en parte, pero no le alcanza: 403.
    const forbidden = failures.find(
      (error) => error instanceof InsufficientRoleException,
    );
    if (forbidden) throw forbidden;
    if (granted > 0) throw this.notAllowed(action);
    throw failures[0];
  }

  /**
   * Una práctica sin sedes no tiene camas ni sedes que acoten el rol: sólo manda
   * la estructura del tenant (organización o plataforma).
   */
  private async forPracticeWithoutSites(
    tx: EntityManager,
    actor: AuthenticatedUser,
    action: string,
    mode: 'any' | 'all',
  ): Promise<void> {
    const level = (await this.access.structureLevel(tx, actor)).level;
    const writes = action.endsWith('.write') || mode === 'all';
    if (level === 'ORG') return;
    if (level === 'PLATFORM' && !writes) return;
    if (level === 'NONE' || level === 'MEMBER' || level.startsWith('BRANCH'))
      throw this.practiceNotFound();
    throw this.notAllowed(action);
  }

  private practiceNotFound(): ResourceNotFoundException {
    return new ResourceNotFoundException(
      BILLING_PRACTICE_FAILURE.message,
      undefined,
      BillingErrorReason.BILLING_PRACTICE_NOT_FOUND,
    );
  }

  private notAllowed(action: string): InsufficientRoleException {
    return new InsufficientRoleException(
      'Ningún rol suyo permite esta acción en toda la práctica',
      { action },
      'INFRA_ACTION_NOT_ALLOWED',
    );
  }
}
