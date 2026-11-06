import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';
import { AttachableFileService } from '../../common/services/attachable-file.service';
import { TenantAdministrationService } from '../../directory/services/tenant-administration.service';
import { ReportIssuerSettings } from '../entities';
import { ReportDraftsRepository } from '../repositories/report-drafts.repository';
import type {
  ReportIssuerSettingsDto,
  UpdateReportIssuerSettingsDto,
} from '../dto/report-issuer-settings.dto';
import { assertActorFile } from './report-file-access';

/** Formats `pdfkit` can embed: the images end up in the official PDF. */
export const REPORT_IMAGE_MIME_TYPES: readonly string[] = [
  'image/png',
  'image/jpeg',
];

const EMPTY: ReportIssuerSettingsDto = {
  signatureFileId: null,
  sealFileId: null,
  responsibleName: null,
  responsibleTitle: null,
};

/**
 * Signature, seal and responsible of the organization that issues reports
 * («firma del laboratorio» of the official PDF). Any member reads them; only
 * an OWNER/ADMIN of the tenant (or the platform) changes them, the same rule
 * as the organization logo.
 */
@Injectable()
export class ReportIssuerSettingsService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: ReportDraftsRepository,
    private readonly permissions: TenantAdministrationService,
    private readonly attachable: AttachableFileService,
  ) {}

  async get(
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<ReportIssuerSettingsDto> {
    const em = this.em.fork();
    await this.permissions.assertCanRead(em, tenantId, actor);
    return toDto(await this.repo.findIssuerSettings(em, tenantId));
  }

  async set(
    tenantId: string,
    dto: UpdateReportIssuerSettingsDto,
    actor: AuthenticatedUser,
  ): Promise<ReportIssuerSettingsDto> {
    return this.em.transactional(async (tx) => {
      await this.permissions.assertCanAdminister(tx, tenantId, actor);
      const current = await this.repo.findIssuerSettings(tx, tenantId);
      const kept = [current?.signatureFileId, current?.sealFileId];
      // Only a newly referenced image must be the actor's own upload; a kept one was checked when set.
      for (const fileId of [dto.signatureFileId, dto.sealFileId]) {
        if (fileId === null || kept.includes(fileId)) continue;
        await assertActorFile(this.attachable, tx, fileId, actor, {
          allowedMimeTypes: REPORT_IMAGE_MIME_TYPES,
          operation: 'diagnostics.report-issuer-settings',
        });
      }
      const now = new Date();
      const row =
        current ??
        tx.create(
          ReportIssuerSettings,
          {
            custodianTenantId: tenantId,
            createdAt: now,
            updatedAt: now,
            createdByUserId: actor.id,
          },
          { partial: true },
        );
      row.signatureFileId = dto.signatureFileId;
      row.sealFileId = dto.sealFileId;
      row.responsibleName = dto.responsibleName;
      row.responsibleTitle = dto.responsibleTitle;
      row.updatedAt = now;
      row.updatedByUserId = actor.id;
      await tx.flush();
      return toDto(row);
    });
  }
}

function toDto(row: ReportIssuerSettings | null): ReportIssuerSettingsDto {
  if (!row) return EMPTY;
  return {
    signatureFileId: row.signatureFileId ?? null,
    sealFileId: row.sealFileId ?? null,
    responsibleName: row.responsibleName ?? null,
    responsibleTitle: row.responsibleTitle ?? null,
  };
}
