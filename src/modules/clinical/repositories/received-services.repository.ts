import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Procedures, ReceivedServices } from '../entities';
import { createdBy, touch } from '../../../common';
import { InvoiceLines } from '../../billing/entities/invoice_lines.entity';
import { Invoices } from '../../billing/entities/invoices.entity';
import { PracticeSites } from '../../practice/entities/practice_sites.entity';
import { findPractitionerNames } from '../../profiles/infrastructure/read-models/practitioner-names';
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
  ): Promise<ReceivedServices | null> {
    // Un caso M53 y su procedimiento principal son UN servicio: la fila puede haber
    // nacido por cualquiera de los dos orígenes, así que se busca por los tres.
    const [byProcedure, byImmunization, byCase] = await Promise.all([
      data.sourceProcedureId
        ? this.findBySourceProcedure(em, data.sourceProcedureId)
        : null,
      data.sourceImmunizationId
        ? this.findBySourceImmunization(em, data.sourceImmunizationId)
        : null,
      data.procedureCaseId
        ? this.findByProcedureCase(em, data.procedureCaseId)
        : null,
    ]);

    // Un id de origen puede venir de un cliente (el procedimiento que cita un
    // informe operatorio) y apuntar a la fila de OTRO paciente. Esa fila no se toca
    // ni se reutiliza su origen: el servicio de un paciente nunca se pisa con el de
    // otro, y el índice único de origen impediría crear uno propio con ese id.
    const own = (row: ReceivedServices | null): ReceivedServices | null =>
      row &&
      row.patientProfileId === data.patientProfileId &&
      row.custodianTenantId === data.custodianTenantId
        ? row
        : null;
    const sourceProcedureId =
      byProcedure && !own(byProcedure) ? undefined : data.sourceProcedureId;
    const sourceImmunizationId =
      byImmunization && !own(byImmunization)
        ? undefined
        : data.sourceImmunizationId;
    const procedureCaseId =
      byCase && !own(byCase) ? undefined : data.procedureCaseId;
    const existing = own(byProcedure) ?? own(byImmunization) ?? own(byCase);

    if (existing) {
      existing.statusConceptId = data.statusConceptId;
      existing.serviceConceptId = data.serviceConceptId;
      existing.sourceProcedureId =
        existing.sourceProcedureId ?? sourceProcedureId;
      existing.encounterId = data.encounterId ?? existing.encounterId;
      existing.procedureCaseId = existing.procedureCaseId ?? procedureCaseId;
      existing.performerProfileId =
        data.performerProfileId ?? existing.performerProfileId;
      existing.practiceSiteId = data.practiceSiteId ?? existing.practiceSiteId;
      existing.performedAt = data.performedAt;
      existing.outcomeConceptId =
        data.outcomeConceptId ?? existing.outcomeConceptId;
      existing.resultText = data.resultText ?? existing.resultText;
      return touch(existing, data.actorUserId);
    }

    // Sin ningún origen propio no hay servicio que proyectar (el CHECK de la tabla
    // lo exige): todos los orígenes que llegaron eran de otro paciente.
    if (!sourceProcedureId && !sourceImmunizationId && !procedureCaseId)
      return null;

    return em.create(
      ReceivedServices,
      {
        custodianTenantId: data.custodianTenantId,
        patientProfileId: data.patientProfileId,
        encounterId: data.encounterId,
        serviceTypeConceptId: data.serviceTypeConceptId,
        serviceConceptId: data.serviceConceptId,
        statusConceptId: data.statusConceptId,
        sourceProcedureId,
        sourceImmunizationId,
        procedureCaseId,
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

  /** Si el procedimiento existe y es de este paciente y de este tenant. */
  async isProcedureOf(
    em: EntityManager,
    procedureId: string,
    patientProfileId: string,
    custodianTenantId: string,
  ): Promise<boolean> {
    return (
      (await em.count(Procedures, {
        id: procedureId,
        patientProfileId,
        custodianTenantId,
      })) > 0
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

  /**
   * Cargos de los casos o procedimientos indicados, SOLO los de casos de este
   * paciente: el cargo no guarda al paciente, lo guarda el caso, y un id de caso o
   * de procedimiento mal enlazado no debe traer el cobro de otra persona.
   */
  async findChargeLines(
    em: EntityManager,
    patientProfileId: string,
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
    if (!rows.length) return [];
    const ownCases = await em.find(
      ProcedureCases,
      {
        id: { $in: [...new Set(rows.map((row) => row.procedureCaseId))] },
        patientProfileId,
      },
      { fields: ['id'] },
    );
    const ownCaseIds = new Set(ownCases.map((row) => row.id));
    return rows
      .filter((row) => ownCaseIds.has(row.procedureCaseId))
      .map((row) => ({
        procedureCaseId: row.procedureCaseId,
        procedureId: row.procedureId,
        quantity: row.quantity,
        unitPrice: row.unitPrice,
        currencyCode: row.currencyCode,
      }));
  }

  /**
   * Nombre de cada profesional. La ausencia es un estado real: el perfil puede no
   * tener persona o la persona no tener nombre, y el mapa no inventa uno.
   */
  findPerformerNames(
    em: EntityManager,
    profileIds: readonly string[],
  ): Promise<Map<string, string>> {
    return findPractitionerNames(em, profileIds);
  }

  /** Nombre de cada sede por id. */
  async findSiteNames(
    em: EntityManager,
    siteIds: readonly string[],
  ): Promise<Map<string, string>> {
    if (!siteIds.length) return new Map();
    const sites = await em.find(PracticeSites, { id: { $in: [...siteIds] } });
    return new Map(sites.map((site) => [site.id, site.name]));
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
