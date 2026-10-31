import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, touch, type AuthenticatedUser } from '../../../common';
import { OutboxService } from '../../messaging/services/outbox.service';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import {
  SUPPORT_CONDITION_SCHEMA_VERSION,
  SUPPORT_TEMPLATE_CODES,
  atomMeta,
  expandAtomPattern,
  deviceCookieEnabledFromEnv,
  validateCondition,
  type ConditionError,
} from '../domain';
import {
  GOVERNANCE_PATTERN_REGEX,
  type CreateGovernanceRuleDto,
  type GovernanceRuleKind,
  type GovernanceRuleViewDto,
  type ListGovernanceRulesQueryDto,
  type ListGovernanceRulesResponseDto,
  type RetireRuleDto,
  type UpdateGovernanceRuleDto,
} from '../dto';
import type { GovernanceRules } from '../entities';
import { GovernanceRulesRepository } from '../repositories';
import { DelegationScopeService } from './delegation-scope.service';
import { afterCommit } from './governance-after-commit';
import { governanceError } from './governance-errors';
import { mapGovernanceDbError } from './governance-db-errors';
import { GovernanceStepUpGate } from './governance-step-up.gate';
import { SupportGovernanceRules } from './support-governance-rules.reader';

const KIND_CONCEPT: Readonly<Record<GovernanceRuleKind, string>> = {
  DENY_PERMISSION: DELEG.GOV_RULE_DENY_PERMISSION,
  CEILING: DELEG.GOV_RULE_CEILING,
  REQUIRE_CONDITION: DELEG.GOV_RULE_REQUIRE_CONDITION,
  FIELD_FLOOR: DELEG.GOV_RULE_FIELD_FLOOR,
};
const KIND_BY_CONCEPT = new Map<string, GovernanceRuleKind>(
  Object.entries(KIND_CONCEPT).map(([kind, id]) => [
    id,
    kind as GovernanceRuleKind,
  ]),
);

/** Cuerpo de una regla ya validado y listo para guardar. */
interface RuleBody {
  readonly ruleJson?: Record<string, unknown>;
  readonly ruleSchemaVersion?: number;
  readonly messageText?: string;
}

/**
 * Reglas de la organización (L1) — `governance_rules`, CONTRATO-GOBIERNO §4.3.
 *
 * Solo RESTRINGEN: el validador rechaza lo que afloje la plataforma. Cada
 * escritura exige el paso extra, deja el evento del outbox (solo ids) y
 * **invalida la caché de reglas de la política** después de confirmar, para que
 * el efecto sea inmediato (caso G-02). Una regla nunca se borra: se retira
 * (`REVOKED` + `valid_to`).
 *
 * Una regla `DENY_PERMISSION` no puede dejar a la organización sin ningún
 * `SECURITY_ADMIN`: los administradores no pasan por la política de apoyo, así
 * que ninguna regla de este servicio los alcanza.
 */
@Injectable()
export class GovernanceRulesService {
  /**
   * @param em - Contexto de persistencia.
   * @param repo - Reglas de la organización.
   * @param rulesCache - Caché de reglas que lee la política (se invalida al escribir).
   * @param stepUp - Paso extra de la sesión.
   * @param outbox - Eventos de dominio.
   * @param scope - Organización activa verificada.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: GovernanceRulesRepository,
    private readonly rulesCache: SupportGovernanceRules,
    private readonly stepUp: GovernanceStepUpGate,
    private readonly outbox: OutboxService,
    private readonly scope: DelegationScopeService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(GovernanceRulesService.name);
  }

  /**
   * Reglas de la organización (activas y retiradas).
   *
   * @param query - Filtro opcional por tipo y estado.
   * @returns La lista en orden estable.
   */
  async list(
    query: ListGovernanceRulesQueryDto,
  ): Promise<ListGovernanceRulesResponseDto> {
    const tenantId = this.scope.resolveTenant();
    const rows = await this.repo.findByTenant(
      this.em.fork({ keepTransactionContext: true }),
      tenantId,
      {
        ...(query.kind ? { kindConceptId: KIND_CONCEPT[query.kind] } : {}),
        ...(query.status
          ? {
              statusConceptId:
                query.status === 'ACTIVE'
                  ? CONCEPTS.STATE_ACTIVE
                  : CONCEPTS.STATE_REVOKED,
            }
          : {}),
      },
    );
    const items = rows.map(toView);
    return { items, count: items.length };
  }

  /**
   * Crea una regla activa.
   *
   * @param dto - Tipo, plantilla, patrón y cuerpo.
   * @param actor - Quien la crea (paso extra obligatorio).
   * @returns La regla creada.
   */
  async create(
    dto: CreateGovernanceRuleDto,
    actor: AuthenticatedUser,
  ): Promise<GovernanceRuleViewDto> {
    const tenantId = this.scope.resolveTenant();
    const body = this.validateBody(dto);
    this.logger.info(
      {
        operation: 'delegated_access.governance_rule.create',
        tenantId,
        actorId: actor.id,
        kind: dto.kind,
      },
      'Creating governance rule',
    );
    const view = await this.em.transactional(async (tx) => {
      await this.stepUp.assertFresh(tx, actor);
      const kindConceptId = KIND_CONCEPT[dto.kind];
      const active = await this.repo.findByTenant(tx, tenantId, {
        kindConceptId,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      });
      if (
        active.some(
          (r) =>
            (r.roleTemplateCode ?? '') === (dto.roleTemplateCode ?? '') &&
            r.permissionPattern === dto.permissionPattern,
        )
      ) {
        throw governanceError(
          Reason.GOVERNANCE_RULE_DUPLICATE,
          'Ya existe una regla activa igual a esta. Retírela o edítela.',
        );
      }
      const row = this.repo.create(tx, {
        tenantId,
        ruleKindConceptId: kindConceptId,
        roleTemplateCode: dto.roleTemplateCode,
        permissionPattern: dto.permissionPattern,
        ruleJson: body.ruleJson,
        ruleSchemaVersion: body.ruleSchemaVersion,
        messageText: body.messageText,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        actorUserId: actor.id,
      });
      await this.flush(tx);
      await this.outbox.publishDomainEvent(tx, {
        tenantId,
        eventType: 'delegated_access.governance_rule.created',
        aggregateType: 'governance_rule',
        aggregateId: row.id,
        payloadJson: { ruleId: row.id, tenantId, kind: dto.kind },
        actorUserId: actor.id,
      });
      return toView(row);
    });
    // Confirmada la escritura (el commit REAL, no el del savepoint): el efecto es inmediato.
    this.invalidateAfterCommit(tenantId);
    return view;
  }

  /**
   * Edita mensaje, condición, piso o vigencia de una regla activa. El tipo, la
   * plantilla y el patrón no cambian (se retira y se crea otra).
   *
   * @param id - Regla.
   * @param dto - Cambios y `expectedRowVersion`.
   * @param actor - Quien la edita (paso extra obligatorio).
   * @returns La regla editada.
   */
  async update(
    id: string,
    dto: UpdateGovernanceRuleDto,
    actor: AuthenticatedUser,
  ): Promise<GovernanceRuleViewDto> {
    const tenantId = this.scope.resolveTenant();
    const view = await this.em.transactional(async (tx) => {
      await this.stepUp.assertFresh(tx, actor);
      const row = await this.load(tx, tenantId, id);
      if (row.rowVersion !== dto.expectedRowVersion) {
        throw governanceError(
          Reason.ROW_VERSION_CONFLICT,
          'La regla cambió mientras la editaba: vuelva a abrirla.',
          { rowVersion: row.rowVersion },
        );
      }
      if (row.statusConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw governanceError(
          Reason.GOVERNANCE_RULE_INVALID,
          'Una regla retirada no se edita: cree una nueva.',
        );
      }
      const kind = KIND_BY_CONCEPT.get(row.ruleKindConceptId);
      if (!kind) {
        throw governanceError(
          Reason.GOVERNANCE_RULE_INVALID,
          'Tipo de regla desconocido.',
        );
      }
      const current = (row.ruleJson ?? {}) as Record<string, unknown>;
      const body = this.validateBody({
        kind,
        roleTemplateCode: row.roleTemplateCode,
        permissionPattern: row.permissionPattern,
        message: dto.message ?? row.messageText,
        condition:
          dto.condition ??
          (current.condition as Record<string, unknown> | undefined),
        maxVisibility:
          dto.maxVisibility ??
          (current.maxVisibility as CreateGovernanceRuleDto['maxVisibility']),
      });
      row.ruleJson = body.ruleJson;
      row.ruleSchemaVersion = body.ruleSchemaVersion;
      row.messageText = body.messageText;
      if (dto.validFrom !== undefined) row.validFrom = new Date(dto.validFrom);
      if (dto.validTo !== undefined) row.validTo = new Date(dto.validTo);
      touch(row, actor.id);
      await this.flush(tx);
      return toView(row);
    });
    this.invalidateAfterCommit(tenantId);
    return view;
  }

  /**
   * Retira una regla (nunca se borra). Idempotente.
   *
   * @param id - Regla.
   * @param dto - Motivo opcional.
   * @param actor - Quien la retira (paso extra obligatorio).
   * @returns La regla retirada.
   */
  async retire(
    id: string,
    dto: RetireRuleDto,
    actor: AuthenticatedUser,
  ): Promise<GovernanceRuleViewDto> {
    const tenantId = this.scope.resolveTenant();
    const view = await this.em.transactional(async (tx) => {
      await this.stepUp.assertFresh(tx, actor);
      const row = await this.load(tx, tenantId, id);
      if (row.statusConceptId === CONCEPTS.STATE_REVOKED) return toView(row);
      this.repo.retire(row, actor.id, new Date());
      await this.flush(tx);
      await this.outbox.publishDomainEvent(tx, {
        tenantId,
        eventType: 'delegated_access.governance_rule.retired',
        aggregateType: 'governance_rule',
        aggregateId: row.id,
        payloadJson: { ruleId: row.id, tenantId, hasReason: !!dto.reason },
        actorUserId: actor.id,
      });
      return toView(row);
    });
    this.invalidateAfterCommit(tenantId);
    return view;
  }

  /**
   * V-4: la invalidación (y el aviso por Redis a las demás réplicas) sale DESPUÉS
   * del commit real. Dentro de la transacción de la petición (RLS) el
   * `transactional` de este servicio es un savepoint y confirmar aún no ocurrió.
   */
  private invalidateAfterCommit(tenantId: string): void {
    afterCommit(this.em, () => this.rulesCache.invalidate(tenantId));
  }

  /** Valida la forma de la regla según su tipo y arma lo que se guarda. */
  private validateBody(dto: CreateGovernanceRuleDto): RuleBody {
    const invalid = (message: string): never => {
      throw governanceError(Reason.GOVERNANCE_RULE_INVALID, message);
    };
    if (!GOVERNANCE_PATTERN_REGEX.test(dto.permissionPattern)) {
      invalid('El patrón debe ser un permiso o un prefijo terminado en .*');
    }
    const atoms = expandAtomPattern(dto.permissionPattern);
    if (atoms.length === 0) {
      invalid('El patrón no corresponde a ningún permiso del catálogo.');
    }
    if (
      dto.roleTemplateCode &&
      !(SUPPORT_TEMPLATE_CODES as readonly string[]).includes(
        dto.roleTemplateCode,
      )
    ) {
      invalid('La plantilla indicada no existe.');
    }
    switch (dto.kind) {
      case 'DENY_PERMISSION':
        return {
          ruleJson: dto.message ? { message: dto.message } : {},
          messageText: dto.message,
        };
      case 'CEILING':
        if (!dto.roleTemplateCode) {
          invalid('Un techo se define para una plantilla: indíquela.');
        }
        return { ruleJson: {} };
      case 'FIELD_FLOOR': {
        if (!dto.maxVisibility)
          invalid('Indique hasta cuánto se puede ver el campo.');
        if (!atoms.every((a) => atomMeta(a)?.isFieldLevel)) {
          invalid('Un piso de campo aplica solo a permisos de campo.');
        }
        return { ruleJson: { maxVisibility: dto.maxVisibility } };
      }
      case 'REQUIRE_CONDITION': {
        if (dto.appliesTo !== undefined && dto.appliesTo !== 'ALL') {
          throw governanceError(
            Reason.GUARDRAIL_RULE_LOOSENS_PLATFORM,
            'Una regla de la organización solo puede restringir: debe aplicar a todo permiso que incluya el átomo.',
          );
        }
        if (!dto.condition) invalid('Indique la condición que se exige.');
        const errors = validateCondition(dto.condition, {
          effect: 'ALLOW',
          grantAtoms: atoms,
          deviceCookieEnabled: deviceCookieEnabledFromEnv(process.env),
        });
        if (errors.length > 0) throw conditionError(errors);
        return {
          ruleJson: { condition: dto.condition, appliesTo: 'ALL' },
          ruleSchemaVersion: SUPPORT_CONDITION_SCHEMA_VERSION,
        };
      }
    }
  }

  private async load(
    tx: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<GovernanceRules> {
    const row = await this.repo.findById(tx, tenantId, id);
    if (!row) {
      throw governanceError(
        Reason.GOVERNANCE_RULE_NOT_FOUND,
        'Regla no encontrada.',
      );
    }
    return row;
  }

  private async flush(tx: EntityManager): Promise<void> {
    try {
      await tx.flush();
    } catch (err) {
      throw mapGovernanceDbError(err) ?? err;
    }
  }
}

/** Primer error de condición como excepción (todos viajan en `details.errors`). */
export function conditionError(errors: readonly ConditionError[]): Error {
  const first = errors[0];
  return governanceError(first.code as unknown as Reason, first.message, {
    errors: errors.map((e) => ({
      code: e.code,
      path: e.path,
      message: e.message,
    })),
  });
}

function toView(row: GovernanceRules): GovernanceRuleViewDto {
  const json = (row.ruleJson ?? {}) as Record<string, unknown>;
  const condition = json.condition;
  return {
    id: row.id,
    kind: KIND_BY_CONCEPT.get(row.ruleKindConceptId) ?? 'DENY_PERMISSION',
    status:
      row.statusConceptId === CONCEPTS.STATE_ACTIVE ? 'ACTIVE' : 'REVOKED',
    ...(row.roleTemplateCode ? { roleTemplateCode: row.roleTemplateCode } : {}),
    permissionPattern: row.permissionPattern,
    ...(row.messageText ? { message: row.messageText } : {}),
    ...(condition && typeof condition === 'object'
      ? { condition: condition as Record<string, unknown> }
      : {}),
    ...(typeof json.maxVisibility === 'string'
      ? { maxVisibility: json.maxVisibility }
      : {}),
    ...(row.validFrom ? { validFrom: row.validFrom } : {}),
    ...(row.validTo ? { validTo: row.validTo } : {}),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    rowVersion: row.rowVersion,
  };
}
