/**
 * Contratos TypeScript de las columnas jsonb de `booking_confirmation_rules`.
 *
 * Viven en un archivo propio, no en la entidad: el cuerpo de la entidad lo
 * regenera `salud-db/gen_entities.py` (ADR-0022) y todo lo que no sea la clase
 * se perdería en la siguiente corrida. El barrel los re-exporta, así los
 * consumidores siguen importando de '../entities'.
 */

/**
 * Nodo de la gramática mínima de condiciones (fail-closed). Una condición es o
 * bien una comparación hoja `{ field, op, value }`, o bien un combinador lógico
 * `{ all|any: Condition[] }` / `{ not: Condition }`. Cualquier forma que no encaje
 * se considera NO satisfecha (la regla no aplica).
 */
export type RuleCondition =
  | {
      /**
       * Valor de field mantenido por la instancia.
       */
      field: string; /**
       * Valor de op mantenido por la instancia.
       */
      op: string; /**
       * Valor de value mantenido por la instancia.
       */
      value?: unknown;
    }
  | {
      /**
       * Valor de all mantenido por la instancia.
       */
      all: RuleCondition[];
    }
  | {
      /**
       * Valor de any mantenido por la instancia.
       */
      any: RuleCondition[];
    }
  | {
      /**
       * Valor de not mantenido por la instancia.
       */
      not: RuleCondition;
    };

/**
 * Regla determinista del motor de confirmación automática de reservas (C-11).
 *
 * Las reglas no se borran en duro: se desactivan (`enabled=false`) y versionan
 * (`version`), de modo que el historial de qué regla decidió una reserva se
 * mantiene reproducible. La evaluación filtra por alcance y vigencia, ordena por
 * especificidad y prioridad, y aplica la primera regla concluyente.
 */
