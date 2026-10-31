import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ResourceNotFoundException } from '../../../common';
import { encodeKeysetCursor } from '../../../common/pagination/keyset-cursor';
import {
  DEFAULT_PAGE_SIZE,
  DSAR_JURISDICTION_CONCEPT,
  DSAR_STATUS_CONCEPT,
  DSAR_TRANSITIONS,
  DSAR_TYPE_CONCEPT,
  MAX_PAGE_SIZE,
  codeOfConcept,
  type DsarJurisdiction,
  type DsarStatus,
  type DsarType,
} from '../governance_admin.constants';
import {
  PrivacyRequestsRepository,
  type DsarRow,
} from '../repositories/privacy-requests.repository';
import { clampLimit } from '../sql-filter';
import { readKeyset } from '../keyset';
import type { PrivacyRequestsQueryDto } from '../dto/governance-admin.query.dto';
import type { Page } from './data-quality.service';

export interface PrivacyRequest {
  id: string;
  /** Identificador del titular. Nunca su nombre, documento ni contacto. */
  subjectUserId: string;
  type: DsarType | null;
  status: DsarStatus | null;
  jurisdiction: DsarJurisdiction | null;
  requestedAt: string;
  completedAt: string | null;
  resultFileId: string | null;
  updatedAt: string;
  rowVersion: number;
  /** Transiciones que la API admite hoy desde el estado actual. */
  allowedTransitions: DsarStatus[];
}

export interface PrivacyRequestsPage extends Page<PrivacyRequest> {
  /** Cantidad por estado sobre TODAS las solicitudes, no sólo las de esta página. */
  statusCounts: Record<DsarStatus, number> & { other: number };
}

const iso = (d: Date | string | null | undefined): string | null =>
  d ? new Date(d).toISOString() : null;

@Injectable()
export class PrivacyRequestsService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: PrivacyRequestsRepository,
  ) {}

  async list(q: PrivacyRequestsQueryDto): Promise<PrivacyRequestsPage> {
    const limit = clampLimit(q.limit, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const filters = { status: q.status, type: q.type, jurisdiction: q.jurisdiction };
    const after = readKeyset(q.cursor);
    const [rows, total, counts] = await Promise.all([
      this.repo.list(this.em, filters, limit + 1, after),
      this.repo.count(this.em, filters),
      this.repo.countsByStatus(this.em),
    ]);
    const page = rows.slice(0, limit);
    const last = page[page.length - 1];
    const statusCounts = { RECEIVED: 0, IN_PROGRESS: 0, COMPLETED: 0, REJECTED: 0, other: 0 };
    for (const c of counts) {
      const code = codeOfConcept(DSAR_STATUS_CONCEPT, c.status_concept_id);
      if (code) statusCounts[code] += Number(c.n);
      else statusCounts.other += Number(c.n);
    }
    return {
      items: page.map((r) => this.toRequest(r)),
      nextCursor:
        rows.length > limit && last
          ? encodeKeysetCursor({ c: last.requested_at_key, i: last.id })
          : null,
      limit,
      total,
      statusCounts,
    };
  }

  async get(id: string): Promise<PrivacyRequest> {
    const row = await this.repo.find(this.em, id);
    if (!row) throw new ResourceNotFoundException('Solicitud no encontrada', { id });
    return this.toRequest(row);
  }

  private toRequest(r: DsarRow): PrivacyRequest {
    const status = codeOfConcept(DSAR_STATUS_CONCEPT, r.status_concept_id);
    return {
      id: r.id,
      subjectUserId: r.user_id,
      type: codeOfConcept(DSAR_TYPE_CONCEPT, r.type_concept_id),
      status,
      jurisdiction: r.jurisdiction_concept_id
        ? codeOfConcept(DSAR_JURISDICTION_CONCEPT, r.jurisdiction_concept_id)
        : null,
      requestedAt: iso(r.requested_at) as string,
      completedAt: iso(r.completed_at),
      resultFileId: r.result_file_id,
      updatedAt: iso(r.updated_at) as string,
      rowVersion: Number(r.row_version),
      allowedTransitions: status ? [...DSAR_TRANSITIONS[status]] : [],
    };
  }
}

