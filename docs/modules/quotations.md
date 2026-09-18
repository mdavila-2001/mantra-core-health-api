<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/quotations/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `quotations`

**Fuente:** [`src/modules/quotations/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/quotations/README.md)
· 1 controllers · 1 services · 2 repositories · 0 entidades · 2 DTO

---

# Módulo Quotations — Cotizaciones con plan de pagos (FT-24)

Arma un **presupuesto** sobre un servicio del catálogo (FT-22) con un plan de
pagos **flexible y sin interés**, y **congela** las condiciones ofertadas al
momento de crearlo: si el precio del servicio cambia después, la cotización
conserva el suyo.

No tiene entidades propias: persiste en `billing` (`Quotations` y sus cuotas),
a través de los repositorios de este módulo.

## Endpoints

| Método | Ruta | Rol | Qué hace |
|---|---|---|---|
| `POST` | `/quotations` | `PRACTITIONER`, `CLINICIAN` | Crea la cotización con sus cuotas. |
| `GET` | `/quotations?patientProfileId=` | autenticado | Lista las cotizaciones de un paciente, más recientes primero. |
| `GET` | `/quotations/:id` | autenticado | Trae una cotización con sus cuotas. |

Cotizar exige rol clínico porque quien atiende es quien cotiza. Leer no lo exige,
igual que el catálogo de servicios del que parte.

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

- Un servicio o una cotización inexistentes responden `404`.
- Crear sin perfil profesional en la cuenta responde `422`.
- Una vigencia (`validUntil`) que no es posterior a la fecha de atención
  responde `422`.
- Un plan que no cierra con el precio responde `422`, con el total de las
  cuotas en `details` para que la pantalla diga cuánto falta o sobra.

