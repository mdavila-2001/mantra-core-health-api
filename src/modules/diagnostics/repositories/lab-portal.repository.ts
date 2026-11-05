import { Injectable } from '@nestjs/common';
import type { FilterQuery } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DiagnosticReports, ServiceRequests } from '../../clinical/entities';
import { CLIN } from '../../clinical/clinical.concepts';
import { FileVersions, Files } from '../../common/entities';
import {
  DiagnosticStudyOfferings,
  DiagnosticUnits,
} from '../../diagnostic_units/entities';
import { Users } from '../../iam/entities/users.entity';
import { CATEGORIES_WITH_SPECIMEN, DIAG } from '../diagnostics.concepts';
import {
  AccessionSpecimens,
  LaboratoryAccessions,
  LaboratoryWorkOrders,
  SpecimenRejectionEvents,
} from '../entities';

/** Order categories the portal serves: laboratory, pathology and imaging. */
export const LAB_PORTAL_CATEGORIES: readonly string[] = [
  ...CATEGORIES_WITH_SPECIMEN,
  CLIN.SERVICE_REQUEST_CATEGORY_IMAGING,
  DIAG.SERVICE_REQUEST_CATEGORY_IMAGING,
];

/** Orders per page of the portal list unless the caller asks for another size. */
export const LAB_PORTAL_PAGE_DEFAULT = 100;
/** Hard cap of one page; also the batch size of the full scans (summary, files). */
export const LAB_PORTAL_PAGE_MAX = 500;

/** Position of an order in the newest-first listing: the keyset of a page. */
export interface LabOrderKey {
  readonly createdAt: Date;
  readonly id: string;
}

/** Metadata of a stored result file: name from `files`, type/size from its version. */
export interface LabFileMeta {
  readonly fileName: string;
  readonly contentType: string;
  readonly sizeBytes: number;
}

/**
 * Stateless reads of the laboratory portal. Every performer-side row
 * (accession, work order, report) is scoped by `custodian_tenant_id` = the
 * performer tenant: what another center did with the same order never counts.
 */
@Injectable()
export class LabPortalRepository {
  /** Orders routed to the tenant (`performer_tenant_id`), no drafts. */
  private ordersWhere(tenantId: string): FilterQuery<ServiceRequests> {
    return {
      performerTenantId: tenantId,
      categoryConceptId: { $in: [...LAB_PORTAL_CATEGORIES] },
      statusConceptId: { $ne: CLIN.SERVICE_REQUEST_DRAFT },
    };
  }

  /** How many orders the tenant has, whatever the page being read. */
  countOrders(em: EntityManager, tenantId: string): Promise<number> {
    return em.count(ServiceRequests, this.ordersWhere(tenantId));
  }

  /**
   * One keyset page of the tenant's orders, newest first (`created_at`, `id`
   * descending), starting right after `after` when given.
   */
  findOrders(
    em: EntityManager,
    tenantId: string,
    page: { limit: number; after?: LabOrderKey },
  ): Promise<ServiceRequests[]> {
    const { after } = page;
    const older: FilterQuery<ServiceRequests> = after
      ? {
          $or: [
            { createdAt: { $lt: after.createdAt } },
            { createdAt: after.createdAt, id: { $lt: after.id } },
          ],
        }
      : {};
    return em.find(
      ServiceRequests,
      { $and: [this.ordersWhere(tenantId), older] },
      { orderBy: { createdAt: 'DESC', id: 'DESC' }, limit: page.limit },
    );
  }

  /** One order of the tenant, or `null` when it is someone else's (or absent). */
  findOrder(
    em: EntityManager,
    tenantId: string,
    orderId: string,
  ): Promise<ServiceRequests | null> {
    return em.findOne(ServiceRequests, {
      id: orderId,
      performerTenantId: tenantId,
      categoryConceptId: { $in: [...LAB_PORTAL_CATEGORIES] },
      statusConceptId: { $ne: CLIN.SERVICE_REQUEST_DRAFT },
    });
  }

  findAccessions(
    em: EntityManager,
    tenantId: string,
    orderIds: readonly string[],
  ): Promise<LaboratoryAccessions[]> {
    if (orderIds.length === 0) return Promise.resolve([]);
    return em.find(
      LaboratoryAccessions,
      { serviceRequestId: { $in: [...orderIds] }, custodianTenantId: tenantId },
      { orderBy: { createdAt: 'DESC' } },
    );
  }

  findWorkOrders(
    em: EntityManager,
    tenantId: string,
    accessionIds: readonly string[],
  ): Promise<LaboratoryWorkOrders[]> {
    if (accessionIds.length === 0) return Promise.resolve([]);
    return em.find(LaboratoryWorkOrders, {
      laboratoryAccessionId: { $in: [...accessionIds] },
      custodianTenantId: tenantId,
    });
  }

  findAccessionItems(
    em: EntityManager,
    accessionIds: readonly string[],
  ): Promise<AccessionSpecimens[]> {
    if (accessionIds.length === 0) return Promise.resolve([]);
    return em.find(AccessionSpecimens, {
      laboratoryAccessionId: { $in: [...accessionIds] },
    });
  }

  /** Rejection events of the given specimens, newest first. */
  findRejections(
    em: EntityManager,
    specimenIds: readonly string[],
  ): Promise<SpecimenRejectionEvents[]> {
    if (specimenIds.length === 0) return Promise.resolve([]);
    return em.find(
      SpecimenRejectionEvents,
      { specimenId: { $in: [...specimenIds] } },
      { orderBy: { rejectedAt: 'DESC' } },
    );
  }

  /** Reports the performer tenant keeps for the given orders. */
  findReports(
    em: EntityManager,
    tenantId: string,
    orderIds: readonly string[],
  ): Promise<DiagnosticReports[]> {
    if (orderIds.length === 0) return Promise.resolve([]);
    return em.find(DiagnosticReports, {
      serviceRequestId: { $in: [...orderIds] },
      custodianTenantId: tenantId,
    });
  }

  /** Reports by id, only when the tenant is their custodian. */
  findReportsByIds(
    em: EntityManager,
    tenantId: string,
    reportIds: readonly string[],
  ): Promise<DiagnosticReports[]> {
    return em.find(DiagnosticReports, {
      id: { $in: [...reportIds] },
      custodianTenantId: tenantId,
    });
  }

  /** Name, MIME type and size of each file, through its current version. */
  async findFileMeta(
    em: EntityManager,
    fileIds: readonly string[],
  ): Promise<Map<string, LabFileMeta>> {
    const meta = new Map<string, LabFileMeta>();
    if (fileIds.length === 0) return meta;
    const files = await em.find(Files, { id: { $in: [...new Set(fileIds)] } });
    const versionIds = files
      .map((file) => file.currentVersionId)
      .filter((id): id is string => typeof id === 'string');
    const versions = versionIds.length
      ? await em.find(FileVersions, { id: { $in: versionIds } })
      : [];
    const byId = new Map(versions.map((version) => [version.id, version]));
    for (const file of files) {
      const version = file.currentVersionId
        ? byId.get(file.currentVersionId)
        : undefined;
      meta.set(file.id, {
        fileName: file.originalName ?? 'archivo',
        contentType: version?.mimeType ?? '',
        sizeBytes: Number(version?.sizeBytes ?? 0),
      });
    }
    return meta;
  }

  /** `iam.users.display_name` of each account. */
  async findUserNames(
    em: EntityManager,
    userIds: readonly string[],
  ): Promise<Map<string, string>> {
    if (userIds.length === 0) return new Map();
    const users = await em.find(Users, { id: { $in: [...new Set(userIds)] } });
    return new Map(users.map((user) => [user.id, user.displayName]));
  }

  /** Study offerings of the tenant's diagnostic unit (read-only). */
  async findOfferings(
    em: EntityManager,
    tenantId: string,
  ): Promise<DiagnosticStudyOfferings[]> {
    // The tenant's first unit, as the services catalog reads it.
    const unit = await em.findOne(
      DiagnosticUnits,
      { tenantId },
      { orderBy: { createdAt: 'ASC' } },
    );
    if (!unit) return [];
    return em.find(
      DiagnosticStudyOfferings,
      { diagnosticUnitId: unit.id },
      { orderBy: { updatedAt: 'DESC' } },
    );
  }
}
