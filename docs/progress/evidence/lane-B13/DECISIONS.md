# Decisiones y ambigüedades — carril B13 (M4 · cotizaciones y contabilidad)

> Se **registran**, no se resuelven por conveniencia (regla 1.2). Vive en la carpeta del carril para que
> dos máquinas no editen el mismo `DECISIONS.md` (regla anti-bloqueo 3).

## Q-04 · La moneda del módulo contable no incluye el boliviano

- **Hecho medido:** `src/modules/accounting/accounting.concepts.ts:201-203` declara
  `CURRENCY_PEN: { code: 'ACCT_CUR_PEN', display: 'Peruvian Sol' }` y
  `CURRENCY_USD: { code: 'ACCT_CUR_USD', display: 'US Dollar' }`, **sin boliviano**, en un producto boliviano
  cuyos seeds usan `CONCEPTS.CURRENCY_BOB` (`src/common/constants/concepts.ts:888`,
  `src/modules/billing/default-services.ts:30`, `src/common/seed/dynamic-enum-catalog.ts:154-155`).
- **Alcance real del hallazgo (medido):** `ACCT.CURRENCY_PEN` y `ACCT.CURRENCY_USD` **no se referencian en
  ningún lugar de `src`**. La contabilidad nunca elige moneda por su cuenta: `currencyConceptId` llega
  siempre del DTO, de la cuenta o del asiento original (p. ej. `services/ledger.service.ts:809`). Hoy es un
  concepto sembrado equivocado en el catálogo, no un cálculo equivocado.
- **Qué NO se hizo:** no se corrigió. Es un cambio de **dato** (qué monedas siembra el catálogo contable),
  no de código, y el encargo lo manda a registrar.
- **Forma propuesta:** reemplazar `CURRENCY_PEN` por `CURRENCY_BOB` (`ACCT_CUR_BOB`, «Boliviano»), o mejor,
  que la contabilidad reuse `CONCEPTS.CURRENCY_BOB`/`CURRENCY_USD` del catálogo común y retire los suyos
  para no tener dos conceptos de la misma moneda. Si se corrige, el PR lo dice como cambio de dato.
- **Quién resuelve:** el propietario. **Qué bloquea:** nada hoy.

## Q-07 · AG-35 no se reproduce: el 400 de las cotizaciones era de lectura, no de ejecución

- **Hecho medido (`RUNS`):** el body del front con importes `number` pasa el `ValidationPipe` global
  (`evidencia/H3.S1.M1-rojo.txt`). La conversión implícita de class-transformer convierte el número
  al tipo declarado (`String`) antes de `@IsNumberString`.
- **Qué se decidió:** no «arreglar» un 400 que no existe, sino **volver explícito** el contrato en el DTO
  (acepta `number` o texto, entrega texto exacto) para que no dependa de una opción del pipe global que
  ningún DTO declara. Si mañana alguien apaga `enableImplicitConversion`, las cotizaciones siguen
  guardándose.
- **A quién avisar:** a M5 (front): puede seguir mandando `number` o pasar a texto con dos decimales, las
  dos formas quedan aceptadas. Y al dueño del informe de brechas del 24/09: AG-35 como «bloqueante» debe
  bajarse a «contrato implícito».

## Pedidos a otras máquinas

- **A M2 (roles):** `ACCOUNTING_APPROVER` no existe como rol sembrado; hoy `POST
  /accounting/journal-transactions/:id/approve` (`@Roles('SECURITY_ADMIN', 'ACCOUNTING_APPROVER')`,
  `accounting-ledger.controller.ts:238-239`) **sólo lo alcanza `SECURITY_ADMIN`**. El servicio ya lo
  contempla (`APPROVAL_ROLES`, `ledger.service.ts:78-81`): alcanza con sembrarlo y emitirlo en el JWT.
- **A M1 (modelo):** `tenant_id` en `billing.quotations` — ver el `REPORT.md`, pedido con su forma.
