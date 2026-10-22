# Scripts de PostgreSQL

| Archivo | Uso |
|---|---|
| `provision-development-roles.mjs` | `yarn db:provision:dev`. Crea y verifica los roles de aplicación en desarrollo |
| `provision-roles.sql` | Versión declarativa para que un DBA la revise y ejecute en un entorno gestionado. Un esquema por ejecución |
| `provision-reader-role.sql` | Rol de solo lectura para los testers de datos que entran por el puerto publicado de PostgreSQL. Itera sobre todos los esquemas. Ver [docs/operations/coolify.md](../../docs/operations/coolify.md) § 7 |

Ambos son idempotentes **en el estado final**, no solo en la creación: reimponen los atributos
seguros y retiran los privilegios que sobran en cada ejecución. Un script que solo añade dejaría
sobrevivir para siempre un `GRANT` manual hecho durante una incidencia.

El `.mjs` además **verifica** el resultado ejecutando operaciones reales con cada rol. Inspeccionar
las concesiones del catálogo describe la intención; que el lector no puede escribir solo se
demuestra intentando escribir y recibiendo un `42501`.

Ninguno contiene contraseñas. Se pasan por entorno desde un gestor de secretos.

Los `.sql` usan `\gexec` y no bloques `DO $$`: psql **no** sustituye
`:'variable'` dentro de una cadena entre dólares, la pasa literal, y el servidor
responde `syntax error at or near ":"`. `provision-roles.sql` arrastró esa forma
desde que se escribió —nunca se pudo ejecutar— hasta que se corrigió el
05/09/2026.

Ver [docs/data/postgres-roles-and-privileges.md](../../docs/data/postgres-roles-and-privileges.md).
