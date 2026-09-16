# Módulo Quotations — Cotizaciones con plan de pagos (FT-24)

Arma un **presupuesto** sobre un servicio del catálogo (FT-22) con un plan de
pagos simulado, y **congela** las condiciones ofertadas al momento de crearlo:
si el precio del servicio cambia después, la cotización conserva el suyo.

No tiene entidades propias: persiste en `billing` (`Quotations` y sus cuotas),
a través de los repositorios de este módulo.

## Endpoints

| Método | Ruta | Rol | Qué hace |
|---|---|---|---|
| `POST` | `/quotations/simulate` | `PRACTITIONER`, `CLINICIAN` | Calcula la tabla de cuotas sin guardar nada. |
| `POST` | `/quotations` | `PRACTITIONER`, `CLINICIAN` | Crea la cotización con sus cuotas. |
| `GET` | `/quotations?patientProfileId=` | autenticado | Lista las cotizaciones de un paciente, más recientes primero. |
| `GET` | `/quotations/:id` | autenticado | Trae una cotización con sus cuotas. |

Cotizar exige rol clínico porque quien atiende es quien cotiza. Leer no lo exige,
igual que el catálogo de servicios del que parte.

## El simulador

`payment-plan-simulator.ts` es una **función pura**: mismos parámetros, mismo
resultado. La usan tanto `/quotations/simulate` como el alta, así que lo que la
persona ve antes de confirmar es exactamente lo que se guarda.

- **La tasa es mensual**, en porcentaje: `"2.5"` es 2,5 % por mes.
- **Las cuotas vencen una por mes** desde la fecha de atención: la primera, un
  mes después.
- **`FLAT`**: interés simple sobre el capital total, repartido en partes iguales.
  El capital también se reparte en partes iguales.
- **`FRENCH`**: amortización francesa, con cuota fija, capital creciente e
  interés decreciente.
- **Los importes se calculan en centavos enteros.** El resto del redondeo se
  ajusta en la última cuota, para que la suma cierre exacta contra el precio
  ofrecido.

## Errores

- Un servicio o una cotización inexistentes responden `404`.
- Crear sin perfil profesional en la cuenta responde `422`.
- Una vigencia (`validUntil`) que no es posterior a la fecha de atención
  responde `422`.
