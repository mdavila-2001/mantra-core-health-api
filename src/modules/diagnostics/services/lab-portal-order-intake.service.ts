import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { CLIN } from '../../clinical/clinical.concepts';
import { ServiceRequests } from '../../clinical/entities';
import { categoryConceptIdFor } from '../../clinical/service-request-category';
import { detailColumnsOf } from '../../clinical/service-request-imaging';
import { ServiceRequestDetailService } from '../../clinical/services/service-request-detail.service';
import { OutboxService } from '../../messaging/services';
import { PatientProfiles } from '../../profiles/entities';
import { LabPortalRepository, LabReceptionRepository } from '../repositories';
import { ReportDraftsRepository } from '../repositories/report-drafts.repository';
import type { LabOrderDto } from '../dto/lab-portal-orders.dto';
import type {
  CreateLabOrderDto,
  LabOrderIntakeFieldsDto,
  LabPatientMatchDto,
  UpdateLabOrderDto,
} from '../dto/lab-portal-order-intake.dto';
import { toOrderDto } from './lab-portal-orders.service';
import { notAvailable } from './lab-portal-results.service';
import { LabPortalSnapshotService } from './lab-portal-snapshot.service';

const NO_PATIENT = 'No hay ningún paciente registrado con ese documento.';

/**
 * Orders the laboratory / imaging center enters itself (v4.2.96): the paper
 * order a patient brings or a walk-in request. The center is custodian and
 * performer; there is no encounter and no platform requester. Only these
 * orders can be edited by the center, and only before it receives them.
 * Cancelling one is the `CANCEL` step of {@link LabPortalOrdersService}.
 */
@Injectable()
export class LabPortalOrderIntakeService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: LabPortalRepository,
    private readonly labels: LabReceptionRepository,
    private readonly detail: ServiceRequestDetailService,
    private readonly snapshot: LabPortalSnapshotService,
    private readonly drafts: ReportDraftsRepository,
    private readonly outbox: OutboxService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LabPortalOrderIntakeService.name);
  }

  /** The patient holding exactly that national id (active identifier). */
  async lookupPatient(nationalId: string): Promise<LabPatientMatchDto> {
    const em = this.em.fork();
    const rows = await em.execute<{ profile_id: string }[]>(
      `select pp.profile_id
         from profiles.patient_profiles pp
         join common.identifiers i on i.owner_id = pp.profile_id
        where i.type_concept_id = ? and i.state_concept_id = ? and i.value = ?
        limit 2`,
      [CONCEPTS.ID_TYPE_NATIONAL, CONCEPTS.STATE_ACTIVE, nationalId.trim()],
    );
    if (rows.length === 0) {
      throw new ResourceNotFoundException(
        NO_PATIENT,
        undefined,
        'LAB_PATIENT_NOT_FOUND',
      );
    }
    if (rows.length > 1) {
      throw new ConflictException(
        'Ese documento figura en más de un paciente. Pida a soporte que lo revise.',
        { reason: 'LAB_PATIENT_AMBIGUOUS' },
      );
    }
    const id = rows[0].profile_id;
    const label = (await this.labels.findPatientLabels(em, [id])).get(id);
    return {
      patientProfileId: id,
      displayName: label?.displayName ?? 'Paciente',
      patientCode: label?.patientCode ?? null,
    };
  }

  async create(
    tenantId: string,
    dto: CreateLabOrderDto,
    actor: AuthenticatedUser,
  ): Promise<LabOrderDto> {
    const orderId = await this.em.transactional(async (tx) => {
      const patient = await tx.findOne(PatientProfiles, {
        profileId: dto.patientProfileId,
      });
      if (!patient) {
        throw new PreconditionFailedException(NO_PATIENT, {
          reason: 'LAB_PATIENT_NOT_FOUND',
          field: 'patientProfileId',
        });
      }
      const fields = await this.prepare(tx, dto);
      const now = new Date();
      const order = tx.create(
        ServiceRequests,
        {
          custodianTenantId: tenantId,
          performerTenantId: tenantId,
          patientProfileId: dto.patientProfileId,
          intentConceptId: CLIN.SERVICE_REQUEST_INTENT_ORDER,
          statusConceptId: CLIN.SERVICE_REQUEST_ACTIVE,
          registeredByPerformer: true,
          ...fields,
          createdAt: now,
          updatedAt: now,
          createdByUserId: actor.id,
          updatedByUserId: actor.id,
        },
        { partial: true },
      );
      await tx.flush();
      await this.outbox.publishDomainEvent(tx, {
        tenantId,
        eventType: 'ServiceRequestPlaced',
        aggregateType: 'clinical.service_requests',
        aggregateId: order.id,
        payloadJson: {
          serviceRequestId: order.id,
          statusConceptId: order.statusConceptId,
          registeredByPerformer: true,
        },
        actorUserId: actor.id,
      });
      await tx.flush();
      return order.id;
    });
    this.logger.info(
      { operation: 'diagnostics.lab-portal.order.create', orderId },
      'Center-registered order placed',
    );
    return this.read(tenantId, orderId);
  }

  async update(
    tenantId: string,
    orderId: string,
    dto: UpdateLabOrderDto,
    actor: AuthenticatedUser,
  ): Promise<LabOrderDto> {
    await this.em.transactional(async (tx) => {
      const order = await this.repo.findOrder(tx, tenantId, orderId);
      if (!order) throw notAvailable();
      const [view] = (await this.snapshot.load(tx, tenantId, [order])).orders;
      if (!order.registeredByPerformer || view.status !== 'DRAFT') {
        throw new ConflictException(
          'Sólo se editan las órdenes que cargó el centro y que todavía no se recibieron.',
          { reason: 'LAB_ORDER_NOT_EDITABLE', currentStatus: view.status },
        );
      }
      // Every editable field is replaced: an omitted optional is cleared.
      tx.assign(order, {
        ...(await this.prepare(tx, dto)),
        updatedAt: new Date(),
        updatedByUserId: actor.id,
      });
      await tx.flush();
    });
    this.logger.info(
      { operation: 'diagnostics.lab-portal.order.update', orderId },
      'Center-registered order edited',
    );
    return this.read(tenantId, orderId);
  }

  /** Catalog checks (same as the practitioner's order, V1–V9) and the columns to write. */
  private async prepare(tx: EntityManager, dto: LabOrderIntakeFieldsDto) {
    const prepared = await this.detail.prepare(tx, {
      codeConceptId: dto.codeConceptId,
      categoryConceptId: categoryConceptIdFor(dto.category),
      specimenTypeConceptId: dto.specimenTypeConceptId,
      imaging: dto.imaging,
    });
    return {
      codeConceptId: dto.codeConceptId,
      categoryConceptId: prepared.categoryConceptId,
      priorityConceptId: dto.priorityConceptId ?? null,
      ...nullable(detailColumnsOf(prepared)),
      externalRequesterName: dto.externalRequesterName?.trim() ?? null,
      externalRequesterLicense: dto.externalRequesterLicense?.trim() ?? null,
    };
  }

  private async read(tenantId: string, orderId: string): Promise<LabOrderDto> {
    const em = this.em.fork();
    const order = await this.repo.findOrder(em, tenantId, orderId);
    if (!order) throw notAvailable();
    const [view] = (await this.snapshot.load(em, tenantId, [order])).orders;
    const [draft] = await this.drafts.findByOrders(em, tenantId, [orderId]);
    return toOrderDto(view, draft);
  }
}

/** `undefined` → `null`, so an edit clears what the new detail no longer has. */
function nullable<T extends object>(
  columns: T,
): { [K in keyof T]: Exclude<T[K], undefined> | null } {
  return Object.fromEntries(
    Object.entries(columns).map(([key, value]) => [key, value ?? null]),
  ) as { [K in keyof T]: Exclude<T[K], undefined> | null };
}
