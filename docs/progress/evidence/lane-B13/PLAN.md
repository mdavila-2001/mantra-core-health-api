# Plan — B13 · Las cotizaciones se guardan y la contabilidad se puede alcanzar (M4 · H3)

- Fecha: 2026-09-26 · Máquina: **M4 · Dell Inspiron 2** · Repo: `mantra-core-health-api`
- Rama: `justin/test-b13-cotizaciones-y-contabilidad`, desde `origin/test` @ `002bdfdd`, PR contra `test`
- Encargo: `AlovidaPromptManager/repartos/2026-09-26/PromptMaquinas/M4-DellInspiron2/Preproduccion.ApiAgendaDirectoriosYDinero/AgendaFarmaciaCotizacionesYContabilidad.md` (§5, H3)
- Prompt de brechas de origen: `mantra-core-health/docs/brechas-front-back-2026-09-24/prompts/BR-25-cotizaciones-y-contabilidad.md`
- Resultado observable: una cotización con los importes **tal como los arma el front** (`number` JSON)
  pasa la validación de la API y se guarda; el listado por paciente trae las cuotas de todas sus
  cotizaciones en **una** consulta; el módulo contable queda inventariado desde el código.
- Kill-test: mandar a la `ValidationPipe` real el body del front con importes numéricos. Si da 400, no está
  hecho.
- Techo honesto sin base de datos: **`TESTED`**.

## Alcance

- **IN:** `src/modules/quotations/**` (la carpeta real de `billing/quotations`: el controlador, DTO, servicio
  y repositorios viven ahí; las entidades, en `billing/entities`, **no se tocan**), `src/modules/accounting/**`
  sólo para leer, y esta carpeta de evidencia.
- **OUT:** `@Roles` de cualquier endpoint (M2), `billing.quotations` en el modelo (M1), DDL, el front (M5),
  la pasarela de pago, los conceptos de moneda de `accounting.concepts.ts` (se registran, no se corrigen).
- **Ambigüedades registradas:** Q-04 (moneda contable sin boliviano), en [`DECISIONS.md`](./DECISIONS.md).

## Hechos medidos (peldaño `DISCOVERED`, salvo donde dice otra cosa)

| Hecho | Dónde |
|---|---|
| Los tres importes del DTO son `string` con `@IsNumberString()` + `@Matches(/^\d+(\.\d{1,2})?$/)` | `quotations/dto/create-quotation.dto.ts:62-65, 118-124, 147-153` |
| El front los manda como `number`: `offeredPrice: Number(precioOfrecido)`, `downPaymentAmount: anticipo ?? 0`, `amount = centavos / 100` | front `origin/test`: `features/quotations/quotation-form/quotation-form.ts:690-697`, `flexible-payment-plan.ts:48-54` |
| **Medido (`RUNS`)**: con el `ValidationPipe` global (`enableImplicitConversion`) y la metadata de decoradores activa (tsc `emitDecoratorMetadata`, swc `decoratorMetadata`), ese body **no** da 400: `1500` llega como `"1500"` | `src/main.ts:158-165`, `.swcrc`, prueba `create-quotation.front-body.spec.ts` |
| O sea que **AG-35 (el 400) no se reproduce** en la API: la afirmación del informe del 24/09 venía de leer el DTO («sin confirmar en runtime», decía). El contrato funciona **por accidente**: depende de una opción del pipe global que ningún DTO declara | — |
| `listQuotationsByPatient` hace una consulta de cuotas **por cotización** (N+1) | `quotations/services/quotations.service.ts:230-238` |
| `billing.quotations` no tiene `tenant_id`; la lectura ya filtra por práctica alcanzable (`alcanzaPractica`, `practicasAlcanzables`) | `database/SQL/17_billing/02_tables.sql:374-396`, `quotations.service.ts:248-305` |
| Contabilidad: 42 entidades, 9 controladores, partida doble 422 y máquina `DRAFT→…→POSTED→REVERSED` ya escritas | `src/modules/accounting/**` (inventario en H3.S2.M1) |

## H3 — Las cotizaciones se guardan y la contabilidad se puede alcanzar

**CA:** Dada una cotización con importes, cuando se envía tal como la arma el front, entonces se guarda en
vez de dar 400.
**DoD:** microtareas de H3 en `HECHO`, con la unitaria del guardado en verde; `typecheck` y `lint` exit 0;
`yarn test --testPathPatterns=quotations` en verde.
**Estado:** HECHO — peldaño `TESTED` (ver REPORT.md)

### H3.S1 — El 400 que impide guardar cualquier cotización

**CA:** Dados importes numéricos, cuando llegan al DTO, entonces la validación los acepta.
**DoD:** las tres microtareas en `HECHO` con la unitaria pegada.
**Estado:** HECHO — peldaño `TESTED` (ver REPORT.md)

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Alinear el contrato de importes entre front y DTO de forma **explícita**: el DTO acepta `number` o texto y entrega siempre texto exacto, sin depender de `enableImplicitConversion` | el body del front pasa con y sin conversión implícita; un importe con 3 decimales, negativo o no numérico sigue dando 400 | `yarn test --testPathPatterns=create-quotation` → verde pegado (correcto · límite · inválido) | HECHO |
| H3.S1.M2 | Pedir a M1 el `tenant_id` de `quotations` | el pedido queda escrito con su forma | pedido en el `REPORT.md` | HECHO |
| H3.S1.M3 | Resolver el N+1 de cuotas | una consulta para todas las cotizaciones del listado, no N | `yarn test --testPathPatterns=quotations.service` → verde pegado, con la aserción de **una** llamada | HECHO |

### H3.S2 — Exponer la contabilidad que ya existe

**CA:** Dado el módulo contable, cuando se lo expone, entonces no se crea nada que ya esté.
**DoD:** las dos microtareas en `HECHO` con el inventario de lo existente pegado.
**Estado:** HECHO — peldaño `TESTED` (ver REPORT.md)

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H3.S2.M1 | Inventariar qué del módulo 16 ya existe antes de tocar nada | la lista sale del código | `grep` y salida pegados en `evidencia/H3.S2.M1-inventario.txt` | HECHO |
| H3.S2.M2 | Registrar el hallazgo de la moneda sin corregirlo | queda en `DECISIONS.md` | enlace pegado | HECHO |

## Riesgos y bloqueos previstos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Convertir un `number` a texto con `toFixed` redondearía en silencio (`1.005` → `"1.00"`) | un precio de salud cambiado sin aviso | se convierte con `String(n)`, que conserva lo que llegó, y la regla de dos decimales **rechaza** lo que no cierra |
| El guardado real (persistencia de `numeric`) no se ejercita sin base | queda en `TESTED` | se pide a M1 el `POST /quotations` contra el VPS con el body del front |
