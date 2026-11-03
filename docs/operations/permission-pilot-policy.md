# Política del piloto de permisos

El piloto conserva `shadow`: las once rutas siguen sujetas a `RolesGuard` y a
las validaciones de recurso de sus servicios. El resultado del PDP se observa;
no habilita ni bloquea esas rutas. No activar `enforce` hasta calibrar las
discrepancias con tráfico representativo y resolver el contexto de tenant de
las operaciones globales.

## Roles globales y catálogo de permisos

El PDP consulta las concesiones persistidas y activas de `iam.user_global_roles`
para una cuenta activa. Sólo enlaza `SECURITY_ADMIN` y `PRACTITIONER` con los
roles de sistema de código e identificador determinista conocidos, activos y
sin tenant. Un claim del token por sí solo no concede permisos. No se adoptan
roles de organizaciones que reutilicen esos códigos.

`SECURITY_ADMIN` tiene un descriptor global no asignable en `authz.roles`:
su concesión se administra en IAM. `PRACTITIONER` conserva su rol asistencial
existente. Las asignaciones organizacionales siguen usando su ámbito. Los
DENY explícitos prevalecen sobre las concesiones de estos roles.

`authz.permission-pilot.seed.ts` declara los once códigos de las rutas existentes,
con sus mismos roles. Las semillas son idempotentes y respetan revocaciones ya
administradas. No conceden estos permisos directamente a usuarios. Los rechazos
de citas y comprobantes usan la acción `APPROVE` del catálogo actual; no se añade
una acción distinta al modelo.

## Contexto y medición

La guarda necesita un tenant resuelto para evaluar. Una operación global sin
ese contexto se registra como `SHADOW_NOT_EVALUABLE`; no se inventa un tenant
ni se considera esa señal una denegación del negocio. El `SUPERADMIN` global
conserva el bypass de la guarda. Las discrepancias se registran en el log
estructurado existente; no implican una política nueva de retención en auditoría.

Las pruebas del piloto verifican la correspondencia exacta entre las once rutas
y las semillas, y con PostgreSQL comprueban persistencia, segunda ejecución,
revocación IAM, cuentas inactivas y precedencia de DENY. Esto no sustituye una
calibración operativa ni una comparación HTTP de la aplicación completa.

## Catálogo global de visibilidad

Registrar y sincronizar elementos de `ui_visibility` requiere `SUPERADMIN` o
`SECURITY_ADMIN` global. Un `SECURITY_ADMIN` acotado a una organización conserva
la administración de reglas dentro de su ámbito; no modifica el catálogo global.
No se amplía su acceso al ciclo de vida, revisiones o simulación global.
