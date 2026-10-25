import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ReceivedServices } from '../entities';
import { createdBy, touch } from '../../../common';
import { InvoiceLines } from '../../billing/entities/invoice_lines.entity';
import { Invoices } from '../../billing/entities/invoices.entity';
import { ProcedureCases } from '../../procedures_perioperative/entities/procedure_cases.entity';
import { ProcedureChargeItems } from '../../procedures_perioperative/entities/procedure_charge_items.entity';

/** Lo que se guarda de un servicio recibido; el origen decide cuál de los tres ids viene. */
export interface UpsertReceivedServiceData {
  custodianTenantId: string;
  patientProfileId: string;
  encounterId?: string;
  serviceTypeConceptId: string;
  serviceConceptId: string;
  statusConceptId: string;
  sourceProcedureId?: string;
  sourceImmunizationId?: string;
  procedureCaseId?: string;
  performerProfileId?: string;
  practiceSiteId?: string;
  performedAt: Date;
  outcomeConceptId?: string;
  resultText?: string;
  actorUserId?: string;
}

/** Un cargo de un servicio, con la moneda que el propio cargo declara. */
export interface ChargeLine {
  procedureCaseId: string;
  procedureId?: string;
  quantity?: string;
  unitPrice?: string;
  currencyCode?: string;
}

/** Una línea de factura con la moneda de su factura. */
export interface InvoiceLineAmount {
  invoiceLineId: string;
  lineTotal?: string;
  currencyConceptId?: string;
}

/** Acceso a datos de `clinical.received_services` (stateless). */
@Injectable()
export class ReceivedServicesRepository {
  findBySourceProcedure(
    em: EntityManager,
    procedureId: string,
  ): Promise<ReceivedServices | null> {
    return em.findOne(ReceivedServices, { sourceProcedureId: procedureId });
  }

  findBySourceImmunization(
    em: EntityManager,
    immunizationId: string,
  ): Promise<ReceivedServices | null> {
    return em.findOne(ReceivedServices, {
      sourceImmunizationId: immunizationId,
    });
  }

  /** El caso M53 que tiene a este procedimiento como principal, si lo hay. */
  findCaseByPrimaryProcedure(
    em: EntityManager,
    procedureId: string,
  ): Promise<ProcedureCases | null> {
    return em.findOne(ProcedureCases, { primaryProcedureId: procedureId });
  }

  findByProcedureCase(
    em: EntityManager,
    procedureCaseId: string,
  ): Promise<ReceivedServices | null> {
    return em.findOne(ReceivedServices, { procedureCaseId });
  }

  /**
   * Una fila por origen: si ya existe se actualiza con lo que llega, si no se crea.
   * Es lo que vuelve idempotente la proyección: volver a registrar el mismo
   * procedimiento, vacuna o caso no duplica el servicio.
   */
  async upsert(
    em: EntityManager,
    data: UpsertReceivedServiceData,
  ): Promise<ReceivedServices> {
    // Un caso M53 y su procedimiento principal son UN servicio: la fila puede haber
    // nacido por cualquiera de los dos orígenes, así que se busca por los tres.
    const existing =
      (data.sourceProcedureId
        ? await this.findBySourceProcedure(em, data.sourceProcedureId)
        : null) ??
      (data.sourceImmunizationId
        ? await this.findBySourceImmunization(em, data.sourceImmunizationId)
        : null) ??
      (data.procedureCaseId
        ? await this.findByProcedureCase(em, data.procedureCaseId)
        : null);

    if (existing) {
      existing.statusConceptId = data.statusConceptId;
      existing.serviceConceptId = data.serviceConceptId;
      existing.sourceProcedureId =
        existing.sourceProcedureId ?? data.sourceProcedureId;
      existing.encounterId = data.encounterId ?? existing.encounterId;
      existing.procedureCaseId =
        data.procedureCaseId ?? existing.procedureCaseId;
      existing.performerProfileId =
        data.performerProfileId ?? existing.performerProfileId;
      existing.practiceSiteId = data.practiceSiteId ?? existing.practiceSiteId;
      existing.performedAt = data.performedAt;
      existing.outcomeConceptId =
        data.outcomeConceptId ?? existing.outcomeConceptId;
      existing.resultText = data.resultText ?? existing.resultText;
      return touch(existing, data.actorUserId);
    }

    return em.create(
      ReceivedServices,
      {
        custodianTenantId: data.custodianTenantId,
        patientProfileId: data.patientProfileId,
        encounterId: data.encounterId,
        serviceTypeConceptId: data.serviceTypeConceptId,
        serviceConceptId: data.serviceConceptId,
        statusConceptId: data.statusConceptId,
        sourceProcedureId: data.sourceProcedureId,
        sourceImmunizationId: data.sourceImmunizationId,
        procedureCaseId: data.procedureCaseId,
        performerProfileId: data.performerProfileId,
        practiceSiteId: data.practiceSiteId,
        performedAt: data.performedAt,
        outcomeConceptId: data.outcomeConceptId,
        resultText: data.resultText,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Los servicios de un paciente, el más reciente primero. Pide uno de más para
   * que el servicio pueda decir si el tope cortó la lista. El desempate por `id`
   * mantiene el orden estable entre dos servicios con la misma fecha.
   */
  findByPatient(
    em: EntityManager,
    patientProfileId: string,
    limit: number,
  ): Promise<ReceivedServices[]> {
    return em.find(
      ReceivedServices,
      { patientProfileId },
      { orderBy: { performedAt: 'DESC', id: 'ASC' }, limit },
    );
  }

  /** Cargos de los casos o procedimientos indicados (pertenecen al paciente que ya se filtró). */
  async findChargeLines(
    em: EntityManager,
    procedureCaseIds: readonly string[],
    procedureIds: readonly string[],
  ): Promise<ChargeLine[]> {
    const or: object[] = [];
    if (procedureCaseIds.length)
      or.push({ procedureCaseId: { $in: [...procedureCaseIds] } });
    if (procedureIds.length)
      or.push({ procedureId: { $in: [...procedureIds] } });
    if (!or.length) return [];
    const rows = await em.find(ProcedureChargeItems, { $or: or });
    return rows.map((row) => ({
      procedureCaseId: row.procedureCaseId,
      procedureId: row.procedureId,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      currencyCode: row.currencyCode,
    }));
  }

  /** Total de cada línea de factura enlazada y la moneda de su factura. */
  async findInvoiceLineAmounts(
    em: EntityManager,
    invoiceLineIds: readonly string[],
  ): Promise<InvoiceLineAmount[]> {
    if (!invoiceLineIds.length) return [];
    const lines = await em.find(InvoiceLines, {
      id: { $in: [...invoiceLineIds] },
    });
    const invoices = lines.length
      ? await em.find(Invoices, {
          id: { $in: [...new Set(lines.map((line) => line.invoiceId))] },
        })
      : [];
    const currencyByInvoice = new Map(
      invoices.map((invoice) => [invoice.id, invoice.currencyConceptId]),
    );
    return lines.map((line) => ({
      invoiceLineId: line.id,
      lineTotal: line.lineTotal,
      currencyConceptId: currencyByInvoice.get(line.invoiceId),
    }));
  }
}
