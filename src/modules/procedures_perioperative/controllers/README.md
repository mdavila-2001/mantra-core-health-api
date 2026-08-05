# Controladores perioperatorios

Capa HTTP. Validan, autorizan y delegan; la transacción vive en el servicio.

## Rutas

Un único controlador (`PeriopController`) con 18 endpoints. No declara prefijo en `@Controller()`
porque los casos de uso cuelgan de dos raíces: `/procedure-cases` (el caso y todo lo que ocurre
dentro) y `/pacu-stays` (la estancia de recuperación, que tiene identidad propia una vez creada).

## Autenticación y autorización

`JwtAuthGuard` global + `@Roles(...)`, con roles por función clínica:

| Rol | Alcance |
| --- | --- |
| `PERIOP_ADMIN` | Todo el módulo |
| `SURGERY_SCHEDULER` | Programar, asignar equipo, cancelar |
| `SURGEON` | Diagnósticos, pasos, hallazgos, implantes, muestras, reporte y su firma |
| `ANESTHESIOLOGIST` | Valoración, plan y eventos de anestesia, verificación de órdenes, alta de PACU |
| `PERIOP_NURSE` | Checklist, implantes, insumos, admisión en PACU y valoraciones |
| `BILLING` | Generar cargos |

Dos restricciones son deliberadas y no meramente organizativas:

- **Sólo `SURGEON` firma el reporte operatorio**. La firma compromete responsabilidad clínica sobre
  lo que se hizo.
- **Sólo `ANESTHESIOLOGIST` da el alta de recuperación**. Es quien responde de que el paciente puede
  salir de PACU.

## Validaciones HTTP

`ParseUUIDPipe` en todos los parámetros de ruta, incluidos los pares de
`safety-checklists/:checklistId/responses`, `anesthesia-plans/:planId/approve` y
`operative-reports/:reportId/sign`. `ValidationPipe` global sobre los cuerpos.

## El endpoint sin cuerpo

`POST /procedure-cases/:id/anesthesia-plans/:planId/approve` no recibe cuerpo: aprobar es un acto,
no una edición. Lo que se aprueba ya está escrito en el plan.

## Las dos raíces

`/pacu-stays/:stayId/assessments` y `/pacu-stays/:stayId/discharge` cuelgan de la estancia, no del
caso. Una vez admitido el paciente, quien valora y quien da el alta trabajan sobre la estancia y no
necesitan conocer el caso — y la estancia ya sabe a cuál pertenece.

## Códigos de respuesta

`201 Created` en todo lo que crea registro clínico (caso, diagnósticos, equipo, valoración,
respuestas del checklist, plan, eventos, pasos, hallazgos, implantes, insumos, reporte, estancia,
valoraciones de PACU, cargos). `200 OK` en lo que muta algo existente: verificar órdenes, aprobar el
plan, firmar el reporte, dar el alta y cancelar.

## Nota sobre las rutas del caso de uso

Los casos de uso escriben cuatro rutas con dos puntos (`/preoperative-orders:verify`,
`/{rid}:sign`, `/{id}:cancel`, `/charge-items:post`). Aquí se usan segmentos normales por el mismo
motivo que en el resto del proyecto: el enrutador de Nest 11 interpreta `:` como inicio de parámetro
en cualquier posición del segmento.

## Pruebas

`periop.controller.spec.ts` con los tres servicios mockeados: delegación, argumentos (incluido el
actor y los ids de ruta, con los tres pares), el endpoint sin cuerpo y propagación de errores.
