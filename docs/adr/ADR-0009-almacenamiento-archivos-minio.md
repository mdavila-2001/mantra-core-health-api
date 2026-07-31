# ADR-0009: Almacenamiento de archivos — MinIO/S3

## Estado
Aceptado.

## Contexto
El sistema maneja archivos e imágenes médicas (DICOM, vía `dicomweb.controller.ts`) que no deben
transportarse como body JSON (`json({ limit: '1mb' })` en `src/main.ts` lo excluye
deliberadamente).

## Fuerzas y restricciones
- Compatibilidad con el protocolo S3 permite usar SDKs estándar (`@aws-sdk/client-s3`) y facilita
  portar a un proveedor cloud real sin reescribir el módulo.
- Necesidad de servir contenido binario grande sin pasar por el límite de payload JSON de la API.

## Opciones consideradas
Almacenamiento en la propia base de datos (bytea/blob) vs. objeto dedicado S3-compatible: el
código usa MinIO, protocolo S3-compatible.

## Decisión
MinIO (S3-compatible) como almacén de objetos, encapsulado en el módulo `object_storage`, con
`@aws-sdk/client-s3` como cliente — protocolo estándar, no un SDK propietario de MinIO.

## Consecuencias positivas
- Migrar de MinIO (self-hosted) a un proveedor cloud S3-compatible real es un cambio de
  configuración, no de código, gracias al SDK estándar.
- Los archivos grandes no compiten con el límite de payload JSON de la API.

## Consecuencias negativas
- Un almacén adicional que operar, respaldar y asegurar (`MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY`).

## Riesgos
Ninguno crítico identificado en esta fase.

## Evidencia
`docker-compose.yml` (`minio`), `package.json` (`@aws-sdk/client-s3`),
`src/modules/object_storage/`, `src/modules/object_storage/controllers/dicomweb.controller.ts`.

## Plan de revisión
Sin fecha programada.
