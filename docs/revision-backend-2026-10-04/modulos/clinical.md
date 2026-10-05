# Revisión del módulo `clinical` — ALOVIDA

## Alcance y resultado

Se revisaron episodio, encuentro, observaciones, órdenes, reportes, condiciones, alergias, prescripción, procedimientos, inmunizaciones, lectura y receta pública. `corepack yarn test src/modules/clinical --runInBand --silent` aprobó **51 suites y 518 pruebas**; mostró dos advertencias preexistentes de imports JSON. No se confirmó un defecto nuevo dentro de los flujos inspeccionados.

## Controles confirmados

`ClinicalRecordAccessGuard` extrae el paciente de ruta o cuerpo y distingue lectura de escritura mediante `ClinicalReadService.assertPuedeLeerHistoria` / `assertPuedeEscribirHistoria` ([`clinical-record-access.guard.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/clinical/guards/clinical-record-access.guard.ts#L13-L151)). Está montado sólo donde el paciente está disponible en la petición; los comandos cuyo recurso debe cargarse aplican la autorización dentro del servicio. Las pruebas de montaje verifican esas decisiones. Las transiciones de observación, reporte y encuentro incluyen precondición y control de versión; la receta pública se limita a verificar sello, estado y matrícula, usa `@Throttle` y `Cache-Control: no-store` ([`clinical-prescriptions-public.controller.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/clinical/controllers/clinical-prescriptions-public.controller.ts#L19-L68)).

## Límite revisado

El inicio de episodio y el check-in no pasan por la guardia del expediente porque constituyen el contexto asistencial que la política posterior requiere; está documentado como `BOOTSTRAP_ACCESS_RESIDUAL` en la propia guardia ([`clinical-record-access.guard.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/clinical/guards/clinical-record-access.guard.ts#L76-L95)). No se lo reporta como vulnerabilidad nueva: los roles y los servicios de esos flujos contienen su propia lógica de inicio. Debe permanecer cubierto por integración con dos tenants y con actor sin relación asistencial previa.

| Caso | Prueba dirigida a conservar | Resultado esperado |
| --- | --- | --- |
| Correcto | Profesional con turno o relación vigente registra observación | escritura y auditoría del paciente autorizado |
| Límite | Grant de sólo lectura intenta escribir | denegación de la política `WRITE` |
| Error | Condición presuntiva se decide sin motivo ni evidencia | `422`, sin transición |
| Falla catalogada | Actor sin acceso a historia intenta leer o escribir paciente ajeno | `403/FORBIDDEN/CLINICAL_RECORD_ACCESS_DENIED` con razón estable |

## Cobertura pendiente

La matriz dirigida debe mantener dos tenants, paciente, representante, clínico con turno, clínico con relación asistencial y grant de sólo lectura. Revisar de nuevo este informe si se integra trabajo externo que modifique reasons o DTOs clínicos.
