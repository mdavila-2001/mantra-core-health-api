import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { decodeKeysetCursor, encodeKeysetCursor } from '../../../common';
import type { ServiceRequests } from '../../clinical/entities';
import { CLIN } from '../../clinical/clinical.concepts';
import { CATEGORIAS_CON_ESPECIMEN } from '../diagnostics.concepts';
import {
  LabReceptionRepository,
  SpecimensRepository,
  type InboxAfterKey,
  type InboxPatientLabel,
} from '../repositories';
import type {
  LabInboxItemDto,
  LabInboxPageDto,
  LabInboxQueryDto,
} from '../dto';
import { toSpecimenDetail } from './specimen-detail.projection';

/** Tope por defecto de la página. */
const DEFAULT_LIMIT = 25;

/**
 * Cuántos bloques se leen, como mucho, para llenar una página.
 *
 * La bandeja descarta órdenes ya acesionadas (y, con búsqueda, las de otros
 * pacientes) **después** de leerlas, así que un bloque puede no alcanzar. Se
 * sigue leyendo hasta llenar la página, pero con techo: una búsqueda sin
 * coincidencias no puede recorrer la historia entera del laboratorio en una
 * sola petición. Si el techo corta, la página sale corta **con** `nextCursor`,
 * y el cliente sigue desde ahí.
 */
const MAX_SCANS = 5;

/**
 * La bandeja de recepción de muestras: las órdenes de laboratorio dirigidas al
 * laboratorio del tenant activo que todavía no se acesionaron.
 *
 * ## Qué entra
 *
 * - `performer_tenant_id` = el laboratorio: la orden la emitió otra
 *   organización (su custodio) y se derivó a éste.
 * - Categoría con espécimen (laboratorio, anatomía patológica).
 * - Orden vigente (`SR_ACTIVE`): una suspendida, revocada o completada no se
 *   recibe.
 * - **Sin acesión** de este laboratorio para esa orden. Acesionar es lo que la
 *   saca de la recepción y la pone en la cola de trabajo.
 *
 * Las muestras que ya se recibieron y todavía no se acesionaron viajan con la
 * orden, con sus contenedores y su custodia: recibir y acesionar son dos pasos
 * del mismo mostrador, y la orden tiene que seguir a la vista entre uno y otro.
 */
@Injectable()
export class DiagnosticsReceptionService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param receptionRepo - Lecturas de la bandeja.
   * @param specimensRepo - Contenedores y custodia de los especímenes.
   * @param logger - Registro estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly receptionRepo: LabReceptionRepository,
    private readonly specimensRepo: SpecimensRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DiagnosticsReceptionService.name);
  }

  /**
   * Una página de la bandeja.
   *
   * @param tenantId - Laboratorio del contexto.
   * @param query - Cursor, tope y búsqueda por paciente.
   * @returns La página, de la orden más vieja a la más nueva.
   * @throws BadRequestException si el cursor no es uno emitido por acá.
   */
  async listInbox(
    tenantId: string,
    query: LabInboxQueryDto,
  ): Promise<LabInboxPageDto> {
    const limit = query.limit ?? DEFAULT_LIMIT;
    const needle = query.patientQuery
      ? normalizeForSearch(query.patientQuery)
      : null;
    // Nunca el texto buscado: es PHI y los logs no son lugar para eso.
    this.logger.info(
      {
        operation: 'diagnostics.reception.inbox',
        limit,
        hasCursor: Boolean(query.cursor),
        hasPatientQuery: needle !== null,
      },
      'Leyendo bandeja de recepción',
    );

    const em = this.em.fork();
    const chunkSize = Math.min(Math.max(limit * 2, 50), 200);
    const labels = new Map<string, InboxPatientLabel | null>();

    const collected: ServiceRequests[] = [];
    let after = query.cursor ? decodeAfterKey(query.cursor) : undefined;
    let exhausted = false;

    for (let scan = 0; scan < MAX_SCANS && collected.length <= limit; scan++) {
      const batch = await this.receptionRepo.findInboxCandidates(
        em,
        tenantId,
        CATEGORIAS_CON_ESPECIMEN,
        CLIN.SERVICE_REQUEST_ACTIVE,
        after,
        chunkSize,
      );
      if (batch.length === 0) {
        exhausted = true;
        break;
      }

      const accessioned =
        await this.receptionRepo.findAccessionedServiceRequestIds(
          em,
          tenantId,
          batch.map((order) => order.id),
        );
      let pending = batch.filter((order) => !accessioned.has(order.id));

      if (needle !== null && pending.length > 0) {
        await this.loadLabels(em, labels, pending);
        pending = pending.filter((order) =>
          matchesPatient(labels.get(order.patientProfileId) ?? null, needle),
        );
      }

      collected.push(...pending);
      const last = batch[batch.length - 1];
      after = { createdAt: last.createdAt, id: last.id };
      if (batch.length < chunkSize) {
        exhausted = true;
        break;
      }
    }

    const page = collected.slice(0, limit);
    let nextCursor: string | null = null;
    if (collected.length > limit) {
      // Hay más en lo ya leído: la próxima página arranca después de la
      // última fila **devuelta**, no de la última leída.
      nextCursor = encodeAfterKey(page[page.length - 1]);
    } else if (!exhausted && after) {
      // El techo de lecturas cortó antes de llenar la página.
      nextCursor = encodeKeysetCursor({
        createdAt: after.createdAt.toISOString(),
        id: after.id,
      });
    }

    const items = await this.toItems(em, tenantId, page, labels);
    return { items, count: items.length, limit, nextCursor };
  }

  /** Completa el mapa de rótulos con los pacientes que falten. */
  private async loadLabels(
    em: EntityManager,
    labels: Map<string, InboxPatientLabel | null>,
    orders: readonly ServiceRequests[],
  ): Promise<void> {
    const missing = [
      ...new Set(
        orders
          .map((order) => order.patientProfileId)
          .filter((id) => !labels.has(id)),
      ),
    ];
    if (missing.length === 0) return;
    const found = await this.receptionRepo.findPatientLabels(em, missing);
    for (const id of missing) labels.set(id, found.get(id) ?? null);
  }

  /** Proyecta la página: paciente, estudio, organización y muestras. */
  private async toItems(
    em: EntityManager,
    tenantId: string,
    page: readonly ServiceRequests[],
    labels: Map<string, InboxPatientLabel | null>,
  ): Promise<LabInboxItemDto[]> {
    if (page.length === 0) return [];
    const orderIds = page.map((order) => order.id);

    const [specimens, studyNames, tenantNames] = await Promise.all([
      this.receptionRepo.findSpecimensForServiceRequests(
        em,
        tenantId,
        orderIds,
      ),
      this.receptionRepo.findConceptDisplays(
        em,
        page.map((order) => order.codeConceptId),
      ),
      this.receptionRepo.findTenantNames(
        em,
        page.map((order) => order.custodianTenantId),
      ),
      this.loadLabels(em, labels, page),
    ]);
    const specimenIds = specimens.map((specimen) => specimen.id);
    const [containers, custody] = await Promise.all([
      this.specimensRepo.findContainersBySpecimenIds(em, specimenIds),
      this.specimensRepo.findCustodyEventsBySpecimenIds(em, specimenIds),
    ]);

    return page.map((order) => {
      const label = labels.get(order.patientProfileId) ?? null;
      return {
        serviceRequestId: order.id,
        patientProfileId: order.patientProfileId,
        patientDisplayName: label?.displayName ?? null,
        patientCode: label?.patientCode ?? null,
        codeConceptId: order.codeConceptId,
        codeDisplay: studyNames.get(order.codeConceptId) ?? null,
        categoryConceptId: order.categoryConceptId ?? null,
        priorityConceptId: order.priorityConceptId ?? null,
        statusConceptId: order.statusConceptId,
        requesterProfileId: order.requesterProfileId ?? null,
        requestingTenantId: order.custodianTenantId,
        requestingTenantName: tenantNames.get(order.custodianTenantId) ?? null,
        requestedAt: order.createdAt,
        specimens: specimens
          .filter((specimen) => specimen.serviceRequestId === order.id)
          .map((specimen) =>
            toSpecimenDetail(
              specimen,
              containers.filter((c) => c.specimenId === specimen.id),
              custody.filter((e) => e.specimenId === specimen.id),
            ),
          ),
      };
    });
  }
}

/**
 * Minúsculas y sin tildes: «Pérez» y «perez» son la misma búsqueda en un
 * mostrador donde nadie escribe los acentos.
 */
export function normalizeForSearch(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Si el paciente coincide con el texto buscado (nombre o código). */
function matchesPatient(
  label: InboxPatientLabel | null,
  needle: string,
): boolean {
  if (!label) return false;
  return [label.displayName, label.patientCode].some(
    (value) =>
      typeof value === 'string' && normalizeForSearch(value).includes(needle),
  );
}

/** Cursor de continuación a partir de una orden. */
function encodeAfterKey(order: ServiceRequests): string {
  return encodeKeysetCursor({
    createdAt: order.createdAt.toISOString(),
    id: order.id,
  });
}

/**
 * Decodifica el cursor de la bandeja. Uno bien formado pero con otra forma
 * —de otro listado, o armado a mano— es tan inválido como uno corrupto.
 */
function decodeAfterKey(cursor: string): InboxAfterKey {
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
