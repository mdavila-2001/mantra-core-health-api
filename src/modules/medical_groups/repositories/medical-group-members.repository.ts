import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../common';
import {
  MedicalGroupMembers,
  type MedicalGroupMemberInvitationStatus,
} from '../entities';

/** Datos para crear una fila `medical_groups.group_members`. */
export interface CreateMedicalGroupMemberData {
  groupId: string;
  practitionerProfileId: string;
  roleTitle: string;
  agreedPaymentAmount: string;
  agreedPaymentCurrencyConceptId?: string;
  additionalTermsText?: string;
  isCreator: boolean;
  invitationStatus: MedicalGroupMemberInvitationStatus;
  respondedAt?: Date;
  actorUserId?: string;
}

/** Acceso a datos de `medical_groups.group_members`. */
@Injectable()
export class MedicalGroupMembersRepository {
  findById(em: EntityManager, id: string): Promise<MedicalGroupMembers | null> {
    return em.findOne(MedicalGroupMembers, { id });
  }

  findByGroup(
    em: EntityManager,
    groupId: string,
  ): Promise<MedicalGroupMembers[]> {
    return em.find(
      MedicalGroupMembers,
      { groupId },
      { orderBy: { isCreator: 'DESC', createdAt: 'ASC' } },
    );
  }

  findManyByGroups(
    em: EntityManager,
    groupIds: readonly string[],
  ): Promise<MedicalGroupMembers[]> {
    if (groupIds.length === 0) {
      return Promise.resolve([]);
    }
    return em.find(MedicalGroupMembers, {
      groupId: { $in: groupIds as string[] },
    });
  }

  /** Grupos donde el profesional tiene una invitación en el estado dado (no como creador). */
  findGroupIdsByInvitee(
    em: EntityManager,
    practitionerProfileId: string,
    invitationStatus: MedicalGroupMemberInvitationStatus,
  ): Promise<string[]> {
    return em
      .find(
        MedicalGroupMembers,
        { practitionerProfileId, invitationStatus, isCreator: false },
        { fields: ['groupId'] },
      )
      .then((rows) => rows.map((row) => row.groupId));
  }

  /** Grupos creados por el profesional que todavía tienen algún cargo sin responder. */
  findGroupIdsWithPendingInvites(
    em: EntityManager,
    groupIds: readonly string[],
  ): Promise<string[]> {
    if (groupIds.length === 0) {
      return Promise.resolve([]);
    }
    return em
      .find(
        MedicalGroupMembers,
        {
          groupId: { $in: groupIds as string[] },
          invitationStatus: 'PENDING',
          isCreator: false,
        },
        { fields: ['groupId'] },
      )
      .then((rows) => [...new Set(rows.map((row) => row.groupId))]);
  }

  hasPendingInvites(em: EntityManager, groupId: string): Promise<boolean> {
    return em
      .count(MedicalGroupMembers, {
        groupId,
        invitationStatus: 'PENDING',
        isCreator: false,
      })
      .then((count) => count > 0);
  }

  create(
    em: EntityManager,
    data: CreateMedicalGroupMemberData,
  ): MedicalGroupMembers {
    return em.create(
      MedicalGroupMembers,
      {
        groupId: data.groupId,
        practitionerProfileId: data.practitionerProfileId,
        roleTitle: data.roleTitle,
        agreedPaymentAmount: data.agreedPaymentAmount,
        agreedPaymentCurrencyConceptId: data.agreedPaymentCurrencyConceptId,
        additionalTermsText: data.additionalTermsText,
        isCreator: data.isCreator,
        invitationStatus: data.invitationStatus,
        respondedAt: data.respondedAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
