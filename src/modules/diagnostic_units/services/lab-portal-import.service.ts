import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import type { AuthenticatedUser } from '../../../common';
import type { LabImportDto } from '../dto/lab-portal-requests.dto';
import type {
  LabImportResultDto,
  LabImportRowResultDto,
} from '../dto/lab-portal-responses.dto';
import {
  LabServiceChangesDto,
  LabServiceDraftDto,
} from '../dto/lab-portal-service.dto';
import { LabPortalContextService } from './lab-portal-context.service';
import { LabPortalWriterService } from './lab-portal-writer.service';
import { statusOf } from './lab-portal.mapping';

/** First human-readable constraint message of a validation run. */
function firstMessage(errors: ValidationError[]): string | null {
  for (const error of errors) {
    if (error.constraints) {
      const key = Object.keys(error.constraints)[0];
      return key === 'whitelistValidation'
        ? `Columna desconocida: ${error.property}.`
        : error.constraints[key];
    }
    const nested = firstMessage(error.children ?? []);
    if (nested) return nested;
  }
  return null;
}

/**
 * Bulk import of the lab catalog (`POST /diagnostics/lab/services/import`).
 *
 * Rows are matched by `code` (case-insensitive) and applied in order inside one
 * transaction. Each row is validated with the same DTO and business rules as
 * the single-service endpoints; a bad row is REJECTED with its reason and does
 * not stop the others.
 */
@Injectable()
export class LabPortalImportService {
  /**
   * @param em - Persistence context.
   * @param context - Catalog loading of the active tenant.
   * @param writer - Draft/change application.
   * @param logger - Structured logger (identifiers and counts only).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly context: LabPortalContextService,
    private readonly writer: LabPortalWriterService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LabPortalImportService.name);
  }

  async import(
    dto: LabImportDto,
    actor: AuthenticatedUser,
  ): Promise<LabImportResultDto> {
    const rows = await this.em.transactional(async (tx) => {
      const ctx = await this.context.load(tx);
      const seen = new Set<string>();
      const results: LabImportRowResultDto[] = [];
      for (const row of dto.rows) {
        const raw = row.service;
        const code = typeof raw.code === 'string' ? raw.code.trim() : '';
        const done = (
          outcome: LabImportRowResultDto['outcome'],
          reason: string | null = null,
        ) => results.push({ line: row.line, code, outcome, reason });

        if (seen.has(code.toLowerCase())) {
          done(
            'REJECTED',
            'El código se repite más arriba en el mismo archivo.',
          );
          continue;
        }
        seen.add(code.toLowerCase());

        const existing = code ? this.context.byCode(ctx, code) : undefined;
        if (!existing && dto.mode === 'UPDATE_ONLY') {
          done(
            'REJECTED',
            'No existe un servicio con ese código y el modo es «sólo actualizar».',
          );
          continue;
        }
        const Target = existing ? LabServiceChangesDto : LabServiceDraftDto;
        const data = plainToInstance(Target, raw);
        const invalid = firstMessage(
          await validate(data, { whitelist: true, forbidNonWhitelisted: true }),
        );
        const problem =
          invalid ??
          this.writer.problemOf(ctx, data, existing?.id)?.message ??
          null;
        if (problem) {
          done('REJECTED', problem);
          continue;
        }
        if (!existing) {
          await this.writer.create(
            tx,
            ctx,
            data as LabServiceDraftDto,
            actor.id,
          );
          done('CREATED');
          continue;
        }
        // A withdrawn service that comes back in the file comes back published.
        const changes: LabServiceChangesDto =
          statusOf(existing.statusConceptId) === 'WITHDRAWN' &&
          data.status === undefined
            ? { ...data, status: 'PUBLISHED' }
            : data;
        done(await this.writer.update(tx, ctx, existing, changes, actor.id));
      }
      this.logger.info(
        {
          operation: 'diagnostic_units.lab_portal.import',
          unitId: ctx.unit.id,
          mode: dto.mode,
          rows: results.length,
        },
        'Lab catalog imported',
      );
      return results;
    });
    const count = (outcome: LabImportRowResultDto['outcome']) =>
      rows.filter((r) => r.outcome === outcome).length;
    return {
      created: count('CREATED'),
      updated: count('UPDATED'),
      unchanged: count('UNCHANGED'),
      rejected: count('REJECTED'),
      rows,
    };
  }
}
