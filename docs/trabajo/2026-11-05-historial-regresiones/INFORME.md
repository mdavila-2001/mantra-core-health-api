# Historial de regresiones de la API — 22/10/2026 a 05/11/2026

> Parte API (y modelo) del informe de regresiones. El informe completo, con el front, los
> números globales, las causas raíz y las propuestas, vive en el repositorio del front:
> `mantra-core-health` → `docs/trabajo/2026-11-05-historial-regresiones/INFORME.md`.

## Cómo se midió

`git log` sobre `origin/dev`, `--since=2026-10-22`, consultado el 05/11/2026. Tiempos en UTC
desde las fechas de commit: son cota inferior (hasta que alguien lo arregló, no hasta que
alguien lo notó). Los conteos por mensaje subestiman el total.

| | API | modelo |
|---|---:|---:|
| Commits alcanzables desde `dev` | 1 986 | 234 |
| Merges | 644 | 93 |
| Asuntos de commit repetidos (mismo trabajo en 2+ ramas) | 260 | — |

## Incidentes

| # | Qué pasó | Duración | Arreglo | Causa |
|---|---|---|---|---|
| API-1 | **Un merge borró una política RLS.** `5b6484cc` («integrate dev and regenerate canonical backend contracts», 03/11 13:38) borró `2026-11-02_v4284_rls_community_public_read.sql`, aprobado en el PR #1274. Sin ella, un paciente no veía bajo RLS la ficha pública de un profesional de otra organización y abrir el chat respondía 412. | ≈ 33 h | `76d0658cf` (04/11 22:36) | Merge con regeneración de contratos que arrastró un borrado sin revisión |
| API-2 | **Pagos: se quitó un `FOR UPDATE`.** `dbe8eb73` («wip(ola-5): trabajo de agentes en curso, SIN VERIFICAR por el integrador», 30/10 04:21) capturó la copia de trabajo en mitad de una mutación de prueba: `associate` pasó de `findByIdForUpdate` a `findById`. El commit está en la historia de `dev` y de 118 ramas remotas. | 24 s entre commit y restauración | `ea22ef3f6` (30/10) | Commit `wip` con código en mutación. **No verifiqué si llegó a un despliegue** |
| API-3 | **`dev` no compilaba.** La fusión de `dev` en la rama de F0+F1 dejó identificadores duplicados y una llamada a un método renombrado; 14 errores de `tsc` en specs por el merge con `test`. | no medida | `1c20ab035`, `e5c7e1c46` (30/10) | Merge dev→rama larga. Quedaron 6 pruebas y `permission-drift-gate` (28 rutas sin `@Roles` ni `@Public`) fuera del arreglo |
| API-4 | Efectos de forzar RLS el 04/11: `em.fork()` plano descartaba la transacción y leía 0 filas; el reclamo de un archivo pre-subido daba 422; las sedes se leían fuera de la transacción. | — | `a6bc30dda`, `cd6800975`, `b244e517f` | No es merge: defectos que destapó activar RLS; se arreglaron en cadena el mismo día |
| API-5 | `Revert` de «paciente y médico sin organización usan la plataforma (espacio personal)». | — | `229ae3758` (01/11) | Cambio revertido tras integrarse |
| MOD-1 | El merge de `dev` dejó un `model-manifest.yaml` que **perdía** entradas v4.2.68/v4.2.82 y el recuento de model#102. | — | `072f580` (01/11) | Resolución de conflicto que dejó un lado |
| MOD-2 | `apply_all.sql` no incluía `05_constraints.sql`: en una base creada solo desde ese runner no existían 6 CHECK de `tenant_medical_facilities`. | — | `24c3af5` (28/10) | El archivo se creó sin regenerar el runner |

## Lo que más importa de esta parte

- **API-1 y API-2 tocan seguridad y dinero.** Una política de acceso y un bloqueo de fila en
  un cobro desaparecieron por mecánica de Git, no por una decisión. Hay que confirmar que
  ningún despliegue contuvo `dbe8eb73` ni el estado entre `5b6484cc` y `76d0658cf`.
- **Los gates de la API no cubrieron ninguno:** ni `yarn build` ni las pruebas de unidad
  detectan un `.sql` borrado ni un `findById` donde antes había `ForUpdate`. Se necesita una
  prueba de integración por política RLS y una prueba de concurrencia en `associate`.
- **Un merge que borra archivos** debe revisarse uno por uno antes de aceptarse
  (`git diff --diff-filter=D origin/dev HEAD`).

## Qué falta verificar

- Si API-1 o API-2 llegaron a un entorno desplegado.
- (Verificado) El merge `5b6484cc` borró respecto de su segundo padre tres `.sql`, no uno:
  `v4284_rls_community_public_read` (**pérdida real**, restaurada por `76d0658cf`),
  `v4285_rls_pharmacies_marketplace_read` (**no es pérdida**: `v4286` redefine la misma
  política `pharmacies_marketplace_read` con otro criterio, `app.marketplace_viewer`) y
  `tools/terminology-import/symptoms/proposal/concept_relationship_evidence.sql` (una
  propuesta; la entidad existe en `src`). Los dos archivos de catálogo ORM que también desaparecieron (`delegated_access.fk.ts` y
  `.idx.ts`) **no son pérdida**: en `dev` existen partidos como `delegated_access.1/.2`.
- Regresiones sin mensaje explícito: este informe no las ve.
