# Evidencia — búsqueda de personas en chats

## API

```text
node --experimental-vm-modules node_modules/jest-cli/bin/jest.js --runInBand \
  src/modules/community/repositories/public-profiles.repository.spec.ts \
  src/modules/community/services/community-messaging.service.spec.ts \
  src/modules/community/dto/read-messaging.dto.spec.ts \
  src/modules/community/controllers/community-messaging.controller.spec.ts \
  src/modules/community/services/community-messaging-read.service.spec.ts \
  src/modules/scheduling/adapters/support-admin-notice.adapter.spec.ts

Test Suites: 6 passed, 6 total
Tests:       88 passed, 88 total
exit code: 0
```

## Frontend

```text
corepack yarn test --watch=false --include src/app/features/messaging/messaging.spec.ts

Test Files  1 passed (1)
Tests  11 passed (11)
exit code: 0
```

La compilación de la prueba emitió advertencias NG8113 en componentes no modificados; no produjo errores.

## Gates estáticos

```text
frontend: corepack yarn typecheck
exit code: 0

frontend: corepack yarn eslint <6 archivos modificados>
exit code: 0

API: node_modules\.bin\eslint.cmd <13 archivos modificados>
exit code: 0

frontend/API: git diff --check
exit code: 0
```

## Regresión global

No se declara `REGRESSION_VERIFIED`. En ejecuciones previas de la base completa se observaron fallos ajenos a este cambio: dependencia `xlsx` ausente en API, expectativas antiguas de seguros, pruebas de terminología/editor y agotamiento de memoria.
