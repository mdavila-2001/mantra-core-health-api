# Servicios de marketing

Lógica de negocio. Cada método público resuelve un caso de uso en **una transacción**.

## Servicios

| Servicio | Casos de uso | Responsabilidad |
| --- | --- | --- |
| `MarketingCampaignsService` | 01, 02, 03, 04, 05 | Segmentos, campañas y plantillas de contenido |
| `MarketingJourneysService` | 06 … 12 | Journeys, inscripciones, enlaces, touchpoints y atribución |

## Reglas de negocio

- **Segmento (01)**: nace `active` con `estimated_size = 0`; el código es único por tenant.
- **Refresco (02)**: el cuerpo trae la membresía completa. Quien falta pasa a `removed` (baja
  lógica), quien vuelve se reactiva, y `estimated_size` se recalcula. Un segmento que no esté activo
  no se refresca.
- **Campaña (03)**: nace `scheduled`; se valida que termine después de empezar y que el segmento
  vinculado exista (bloqueado al vincularlo).
- **Materialización (04)**: copia los miembros `active` del segmento como `targeted` y mueve la
  campaña a `running`. Idempotente: lo ya presente se cuenta como omitido, igual que lo suprimido.
- **Plantilla (05)**: `version = prev + 1` y la anterior se archiva en la misma transacción.
- **Journey (06)**: nace `draft`. Los pasos se encadenan por `next_step_id` en el orden recibido y
  se enganchan al último ya existente, de forma que varias llamadas construyen un grafo recorrible.
  Un `SEND` sin plantilla publicada, un `WAIT` sin duración o un `BRANCH` sin condición se rechazan.
- **Activación (07)**: exige borrador con al menos un paso. La cohorte entra en el primer paso;
  quien ya tenga inscripción activa se omite.
- **Avance (08)**: un `SEND` deja touchpoint `impression`; un `WAIT` sólo avanza si su espera venció
  (contada desde el último movimiento de la inscripción); un `BRANCH` toma `branch_step_id` o
  `next_step_id` según lo que resuelva el orquestador. Sin siguiente paso, la inscripción se
  completa.
- **Salida (09)**: alcanzar la meta la marca `completed`; baja o rebote la marcan `exited`. Si se
  indica campaña, el miembro pasa a `converted` / `unsubscribed` / `bounced`.
- **Click (10)**: el contador se incrementa bajo bloqueo para no perder clicks simultáneos. El
  touchpoint sólo se registra si la petición identifica al miembro.
- **Touchpoint (11)**: append-only. Exige campaña o journey de origen. Sólo `open`, `click` y
  `conversion` mueven el estado del miembro de campaña; `impression`, `visit` y `reply` no dicen
  nada sobre él.
- **Atribución (12)**: reparte el crédito entre los touchpoints del miembro en la ventana. Borra el
  reparto previo del mismo modelo antes de escribir el nuevo.

## Reparto de pesos

`FIRST_TOUCH` y `LAST_TOUCH` dan peso 1 a un único touchpoint (los de peso 0 no se persisten:
guardar un reparto de valor cero sólo añadiría ruido). `LINEAR` divide con 6 decimales y **suma el
resto al último**, para que `SUM(weight)` dé exactamente 1 y no 0.999999 — la restricción de base
compara con 1 exacto.

El valor atribuido se calcula con 2 decimales: es dinero, y se transporta como cadena decimal.

## Dependencias

`EntityManager`, los repositorios del módulo y `PinoLogger`. `MarketingJourneysService` usa además
`MarketingCampaignsRepository` para validar el segmento de entrada, comprobar que la plantilla de un
paso `SEND` está publicada y reflejar el resultado en el miembro de campaña.

## Transacciones y concurrencia

Un caso de uso equivale a una transacción. `FOR UPDATE` sobre segmento, campaña, journey, plantilla
vigente, enlace y miembro de campaña; `FOR UPDATE SKIP LOCKED` sobre la inscripción que se avanza;
`row_version` aporta bloqueo optimista automático.

## Excepciones

`ResourceNotFoundException` (segmento, campaña, journey, inscripción, paso o enlace inexistente),
`PreconditionFailedException` (segmento inactivo, ventana inválida, campaña sin segmento o en estado
no materializable, journey activo o sin pasos, paso mal definido, espera no vencida, enlace
inactivo, touchpoint sin origen, sin touchpoints en la ventana) y `ConflictException` (código
duplicado, journey ya activado, inscripción ya cerrada).

## Logs

`operation: 'marketing.<área>.<acción>'`. No se loguean plantillas ni datos del destinatario más
allá del identificador.

## Pruebas

`marketing-campaigns.service.spec.ts` (25) y `marketing-journeys.service.spec.ts` (33): camino
feliz, precondiciones, conflictos, idempotencia, reingreso al segmento, ramas del journey y suma
exacta de los pesos de atribución.
