# ADR-0030: Condiciones ABAC v1 en las concesiones de apoyo

## Estado

Aceptado (2026-11-02). Contrato: `CONTRATO-GOBIERNO.md` §3 (condiciones) y §4 (capas de denegación).

## Contexto

«Puede cancelar citas» no basta: se necesita «de lunes a viernes, 24 h antes o con aprobación del doctor, hasta
20 por día, sin pacientes VIP, desde la red del hospital». Las columnas `*_json` del modelo que parecían servir
(`role_permissions.constraint_json`, `resource_selector_json`, `condition_json` de políticas) **se guardan y
nunca se leen**; interpretarlas habría cambiado el PDP clínico. Se descartó un motor externo (OPA, Cedar) y un
parser XACML/ALFA: la semántica de referencia es NIST SP 800-162 (atributos de sujeto, recurso, acción y
entorno), pero el motor es propio y pequeño.

## Decisión

1. Las condiciones son un objeto JSON **versionado** (`schemaVersion: 1`) en
   `support_scope_grants.condition_json` (toda la concesión) y en `support_grant_actions.condition_json` (un
   átomo), con `condition_schema_version` en columna (un CHECK impide que no coincidan). Una fila con una
   versión mayor a la que el servidor entiende **no se aplica** (falla cerrado).
2. Claves de la v1: `time`, `limits`, `patients`, `appointment` (ventana, anticipación, horizonte),
   `channels`, `fields` (máscaras), `amount`, `session`, `network`, `device`, `presence`, `obligations`
   (motivo, paso extra, aprobación) y `delegationCeiling`. Cada átomo declara cuáles acepta; el validador
   rechaza con códigos estables (`CONDITION_UNKNOWN_KEY`, `CONDITION_NOT_APPLICABLE_TO_ATOM`,
   `CONDITION_TIME_EMPTY_WINDOW`, …) y no admite condiciones sobre una concesión `DENY`.
3. Se evalúan con **lógica de tres valores** (`T`, `F`, `I` = indeterminado). Un dato que falta (edad, monto,
   hora de la cita, red desconocida) es `I`, y `I` **nunca** produce `PERMIT`: fail-closed. Barajar el orden de
   concesiones o de átomos no cambia la decisión (prueba de propiedad).
4. Precedencia de capas: barandillas de plataforma (L0) → reglas de la organización (`governance_rules`, L1:
   `DENY_PERMISSION`, `CEILING`, `REQUIRE_CONDITION`, `FIELD_FLOOR`) → `DENY` explícito de la persona → `ALLOW`
   con sus condiciones. Ningún conjunto de `ALLOW` vence a L0, a un `DENY_PERMISSION` ni a una concesión `DENY`.
5. Lo que la política no puede resolver sola se devuelve como **desafío** (`CHALLENGE`: motivo, paso extra,
   aprobación de cuatro ojos) y el cliente repite la petición con `X-Approval-Id`; `explain` y `simulate`
   usan la misma evaluación (sin efectos) para decir qué falta y qué cambiaría un borrador.
6. No se materializan condiciones en `effective_support_access` ni se amplía la función SQL de referencia: la
   verdad es el dominio TypeScript.

## Consecuencias

- Positivas: una sola semántica auditable (`access_decision_log` guarda razón, concesión y aprobación);
  condiciones como datos que cambian sin desplegar; el front pregunta (`explain`/`simulate`) en vez de recalcular.
- Negativas: más consultas por decisión con condiciones (carga perezosa por facetas, tope AC-12); la función
  SQL de referencia queda «gruesa» y puede divergir (se marca y no se amplía).
- Riesgo: una condición mal escrita deja a alguien sin trabajar. Mitigación: validación al guardar, vista previa
  (`simulate`, `simulationToken` de 10 minutos), `DENY_PERMISSION` no afecta a `SECURITY_ADMIN`.

## Evidencia

`src/modules/delegated_access/domain/support-conditions.ts`, `support-conditions.validate.ts`,
`support-access.decide.ts`, `services/access-explain.service.ts`, README de `delegated_access`.
