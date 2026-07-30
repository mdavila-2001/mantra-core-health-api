# Controladores de contexto de salud

Capa HTTP: recibe, delega y devuelve. Sin lógica de negocio.

## Controlador

Uno, `HealthContextController`, con prefijo `/health-context`. Reparte entre
`ContextCollectionService` (agentes, fuentes, programaciones, corridas y observaciones) y
`CountryContextService` (contextos, versiones, revisión, publicación, retiro y resolución).

## Rutas

| Método | Ruta | UC |
| --- | --- | --- |
| `POST` | `/health-context/agents` | 01 |
| `POST` | `/health-context/sources` | 02 |
| `POST` | `/health-context/schedules` | 03 |
| `POST` | `/health-context/contexts` | 04 |
| `POST` | `/health-context/collection-runs` | 05 |
| `POST` | `/health-context/collection-runs/:id/observations` | 06 |
| `POST` | `/health-context/contexts/:id/versions` | 07 |
| `POST` | `/health-context/versions/:id/quality-reviews` | 08 |
| `POST` | `/health-context/versions/:id/publish` | 09 |
| `POST` | `/health-context/collection-runs/:id/finish` | 10 |
| `POST` | `/health-context/versions/:id/supersede` | 11 |
| `GET` | `/health-context/contexts/resolve` | 12 |

Las rutas son las que declara el caso de uso, sin traducción: ninguna usa la notación con `:` como
separador de acción, así que aquí no hay la desviación de ruteo que sí tienen otros módulos.

## Decisiones de ruteo

- **`GET` en la resolución (12)**: es la única lectura del módulo y no tiene efecto de negocio. Los
  tres criterios van como query (`country`, `domain`, `key`) porque son la clave natural del
  contexto, no una jerarquía de recursos.
- **`contexts/resolve` antes que cualquier `contexts/:id`**: `resolve` es un literal y no compite,
  porque el módulo no publica ningún `GET /contexts/:id`.
- **`versions/:id/...` cuelga de la versión, no del contexto**: revisar, publicar y retirar operan
  sobre la versión, que ya identifica a su contexto. Anidarlas bajo el contexto obligaría a repetir
  un dato que el servidor ya conoce y a comprobar que ambos concuerdan.
- **`publish` sin cuerpo**: la operación no aporta datos.

## Códigos de estado

`201 Created` en lo que crea recurso (01–08). `200 OK` en lo que actúa sobre algo existente (09, 10,
11) y en la lectura (12).

## Validación de parámetros

`ParseUUIDPipe` en los `:id` de ruta y en los parámetros `country` y `domain` de la resolución;
`key` no lo lleva, porque es una cadena elegida al crear el contexto.

## Permisos

`PLATFORM_ADMIN` en todo. Además: `SOURCE_ADMIN` (01, 02), `CONTEXT_CURATOR` (03–05, 07, 09, 11, 12),
`QUALITY_REVIEWER` (08), `SYSTEM` (05–08, 10, 12) y `CONTEXT_CONSUMER` (12).

Ninguna ruta es `@Public()`: el consumidor de contexto es otro módulo con su propia sesión, no un
visitante anónimo.

## Pruebas

`health-context.controller.spec.ts` (12): una por endpoint, comprobando que delega en el servicio
correcto y que pasa el id de ruta o los parámetros de consulta, el cuerpo y el actor.
