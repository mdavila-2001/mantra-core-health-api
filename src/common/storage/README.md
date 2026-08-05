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

## Adaptadores

| `FILE_STORAGE_ADAPTER` | Adaptador | Dónde viven los bytes |
| --- | --- | --- |
| `local` (por defecto) | `LocalDiskFileStorageAdapter` | `FILE_STORAGE_LOCAL_DIR`, direccionado por hash |
| `s3` | `S3FileStorageAdapter` | Bucket compatible con S3 (MinIO en local), configurado con las variables `MINIO_*` |

Los dos direccionan por contenido: la clave es el SHA-256 de los bytes. Subir dos veces lo mismo
no duplica almacenamiento, la URI nunca depende de un nombre que venga del cliente, y al
recuperar se valida que la clave sean 64 hexadecimales — una fila manipulada en la base no puede
hacer que el backend lea un objeto arbitrario.

MinIO ya se levanta en `docker-compose.yml` y en el workflow de CI; hasta que existió
`S3FileStorageAdapter` no había forma de que un archivo llegara a él.
