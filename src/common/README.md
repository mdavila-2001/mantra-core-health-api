# src / common

Agrupa los componentes relacionados con **common** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Subcarpetas

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

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `index.ts` | Punto de exportación pública de la carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.

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

El alcance, hallazgos, planes de corrección y matriz de cuatro casos están en
el [informe de `common`](../../docs/revision-backend-2026-10-04/nucleo/common.md).

Los recortes ejecutables por responsable son [auth, seguridad, tenant y
verificación](../../docs/revision-backend-2026-10-04/nucleo/common-auth-seguridad.md),
[errores, HTTP, DTO y paginación](../../docs/revision-backend-2026-10-04/nucleo/common-errores-http.md)
y [criptografía, resiliencia, runtime y storage](../../docs/revision-backend-2026-10-04/nucleo/common-infra.md).
Sus verificaciones dirigidas registraron respectivamente 13 suites/115 tests,
9 suites/120 tests y 21 suites/225 tests aprobados.

Limitaciones conocidas de contrato: varios rechazos centrales de auth/tenant
aún devuelven `FORBIDDEN` sin `details.reason`, y `ParseOptionalDatePipe` acepta
formatos que no son instantes ISO con zona. Consultar el informe antes de usar
esas respuestas como contrato de cliente.
