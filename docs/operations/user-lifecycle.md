# Ciclo de vida administrativo de cuentas

Las operaciones `POST /iam/users/:id/suspend`, `reactivate` y `deactivate`
exigen motivo y los permisos administrativos declarados en el controlador.
Sólo un `SUPERADMIN` global puede cambiar el ciclo de vida de otra cuenta
con ese rol global activo. Un `SECURITY_ADMIN` o un `SUPERADMIN` limitado a
una organización recibe `403 USER_SUPERADMIN_LIFECYCLE_FORBIDDEN`.

La suspensión y la baja de la propia cuenta siguen prohibidas. Tampoco se puede
retirar la última cuenta activa capaz de administrar accesos.

La baja es definitiva e idempotente. En una sola transacción cambia el estado,
bloquea la cuenta, revoca sesiones y refresh tokens, credenciales, roles globales
de IAM y todas las asignaciones activas de roles de negocio de authz, incluidas
las que empiezan en el futuro. Se conservan las filas históricas y se identifica
al actor que revoca los roles. Si alguna revocación falla, se revierte la operación
completa y no queda un evento de éxito.

La suspensión conserva las asignaciones de negocio para la reactivación.
La baja no reactiva asignaciones revocadas.

## Cuentas sintéticas del padrón

El alta de paciente usa su cédula sintética como `external_subject` de la
credencial. Para iniciar sesión se envía `nationalId`, no el correo sintético
de contacto. Los profesionales registrados por correo usan `email`.
`SEED_DEMO_PASSWORD` se utiliza al crear las cuentas del seed habilitado;
volver a ejecutar el seed no restablece las contraseñas de cuentas existentes.
