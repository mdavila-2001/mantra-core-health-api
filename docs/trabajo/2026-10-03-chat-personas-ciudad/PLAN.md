# Plan — búsqueda de personas en chats

- Fecha: 2026-10-03
- Repos: `mantra-core-health` y `mantra-core-health-redesa-api`
- Base: ramas remotas `test` actualizadas.
- Resultado observable: una persona autenticada puede encontrar pacientes y profesionales públicos, activos y no bloqueados, y abrir o reutilizar un chat directo.
- Kill-test: buscar una paciente pública por nombre, seleccionarla y comprobar que la conversación se abre con su `profileId`.

## Alcance

- IN: búsqueda autenticada; pacientes y profesionales; nombres con/sin tilde; privacidad; bloqueos; autorización del bootstrap directo; carrera entre respuestas HTTP; pruebas y PR hacia `test`.
- OUT: rediseño del chat, perfiles privados, grupos y cambios de ciudad/universidad.
- La ciudad por universidad ya estaba integrada en `origin/test` mediante el PR frontend #856; no se duplica en estos cambios.

## H1 — Buscar contactos elegibles

**CA:** con un perfil propio autenticado y una consulta de 2–80 caracteres, devuelve como máximo 20 perfiles públicos/activos de tipo paciente o profesional, sin el perfil propio ni bloqueos en ninguna dirección.

**Estado:** HECHO

| ID | Microtarea | Criterio binario | Estado |
|---|---|---|---|
| H1.1 | Contrato autenticado | POST validado y sin nombres en URL/cache | HECHO |
| H1.2 | Consulta segura | filtra privacidad, estado, tipo, propio y bloqueos | HECHO |
| H1.3 | Acentos y rendimiento | `maria` encuentra `María`; el GIN existente acota candidatos | HECHO |

## H2 — Abrir el chat sin saltarse permisos

**CA:** DIRECT exige dos perfiles distintos, el primero pertenece al actor y el destinatario es elegible/no bloqueado; GROUP se rechaza en este bootstrap.

**Estado:** HECHO

| ID | Microtarea | Criterio binario | Estado |
|---|---|---|---|
| H2.1 | Autorizar iniciador | no sondea ni crea desde perfil ajeno | HECHO |
| H2.2 | Validar destinatario | público, activo, tipo permitido y no bloqueado | HECHO |
| H2.3 | Conservar avisos internos | canal SYSTEM admite destinatario privado activo | HECHO |

## H3 — Consumir y publicar

**CA:** el frontend descarta respuestas obsoletas, abre por `profileId`, las pruebas dirigidas pasan y existen PR hacia `test`.

**Estado:** HECHO

| ID | Microtarea | Estado |
|---|---|
| H3.1 | Integración frontend y carrera HTTP | HECHO |
| H3.2 | Verificación dirigida y gates estáticos | HECHO |
| H3.3 | Commit, push y PR API/frontend | HECHO |
