# Runbook: Recuperación desde backup

> Fase 14. **Advertencia explícita:** ver
> [recuperación ante desastres](../disaster-recovery.md) — no hay estrategia de backup verificada
> ni ejercicio de restauración probado en este sistema al momento de esta auditoría. Este runbook
> documenta el procedimiento genérico esperado; **no se ha ejecutado ni verificado contra este
> sistema real**.
>
> **Actualización MCH-016 (2026-09-19):** lo único que sí se ejecutó es un **ensayo local** de
> `pg_dump`/`pg_restore` en la máquina de desarrollo. Está medido y documentado más abajo, en
> [Ensayo local](#ensayo-local-lo-único-que-sí-se-ejecutó). No cambia la advertencia de arriba:
> un ensayo local **no es** recuperación ante desastre probada.

## Cuándo se activa

Pérdida o corrupción del volumen de PostgreSQL (u otro almacén) sin posibilidad de recuperación
por otros medios.

## Procedimiento esperado (no verificado)

1. Detener `api` y los 20 workers (evitar escrituras contra un estado inconsistente).
2. Restaurar el backup más reciente del almacén afectado — **el mecanismo real de backup no está
   definido en este repositorio**; este paso depende de la infraestructura real del entorno, no
   documentada aquí.
3. Verificar integridad post-restauración: `yarn orm:audit` contra el catálogo, comprobar que las
   1184 entidades resuelven consultas básicas.
4. Verificar `RLS_ENFORCE` y aislamiento de tenant antes de reabrir tráfico (ver
   [aislamiento de tenant](../../security/tenant-isolation.md)) — una restauración no debe asumirse
   segura sin volver a confirmar esto.
5. Reiniciar `api`, verificar `/health`, reiniciar los 20 workers.
6. Comunicar la ventana de pérdida de datos real (todo lo escrito entre el backup y el incidente)
   a las partes afectadas — obligatorio si involucra PHI (ver
   [modelo de amenazas](../../security/threat-model.md) §"Notificación de brecha").

## Ensayo local: lo único que sí se ejecutó

`scripts/recovery/drill-postgres.sh` vuelca la base local con `pg_dump`, la restaura en una base
de trabajo aparte del mismo contenedor (`mantra_restore_drill`), compara los conteos de diez tablas
centinela, contrasta las referencias de adjuntos contra los objetos de MinIO y mide el tiempo. La
base principal **sólo se lee**; la de trabajo se borra al terminar.

```bash
bash scripts/recovery/drill-postgres.sh
DRILL_KEEP=1 bash scripts/recovery/drill-postgres.sh   # conserva la copia para inspeccionarla
```

Deja un informe con fecha en `.drill/` (ignorado por git: es evidencia de esa máquina y ese
momento).

### Lo que se midió el 2026-09-19

Entorno: Docker Desktop en Windows, `mantra-redesa-postgres-1` (timescaledb-ha:pg18), base
`mantra_redesa_health` de desarrollo.

| Medición | Valor |
|---|---|
| `pg_dump` | 3 s · 10 079 357 bytes |
| `pg_restore` | 69 s, sin errores |
| **RTO local** (volcado + restauración) | **72 s** |
| RPO | **no medido** |
| Conteos de las 10 tablas centinela | coinciden origen/restaurada |
| Adjuntos | **nada que ensayar**: 0 referencias y 0 objetos |

**Este número de RTO no es el RTO del sistema.** Es el de una base de desarrollo casi vacía
(3 usuarios, 26 tenants, 0 encuentros clínicos, 0 archivos) en la misma máquina y el mismo motor.
Con volumen real y con el traslado de la copia a otro host, será mayor — cuánto, no se sabe.

### Lo que sigue sin demostrarse

Esto es lo que la ficha MCH-016 pide y el ensayo local **no** cubre. Son bloqueos concretos, no
pendientes genéricos:

1. **Restauración en infraestructura nueva.** El ensayo restaura en el mismo motor y la misma
   máquina, así que no prueba que un host vacío pueda reconstruirse.
   *Qué falta:* un entorno de laboratorio efímero (una VM o un proyecto cloud descartable) donde
   restaurar desde cero. *Quién lo puede dar:* quien administre la infraestructura de despliegue.
2. **Una muestra clínica completa con adjuntos.** No hay con qué: `clinical.encounters`,
   `common.files` y el bucket de MinIO están vacíos en desarrollo, y el volcado de Postgres no
   incluye los bytes de los objetos. El script ya compara referencias contra objetos y **falla**
   (código 1) mientras no pueda demostrar nada sobre adjuntos — a propósito, para que la ausencia
   no se lea como éxito.
   *Qué falta:* un juego de datos sintéticos con adjuntos reales cargados, y el volcado de MinIO
   junto al de Postgres. *Quién lo puede dar:* el equipo que mantiene los seeds de desarrollo.
3. **RPO.** Un `pg_dump` a demanda tiene pérdida cero por construcción, no por una capacidad
   demostrada; informar `RPO=0` desde ahí sería inventar evidencia.
   *Qué falta:* un backup programado real y su periodicidad. *Quién lo puede dar:* quien defina
   el mecanismo de backup de producción, que hoy no está en este repositorio.
4. **Consistencia entre almacenes.** Mongo, OpenSearch, Redis y MinIO no entran en el volcado.
   Una restauración sólo de Postgres deja el sistema coherente consigo mismo y no con el resto.

### Cómo se registra el resultado

`POST /internal/ops/restore-test-runs` con `measuredRtoSeconds` y **sin** `measuredRpoSeconds`.
El servicio devuelve `objectiveStatus: NOT_MEASURED` (MCH-023), que es lo correcto: falta evidencia
para declarar el objetivo cumplido. No registrar un `outcome` de éxito por haber corrido el script.

## Declaración de esta auditoría

Este runbook es un procedimiento **esperado**, no uno **probado**. No ejecutar en un incidente
real sin antes confirmar que el mecanismo de backup subyacente existe y es restaurable — ver
`OPS-004` en [matriz de trazabilidad](../../governance/traceability-matrix.md).
