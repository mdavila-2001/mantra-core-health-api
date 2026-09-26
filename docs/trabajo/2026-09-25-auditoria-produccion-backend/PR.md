## Resumen

Publica la auditoría estricta del backend: 10 hallazgos priorizados, 7 bloqueantes para aprobar el snapshot, referencias por archivo/línea, responsables sugeridos, criterios de cierre y evidencia reproducible.

**Este PR no corrige los defectos ni aprueba producción.** La auditoría corresponde a `4dcaa27961588444bcfdeb4cbe8a3aa2d1b71650`; la rama de publicación parte de `dev` actualizado (`52a696b34e56511cf7d67a7549a443f8b0740c29`). No se presentan las pruebas históricas como resultados del nuevo HEAD.

## Qué y por qué

El usuario solicitó versionar y abrir PR del informe ya entregado. Sólo incorpora `docs/trabajo/2026-09-25-auditoria-produccion-backend/`: plan, reporte, evidencia, scripts de inventario y nueve reproducciones sintéticas. No cambia `src`, dependencias, configuración de ejecución, contratos ni esquemas.

El diff voluminoso incluye la salida completa de cobertura y logs diagnósticos. Se normalizó únicamente la codificación de las salidas UTF-16 a UTF-8 para revisión; su texto no fue alterado.

## Casilla documental (obligatoria)

- [x] Nada de lo anterior — no cambia rutas/DTO, entidades, eventos, permisos, READMEs de módulos ni introduce una nueva decisión arquitectónica. El cambio es el entregable documental de auditoría.

## Cómo probar

1. Leer `REPORTE.md` y contrastar con `EVIDENCIA.md` dentro del directorio de auditoría.
2. Verificar el diff: `git diff origin/dev...HEAD --name-only`; sólo debe listar ese directorio.
3. Las reproducciones corresponden al **SHA auditado**, con sus dependencias inmutables instaladas. En ese snapshot, ejecutar desde la raíz:

```sh
node --experimental-vm-modules node_modules/jest-cli/bin/jest.js --config docs/trabajo/2026-09-25-auditoria-produccion-backend/jest.audit.json --runInBand
```

Los tests usan datos sintéticos y dobles de persistencia. **Un test verde confirma la presencia del defecto**, no su reparación; no se incorporan al gate unitario normal del producto. Si se ejecutan contra código posterior corregido, pueden fallar precisamente porque cambió el defecto.

## Evidencia

Salida histórica literal del SHA auditado:

```text
TYPECHECK_EXIT=0
BUILD_EXIT=0
LINT_EXIT=1

Test Suites: 1 skipped, 711 passed, 711 of 712 total
Tests:       1 skipped, 8639 passed, 8640 total
UNIT_COVERAGE_EXIT=1
```

El exit 1 de cobertura corresponde a los cuatro umbrales incumplidos. Lint reportó 19 errores y 1 advertencia. Reproducciones de auditoría:

```text
Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
REPRO_EXIT=0
```

Las salidas completas, métricas, sondas locales y metadatos de CI están versionados. Se abre **en draft**: no se afirma CI verde ni se solicita merge.

## No cubierto

Integración/RLS en DB real, WS por red/múltiples réplicas, carga, recuperación, infraestructura de producción, frontend y validación integral del nuevo HEAD. Tampoco se aplicaron las remediaciones propuestas.

## Riesgo y reversión

No modifica comportamiento de runtime, contrato ni datos. Contiene hallazgos de seguridad y reproducciones sintéticas, no credenciales ni datos clínicos reales. Mantener el contexto del SHA para no interpretar evidencia histórica como validación actual. Reversión: revertir el commit documental; no hay migraciones ni cambios de datos que revertir.
