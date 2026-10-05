# Reporte — Perfil: tutores, dependientes y contactos de emergencia

- Fecha: 2026-10-05
- Rama: `codex/perfil-tutores-api`
- Base: `origin/dev`

## Resultado

El perfil propio separa ahora dos conceptos que antes compartían la misma lista:

- `emergencyContacts` contiene únicamente contactos de emergencia activos;
- `guardians` contiene únicamente cuentas con un apoderamiento activo y vigente sobre el paciente.

Cada persona incluye el parentesco legible. Al aceptar una solicitud de dependencia, el cliente puede enviar `relationshipConceptId`; el cuerpo continúa siendo opcional y los clientes anteriores conservan el valor de respaldo `Otra relación`. No se modificó el esquema de base de datos ni la autorización clínica.

## Cambios principales

- Consulta específica de contactos de emergencia activos desde `related_persons`.
- Consulta específica de representantes desde `patient_portal_proxies`, con estado, vigencia y vínculo de cuenta activos.
- Contrato de perfil propio con `emergencyContacts` y tutores sin la marca de contacto de emergencia.
- Aceptación de solicitud con parentesco validado contra los conceptos permitidos para dependencias.
- OpenAPI regenerado desde los decoradores reales.

## Evidencia

| Verificación | Resultado |
|---|---|
| ESLint dirigido sobre los 11 archivos TypeScript modificados | PASS |
| `yarn test modules/profiles/services/profiles-patients.service.spec.ts modules/profiles/services/dependent-link-requests.service.spec.ts modules/profiles/controllers/profiles-dependent-requests.controller.spec.ts --runInBand` | PASS: 3 suites, 169 pruebas |
| `yarn build` | PASS |
| `node tools/openapi/generate-openapi.mjs` con PostgreSQL temporal y `ORM_SCHEMA_SYNC=off` | PASS: 1338 rutas, 1469 operaciones y 1318 esquemas tras rebase sobre `origin/dev` |
| `yarn docs:openapi:lint` | No verde por 3 errores `security-defined` ajenos al alcance: dos rutas públicas ya fallan en el artefacto de `origin/dev`; el tercero corresponde a `upload-registration-signature-image`, fuente preexistente incorporada por la regeneración completa |
| `yarn docs:build` | No ejecutable en este equipo: el alias `python3` no tiene una instalación de Python |
| Suite global de Jest | No verde por deuda ajena: `insurance-controllers.spec.ts` espera 2 roles y recibe 6; posteriormente el proceso agota el heap al cargar el conjunto completo de JSON |

El kill-test confirma que un contacto de emergencia sin `patient_portal_proxies` activo nunca aparece en `guardians`. También hay cobertura de la relación elegida, del valor de respaldo para clientes anteriores y del cuerpo HTTP opcional.

## Infraestructura y despliegue

No hubo despliegue. Para generar OpenAPI se usó únicamente un PostgreSQL 16 temporal, sin volumen y sin sincronización de esquema. El contenedor fue detenido y Docker Desktop fue apagado inmediatamente después. No quedaron servidores de la aplicación en ejecución.

## Riesgo y reversión

El cambio es aditivo para la respuesta (`emergencyContacts`) y conserva la aceptación sin cuerpo. La UI nueva requiere ambas mitades para mostrar el parentesco explícito, pero un despliegue escalonado sigue funcionando. La reversión consiste en revertir este commit; no hay migraciones ni datos que deshacer.
