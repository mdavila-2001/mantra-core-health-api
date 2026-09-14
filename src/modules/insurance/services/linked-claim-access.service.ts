import { ForbiddenException, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  type AuthenticatedUser,
  requireTenantId,
  PreconditionFailedException,
} from '../../../common';
import { TenantAdministrationService } from '../../directory/services/tenant-administration.service';
import { CatalogRepository, CoverageRepository } from '../repositories';
import { INS } from '../insurance.concepts';
import type { LinkedOrderSnapshot } from './linked-claim-validation';

export function assertLegacyClaimRoles(actor: AuthenticatedUser): void {
  if (
    !(actor.roles ?? []).some((role) =>
      ['BILLING', 'FINANCE', 'SUPERADMIN'].includes(role),
    )
  ) {
    throw new ForbiddenException('Rol insuficiente para la operación');
  }
}
export function claimAccessDenied(): ForbiddenException {
  return new ForbiddenException('No hay acceso a esa solicitud de seguro');
}

/** Evita distinguir un recurso ajeno de uno inexistente por el texto del 403. */
export async function authorizeClaimResource(
  check: () => void | Promise<void>,
): Promise<void> {
  try {
    await check();
  } catch (error) {
    if (error instanceof ForbiddenException) throw claimAccessDenied();
    throw error;
  }
}

@Injectable()
export class LinkedClaimAccessService {
  constructor(
    private readonly administration: TenantAdministrationService,
    private readonly catalog: CatalogRepository,
    private readonly coverages: CoverageRepository,
  ) {}

  async assertAdministrator(
    tx: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<string> {
    const tenantId = requireTenantId();
    await this.administration.assertCanAdminister(tx, tenantId, actor);
    return tenantId;
  }

  async assertProvider(
    tx: EntityManager,
    actor: AuthenticatedUser,
    snapshot: LinkedOrderSnapshot | null,
  ): Promise<void> {
    const tenantId = await this.assertAdministrator(tx, actor);
    if (!snapshot || snapshot.providerTenantId !== tenantId)
      throw claimAccessDenied();
  }

  async assertInsurer(
    tx: EntityManager,
    actor: AuthenticatedUser,
    carrierId: string,
  ): Promise<void> {
    const tenantId = await this.assertAdministrator(tx, actor);
    const carrier = await this.catalog.findCarrierByTenantId(tx, tenantId);
    if (!carrier || carrier.id !== carrierId) throw claimAccessDenied();
  }

  async coverageForOrder(
    tx: EntityManager,
    coverageId: string,
    snapshot: LinkedOrderSnapshot,
    carrierId?: string,
    requireCurrent = false,
  ) {
    const coverage = await this.coverages.findCoverage(tx, coverageId);
    if (!coverage || coverage.patientProfileId !== snapshot.patientProfileId)
      throw claimAccessDenied();
    const plan = await this.catalog.findPlan(tx, coverage.insurancePlanId);
    const product = plan
      ? await this.catalog.findProduct(tx, plan.insuranceProductId)
      : null;
    if (
      !plan ||
      !product ||
      (carrierId && product.insuranceCarrierId !== carrierId)
    ) {
      throw new PreconditionFailedException(
        'La cobertura no corresponde a la aseguradora indicada',
      );
    }
    if (
      !plan.currencyConceptId ||
      (snapshot.currencyConceptId &&
        snapshot.currencyConceptId !== plan.currencyConceptId)
    ) {
      throw new PreconditionFailedException(
        'La moneda de la cobertura y del pedido debe coincidir',
      );
    }
    // Una cobertura declarada (VERIFY_PENDING) basta: ninguna escritura produce
    // VERIFY_VERIFIED y la aseguradora adjudica de todos modos (decisión 2026-09-13).
    if (
      requireCurrent &&
      (coverage.statusConceptId !== INS.COVERAGE_ACTIVE ||
        !withinDates(coverage) ||
        !withinDates(plan))
    ) {
      throw new PreconditionFailedException(
        'La cobertura debe estar activa y vigente para presentar el reclamo',
      );
    }
    return { coverage, plan, insuranceCarrierId: product.insuranceCarrierId };
  }
}

function civilDate(value: Date | string): string {
  return typeof value === 'string'
    ? value.slice(0, 10)
    : value.toISOString().slice(0, 10);
}
function withinDates(value: {
  effectiveFrom?: Date | string;
  effectiveTo?: Date | string;
}): boolean {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return (
    (!value.effectiveFrom || civilDate(value.effectiveFrom) <= today) &&
    (!value.effectiveTo || civilDate(value.effectiveTo) >= today)
  );
}
