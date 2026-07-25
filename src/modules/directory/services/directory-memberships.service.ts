import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  ACCESS_SCOPE_CONCEPT_BY_CODE,
  DIR,
  TENANT_ROLE_CONCEPT_BY_CODE,
} from '../directory.concepts';
import {
  BranchMembershipsRepository,
  BranchesRepository,
  TenantMembershipsRepository,
} from '../repositories';
import type { TenantMemberships } from '../entities';
import {
  BranchAssignmentDto,
  BranchMembershipResponseDto,
  ChangeMembershipRoleDto,
  CreateMembershipDto,
  MembershipResponseDto,
  StatusResultDto,
  TransferMembershipDto,
} from '../dto';

/**
 * Casos de uso sobre membresías: incorporación (UC-04-05), asignación a branch
 * (UC-04-06), transferencia (UC-04-07), cambio de rol/scope (UC-04-08) y
 * offboarding (UC-04-09). Todas las escrituras corren en `em.transactional`.
 */
@Injectable()
export class DirectoryMembershipsService {
  constructor(
    private readonly em: EntityManager,
    private readonly membershipsRepo: TenantMembershipsRepository,
    private readonly branchMembershipsRepo: BranchMembershipsRepository,
    private readonly branchesRepo: BranchesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DirectoryMembershipsService.name);
  }

  /** UC-04-05: incorpora un usuario al tenant (evita membresía activa duplicada). */
  async invite(
    tenantId: string,
    dto: CreateMembershipDto,
    actor: AuthenticatedUser,
  ): Promise<MembershipResponseDto> {
    this.logger.info(
      { operation: 'directory.membership.invite', tenantId, actorId: actor.id },
      'Inviting member',
    );
    return this.em.transactional(async (tx) => {
      const existing = await this.membershipsRepo.findActiveByUserTenant(
        tx,
        dto.userId,
        tenantId,
        DIR.MEMBERSHIP_ACTIVE,
      );
      if (existing) {
        throw new ConflictException('El usuario ya tiene una membresía activa en el tenant', {
          tenantId,
          userId: dto.userId,
        });
      }

      const membership = this.membershipsRepo.create(tx, {
        userId: dto.userId,
        tenantId,
        tenantRoleConceptId: TENANT_ROLE_CONCEPT_BY_CODE[dto.role ?? 'STAFF'],
        statusConceptId: DIR.MEMBERSHIP_ACTIVE,
        accessScopeConceptId: ACCESS_SCOPE_CONCEPT_BY_CODE[dto.accessScope ?? 'ALL_TENANT'],
        primaryBranchId: dto.primaryBranchId,
        startDate: new Date(),
        invitedByUserId: actor.id,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'directory.membership.invite', membershipId: membership.id },
        'Member invited',
      );
      return this.toResponse(membership);
    });
  }

  /** UC-04-06: asigna la membresía a una branch del mismo tenant. */
  async assignBranch(
    tenantId: string,
    membershipId: string,
    dto: BranchAssignmentDto,
    actor: AuthenticatedUser,
  ): Promise<BranchMembershipResponseDto> {
    this.logger.info(
      { operation: 'directory.branch-assignment.create', tenantId, membershipId, actorId: actor.id },
      'Assigning membership to branch',
    );
    return this.em.transactional(async (tx) => {
      const membership = await this.requireActiveMembership(tx, tenantId, membershipId);
      await this.requireBranchInTenant(tx, tenantId, dto.branchId);

      const already = await this.branchMembershipsRepo.findByMembershipBranchStatus(
        tx,
        membershipId,
        dto.branchId,
        DIR.BRANCH_MEMBERSHIP_ACTIVE,
      );
      if (already) {
        throw new ConflictException('La membresía ya está asignada a esa branch', {
          membershipId,
          branchId: dto.branchId,
        });
      }

      const assignment = this.branchMembershipsRepo.create(tx, {
        tenantMembershipId: membershipId,
        branchId: dto.branchId,
        localRoleConceptId: dto.localRoleConceptId ?? DIR.LOCAL_ROLE_STAFF,
        statusConceptId: DIR.BRANCH_MEMBERSHIP_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      // Primera branch asignada -> queda como primary de la membresía.
      if (!membership.primaryBranchId) {
        membership.primaryBranchId = dto.branchId;
        touch(membership, actor.id);
      }

      this.logger.info(
        { operation: 'directory.branch-assignment.create', assignmentId: assignment.id },
        'Branch assignment created',
      );
      return {
        id: assignment.id,
        tenantMembershipId: assignment.tenantMembershipId,
        branchId: assignment.branchId,
        localRole: assignment.localRoleConceptId,
        status: assignment.statusConceptId,
      };
    });
  }

  /** UC-04-07: transfiere la membresía de una branch a otra (cierra origen, abre destino). */
  async transfer(
    tenantId: string,
    membershipId: string,
    dto: TransferMembershipDto,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    this.logger.info(
      { operation: 'directory.membership.transfer', tenantId, membershipId, actorId: actor.id },
      'Transferring membership between branches',
    );
    return this.em.transactional(async (tx) => {
      const membership = await this.requireActiveMembership(tx, tenantId, membershipId);
      await this.requireBranchInTenant(tx, tenantId, dto.fromBranchId);
      await this.requireBranchInTenant(tx, tenantId, dto.toBranchId);

      const source = await this.branchMembershipsRepo.findByMembershipBranchStatus(
        tx,
        membershipId,
        dto.fromBranchId,
        DIR.BRANCH_MEMBERSHIP_ACTIVE,
      );
      if (!source) {
        throw new ResourceNotFoundException('No hay asignación activa en la branch de origen', {
          membershipId,
          branchId: dto.fromBranchId,
        });
      }

      source.statusConceptId = DIR.BRANCH_MEMBERSHIP_ENDED;
      touch(source, actor.id);

      this.branchMembershipsRepo.create(tx, {
        tenantMembershipId: membershipId,
        branchId: dto.toBranchId,
        localRoleConceptId: source.localRoleConceptId,
        statusConceptId: DIR.BRANCH_MEMBERSHIP_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      membership.primaryBranchId = dto.toBranchId;
      touch(membership, actor.id);

      this.logger.info(
        { operation: 'directory.membership.transfer', membershipId },
        'Membership transferred',
      );
      return { ok: true };
    });
  }

  /** UC-04-08: cambia rol y/o scope de la membresía (re-seed de grants aguas abajo). */
  async changeRole(
    tenantId: string,
    membershipId: string,
    dto: ChangeMembershipRoleDto,
    actor: AuthenticatedUser,
  ): Promise<MembershipResponseDto> {
    this.logger.info(
      { operation: 'directory.membership.role', tenantId, membershipId, actorId: actor.id },
      'Changing membership role/scope',
    );
    if (!dto.role && !dto.accessScope) {
      throw new PreconditionFailedException('Debe indicar un nuevo rol o scope', { membershipId });
    }
    return this.em.transactional(async (tx) => {
      const membership = await this.requireActiveMembership(tx, tenantId, membershipId);

      if (dto.role) membership.tenantRoleConceptId = TENANT_ROLE_CONCEPT_BY_CODE[dto.role];
      if (dto.accessScope) {
        membership.accessScopeConceptId = ACCESS_SCOPE_CONCEPT_BY_CODE[dto.accessScope];
      }
      touch(membership, actor.id);

      this.logger.info(
        { operation: 'directory.membership.role', membershipId },
        'Membership role/scope changed',
      );
      return this.toResponse(membership);
    });
  }

  /** UC-04-09: da de baja la membresía y cierra en cascada sus asignaciones a branches. */
  async offboard(
    tenantId: string,
    membershipId: string,
    actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    this.logger.info(
      { operation: 'directory.membership.offboard', tenantId, membershipId, actorId: actor.id },
      'Offboarding member',
    );
    return this.em.transactional(async (tx) => {
      const membership = await this.requireActiveMembership(tx, tenantId, membershipId);

      membership.statusConceptId = DIR.MEMBERSHIP_ENDED;
      membership.endDate = new Date();
      touch(membership, actor.id);

      const assignments = await this.branchMembershipsRepo.findByMembershipAndStatus(
        tx,
        membershipId,
        DIR.BRANCH_MEMBERSHIP_ACTIVE,
      );
      for (const assignment of assignments) {
        assignment.statusConceptId = DIR.BRANCH_MEMBERSHIP_ENDED;
        touch(assignment, actor.id);
      }

      this.logger.info(
        {
          operation: 'directory.membership.offboard',
          membershipId,
          branchAssignments: assignments.length,
        },
        'Member offboarded',
      );
      return { ok: true };
    });
  }

  /** Carga una membresía del tenant y exige que esté activa. */
  private async requireActiveMembership(
    em: EntityManager,
    tenantId: string,
    membershipId: string,
  ): Promise<TenantMemberships> {
    const membership = await this.membershipsRepo.findByIdInTenant(em, membershipId, tenantId);
    if (!membership) {
      throw new ResourceNotFoundException('Membresía no encontrada', { tenantId, membershipId });
    }
    if (membership.statusConceptId !== DIR.MEMBERSHIP_ACTIVE) {
      throw new PreconditionFailedException('La membresía no está activa', { membershipId });
    }
    return membership;
  }

  /** Exige que una branch exista y pertenezca al tenant indicado. */
  private async requireBranchInTenant(
    em: EntityManager,
    tenantId: string,
    branchId: string,
  ): Promise<void> {
    const branch = await this.branchesRepo.findById(em, branchId);
    if (!branch) throw new ResourceNotFoundException('Branch no encontrada', { branchId });
    if (branch.tenantId !== tenantId) {
      throw new PreconditionFailedException('La branch no pertenece al tenant', {
        tenantId,
        branchId,
      });
    }
  }

  /** Proyecta la entidad membresía al DTO de respuesta público. */
  private toResponse(membership: TenantMemberships): MembershipResponseDto {
    return {
      id: membership.id,
      userId: membership.userId,
      tenantId: membership.tenantId,
      tenantRole: membership.tenantRoleConceptId,
      accessScope: membership.accessScopeConceptId,
      status: membership.statusConceptId,
      primaryBranchId: membership.primaryBranchId,
      startDate: membership.startDate,
    };
  }
}
