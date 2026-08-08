# Scripts de PostgreSQL

| Archivo | Uso |
|---|---|
| `provision-development-roles.mjs` | `yarn db:provision:dev`. Crea y verifica los roles de aplicación en desarrollo |
| `provision-roles.sql` | Versión declarativa para que un DBA la revise y ejecute en un entorno gestionado |

Ambos son idempotentes **en el estado final**, no solo en la creación: reimponen los atributos
seguros y retiran los privilegios que sobran en cada ejecución. Un script que solo añade dejaría
sobrevivir para siempre un `GRANT` manual hecho durante una incidencia.

El `.mjs` además **verifica** el resultado ejecutando operaciones reales con cada rol. Inspeccionar
las concesiones del catálogo describe la intención; que el lector no puede escribir solo se
demuestra intentando escribir y recibiendo un `42501`.

Ninguno contiene contraseñas. Se pasan por entorno desde un gestor de secretos.

Ver [docs/data/postgres-roles-and-privileges.md](../../docs/data/postgres-roles-and-privileges.md).
