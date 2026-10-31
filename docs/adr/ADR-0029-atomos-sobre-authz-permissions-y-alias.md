# ADR-0029: Permisos atómicos sobre `authz.permissions`, con los 15 códigos antiguos como alias

## Estado

Aceptado (2026-11-02). Modelo v4.2.72 (`SQL/patches/2026-11-02_v4272_gobierno_de_accesos.sql`).
Contrato: `CONTRATO-GOBIERNO.md` §2 (catálogo) y decisión D-02.

## Contexto

El personal de apoyo trabajaba con 15 códigos gruesos (`schedule.view`, `billing.collect`, …). Un código
como `schedule.edit_hours` mezclaba cosas de riesgo muy distinto y no se podía ligar a motivo, paso extra,
aprobación, propósito de uso ni base legal. Había dos caminos: una tabla nueva de «acciones de apoyo» o
reutilizar `authz.permissions`, que ya es el catálogo de permisos del producto (ids deterministas, estado,
categoría, ámbito por defecto, bandera de peligrosidad).

## Decisión

1. Los permisos atómicos (`módulo.recurso.acción[.campo]`, 73) viven en **`authz.permissions`**, con las
   columnas de gobierno (sensibilidad, motivo, paso extra, aprobación, propósito, base legal, ¿clínico?,
   ¿asignable a apoyo?) y categorías en `authz.permission_categories`. Son **datos de arranque** con ids
   deterministas (`seed:authz-permission:<código>`): el arranque, el parche SQL y el runtime coinciden, y un
   cambio de sensibilidad o de obligaciones se hace en la fila, no en código de decisión.
2. Las concesiones (`support_grant_actions`) guardan `permission_id`: puede ser un átomo **o** uno de los 15
   alias (las filas de siempre). El alias **se sigue leyendo siempre**: la política lo expande a su lista de
   átomos al evaluar (regla de no regresión, §2.3).
3. **Los alias no se expanden al escribir** (decisión 26 del bloque B4a): una concesión creada con el código
   antiguo se guarda tal cual hasta que el administrador corre `POST /org/governance/normalize-legacy`
   (`dryRun` primero, `revert` por lote). Motivo: expandir al guardar cambiaría en silencio lo que la persona
   ya hace (los átomos traen obligaciones nuevas: motivo, paso extra, aprobación) y rompería AC-1
   («las suites existentes pasan sin editarlas»). La expansión es un acto explícito, con vista previa y reversible.
4. Si una misma concesión trae el alias y el átomo equivalente, **gana el átomo** (con sus condiciones); las
   filas reemplazadas se marcan `superseded_at` y no se borran.
5. **Los alias no admiten condiciones** (revisión de seguridad A-A2, 2026-10-30). Un permiso `ALLOW` escrito con
   alias no lleva `condition` ni `actionConditions`: el validador rechaza guardarlas con 422
   `CONDITION_NOT_APPLICABLE_TO_ATOM` y obliga a escribir átomos (o normalizar primero). Antes se aceptaban y el
   motor las ignoraba en silencio (el alias «no trae condiciones propias»), con lo que la pantalla prometía una
   restricción inexistente. Si por SQL directo llega una fila alias con condición, el motor **la evalúa** (falla
   cerrado). El alias sin condición no cambia: la regla de no regresión (punto 2) vale para lo que no declara
   condiciones, no para lo que sí las declara. Una `DENY` con alias sí admite condición.
6. El PDP clínico de `authz` no se toca: no interpreta condiciones y no recibe nada de apoyo en
   `access_policies` (guardar allí una barandilla «solo para recepción» haría que el PDP negara a todos).

## Consecuencias

- Positivas: un solo catálogo de permisos para el producto; la pantalla de permisos ya lo conoce; auditoría y
  puntaje de privilegios salen de columnas, no de listas en código; migración gradual y reversible.
- Negativas: conviven dos vocabularios hasta que cada organización normaliza; hay que mantener la tabla de
  equivalencias alias → átomos (`domain/support-permission-catalog.ts`) y la paridad con la semilla
  (`authz.seed.catalog-parity.spec.ts`).
- Riesgo: una organización que no normaliza conserva permisos gruesos sin obligaciones. Mitigación: el tablero
  de gobierno lista las concesiones con alias y el informe de acumulación de privilegios las pesa por átomo.

## Evidencia

`src/modules/authz/authz.support-atoms.seed.ts`, `src/modules/delegated_access/domain/support-permission-catalog.ts`,
`services/legacy-normalization.service.ts`, README de `delegated_access` («Gobierno de accesos»).
