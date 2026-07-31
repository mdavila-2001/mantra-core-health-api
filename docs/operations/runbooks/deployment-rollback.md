# Runbook: Rollback de despliegue

> Fase 14. Ver [rollback](../rollback.md) para el procedimiento completo y sus limitaciones —
> este runbook es la secuencia operativa breve para ejecutarlo bajo presión de incidente.

## Cuándo se activa

Un despliegue reciente causó [aumento de errores 5xx](5xx-increase.md), regresión funcional, o
degradación de rendimiento no explicada por causas de infraestructura.

## Antes de revertir

1. Confirmar que el problema empezó con el despliegue (correlacionar hora del despliegue con
   inicio de los síntomas en logs).
2. **Verificar si el despliegue incluyó un cambio de esquema de base de datos.** Si sí, ver
   [rollback](../rollback.md) §"Rollback de esquema de base de datos — el problema real" **antes**
   de revertir el código — revertir solo el código contra un esquema más nuevo puede fallar peor
   que no revertir nada.

## Procedimiento

```bash
git checkout <commit-anterior-conocido-bueno>
docker compose build
docker compose up -d
```

Sin registro de imágenes versionadas (ver [despliegue](../deployment.md)), este es el único
camino de rollback verificado hoy.

## Verificación post-rollback

1. `GET /health` responde `200`.
2. Confirmar que los errores/síntomas originales desaparecieron.
3. Confirmar que los 20 workers siguen funcionando contra el código revertido (mismo `command`,
   misma imagen reconstruida).

## Comunicación

Notificar al equipo dueño del cambio revertido — un rollback no es el cierre del incidente, es
la mitigación; la causa raíz del cambio problemático sigue pendiente de corrección.

## Ver también

- [Rollback](../rollback.md), [Aumento de errores 5xx](5xx-increase.md).
