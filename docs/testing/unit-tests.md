# Pruebas unitarias

> Fase 15. `yarn test` — resultado real en `docs/reports/baseline.md` §5.

## Resultado

```
Test Suites: 370 passed, 370 total
Tests:       3732 passed, 3732 total
```

100% verde sobre el commit `15c132d3`. Sin infraestructura externa — dependencias simuladas.

## Advertencia conocida — handle sin liberar

Jest reporta *"A worker process has failed to exit gracefully... Active timers can also cause
this"*. No afecta el resultado (exit 0), pero indica un temporizador o conexión no liberada en
algún test o en el código bajo prueba. Registrado como `TEST-002` en
[matriz de trazabilidad](../governance/traceability-matrix.md), `MEDIUM`, no investigado a fondo
en esta fase — recomendación: `yarn test --detectOpenHandles` para localizarlo.

## Cobertura

`yarn test:cov` genera cobertura unitaria; `yarn test:cov:merged` la combina con integración. No
se ejecutó en esta fase (no había un umbral de cobertura mínimo declarado en el repositorio contra
el cual comparar el resultado).

## Patrón observado

Specs unitarios (365 archivos `.spec.ts`, ver [system-inventory.md](../reports/system-inventory.md))
siguen el mismo patrón de capas del código: mock del repositorio/dependencias, verificación del
comportamiento del service/controller en aislamiento — coherente con el patrón de capas descrito
en [componentes](../architecture/components.md).
