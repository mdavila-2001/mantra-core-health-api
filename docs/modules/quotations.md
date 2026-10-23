<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/quotations/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver docs/progress/ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `quotations`

**Fuente:** [`src/modules/quotations/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/quotations/README.md)
· 1 controllers · 1 services · 2 repositories · 0 entidades · 2 DTO

---

# Módulo Quotations — Cotizaciones con plan de pagos (FT-24)

Arma un **presupuesto** sobre un servicio del catálogo (FT-22) con un plan de
pagos **flexible y sin interés**, y **congela** las condiciones ofertadas al
momento de crearlo: si el precio del servicio cambia después, la cotización
conserva el suyo.

No tiene entidades propias: persiste en `billing` (`Quotations` y sus cuotas),
a través de los repositorios de este módulo.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/quotations -name '*.controller.ts' | wc -l
  find src/modules/quotations -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/quotations -name '*.entity.ts' | wc -l
  find src/modules/quotations -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **1 controller, 3 rutas HTTP, 0 entidades y 1 servicio**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Importa (`PracticeModule`).

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /quotations` | PRACTITIONER, CLINICIAN | `quotations` |
| `GET /quotations` | sesión | `quotations` |
| `GET /quotations/:id` | sesión | `quotations` |

## Endpoints

| Método | Ruta | Rol | Qué hace |
|---|---|---|---|
| `POST` | `/quotations` | `PRACTITIONER`, `CLINICIAN` | Crea la cotización con sus cuotas. |
| `GET` | `/quotations?patientProfileId=` | autenticado | Lista las cotizaciones de un paciente en las prácticas que el actor alcanza, más recientes primero. |
| `GET` | `/quotations/:id` | autenticado | Trae una cotización con sus cuotas, si es de una práctica que el actor alcanza. |

Cotizar exige rol clínico porque quien atiende es quien cotiza. Leer no exige rol,
igual que el catálogo de servicios del que parte.

## Alcance

El rol no decide qué cotizaciones se ven ni dónde se cotiza: lo decide la
**vinculación del actor con la práctica**, con el mismo criterio que el `PATCH`
del catálogo (`BillingServiceCatalogService.assertPuedeEditar`):

- un profesional alcanza las prácticas donde tiene una vinculación activa;
- la cuenta administradora (`SECURITY_ADMIN`) alcanza además las prácticas de la
  organización en contexto.

`billing.quotations` no tiene `tenant_id` —cuelga de `practice_id`—, así que el
aislamiento por organización del RLS no la cubre: la organización se resuelve a
través de la práctica (`PracticeTenantLookupService`). El listado se acota **en la
consulta**, no después de leer.

## El plan de pagos (v4.2.18)

Un consultorio no financia: reparte el precio de un tratamiento en las cuotas
que le sirvan a la persona. Por eso **no hay tasa ni método de amortización**, y
el simulador FLAT/FRANCÉS (`POST /quotations/simulate`) se retiró.

El cronograma lo arma quien atiende y viaja entero en el alta:

- **`downPaymentAmount`** — el anticipo, lo que se paga el día de la atención.
  Entre 0 y el precio.
- **`paymentFrequency`** — `WEEKLY`, `BIWEEKLY` o `MONTHLY`. Es sólo el punto de
  partida con que se armó el cronograma.
- **`installments`** — cada cuota con **su propia fecha y su propio monto**. No
  tienen por qué ser iguales ni seguir la frecuencia.

`payment-plan.ts` comprueba, en **centavos enteros**, lo que el esquema no puede
expresar porque cruza filas:

- anticipo + Σ cuotas = precio ofrecido, al centavo;
- `paymentPlanInstallmentCount` = cantidad de cuotas enviadas (cero si el
  anticipo cubre todo);
- las cuotas vienen numeradas 1, 2, 3… en orden, y ninguna es cero.

El resto lo cierran los `CHECK` de la base: frecuencia dentro de las tres,
anticipo entre 0 y el precio, cuota mayor que cero.

## Errores

- Un servicio o una cotización inexistentes responden `404`. Un servicio de otra
  práctica, o una cotización de una práctica que el actor no alcanza, responden
  el **mismo** `404`: probar ids no confirma qué ofrece o cotizó la práctica de al
  lado.
- Crear sin perfil profesional en la cuenta responde `422`.
- Crear en una práctica con la que el actor no tiene vinculación responde `422`.
- Una vigencia (`validUntil`) que no es posterior a la fecha de atención
  responde `422`.
- Un plan que no cierra con el precio responde `422`, con el total de las
  cuotas en `details` para que la pantalla diga cuánto falta o sobra.

## Auditoría vigente

La práctica se valida al crear, pero la revisión de octubre de 2026 halló que se
debe comprobar además el acceso clínico al paciente y validar las referencias
clínicas que entran en la solicitud. El detalle y la matriz de pruebas están en
[`docs/revision-backend-2026-10-04/modulos/quotations.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/revision-backend-2026-10-04/modulos/quotations.md).

```bash
corepack yarn test src/modules/quotations --runInBand --silent
```
