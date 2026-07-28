import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, type AuthenticatedUser } from '../../../common';
import {
  RolesRepository,
  RolePermissionsRepository,
  PermissionsRepository,
  UserRoleAssignmentsRepository,
  UserPermissionGrantsRepository,
  AccessPoliciesRepository,
  ClinicalAccessGrantsRepository,
  CareRelationshipsRepository,
  PatientLegalRepresentationsRepository,
  ResourceScopeGrantsRepository,
  FieldPermissionsRepository,
} from '../repositories';
import {
  InvalidateCacheDto,
  EvaluateDecisionDto,
  CacheInvalidationResultDto,
  DecisionResponseDto,
  MaskedFieldDto,
} from '../dto';
import { AUTHZ } from '../authz.concepts';

const ACTION_CONCEPT: Record<string, string> = {
  READ: AUTHZ.ACTION_READ,
  WRITE: AUTHZ.ACTION_WRITE,
  CREATE: AUTHZ.ACTION_CREATE,
  DELETE: AUTHZ.ACTION_DELETE,
  EXECUTE: AUTHZ.ACTION_EXECUTE,
  APPROVE: AUTHZ.ACTION_APPROVE,
};

/**
 * Rango de privilegio exigido por cada acción para un acceso clínico.
 * Orden creciente READ < WRITE < FULL: una acción solo la cubre un grant cuyo
 * nivel alcance su rango. Acciones destructivas/administrativas exigen nivel FULL.
 */
const CLINICAL_ACTION_RANK: Record<string, number> = {
  READ: 1,
  WRITE: 2,
  CREATE: 2,
  DELETE: 3,
  EXECUTE: 3,
  APPROVE: 3,
};

/**
 * Rango que otorga cada nivel de un `clinical_access_grant`. El nivel ELEVATED
 * (break-the-glass) se equipara a FULL para la duración de la emergencia.
 */
const CLINICAL_LEVEL_RANK: Record<string, number> = {
  [AUTHZ.ACCESS_LEVEL_READ]: 1,
  [AUTHZ.ACCESS_LEVEL_WRITE]: 2,
  [AUTHZ.ACCESS_LEVEL_FULL]: 3,
  [AUTHZ.ACCESS_LEVEL_ELEVATED]: 3,
};

/**
 * Propósito de uso solicitado → concepto autorizado que debe portar el grant
 * (`clinical_access_grants.reason_concept_id`). Debe coincidir exactamente.
 */
const CLINICAL_PURPOSE_CONCEPT: Record<string, string> = {
  TREATMENT: AUTHZ.PURPOSE_TREATMENT,
  PAYMENT: AUTHZ.PURPOSE_PAYMENT,
  OPERATIONS: AUTHZ.PURPOSE_OPERATIONS,
  EMERGENCY: AUTHZ.PURPOSE_EMERGENCY,
};

/** Concept id de estrategia de enmascaramiento → código legible. */
const MASK_NAME: Record<string, string> = {
  [AUTHZ.MASK_REDACT]: 'REDACT',
  [AUTHZ.MASK_HASH]: 'HASH',
  [AUTHZ.MASK_PARTIAL]: 'PARTIAL',
  [AUTHZ.MASK_NULLIFY]: 'NULLIFY',
};

const DECISION_TTL_SECONDS = 300;

/**
 * UC-06-11 — Invalidación de la cache de decisiones del PDP.
 * UC-06-12 — Recálculo de la decisión de autorización efectiva (deny-overrides).
 *
 * La cache real vive en Redis (fuera de la persistencia de este módulo); aquí se
 * computa la clave lógica y, para 06-12, se evalúa la decisión de forma real
 * sobre los grants/roles/políticas persistidos en PostgreSQL.
 */
@Injectable()
export class AuthzPdpService {
  constructor(
    private readonly em: EntityManager,
    private readonly rolesRepo: RolesRepository,
    private readonly rolePermsRepo: RolePermissionsRepository,
    private readonly permissionsRepo: PermissionsRepository,
    private readonly assignmentsRepo: UserRoleAssignmentsRepository,
    private readonly permGrantsRepo: UserPermissionGrantsRepository,
    private readonly policiesRepo: AccessPoliciesRepository,
    private readonly clinicalRepo: ClinicalAccessGrantsRepository,
    private readonly careRelationshipsRepo: CareRelationshipsRepository,
    private readonly legalRepresentationsRepo: PatientLegalRepresentationsRepository,
    private readonly resourceGrantsRepo: ResourceScopeGrantsRepository,
    private readonly fieldPermsRepo: FieldPermissionsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthzPdpService.name);
  }

  /** UC-06-11: invalida las entradas de decisión afectadas por un cambio de authz. */
  invalidateCache(
    dto: InvalidateCacheDto,
    actor: AuthenticatedUser,
  ): CacheInvalidationResultDto {
    const subject = dto.userId ?? dto.roleId ?? '*';
    const cacheKey = `pdp:${dto.tenantId ?? '*'}:${subject}`;
    this.logger.info(
      { operation: 'authz.pdp.cache.invalidate', cacheKey, actorId: actor.id },
      'Invalidating PDP decision cache',
    );
    // La invalidación efectiva la realiza el consumidor de outbox sobre Redis;
    // aquí se registra la orden idempotente por clave. `invalidatedEntries` es el
    // nº de dimensiones invalidadas (tenant/user/role) presentes en la clave.
    const invalidatedEntries =
      [dto.tenantId, dto.userId, dto.roleId].filter(Boolean).length || 1;
    return { ok: true, cacheKey, invalidatedEntries };
  }

  /** UC-06-12: evalúa la decisión efectiva. Solo lectura (`em.fork`). */
  async evaluate(
    dto: EvaluateDecisionDto,
    actor: AuthenticatedUser,
  ): Promise<DecisionResponseDto> {
    const em = this.em.fork();
    this.logger.info(
      {
        operation: 'authz.pdp.evaluate',
        userId: dto.userId,
        resource: dto.resource,
        action: dto.action,
        purposeOfUse: dto.purposeOfUse,
        actorId: actor.id,
      },
      'Evaluating authorization decision',
    );

    const cacheKey = `pdp:${dto.tenantId}:${dto.userId}:${dto.resource}:${dto.action}:${dto.purposeOfUse ?? 'NA'}`;

    // 1. Permiso solicitado (resource + action).
    const permission = await this.permissionsRepo.findByResourceAction(
      em,
      dto.resource,
      ACTION_CONCEPT[dto.action],
    );

    // 2. Roles efectivos del usuario (asignaciones activas + herencia de padres).
    const assignments = await this.assignmentsRepo.findActiveForUser(
      em,
      dto.userId,
    );
    const now = Date.now();
    const directRoleIds = assignments
      .filter((a) => this.isWithinWindow(a.validFrom, a.validTo, now))
      .map((a) => a.roleId);
    const effectiveRoleIds = await this.resolveRoleInheritance(
      em,
      directRoleIds,
    );

    let hasAllow = false;
    let hasDeny = false;
    const reasons: string[] = [];

    if (!permission) {
      // Sin permiso catalogado no hay allow explícito posible.
      reasons.push(`permiso inexistente para ${dto.resource}:${dto.action}`);
    } else {
      // 3. role_permissions de los roles efectivos para ese permiso.
      const rolePerms = await this.rolePermsRepo.findActiveForRoles(
        em,
        effectiveRoleIds,
      );
      for (const rp of rolePerms) {
        if (rp.permissionId !== permission.id) continue;
        if (rp.effectConceptId === AUTHZ.EFFECT_DENY) {
          hasDeny = true;
          reasons.push('deny por rol');
        } else if (rp.effectConceptId === AUTHZ.EFFECT_ALLOW) {
          hasAllow = true;
          reasons.push('allow por rol');
        }
      }

      // 4. Excepciones de usuario (deny individual prevalece sobre allow de rol).
      const grants = await this.permGrantsRepo.findActiveForUser(
        em,
        dto.userId,
      );
      for (const g of grants) {
        if (g.permissionId !== permission.id) continue;
        if (!this.isWithinWindow(g.validFrom, g.validTo, now)) continue;
        if (g.effectConceptId === AUTHZ.EFFECT_DENY) {
          hasDeny = true;
          reasons.push('deny por excepción de usuario');
        } else if (g.effectConceptId === AUTHZ.EFFECT_ALLOW) {
          hasAllow = true;
          reasons.push('allow por excepción de usuario');
        }
      }

      // 6. Grants polimórficos sujeto→recurso.
      if (dto.resourceId) {
        const rsg = await this.resourceGrantsRepo.findForSubjectResource(
          em,
          dto.userId,
          dto.resourceId,
        );
        for (const g of rsg) {
          if (g.permissionId !== permission.id) continue;
          if (!this.isWithinWindow(g.validFrom, g.validTo, now)) continue;
          if (g.effectConceptId === AUTHZ.EFFECT_DENY) {
            hasDeny = true;
            reasons.push('deny por grant de recurso');
          } else if (g.effectConceptId === AUTHZ.EFFECT_ALLOW) {
            hasAllow = true;
            reasons.push('allow por grant de recurso');
          }
        }
      }
    }

    // 5. Políticas ABAC del tenant sobre el recurso (deny gana; orden por prioridad).
    const policies = await this.policiesRepo.findActiveForTarget(
      em,
      dto.tenantId,
      dto.resource,
    );
    for (const p of policies) {
      if (p.effectConceptId === AUTHZ.EFFECT_DENY) {
        hasDeny = true;
        reasons.push(`deny por política "${p.name}"`);
      } else if (p.effectConceptId === AUTHZ.EFFECT_ALLOW) {
        hasAllow = true;
        reasons.push(`allow por política "${p.name}"`);
      }
    }

    // 6b. Acceso clínico por propósito de uso (si el recurso es clínico).
    // Fail-closed: un grant solo concede si (a) su nivel cubre la ACCIÓN pedida,
    // (b) su propósito autorizado coincide con el propósito solicitado y (c) está
    // vigente. Un grant READ NO habilita DELETE, y un propósito distinto (o
    // ausente) no concede. Antes se concedía por la mera existencia de un grant
    // vigente, ignorando acción y propósito (CAN-AUTH-001).
    if (dto.patientProfileId) {
      const clinical = await this.clinicalRepo.findActiveForUserPatient(
        em,
        dto.userId,
        dto.patientProfileId,
      );
      const requiredRank =
        CLINICAL_ACTION_RANK[dto.action] ?? Number.MAX_SAFE_INTEGER;
      const requestedPurposeConcept = dto.purposeOfUse
        ? CLINICAL_PURPOSE_CONCEPT[dto.purposeOfUse]
        : undefined;

      const matching = clinical.filter((c) => {
        // (c) vigencia por ventana temporal del grant.
        if (!this.isWithinWindow(c.validFrom, c.validTo, now)) return false;
        // (b) el propósito solicitado debe existir y coincidir con el autorizado.
        if (
          !requestedPurposeConcept ||
          c.reasonConceptId !== requestedPurposeConcept
        ) {
          return false;
        }
        // (a) el nivel del grant debe alcanzar el rango que exige la acción.
        const grantedRank = CLINICAL_LEVEL_RANK[c.accessLevelConceptId] ?? 0;
        return grantedRank >= requiredRank;
      });

      if (matching.length > 0) {
        hasAllow = true;
        reasons.push(
          'allow por acceso clínico vigente (nivel y propósito verificados)',
        );
      } else {
        reasons.push(
          'sin acceso clínico que habilite la acción/propósito solicitados',
        );
      }

      // 6c. Relación asistencial vigente (C-06 / CAN-AUTH-001). Además de un grant
      // explícito, un vínculo asistencial ACTIVO y vigente entre el practicante
      // (actor) y el paciente concede acceso. Fail-closed: solo se evalúa si el
      // actor porta su perfil de practicante, la relación está vigente y —si la
      // relación fija un propósito— este coincide con el solicitado.
      if (dto.practitionerProfileId) {
        const careRels =
          await this.careRelationshipsRepo.findActiveForPractitionerPatient(
            em,
            dto.practitionerProfileId,
            dto.patientProfileId,
          );
        const matchingRel = careRels.filter((r) => {
          if (r.statusConceptId !== CONCEPTS.STATE_ACTIVE) return false;
          if (!this.isWithinWindow(r.validFrom, r.validTo, now)) return false;
          // Si la relación acota un propósito, debe coincidir con el solicitado.
          if (r.purposeConceptId) {
            return (
              !!requestedPurposeConcept &&
              r.purposeConceptId === requestedPurposeConcept
            );
          }
          return true;
        });
        if (matchingRel.length > 0) {
          hasAllow = true;
          reasons.push(
            'allow por relación asistencial vigente (C-06/CAN-AUTH-001)',
          );
        } else {
          reasons.push('sin relación asistencial vigente que habilite');
        }
      }

      // 6d. Representación legal del paciente (C-07 / A-03). El usuario que
      // representa legalmente al paciente está autorizado sobre sus datos. Fail-
      // closed: la representación debe estar ACTIVA y vigente.
      const legalReps =
        await this.legalRepresentationsRepo.findActiveForRepresentativePatient(
          em,
          dto.userId,
          dto.patientProfileId,
        );
      const validRep = legalReps.find(
        (r) =>
          r.statusConceptId === CONCEPTS.STATE_ACTIVE &&
          this.isWithinWindow(r.validFrom, r.validTo, now),
      );
      if (validRep) {
        hasAllow = true;
        reasons.push('allow por representación legal vigente (C-07/A-03)');
      }
    }

    // 7. Campos a enmascarar según field_permissions de los roles efectivos.
    const maskedFields = await this.computeMaskedFields(em, effectiveRoleIds);

    // Resolución final: deny-overrides.
    const permit = hasDeny ? false : hasAllow;
    const decision: 'PERMIT' | 'DENY' = permit ? 'PERMIT' : 'DENY';
    const reason =
      reasons.length > 0
        ? reasons.join('; ')
        : 'sin señales aplicables (deny por defecto)';

    this.logger.info(
      { operation: 'authz.pdp.evaluate.result', decision, cacheKey },
      'Authorization decision evaluated',
    );

    return {
      decision,
      reason,
      effectiveRoleIds,
      maskedFields,
      purposeOfUse: dto.purposeOfUse,
      cacheKey,
      ttlSeconds: DECISION_TTL_SECONDS,
    };
  }

  /** Expande un conjunto de roles con sus ancestros (herencia parent_role_id). */
  private async resolveRoleInheritance(
    em: EntityManager,
    roleIds: string[],
  ): Promise<string[]> {
    const visited = new Set<string>();
    const queue = [...roleIds];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const role = await this.rolesRepo.findById(em, id);
      if (role?.parentRoleId && !visited.has(role.parentRoleId)) {
        queue.push(role.parentRoleId);
      }
    }
    return [...visited];
  }

  /** Deriva la matriz de enmascaramiento (campos no legibles o con estrategia). */
  private async computeMaskedFields(
    em: EntityManager,
    roleIds: string[],
  ): Promise<MaskedFieldDto[]> {
    const rules = await this.fieldPermsRepo.findForRoles(em, roleIds);
    const masked: MaskedFieldDto[] = [];
    for (const r of rules) {
      if (!r.canRead) {
        masked.push({
          entity: r.entity,
          columnName: r.columnName,
          strategy: 'NO_READ',
        });
      } else if (r.maskStrategyConceptId) {
        masked.push({
          entity: r.entity,
          columnName: r.columnName,
          strategy: MASK_NAME[r.maskStrategyConceptId] ?? 'MASK',
        });
      }
    }
    return masked;
  }

  /** Vigencia por tstzrange abierto: null en un extremo = sin límite. */
  private isWithinWindow(
    from: Date | undefined,
    to: Date | undefined,
    now: number,
  ): boolean {
    if (from && from.getTime() > now) return false;
    if (to && to.getTime() <= now) return false;
    return true;
  }
}
