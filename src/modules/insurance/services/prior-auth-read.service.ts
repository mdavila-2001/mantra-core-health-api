import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { sumarDecimales, type AuthenticatedUser } from '../../../common';
import { CatalogConcepts } from '../../terminology/entities';
import { Persons, PatientProfiles } from '../../profiles/entities';
import { PharmacyProducts } from '../../pharmacy/entities';
import { DiagnosticStudyOfferings } from '../../diagnostic_units/entities';
import { CatalogRepository, PriorAuthRepository } from '../repositories';
import {
  InsurancePlans,
  PatientCoverages,
  type PriorAuthorizationDeterminations,
  type PriorAuthorizationItems,
  type PriorAuthorizationRequests,
} from '../entities';
import { INS } from '../insurance.concepts';
import { resolveInsuranceCurrencyCode } from '../insurance-currency';
import type {
  PriorAuthDetailDto,
  PriorAuthInboxQueryDto,
  PriorAuthItemViewDto,
  PriorAuthListDto,
  PriorAuthListItemDto,
} from '../dto';
import {
  LinkedClaimAccessService,
  authorizeClaimResource,
  claimAccessDenied,
} from './linked-claim-access.service';

/** Tope de la bandeja: las más recientes primero. */
const INBOX_LIMIT = 200;

const STATUS_CODE: Record<string, PriorAuthListItemDto['status']> = {
  [INS.PRIOR_AUTH_SUBMITTED]: 'SUBMITTED',
  [INS.PRIOR_AUTH_IN_REVIEW]: 'IN_REVIEW',
  [INS.PRIOR_AUTH_DETERMINED]: 'DETERMINED',
};

const DECISION_CODE: Record<string, 'APPROVED' | 'DENIED' | 'PARTIAL'> = {
  [INS.DECISION_APPROVED]: 'APPROVED',
  [INS.DECISION_DENIED]: 'DENIED',
  [INS.DECISION_PARTIAL]: 'PARTIAL',
};

/**
 * Lectura de las solicitudes de aprobación **del lado de la aseguradora**
 * (registro de procesos · MÓDULO ASEGURADORA · Recepción de solicitudes de
 * órdenes de Aprobación). El alcance es la aseguradora del tenant activo,
 * administrado por quien consulta: la misma regla que `assertInsurer` aplica
 * al decidir. Ajena o inexistente: el mismo 403.
 */
@Injectable()
export class PriorAuthReadService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: PriorAuthRepository,
    private readonly catalog: CatalogRepository,
    private readonly linkedAccess: LinkedClaimAccessService,
  ) {}

  /** `GET /prior-authorization-requests/inbox`. */
  async listInbox(
    query: PriorAuthInboxQueryDto,
    actor: AuthenticatedUser,
  ): Promise<PriorAuthListDto> {
    const em = this.em.fork();
    const carrierId = await this.insurerCarrierId(em, actor);
    const statuses =
      query.status === 'PENDING'
        ? [INS.PRIOR_AUTH_SUBMITTED, INS.PRIOR_AUTH_IN_REVIEW]
        : query.status === 'DETERMINED'
          ? [INS.PRIOR_AUTH_DETERMINED]
          : [];
    const ids = await this.repo.findIdsForCarrier(
      em,
      carrierId,
      statuses,
      INBOX_LIMIT,
    );
    const requests = await this.repo.findRequestsByIds(em, ids);
    const order = new Map(ids.map((id, index) => [id, index]));
    requests.sort((a, b) => order.get(a.id)! - order.get(b.id)!);
    const views = await this.hydrate(em, requests);
    return {
      items: views.map((view) => {
        const { items: _items, decidedAt: _decidedAt, ...row } = view;
        return row;
      }),
    };
  }

  /** `GET /prior-authorization-requests/:id`. */
  async getForInsurer(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<PriorAuthDetailDto> {
    const em = this.em.fork();
    const carrierId = await this.insurerCarrierId(em, actor);
    const request = await this.repo.findRequest(em, id);
    if (!request) throw claimAccessDenied();
    const coverage = await em.findOne(PatientCoverages, {
      id: request.patientCoverageId,
    });
    const plan = coverage
      ? await this.catalog.findPlan(em, coverage.insurancePlanId)
      : null;
    const product = plan
      ? await this.catalog.findProduct(em, plan.insuranceProductId)
      : null;
    if (!product || product.insuranceCarrierId !== carrierId)
      throw claimAccessDenied();
    const [view] = await this.hydrate(em, [request]);
    return view;
  }

  private async insurerCarrierId(
    em: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<string> {
    let carrierId: string | undefined;
    await authorizeClaimResource(async () => {
      const tenantId = await this.linkedAccess.assertAdministrator(em, actor);
      const carrier = await this.catalog.findCarrierByTenantId(em, tenantId);
      if (!carrier) throw claimAccessDenied();
      carrierId = carrier.id;
    });
    return carrierId!;
  }

  private async hydrate(
    em: EntityManager,
    requests: readonly PriorAuthorizationRequests[],
  ): Promise<PriorAuthDetailDto[]> {
    if (requests.length === 0) return [];
    const requestIds = requests.map((request) => request.id);
    const [items, determinations, coverages] = await Promise.all([
      this.repo.findItemsByRequestIds(em, requestIds),
      this.repo.findDeterminationsByRequestIds(em, requestIds),
      em.find(PatientCoverages, {
        id: { $in: unique(requests.map((r) => r.patientCoverageId)) },
      }),
    ]);
    const personIds = unique(coverages.map((c) => c.patientProfileId));
    const productIds = unique(
      items.map((item) => item.pharmacyProductId ?? undefined),
    );
    const offeringIds = unique(
      items.map((item) => item.diagnosticStudyOfferingId ?? undefined),
    );
    const [plans, persons, profiles, products, offerings] = await Promise.all([
      em.find(InsurancePlans, {
        id: { $in: unique(coverages.map((c) => c.insurancePlanId)) },
      }),
      personIds.length ? em.find(Persons, { id: { $in: personIds } }) : [],
      personIds.length
        ? em.find(PatientProfiles, { profileId: { $in: personIds } })
        : [],
      productIds.length
        ? em.find(PharmacyProducts, { id: { $in: productIds } })
        : [],
      offeringIds.length
        ? em.find(DiagnosticStudyOfferings, { id: { $in: offeringIds } })
        : [],
    ]);
    const concepts = await this.conceptMap(em, [
      ...items.map((item) => item.serviceConceptId),
      ...items.map((item) => item.currencyConceptId),
      ...offerings.map((offering) => offering.studyConceptId),
    ]);

    const coverageById = new Map(coverages.map((c) => [c.id, c]));
    const planById = new Map(plans.map((p) => [p.id, p]));
    const personById = new Map(persons.map((p) => [p.id, p]));
    const profileById = new Map(profiles.map((p) => [p.profileId, p]));
    const productById = new Map(products.map((p) => [p.id, p]));
    const offeringById = new Map(offerings.map((o) => [o.id, o]));

    const itemsByRequest = groupBy(items, (i) => i.priorAuthorizationRequestId);
    // Vienen de la versión más nueva a la más vieja: la primera versión que
    // aparece por solicitud es la vigente.
    const currentVersion = new Map<string, number>();
    for (const d of determinations)
      if (!currentVersion.has(d.priorAuthorizationRequestId))
        currentVersion.set(
          d.priorAuthorizationRequestId,
          d.determinationVersion,
        );
    const current = determinations.filter(
      (d) =>
        currentVersion.get(d.priorAuthorizationRequestId) ===
        d.determinationVersion,
    );
    const globalByRequest = new Map<string, PriorAuthorizationDeterminations>();
    const byItem = new Map<string, PriorAuthorizationDeterminations>();
    for (const d of current) {
      if (d.priorAuthorizationItemId) byItem.set(d.priorAuthorizationItemId, d);
      else globalByRequest.set(d.priorAuthorizationRequestId, d);
    }

    return requests.map((request) => {
      const coverage = coverageById.get(request.patientCoverageId);
      const plan = coverage ? planById.get(coverage.insurancePlanId) : null;
      const person = coverage
        ? personById.get(coverage.patientProfileId)
        : null;
      const profile = coverage
        ? profileById.get(coverage.patientProfileId)
        : null;
      const requestItems = itemsByRequest.get(request.id) ?? [];
      const global = globalByRequest.get(request.id);
      const currencyConceptId = requestItems[0]?.currencyConceptId;
      const currency = concepts.get(currencyConceptId ?? '');
      return {
        id: request.id,
        origin: request.inventoryReservationId
          ? 'PHARMACY'
          : request.serviceRequestId
            ? 'DIAGNOSTIC'
            : 'GENERIC',
        status: STATUS_CODE[request.statusConceptId] ?? 'SUBMITTED',
        decision: global
          ? (DECISION_CODE[global.decisionConceptId] ?? null)
          : null,
        patient: {
          id: coverage?.patientProfileId ?? '',
          displayName: person?.displayName ?? null,
          patientCode: profile?.patientCode ?? null,
          memberIdentifier: coverage?.memberIdentifier ?? null,
        },
        planName: plan?.name ?? null,
        currencyCode: resolveInsuranceCurrencyCode(
          currencyConceptId,
          currency?.code,
        ),
        itemCount: requestItems.length,
        totalRequestedAmount: sumarDecimales(
          requestItems.map((item) => item.requestedAmount),
        ),
        submittedAt: request.submittedAt?.toISOString() ?? null,
        decidedAt: global?.decidedAt.toISOString() ?? null,
        items: requestItems.map((item) =>
          this.itemView(
            item,
            byItem.get(item.id),
            describe(item, productById, offeringById, concepts),
          ),
        ),
      };
    });
  }

  private itemView(
    item: PriorAuthorizationItems,
    decision: PriorAuthorizationDeterminations | undefined,
    description: string,
  ): PriorAuthItemViewDto {
    const code = decision ? DECISION_CODE[decision.decisionConceptId] : null;
    return {
      id: item.id,
      sequence: item.itemSequence,
      description,
      requestedQuantity: item.requestedQuantity ?? null,
      requestedAmount: item.requestedAmount ?? null,
      decision:
        decision && (code === 'APPROVED' || code === 'DENIED')
          ? {
              decision: code,
              approvedQuantity: decision.approvedQuantity ?? null,
              approvedAmount: decision.approvedAmount ?? null,
              policyClauseReference: decision.policyClauseReference ?? null,
              denialRationale: decision.denialRationale ?? null,
              decidedAt: decision.decidedAt.toISOString(),
            }
          : null,
    };
  }

  private async conceptMap(
    em: EntityManager,
    ids: ReadonlyArray<string | null | undefined>,
  ): Promise<Map<string, { code: string; display: string }>> {
    const clean = unique(ids);
    if (clean.length === 0) return new Map();
    const concepts = await em.find(CatalogConcepts, { id: { $in: clean } });
    return new Map(
      concepts.map((c) => [c.id, { code: c.code, display: c.display }]),
    );
  }
}

/** Nombre legible del ítem: producto, estudio o servicio, en ese orden. */
function describe(
  item: PriorAuthorizationItems,
  products: ReadonlyMap<string, PharmacyProducts>,
  offerings: ReadonlyMap<string, DiagnosticStudyOfferings>,
  concepts: ReadonlyMap<string, { display: string }>,
): string {
  const product = item.pharmacyProductId
    ? products.get(item.pharmacyProductId)
    : undefined;
  if (product) {
    const name =
      product.brandName ?? product.genericName ?? product.productCode;
    return [name, product.strengthText].filter(Boolean).join(' ');
  }
  const offering = item.diagnosticStudyOfferingId
    ? offerings.get(item.diagnosticStudyOfferingId)
    : undefined;
  if (offering)
    return concepts.get(offering.studyConceptId)?.display ?? offering.studyCode;
  return (
    concepts.get(item.serviceConceptId ?? '')?.display ??
    `Ítem ${item.itemSequence}`
  );
}

function unique(values: ReadonlyArray<string | null | undefined>): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))];
}

function groupBy<T>(values: readonly T[], key: (value: T) => string) {
  const map = new Map<string, T[]>();
  for (const value of values) {
    const bucket = map.get(key(value)) ?? [];
    bucket.push(value);
    map.set(key(value), bucket);
  }
  return map;
}
