# Revisión del módulo `pharma_lab` — ALOVIDA

## Alcance y resultado

Se revisaron organización de laboratorios, personal, visitadores, solicitudes y registros de visita, catálogo, farmacovigilancia, documentos regulatorios y encuestas. `corepack yarn test src/modules/pharma_lab --runInBand --silent` aprobó **10 suites y 120 pruebas**. No se confirmó un hallazgo nuevo en los flujos inspeccionados.

## Controles confirmados

`PharmaLabScopeGuard` exige que la identidad administre el laboratorio, sea personal activo o sea un visitador operativo del laboratorio; las rutas ajenas devuelven `404` ([`pharma-lab-scope.guard.ts`](../../../src/modules/pharma_lab/guards/pharma-lab-scope.guard.ts#L20-L91)). Los controladores de catálogo, documentos, farmacovigilancia, social y visitadores montan esta guardia. Documentos regulatorios conservan versiones, registran lecturas y no ofrecen borrado físico ([`regulatory-documents.controller.ts`](../../../src/modules/pharma_lab/controllers/regulatory-documents.controller.ts#L27-L190)).

| Caso | Prueba dirigida a conservar | Resultado esperado |
| --- | --- | --- |
| Correcto | Personal activo del laboratorio registra documento | `201`, versión y auditoría del tenant correcto |
| Límite | Visitador operativo trabaja sobre su laboratorio | acceso permitido sólo mientras vínculo activo |
| Error | Personal de laboratorio A usa ID de laboratorio B | `404`, sin revelar existencia ni escribir |
| Falla catalogada | Laboratorio inactivo recibe operación operativa | `422/PRECONDITION_FAILED/PHARMA_LAB_INACTIVE` con razón estable |

## Cobertura pendiente

Agregar integración con dos laboratorios y un visitador desvinculado para confirmar la guardia junto a RLS. Las pruebas actuales son unitarias; cubrir además descarga documental y farmacovigilancia abierta a clínicos autorizados.
