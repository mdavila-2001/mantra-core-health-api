# Capa de persistencia: puertos, adaptadores y enrutado

Añade una superficie estable de acceso a datos **junto a** `src/orm`, sin sustituirlo. `OrmModule`
sigue siendo el dueño de la conexión primaria y del arranque del esquema; esto añade quién decide
la conexión, cómo se separan lectura y escritura y qué tipos cruzan la frontera hacia el dominio.

Ver [ADR-0022](../../docs/adr/ADR-0022-puertos-persistencia-read-write.md) y
[docs/data/read-write-routing.md](../../docs/data/read-write-routing.md).

## Mapa

| Carpeta | Qué contiene |
|---|---|
| `ports/` | Contratos: lectura, escritura, transacción, sesión y contextos |
| `config/` | Descriptores de conexión, huella sanitizada y resolución del entorno |
| `registry/` | Registro central de conexiones, con alias y health checks |
| `routing/` | Tabla declarativa y router; valida en el arranque |
| `factory/` | Creación o reutilización de conexiones y fábrica de sesiones |
| `adapters/postgres/` | Conexión y gestor de transacciones de PostgreSQL |
| `session/` | Las dos implementaciones de `PersistenceSession` y su selector |
| `errors/` | Errores normalizados y traducción de SQLSTATE |
| `capabilities/` | Qué ofrece cada motor; el arranque rechaza rutas imposibles |
| `observability/` | Contadores por conexión y por ruta |
| `health/` | `GET /health/data-sources` |

## Reglas

- El dominio **no** importa MikroORM. Si un servicio necesita datos, declara un puerto.
- El barril `index.ts` no exporta `PostgresDataConnection`: si un servicio pudiera obtenerla,
  podría pedirle el `EntityManager` y saltarse los puertos.
- Toda transacción de negocio sale por la ruta de escritura. El contrato no ofrece forma de elegir
  otra.
- Nada de esta capa contiene lógica de negocio.

## Añadir un motor

1. Declarar sus capacidades en `capabilities/adapter-capabilities.ts`. Lo que **no** ofrece importa
   más que lo que ofrece.
2. Implementar `DataConnection` y registrarla.
3. Implementar los puertos del módulo que lo vaya a usar.
4. Añadir su regla a la tabla de enrutado. El arranque validará que la ruta sea posible.
