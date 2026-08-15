import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { AuditTrailService } from '../../audit/services/audit-trail.service';
import {
  AddPharmacovigilanceActionDto,
  CreatePharmacovigilanceReportDto,
  CreatedResourceDto,
  TransitionResultDto,
} from '../dto';
import type {
  PharmacovigilanceActions,
  PharmacovigilanceReports,
} from '../entities';
import {
  CatalogRepository,
  PharmacovigilanceRepository,
} from '../repositories';
import { PHL } from '../pharma_lab.concepts';
import { PharmaLabAccessService } from './pharma-lab-access.service';
import { PharmaLabNotificationsService } from './pharma-lab-notifications.service';
import { PharmaLabOrganizationService } from './pharma-lab-organization.service';

/**
 * Transiciones admitidas del estado de un reporte de farmacovigilancia
 * (spec 5595-5597).
 *
 * Un reporte cerrado no se reabre editándolo: se abre uno nuevo enlazado por
 * lote y producto. La lista cerrada es lo que hace que la trazabilidad exigida
 * por la spec sea real y no una convención.
 */
const REPORT_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
  [PHL.PV_RECEIVED]: [PHL.PV_UNDER_ASSESSMENT, PHL.PV_CLOSED],
  [PHL.PV_UNDER_ASSESSMENT]: [
    PHL.PV_FOLLOW_UP,
    PHL.PV_REPORTED_TO_AUTHORITY,
    PHL.PV_CLOSED,
  ],
  [PHL.PV_FOLLOW_UP]: [
    PHL.PV_UNDER_ASSESSMENT,
    PHL.PV_REPORTED_TO_AUTHORITY,
    PHL.PV_CLOSED,
  ],
  [PHL.PV_REPORTED_TO_AUTHORITY]: [PHL.PV_FOLLOW_UP, PHL.PV_CLOSED],
  [PHL.PV_CLOSED]: [],
};

/**
 * UC-17-29 y UC-17-30: farmacovigilancia (spec 5575-5598).
 *
 * Es el módulo que la regla del carril marca explícitamente como «no puede ser
 * mock»: cada reporte tiene código de caso, estado, seguimiento con acciones
 * fechadas y firmadas, y su propia entrada en la cadena WORM. Un reporte no
 * cambia de estado sin dejar la acción que lo justifica — es la misma
 * transacción.
 */
@Injectable()
export class PharmacovigilanceService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param repo - Repositorio de farmacovigilancia.
   * @param catalog - Repositorio del catálogo, para validar el producto.
   * @param access - Comprobaciones de vinculación y estado.
   * @param organization - Personal del laboratorio, destinatario de los avisos.
   * @param notifications - Buzón de avisos dentro del producto.
   * @param audit - Cadena WORM de auditoría.
   * @param logger - Registro estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: PharmacovigilanceRepository,
    private readonly catalog: CatalogRepository,
    private readonly access: PharmaLabAccessService,
    private readonly organization: PharmaLabOrganizationService,
    private readonly notifications: PharmaLabNotificationsService,
    private readonly audit: AuditTrailService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PharmacovigilanceService.name);
  }

  /**
   * UC-17-29: registra un reporte.
   *
   * Lo puede enviar un doctor, una farmacia o una organización (5584); el
   * laboratorio destinatario es el dueño del producto.
   *
   * @param pharmaLabId - Laboratorio.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que reporta.
   * @returns Identificador del reporte creado.
   * @throws ResourceNotFoundException si el producto no es del laboratorio.
   */
  async createReport(
    pharmaLabId: string,
    dto: CreatePharmacovigilanceReportDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.em.transactional(async (tx) => {
      const lab = await this.access.requireLab(tx, pharmaLabId);
      const product = await this.catalog.findProduct(tx, dto.pharmaProductId);
      if (!product || product.pharmaLabId !== pharmaLabId) {
        throw new ResourceNotFoundException(
          'Producto no encontrado en el catálogo del laboratorio',
          { pharmaLabId, pharmaProductId: dto.pharmaProductId },
        );
      }

      const caseCode = await this.nextCaseCode(tx, pharmaLabId);
      const report = this.repo.createReport(tx, {
        pharmaLabId,
        pharmaProductId: dto.pharmaProductId,
        caseCode,
        batchNumber: dto.batchNumber,
        eventDate: dto.eventDate,
        eventTypeConceptId: dto.eventTypeConceptId,
        description: dto.description,
        severityConceptId: dto.severityConceptId,
        statusConceptId: PHL.PV_RECEIVED,
        reporterTypeConceptId: dto.reporterTypeConceptId,
        reporterUserId: actor.id,
        reporterTenantId: dto.reporterTenantId,
        subjectPseudonym: dto.subjectPseudonym,
        subjectAgeYears: dto.subjectAgeYears,
        subjectSexConceptId: dto.subjectSexConceptId,
        receivedAt: new Date(),
        actorUserId: actor.id,
      });
      await tx.flush();

      this.repo.appendAction(tx, {
        pharmacovigilanceReportId: report.id,
        actionConceptId: PHL.PV_ACTION_ASSESSMENT,
        previousStatusConceptId: PHL.PV_RECEIVED,
        newStatusConceptId: PHL.PV_RECEIVED,
        detail: 'Reporte recibido y registrado.',
        actorUserId: actor.id,
      });

      // El personal de farmacovigilancia tiene que enterarse sin depender de que
      // alguien mire una bandeja: es un evento de seguridad, no una tarea más.
      const staffUserIds = await this.organization.listActiveStaffUserIds(
        tx,
        pharmaLabId,
      );
      this.notifications.notifyAll(
        tx,
        staffUserIds,
        {
          templateCode: 'PHARMA_LAB_PV_REPORT_RECEIVED',
          subject: `Nuevo reporte de farmacovigilancia ${caseCode}`,
          bodyText: `${product.tradeName}: ${dto.description.slice(0, 200)}`,
          relatedResourceType: 'pharmacovigilance_report',
          relatedResourceId: report.id,
          tenantId: lab.tenantId,
        },
        actor.id,
      );
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'PHARMACOVIGILANCE_REPORT_CREATED',
        entity: 'pharmacovigilance_reports',
        entityId: report.id,
        tenantId: lab.tenantId,
      });
      this.logger.info(
        {
          operation: 'pharma_lab.pv.report',
          pharmacovigilanceReportId: report.id,
          caseCode,
        },
        'Pharmacovigilance report received',
      );
      return { id: report.id };
    });
  }

  /**
   * UC-17-30: registra una acción de seguimiento y mueve el estado del reporte.
   *
   * @param pharmaLabId - Laboratorio.
   * @param reportId - Reporte.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Identificador y estado resultante.
   * @throws ConflictException si la transición no está permitida.
   */
  async addAction(
    pharmaLabId: string,
    reportId: string,
    dto: AddPharmacovigilanceActionDto,
    actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.em.transactional(async (tx) => {
      const lab = await this.access.requireLab(tx, pharmaLabId);
      const report = await this.requireReport(tx, pharmaLabId, reportId);
      const allowed = REPORT_TRANSITIONS[report.statusConceptId] ?? [];
      const previous = report.statusConceptId;
      if (
        dto.newStatusConceptId !== previous &&
        !allowed.includes(dto.newStatusConceptId)
      ) {
        throw new ConflictException(
          'La transición de estado del reporte no está permitida',
          { reportId, current: previous },
        );
      }

      report.statusConceptId = dto.newStatusConceptId;
      if (dto.newStatusConceptId === PHL.PV_CLOSED) {
        report.closedAt = new Date();
      }
      touch(report, actor.id);

      this.repo.appendAction(tx, {
        pharmacovigilanceReportId: report.id,
        actionConceptId: dto.actionConceptId,
        previousStatusConceptId: previous,
        newStatusConceptId: dto.newStatusConceptId,
        authorityName: dto.authorityName,
        authorityReference: dto.authorityReference,
        detail: dto.detail,
        actorUserId: actor.id,
      });
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'PHARMACOVIGILANCE_ACTION_RECORDED',
        entity: 'pharmacovigilance_reports',
        entityId: report.id,
        tenantId: lab.tenantId,
      });
      return { id: report.id, statusConceptId: report.statusConceptId };
    });
  }

  /**
   * Lista los reportes del laboratorio.
   *
   * @param pharmaLabId - Laboratorio.
   * @returns Reportes del más reciente al más antiguo.
   */
  async listReports(pharmaLabId: string): Promise<PharmacovigilanceReports[]> {
    await this.access.requireLab(this.em, pharmaLabId);
    return this.repo.listReports(this.em, pharmaLabId);
  }

  /**
   * Lee un reporte con su trazabilidad completa.
   *
   * @param pharmaLabId - Laboratorio.
   * @param reportId - Reporte.
   * @returns El reporte y sus acciones.
   */
  async getReportDetail(
    pharmaLabId: string,
    reportId: string,
  ): Promise<{
    /** El reporte. */
    report: PharmacovigilanceReports;
    /** Acciones en orden cronológico. */
    actions: PharmacovigilanceActions[];
  }> {
    await this.access.requireLab(this.em, pharmaLabId);
    const report = await this.requireReport(this.em, pharmaLabId, reportId);
    return {
      report,
      actions: await this.repo.listActions(this.em, report.id),
    };
  }

  /**
   * Deriva el siguiente código de caso del laboratorio.
   *
   * Es correlativo por laboratorio y año, que es como se cita un caso ante una
   * autoridad sanitaria. La colisión se detecta y se reintenta una vez porque el
   * correlativo se calcula por conteo y dos altas simultáneas podrían coincidir.
   */
  private async nextCaseCode(
    tx: EntityManager,
    pharmaLabId: string,
  ): Promise<string> {
    const year = new Date().getUTCFullYear();
    const count = await this.repo.countReports(tx, pharmaLabId);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = `PV-${year}-${String(count + 1 + attempt).padStart(5, '0')}`;
      const clash = await this.repo.findReportByCaseCode(
        tx,
        pharmaLabId,
        candidate,
      );
      if (!clash) return candidate;
    }
    throw new ConflictException('No se pudo asignar un código de caso libre', {
      pharmaLabId,
    });
  }

  private async requireReport(
    tx: EntityManager,
    pharmaLabId: string,
    reportId: string,
  ): Promise<PharmacovigilanceReports> {
    const report = await this.repo.findReport(tx, reportId);
    if (!report || report.pharmaLabId !== pharmaLabId) {
      throw new ResourceNotFoundException(
        'Reporte de farmacovigilancia no encontrado en el laboratorio',
        { pharmaLabId, reportId },
      );
    }
    return report;
  }
}
