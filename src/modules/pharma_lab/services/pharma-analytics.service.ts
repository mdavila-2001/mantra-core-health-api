import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { JournalTransactions } from '../../accounting/entities';
import { AuditTrailService } from '../../audit/services/audit-trail.service';
import { CreateCostAllocationDto, CreatedResourceDto } from '../dto';
import type { PharmaCostAllocations } from '../entities';
import { AnalyticsRepository, CatalogRepository } from '../repositories';
import { PharmaLabAccessService } from './pharma-lab-access.service';

/** Fila de un reporte analítico: una dimensión y su importe acumulado. */
export interface AllocationBucket {
  /** Clave de la dimensión (identificador de producto, código de proyecto…). */
  key: string;
  /** Rótulo legible. */
  label: string;
  /** Importe acumulado, con dos decimales. */
  amount: string;
  /** Cuántas imputaciones lo componen. */
  entries: number;
}

/** Reporte analítico del laboratorio para un periodo. */
export interface AllocationReport {
  /** Inicio del periodo. */
  from: string;
  /** Fin del periodo. */
  to: string;
  /** Total imputado en el periodo. */
  total: string;
  /** Desglose por producto (rentabilidad por producto, spec 5661). */
  byProduct: AllocationBucket[];
  /** Desglose por proyecto (costos por proyecto, spec 5662). */
  byProject: AllocationBucket[];
  /** Desglose por visitador. */
  byVisitor: AllocationBucket[];
  /** Desglose por campaña. */
  byCampaign: AllocationBucket[];
  /** Desglose por naturaleza del costo. */
  byCostType: AllocationBucket[];
}

/**
 * UC-17-34: contabilidad analítica del laboratorio (spec 5631-5665).
 *
 * **No es un módulo contable.** Activos, pasivos, patrimonio, ingresos, gastos,
 * facturas y comprobantes viven en `accounting`, que ya los lleva para todas las
 * organizaciones del sistema. Lo que la spec pide *además* es poder imputar cada
 * operación a producto, proyecto, sede, área, visitador y campaña, y poder leer
 * rentabilidad por producto y costos por proyecto: eso es lo que hay acá, sobre
 * asientos que `accounting` ya validó.
 */
@Injectable()
export class PharmaAnalyticsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param repo - Repositorio de imputaciones.
   * @param catalog - Repositorio del catálogo, para rotular los productos.
   * @param access - Comprobaciones de vinculación y estado.
   * @param audit - Cadena WORM de auditoría.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: AnalyticsRepository,
    private readonly catalog: CatalogRepository,
    private readonly access: PharmaLabAccessService,
    private readonly audit: AuditTrailService,
  ) {}

  /**
   * UC-17-34: imputa un asiento contable a las dimensiones del laboratorio.
   *
   * @param pharmaLabId - Laboratorio.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Identificador de la imputación.
   * @throws ResourceNotFoundException si el asiento o el producto no existen.
   */
  async createAllocation(
    pharmaLabId: string,
    dto: CreateCostAllocationDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.em.transactional(async (tx) => {
      const lab = await this.access.requireActiveLab(tx, pharmaLabId);
      const journal = await tx.findOne(JournalTransactions, {
        id: dto.journalTransactionId,
      });
      if (!journal) {
        throw new ResourceNotFoundException('Asiento contable no encontrado', {
          journalTransactionId: dto.journalTransactionId,
        });
      }
      if (dto.pharmaProductId) {
        const product = await this.catalog.findProduct(tx, dto.pharmaProductId);
        if (!product || product.pharmaLabId !== pharmaLabId) {
          throw new ResourceNotFoundException(
            'Producto no encontrado en el catálogo del laboratorio',
            { pharmaProductId: dto.pharmaProductId },
          );
        }
      }

      const allocation = this.repo.createAllocation(tx, {
        pharmaLabId,
        journalTransactionId: dto.journalTransactionId,
        costTypeConceptId: dto.costTypeConceptId,
        amount: dto.amount,
        currencyConceptId: dto.currencyConceptId,
        pharmaProductId: dto.pharmaProductId,
        projectCode: dto.projectCode,
        branchId: dto.branchId,
        area: dto.area,
        medicalVisitorId: dto.medicalVisitorId,
        campaignCode: dto.campaignCode,
        allocatedOn: dto.allocatedOn,
        actorUserId: actor.id,
      });
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'PHARMA_COST_ALLOCATED',
        entity: 'pharma_cost_allocations',
        entityId: allocation.id,
        tenantId: lab.tenantId,
      });
      return { id: allocation.id };
    });
  }

  /**
   * Reporte analítico del periodo (spec 5656-5664).
   *
   * @param pharmaLabId - Laboratorio.
   * @param from - Inicio del periodo, `YYYY-MM-DD`.
   * @param to - Fin del periodo, `YYYY-MM-DD`.
   * @returns Totales y desgloses por cada dimensión.
   */
  async getReport(
    pharmaLabId: string,
    from: string,
    to: string,
  ): Promise<AllocationReport> {
    await this.access.requireLab(this.em, pharmaLabId);
    const allocations = await this.repo.listAllocations(
      this.em,
      pharmaLabId,
      from,
      to,
    );
    const products = await this.catalog.listProducts(this.em, pharmaLabId);
    const productNames = new Map(
      products.map((product) => [product.id, product.tradeName]),
    );

    const total = allocations.reduce(
      (sum, allocation) => sum + Number(allocation.amount),
      0,
    );
    return {
      from,
      to,
      total: total.toFixed(2),
      byProduct: bucket(
        allocations,
        (row) => row.pharmaProductId,
        (key) => productNames.get(key) ?? key,
      ),
      byProject: bucket(allocations, (row) => row.projectCode),
      byVisitor: bucket(allocations, (row) => row.medicalVisitorId),
      byCampaign: bucket(allocations, (row) => row.campaignCode),
      byCostType: bucket(allocations, (row) => row.costTypeConceptId),
    };
  }
}

/** Agrupa importes por una dimensión, descartando las filas sin ese eje. */
function bucket(
  allocations: readonly PharmaCostAllocations[],
  pick: (row: PharmaCostAllocations) => string | undefined,
  label: (key: string) => string = (key) => key,
): AllocationBucket[] {
  const totals = new Map<string, { amount: number; entries: number }>();
  for (const allocation of allocations) {
    const key = pick(allocation);
    if (!key) continue;
    const current = totals.get(key) ?? { amount: 0, entries: 0 };
    totals.set(key, {
      amount: current.amount + Number(allocation.amount),
      entries: current.entries + 1,
    });
  }
  return [...totals.entries()]
    .map(([key, value]) => ({
      key,
      label: label(key),
      amount: value.amount.toFixed(2),
      entries: value.entries,
    }))
    .sort((a, b) => Number(b.amount) - Number(a.amount));
}
