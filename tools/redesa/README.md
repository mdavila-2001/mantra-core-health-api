# tools / redesa

Agrupa los componentes relacionados con **redesa** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `coverage-report.mjs` | Informe estático de cobertura (`yarn redesa:coverage`). |
| `guardrails.mjs` | Guardrails bloqueantes de CI (`yarn redesa:guardrails`). |
| `seed-dev-data.mjs` | Puebla un entorno de desarrollo por la API real (`yarn seed:dev`). |
| `exercise-front-flows.mjs` | Recorre los flujos del frontend **con el token del administrador** y regenera `docs/frontend/CATALOGO-FLUJOS-VERIFICADOS.md` con cuerpos reales. |
| `exercise-clinical-personas.mjs` | Recorre el flujo de cada actor clínico **con su propio rol** (`yarn redesa:personas`). Falla si aparece un 5xx o un 4xx sin `code` del catálogo. |

`exercise-front-flows.mjs` y `exercise-clinical-personas.mjs` no son
intercambiables: el primero demuestra que la **ruta** existe y con qué forma
responde; el segundo, que el actor que debe usarla **puede** usarla. `SUPERADMIN`
atraviesa cualquier `@Roles(...)` por comodín, así que un flujo verde con el
administrador no dice nada sobre los permisos reales.

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
