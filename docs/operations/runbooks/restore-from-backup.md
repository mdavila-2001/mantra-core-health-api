# Runbook: Recuperación desde backup

> Fase 14. **Advertencia explícita:** ver
> [recuperación ante desastres](../disaster-recovery.md) — no hay estrategia de backup verificada
> ni ejercicio de restauración probado en este sistema al momento de esta auditoría. Este runbook
> documenta el procedimiento genérico esperado; **no se ha ejecutado ni verificado contra este
> sistema real**.

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

## Ensayo local (MCH-016) — qué prueba y qué no

`scripts/recovery/drill-postgres.sh` demuestra el mecanismo de `pg_dump`/`pg_restore` contra el
propio motor local: mide un `pg_dump` y un `pg_restore` reales sobre una base de trabajo aparte
(`mantra_restore_drill`, dentro del mismo contenedor, borrada al terminar) y compara conteos de
filas de un puñado de tablas contra el origen. Nunca escribe en la base de origen.

**Esto NO es la prueba que pide el hallazgo completo.** Sigue sin demostrarse:

- restauración en infraestructura **nueva** (este ensayo restaura en el mismo motor y el mismo
  volumen que ya tiene los datos — no prueba recuperación ante la pérdida real de ese volumen);
- MongoDB y los objetos de MinIO (sólo PostgreSQL);
- una muestra clínica completa con adjuntos y trazabilidad consistente entre almacenes;
- RPO (el ensayo no simula una ventana de pérdida entre un respaldo y un incidente — con el
  contrato de MCH-023, el resultado de esa dimensión es `NOT_MEASURED`, no aprobado por omisión);
- backup real de producción (corre contra el volumen de desarrollo de quien lo ejecuta).

Uso: `scripts/recovery/drill-postgres.sh` (variables de entorno documentadas en el propio script).
Al terminar, escribe una evidencia JSON con fecha, tiempos medidos y qué quedó sin medir — nunca
"recuperación probada" por haberlo corrido en la máquina de desarrollo.

## Declaración de esta auditoría

Este runbook sigue siendo, en lo esencial, un procedimiento **esperado**, no uno **probado**: el
ensayo de arriba cubre el mecanismo de PostgreSQL, no el runbook completo (Mongo, objetos, RPO,
infraestructura nueva). No ejecutar el procedimiento completo en un incidente real sin antes
confirmar que el mecanismo de backup subyacente existe y es restaurable — ver `OPS-004` en
[matriz de trazabilidad](../../governance/traceability-matrix.md).
