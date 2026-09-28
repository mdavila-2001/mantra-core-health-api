# Reporte — B13 · Las cotizaciones se guardan y la contabilidad se puede alcanzar (M4 · H3)

> **AVANCE: 5 / 5 — 100,0 %** de las microtareas del carril. **Peldaño alcanzado: `TESTED`**, el techo
> honesto sin base de datos que fija el encargo. **No es `VERIFIED`:** el guardado real contra Postgres lo
> corre M1 (§«Lo que le falta correr a M1»).
>
> **Hallazgo que cambia la lectura del bloqueante:** AG-35 («ninguna cotización se guarda: 400») **no se
> reproduce** en la API. Con el `ValidationPipe` global de `main.ts` el body del front con importes `number`
> **pasa**. Lo que había era un contrato que funcionaba **por accidente** (dependía de
> `enableImplicitConversion`); ahora el DTO lo declara solo. Ver [DECISIONS.md → Q-07](./DECISIONS.md).

- Fecha: 2026-09-26 · Máquina: **M4 · Dell Inspiron 2** · Plan: [PLAN.md](./PLAN.md) · Decisiones: [DECISIONS.md](./DECISIONS.md)
- Rama: `justin/test-b13-cotizaciones-y-contabilidad`, desde `origin/test` @ `002bdfdd`, PR contra `test`
- Compuertas: `yarn typecheck` exit 0 · `yarn lint` exit 0 · `yarn test --testPathPatterns="quotation|billing|accounting"` **284/284** (36 suites)

## Completado

| ID | Qué se logró (observable en la prueba) | Comando | Resultado |
|---|---|---|---|
| H3.S1.M1 | El body **tal como lo arma el front** (`offeredPrice: 1500`, `downPaymentAmount: 300`, cuotas `400`) pasa el `ValidationPipe` y **se guarda**: el servicio persiste `'1500'`, `'300'` y las cuotas `'400'` como texto exacto. Funciona con el pipe global **y sin** conversión implícita. Límite: centavos que salen de `centavos/100` (`233.34`) y anticipo `0`. Inválido: 3 decimales (`1.005`, `0.1+0.2`), negativos, `NaN`, `Infinity`, booleanos, texto no numérico y `null` → 400, **sin redondear en silencio** | `yarn test --testPathPatterns="quotations\|create-quotation" -t AG-35` | ROJO antes: con el pipe global PASA (AG-35 no se reproduce) y **sin** conversión implícita FALLA 2/16 ([`H3.S1.M1-rojo.txt`](./evidencia/H3.S1.M1-rojo.txt)) → PASS 16/16 ([`H3.S1.M1-verde.txt`](./evidencia/H3.S1.M1-verde.txt)) y guardado 13/13 ([`H3.S1.M1-guardado.txt`](./evidencia/H3.S1.M1-guardado.txt)) |
| H3.S1.M2 | Pedido a M1 del `tenant_id` de `billing.quotations`, con su forma | — | §«Pedidos» |
| H3.S1.M3 | El listado por paciente trae las cuotas de **todas** sus cotizaciones en **una** consulta (`$in`), no una por cotización; a cada cotización le toca lo suyo; sin cotizaciones no consulta | `yarn test --testPathPatterns=quotation` | ROJO antes ([`H3.S1.M3-rojo.txt`](./evidencia/H3.S1.M3-rojo.txt)) → PASS 53/53, 4 suites ([`H3.S1.M3-verde.txt`](./evidencia/H3.S1.M3-verde.txt)) |
| H3.S2.M1 | Inventario del módulo 16 **desde el código**, antes de tocar nada: 42 entidades, 9 controladores, 45 rutas con sus `@Roles`, 11 servicios, la partida doble 422, la máquina de estados y `money.ts`. **No se creó nada**: el módulo ya existe entero | `grep`/`ls` pegados | [`H3.S2.M1-inventario.txt`](./evidencia/H3.S2.M1-inventario.txt) |
| H3.S2.M2 | Hallazgo de la moneda (`ACCT_CUR_PEN`/`ACCT_CUR_USD`, sin boliviano) registrado **sin corregirlo**, medido su alcance real (los dos conceptos no se referencian en ningún lugar de `src`) | — | [DECISIONS.md → Q-04](./DECISIONS.md) |

## A medias

ninguna.

## Pendiente

ninguno dentro del encargo. Lo que queda afuera es de otras máquinas (§«Pedidos»).

## Lo que le falta correr a M1 (de `TESTED` a `VERIFIED`)

1. `POST /quotations` con el token de un médico de seed y **exactamente** el body del front (importes
   `number`) → **201**; `SELECT offered_price, down_payment_amount FROM billing.quotations WHERE id = :id` y
   `SELECT amount FROM billing.quotation_installments WHERE quotation_id = :id` con los valores exactos.
2. El mismo `POST` con `offeredPrice: 1.005` → **400** (no se redondea).
3. `GET /quotations?patientProfileId=…` de un paciente con ≥ 3 cotizaciones, con el log SQL de MikroORM
   encendido: **una** consulta a `quotation_installments` (con `in (…)`), no tres.

## Pedidos

- **A M1 (modelo) — H3.S1.M2, `tenant_id` en `billing.quotations` (N-06).** Hoy la tabla tiene
  `practice_id`, `patient_profile_id` y `created_by_practitioner_profile_id`, pero **no `tenant_id`**, así que
  la RLS por tenant (`patches/2026-08-05_tenant_rls.sql`) no la cubre. La autorización existe **sólo en el
  servicio** (`alcanzaPractica` / `practicasAlcanzables`, que acotan por práctica). Forma pedida, por las 4
  capas (`diagram_17_billing.puml` → `gen_ddl.py` → `SQL/17_billing/` → patch):
  - `billing.quotations.tenant_id uuid NOT NULL` con FK a `directory.tenants(id)`, índice
    `ix_quotations_tenant_id`, y **backfill** desde `practice.practices.tenant_id` por `practice_id`.
  - Sumar `billing.quotations` a la política RLS por tenant.
  - `quotation_installments` hereda por `quotation_id` (o lleva su propio `tenant_id` si la RLS lo exige
    columna a columna).
  - Después, la entidad `billing/entities/quotations.entity.ts` gana `tenantId` y el `create` lo toma del
    tenant de la práctica. **Eso es código de la API y queda para cuando el patch exista**: sin la columna,
    agregarlo a la entidad rompe `ORM_SCHEMA_SYNC`.
- **A M2 (roles):** sembrar y emitir **`ACCOUNTING_APPROVER`**. `role-mapping.ts` no lo tiene (0
  coincidencias), así que se descarta en silencio y `POST
  /accounting/journal-transactions/:id/approve` sólo lo alcanza `SECURITY_ADMIN`. El servicio ya lo
  contempla (`APPROVAL_ROLES`, `ledger.service.ts:78-81`).
- **A M5 (front):** las cotizaciones se guardan **con** importes `number` o `string`; no hace falta cambiar
  el formulario para destrabar la demo. Si se pasa a texto, que sea con dos decimales, nunca `toFixed`
  sobre una suma de flotantes.

## Evidencia

En [`evidencia/`](./evidencia/), con el comando en la primera línea y la salida literal:

- `gate-typecheck.txt`, `gate-lint.txt`, `gate-regresion.txt` (`--testPathPatterns="quotation|billing|accounting"`)
- `H3.S1.M1-rojo.txt` → `H3.S1.M1-verde.txt` → `H3.S1.M1-guardado.txt`
- `H3.S1.M3-rojo.txt` → `H3.S1.M3-verde.txt`
- `H3.S2.M1-inventario.txt`

## No cubierto

- **Nada se ejercitó contra Postgres**: ni la persistencia del `numeric`, ni la consulta `$in` real.
- **AG-36 a AG-39 y AG-45 de BR-25 no están en el encargo de M4** y no se tocaron: el badge de estado
  (`statusConceptId` sin `{code, display}`), los `@Roles` de los `GET` de cotizaciones (es de M2; la
  titularidad **ya** se filtra en el servicio por práctica), y los bodies del cockpit contable
  (`runDepreciation`/`runAccruals`/`clearing-documents`), que el front manda con otra forma.
- El `@ApiProperty` de los importes sigue documentando `string`; acepta también `number` (dicho en el JSDoc
  del DTO, no en el OpenAPI).

## Desvíos del plan

- El plan decía «alinear el contrato para que la petición del front se guarde». Al medir, **ya** se
  guardaba (por la conversión implícita). Se mantuvo la microtarea con otro sentido: volver explícito el
  contrato y probarlo en los tres niveles, con y sin la opción global. Queda en Q-07.

## Riesgos residuales

- Mientras no exista `tenant_id`, la aislación de cotizaciones entre organizaciones depende de un único
  filtro en el servicio; una consulta nueva que lo olvide no tiene red en la base.

## Decisiones y ambigüedades

Ver [DECISIONS.md](./DECISIONS.md): Q-04 (moneda contable), Q-07 (AG-35 no se reproduce). Ninguna se
resolvió por conveniencia.
