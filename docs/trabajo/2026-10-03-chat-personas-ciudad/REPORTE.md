# Reporte — búsqueda de personas en chats

- Fecha: 2026-10-03
- Plan: [PLAN.md](./PLAN.md)
- Rama en ambos repos: `codex/fix-chat-personas-test`
- Evidencia: TESTED en los flujos modificados; no se declara regresión global.

## Completado

- Endpoint autenticado `POST /community/conversations/contacts/search`, con body validado y `Cache-Control: private, no-store`.
- Resultados limitados a pacientes y profesionales públicos/activos, excluyendo perfil propio y bloqueos en ambas direcciones.
- Coincidencia sin tildes mediante funciones nativas; el índice GIN existente acota primero por prefijos.
- Bootstrap directo autorizado: perfil iniciador propio, exactamente dos participantes distintos, destinatario elegible y sin bloqueo.
- El bootstrap público rechaza grupos; sus membresías siguen en el flujo específico de grupos.
- Canal interno `SYSTEM` separado para que avisos de agenda no dependan de la visibilidad pública del destinatario.
- Frontend abre directamente por `profileId` y descarta respuestas HTTP obsoletas desde la primera tecla nueva.
- La corrección de ciudad no se incluye: ya fue integrada en `origin/test` por el PR frontend #856.

## Verificación

- API: 6 suites, 88 pruebas, salida 0.
- Frontend: 1 archivo, 11 pruebas, salida 0.
- Typecheck frontend, ESLint dirigido y `git diff --check`: salida 0.
- Los fallos globales preexistentes de `xlsx`, terminología/editor y memoria permanecen fuera de alcance; no se declara `REGRESSION_VERIFIED`.

## Riesgos residuales

- La aplicación no tiene un consentimiento separado de “descubrimiento en chat”; se usa la visibilidad pública explícita como opt-in.
- No se ejecutó una prueba E2E contra PostgreSQL con datos persistidos; repositorio, servicio, controller y UI están cubiertos de forma dirigida.

## Entrega

- PR API: pendiente de registrar.
- PR frontend: pendiente de registrar.
