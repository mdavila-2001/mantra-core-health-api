# Servicios de CRM

Lógica de negocio. Cada método público resuelve un caso de uso en **una transacción**.

## Servicios

| Servicio | Casos de uso | Responsabilidad |
| --- | --- | --- |
| `CrmSalesService` | 01, 02, 03, 04, 07, 08, 09 | Cuentas, equipo, leads y oportunidades |
| `CrmServiceService` | 05, 06, 10, 11, 12, 13, 14, 15 | Actividades, alianzas, casos, 360 y consentimiento |

## Reglas de negocio

- **Cuenta (01)**: cuenta + contacto principal + propietario del equipo en la misma transacción.
- **Equipo (02)**: se rechaza el alta si el usuario ya pertenece a la cuenta.
- **Lead (03)**: la puntuación decide `qualified` o `disqualified`. El score se persiste como cadena
  porque la columna es `numeric`.
- **Conversión (04)**: exige lead `qualified`; un lead ya convertido devuelve conflicto con la
  oportunidad existente en lugar de crear una segunda.
- **Etapa (07)**: registra el movimiento con importe y probabilidad del momento; se rechaza avanzar
  una oportunidad cerrada o mover a la etapa en la que ya está.
- **Cierre (08/09)**: ganar marca `wonAt`, perder guarda el motivo. Comparten `closeOpportunity`
  porque la precondición y el registro histórico son idénticos.
- **Actividad (05/06)**: la fila común siempre; `TASK` y `NOTE` añaden subtipo. Una nota sin cuerpo
  se rechaza antes de escribir nada.
- **Alianza (10)**: el acuerdo marco solo se crea si hay importe comprometido.
- **Caso (11/12/13)**: número único por tenant, historial de cada transición, `closed_at` en los
  estados de cierre, y prohibición de reabrir un caso cerrado por esta vía.
- **Consentimiento (15)**: valida que el canal pertenezca al contacto y activa/limpia
  `do_not_contact`.
- **360 (14)**: solo lectura con `em.fork()`; no abre transacción de escritura.

## Dependencias

`EntityManager`, los dos repositorios del módulo y `PinoLogger`. `CrmServiceService` usa además
`CrmSalesRepository` para leer cuenta y contacto: son lecturas de verificación, no escritura cruzada.

## Transacciones y concurrencia

Un caso de uso equivale a una transacción. `FOR UPDATE` sobre lead, oportunidad, caso y endpoint
antes de mutarlos; `row_version` aporta bloqueo optimista automático.

## Excepciones

`ResourceNotFoundException` (cuenta, lead, oportunidad, caso o contacto inexistente),
`PreconditionFailedException` (estado que no habilita la operación, nota sin cuerpo, canal ajeno) y
`ConflictException` (miembro duplicado, número de caso repetido, lead ya convertido, oportunidad ya
cerrada, caso cerrado).

## Logs

`operation: 'crm.<área>.<acción>'`. Se registran ids y estados; nunca datos de contacto ni el
contenido de notas y comentarios.

## Pruebas

`crm-sales.service.spec.ts` (19) y `crm-service.service.spec.ts` (17): camino feliz, precondiciones,
conflictos y casos límite de cada caso de uso.
