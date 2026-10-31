import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../common';
import { ServiceRequests } from '../../clinical/entities';
import { CLIN } from '../../clinical/clinical.concepts';
import { CATEGORIES_WITH_SPECIMEN } from '../diagnostics.concepts';
import { DIAG } from '../diagnostics.concepts';
import {
  ServiceRequestWorklistRepository,
  type InboxPatientLabel,
  type WorklistAfterKey,
  type WorklistRow,
} from '../repositories';
import type {
  WorklistItemDto,
  WorklistPageDto,
  WorklistQueryDto,
} from '../dto';
import type { WorklistScope } from '../dto/worklist.dto';
import {
  DiagnosticsReceptionService,
  matchesPatient,
  normalizeForSearch,
} from './diagnostics-reception.service';

const DEFAULT_LIMIT = 25;
const MAX_SCANS = 5;

/** Categorías de orden por ámbito. Imagen: la de `clinical` y la de `diagnostics`. */
const CATEGORIES_BY_SCOPE: Readonly<Record<WorklistScope, readonly string[]>> =
  {
    LAB: CATEGORIES_WITH_SPECIMEN,
    IMAGING: [
      CLIN.SERVICE_REQUEST_CATEGORY_IMAGING,
      DIAG.SERVICE_REQUEST_CATEGORY_IMAGING,
    ],
  };

/**
 * Bandeja del ejecutor (H2.S3.M1 / C6): las órdenes de laboratorio o imagen
 * dirigidas al tenant activo, con su estado derivado y su detalle pedido, y el
 * detalle de una orden. Reemplaza al simulador `/diagnostics/lab/orders`.
 *
 * Una orden ajena (otro ejecutor, o sin ejecutor) no se distingue de una
 * inexistente: 404 en el detalle, ausente en la lista.
 */
@Injectable()
export class DiagnosticsWorklistService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: ServiceRequestWorklistRepository,
    private readonly reception: DiagnosticsReceptionService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DiagnosticsWorklistService.name);
  }

  async list(
    tenantId: string,
    query: WorklistQueryDto,
  ): Promise<WorklistPageDto> {
    const limit = query.limit ?? DEFAULT_LIMIT;
    const needle = query.patientQuery
      ? normalizeForSearch(query.patientQuery)
      : null;
    this.logger.info(
      {
        operation: 'diagnostics.worklist.list',
        scope: query.scope,
        limit,
        hasCursor: Boolean(query.cursor),
        hasPatientQuery: needle !== null,
      },
      'Leyendo bandeja del ejecutor',
    );

    const em = this.em.fork();
    const chunkSize = Math.min(Math.max(limit * 2, 50), 200);
    const labels = new Map<string, InboxPatientLabel | null>();
    const categories = CATEGORIES_BY_SCOPE[query.scope];

    const collected: { row: WorklistRow; order: ServiceRequests }[] = [];
    let after = query.cursor ? decodeAfterKey(query.cursor) : undefined;
    let exhausted = false;

    for (let scan = 0; scan < MAX_SCANS && collected.length <= limit; scan++) {
      const block = await this.repo.findBlock(
        em,
        tenantId,
        categories,
        query.states,
        after,
        chunkSize,
      );
      if (block.length === 0) {
        exhausted = true;
        break;
      }
      const orders = await em.find(ServiceRequests, {
        id: { $in: block.map((r) => r.id) },
      });
      const byId = new Map(orders.map((o) => [o.id, o]));
      let pending = block
        .map((row) => ({ row, order: byId.get(row.id) }))
        .filter((x): x is { row: WorklistRow; order: ServiceRequests } =>
          Boolean(x.order),
        );
      if (needle !== null && pending.length > 0) {
        await this.reception.loadLabels(
          em,
          labels,
          pending.map((x) => x.order),
        );
        pending = pending.filter((x) =>
          matchesPatient(labels.get(x.order.patientProfileId) ?? null, needle),
        );
      }
      collected.push(...pending);
      const last = block[block.length - 1];
      after = { createdAt: last.createdAt, id: last.id };
      if (block.length < chunkSize) {
        exhausted = true;
        break;
      }
    }

    const page = collected.slice(0, limit);
    let nextCursor: string | null = null;
    if (collected.length > limit) {
      const last = page[page.length - 1].row;
      nextCursor = encodeAfterKey({ createdAt: last.createdAt, id: last.id });
    } else if (!exhausted && after) {
      nextCursor = encodeAfterKey(after);
    }

    const projected = await this.reception.toItems(
      em,
      tenantId,
      page.map((x) => x.order),
      labels,
    );
    const items: WorklistItemDto[] = projected.map((item, index) => ({
      ...item,
      state: page[index].row.state,
      scope: query.scope,
    }));
    return { items, count: items.length, limit, nextCursor };
  }

  async getById(
    tenantId: string,
    serviceRequestId: string,
  ): Promise<WorklistItemDto> {
    const em = this.em.fork();
    const order = await em.findOne(ServiceRequests, { id: serviceRequestId });
    const state =
      order && order.performerTenantId === tenantId
        ? await this.repo.findState(em, tenantId, serviceRequestId)
        : null;
    if (!order || state === null) {
      throw new ResourceNotFoundException('Orden no encontrada', {
        serviceRequestId,
      });
    }
    const labels = new Map<string, InboxPatientLabel | null>();
    const [item] = await this.reception.toItems(em, tenantId, [order], labels);
    const scope: WorklistScope = CATEGORIES_BY_SCOPE.IMAGING.includes(
      order.categoryConceptId ?? '',
    )
      ? 'IMAGING'
      : 'LAB';
    return { ...item, state, scope };
  }
}

function encodeAfterKey(key: WorklistAfterKey): string {
  return encodeKeysetCursor({
    createdAt: key.createdAt.toISOString(),
    id: key.id,
  });
}

function decodeAfterKey(cursor: string): WorklistAfterKey {
  const key = decodeKeysetCursor(cursor);
  const createdAt =
    typeof key.createdAt === 'string' ? new Date(key.createdAt) : null;
  if (
    !createdAt ||
    Number.isNaN(createdAt.getTime()) ||
    typeof key.id !== 'string'
  ) {
    throw new BadRequestException('El cursor de paginación no es válido');
  }
  return { createdAt, id: key.id };
}
