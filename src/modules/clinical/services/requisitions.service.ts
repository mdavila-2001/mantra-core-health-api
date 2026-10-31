import { createHash, randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { ServiceRequests } from '../entities';
import { StudyDetailReason } from '../clinical.error-reasons';
import type {
  CreateRequisitionDto,
  CreateServiceRequestDto,
  RequisitionItemDto,
  RequisitionResponseDto,
} from '../dto';
import { ServiceRequestReadService } from './service-request-read.service';
import { ServiceRequestsService } from './service-requests.service';

/** UUID determinista a partir de (tenant, paciente, clave): la clave de idempotencia es el id. */
function requisitionIdFor(
  tenantId: string,
  patientProfileId: string,
  key: string,
): string {
  const h = createHash('sha256')
    .update(`requisition:${tenantId}:${patientProfileId}:${key}`)
    .digest('hex');
  // Formato UUID v5-like (versión 5, variante RFC 4122).
  return (
    `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-` +
    `${((parseInt(h.slice(16, 18), 16) & 0x3f) | 0x80).toString(16)}${h.slice(18, 20)}-${h.slice(20, 32)}`
  );
}

/** Huella del contenido de la requisición, para distinguir repetición de colisión de clave. */
function fingerprint(dto: CreateRequisitionDto): string {
  const items = dto.items.map((i) => ({
    c: i.codeConceptId,
    s: i.specimenTypeConceptId ?? null,
    k: [...(i.componentConceptIds ?? [])].sort(),
    b: i.imaging?.bodySiteConceptId ?? null,
    l: i.imaging?.lateralityConceptId ?? null,
    x: i.imaging?.contrastConceptId ?? null,
  }));
  return createHash('sha256').update(JSON.stringify(items)).digest('hex');
}

/**
 * C4: `POST /clinical/requisitions`. N renglones (un estudio por fila de
 * `service_requests`) en UNA transacción, cada uno por
 * `ServiceRequestsService.create`; un 422 en cualquiera anula todo y lleva
 * `details.itemIndex`.
 *
 * Idempotencia sin tabla propia: con `Idempotency-Key`, el `requisitionId` se
 * deriva de (tenant, paciente, clave), de modo que repetir la llamada encuentra
 * las filas ya escritas y las devuelve (`replayed: true`) sin escribir nada. La
 * misma clave con otro contenido es 409. Un cerrojo consultivo por
 * `requisitionId` serializa dos envíos simultáneos.
 */
@Injectable()
export class RequisitionsService {
  constructor(
    private readonly em: EntityManager,
    private readonly serviceRequests: ServiceRequestsService,
    private readonly reader: ServiceRequestReadService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RequisitionsService.name);
  }

  async create(
    dto: CreateRequisitionDto,
    actor: AuthenticatedUser,
    idempotencyKey?: string,
  ): Promise<RequisitionResponseDto> {
    const tenantId = requireTenantId();
    const requisitionId = idempotencyKey
      ? requisitionIdFor(tenantId, dto.patientProfileId, idempotencyKey)
      : randomUUID();
    const sameContent = fingerprint(dto);

    return this.em.transactional(async (tx) => {
      if (idempotencyKey) {
        await tx
          .getConnection()
          .execute('SELECT pg_advisory_xact_lock(hashtextextended(?, 0))', [
            `requisition:${requisitionId}`,
          ]);
        const existing = await tx.find(
          ServiceRequests,
          { requisitionId, custodianTenantId: tenantId },
          { orderBy: { createdAt: 'ASC', id: 'ASC' } },
        );
        if (existing.length > 0) {
          const stored = await this.storedFingerprint(tx, existing);
          if (stored !== sameContent) {
            throw new ConflictException(
              'La Idempotency-Key ya se usó con un contenido distinto',
              {
                reason: StudyDetailReason.REQUISITION_IDEMPOTENCY_KEY_CONFLICT,
              },
            );
          }
          return {
            requisitionId,
            replayed: true,
            items: await this.reader.toResponses(tx, existing),
          };
        }
      }

      const items = [];
      for (const [itemIndex, item] of dto.items.entries()) {
        try {
          items.push(
            await this.serviceRequests.create(this.toSingle(dto, item), actor, {
              requisitionId,
              transaction: tx,
            }),
          );
        } catch (error) {
          if (error instanceof PreconditionFailedException) {
            throw new PreconditionFailedException(error.message, {
              ...error.details,
              itemIndex,
            });
          }
          throw error;
        }
      }
      this.logger.info(
        {
          operation: 'clinical.requisition.create',
          requisitionId,
          itemCount: items.length,
        },
        'Requisition placed',
      );
      return { requisitionId, replayed: false, items };
    });
  }

  /** Huella de lo ya guardado, calculada con el mismo criterio que la del cuerpo. */
  private async storedFingerprint(
    em: EntityManager,
    rows: ServiceRequests[],
  ): Promise<string> {
    const details = await em
      .getConnection()
      .execute<{ service_request_id: string; component_concept_id: string }[]>(
        `SELECT service_request_id, component_concept_id
         FROM clinical.service_request_components
        WHERE service_request_id = ANY(string_to_array(?, ',')::uuid[])`,
        [rows.map((r) => r.id).join(',')],
        'all',
      );
    const byRequest = new Map<string, string[]>();
    for (const d of details) {
      const list = byRequest.get(d.service_request_id) ?? [];
      list.push(d.component_concept_id);
      byRequest.set(d.service_request_id, list);
    }
    const items = rows.map((r) => ({
      c: r.codeConceptId,
      s: r.specimenTypeConceptId ?? null,
      k: (byRequest.get(r.id) ?? []).sort(),
      b: r.bodySiteConceptId ?? null,
      l: r.lateralityConceptId ?? null,
      x: r.contrastConceptId ?? null,
    }));
    return createHash('sha256').update(JSON.stringify(items)).digest('hex');
  }

  private toSingle(
    dto: CreateRequisitionDto,
    item: RequisitionItemDto,
  ): CreateServiceRequestDto {
    return {
      custodianTenantId: dto.custodianTenantId,
      patientProfileId: dto.patientProfileId,
      encounterId: dto.encounterId,
      formInstanceId: dto.formInstanceId,
      requesterProfileId: dto.requesterProfileId,
      priorityConceptId: dto.priorityConceptId,
      basedOnNoteIds: dto.basedOnNoteIds,
      performerSelectionConceptId: dto.performerSelectionConceptId,
      performerTenantId: dto.performerTenantId,
      performerPractitionerProfileId: dto.performerPractitionerProfileId,
      suggestedPracticeSiteId: dto.suggestedPracticeSiteId,
      codeConceptId: item.codeConceptId,
      category: item.category,
      categoryConceptId: item.categoryConceptId,
      specimenTypeConceptId: item.specimenTypeConceptId,
      componentConceptIds: item.componentConceptIds,
      imaging: item.imaging,
      previousDiagnosticReportId:
        item.duplicateDecision?.previousDiagnosticReportId,
      reusePreviousReport: item.duplicateDecision?.reusePreviousReport,
      duplicateOverrideReason: item.duplicateDecision?.duplicateOverrideReason,
    };
  }
}
