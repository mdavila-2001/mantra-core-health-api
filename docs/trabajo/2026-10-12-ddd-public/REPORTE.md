# Reporte — DDD public

- Fecha: 2026-10-12 · Rama: `justin/ddd-public-dev`
- Peldaño de evidencia alcanzado: `VERIFIED` para la organización en capas DDD (`presentation/`, `application/`, `infrastructure/`, `domain/`).
- Pruebas dirigidas: 4 suites / 31 tests de `public` aprobados (100 %).
- Typecheck: 0 errores (`tsc --noEmit`).
- ESLint: 0 errores.
- Guardarraíl de arquitectura: 11/11 tests aprobados en `module-layering.spec.ts` (incluyendo `public`).

## Cambios realizados
1. `presentation/controllers`: `PublicCatalogController` (`GET /public/profiles/o/:slug/services`, `GET /public/profiles/f/:slug/products`).
2. `presentation/dto`: `PublicCatalogPageQueryDto`, `PublicOfferedServicePageDto`, `PublicPharmacyProductPageDto`, etc.
3. `infrastructure/repositories`: `PublicCatalogRepository` (consultas SQL directas sobre perfiles, servicios y productos visibles).
4. `application/services`: `PublicCatalogService` (orquestación de lectura pública, control de tipo de perfil y paginación keyset).
5. `domain/`: Reglas puras, validación y proyecciones públicas (`formatPublicService`, `formatPublicProduct`, constantes y tipos de fila puros), desacoplados de MikroORM y Nest.
6. `src/architecture/module-layering.spec.ts`: incorporado `public` a `MIGRATED_MODULES`, validando las 4 capas y el respeto estricto de dependencias.

## Comandos de verificación
```bash
corepack yarn tsc --noEmit -p tsconfig.json
# exit 0
corepack yarn test src/modules/public
# Test Suites: 4 passed, 4 total
# Tests: 31 passed, 31 total
corepack yarn test src/architecture/module-layering.spec.ts
# Test Suites: 1 passed, 1 total
# Tests: 11 passed, 11 total
corepack yarn eslint src/modules/public
# exit 0
```
