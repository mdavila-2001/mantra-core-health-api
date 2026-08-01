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

## Declaración de esta auditoría

Este runbook es un procedimiento **esperado**, no uno **probado**. No ejecutar en un incidente
real sin antes confirmar que el mecanismo de backup subyacente existe y es restaurable — ver
`OPS-004` en [matriz de trazabilidad](../../governance/traceability-matrix.md).
