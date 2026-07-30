# Controladores de la plataforma de datos de salud

Capa HTTP: recibe, delega y devuelve. Sin lógica de negocio.

## Controladores

Dos, porque publican bajo prefijos distintos:

- **`HealthDataController`** (`/health-data`) — los doce casos de uso internos de la plataforma.
- **`FhirR5Controller`** (`/fhir/r5`) — las dos operaciones de interoperabilidad. Van aparte porque
  su prefijo no es el del módulo: tienen la forma que un cliente FHIR espera encontrar, y meterlas
  bajo `/health-data` las volvería inservibles para ese cliente.

## Rutas

| Método | Ruta | UC |
| --- | --- | --- |
| `POST` | `/health-data/ingestion-batches` | 01 |
| `POST` | `/health-data/ingestion-batches/:id/records` | 02 |
| `POST` | `/health-data/ingestion-batches/:id/close` | 02 |
| `POST` | `/health-data/canonical-resources/project` | 03 |
| `POST` | `/health-data/canonical-resources/:id/identifiers` | 04 |
| `POST` | `/health-data/canonical-resources/:id/relationships` | 05 |
| `POST` | `/health-data/canonical-resources/:id/bindings` | 06 |
| `POST` | `/health-data/versions/:id/validate` | 07 |
| `POST` | `/health-data/quality-runs` | 08 |
| `POST` | `/health-data/identity/candidates/:id/decision` | 09 |
| `POST` | `/health-data/timeline-entries` | 10 |
| `POST` | `/health-data/deidentification-runs` | 11 |
| `POST` | `/health-data/canonical-resources/:id/retire` | 14 |
| `POST` | `/fhir/r5/$export` | 12 |
| `GET` | `/fhir/r5/Patient/:id/$everything` | 13 |

## Decisiones de ruteo

- **Segmentos planos en lugar de `:` de acción**. Los casos de uso escriben
  `canonical-resources:project`, `{id}:validate` y `{id}:retire`; Nest 11 usa path-to-regexp v8, que
  trata `:` como inicio de parámetro en **cualquier** punto del segmento, así que
  `canonical-resources:project` se registraría como el literal `canonical-resources` seguido de un
  parámetro `project`. Misma convención que el resto del proyecto.
- **`$export` y `$everything` sí conservan su `$`**. No es notación del caso de uso: es la sintaxis
  de operación de FHIR, y `$` no tiene significado especial en path-to-regexp. Cambiarla rompería la
  compatibilidad con cualquier cliente FHIR.
- **`canonical-resources/project` (sin id)**: la proyección no opera sobre un recurso existente —lo
  crea o lo localiza por su identificador lógico—, así que el id no está disponible al llamar.
- **`versions/:id/validate` cuelga de la versión, no del recurso**: se valida un contenido concreto,
  y anidarlo bajo el recurso obligaría a repetir un dato que el servidor ya conoce.
- **`timeline-entries` sin id de paciente en la ruta**: el paciente llega en el cuerpo porque lo
  resuelve el MPI antes de proyectar, no quien construye la URL.
- **`identity/candidates/:id/decision`**: la decisión es un recurso propio del candidato —una sola
  por candidato—, no un cambio de estado suyo.

## Códigos de estado

`201 Created` en lo que crea recurso o registra un evento nuevo (01–09, 10, 11, 12). `200 OK` en lo
que actúa sobre algo existente (cierre del lote, retiro) y en la lectura (13).

## Validación de parámetros

`ParseUUIDPipe` en todos los `:id` de ruta. El `custodian` de `$everything` llega como query
opcional; sin él la búsqueda no se acota por custodio.

## Permisos

`HEALTH_DATA_ADMIN` en todo. Además: `INGESTION_WORKER` (01–03, 04, 07),
`CLINICAL_INFORMATICIAN` (04–06, 13, 14), `DATA_STEWARD` (05, 08), `MPI_STEWARD` (09),
`SYSTEM` (10), `PRIVACY_OFFICER` (11, 12) e `INTEROP_CONSUMER` (13).

Ninguna ruta es `@Public()`: `$everything` y `$export` son acceso a datos clínicos y exigen sesión,
propósito de uso y —fuera de este módulo— autorización y consentimiento.

## Pruebas

- `health-data.controller.spec.ts` (13): una por endpoint, comprobando que delega en el servicio
  correcto y que pasa el id de ruta, el cuerpo y el actor.
- `fhir-r5.controller.spec.ts` (3): exportación y `$everything` con y sin filtro de custodio.
