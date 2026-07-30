# Directory — Servicios

Poseen la unidad de trabajo: inyectan `EntityManager` (de `@mikro-orm/postgresql`)
y usan `em.transactional(async (tx) => {...})` para toda escritura. Hacen `flush`
del padre antes de crear hijos (las FK son columnas uuid; MikroORM no ordena
inserts entre entidades no relacionadas). Validan precondiciones y lanzan
excepciones de dominio. Logs Pino por operación.

| Servicio | UCs | Métodos |
|----------|-----|---------|
| `DirectoryTenantsService` | 01, 02, 03, 10 | `provision`, `verify`, `createChild`, `suspend` |
| `DirectoryBranchesService` | 04 | `create` |
| `DirectoryMembershipsService` | 05, 06, 07, 08, 09 | `invite`, `assignBranch`, `transfer`, `changeRole`, `offboard` |

Tests unitarios en `*.service.spec.ts`: mockean repositorios y `EntityManager`
(`transactional: jest.fn((cb) => cb(txMock))`), cubriendo happy path, not-found,
conflicto y rechazos de regla de negocio (precondición).
