import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  UnauthorizedException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { PracticeTenantLookupService } from '../../practice/services';
import { ServiceCatalogRepository } from '../../billing/repositories';
import {
  HealthPractitionerProfilesRepository,
  PatientProfilesRepository,
} from '../../profiles/repositories';
import { ConditionsRepository } from '../../clinical/repositories';
import { ClinicalReadService } from '../../clinical/services';
import { CatalogConcepts } from '../../terminology/entities';
import {
  MedicalGroupMembersRepository,
  MedicalGroupsRepository,
} from '../repositories';
import {
  MEDICAL_GROUP_STATUS,
  MedicalGroups,
} from '../entities/medical_groups.entity';
import {
  MEDICAL_GROUP_MEMBER_INVITATION_STATUS,
  MedicalGroupMembers,
} from '../entities/medical_group_members.entity';
import type {
  CreateMedicalGroupDto,
  MedicalGroupConditionOptionDto,
  MedicalGroupDto,
  MedicalGroupPageDto,
} from '../dto';

/** Ventana en la que el expediente admite notas del procedimiento (AC-21-18/19). */
const EXERCISE_NOTES_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** Tope por página cuando el cliente no pide uno. */
const DEFAULT_PAGE_SIZE = 25;

export type MedicalGroupTab = 'historico' | 'enviadas' | 'recibidas';

/**
 * Grupo médico (FT-21): un evento de equipo alrededor de un servicio médico,
 * con roster por cargo/función, pago acordado por cargo, y un ciclo de vida
 * propio (invitación → programada → cambio de horario → cierre inmutable).
 *
 * Ver `database/SQL/patches/2026-09-04_v426_medical_groups.sql` para el modelo
 * y el desvío declarado del proceso `.puml → SQL → BD → ORM`.
 */
@Injectable()
export class MedicalGroupsService {
  constructor(
    private readonly em: EntityManager,
    private readonly groupsRepo: MedicalGroupsRepository,
    private readonly membersRepo: MedicalGroupMembersRepository,
    private readonly serviceCatalogRepo: ServiceCatalogRepository,
    private readonly practiceTenantLookup: PracticeTenantLookupService,
    private readonly practitionerProfilesRepo: HealthPractitionerProfilesRepository,
    private readonly patientProfilesRepo: PatientProfilesRepository,
    private readonly conditionsRepo: ConditionsRepository,
    private readonly clinicalRead: ClinicalReadService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MedicalGroupsService.name);
  }

  /* ==================== creación ========================================= */

  async create(
    dto: CreateMedicalGroupDto,
    actor: AuthenticatedUser,
  ): Promise<MedicalGroupDto> {
    const requestingPractitionerId = this.requirePractitioner(actor);

    return this.em.transactional(async (tx) => {
      const service = await this.serviceCatalogRepo.findById(
        tx,
        dto.serviceCatalogId,
      );
      if (service === null || !service.isActive) {
        throw new ResourceNotFoundException('Servicio médico no encontrado', {
          serviceCatalogId: dto.serviceCatalogId,
        });
      }

      const propias =
        await this.practiceTenantLookup.findActivePracticeIdsForPractitioner(
          requestingPractitionerId,
        );
      if (!propias.includes(service.practiceId)) {
        // Mismo criterio que `BillingServiceCatalogService.assertPuedeEditar`:
        // un servicio de otra práctica responde 404, nunca 403.
        throw new ResourceNotFoundException('Servicio médico no encontrado', {
          serviceCatalogId: dto.serviceCatalogId,
        });
      }
      const tenantId = await this.practiceTenantLookup.findTenantOfPractice(
        service.practiceId,
      );
      if (tenantId === null) {
        throw new ResourceNotFoundException('Servicio médico no encontrado', {
          serviceCatalogId: dto.serviceCatalogId,
        });
      }

      if (dto.conditionId !== undefined && dto.patientProfileId === undefined) {
        throw new PreconditionFailedException(
          'Seleccioná primero el paciente para poder elegir un diagnóstico',
        );
      }

      if (dto.patientProfileId !== undefined) {
        const patient = await this.patientProfilesRepo.findById(
          tx,
          dto.patientProfileId,
        );
        if (patient === null) {
          throw new ResourceNotFoundException('Paciente no encontrado', {
            patientProfileId: dto.patientProfileId,
          });
        }
        if (dto.conditionId !== undefined) {
          // El mismo gate que `/clinical/patients/:id/summary`: el solicitante
          // tiene que poder leer la historia de este paciente para poder
          // referenciar uno de sus diagnósticos (AC-21-06/07).
          await this.clinicalRead.assertPuedeLeerHistoria(
            dto.patientProfileId,
            actor,
          );
          const condition = await this.conditionsRepo.findById(
            tx,
            dto.conditionId,
          );
          if (
            condition === null ||
            condition.patientProfileId !== dto.patientProfileId
          ) {
            throw new ResourceNotFoundException('Diagnóstico no encontrado', {
              conditionId: dto.conditionId,
            });
          }
        }
      }

      const seenPractitioners = new Set<string>([requestingPractitionerId]);
      for (const member of dto.members) {
        if (seenPractitioners.has(member.practitionerProfileId)) {
          throw new ConflictException(
            'Un mismo profesional no puede repetirse (ni ser también el creador)',
            { practitionerProfileId: member.practitionerProfileId },
          );
        }
        seenPractitioners.add(member.practitionerProfileId);
        const invited = await this.practitionerProfilesRepo.findById(
          tx,
          member.practitionerProfileId,
        );
        if (invited === null) {
          throw new ResourceNotFoundException('Profesional no encontrado', {
            practitionerProfileId: member.practitionerProfileId,
          });
        }
      }

      // Términos y condiciones (AC-21-10/11/12/13): default del servicio +
      // adicionales del solicitante. `service.descriptionText` es lo más
      // cercano a un default hoy — `billing.service_catalog` todavía no
      // declara un campo de términos propio (ver known_gaps del carril).
      const termsParts = [
        service.descriptionText,
        dto.additionalTermsText,
      ].filter(
        (part): part is string => part !== undefined && part.trim().length > 0,
      );
      const termsText = termsParts.join('\n\n');

      const status =
        dto.members.length > 0
          ? MEDICAL_GROUP_STATUS.PENDING_TEAM
          : MEDICAL_GROUP_STATUS.SCHEDULED;

      const group = this.groupsRepo.create(tx, {
        tenantId,
        practiceId: service.practiceId,
        serviceCatalogId: service.id,
        requestingPractitionerId,
        patientProfileId: dto.patientProfileId,
        conditionId: dto.conditionId,
        scheduledAt: new Date(dto.scheduledAt),
        locationText: dto.locationText,
        notesText: dto.notesText,
        termsText,
        status,
        actorUserId: actor.id,
      });
      tx.persist(group);
      await tx.flush();

      // El creador es, siempre, un miembro `ACCEPTED` — sin pago propio: la
      // retribución que describe el requisito es "por cargo/función dentro
      // del grupo", y el creador organiza, no ocupa un cargo pago (decisión
      // registrada; ver known_gaps).
      this.membersRepo.create(tx, {
        groupId: group.id,
        practitionerProfileId: requestingPractitionerId,
        roleTitle: 'Responsable del grupo',
        agreedPaymentAmount: '0.00',
        isCreator: true,
        invitationStatus: MEDICAL_GROUP_MEMBER_INVITATION_STATUS.ACCEPTED,
        respondedAt: new Date(),
        actorUserId: actor.id,
      });

      for (const member of dto.members) {
        this.membersRepo.create(tx, {
          groupId: group.id,
          practitionerProfileId: member.practitionerProfileId,
          roleTitle: member.roleTitle,
          agreedPaymentAmount: member.agreedPaymentAmount,
          agreedPaymentCurrencyConceptId: member.agreedPaymentCurrencyConceptId,
          additionalTermsText: member.additionalTermsText,
          isCreator: false,
          invitationStatus: MEDICAL_GROUP_MEMBER_INVITATION_STATUS.PENDING,
          actorUserId: actor.id,
        });
      }
      await tx.flush();

      this.logger.info(
        { operation: 'medical-groups.create', groupId: group.id },
        'Medical group created',
      );
      return this.toDto(
        group,
        await this.membersRepo.findByGroup(tx, group.id),
      );
    });
  }

  /* ==================== lectura =========================================== */

  async findOne(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<MedicalGroupDto> {
    const em = this.em.fork();
    const group = await this.groupsRepo.findById(em, id);
    if (group === null) {
      throw new ResourceNotFoundException('Grupo médico no encontrado', { id });
    }
    const members = await this.membersRepo.findByGroup(em, id);
    this.assertActorSeesGroup(group, members, actor);
    await this.closeIfExpired(em, group);
    return this.toDto(group, members);
  }

  async list(
    tab: MedicalGroupTab,
    actor: AuthenticatedUser,
    options: { cursor?: string; limit?: number },
  ): Promise<MedicalGroupPageDto> {
    const practitionerProfileId = this.requirePractitioner(actor);
    const em = this.em.fork();
    const limit = options.limit ?? DEFAULT_PAGE_SIZE;
    const afterCreatedAt = options.cursor
      ? new Date(Buffer.from(options.cursor, 'base64url').toString('utf8'))
      : undefined;

    const ids = await this.idsForTab(em, tab, practitionerProfileId);
    const rows = await this.groupsRepo.findByIdsPage(
      em,
      ids,
      limit + 1,
      afterCreatedAt,
    );
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const groupIds = page.map((row) => row.id);
    const members = await this.membersRepo.findManyByGroups(em, groupIds);
    const membersByGroup = new Map<string, MedicalGroupMembers[]>();
    for (const member of members) {
      const list = membersByGroup.get(member.groupId) ?? [];
      list.push(member);
      membersByGroup.set(member.groupId, list);
    }

    const last = page.at(-1);
    return {
      items: page.map((row) => {
        const rowMembers = membersByGroup.get(row.id) ?? [];
        return {
          id: row.id,
          serviceCatalogId: row.serviceCatalogId,
          scheduledAt: row.scheduledAt,
          locationText: row.locationText,
          status: row.status,
          isCreator: row.requestingPractitionerId === practitionerProfileId,
          patientProfileId: row.patientProfileId,
          pendingMembersCount: rowMembers.filter(
            (m) => !m.isCreator && m.invitationStatus === 'PENDING',
          ).length,
        };
      }),
      nextCursor:
        hasMore && last
          ? Buffer.from(last.createdAt.toISOString(), 'utf8').toString(
              'base64url',
            )
          : null,
    };
  }

  private async idsForTab(
    em: EntityManager,
    tab: MedicalGroupTab,
    practitionerProfileId: string,
  ): Promise<string[]> {
    if (tab === 'recibidas') {
      return this.membersRepo.findGroupIdsByInvitee(
        em,
        practitionerProfileId,
        'PENDING',
      );
    }
    if (tab === 'enviadas') {
      const created = await this.groupsRepo.findIdsByRequester(
        em,
        practitionerProfileId,
      );
      return this.membersRepo.findGroupIdsWithPendingInvites(em, created);
    }
    // historico: los que creé, más los que acepté como miembro.
    const created = await this.groupsRepo.findIdsByRequester(
      em,
      practitionerProfileId,
    );
    const accepted = await this.membersRepo.findGroupIdsByInvitee(
      em,
      practitionerProfileId,
      'ACCEPTED',
    );
    return [...new Set([...created, ...accepted])];
  }

  /** El selector de diagnóstico del formulario (AC-21-06/07). */
  async listPatientConditions(
    patientProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<MedicalGroupConditionOptionDto[]> {
    const em = this.em.fork();
    await this.clinicalRead.assertPuedeLeerHistoria(patientProfileId, actor);
    const conditions = await this.conditionsRepo.findByPatient(
      em,
      patientProfileId,
      20,
    );
    if (conditions.length === 0) {
      return [];
    }
    const conceptIds = [...new Set(conditions.map((c) => c.codeConceptId))];
    const concepts = await em.find(CatalogConcepts, {
      id: { $in: conceptIds },
    });
    const byId = new Map(concepts.map((concept) => [concept.id, concept]));
    return conditions.map((condition, index) => {
      const concept = byId.get(condition.codeConceptId);
      return {
        id: condition.id,
        code: concept?.code ?? condition.codeConceptId,
        display:
          concept?.display ?? '(diagnóstico sin descripción en el catálogo)',
        onsetAt: condition.onsetAt,
        isMostRecent: index === 0,
      };
    });
  }

  /* ==================== solicitudes de invitación ========================= */

  async respondToInvitation(
    groupId: string,
    memberId: string,
    decision: 'ACCEPTED' | 'REJECTED',
    actor: AuthenticatedUser,
  ): Promise<MedicalGroupDto> {
    const practitionerProfileId = this.requirePractitioner(actor);
    return this.em.transactional(async (tx) => {
      const group = await this.groupsRepo.findById(tx, groupId);
      if (group === null) {
        throw new ResourceNotFoundException('Grupo médico no encontrado', {
          id: groupId,
        });
      }
      const member = await this.membersRepo.findById(tx, memberId);
      if (member === null || member.groupId !== groupId) {
        throw new ResourceNotFoundException('Solicitud no encontrada', {
          memberId,
        });
      }
      if (member.practitionerProfileId !== practitionerProfileId) {
        // Nunca 403: revela que la fila existe. Mismo criterio que el resto
        // del contrato — quien no es el invitado no distingue "no es tuya" de
        // "no existe".
        throw new ResourceNotFoundException('Solicitud no encontrada', {
          memberId,
        });
      }
      if (member.invitationStatus !== 'PENDING') {
        throw new PreconditionFailedException(
          'Esta solicitud ya fue respondida',
        );
      }

      member.invitationStatus = decision;
      member.respondedAt = new Date();
      touch(member, actor.id);

      if (
        decision === 'ACCEPTED' &&
        group.status === MEDICAL_GROUP_STATUS.PENDING_TEAM
      ) {
        const stillPending = await this.membersRepo.hasPendingInvites(
          tx,
          groupId,
        );
        if (!stillPending) {
          group.status = MEDICAL_GROUP_STATUS.SCHEDULED;
          touch(group, actor.id);
        }
      }
      await tx.flush();
      return this.toDto(group, await this.membersRepo.findByGroup(tx, groupId));
    });
  }

  /* ==================== cambio de horario ================================= */

  async requestReschedule(
    groupId: string,
    proposedAt: string,
    actor: AuthenticatedUser,
  ): Promise<MedicalGroupDto> {
    const practitionerProfileId = this.requirePractitioner(actor);
    return this.em.transactional(async (tx) => {
      const group = await this.groupsRepo.findById(tx, groupId);
      if (group === null) {
        throw new ResourceNotFoundException('Grupo médico no encontrado', {
          id: groupId,
        });
      }
      const members = await this.membersRepo.findByGroup(tx, groupId);
      this.assertActorIsActiveMember(group, members, practitionerProfileId);
      await this.closeIfExpired(tx, group);
      if (isClosedNow(group)) {
        throw new PreconditionFailedException(
          'El expediente ya está cerrado y es inmutable',
        );
      }
      if (group.status !== MEDICAL_GROUP_STATUS.SCHEDULED) {
        throw new PreconditionFailedException(
          'Sólo se puede solicitar cambio de horario sobre una cita programada y aún no realizada',
        );
      }
      const proposed = new Date(proposedAt);
      if (Number.isNaN(proposed.getTime())) {
        throw new PreconditionFailedException('Fecha propuesta inválida');
      }

      if (practitionerProfileId === group.requestingPractitionerId) {
        // El propio creador no tiene a quién pedirle aprobación: aplica el
        // cambio directo (decisión registrada — la fuente literal sólo
        // describe el caso en que OTRO integrante propone el cambio).
        group.scheduledAt = proposed;
        group.proposedRescheduleAt = undefined;
        group.proposedByPractitionerId = undefined;
      } else {
        group.status = MEDICAL_GROUP_STATUS.RESCHEDULE_PENDING;
        group.proposedRescheduleAt = proposed;
        group.proposedByPractitionerId = practitionerProfileId;
      }
      touch(group, actor.id);
      await tx.flush();
      return this.toDto(group, members);
    });
  }

  async respondToReschedule(
    groupId: string,
    decision: 'ACCEPTED' | 'REJECTED',
    actor: AuthenticatedUser,
  ): Promise<MedicalGroupDto> {
    const practitionerProfileId = this.requirePractitioner(actor);
    return this.em.transactional(async (tx) => {
      const group = await this.groupsRepo.findById(tx, groupId);
      if (group === null) {
        throw new ResourceNotFoundException('Grupo médico no encontrado', {
          id: groupId,
        });
      }
      if (group.requestingPractitionerId !== practitionerProfileId) {
        throw new UnauthorizedException(
          'Sólo quien creó la solicitud puede resolver el cambio de horario propuesto',
        );
      }
      if (group.status !== MEDICAL_GROUP_STATUS.RESCHEDULE_PENDING) {
        throw new PreconditionFailedException(
          'No hay ningún cambio de horario pendiente',
        );
      }
      if (decision === 'ACCEPTED' && group.proposedRescheduleAt) {
        group.scheduledAt = group.proposedRescheduleAt;
      }
      group.status = MEDICAL_GROUP_STATUS.SCHEDULED;
      group.proposedRescheduleAt = undefined;
      group.proposedByPractitionerId = undefined;
      touch(group, actor.id);
      await tx.flush();
      return this.toDto(group, await this.membersRepo.findByGroup(tx, groupId));
    });
  }

  /* ==================== notas del ejercicio ================================ */

  async updateExerciseNotes(
    groupId: string,
    notesText: string,
    actor: AuthenticatedUser,
  ): Promise<MedicalGroupDto> {
    const practitionerProfileId = this.requirePractitioner(actor);
    return this.em.transactional(async (tx) => {
      const group = await this.groupsRepo.findById(tx, groupId);
      if (group === null) {
        throw new ResourceNotFoundException('Grupo médico no encontrado', {
          id: groupId,
        });
      }
      const members = await this.membersRepo.findByGroup(tx, groupId);
      this.assertActorIsActiveMember(group, members, practitionerProfileId);
      const justClosed = await this.closeIfExpired(tx, group);
      if (justClosed || isClosedNow(group)) {
        throw new PreconditionFailedException(
          'El expediente ya está cerrado y es inmutable',
        );
      }
      if (!isRealizedNow(group)) {
        throw new PreconditionFailedException(
          'Todavía no se realizó la cita: las notas del procedimiento se cargan después',
        );
      }
      group.exerciseNotesText = notesText;
      group.exerciseNotesUpdatedAt = new Date();
      touch(group, actor.id);
      await tx.flush();
      return this.toDto(group, members);
    });
  }

  /* ==================== helpers ============================================ */

  private requirePractitioner(actor: AuthenticatedUser): string {
    if (actor.practitionerProfileId === undefined) {
      throw new UnauthorizedException(
        'La cuenta no tiene un perfil profesional asociado',
      );
    }
    return actor.practitionerProfileId;
  }

  /** Lectura: el creador, o cualquier fila de miembro (aceptada o no). */
  private assertActorSeesGroup(
    group: MedicalGroups,
    members: MedicalGroupMembers[],
    actor: AuthenticatedUser,
  ): void {
    const practitionerProfileId = actor.practitionerProfileId;
    const puede =
      practitionerProfileId !== undefined &&
      (group.requestingPractitionerId === practitionerProfileId ||
        members.some((m) => m.practitionerProfileId === practitionerProfileId));
    if (!puede) {
      throw new ResourceNotFoundException('Grupo médico no encontrado', {
        id: group.id,
      });
    }
  }

  /** Mutación: el creador, o un miembro cuya invitación ya fue aceptada. */
  private assertActorIsActiveMember(
    group: MedicalGroups,
    members: MedicalGroupMembers[],
    practitionerProfileId: string,
  ): void {
    const puede =
      group.requestingPractitionerId === practitionerProfileId ||
      members.some(
        (m) =>
          m.practitionerProfileId === practitionerProfileId &&
          m.invitationStatus === 'ACCEPTED',
      );
    if (!puede) {
      throw new ResourceNotFoundException('Grupo médico no encontrado', {
        id: group.id,
      });
    }
  }

  /**
   * Cierra el expediente en la base la primera vez que se lo observa vencido
   * (AC-21-19): más de una semana desde `scheduledAt`. Devuelve si acaba de
   * cerrarlo en esta llamada.
   */
  private async closeIfExpired(
    em: EntityManager,
    group: MedicalGroups,
  ): Promise<boolean> {
    if (group.closedAt !== undefined) {
      return false;
    }
    if (!isPastCloseWindowNow(group)) {
      return false;
    }
    group.closedAt = closesAt(group);
    if (group.status !== MEDICAL_GROUP_STATUS.CLOSED) {
      group.status = MEDICAL_GROUP_STATUS.CLOSED;
    }
    await em.flush();
    return true;
  }

  private toDto(
    group: MedicalGroups,
    members: MedicalGroupMembers[],
  ): MedicalGroupDto {
    const isRealized = isRealizedNow(group);
    const isClosed =
      group.closedAt !== undefined || isPastCloseWindowNow(group);
    return {
      id: group.id,
      serviceCatalogId: group.serviceCatalogId,
      requestingPractitionerId: group.requestingPractitionerId,
      patientProfileId: group.patientProfileId,
      conditionId: group.conditionId,
      scheduledAt: group.scheduledAt,
      locationText: group.locationText,
      notesText: group.notesText,
      termsText: group.termsText,
      status: isClosed ? MEDICAL_GROUP_STATUS.CLOSED : group.status,
      exerciseNotesText: group.exerciseNotesText,
      exerciseNotesUpdatedAt: group.exerciseNotesUpdatedAt,
      proposedRescheduleAt: group.proposedRescheduleAt,
      proposedByPractitionerId: group.proposedByPractitionerId,
      isRealized,
      canEditExerciseNotes: isRealized && !isClosed,
      isClosed,
      createdAt: group.createdAt,
      members: members.map((m) => ({
        id: m.id,
        practitionerProfileId: m.practitionerProfileId,
        roleTitle: m.roleTitle,
        agreedPaymentAmount: m.agreedPaymentAmount,
        agreedPaymentCurrencyConceptId: m.agreedPaymentCurrencyConceptId,
        additionalTermsText: m.additionalTermsText,
        isCreator: m.isCreator,
        invitationStatus: m.invitationStatus,
        respondedAt: m.respondedAt,
      })),
    };
  }
}

/* ==================== helpers derivados (puros) =============================
   Funciones libres, no métodos de la entidad: el resto del modelo mantiene las
   entidades como bolsas de propiedades sin comportamiento (ver cualquier otra
   `*.entity.ts` — sólo `@PrimaryKey`/`@Property`), y este módulo sigue esa
   misma convención en vez de romperla. */

function isRealizedNow(group: MedicalGroups, now: Date = new Date()): boolean {
  return now.getTime() >= group.scheduledAt.getTime();
}

function closesAt(group: MedicalGroups): Date {
  return new Date(group.scheduledAt.getTime() + EXERCISE_NOTES_WINDOW_MS);
}

function isPastCloseWindowNow(
  group: MedicalGroups,
  now: Date = new Date(),
): boolean {
  return now.getTime() > closesAt(group).getTime();
}

function isClosedNow(group: MedicalGroups, now: Date = new Date()): boolean {
  return group.closedAt !== undefined || isPastCloseWindowNow(group, now);
}
