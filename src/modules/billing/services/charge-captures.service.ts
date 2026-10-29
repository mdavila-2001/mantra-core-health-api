import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { AUD } from '../../audit/audit.concepts';
import { HistoryRepository } from '../../audit/repositories';
import { ATTRIBUTES } from '../../practice/infrastructure-catalog';
import { BILL } from '../billing.concepts';
import { BillingErrorReason } from '../billing.error-reasons';
import type {
  ChargeCaptureResponseDto,
  PendingChargesResponseDto,
  VoidChargeCaptureDto,
} from '../dto';
import { BillingAccessService } from './billing-access.service';
import { CHARGE_EVENTS, ChargeEventsService } from './charge-events.service';

/** Fila de `billing.charge_captures` con lo que la API muestra y decide. */
export interface ChargeRow {
  id: string;
  tenant_id: string;
  practice_id: string;
  patient_profile_id: string;
  encounter_id: string;
  source_kind_concept_id: string;
  service_date: string;
  care_space_id: string | null;
  bed_category_concept_id: string | null;
  space_tariff_id: string | null;
  service_catalog_id: string | null;
  minimum_stay_charge: boolean;
  quantity: string;
  unit_price: string | null;
  currency_concept_id: string | null;
  cost_center_id: string | null;
  status_concept_id: string;
  invoice_line_id: string | null;
  void_reason: string | null;
  idempotency_key: string;
  created_at: Date;
}

/** Columnas de {@link ChargeRow} (fechas y números como texto). */
export const CHARGE_COLUMNS = `c.id, c.tenant_id, c.practice_id, c.patient_profile_id, c.encounter_id,
  c.source_kind_concept_id, c.service_date::text as service_date, c.care_space_id, c.bed_category_concept_id,
  c.space_tariff_id, c.service_catalog_id, c.minimum_stay_charge, c.quantity::text as quantity, c.unit_price::text as unit_price,
  c.currency_concept_id, c.cost_center_id, c.status_concept_id, c.invoice_line_id, c.void_reason,
  c.idempotency_key, c.created_at`;

const CHARGE_NOT_FOUND = {
  message: 'Cargo no encontrado',
  reason: BillingErrorReason.CHARGE_CAPTURE_NOT_FOUND,
};

/** Estado del cargo como código de la API. */
export function chargeStatus(
  conceptId: string,
): ChargeCaptureResponseDto['status'] {
  if (conceptId === BILL.CHG_INVOICED) return 'INVOICED';
  if (conceptId === BILL.CHG_VOIDED) return 'VOIDED';
  return 'PENDING';
}

/** Proyección pública de un cargo. */
export function toChargeResponse(row: ChargeRow): ChargeCaptureResponseDto {
  return {
    id: row.id,
    encounterId: row.encounter_id,
    sourceKind:
      row.source_kind_concept_id === BILL.CHG_SRC_OR_TIME
        ? 'OR_TIME'
        : 'BED_DAY',
    serviceDate: row.service_date,
    careSpaceId: row.care_space_id,
    bedCategoryCode:
      ATTRIBUTES.bedCategory.byConceptId(row.bed_category_concept_id)?.code ??
      null,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    currencyConceptId: row.currency_concept_id,
    serviceCatalogId: row.service_catalog_id,
    costCenterId: row.cost_center_id,
    status: chargeStatus(row.status_concept_id),
    minimumStayCharge: row.minimum_stay_charge,
    tariffMissing:
      row.unit_price === null && row.status_concept_id === BILL.CHG_PENDING,
    invoiceLineId: row.invoice_line_id,
    voidReason: row.void_reason,
    createdAt: row.created_at,
  };
}

/**
 * Cargos devengados antes de facturar (CONTRATO-F2-F5 F5e): lectura de los
 * pendientes de un encuentro, anulación con motivo y el paso a `INVOICED` cuando
 * una factura los incorpora.
 *
 * Un cargo emitido **no se edita**: se anula con motivo (el rastro queda en la
 * historia y en el evento) y la corrección es un cargo nuevo. La base lo impone
 * con un trigger; este servicio lo pre-valida para responder con un `reason`
 * propio.
 */
@Injectable()
export class ChargeCapturesService {
  /**
   * @param em - Contexto de persistencia.
   * @param access - Autorización de Facturación.
   * @param events - Outbox.
   * @param historyRepo - Historia append-only.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly access: BillingAccessService,
    private readonly events: ChargeEventsService,
    private readonly historyRepo: HistoryRepository,
  ) {}

  /**
   * `GET /billing/encounters/:encounterId/pending-charges`.
   *
   * Sólo devuelve los cargos cuya **cama** (o práctica, si no tiene cama) el actor
   * puede ver; un encuentro que el actor no alcanza en ninguna sede responde el
   * mismo 404 que uno inexistente o de otro tenant.
   *
   * @param encounterId - Encuentro.
   * @param actor - Quien lee.
   */
  async pendingForEncounter(
    encounterId: string,
    actor: AuthenticatedUser,
  ): Promise<PendingChargesResponseDto> {
    const tenantId = requireTenantId();
    const tx = this.em.fork();
    const encounter = await tx.execute<{ id: string }[]>(
      'select id from clinical.encounters where id = ? and tenant_id = ?',
      [encounterId, tenantId],
    );
    if (encounter.length === 0) throw this.encounterNotFound();

    const rows = await tx.execute<ChargeRow[]>(
      `select ${CHARGE_COLUMNS} from billing.charge_captures c
        where c.encounter_id = ? and c.tenant_id = ? and c.status_concept_id = ?
        order by c.service_date, c.created_at, c.id`,
      [encounterId, tenantId, BILL.CHG_PENDING],
    );
    if (rows.length === 0) {
      await this.assertSeesEncounter(tx, actor, encounterId, tenantId);
      return { encounterId, items: [], count: 0 };
    }
    const visible: ChargeRow[] = [];
    const bySpace = new Map<string, boolean>();
    const byPractice = new Map<string, boolean>();
    for (const row of rows) {
      if (row.care_space_id) {
        if (!bySpace.has(row.care_space_id))
          bySpace.set(
            row.care_space_id,
            await this.access.canOnSpace(
              tx,
              actor,
              'infra.charge.view',
              row.care_space_id,
            ),
          );
        if (bySpace.get(row.care_space_id)) visible.push(row);
      } else {
        if (!byPractice.has(row.practice_id))
          byPractice.set(
            row.practice_id,
            await this.canOnPractice(tx, actor, row.practice_id),
          );
        if (byPractice.get(row.practice_id)) visible.push(row);
      }
    }
    if (visible.length === 0) throw this.encounterNotFound();
    return {
      encounterId,
      items: visible.map(toChargeResponse),
      count: visible.length,
    };
  }

  /**
   * `POST /billing/charge-captures/:id/void`.
   *
   * @param id - Cargo.
   * @param dto - Motivo.
   * @param actor - Quien anula.
   * @param correlationId - Id de correlación.
   * @returns El cargo anulado.
   */
  async void(
    id: string,
    dto: VoidChargeCaptureDto,
    actor: AuthenticatedUser,
    correlationId?: string,
  ): Promise<ChargeCaptureResponseDto> {
    const reason = dto.reason.trim();
    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      const rows = await tx.execute<ChargeRow[]>(
        `select ${CHARGE_COLUMNS} from billing.charge_captures c
          where c.id = ? and c.tenant_id = ? for update`,
        [id, tenantId],
      );
      if (rows.length === 0) throw this.chargeNotFound();
      const charge = rows[0];
      // La autoridad es la cama (o la práctica) que guarda el cargo.
      if (charge.care_space_id)
        await this.access.forSpace(
          tx,
          actor,
          'infra.charge.void',
          charge.care_space_id,
        );
      else
        await this.access.forPractice(
          tx,
          actor,
          'infra.charge.void',
          charge.practice_id,
          'any',
        );
      if (reason.length === 0)
        throw new PreconditionFailedException(
          'El motivo de la anulación es obligatorio',
          { errors: [{ field: 'reason' }] },
          BillingErrorReason.CHARGE_VOID_REASON_REQUIRED,
        );
      if (charge.status_concept_id === BILL.CHG_VOIDED)
        throw new ConflictException(
          'El cargo ya está anulado',
          undefined,
          BillingErrorReason.CHARGE_ALREADY_VOIDED,
        );

      const voided = await this.markVoided(tx, charge, reason, actor.id);
      await this.events.publish(tx, {
        type: CHARGE_EVENTS.chargeVoided,
        aggregateType: 'charge_capture',
        aggregateId: id,
        tenantId,
        actorUserId: actor.id,
        correlationId,
        payload: this.voidedPayload(charge, 'MANUAL'),
      });
      return toChargeResponse(voided);
    });
  }

  /**
   * Anula un cargo dentro de la transacción del llamador (también lo usa la
   * corrección automática de la ocupación). No autoriza ni publica: lo hace quien llama.
   *
   * @param tx - Transacción.
   * @param charge - El cargo cargado y bloqueado.
   * @param reason - Motivo (no vacío).
   * @param actorUserId - Quien anula; `null` si lo hace el sistema.
   */
  async markVoided(
    tx: EntityManager,
    charge: ChargeRow,
    reason: string,
    actorUserId: string | null,
  ): Promise<ChargeRow> {
    const rows = await tx.execute<(ChargeRow & { snapshot: unknown })[]>(
      `update billing.charge_captures c
          set status_concept_id = ?, void_reason = ?, updated_at = now(),
              updated_by_user_id = ?, row_version = row_version + 1
        where c.id = ?
        returning ${CHARGE_COLUMNS}, to_jsonb(c.*) as snapshot`,
      [BILL.CHG_VOIDED, reason, actorUserId, charge.id],
    );
    await this.historyRepo.append(tx, 'charge_captures', charge.id, {
      operationConceptId: AUD.OPERATION_UPDATE,
      dataSnapshot: rows[0].snapshot,
      changedByUserId: actorUserId ?? undefined,
      tenantId: charge.tenant_id,
    });
    return rows[0];
  }

  /** Carga útil del evento de anulación (sin el texto del motivo). */
  voidedPayload(
    charge: ChargeRow,
    origin: 'MANUAL' | 'OCCUPANCY_CORRECTION',
  ): Record<string, unknown> {
    return {
      chargeCaptureId: charge.id,
      encounterId: charge.encounter_id,
      sourceKind:
        charge.source_kind_concept_id === BILL.CHG_SRC_OR_TIME
          ? 'OR_TIME'
          : 'BED_DAY',
      serviceDate: charge.service_date,
      previousStatus: chargeStatus(charge.status_concept_id),
      invoiceLineId: charge.invoice_line_id,
      origin,
    };
  }

  /**
   * Carga y valida los cargos que una factura va a incorporar.
   *
   * - Todos existen en el tenant del actor (uno ajeno responde igual que uno
   *   inexistente: 404 sin revelar cuál).
   * - El actor puede facturar cada uno, contra **su** cama.
   * - Son del paciente, de la práctica y del encuentro de la factura.
   * - Siguen pendientes (409 `CHARGE_ALREADY_INVOICED`) y tienen precio (422).
   *
   * Se bloquean las filas (`FOR UPDATE`): dos facturas que pidan el mismo cargo a
   * la vez se serializan, y la segunda ve el estado `INVOICED`.
   *
   * @param tx - Transacción de la factura.
   * @param ids - Cargos pedidos.
   * @param invoice - Práctica, paciente y encuentro de la factura.
   * @param actor - Quien factura.
   */
  async loadForInvoice(
    tx: EntityManager,
    ids: readonly string[],
    invoice: {
      readonly practiceId: string;
      readonly patientProfileId: string;
      readonly encounterId: string;
    },
    actor: AuthenticatedUser,
  ): Promise<ChargeRow[]> {
    const tenantId = requireTenantId();
    const unique = [...new Set(ids)];
    const rows = await tx.execute<ChargeRow[]>(
      `select ${CHARGE_COLUMNS} from billing.charge_captures c
        where c.id in (${unique.map(() => '?').join(', ')}) and c.tenant_id = ?
        order by c.service_date, c.id for update`,
      [...unique, tenantId],
    );
    if (rows.length !== unique.length) throw this.chargeNotFound();
    for (const row of rows) {
      if (row.care_space_id)
        await this.access.forSpace(
          tx,
          actor,
          'infra.charge.invoice',
          row.care_space_id,
        );
      else
        await this.access.forPractice(
          tx,
          actor,
          'infra.charge.invoice',
          row.practice_id,
          'any',
        );
    }
    for (const row of rows) {
      if (
        row.practice_id !== invoice.practiceId ||
        row.patient_profile_id !== invoice.patientProfileId ||
        row.encounter_id !== invoice.encounterId
      )
        throw new PreconditionFailedException(
          'El cargo no es del paciente, la práctica o el encuentro de la factura',
          { chargeCaptureId: row.id },
          BillingErrorReason.CHARGE_NOT_OF_INVOICE,
        );
      if (row.status_concept_id !== BILL.CHG_PENDING)
        throw new ConflictException(
          'El cargo ya fue facturado o está anulado',
          {
            chargeCaptureId: row.id,
            status: chargeStatus(row.status_concept_id),
          },
          BillingErrorReason.CHARGE_ALREADY_INVOICED,
        );
      if (row.unit_price === null)
        throw new PreconditionFailedException(
          'El cargo no tiene tarifa vigente: configurá la tarifa antes de facturar',
          { chargeCaptureId: row.id },
          BillingErrorReason.CHARGE_WITHOUT_PRICE,
        );
    }
    return rows;
  }

  /**
   * Pasa un cargo a `INVOICED` con su línea de factura, en la transacción de la factura.
   *
   * @param tx - Transacción de la factura.
   * @param charge - El cargo cargado por {@link loadForInvoice}.
   * @param invoice - Factura y línea.
   * @param actor - Quien factura.
   * @param correlationId - Id de correlación.
   */
  async markInvoiced(
    tx: EntityManager,
    charge: ChargeRow,
    invoice: { readonly invoiceId: string; readonly invoiceLineId: string },
    actor: AuthenticatedUser,
    correlationId?: string,
  ): Promise<void> {
    const rows = await tx.execute<{ snapshot: unknown }[]>(
      `update billing.charge_captures c
          set status_concept_id = ?, invoice_line_id = ?, updated_at = now(),
              updated_by_user_id = ?, row_version = row_version + 1
        where c.id = ? and c.status_concept_id = ?
        returning to_jsonb(c.*) as snapshot`,
      [
        BILL.CHG_INVOICED,
        invoice.invoiceLineId,
        actor.id,
        charge.id,
        BILL.CHG_PENDING,
      ],
    );
    if (rows.length === 0)
      throw new ConflictException(
        'El cargo ya fue facturado o está anulado',
        { chargeCaptureId: charge.id },
        BillingErrorReason.CHARGE_ALREADY_INVOICED,
      );
    await this.historyRepo.append(tx, 'charge_captures', charge.id, {
      operationConceptId: AUD.OPERATION_UPDATE,
      dataSnapshot: rows[0].snapshot,
      changedByUserId: actor.id,
      tenantId: charge.tenant_id,
    });
    await this.events.publish(tx, {
      type: CHARGE_EVENTS.chargeInvoiced,
      aggregateType: 'charge_capture',
      aggregateId: charge.id,
      tenantId: charge.tenant_id,
      actorUserId: actor.id,
      correlationId,
      payload: {
        chargeCaptureId: charge.id,
        encounterId: charge.encounter_id,
        serviceDate: charge.service_date,
        invoiceId: invoice.invoiceId,
        invoiceLineId: invoice.invoiceLineId,
      },
    });
  }

  /** ¿Ve el actor algo de esa práctica? */
  private async canOnPractice(
    tx: EntityManager,
    actor: AuthenticatedUser,
    practiceId: string,
  ): Promise<boolean> {
    try {
      await this.access.forPractice(
        tx,
        actor,
        'infra.charge.view',
        practiceId,
        'any',
      );
      return true;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) return false;
      if ((error as { getStatus?: () => number }).getStatus?.() === 403)
        return false;
      throw error;
    }
  }

  /**
   * Un encuentro sin cargos se autoriza por las prácticas donde estuvo: quien no
   * alcanza ninguna recibe el mismo 404 de un encuentro inexistente.
   */
  private async assertSeesEncounter(
    tx: EntityManager,
    actor: AuthenticatedUser,
    encounterId: string,
    tenantId: string,
  ): Promise<void> {
    const practices = await tx.execute<{ practice_id: string }[]>(
      `select distinct s.practice_id
         from clinical.encounter_locations el
         join practice.practice_sites s on s.id = el.practice_site_id
        where el.encounter_id = ? and s.tenant_id = ?`,
      [encounterId, tenantId],
    );
    for (const { practice_id } of practices) {
      if (await this.canOnPractice(tx, actor, practice_id)) return;
    }
    throw this.encounterNotFound();
  }

  private encounterNotFound(): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'Encuentro no encontrado',
      undefined,
      BillingErrorReason.INVOICE_ENCOUNTER_NOT_FOUND,
    );
  }

  private chargeNotFound(): ResourceNotFoundException {
    return new ResourceNotFoundException(
      CHARGE_NOT_FOUND.message,
      undefined,
      CHARGE_NOT_FOUND.reason,
    );
  }
}
