import { randomUUID } from 'node:crypto';
import {
  Inject,
  Injectable,
  Optional,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { type GovernanceRuleFacts, type SupportCondition } from '../domain';
import { DELEG } from '../delegated_access.concepts';
import { GovernanceRulesRepository } from '../repositories';
import {
  REDIS_CLIENT,
  type RedisClient,
} from '../../redis_runtime/redis.provider';
import type { GovernanceRules } from '../entities';

/** Vida por defecto de la caché de reglas por organización. */
export const GOVERNANCE_RULES_CACHE_TTL_SEC = 30;

/**
 * Tope de la vida de la caché aunque el ajuste pida más (SEG A-M8). Una regla
 * `DENY_PERMISSION` que responde a un incidente no puede tardar una hora en
 * llegar a las demás réplicas: con la invalidación por Redis caída, este tope es
 * el peor caso.
 */
export const GOVERNANCE_RULES_CACHE_MAX_TTL_SEC = 60;

/**
 * Cuánto tiempo, como máximo, se sirve la última lista conocida si la lectura
 * falla (SEG A-M8). Pasado este tope el error sale y la decisión falla cerrada:
 * no se siguen aplicando reglas viejas indefinidamente.
 */
export const GOVERNANCE_RULES_STALE_MAX_SEC = 300;

/** Canal Redis por el que una réplica avisa a las demás que cambió una regla. */
export const GOVERNANCE_RULES_INVALIDATE_CHANNEL =
  'delegated_access:governance_rules:invalidate';

/** Condición que ningún motor entiende: una regla `REQUIRE_CONDITION` rota cierra (no abre). */
const UNREADABLE_CONDITION: SupportCondition = { schemaVersion: -1 };
const FLOORS = new Set(['PARTIAL', 'REDACT', 'NULLIFY']);

/**
 * TTL de la caché (`SUPPORT_GOVERNANCE_RULES_CACHE_TTL_SEC`), con tope de
 * {@link GOVERNANCE_RULES_CACHE_MAX_TTL_SEC}; lo no entero o negativo deja el de siempre.
 */
export function rulesCacheTtlSeconds(
  env: Readonly<Record<string, string | undefined>>,
): number {
  const raw = env.SUPPORT_GOVERNANCE_RULES_CACHE_TTL_SEC;
  if (raw === undefined || raw.trim() === '')
    return GOVERNANCE_RULES_CACHE_TTL_SEC;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0)
    return GOVERNANCE_RULES_CACHE_TTL_SEC;
  return Math.min(parsed, GOVERNANCE_RULES_CACHE_MAX_TTL_SEC);
}

/** Fila de regla → hecho de la política; `undefined` si la regla no actúa al decidir (`CEILING`). */
export function toRuleFacts(
  row: GovernanceRules,
): GovernanceRuleFacts | undefined {
  const json = (
    row.ruleJson && typeof row.ruleJson === 'object' ? row.ruleJson : {}
  ) as Record<string, unknown>;
  const base = {
    id: row.id,
    roleTemplateCode: row.roleTemplateCode ?? null,
    permissionPattern: row.permissionPattern,
  };
  switch (row.ruleKindConceptId) {
    case DELEG.GOV_RULE_DENY_PERMISSION:
      return {
        ...base,
        kind: 'DENY_PERMISSION',
        ...(row.messageText || typeof json.message === 'string'
          ? { message: row.messageText ?? (json.message as string) }
          : {}),
      };
    case DELEG.GOV_RULE_REQUIRE_CONDITION: {
      const condition = json.condition;
      const readable =
        !!condition &&
        typeof condition === 'object' &&
        !Array.isArray(condition);
      return {
        ...base,
        kind: 'REQUIRE_CONDITION',
        condition: readable
          ? (condition as SupportCondition)
          : UNREADABLE_CONDITION,
      };
    }
    case DELEG.GOV_RULE_FIELD_FLOOR: {
      const floor =
        typeof json.maxVisibility === 'string' ? json.maxVisibility : '';
      return {
        ...base,
        kind: 'FIELD_FLOOR',
        // Un piso ilegible falla cerrado: el campo sale anulado.
        maxVisibility: (FLOORS.has(floor) ? floor : 'NULLIFY') as
          'PARTIAL' | 'REDACT' | 'NULLIFY',
      };
    }
    default:
      return undefined;
  }
}

/**
 * Reglas de la organización (L1) que la política aplica en cada decisión
 * (`DENY_PERMISSION`, `REQUIRE_CONDITION`, `FIELD_FLOOR`; las `CEILING` actúan al
 * escribir). Caché por organización con TTL de 30 s (tope de 60 s); quien
 * ESCRIBE una regla llama a {@link SupportGovernanceRules.invalidate}: el efecto
 * es inmediato en esa réplica y se avisa a las demás por Redis pub/sub
 * (SEG A-M8). Sin Redis, o si falla, el TTL acotado es el respaldo.
 *
 * Una caída de la lectura NO abre nada: si hay caché vencida se usa la última
 * conocida solo hasta {@link GOVERNANCE_RULES_STALE_MAX_SEC} para no dejar sin
 * servicio; pasado ese tope el error sale (falla cerrado), nunca una lista vacía
 * inventada.
 */
@Injectable()
export class SupportGovernanceRules implements OnModuleInit, OnModuleDestroy {
  private readonly cache = new Map<
    string,
    { at: number; rules: readonly GovernanceRuleFacts[] }
  >();
  /** Identifica a esta réplica en los avisos (para no reaccionar a los propios). */
  private readonly replicaId = randomUUID();
  private subscriber?: RedisClient;

  /**
   * @param repo - Reglas de gobierno de la organización.
   * @param logger - Logger estructurado.
   * @param redis - Cliente compartido para avisar a las demás réplicas; ausente
   *   en pruebas y en el generador OpenAPI.
   */
  constructor(
    private readonly repo: GovernanceRulesRepository,
    private readonly logger: PinoLogger,
    @Optional() @Inject(REDIS_CLIENT) private readonly redis?: RedisClient,
  ) {
    this.logger.setContext(SupportGovernanceRules.name);
  }

  /** Se suscribe a los avisos de las otras réplicas (mejor esfuerzo). */
  async onModuleInit(): Promise<void> {
    if (!this.redis) return;
    let subscriber: RedisClient | undefined;
    try {
      subscriber = this.redis.duplicate();
      subscriber.on('error', () => undefined);
      subscriber.on('message', (_channel: string, message: string) =>
        this.onRemoteInvalidation(message),
      );
      await subscriber.subscribe(GOVERNANCE_RULES_INVALIDATE_CHANNEL);
      this.subscriber = subscriber;
    } catch (err) {
      // Sin Redis no se deja una conexión reintentando en segundo plano.
      try {
        subscriber?.disconnect?.();
      } catch {
        // Cierre de mejor esfuerzo.
      }
      this.logger.warn(
        {
          operation: 'delegated_access.governance_rules.subscribe',
          err: err instanceof Error ? err.message : String(err),
        },
        'Sin invalidación entre réplicas: rige el TTL acotado de la caché de reglas',
      );
    }
  }

  /** Cierra la suscripción. */
  async onModuleDestroy(): Promise<void> {
    const subscriber = this.subscriber;
    this.subscriber = undefined;
    if (!subscriber) return;
    try {
      await subscriber.quit();
    } catch {
      // Cierre de mejor esfuerzo.
    }
  }

  /**
   * Reglas vigentes de la organización.
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param tenantId - Organización.
   * @param now - Instante de la decisión.
   * @returns Las reglas que actúan al decidir.
   */
  async forTenant(
    em: EntityManager,
    tenantId: string,
    now: Date,
  ): Promise<readonly GovernanceRuleFacts[]> {
    const ttlMs = rulesCacheTtlSeconds(process.env) * 1000;
    const hit = this.cache.get(tenantId);
    if (hit && now.getTime() - hit.at < ttlMs) return hit.rules;
    try {
      const rows = await this.repo.findActiveForTenant(em, tenantId, now);
      const rules = rows
        .map(toRuleFacts)
        .filter((r): r is GovernanceRuleFacts => !!r);
      this.cache.set(tenantId, { at: now.getTime(), rules });
      return rules;
    } catch (err) {
      if (
        hit &&
        now.getTime() - hit.at <= GOVERNANCE_RULES_STALE_MAX_SEC * 1000
      ) {
        this.logger.warn(
          {
            operation: 'delegated_access.governance_rules.read',
            tenantId,
            err: err instanceof Error ? err.message : String(err),
          },
          'No se pudieron leer las reglas; se usa la última lista conocida',
        );
        return hit.rules;
      }
      throw err;
    }
  }

  /**
   * Descarta la caché de una organización (o de todas) y avisa a las demás
   * réplicas. Lo llama quien crea o retira una regla, para que el efecto sea
   * inmediato.
   *
   * @param tenantId - Organización; sin ella, todas.
   */
  invalidate(tenantId?: string): void {
    this.dropLocal(tenantId);
    if (!this.redis) return;
    try {
      void Promise.resolve(
        this.redis.publish(
          GOVERNANCE_RULES_INVALIDATE_CHANNEL,
          JSON.stringify({
            from: this.replicaId,
            ...(tenantId ? { tenantId } : {}),
          }),
        ),
      ).catch(() => this.warnPublish());
    } catch {
      this.warnPublish();
    }
  }

  private dropLocal(tenantId?: string): void {
    if (tenantId) this.cache.delete(tenantId);
    else this.cache.clear();
  }

  /** Aviso de otra réplica: vacía lo suyo; un mensaje ilegible vacía todo por precaución. */
  private onRemoteInvalidation(message: string): void {
    try {
      const parsed = JSON.parse(message) as {
        from?: unknown;
        tenantId?: unknown;
      };
      if (parsed.from === this.replicaId) return;
      this.dropLocal(
        typeof parsed.tenantId === 'string' ? parsed.tenantId : undefined,
      );
    } catch {
      this.dropLocal();
    }
  }

  private warnPublish(): void {
    this.logger.warn(
      { operation: 'delegated_access.governance_rules.publish' },
      'No se pudo avisar a las otras réplicas del cambio de reglas: rige el TTL acotado de la caché',
    );
  }
}
