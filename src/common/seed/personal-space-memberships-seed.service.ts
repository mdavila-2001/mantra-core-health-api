import { Injectable } from '@nestjs/common';
import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';

import { CONCEPTS, deterministicId, SEED } from '../constants/concepts';
import { createdBy } from '../persistence/audit-fields';
import { DIR } from '../../modules/directory/directory.concepts';
import { TenantMemberships } from '../../modules/directory/entities';
import { UserGlobalRoles } from '../../modules/iam/entities';
import {
  ROLE_CONCEPT_BY_CODE,
  type RoleCode,
} from '../../modules/iam/domain/role-mapping';
import { SEED_ACTOR_ID, ensureSeedActor } from './seed-actor';

/**
 * Roles de una **persona** que usa la plataforma para sí (atenderse, atender,
 * asistir a un profesional). Son los únicos que dan espacio personal.
 */
export const PERSONAL_SPACE_ROLE_CODES: readonly RoleCode[] = [
  'PATIENT',
  'PRACTITIONER',
  'CLINICIAN',
  'SUPPORT_STAFF',
];

/** Lo que el paso dejó hecho en esta pasada. */
export interface PersonalSpaceMembershipsResult {
  /** Cuentas de persona sin ninguna membresía a las que se les dio la del espacio personal. */
  created: number;
  /** Cuentas de persona que ya tenían alguna membresía (de cualquier tenant y estado). */
  alreadyMember: number;
  /**
   * Cuentas con un rol personal **y** un rol administrativo global. No se
   * reparan solas: su alcance lo decide una persona, no el arranque.
   */
  needsReview: number;
  /** Cuentas que fallaron, con el motivo. */
  failed: string[];
}

/** Id determinista de la membresía de espacio personal de una persona. */
export function personalSpaceMembershipId(userId: string): string {
  return deterministicId(`seed:membership:personal-space:${userId}`);
}

/**
 * Reparación de datos: da la membresía del espacio personal (el tenant por
 * defecto, el mismo que el autorregistro ya asigna) a las personas que no
 * tienen **ninguna** membresía.
 *
 * ## Por qué existe
 *
 * Una persona sin organización (paciente, médico independiente) necesita una
 * membresía para que `TenantContextInterceptor` la deje operar: sin ella, cada
 * petición responde 403 `TENANT_REQUIRED`. El autorregistro ya la crea, pero
 * las cuentas dadas de alta antes, o por el alta asistida o `POST /iam/users`,
 * no la tienen. Esta reparación las cubre.
 *
 * ## Qué NO hace
 *
 * - No da membresía a quien tiene **cualquier** fila de membresía: una
 *   organización (activa o no), o una suspensión o revocación. Una membresía
 *   suspendida es una decisión explícita y no se reactiva desde acá.
 * - No da membresía a quien tiene un rol administrativo global además del
 *   personal: se cuenta en `needsReview`.
 * - No se apoya en el token ni en la resolución de la petición: deja una fila
 *   real, con id determinista, así que la API se comporta igual con o sin este
 *   paso y es idempotente.
 */
@Injectable()
export class PersonalSpaceMembershipsSeedService {
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PersonalSpaceMembershipsSeedService.name);
  }

  /**
   * Ejecuta el paso. Es núcleo: corre en todos los entornos y no crea cuentas.
   *
   * @returns Qué quedó hecho en esta pasada.
   */
  async run(): Promise<PersonalSpaceMembershipsResult> {
    const result: PersonalSpaceMembershipsResult = {
      created: 0,
      alreadyMember: 0,
      needsReview: 0,
      failed: [],
    };

    const em = this.orm.em.fork();
    await ensureSeedActor(em);

    const personal = new Set<string>(
      PERSONAL_SPACE_ROLE_CODES.map((code) => ROLE_CONCEPT_BY_CODE[code]),
    );
    const rolesByUser = await this.activeGlobalRoleConceptsByUser(em);

    const eligible: string[] = [];
    for (const [userId, concepts] of rolesByUser) {
      const hasPersonal = concepts.some((c) => personal.has(c));
      if (!hasPersonal) continue;
      const onlyPersonal = concepts.every((c) => personal.has(c));
      if (!onlyPersonal) {
        result.needsReview++;
        continue;
      }
      eligible.push(userId);
    }

    const withAnyMembership = await this.usersWithAnyMembership(em, eligible);
    for (const userId of eligible) {
      if (withAnyMembership.has(userId)) {
        result.alreadyMember++;
        continue;
      }
      try {
        em.create(
          TenantMemberships,
          {
            id: personalSpaceMembershipId(userId),
            userId,
            tenantId: SEED.tenantId,
            tenantRoleConceptId: DIR.ROLE_STAFF,
            statusConceptId: DIR.MEMBERSHIP_ACTIVE,
            accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
            startDate: new Date(),
            ...createdBy(SEED_ACTOR_ID),
          },
          { partial: true },
        );
        await em.flush();
        result.created++;
      } catch (error) {
        em.clear();
        const message = error instanceof Error ? error.message : String(error);
        result.failed.push(`${userId}: ${message}`);
        this.logger.error(
          { operation: 'seed.personal-space-memberships', userId, err: error },
          'No se pudo dar la membresía del espacio personal',
        );
      }
    }

    this.logger.info(
      {
        operation: 'seed.personal-space-memberships',
        created: result.created,
        alreadyMember: result.alreadyMember,
        needsReview: result.needsReview,
        failed: result.failed.length,
      },
      'Membresías del espacio personal sembradas',
    );
    return result;
  }

  /** Conceptos de rol global activos, agrupados por persona. */
  private async activeGlobalRoleConceptsByUser(
    em: EntityManager,
  ): Promise<Map<string, string[]>> {
    const rows = await em.find(UserGlobalRoles, {
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
    const byUser = new Map<string, string[]>();
    for (const row of rows) {
      const list = byUser.get(row.userId) ?? [];
      list.push(row.roleConceptId);
      byUser.set(row.userId, list);
    }
    return byUser;
  }

  /** Quién, de estas personas, ya tiene alguna fila de membresía (cualquier tenant o estado). */
  private async usersWithAnyMembership(
    em: EntityManager,
    userIds: string[],
  ): Promise<Set<string>> {
    if (userIds.length === 0) return new Set();
    const rows = await em.find(
      TenantMemberships,
      { userId: { $in: userIds } },
      { fields: ['userId'] },
    );
    return new Set(rows.map((row) => row.userId));
  }
}
