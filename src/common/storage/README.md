# src / common / storage

Almacenamiento de archivos: dónde viven los bytes, aislado de qué sabemos del
archivo. `common.files` / `common.file_versions` guardan la metadata y una
`storage_uri` opaca; el adaptador activo es el único que sabe interpretarla.

El adaptador se elige por `FILE_STORAGE_ADAPTER` (hoy sólo `local`), de modo que
añadir S3 sea implementar la interfaz y ampliar la lista, sin tocar servicios ni
controladores. Es el mismo criterio que el `providerAdapter` mutable de los
workers.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `file-storage.adapter.ts` | Interfaz del adaptador y token de inyección. |
| `local-disk-file-storage.adapter.ts` | Adaptador en disco local, direccionado por contenido (SHA-256). |
| `file-storage.module.ts` | Resuelve el adaptador activo a partir del entorno. |
| `storage.env.ts` | Esquema Joi y lectura del entorno de almacenamiento. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
