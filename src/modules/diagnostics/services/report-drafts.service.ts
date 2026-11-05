import { Injectable } from '@nestjs/common';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../common';
import { ServiceRequests } from '../../clinical/entities';
import { ReportDraftFiles, ReportDrafts } from '../entities';
import { LAB_CLINICAL_ROLES } from '../guards/lab-staff.guard';
import {
  DRAFT_STATUS,
  ReportDraftsRepository,
} from '../repositories/report-drafts.repository';
import type { ReportDraftDto } from '../dto/report-draft.dto';
import type {
  AttachReportDraftFileDto,
  UpdateReportDraftDto,
} from '../dto/report-draft-write.dto';
import { AttachableFileService } from '../../common/services/attachable-file.service';
import { notAvailable } from './lab-portal-results.service';
import {
  EMPTY_REPORT_BODY,
  parseReportBody,
  reportPlainText,
  storedReportBody,
} from './report-body';
import { assertActorFile } from './report-file-access';
import { reportAlreadyPublished } from './report-immutability.service';
import { assertDraftRowVersion } from './report-publication.writer';
import { ReportSignersService } from './report-signers.service';

/** A draft with the order it reports, both already scoped to the actor. */
export interface ReportDraftContext {
  readonly draft: ReportDrafts;
  readonly order: ServiceRequests;
}

/**
 * Draft of the written report of one order (H1): get-or-create, edit, files.
 *
 * Access to the order: the performer tenant (laboratory / imaging center),
 * or — for an order without performer — a clinician of the tenant that
 * issued it. Anything else is the uniform 404 of the module.
 */
@Injectable()
export class ReportDraftsService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: ReportDraftsRepository,
    private readonly attachable: AttachableFileService,
    private readonly signers: ReportSignersService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ReportDraftsService.name);
  }

  /** The order, only when the active tenant may report it. */
  async reportableOrder(
    em: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
    serviceRequestId: string,
  ): Promise<ServiceRequests> {
    const order = await em.findOne(ServiceRequests, { id: serviceRequestId });
    const ownOrder =
      !order?.performerTenantId &&
      order?.custodianTenantId === tenantId &&
      LAB_CLINICAL_ROLES.some((r) =>
        roleAuthorizesInTenant(actor, r, tenantId),
      );
    if (!order || (order.performerTenantId !== tenantId && !ownOrder)) {
      throw notAvailable();
    }
    return order;
  }

  /** Draft of the tenant plus its order; 404 when either is out of reach. */
  async load(
    em: EntityManager,
    tenantId: string,
    actor: AuthenticatedUser,
    id: string,
  ): Promise<ReportDraftContext> {
    const draft = await this.repo.findById(em, tenantId, id);
    if (!draft) throw notAvailable();
    const order = await this.reportableOrder(
      em,
      tenantId,
      actor,
      draft.serviceRequestId,
    );
    return { draft, order };
  }

  /** Idempotent: the tenant's draft of the order, created when missing. */
  async open(
    tenantId: string,
    serviceRequestId: string,
    actor: AuthenticatedUser,
  ): Promise<ReportDraftDto> {
    const em = this.em.fork();
    await this.reportableOrder(em, tenantId, actor, serviceRequestId);
    const existing = await this.repo.findByOrder(
      em,
      tenantId,
      serviceRequestId,
    );
    if (existing) return this.toDto(em, existing);
    const now = new Date();
    try {
      const draft = await this.em.transactional(async (tx) => {
        const created = tx.create(
          ReportDrafts,
          {
            custodianTenantId: tenantId,
            serviceRequestId,
            bodyJson: EMPTY_REPORT_BODY,
            patientVisibilityCode: 'VISIBLE',
            statusCode: DRAFT_STATUS.DRAFT,
            createdAt: now,
            updatedAt: now,
            createdByUserId: actor.id,
            updatedByUserId: actor.id,
          },
          { partial: true },
        );
        await tx.flush();
        return created;
      });
      this.logger.info(
        { operation: 'diagnostics.report-draft.open', draftId: draft.id },
        'Report draft created',
      );
      return this.toDto(this.em.fork(), draft);
    } catch (error) {
      // Two first opens raced on `ux_report_drafts_tenant_request`: the winner's row is the draft.
      if (!(error instanceof UniqueConstraintViolationException)) throw error;
      const fresh = this.em.fork();
      const winner = await this.repo.findByOrder(
        fresh,
        tenantId,
        serviceRequestId,
      );
      if (!winner) throw error;
      return this.toDto(fresh, winner);
    }
  }

  async get(
    tenantId: string,
    id: string,
    actor: AuthenticatedUser,
  ): Promise<ReportDraftDto> {
    const em = this.em.fork();
    const { draft } = await this.load(em, tenantId, actor, id);
    return this.toDto(em, draft);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateReportDraftDto,
    actor: AuthenticatedUser,
  ): Promise<ReportDraftDto> {
    const draft = await this.em.transactional(async (tx) => {
      const { draft: row } = await this.load(tx, tenantId, actor, id);
      this.assertEditable(row);
      assertDraftRowVersion(row, dto.rowVersion);
      const body = parseReportBody(dto.body);
      if (dto.signerProfileId !== null) {
        await this.signers.assertSigner(
          tx,
          tenantId,
          actor,
          dto.signerProfileId,
        );
      }
      row.bodyJson = body;
      row.conclusionText = reportPlainText(body) || null;
      row.signerProfileId = dto.signerProfileId;
      row.patientVisibilityCode = dto.patientVisibility;
      row.updatedAt = new Date();
      row.updatedByUserId = actor.id;
      await tx.flush();
      return row;
    });
    return this.toDto(this.em.fork(), draft);
  }

  async attachFile(
    tenantId: string,
    id: string,
    dto: AttachReportDraftFileDto,
    actor: AuthenticatedUser,
  ): Promise<ReportDraftDto> {
    const draft = await this.em.transactional(async (tx) => {
      const { draft: row } = await this.load(tx, tenantId, actor, id);
      this.assertEditable(row);
      await assertActorFile(this.attachable, tx, dto.fileId, actor, {
        operation: 'diagnostics.report-draft.file',
      });
      const files = await this.repo.findFiles(tx, row.id);
      if (files.some((f) => f.fileId === dto.fileId)) {
        throw new ConflictException('El archivo ya está en el borrador', {
          fileId: dto.fileId,
        });
      }
      tx.create(ReportDraftFiles, {
        reportDraftId: row.id,
        custodianTenantId: tenantId,
        fileId: dto.fileId,
        roleCode: dto.role,
        ordinal: files.length,
        createdAt: new Date(),
        createdByUserId: actor.id,
      });
      await tx.flush();
      return row;
    });
    return this.toDto(this.em.fork(), draft);
  }

  async removeFile(
    tenantId: string,
    id: string,
    draftFileId: string,
    actor: AuthenticatedUser,
  ): Promise<ReportDraftDto> {
    const draft = await this.em.transactional(async (tx) => {
      const { draft: row } = await this.load(tx, tenantId, actor, id);
      this.assertEditable(row);
      const file = await tx.findOne(ReportDraftFiles, {
        id: draftFileId,
        reportDraftId: row.id,
      });
      if (!file) throw notAvailable();
      tx.remove(file);
      await tx.flush();
      return row;
    });
    return this.toDto(this.em.fork(), draft);
  }

  /** 409 `REPORT_ALREADY_PUBLISHED` once the draft is published. */
  assertEditable(draft: ReportDrafts): void {
    if (draft.statusCode !== DRAFT_STATUS.DRAFT) throw reportAlreadyPublished();
  }

  async toDto(em: EntityManager, draft: ReportDrafts): Promise<ReportDraftDto> {
    const files = await this.repo.findFiles(em, draft.id);
    return {
      id: draft.id,
      serviceRequestId: draft.serviceRequestId,
      status:
        draft.statusCode === DRAFT_STATUS.PUBLISHED ? 'PUBLISHED' : 'DRAFT',
      body: storedReportBody(draft.bodyJson),
      conclusionText: draft.conclusionText ?? null,
      signerProfileId: draft.signerProfileId ?? null,
      patientVisibility:
        draft.patientVisibilityCode === 'HELD' ? 'HELD' : 'VISIBLE',
      rowVersion: draft.rowVersion,
      diagnosticReportId: draft.diagnosticReportId ?? null,
      publishedVersionId: draft.publishedVersionId ?? null,
      publishedAt: draft.publishedAt?.toISOString() ?? null,
      updatedAt: draft.updatedAt.toISOString(),
      files: files.map((f) => ({
        id: f.id,
        fileId: f.fileId,
        role: f.roleCode as ReportDraftDto['files'][number]['role'],
        ordinal: f.ordinal,
      })),
    };
  }
}
