import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  DomainException,
  ErrorCode,
  PreconditionFailedException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../../common';
import { IAMC } from '../../iam.concepts';
import { IamErrorReason } from '../../iam.error-reasons';
import {
  MIN_ALLOWED_HOURS_MINUTES,
  allowedHoursDuration,
  applicablePolicies,
  isValidTimeZone,
  isWithinAllowedHours,
  rolesInTenant,
  strictestRules,
  type AllowedHours,
  type EffectiveSessionRules,
  type SessionPolicyFacts,
  type SessionPolicyScope,
  type TenantSessionRules,
} from '../../domain/session-policy';
import type {
  PutSessionPoliciesDto,
  SessionPoliciesResponseDto,
  SessionPolicyDto,
} from '../../presentation/dto/session-policies.dto';
import { SessionPoliciesRepository } from '../../infrastructure/repositories';
import type { SessionPolicies } from '../../entities';
import { IpAccessRulesService } from './ip-access-rules.service';

const SCOPE_CONCEPT: Record<SessionPolicyScope, string> = {
  ALL_ACCOUNTS: IAMC.SESSION_POLICY_SCOPE_ALL_ACCOUNTS,
  ORG_STAFF: IAMC.SESSION_POLICY_SCOPE_ORG_STAFF,
  ROLE: IAMC.SESSION_POLICY_SCOPE_ROLE,
};
const SCOPE_BY_CONCEPT: Record<string, SessionPolicyScope> = {
  [IAMC.SESSION_POLICY_SCOPE_ALL_ACCOUNTS]: 'ALL_ACCOUNTS',
  [IAMC.SESSION_POLICY_SCOPE_ORG_STAFF]: 'ORG_STAFF',
  [IAMC.SESSION_POLICY_SCOPE_ROLE]: 'ROLE',
};

/**
 * Políticas de sesión por organización (`iam.session_policies`): inactividad,
 * aviso de dispositivo nuevo, horario permitido, reglas de IP y segundo factor.
 * La organización las define para su tenant; el flujo de sesión las aplica.
 */
@Injectable()
export class SessionPoliciesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param repo - Políticas de sesión.
   * @param logger - Logger estructurado.
   * @param ipRules - Reglas de red, para no encerrar a quien guarda una política.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: SessionPoliciesRepository,
    private readonly logger: PinoLogger,
    private readonly ipRules: IpAccessRulesService,
  ) {
    this.logger.setContext(SessionPoliciesService.name);
  }

  /**
   * Políticas de la organización activa.
   *
   * @returns Las políticas vigentes.
   */
  async get(): Promise<SessionPoliciesResponseDto> {
    const rows = await this.repo.findByTenant(
      this.em.fork(),
      requireTenantId(),
      CONCEPTS.STATE_ACTIVE,
    );
    return { policies: rows.map(toDto) };
  }

  /**
   * Reemplaza el conjunto de políticas de la organización activa.
   *
   * Antes de guardar se comprueba que el conjunto no deje fuera a quien lo
   * guarda: ni por la franja horaria (debe quedar dentro AHORA) ni por las
   * reglas de red (su origen debe seguir dentro hoy y en cada vigencia futura).
   *
   * @param dto - Políticas nuevas.
   * @param actor - Quien las define.
   * @param ip - Origen de quien las define (`req.ip`).
   * @returns Las políticas vigentes tras el reemplazo.
   */
  async put(
    dto: PutSessionPoliciesDto,
    actor: AuthenticatedUser,
    ip?: string,
  ): Promise<SessionPoliciesResponseDto> {
    const tenantId = requireTenantId();
    this.assertCoherent(dto.policies);
    await this.assertActorKeepsAccess(dto.policies, actor, tenantId, ip);
    return this.em.transactional(async (tx) => {
      const current = await this.repo.findByTenant(
        tx,
        tenantId,
        CONCEPTS.STATE_ACTIVE,
      );
      // Lo que ya no figura se retira (no se borra): queda como histórico.
      for (const row of current) {
        row.statusConceptId = CONCEPTS.STATE_REVOKED;
        row.updatedAt = new Date();
        row.updatedByUserId = actor.id;
      }
      await tx.flush();
      for (const policy of dto.policies) {
        this.repo.create(
          tx,
          tenantId,
          {
            scopeConceptId: SCOPE_CONCEPT[policy.scope],
            roleCode: policy.scope === 'ROLE' ? policy.roleCode : undefined,
            idleTimeoutMinutes: policy.idleTimeoutMinutes,
            newDeviceAlert: policy.newDeviceAlert,
            allowedHours: policy.allowedHours,
            enforceIpRules: policy.enforceIpRules,
            requireMfa: policy.requireMfa,
          },
          CONCEPTS.STATE_ACTIVE,
          actor.id,
        );
      }
      await tx.flush();
      this.logger.info(
        {
          operation: 'iam.session_policies.put',
          tenantId,
          count: dto.policies.length,
        },
        'Session policies replaced',
      );
      return { policies: dto.policies };
    });
  }

  /**
   * Reglas de sesión efectivas de una persona: las más estrictas de las
   * políticas que le aplican en las organizaciones donde es miembro.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantIds - Organizaciones con membresía activa.
   * @param roles - Roles de la persona.
   * @returns Las reglas efectivas (sin reglas si ninguna política aplica).
   */
  async rulesFor(
    em: EntityManager,
    tenantIds: readonly string[],
    roles: readonly string[],
    scopedRoles?: Readonly<Record<string, readonly string[]>>,
  ): Promise<EffectiveSessionRules> {
    const rows = await this.repo.findByTenants(
      em,
      tenantIds,
      CONCEPTS.STATE_ACTIVE,
    );
    // Cada política se evalúa con los roles que la persona tiene en SU
    // organización: un rol que solo rige en otra no la activa.
    const byTenant = tenantIds.map((tenantId) => ({
      tenantId,
      applicable: applicablePolicies(
        rows.filter((r) => r.tenantId === tenantId).map(toFacts),
        rolesInTenant(roles, scopedRoles, tenantId),
      ),
    }));
    const effective = strictestRules(byTenant.flatMap((t) => t.applicable));
    // Las reglas de red son de cada organización: se recuerda en cuáles aplican.
    const ipRuleTenantIds = byTenant
      .filter((t) => t.applicable.some((p) => p.enforceIpRules))
      .map((t) => t.tenantId);
    // El desglose por organización es lo que decide el acceso: la política de X
    // rige solo cuando la persona actúa en X.
    const perTenant: Record<string, TenantSessionRules> = {};
    for (const { tenantId, applicable } of byTenant) {
      if (applicable.length === 0) continue;
      perTenant[tenantId] = strictestRules(applicable);
    }
    return {
      ...effective,
      ipRuleTenantIds,
      tenantIds: [...tenantIds],
      byTenant: perTenant,
    };
  }

  /**
   * Retira todas las políticas activas de una organización (ruta de rescate de
   * plataforma): quedan como histórico, no se borran.
   *
   * @param tenantId - Organización.
   * @param actorUserId - Quien ejecuta el rescate.
   * @returns Cuántas políticas se retiraron.
   */
  async clearForTenant(tenantId: string, actorUserId: string): Promise<number> {
    return this.em.transactional(async (tx) => {
      const current = await this.repo.findByTenant(
        tx,
        tenantId,
        CONCEPTS.STATE_ACTIVE,
      );
      for (const row of current) {
        row.statusConceptId = CONCEPTS.STATE_REVOKED;
        row.updatedAt = new Date();
        row.updatedByUserId = actorUserId;
      }
      await tx.flush();
      this.logger.warn(
        {
          operation: 'iam.session_policies.rescue',
          tenantId,
          retired: current.length,
        },
        'Session policies retired by platform rescue',
      );
      return current.length;
    });
  }

  /**
   * Nadie se encierra afuera de su propia organización al guardar políticas:
   * si alguna aplicable a quien guarda tiene franja horaria, debe estar dentro
   * AHORA; si alguna exige las reglas de red, su origen debe seguir dentro de
   * las reglas vigentes y de las que entran en vigor después.
   */
  private async assertActorKeepsAccess(
    policies: readonly SessionPolicyDto[],
    actor: AuthenticatedUser,
    tenantId: string,
    ip: string | undefined,
  ): Promise<void> {
    const applicable = applicablePolicies(
      policies.map(toFactsOfDto),
      rolesInTenant(actor.roles ?? [], actor.scopedRoles, tenantId),
    );
    const now = new Date();
    const outsideHours = applicable.some(
      (p) => p.allowedHours && !isWithinAllowedHours(p.allowedHours, now),
    );
    if (outsideHours) {
      throw new PreconditionFailedException(
        'Esta política dejaría fuera el horario en el que está trabajando',
        undefined,
        IamErrorReason.SESSION_POLICY_WOULD_LOCK_OUT_ACTOR,
      );
    }
    if (applicable.some((p) => p.enforceIpRules)) {
      await this.ipRules.assertActorKeepsStoredRules(
        this.em.fork(),
        tenantId,
        ip,
      );
    }
  }

  /**
   * Una franja que no admite a nadie (`from == to`) o que dura menos de 4 horas
   * es un cierre de la organización disfrazado de horario: se rechaza al guardar.
   */
  private assertUsableBand(hours: AllowedHours): void {
    const minutes = allowedHoursDuration(hours);
    if (minutes === 0) {
      throw new PreconditionFailedException(
        'La franja horaria no admite a nadie: la hora de inicio y la de fin son iguales',
        { from: hours.from, to: hours.to },
        IamErrorReason.SESSION_POLICY_HOURS_EMPTY,
      );
    }
    if (minutes < MIN_ALLOWED_HOURS_MINUTES) {
      throw new PreconditionFailedException(
        'La franja horaria debe durar al menos 4 horas',
        {
          from: hours.from,
          to: hours.to,
          minimumMinutes: MIN_ALLOWED_HOURS_MINUTES,
        },
        IamErrorReason.SESSION_POLICY_HOURS_TOO_SHORT,
      );
    }
  }

  /** Una política con alcance `ROLE` necesita su rol; el resto no admite uno. */
  private assertCoherent(policies: readonly SessionPolicyDto[]): void {
    const seen = new Set<string>();
    for (const p of policies) {
      const zone = p.allowedHours?.timeZone;
      if (zone !== undefined && !isValidTimeZone(zone)) {
        throw new DomainException(
          HttpStatus.BAD_REQUEST,
          ErrorCode.VALIDATION_FAILED,
          'La zona horaria no es válida: use un nombre IANA como America/La_Paz',
          { timeZone: zone },
        );
      }
      if (p.allowedHours) this.assertUsableBand(p.allowedHours);
      const key = `${p.scope}:${p.roleCode ?? ''}`;
      const bad =
        (p.scope === 'ROLE') !== !!p.roleCode || seen.has(key)
          ? 'El alcance ROLE exige roleCode, los demás no lo admiten, y no se repite un alcance'
          : undefined;
      if (bad) {
        throw new DomainException(
          HttpStatus.BAD_REQUEST,
          ErrorCode.VALIDATION_FAILED,
          bad,
          { scope: p.scope },
        );
      }
      seen.add(key);
    }
  }
}

/** Hechos de una política del cuerpo de la petición. */
function toFactsOfDto(policy: SessionPolicyDto): SessionPolicyFacts {
  return {
    scope: policy.scope,
    roleCode: policy.roleCode,
    idleTimeoutMinutes: policy.idleTimeoutMinutes,
    newDeviceAlert: policy.newDeviceAlert,
    allowedHours: policy.allowedHours,
    enforceIpRules: policy.enforceIpRules,
    requireMfa: policy.requireMfa,
  };
}

/** Vista de una fila. */
function toDto(row: SessionPolicies): SessionPolicyDto {
  const hours = row.allowedHoursJson as AllowedHours | undefined;
  return {
    scope: SCOPE_BY_CONCEPT[row.scopeConceptId] ?? 'ALL_ACCOUNTS',
    roleCode: row.roleCode,
    idleTimeoutMinutes: row.idleTimeoutMinutes,
    newDeviceAlert: row.newDeviceAlert,
    allowedHours: hours
      ? {
          days: hours.days ? [...hours.days] : undefined,
          from: hours.from,
          to: hours.to,
          timeZone: hours.timeZone,
        }
      : undefined,
    enforceIpRules: row.enforceIpRules,
    requireMfa: row.requireMfa,
  };
}

/** Hechos de una fila para la evaluación pura. */
function toFacts(row: SessionPolicies): SessionPolicyFacts {
  const dto = toDto(row);
  return {
    scope: dto.scope,
    roleCode: dto.roleCode,
    idleTimeoutMinutes: dto.idleTimeoutMinutes,
    newDeviceAlert: dto.newDeviceAlert,
    allowedHours: dto.allowedHours,
    enforceIpRules: dto.enforceIpRules,
    requireMfa: dto.requireMfa,
  };
}
