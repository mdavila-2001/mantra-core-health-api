import { Injectable } from '@nestjs/common';
import { EntityManager, LockMode } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  mismosDecimales,
  sumarDecimales,
  type AuthenticatedUser,
} from '../../../common';
import { InventoryReservationLines } from '../../pharmacy_inventory/entities';
import {
  PriorAuthRepository,
  CoverageRepository,
  CatalogRepository,
} from '../repositories';
import { PriorAuthorizationRequests } from '../entities';
import { INS } from '../insurance.concepts';
import {
  CreatePriorAuthRequestDto,
  CreateDeterminationDto,
  CreatedResourceDto,
  ItemDeterminationDto,
  ResourceStatusDto,
} from '../dto';
import { LinkedClaimOrderService } from './linked-claim-order.service';
import {
  LinkedClaimAccessService,
  assertLegacyClaimRoles,
  claimAccessDenied,
  authorizeClaimResource,
} from './linked-claim-access.service';
import { requireNonNegativeAmount } from './linked-claim-validation';

const DECISION_CONCEPT: Record<string, string> = {
  APPROVED: INS.DECISION_APPROVED,
  DENIED: INS.DECISION_DENIED,
  PARTIAL: INS.DECISION_PARTIAL,
};

/** Decisión de un ítem ya validada contra la solicitud. */
interface ItemDecisionRow {
  itemId: string;
  decision: 'APPROVED' | 'DENIED';
  approvedQuantity?: string;
  approvedAmount?: string;
  denialReasonConceptId?: string;
  policyClauseReference?: string;
  denialRationale?: string;
}

/**
 * Decisión global a partir de la de cada ítem: todo aprobado → APPROVED, todo
 * denegado → DENIED, mezcla → PARTIAL. Si el cliente también mandó la global,
 * tiene que coincidir: dos verdades distintas en la misma versión no se guardan.
 */
export function deriveDecision(
  items: readonly Pick<ItemDeterminationDto, 'decision'>[],
  declared?: 'APPROVED' | 'DENIED' | 'PARTIAL',
): 'APPROVED' | 'DENIED' | 'PARTIAL' {
  const approved = items.filter((item) => item.decision === 'APPROVED').length;
  const derived =
    approved === items.length
      ? 'APPROVED'
      : approved === 0
        ? 'DENIED'
        : 'PARTIAL';
  if (declared && declared !== derived) {
    throw new PreconditionFailedException(
      'La decisión global no coincide con la decisión de los ítems',
    );
  }
  return derived;
}

@Injectable()
export class PriorAuthService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: PriorAuthRepository,
    private readonly coverage: CoverageRepository,
    private readonly logger: PinoLogger,
    private readonly linkedOrders: LinkedClaimOrderService,
    private readonly linkedAccess: LinkedClaimAccessService,
    private readonly catalog: CatalogRepository,
  ) {
    this.logger.setContext(PriorAuthService.name);
  }

  async submitRequest(
    dto: CreatePriorAuthRequestDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceStatusDto> {
    return this.em.transactional(async (tx) => {
      const linked = Boolean(
        dto.inventoryReservationId || dto.serviceRequestId,
      );
      if (linked) await this.linkedAccess.assertAdministrator(tx, actor);
      else assertLegacyClaimRoles(actor);
      if (dto.medicationRequestId && !dto.inventoryReservationId) {
        throw new PreconditionFailedException(
          'La receta requiere su pedido de farmacia vinculado',
        );
      }
      if (!linked) {
        const coverage = await this.coverage.findCoverage(
          tx,
          dto.patientCoverageId,
        );
        if (!coverage)
          throw new ResourceNotFoundException('Cobertura no encontrada');
      }
      let providerType = INS.ELIG_PROVIDER_TYPE_PRACTICE;
      let items = dto.items;
      let currency = dto.currencyConceptId;
      if (linked) {
        const snapshot = await this.linkedOrders.lockAndResolve(tx, {
          inventoryReservationId: dto.inventoryReservationId,
          serviceRequestId: dto.serviceRequestId,
          billingProviderEntityId: dto.requestingProviderEntityId,
          currencyConceptId: currency,
          lines: items.map((item) => ({
            diagnosticStudyOfferingId: item.diagnosticStudyOfferingId,
            serviceConceptId: item.serviceConceptId,
            quantity: item.requestedQuantity,
            billedAmount: item.requestedAmount,
          })),
        });
        await this.linkedAccess.assertProvider(tx, actor, snapshot);
        if (
          !snapshot?.canSubmit ||
          snapshot.billingProviderEntityId !== dto.requestingProviderEntityId
        ) {
          throw new PreconditionFailedException(
            'La autorización debe representar un pedido confirmado del prestador',
          );
        }
        if (
          dto.medicationRequestId &&
          dto.medicationRequestId !== snapshot.medicationRequestId
        ) {
          throw new PreconditionFailedException(
            'La receta debe pertenecer al mismo pedido',
          );
        }
        const resolved = await this.linkedAccess.coverageForOrder(
          tx,
          dto.patientCoverageId,
          snapshot,
          undefined,
          true,
        );
        currency = resolved.plan.currencyConceptId;
        if (dto.currencyConceptId && dto.currencyConceptId !== currency)
          throw new PreconditionFailedException(
            'La moneda no coincide con la cobertura',
          );
        if (snapshot.origin === 'PHARMACY') {
          providerType = INS.ELIG_PROVIDER_TYPE_PHARMACY;
          const portions = await tx.find(InventoryReservationLines, {
            id: {
              $in: snapshot.lines.map(
                (line) => line.inventoryReservationLineId!,
              ),
            },
          });
          const byId = new Map(
            portions.map((line) => [line.id, line.pharmacyProductId]),
          );
          const expected = new Map<
            string,
            { quantity: string[]; amount: string[]; serviceConceptId?: string }
          >();
          for (const line of snapshot.lines) {
            const productId = byId.get(line.inventoryReservationLineId!)!;
            const item = expected.get(productId) ?? {
              quantity: [],
              amount: [],
              serviceConceptId: line.serviceConceptId ?? undefined,
            };
            item.quantity.push(line.quantity!);
            item.amount.push(line.billedAmount!);
            expected.set(productId, item);
          }
          if (
            items.length !== expected.size ||
            new Set(items.map((item) => item.pharmacyProductId)).size !==
              items.length
          ) {
            throw new PreconditionFailedException(
              'La autorización debe incluir todos los productos del pedido',
            );
          }
          items = items.map((item) => {
            const source = expected.get(item.pharmacyProductId ?? '');
            if (
              !source ||
              item.diagnosticStudyOfferingId ||
              !mismosDecimales(
                item.requestedAmount,
                sumarDecimales(source.amount),
              ) ||
              !mismosDecimales(
                item.requestedQuantity,
                sumarDecimales(source.quantity),
              )
            ) {
              throw new PreconditionFailedException(
                'Los productos e importes deben coincidir con el pedido',
              );
            }
            return { ...item, serviceConceptId: source.serviceConceptId };
          });
        } else {
          providerType = INS.ELIG_PROVIDER_TYPE_DIAGNOSTIC_UNIT;
          if (
            !dto.currencyConceptId ||
            items.length !== 1 ||
            items[0].pharmacyProductId ||
            !mismosDecimales(items[0].requestedQuantity, '1')
          ) {
            throw new PreconditionFailedException(
              'La autorización diagnóstica requiere una oferta, cantidad uno y moneda',
            );
          }
          requireNonNegativeAmount(items[0].requestedAmount);
          items = [
            {
              ...items[0],
              serviceConceptId: snapshot.lines[0].serviceConceptId ?? undefined,
            },
          ];
        }
      }
      const request = this.repo.createRequest(tx, {
        patientCoverageId: dto.patientCoverageId,
        requestingProviderTypeConceptId: providerType,
        requestingProviderEntityId: dto.requestingProviderEntityId,
        inventoryReservationId: dto.inventoryReservationId,
        medicationRequestId: dto.medicationRequestId,
        serviceRequestId: dto.serviceRequestId,
        statusConceptId: INS.PRIOR_AUTH_SUBMITTED,
        submittedAt: new Date(),
        idempotencyKey: dto.idempotencyKey,
        actorUserId: actor.id,
      });
      await tx.flush();
      for (const [index, item] of items.entries()) {
        this.repo.createItem(tx, {
          priorAuthorizationRequestId: request.id,
          itemSequence: index + 1,
          serviceConceptId: item.serviceConceptId,
          pharmacyProductId: item.pharmacyProductId,
          diagnosticStudyOfferingId: item.diagnosticStudyOfferingId,
          requestedQuantity: item.requestedQuantity,
          requestedAmount: item.requestedAmount,
          currencyConceptId: currency,
        });
      }
      await tx.flush();
      return {
        id: request.id,
        status: request.statusConceptId,
        createdAt: request.createdAt,
      };
    });
  }

  async issueDetermination(
    requestId: string,
    dto: CreateDeterminationDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.em.transactional(async (tx) => {
      const initial = await this.repo.findRequest(tx, requestId);
      if (!initial) throw claimAccessDenied();
      const linked = Boolean(
        initial.inventoryReservationId || initial.serviceRequestId,
      );
      if (linked) {
        const coverage = await this.coverage.findCoverage(
          tx,
          initial.patientCoverageId,
        );
        const plan = coverage
          ? await this.catalog.findPlan(tx, coverage.insurancePlanId)
          : null;
        const product = plan
          ? await this.catalog.findProduct(tx, plan.insuranceProductId)
          : null;
        if (!product) throw claimAccessDenied();
        await authorizeClaimResource(() =>
          this.linkedAccess.assertInsurer(
            tx,
            actor,
            product.insuranceCarrierId,
          ),
        );
        await this.linkedOrders.lockAndResolve(tx, {
          inventoryReservationId: initial.inventoryReservationId,
          serviceRequestId: initial.serviceRequestId,
          billingProviderEntityId: initial.requestingProviderEntityId,
          lines: [],
        });
      } else await authorizeClaimResource(() => assertLegacyClaimRoles(actor));
      const request = await tx.findOne(
        PriorAuthorizationRequests,
        { id: requestId },
        { lockMode: LockMode.PESSIMISTIC_WRITE, refresh: true },
      );
      if (!request) throw claimAccessDenied();
      if (
        ![INS.PRIOR_AUTH_SUBMITTED, INS.PRIOR_AUTH_IN_REVIEW].includes(
          request.statusConceptId,
        )
      ) {
        throw new PreconditionFailedException(
          'La solicitud no admite determinación en su estado actual',
        );
      }
      if (linked) {
        if (dto.approvedAmount !== undefined)
          requireNonNegativeAmount(dto.approvedAmount);
        if (dto.approvedQuantity !== undefined)
          requireNonNegativeAmount(dto.approvedQuantity);
      }
      const itemRows = dto.items
        ? await this.resolveItemDecisions(tx, requestId, dto.items)
        : [];
      const decision = dto.items
        ? deriveDecision(dto.items, dto.decision)
        : dto.decision!;
      const version =
        (await this.repo.maxDeterminationVersion(tx, requestId)) + 1;
      const validFrom = dto.validFrom ? new Date(dto.validFrom) : undefined;
      const validTo = dto.validTo ? new Date(dto.validTo) : undefined;
      const determination = this.repo.createDetermination(tx, {
        priorAuthorizationRequestId: requestId,
        determinationVersion: version,
        decisionConceptId: DECISION_CONCEPT[decision],
        approvedQuantity: dto.approvedQuantity,
        approvedAmount:
          dto.approvedAmount ??
          (dto.items
            ? sumarDecimales(itemRows.map((row) => row.approvedAmount ?? '0'))
            : undefined),
        validFrom,
        validTo,
        actorUserId: actor.id,
      });
      // Una fila por ítem, en la misma versión que la global: la global dice
      // APROBADO / PARCIAL / NO APROBADO y las del ítem dicen cuál y por qué.
      for (const row of itemRows) {
        this.repo.createDetermination(tx, {
          priorAuthorizationRequestId: requestId,
          priorAuthorizationItemId: row.itemId,
          determinationVersion: version,
          decisionConceptId: DECISION_CONCEPT[row.decision],
          approvedQuantity: row.approvedQuantity,
          approvedAmount: row.approvedAmount,
          denialReasonConceptId: row.denialReasonConceptId,
          policyClauseReference: row.policyClauseReference,
          denialRationale: row.denialRationale,
          validFrom,
          validTo,
          actorUserId: actor.id,
        });
      }
      request.statusConceptId = INS.PRIOR_AUTH_DETERMINED;
      touch(request, actor.id);
      await tx.flush();
      return { id: determination.id };
    });
  }

  /**
   * Valida que cada ítem de la solicitud se decida exactamente una vez y
   * completa los importes: si se aprueba sin importe, se aprueba lo solicitado;
   * nunca más de lo solicitado. Un NO APROBADO no lleva importe aprobado.
   */
  private async resolveItemDecisions(
    tx: EntityManager,
    requestId: string,
    decisions: readonly ItemDeterminationDto[],
  ): Promise<ItemDecisionRow[]> {
    const items = await this.repo.findItemsByRequestIds(tx, [requestId]);
    const byId = new Map(items.map((item) => [item.id, item]));
    const seen = new Set<string>();
    for (const decision of decisions) {
      if (!byId.has(decision.priorAuthorizationItemId))
        throw new PreconditionFailedException(
          'El ítem decidido no pertenece a la solicitud',
        );
      if (seen.has(decision.priorAuthorizationItemId))
        throw new PreconditionFailedException(
          'Cada ítem se decide una sola vez',
        );
      seen.add(decision.priorAuthorizationItemId);
    }
    if (seen.size !== items.length)
      throw new PreconditionFailedException(
        'La determinación debe decidir todos los ítems de la solicitud',
      );
    return decisions.map((decision) => {
      const item = byId.get(decision.priorAuthorizationItemId)!;
      if (decision.decision === 'DENIED') {
        if (
          decision.approvedAmount !== undefined ||
          decision.approvedQuantity !== undefined
        )
          throw new PreconditionFailedException(
            'Un ítem no aprobado no lleva cantidad ni monto aprobado',
          );
        return {
          itemId: item.id,
          decision: 'DENIED',
          denialReasonConceptId: decision.denialReasonConceptId,
          policyClauseReference: decision.policyClauseReference?.trim(),
          denialRationale: decision.denialRationale?.trim() || undefined,
        };
      }
      const approvedAmount = decision.approvedAmount ?? item.requestedAmount;
      const approvedQuantity =
        decision.approvedQuantity ?? item.requestedQuantity;
      if (approvedAmount !== undefined && approvedAmount !== null) {
        requireNonNegativeAmount(approvedAmount);
        if (
          item.requestedAmount !== undefined &&
          item.requestedAmount !== null &&
          sumarDecimales([
            item.requestedAmount,
            `-${approvedAmount.replace(/^\+/, '')}`,
          ])!.startsWith('-')
        )
          throw new PreconditionFailedException(
            'El monto aprobado no puede superar el solicitado',
          );
      }
      if (approvedQuantity !== undefined && approvedQuantity !== null)
        requireNonNegativeAmount(approvedQuantity);
      return {
        itemId: item.id,
        decision: 'APPROVED',
        approvedAmount: approvedAmount ?? undefined,
        approvedQuantity: approvedQuantity ?? undefined,
        policyClauseReference:
          decision.policyClauseReference?.trim() || undefined,
      };
    });
  }
}
