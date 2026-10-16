# Plan — Perfil: tutores, dependientes y contactos de emergencia

- Fecha: 2026-10-05
- Rama: `codex/perfil-tutores-api` (base: `origin/dev`)
- Predecesor: ninguno

## Resultado

Actor: paciente con una representación vigente aceptada.

Dónde: `GET /profiles/patients/me` y aceptación de una solicitud de dependencia.

Estado inicial: una persona puede tener contactos relacionados, solicitudes pendientes y representaciones activas.

Acción: acepta a otra cuenta como representante e indica el parentesco.

Observable: su perfil propio devuelve a esa persona dentro de `guardians`, con nombre, teléfono y relación; un contacto de emergencia queda únicamente en `emergencyContacts`.

Persistencia: al volver a leer el perfil se conserva el vínculo activo y su relación; si la solicitud sigue pendiente o se rechaza, no aparece como tutor.

Fuera: no se cambia la autorización de historia clínica, el flujo de alta de dependientes ni el esquema de base de datos.

Kill-test: una fila de contacto de emergencia sin `patient_portal_proxies` activos no puede aparecer en `guardians`.

## Alcance

- IN: contrato de perfil propio, aceptación de solicitudes, consulta de representantes vigentes y sus pruebas.
- OUT: cambios de tablas, migraciones, permisos clínicos y despliegue.
- Ambigüedad: las solicitudes antiguas no tenían parentesco. Se conservarán como `Otra relación`; las nuevas aceptaciones enviadas por el frontend lo registrarán de forma explícita.

## H1 — Separación contractual

**CA:** Dado un contacto de emergencia sin representación activa, cuando se lee el perfil, entonces aparece solo en `emergencyContacts`, nunca en `guardians`.

**DoD:** pruebas unitarias dirigidas del servicio de perfiles y typecheck pasan.

## H2 — Tutoría aceptada con relación

**CA:** Dada una solicitud pendiente, cuando el paciente la acepta indicando una relación, entonces el apoderamiento activo se enlaza con esa relación y `GET /profiles/patients/me` la devuelve como tutor.

**DoD:** pruebas unitarias del servicio/controlador de solicitudes y de perfiles pasan; integración dirigida si la infraestructura local está disponible.

## H3 — Compatibilidad

**CA:** Dado un cliente anterior que acepta sin cuerpo, cuando se procesa la solicitud, entonces el vínculo sigue activándose con la relación de respaldo `Otra relación`.

**DoD:** prueba de regresión dirigida y build pasan.

## Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| Exponer un contacto como tutor por una fila relacionada | Leer tutores exclusivamente desde proxies activos y vigentes. |
| Romper clientes durante el despliegue escalonado | Mantener el cuerpo de aceptación opcional con valor de respaldo. |
| Exponer relaciones vencidas | Aplicar estado activo y ventana `valid_from/valid_to` en la consulta. |
