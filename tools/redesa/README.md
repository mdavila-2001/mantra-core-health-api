# tools / redesa

Agrupa los componentes relacionados con **redesa** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `coverage-report.mjs` | Informe estático de cobertura (`yarn redesa:coverage`). |
| `guardrails.mjs` | Guardrails bloqueantes de CI (`yarn redesa:guardrails`). |
| `seed-dev-data.mjs` | Puebla un entorno de desarrollo por la API real (`yarn seed:dev`). Acumulativo: cada corrida agrega una tanda nueva a propósito, para ejercitar el dominio. |
| `faker-worker.mjs` | Tráfico de aplicación realista y a escala — médicos con vitrina pública y publicaciones, pacientes — con disciplina **cache-first** (`yarn faker`): si el target ya tiene la tanda pedida, no genera de nuevo. Variables `FAKER_*` documentadas en `.env.example`. Ver `evidencias/faker-worker/`. |
| `seed-vitrina-publica.mjs` | Puebla la **cara pública** por la API real (`yarn seed:vitrina`): 15 profesionales con vitrina, especialidad, trayectoria completa —universidades y hospitales bolivianos— y 4 publicaciones con imagen cada uno; 16 vecinos con documento y contraseña que las comentan y reaccionan; y clínicas, laboratorios y farmacias verificados. Los datos viven en `datos/`. `--solo-interaccion` sanea lo ya publicado sin crear nada nuevo. |
| `datos/elenco-medico.mjs` | Los 15 profesionales y su trayectoria etapa por etapa. La formación académica se guarda como afiliación porque el modelo no tiene tabla de títulos; la cabecera del archivo explica por qué. |
| `datos/publicaciones.mjs` | Las 60 publicaciones de divulgación, cuatro por especialidad, con etiquetas e imagen. |
| `datos/comunidad.mjs` | Los vecinos que comentan y reaccionan, sus 120 comentarios por especialidad y el pool general para sanear publicaciones viejas. |
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
