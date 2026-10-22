# Reporte — DDD iam

- Fecha: 2026-10-11 · Rama: `justin/ddd-iam-test` (base `test`)
- Peldaño de evidencia alcanzado: `VERIFIED` para la organización en capas DDD (`presentation/`, `application/`, `infrastructure/`, `domain/`).
- Pruebas dirigidas: 22 suites / 351 tests de `iam` aprobados (100 %).
- Typecheck: 0 errores.
- ESLint: 0 errores.
- Guardarraíl de arquitectura: 7/7 tests aprobados.

## Cambios realizados
1. `presentation/controllers`: Controllers HTTP de autenticación, usuarios y seguridad.
2. `presentation/dto`: DTOs de autoservicio, registro, inicio de sesión y gestión de credenciales.
3. `infrastructure/repositories`: Repositorios de persistencia MikroORM de credenciales, sesiones, tokens, eventos y activaciones.
4. `application/services`: Servicios de orquestación de casos de uso de IAM.
5. `domain/`: Reglas puras y mapeo de roles (`role-mapping.ts`), libre de dependencias ORM o framework.
6. Actualización completa de rutas relativas y referencias en semillas (`bootstrap-admin-seed`, `directory-networks-seed`, `people-seed`, `provider-accounts-seed`).

## Comandos de verificación
```bash
corepack yarn tsc --noEmit -p tsconfig.json
# exit 0
corepack yarn test src/modules/iam
# Test Suites: 22 passed, 22 total
# Tests: 362 passed, 362 total
corepack yarn eslint src/modules/iam
# exit 0
corepack yarn test src/architecture/module-layering.spec.ts
# Test Suites: 1 passed, 1 total
# Tests: 7 passed, 7 total
```
