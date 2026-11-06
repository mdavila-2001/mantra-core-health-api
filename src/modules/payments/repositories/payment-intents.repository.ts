import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PaymentIntents } from '../entities';
import { CONCEPTS, ConflictException, createdBy } from '../../../common';
import { PaymentsErrorReason } from '../payments.error-reasons';

/** Alta de una intención de pago (UC-42-01). */
export interface CreateIntentData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a practice.
   */
  practiceId?: string;
  /**
   * Identificador asociado a gateway.
   */
  gatewayId: string;
  /**
   * Identificador asociado a gateway connection.
   */
  gatewayConnectionId?: string;
  /**
   * Identificador asociado a purpose concept.
   */
  purposeConceptId: string;
  /**
   * Identificador asociado a invoice.
   */
  invoiceId?: string;
  /**
   * Valor de source ref type mantenido por la instancia.
   */
  sourceRefType?: string;
  /**
   * Identificador asociado a source ref.
   */
  sourceRefId?: string;
  /**
   * Valor de amount mantenido por la instancia.
   */
  amount: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId: string;
  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  idempotencyKey: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de expires at mantenido por la instancia.
   */
  expiresAt?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `payments.payment_intents`. */
@Injectable()
export class PaymentIntentsRepository {
  /** Crea la intención sin flush; el caller controla la transacción. */
  create(em: EntityManager, data: CreateIntentData): PaymentIntents {
    return em.create(
      PaymentIntents,
      {
        tenantId: data.tenantId,
        practiceId: data.practiceId,
        gatewayId: data.gatewayId,
        gatewayConnectionId: data.gatewayConnectionId,
        purposeConceptId: data.purposeConceptId,
        invoiceId: data.invoiceId,
        sourceRefType: data.sourceRefType,
        sourceRefId: data.sourceRefId,
        amount: data.amount,
        currencyConceptId: data.currencyConceptId,
        idempotencyKey: data.idempotencyKey,
        statusConceptId: data.statusConceptId,
        expiresAt: data.expiresAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<PaymentIntents | null>`.
   */
  findById(em: EntityManager, id: string): Promise<PaymentIntents | null> {
    return em.findOne(PaymentIntents, { id });
  }

  /**
   * Reintento idempotente: la UNIQUE sobre `idempotency_key` es la garantía real
   * contra el doble cobro; esta lectura permite devolver el intent existente con
   * un 200 en vez de dejar que la constraint reviente con un 409.
   */
  findByIdempotencyKey(
    em: EntityManager,
    tenantId: string,
    idempotencyKey: string,
  ): Promise<PaymentIntents | null> {
    return em.findOne(PaymentIntents, { tenantId, idempotencyKey });
  }

  /**
   * `SELECT ... FOR UPDATE` sobre el intent. El caso de uso lo exige antes de
   * mutarlo (fx-lock, riesgo, transacción) porque el bloqueo optimista de
   * `row_version` detecta el conflicto pero no lo evita: aquí se serializan los
   * escritores concurrentes en vez de dejar que uno falle al hacer flush.
   */
  findByIdForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<PaymentIntents | null> {
    return em.findOne(
      PaymentIntents,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * `SELECT ... FOR UPDATE` de la intención **de ese tenant**. El `tenant_id` va en
   * el mismo `WHERE` que el `id`: PostgreSQL sólo bloquea las filas que cumplen el
   * `WHERE`, así que una intención de OTRO tenant no se bloquea ni se espera —
   * responde `null` al instante, igual que un UUID inexistente—. Cargar por `id`
   * con `FOR UPDATE` y comparar el tenant después hacía que la fila ajena, si
   * estaba bloqueada por su dueño, retrasara la respuesta: un oráculo de
   * existencia por tiempo (N7 de la re-revisión) que además tomaba un bloqueo
   * momentáneo sobre la intención de otro tenant.
   */
  findByIdAndTenantForUpdate(
    em: EntityManager,
    id: string,
    tenantId: string,
  ): Promise<PaymentIntents | null> {
    return em.findOne(
      PaymentIntents,
      { id, tenantId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Intenciones del tenant con una marca de despacho y sin terminar: las que
   * tienen (o pueden tener) un cobro en la pasarela que la API todavía no asoció.
   * Quien las pide decide cuáles requieren conciliación según la fecha de la marca.
   */
  findDispatchMarksByTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<PaymentIntents[]> {
    return em.find(PaymentIntents, {
      tenantId,
      gatewayIntentRef: { $like: 'dispatching:%' },
      statusConceptId: { $in: [CONCEPTS.PI_PENDING, CONCEPTS.PI_PROCESSING] },
    });
  }

  /**
   * Intención asociada a un cobro de la pasarela (`pi_…`), con `FOR UPDATE`, y
   * deja la transacción **fijada al tenant de esa intención**.
   *
   * La referencia es única por cobro de la pasarela (se asocia una sola vez y
   * la pasarela no repite ids); el bloqueo serializa los webhooks concurrentes
   * del mismo cobro.
   *
   * El receptor de webhooks es `@Public()`: no hay actor ni, por tanto,
   * `app.current_tenant_id` (el `TenantContextInterceptor` devuelve antes de
   * fijarlo), y la política `tenant_isolation` es fail-closed, así que con un rol
   * sin `BYPASSRLS` la intención sería invisible. Se resuelve así, sin confiar en
   * nada que venga del cuerpo y **sólo después de haber verificado la firma**
   * (lo garantiza el servicio, que llama a este método tras `verify`):
   *
   * 1. una única consulta, mínima (`id` y `tenant_id` de las filas con esa
   *    referencia), bajo la elevación SYSTEM local a la transacción, que se baja
   *    en cuanto la consulta termina;
   * 2. con el tenant del dueño resuelto, se fija `app.current_tenant_id` y todo
   *    lo demás (el bloqueo de la intención, la deuda, las sesiones) corre
   *    acotado a ese tenant por la propia base.
   *
   * Si la referencia la tienen intenciones de más de un tenant (el DDL no impone
   * UNIQUE sobre `gateway_intent_ref`), no se elige una: falla cerrado con `409`.
   * Las variables se fijan con `set_config(..., true)`: viven sólo en esta
   * transacción y no se filtran a la conexión del pool.
   *
   * @throws ConflictException si la referencia pertenece a más de una intención.
   */
  async findByGatewayIntentRefForUpdate(
    em: EntityManager,
    gatewayIntentRef: string,
  ): Promise<PaymentIntents | null> {
    await em.execute("select set_config('app.system_context', 'true', true)");
    const owners = await em.execute<{ id: string; tenant_id: string }[]>(
      'select id, tenant_id from payments.payment_intents where gateway_intent_ref = ? limit 2',
      [gatewayIntentRef],
    );
    await em.execute("select set_config('app.system_context', 'false', true)");

    if (owners.length === 0) return null;
    if (owners.length > 1) {
      throw new ConflictException(
        'La referencia del cobro de la pasarela corresponde a más de una intención',
        undefined,
        PaymentsErrorReason.GATEWAY_WEBHOOK_INTENT_REF_AMBIGUOUS,
      );
    }

    const tenantId = owners[0].tenant_id;
    await em.execute("select set_config('app.current_tenant_id', ?, true)", [
      tenantId,
    ]);
    return em.findOne(
      PaymentIntents,
      { gatewayIntentRef, tenantId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }
}
