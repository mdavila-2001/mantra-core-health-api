import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../../common';
import { NotificationsService } from '../../messaging/services';
import { PersonAccountLinksRepository } from '../../profiles/infrastructure/repositories';
import {
  ClinicalRefsRepository,
  DiagnosticOrdersRepository,
} from '../repositories';
import type { DetectCriticalResultDto, ResourceCreatedDto } from '../dto';
import { DiagnosticsReportsService } from './diagnostics-reports.service';

/**
 * UC-20-09 end to end: records the critical result and tells the responsible
 * practitioner through the bell (and push).
 *
 * The notice is written in the same request transaction, after the critical
 * record, and never throws: a failing bell never undoes the record, which
 * stays the source of truth for the acknowledgement SLA. Responsible = the
 * practitioner who requested the study (the report's service request), else
 * the primary practitioner of the observation's encounter. Only clinicians:
 * whoever merely typed the order in (`created_by_user_id`) may be admin staff.
 */
@Injectable()
export class CriticalResultDetectionService {
  constructor(
    private readonly em: EntityManager,
    private readonly reports: DiagnosticsReportsService,
    private readonly ordersRepo: DiagnosticOrdersRepository,
    private readonly refsRepo: ClinicalRefsRepository,
    private readonly accountLinks: PersonAccountLinksRepository,
    private readonly notifications: NotificationsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CriticalResultDetectionService.name);
  }

  async detect(
    dto: DetectCriticalResultDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    const created = await this.reports.detectCritical(dto, actor);
    await this.notifyResponsible(dto, created.id, actor);
    return created;
  }

  private async notifyResponsible(
    dto: DetectCriticalResultDto,
    criticalId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    try {
      // Reads join the request transaction (as a savepoint), which carries the
      // tenant RLS scope: a detached fork has no tenant and sees nothing when
      // RLS_ENFORCE is on. Socket and push wait for the request COMMIT.
      const target = await this.em
        .fork({ keepTransactionContext: true })
        .transactional((em) => this.responsibleOf(em, dto));
      if (!target.userId || target.userId === actor.id) return;
      // No patient name, value or study in the text: the bell can be on screen
      // in front of anyone, and the push body stays generic anyway.
      await this.notifications.emitInApp({
        recipientUserId: target.userId,
        category: 'CLINICAL',
        subject: 'Resultado crítico de un paciente suyo',
        bodyText:
          'Hay un resultado crítico pendiente de acuse de recibo. Revíselo cuanto antes.',
        destination: { type: 'CRITICAL_RESULT', id: criticalId },
        tenantId: target.tenantId,
        debounceKey: `diagnostics:critical:${criticalId}`,
        actorUserId: actor.id,
      });
    } catch (error) {
      this.logger.error(
        { operation: 'diagnostics.critical.notify', criticalId, err: error },
        'Critical result notice failed; the critical record stays',
      );
    }
  }

  private async responsibleOf(
    em: EntityManager,
    dto: DetectCriticalResultDto,
  ): Promise<{ userId?: string; tenantId?: string }> {
    if (dto.diagnosticReportId) {
      const report = await this.ordersRepo.findReportById(
        em,
        dto.diagnosticReportId,
      );
      const order = report?.serviceRequestId
        ? await this.refsRepo.findServiceRequest(em, report.serviceRequestId)
        : null;
      const requester = await this.userOf(em, order?.requesterProfileId);
      if (requester) {
        return { userId: requester, tenantId: order?.custodianTenantId };
      }
    }
    const observation = await this.refsRepo.findObservation(
      em,
      dto.observationId,
    );
    const encounter = observation?.encounterId
      ? await this.refsRepo.findEncounter(em, observation.encounterId)
      : null;
    return {
      userId: await this.userOf(em, encounter?.primaryPractitionerId),
      tenantId: observation?.custodianTenantId,
    };
  }

  /** Account of a practitioner (profile ids are person ids), if linked. */
  private async userOf(
    em: EntityManager,
    personId: string | undefined,
  ): Promise<string | undefined> {
    if (!personId) return undefined;
    const link = await this.accountLinks.findActiveByPerson(em, personId);
    return link?.userId ?? undefined;
  }
}
