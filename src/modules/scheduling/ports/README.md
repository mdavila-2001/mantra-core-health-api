# Puertos de scheduling

Contratos de acceso a datos del módulo, con nombres de negocio y modelos de lectura propios.
Ningún tipo de esta carpeta procede de MikroORM: el servicio no manipula entidades gestionadas y
por tanto no puede provocar una escritura asignando un campo.

Son el módulo piloto de la migración descrita en
[ADR-0023](../../../../docs/adr/ADR-0023-puertos-persistencia-read-write.md).

| Puerto              | Ruta      | Por qué                                                                |
| ------------------- | --------- | ---------------------------------------------------------------------- |
| `WaitlistReadPort`  | lectura   | Descubrimiento de trabajo para un worker; tolera consistencia eventual |
| `WaitlistWritePort` | escritura | Altas, promoción de candidatos y recordatorios; siempre en transacción |

Los implementa `adapters/postgres-waitlist.adapter.ts`.
