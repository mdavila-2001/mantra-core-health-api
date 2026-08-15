import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { Users } from '../../iam/entities';
import { AuditTrailService } from '../../audit/services/audit-trail.service';
import {
  CreateMedicalVisitorDto,
  CreatedResourceDto,
  RelinkMedicalVisitorDto,
  SetVisitorProductsDto,
  SetVisitorSpecialtiesDto,
  TransitionResultDto,
  UnlinkDto,
  UnlinkResultDto,
  VerifyMedicalVisitorDto,
} from '../dto';
import type { MedicalVisitors } from '../entities';
import {
  CatalogRepository,
  OrganizationRepository,
  VisitorsRepository,
  VisitsRepository,
} from '../repositories';
import { PHL } from '../pharma_lab.concepts';
import { PharmaLabAccessService } from './pharma-lab-access.service';
import { PharmaLabNotificationsService } from './pharma-lab-notifications.service';

/**
 * UC-17-06 a UC-17-10: ciclo de vida del visitador médico y su dependencia
 * obligatoria del laboratorio (spec 5290-5341, 5736-5738).
 *
 * La desvinculación es el caso de uso más cargado del carril a propósito: la
 * spec enumera seis consecuencias (cuenta desactivada, sesiones cerradas,
 * permisos revocados, no puede iniciar sesión, no puede solicitar visitas, deja
 * de representar al laboratorio) y las seis ocurren en **una sola transacción**.
 * Si cualquiera falla, ninguna queda aplicada: un visitador «desvinculado» con
 * la sesión viva es peor que uno que sigue vinculado, porque nadie lo está
 * mirando.
 */
@Injectable()
export class MedicalVisitorsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param repo - Repositorio de visitadores.
   * @param orgRepo - Repositorio del laboratorio y su personal.
   * @param visitsRepo - Repositorio de visitas, para cancelar las pendientes.
   * @param catalog - Repositorio del catálogo, para validar productos.
   * @param access - Comprobaciones de vinculación y estado.
   * @param notifications - Buzón de avisos dentro del producto.
   * @param audit - Cadena WORM de auditoría.
   * @param logger - Registro estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: VisitorsRepository,
    private readonly orgRepo: OrganizationRepository,
    private readonly visitsRepo: VisitsRepository,
    private readonly catalog: CatalogRepository,
    private readonly access: PharmaLabAccessService,
    private readonly notifications: PharmaLabNotificationsService,
    private readonly audit: AuditTrailService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MedicalVisitorsService.name);
  }

  /**
   * UC-17-06: registra un visitador desde la organización.
   *
   * @param pharmaLabId - Laboratorio del que dependerá la cuenta.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Identificador del visitador creado.
   * @throws PreconditionFailedException si el laboratorio no está activo.
   * @throws ConflictException si la cuenta ya es visitador o el código interno
   *   está tomado.
   */
  async createVisitor(
    pharmaLabId: string,
    dto: CreateMedicalVisitorDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.em.transactional(async (tx) => {
      const lab = await this.access.requireActiveLab(tx, pharmaLabId);

      const user = await tx.findOne(Users, { id: dto.userId });
      if (!user) {
        throw new ResourceNotFoundException('Cuenta no encontrada', {
          userId: dto.userId,
        });
      }
      const already = await this.repo.findVisitorByUser(tx, dto.userId);
      if (already) {
        throw new ConflictException(
          'La cuenta ya está registrada como visitador',
          { userId: dto.userId, medicalVisitorId: already.id },
        );
      }
      const codeClash = await this.repo.findVisitorByCode(
        tx,
        pharmaLabId,
        dto.internalCode,
      );
      if (codeClash) {
        throw new ConflictException(
          'El código interno ya está en uso en el laboratorio',
          { pharmaLabId, internalCode: dto.internalCode },
        );
      }

      const visitor = this.repo.createVisitor(tx, {
        pharmaLabId,
        userId: dto.userId,
        fullName: dto.fullName,
        internalCode: dto.internalCode,
        photoUrl: dto.photoUrl,
        position: dto.position,
        supervisorStaffId: dto.supervisorStaffId,
        branchId: dto.branchId,
        region: dto.region,
        commercialArea: dto.commercialArea,
        assignedZone: dto.assignedZone,
        startedOn: dto.startedOn,
        endedOn: dto.endedOn,
        identityVerificationConceptId: PHL.VERIFICATION_PENDING,
        contractVerificationConceptId: PHL.VERIFICATION_PENDING,
        credentialVerificationConceptId: PHL.VERIFICATION_PENDING,
        statusConceptId: PHL.LINK_ACTIVE,
        publiclyListed: true,
        actorUserId: actor.id,
      });
      await tx.flush();

      if (dto.specialtyConceptIds?.length) {
        await this.repo.replaceSpecialties(
          tx,
          visitor.id,
          dto.specialtyConceptIds,
          actor.id,
        );
      }
      if (dto.pharmaProductIds?.length) {
        await this.assertProductsBelongToLab(
          tx,
          pharmaLabId,
          dto.pharmaProductIds,
        );
        await this.repo.replaceProducts(
          tx,
          visitor.id,
          dto.pharmaProductIds,
          dto.startedOn,
          actor.id,
        );
      }

      this.orgRepo.appendLinkEvent(tx, {
        pharmaLabId,
        medicalVisitorId: visitor.id,
        subjectUserId: dto.userId,
        eventTypeConceptId: PHL.LINK_EVENT_LINKED,
        actorUserId: actor.id,
      });
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'MEDICAL_VISITOR_LINKED',
        entity: 'medical_visitors',
        entityId: visitor.id,
        tenantId: lab.tenantId,
      });
      this.logger.info(
        {
          operation: 'pharma_lab.visitor.create',
          medicalVisitorId: visitor.id,
        },
        'Medical visitor registered',
      );
      return { id: visitor.id };
    });
  }

  /**
   * UC-17-07: registra el resultado de las verificaciones exigidas.
   *
   * @param pharmaLabId - Laboratorio.
   * @param medicalVisitorId - Visitador.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Identificador y estado resultante.
   */
  async verifyVisitor(
    pharmaLabId: string,
    medicalVisitorId: string,
    dto: VerifyMedicalVisitorDto,
    actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.em.transactional(async (tx) => {
      const lab = await this.access.requireLab(tx, pharmaLabId);
      const visitor = await this.access.requireVisitorOfLab(
        tx,
        pharmaLabId,
        medicalVisitorId,
      );
      if (dto.identityVerificationConceptId) {
        visitor.identityVerificationConceptId =
          dto.identityVerificationConceptId;
      }
      if (dto.contractVerificationConceptId) {
        visitor.contractVerificationConceptId =
          dto.contractVerificationConceptId;
      }
      if (dto.credentialVerificationConceptId) {
        visitor.credentialVerificationConceptId =
          dto.credentialVerificationConceptId;
      }
      touch(visitor, actor.id);
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'MEDICAL_VISITOR_VERIFICATION_RECORDED',
        entity: 'medical_visitors',
        entityId: visitor.id,
        tenantId: lab.tenantId,
      });
      return { id: visitor.id, statusConceptId: visitor.statusConceptId };
    });
  }

  /**
   * UC-17-09: fija los productos que el visitador puede representar.
   *
   * @param pharmaLabId - Laboratorio.
   * @param medicalVisitorId - Visitador.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Identificador y estado resultante.
   * @throws PreconditionFailedException si algún producto no es del laboratorio.
   */
  async setProducts(
    pharmaLabId: string,
    medicalVisitorId: string,
    dto: SetVisitorProductsDto,
    actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.em.transactional(async (tx) => {
      const lab = await this.access.requireLab(tx, pharmaLabId);
      const visitor = await this.access.requireVisitorOfLab(
        tx,
        pharmaLabId,
        medicalVisitorId,
      );
      await this.assertProductsBelongToLab(
        tx,
        pharmaLabId,
        dto.pharmaProductIds,
      );
      await this.repo.replaceProducts(
        tx,
        visitor.id,
        dto.pharmaProductIds,
        new Date().toISOString().slice(0, 10),
        actor.id,
      );
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'MEDICAL_VISITOR_PRODUCTS_SET',
        entity: 'medical_visitors',
        entityId: visitor.id,
        tenantId: lab.tenantId,
      });
      return { id: visitor.id, statusConceptId: visitor.statusConceptId };
    });
  }

  /**
   * UC-17-10: fija las especialidades que el visitador puede visitar.
   *
   * @param pharmaLabId - Laboratorio.
   * @param medicalVisitorId - Visitador.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Identificador y estado resultante.
   */
  async setSpecialties(
    pharmaLabId: string,
    medicalVisitorId: string,
    dto: SetVisitorSpecialtiesDto,
    actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.em.transactional(async (tx) => {
      const lab = await this.access.requireLab(tx, pharmaLabId);
      const visitor = await this.access.requireVisitorOfLab(
        tx,
        pharmaLabId,
        medicalVisitorId,
      );
      await this.repo.replaceSpecialties(
        tx,
        visitor.id,
        dto.specialtyConceptIds,
        actor.id,
      );
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'MEDICAL_VISITOR_SPECIALTIES_SET',
        entity: 'medical_visitors',
        entityId: visitor.id,
        tenantId: lab.tenantId,
      });
      return { id: visitor.id, statusConceptId: visitor.statusConceptId };
    });
  }

  /**
   * UC-17-08: desvincula al visitador y apaga todos sus accesos.
   *
   * Aplica, en una sola transacción, las seis consecuencias que la spec exige
   * (5324-5331) y conserva la fila para auditoría (5332-5339). No hay borrado
   * físico y no puede haberlo: existen visitas, calificaciones y registros de
   * actividad que responden por él.
   *
   * @param pharmaLabId - Laboratorio.
   * @param medicalVisitorId - Visitador.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Estado resultante y qué se revocó.
   */
  async unlinkVisitor(
    pharmaLabId: string,
    medicalVisitorId: string,
    dto: UnlinkDto,
    actor: AuthenticatedUser,
  ): Promise<UnlinkResultDto> {
    return this.em.transactional(async (tx) => {
      const lab = await this.access.requireLab(tx, pharmaLabId);
      const visitor = await this.access.requireVisitorOfLab(
        tx,
        pharmaLabId,
        medicalVisitorId,
      );
      if (visitor.statusConceptId === PHL.LINK_TERMINATED) {
        throw new ConflictException('El visitador ya está desvinculado', {
          medicalVisitorId,
        });
      }

      const now = new Date();
      // 1) La vinculación termina y el perfil deja de mostrarse públicamente.
      visitor.statusConceptId = PHL.LINK_TERMINATED;
      visitor.publiclyListed = false;
      visitor.unlinkedAt = now;
      visitor.unlinkReason = dto.reason;
      visitor.endedOn = dto.effectiveOn ?? now.toISOString().slice(0, 10);
      touch(visitor, actor.id);

      // 2) Los productos autorizados dejan de estarlo: ya no representa al
      //    laboratorio.
      await this.repo.replaceProducts(
        tx,
        visitor.id,
        [],
        visitor.endedOn,
        actor.id,
      );

      // 3) La ficha de personal correspondiente, si la hay, también se cierra.
      const staff = await this.orgRepo.findStaffByUser(
        tx,
        pharmaLabId,
        visitor.userId,
      );
      if (staff && staff.statusConceptId === PHL.LINK_ACTIVE) {
        staff.statusConceptId = PHL.LINK_TERMINATED;
        staff.endedOn = visitor.endedOn;
        staff.permissions = [];
        touch(staff, actor.id);
      }

      // 4) La cuenta queda desactivada: `iam` exige `USER_ACTIVE` para autenticar,
      //    así que esto es literalmente «no podrá iniciar sesión».
      const user = await tx.findOne(Users, { id: visitor.userId });
      if (user) {
        user.statusConceptId = CONCEPTS.USER_LOCKED;
        touch(user, actor.id);
      }

      // 5) Sesiones y tokens de refresco vivos, revocados.
      const revokedSessions = await this.repo.revokeSessions(
        tx,
        visitor.userId,
      );
      const revokedRefreshTokens = await this.repo.revokeRefreshTokens(
        tx,
        visitor.userId,
      );

      // 6) No podrá solicitar nuevas visitas, y las que tenía vivas se cancelan
      //    avisando al doctor: dejarlas confirmadas citaría a un doctor con
      //    alguien que ya no puede presentarse.
      const openRequests = await this.visitsRepo.listOpenRequestsOfVisitor(
        tx,
        visitor.id,
      );
      for (const request of openRequests) {
        const previous = request.statusConceptId;
        request.statusConceptId = PHL.VISIT_CANCELLED_BY_VISITOR;
        request.closedAt = now;
        touch(request, actor.id);
        this.visitsRepo.appendRequestEvent(tx, {
          visitRequestId: request.id,
          actionConceptId: PHL.LINK_EVENT_UNLINKED,
          previousStatusConceptId: previous,
          newStatusConceptId: request.statusConceptId,
          note: `Visitador desvinculado: ${dto.reason}`,
          actorUserId: actor.id,
          createdByUserId: actor.id,
        });
        this.notifications.notify(
          tx,
          {
            recipientUserId: request.doctorUserId,
            templateCode: 'PHARMA_LAB_VISIT_CANCELLED_BY_UNLINK',
            subject: 'Visita médica cancelada',
            bodyText:
              'El visitador fue desvinculado de su laboratorio y la visita quedó cancelada.',
            relatedResourceType: 'visit_request',
            relatedResourceId: request.id,
            tenantId: request.doctorTenantId,
          },
          actor.id,
        );
      }

      this.orgRepo.appendLinkEvent(tx, {
        pharmaLabId,
        medicalVisitorId: visitor.id,
        staffId: staff?.id,
        subjectUserId: visitor.userId,
        eventTypeConceptId: PHL.LINK_EVENT_UNLINKED,
        reason: dto.reason,
        newPermissions: [],
        revokedSessionCount: revokedSessions,
        actorUserId: actor.id,
      });
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'MEDICAL_VISITOR_UNLINKED',
        entity: 'medical_visitors',
        entityId: visitor.id,
        tenantId: lab.tenantId,
      });
      this.logger.info(
        {
          operation: 'pharma_lab.visitor.unlink',
          medicalVisitorId: visitor.id,
          revokedSessions,
          revokedRefreshTokens,
          cancelledVisitRequests: openRequests.length,
        },
        'Medical visitor unlinked and access revoked',
      );

      return {
        id: visitor.id,
        statusConceptId: visitor.statusConceptId,
        revokedSessions,
        revokedRefreshTokens,
        cancelledVisitRequests: openRequests.length,
      };
    });
  }

  /**
   * Revinculación autorizada de un visitador desvinculado (spec 5340).
   *
   * No es «deshacer» la desvinculación: es una vinculación nueva, con su propia
   * autorización, que reabre la cuenta y deja los permisos anteriores fuera. Los
   * productos autorizados hay que volver a concederlos explícitamente.
   *
   * @param pharmaLabId - Laboratorio.
   * @param medicalVisitorId - Visitador.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Identificador y estado resultante.
   * @throws ConflictException si el visitador no estaba desvinculado.
   */
  async relinkVisitor(
    pharmaLabId: string,
    medicalVisitorId: string,
    dto: RelinkMedicalVisitorDto,
    actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.em.transactional(async (tx) => {
      const lab = await this.access.requireActiveLab(tx, pharmaLabId);
      const visitor = await this.access.requireVisitorOfLab(
        tx,
        pharmaLabId,
        medicalVisitorId,
      );
      if (visitor.statusConceptId === PHL.LINK_ACTIVE) {
        throw new ConflictException('El visitador ya está vinculado', {
          medicalVisitorId,
        });
      }

      visitor.statusConceptId = PHL.LINK_ACTIVE;
      visitor.publiclyListed = true;
      visitor.startedOn = dto.startedOn;
      visitor.endedOn = undefined;
      visitor.unlinkedAt = undefined;
      visitor.unlinkReason = undefined;
      // La verificación vuelve a exigirse: la anterior respaldaba un contrato
      // que ya no existe.
      visitor.contractVerificationConceptId = PHL.VERIFICATION_PENDING;
      touch(visitor, actor.id);

      const user = await tx.findOne(Users, { id: visitor.userId });
      if (user && user.statusConceptId === CONCEPTS.USER_LOCKED) {
        user.statusConceptId = CONCEPTS.USER_ACTIVE;
        touch(user, actor.id);
      }

      this.orgRepo.appendLinkEvent(tx, {
        pharmaLabId,
        medicalVisitorId: visitor.id,
        subjectUserId: visitor.userId,
        eventTypeConceptId: PHL.LINK_EVENT_REACTIVATED,
        reason: dto.authorization,
        actorUserId: actor.id,
      });
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'MEDICAL_VISITOR_RELINKED',
        entity: 'medical_visitors',
        entityId: visitor.id,
        tenantId: lab.tenantId,
      });
      return { id: visitor.id, statusConceptId: visitor.statusConceptId };
    });
  }

  /**
   * Lista los visitadores de un laboratorio.
   *
   * @param pharmaLabId - Laboratorio.
   * @returns Visitadores ordenados por nombre.
   */
  async listVisitors(pharmaLabId: string): Promise<MedicalVisitors[]> {
    await this.access.requireLab(this.em, pharmaLabId);
    return this.repo.listVisitors(this.em, pharmaLabId);
  }

  /**
   * Lee la ficha del visitador que corresponde a la sesión.
   *
   * @param actor - Usuario autenticado.
   * @returns La ficha del visitador.
   * @throws ResourceNotFoundException si la cuenta no es de un visitador.
   */
  async getOwnProfile(actor: AuthenticatedUser): Promise<MedicalVisitors> {
    const visitor = await this.repo.findVisitorByUser(this.em, actor.id);
    if (!visitor) {
      throw new ResourceNotFoundException(
        'La cuenta no corresponde a un visitador médico',
        { userId: actor.id },
      );
    }
    return visitor;
  }

  private async assertProductsBelongToLab(
    tx: EntityManager,
    pharmaLabId: string,
    productIds: readonly string[],
  ): Promise<void> {
    const products = await this.catalog.findProductsByIds(tx, productIds);
    const foreign = products.filter(
      (product) => product.pharmaLabId !== pharmaLabId,
    );
    if (products.length !== new Set(productIds).size || foreign.length > 0) {
      throw new PreconditionFailedException(
        'Algún producto no pertenece al catálogo del laboratorio',
        { pharmaLabId },
      );
    }
  }
}
