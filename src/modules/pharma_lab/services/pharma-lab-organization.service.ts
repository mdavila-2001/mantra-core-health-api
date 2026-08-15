import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { Tenants } from '../../directory/entities';
import { AuditTrailService } from '../../audit/services/audit-trail.service';
import {
  CreatePharmaLabDto,
  LinkStaffDto,
  UnlinkDto,
  UpdatePharmaLabDto,
  UpdateStaffPermissionsDto,
  CreatedResourceDto,
  TransitionResultDto,
} from '../dto';
import { OrganizationRepository, VisitorsRepository } from '../repositories';
import { PHL } from '../pharma_lab.concepts';
import { PharmaLabAccessService } from './pharma-lab-access.service';
import type {
  PharmaLabLinkEvents,
  PharmaLabStaff,
  PharmaLabs,
} from '../entities';

/**
 * UC-17-01 a UC-17-05: organización laboratorio farmacéutico y su personal.
 *
 * El perfil institucional, las sedes, la contabilidad, las publicaciones y las
 * encuestas generales NO se reimplementan acá: viven en `directory`,
 * `accounting` y `community`, y este servicio se limita a lo que la spec pide
 * *además* de eso para el giro farmacéutico.
 */
@Injectable()
export class PharmaLabOrganizationService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param repo - Repositorio del laboratorio y su personal.
   * @param visitorsRepo - Repositorio de visitadores.
   * @param access - Comprobaciones de vinculación y estado.
   * @param audit - Cadena WORM de auditoría.
   * @param logger - Registro estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: OrganizationRepository,
    private readonly visitorsRepo: VisitorsRepository,
    private readonly access: PharmaLabAccessService,
    private readonly audit: AuditTrailService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PharmaLabOrganizationService.name);
  }

  /**
   * UC-17-01: registra una organización de tipo laboratorio farmacéutico.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Identificador del laboratorio creado.
   * @throws ResourceNotFoundException si la organización del directorio no existe.
   * @throws ConflictException si esa organización ya es un laboratorio.
   */
  async createLab(
    dto: CreatePharmaLabDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.em.transactional(async (tx) => {
      const tenant = await tx.findOne(Tenants, { id: dto.tenantId });
      if (!tenant) {
        throw new ResourceNotFoundException('Organización no encontrada', {
          tenantId: dto.tenantId,
        });
      }
      const clash = await this.repo.findLabByTenant(tx, dto.tenantId);
      if (clash) {
        throw new ConflictException(
          'La organización ya está registrada como laboratorio',
          { tenantId: dto.tenantId },
        );
      }

      const lab = this.repo.createLab(tx, {
        tenantId: dto.tenantId,
        labTypeConceptId: dto.labTypeConceptId,
        legalName: dto.legalName,
        tradeName: dto.tradeName,
        taxId: dto.taxId,
        description: dto.description,
        researchAreas: dto.researchAreas,
        logoUrl: dto.logoUrl,
        statusConceptId: PHL.LAB_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'PHARMA_LAB_CREATED',
        entity: 'pharma_labs',
        entityId: lab.id,
        tenantId: dto.tenantId,
      });
      this.logger.info(
        { operation: 'pharma_lab.create', pharmaLabId: lab.id },
        'Pharma lab registered',
      );
      return { id: lab.id };
    });
  }

  /**
   * UC-17-02: actualiza el perfil institucional.
   *
   * @param pharmaLabId - Laboratorio.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Identificador y estado resultante.
   * @throws ResourceNotFoundException si el laboratorio no existe.
   */
  async updateLab(
    pharmaLabId: string,
    dto: UpdatePharmaLabDto,
    actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.em.transactional(async (tx) => {
      const lab = await this.access.requireLab(tx, pharmaLabId);
      if (dto.tradeName !== undefined) lab.tradeName = dto.tradeName;
      if (dto.taxId !== undefined) lab.taxId = dto.taxId;
      if (dto.description !== undefined) lab.description = dto.description;
      if (dto.researchAreas !== undefined)
        lab.researchAreas = dto.researchAreas;
      if (dto.logoUrl !== undefined) lab.logoUrl = dto.logoUrl;
      if (dto.statusConceptId !== undefined) {
        lab.statusConceptId = dto.statusConceptId;
      }
      touch(lab, actor.id);
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'PHARMA_LAB_UPDATED',
        entity: 'pharma_labs',
        entityId: lab.id,
        tenantId: lab.tenantId,
      });
      return { id: lab.id, statusConceptId: lab.statusConceptId };
    });
  }

  /**
   * Lee el laboratorio.
   *
   * @param pharmaLabId - Laboratorio.
   * @returns El laboratorio.
   * @throws ResourceNotFoundException si no existe.
   */
  async getLab(pharmaLabId: string): Promise<PharmaLabs> {
    return this.access.requireLab(this.em, pharmaLabId);
  }

  /**
   * Lista los laboratorios registrados.
   *
   * @returns Laboratorios ordenados por razón social.
   */
  listLabs(): Promise<PharmaLabs[]> {
    return this.repo.listLabs(this.em);
  }

  /**
   * UC-17-03: vincula un colaborador al laboratorio.
   *
   * @param pharmaLabId - Laboratorio.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Identificador de la ficha de personal creada.
   * @throws ConflictException si la cuenta ya es personal activo del laboratorio.
   */
  async linkStaff(
    pharmaLabId: string,
    dto: LinkStaffDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.em.transactional(async (tx) => {
      const lab = await this.access.requireActiveLab(tx, pharmaLabId);
      const existing = await this.repo.findStaffByUser(
        tx,
        pharmaLabId,
        dto.userId,
      );
      if (existing && existing.statusConceptId === PHL.LINK_ACTIVE) {
        throw new ConflictException(
          'La cuenta ya está vinculada al laboratorio',
          { pharmaLabId, userId: dto.userId },
        );
      }

      const staff = this.repo.createStaff(tx, {
        pharmaLabId,
        userId: dto.userId,
        staffTypeConceptId: dto.staffTypeConceptId,
        roleCode: dto.roleCode,
        position: dto.position,
        area: dto.area,
        branchId: dto.branchId,
        workSchedule: dto.workSchedule,
        hiredOn: dto.hiredOn,
        permissions: dto.permissions ?? [],
        credentialVerificationConceptId: PHL.VERIFICATION_PENDING,
        statusConceptId: PHL.LINK_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.repo.appendLinkEvent(tx, {
        pharmaLabId,
        staffId: staff.id,
        subjectUserId: dto.userId,
        eventTypeConceptId: PHL.LINK_EVENT_LINKED,
        newPermissions: dto.permissions ?? [],
        actorUserId: actor.id,
      });
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'PHARMA_LAB_STAFF_LINKED',
        entity: 'pharma_lab_staff',
        entityId: staff.id,
        tenantId: lab.tenantId,
      });
      return { id: staff.id };
    });
  }

  /**
   * UC-17-04: cambia los permisos de un colaborador y lo deja en la bitácora.
   *
   * @param pharmaLabId - Laboratorio.
   * @param staffId - Ficha de personal.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Identificador y estado resultante.
   * @throws ResourceNotFoundException si la ficha no existe en ese laboratorio.
   */
  async updateStaffPermissions(
    pharmaLabId: string,
    staffId: string,
    dto: UpdateStaffPermissionsDto,
    actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.em.transactional(async (tx) => {
      const lab = await this.access.requireLab(tx, pharmaLabId);
      const staff = await this.requireStaff(tx, pharmaLabId, staffId);
      const previous = staff.permissions ?? [];

      staff.permissions = dto.permissions;
      touch(staff, actor.id);

      this.repo.appendLinkEvent(tx, {
        pharmaLabId,
        staffId: staff.id,
        subjectUserId: staff.userId,
        eventTypeConceptId: PHL.LINK_EVENT_PERMISSIONS_CHANGED,
        reason: dto.reason,
        previousPermissions: previous,
        newPermissions: dto.permissions,
        actorUserId: actor.id,
      });
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'PHARMA_LAB_STAFF_PERMISSIONS_CHANGED',
        entity: 'pharma_lab_staff',
        entityId: staff.id,
        tenantId: lab.tenantId,
      });
      return { id: staff.id, statusConceptId: staff.statusConceptId };
    });
  }

  /**
   * UC-17-05: desvincula a un colaborador.
   *
   * Si además era visitador, la desvinculación del personal **no** basta: la
   * ficha de visitador tiene su propio caso de uso porque arrastra revocación de
   * sesiones y cancelación de visitas. Acá se corta la vinculación laboral y se
   * deja constancia; el servicio de visitadores es el que apaga los accesos.
   *
   * @param pharmaLabId - Laboratorio.
   * @param staffId - Ficha de personal.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Identificador y estado resultante.
   */
  async unlinkStaff(
    pharmaLabId: string,
    staffId: string,
    dto: UnlinkDto,
    actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.em.transactional(async (tx) => {
      const lab = await this.access.requireLab(tx, pharmaLabId);
      const staff = await this.requireStaff(tx, pharmaLabId, staffId);

      staff.statusConceptId = PHL.LINK_TERMINATED;
      staff.endedOn = dto.effectiveOn ?? new Date().toISOString().slice(0, 10);
      touch(staff, actor.id);

      this.repo.appendLinkEvent(tx, {
        pharmaLabId,
        staffId: staff.id,
        subjectUserId: staff.userId,
        eventTypeConceptId: PHL.LINK_EVENT_UNLINKED,
        reason: dto.reason,
        previousPermissions: staff.permissions ?? [],
        newPermissions: [],
        actorUserId: actor.id,
      });
      staff.permissions = [];
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'PHARMA_LAB_STAFF_UNLINKED',
        entity: 'pharma_lab_staff',
        entityId: staff.id,
        tenantId: lab.tenantId,
      });
      return { id: staff.id, statusConceptId: staff.statusConceptId };
    });
  }

  /**
   * Lista el personal del laboratorio.
   *
   * @param pharmaLabId - Laboratorio.
   * @returns Personal ordenado por fecha de ingreso descendente.
   */
  async listStaff(pharmaLabId: string): Promise<PharmaLabStaff[]> {
    await this.access.requireLab(this.em, pharmaLabId);
    return this.repo.listStaff(this.em, pharmaLabId);
  }

  /**
   * Lista la bitácora de vinculaciones y permisos del laboratorio (spec 5288).
   *
   * @param pharmaLabId - Laboratorio.
   * @returns Eventos del más reciente al más antiguo.
   */
  async listLinkEvents(pharmaLabId: string): Promise<PharmaLabLinkEvents[]> {
    await this.access.requireLab(this.em, pharmaLabId);
    return this.repo.listLinkEvents(this.em, pharmaLabId);
  }

  /**
   * Cuenta las cuentas de administración del laboratorio, usadas como
   * destinatarias de las notificaciones institucionales.
   *
   * @param tx - Transacción activa.
   * @param pharmaLabId - Laboratorio.
   * @returns Cuentas del personal con vinculación activa.
   */
  async listActiveStaffUserIds(
    tx: EntityManager,
    pharmaLabId: string,
  ): Promise<string[]> {
    const staff = await this.repo.listStaff(tx, pharmaLabId);
    return staff
      .filter((row) => row.statusConceptId === PHL.LINK_ACTIVE)
      .map((row) => row.userId);
  }

  private async requireStaff(
    tx: EntityManager,
    pharmaLabId: string,
    staffId: string,
  ): Promise<PharmaLabStaff> {
    const staff = await this.repo.findStaff(tx, staffId);
    if (!staff || staff.pharmaLabId !== pharmaLabId) {
      throw new ResourceNotFoundException(
        'Ficha de personal no encontrada en el laboratorio',
        { pharmaLabId, staffId },
      );
    }
    return staff;
  }

  /**
   * Indica si una cuenta es visitador del laboratorio, para que el llamador
   * decida si además debe apagar sus accesos.
   *
   * @param tx - Transacción activa.
   * @param userId - Cuenta.
   * @returns El identificador del visitador, o `null`.
   */
  async findVisitorIdOfUser(
    tx: EntityManager,
    userId: string,
  ): Promise<string | null> {
    const visitor = await this.visitorsRepo.findVisitorByUser(tx, userId);
    return visitor?.id ?? null;
  }
}
