# src / common / seed

Agrupa los componentes relacionados con **seed** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Archivos

| Archivo                          | Responsabilidad                                                                                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `concept-seed.ts`                | Implementación o recurso de soporte de esta carpeta.                                                                                                      |
| `module-concepts.ts`             | Implementación o recurso de soporte de esta carpeta.                                                                                                      |
| `seed.module.ts`                 | Composición de dependencias del módulo NestJS.                                                                                                            |
| `terminology-seed.service.ts`    | Casos de uso y reglas de negocio.                                                                                                                         |
| `clinical-forms-seed.service.ts` | Siembra el catálogo de formularios clínicos estándar por especialidad (carril R2-5).                                                                      |
| `bo-geography.catalog.ts`        | Los nueve departamentos de Bolivia y los derivadores deterministas de sus ids.                                                                            |
| `bo-geography-seed.service.ts`   | Siembra `VS_BO_DEPARTMENT`: el conjunto, su versión vigente y los nueve miembros. Lo lee el registro público para «departamento que emitió tu documento». |
| `bo-employers.catalog.ts`        | Las empresas y empleadores de Bolivia, su sector y los derivadores deterministas de sus ids. Documenta qué publica el SEPREC y por qué la lista no puede ser exhaustiva. |
| `bo-employers-seed.service.ts`   | Siembra `VS_BO_EMPLOYER`: el conjunto, su versión vigente y sus miembros. Lo lee el alta de paciente para «¿en qué empresa trabajás?», que reemplazó a la ubicación del trabajo. |
| `affiliation-catalogs.catalog.ts` | Los cuatro conjuntos del onboarding legal de una organización (tipo de documento de afiliación, autoridad emisora, estado de verificación, rol del representante legal), con la procedencia de cada código. |
| `affiliation-catalogs-seed.service.ts` | Siembra esos cuatro conjuntos de forma idempotente. Sin ellos `register-organization` responde 422 «El catálogo de documentos de afiliación no está disponible». Si el paquete de seeds del modelo ya los cargó, no los toca. |
| `seed-actor.ts`                  | El actor semilla (id determinista, sin credencial) que firma lo que siembra la plataforma, y `ensureSeedActor`, que lo crea si falta. |
| `demo-gate.ts`                   | Candado común de las cuentas de demostración: exigen `SEED_DEMO_PASSWORD` y, en `production`, `SEED_DEMO_ALLOW_PRODUCTION=true`. |
| `padron-organizations-seed.service.ts` | Crea como organizaciones los establecimientos del padrón público (`health-facilities.dataset.json`, sin los consultorios de red) con id determinista. Adopta las `CARGA_*` de la carga anterior en vez de duplicarlas. |
| `padron-org-admins-seed.service.ts` | Una cuenta `admin.<organización>@alovida.test` por organización (salvo centros de salud) y por aseguradora, con membresía ADMIN. Solo con el candado de demostración abierto. |
| `practitioner-showcase-seed.ts`  | Crea la vitrina pública de un profesional sembrado por el mismo caso de uso que `PUT /community/profiles/me`. |
| `seed-census.service.ts`         | Censo de lo que dejó la carga (conteos por paso) que `seed-cli` imprime al final, para comparar entornos con `diff`. |
| `data/clinical-forms/`           | El contenido de ese catálogo: un `.json` por formulario, con su ficha de procedencia. Tiene su propio `README.md`.                                        |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.

## Ejecución y límite operativo

La cadena se ejecuta en bootstrap con `SEED_ON_BOOT=true`, o una sola vez con
`corepack yarn seed:boot`; `SEED_CONTENT_ON_BOOT=false` omite sólo contenido
curado. Los IDs deterministas permiten repeticiones sin duplicados. Ejecutar
`corepack yarn test --runInBand --silent src/common/seed` para los tests
dirigidos. Un fallo de paso core hoy se registra y resume sin bloquear por sí
solo el bootstrap.

### Carga de datos del padrón

Cada paso se enciende con su variable y, apagado, no hace nada:

| Variable                               | Paso (`--only=<id>`)                                              |
| -------------------------------------- | ----------------------------------------------------------------- |
| `SEED_PADRON_ORGANIZATIONS_ENABLED`    | `padron-organizaciones`: organizaciones del padrón (todos los entornos; no crea cuentas) |
| `SEED_PADRON_ORG_ADMINS_ENABLED`       | `padron-administradores`: un administrador por organización (demostración) |
| `SEED_PEOPLE_ENABLED`                  | `padron-de-personas`: médicos y pacientes del padrón, con vitrina de los médicos (demostración) |
| `SEED_DIRECTORY_NETWORKS_ENABLED`      | `directorio-de-redes-de-aseguradoras`: médicos de red con vitrina (demostración) |
| `SEED_SEARCH_REINDEX`                  | `reindex-buscador`: reindexa el directorio público al final       |

Los pasos de **demostración** crean cuentas con la contraseña compartida
`SEED_DEMO_PASSWORD` y solo corren si, además, `SEED_DEMO_ALLOW_PRODUCTION=true`
(los entornos corren con `NODE_ENV=production`, así que ese permiso es lo que
distingue un entorno de pruebas de uno real). Los correos son siempre
`@alovida.test`. De las personas del padrón se toman solo nombre, apellidos,
matrícula y ocupación; cédula, nacimiento, celular, correo y domicilio se
inventan de forma determinista (`synthetic-person.ts`). El padrón de personas
se lee en el momento desde `SEED_PEOPLE_SOURCE_DIR` y no se copia al repositorio.

`node dist/src/seed-cli.js --only=<id>,<id>` corre solo esos pasos (un id
desconocido falla y lista los válidos). Al terminar imprime un censo con
`paso<TAB>etiqueta<TAB>conteo` por línea; dos entornos con la misma carga dan
el mismo censo.
