# src / common

Groups **common**-related components and keeps this system responsibility cohesive.

## Contents

### Subdirectories

- [`auth/`](./auth/README.md): componentes de auth.
- [`constants/`](./constants/README.md): Constantes compartidas y vocabulario estable del dominio.
- [`crypto/`](./crypto/README.md): componentes de crypto.
- [`dto/`](./dto/README.md): Contratos de entrada y salida, validación y documentación de la API.
- [`errors/`](./errors/README.md): componentes de errors.
- [`filters/`](./filters/README.md): Traducción centralizada de errores a respuestas de transporte.
- [`http/`](./http/README.md): componentes de http.
- [`persistence/`](./persistence/README.md): componentes de persistence.
- [`resilience/`](./resilience/README.md): plazos con cancelación real, reintento con jitter, cortacircuitos, mamparos y exclusión mutua.
- [`runtime/`](./runtime/README.md): ciclo de vida del proceso — fallo terminal observable y apagado acotado.
- [`seed/`](./seed/README.md): componentes de seed.
- [`tenant/`](./tenant/README.md): componentes de tenant.

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `index.ts` | Public export barrel for this folder. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.

## Revisión de backend (2026-10-04)

`common` concentra controles transversales: autenticación JWT y sesión viva,
selección y propagación de tenant, filtro de excepciones, DTO/paginación,
egreso HTTP protegido contra SSRF, almacenamiento con protocolo transaccional,
resiliencia, runtime y seeds. La revisión ejecutó:

```sh
corepack yarn test src/common --runInBand --silent
```

Resultado registrado: **72 suites y 712 pruebas aprobadas**. La ejecución
emitió advertencias de Node por imports JSON sin atributo de tipo en catálogos
de seed; hay que resolverlas antes de una actualización mayor del runtime.

Las verificaciones dirigidas de la revisión de octubre de 2026 registraron 13 suites/115 tests
(auth, seguridad, tenant y verificación), 9 suites/120 tests (errores, HTTP, DTO y paginación) y
21 suites/225 tests (criptografía, resiliencia, runtime y storage) aprobados.

Limitaciones conocidas de contrato: varios rechazos centrales de auth/tenant
aún devuelven `FORBIDDEN` sin `details.reason`, y `ParseOptionalDatePipe` acepta
formatos que no son instantes ISO con zona. Consultar el informe antes de usar
esas respuestas como contrato de cliente.
