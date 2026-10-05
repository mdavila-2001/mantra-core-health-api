# Revisión del módulo `iam` — ALOVIDA

## Alcance y evidencia

Se revisaron los tres controladores, servicios, repositorios, DTOs y entidades de IAM: inicio y rotación de sesión, MFA, dispositivos, credenciales, altas pública/asistida, recuperación de cuenta, roles globales, bloqueo, anonimización y trazabilidad de seguridad. También se siguió la integración de precargas de registro con `common.files` y el filtro global de excepciones.

`corepack yarn test src/modules/iam --runInBand --silent` aprobó **22 suites y 359 pruebas**. La ejecución emitió tres advertencias preexistentes de imports JSON sin atributo, fuera de IAM. No se ejecutaron pruebas HTTP/e2e contra PostgreSQL, S3/MinIO ni el job que debería depurar archivos; las pruebas de unidad usan repositorios y servicios simulados.

Hay trabajo pendiente de integrar del commit externo `fa74b78c` para catálogo de `reason` de IAM. Debe contrastarse contra `dev` antes de cerrar IAM-02: esta revisión describe el código presente en esta rama.

## Mapa de superficie

| Superficie | Controles observados |
| --- | --- |
| `POST /iam/auth/login`, `token/refresh`, alta, verificación, activación y recuperación | `@Public`, límite de tasa específico en cada ruta pública; contraseñas con Argon2 y tokens persistidos como hash. |
| `POST /iam/auth/logout`, `logout-all`, `GET/POST /iam/me/sessions*` | Sesión autenticada; rutas de cuenta propia resuelven el usuario desde `CurrentUser` y son `TenantAgnostic`. |
| `GET/POST /iam/users*`, bloqueo, credenciales, roles, anonimización | `SECURITY_ADMIN`, salvo MFA y dispositivo propios, donde el servicio compara `actor.id` con el usuario objetivo. |
| MFA | `IamMfaService` exige titularidad o `SECURITY_ADMIN`/`SUPERADMIN`; no expone el secreto TOTP en los DTOs de lectura. |
| Archivo de registro | PDF o imagen por magic bytes, límite de tamaño y subida anónima; el alta reclama el archivo dentro de su transacción. |

No se confirmó un IDOR en las operaciones de cuenta propia: la revocación de sesión compara el dueño de la sesión con el actor, y MFA/dispositivos comparan el `userId` de ruta con el sujeto autenticado antes de escribir. La rotación de refresh obtiene la fila bajo bloqueo y revoca la sesión frente a reúso.

## Hallazgos confirmados

### IAM-01 — Media — Las precargas anónimas de registro no tienen caducidad ni depuración

`POST /iam/auth/upload-registration-document` es público y permite 30 solicitudes por minuto; su propio controlador documenta que un archivo que nunca se reclama queda en `common.files` con tenant `DEFAULT` y sin dueño ([`iam-auth.controller.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/iam/controllers/iam-auth.controller.ts#L172-L211)). La ruta de firma también es pública y delega en el mismo mecanismo ([`iam-auth.controller.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/iam/controllers/iam-auth.controller.ts#L145-L170)). Ambas llamadas crean un archivo anónimo ([`iam-registration-document-upload.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/iam/services/iam-registration-document-upload.service.ts#L41-L91)).

La reclamación es segura cuando la alta llega a completarse: exige `tenant DEFAULT`, ausencia de dueño, categoría y formato esperados ([`attachable-file.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/common/services/attachable-file.service.ts#L220-L272)). Sin embargo, no existe un TTL, una marca de expiración ni un job de limpieza para los abandonos; una búsqueda en workers no encuentra consumidor de esos archivos. Quedan retenidos documentos legales o imágenes de firma que pueden contener datos personales, y la ruta pública permite consumo sostenido de almacenamiento.

**Plan de corrección:**

1. Definir en `FileUploadService.uploadAnonymous` o en la entidad un vencimiento explícito para la pre-carga y persistir el origen de registro.
2. Añadir un job transaccional de `common.files` que elimine sólo archivos `DEFAULT`, sin dueño, sin referencias y vencidos; borrar primero el objeto en almacenamiento con reintentos idempotentes.
3. Hacer que `AttachableFileService.claimAnonymousUpload` rechace archivos vencidos con razón catalogada y que el alta instruya a volver a subirlo.
4. Instrumentar métricas para antigüedad, conteo y bytes de archivos anónimos; alertar antes de agotar el cupo.

| Caso | Tipo y prueba propuesta | Preparación / entrada | Resultado esperado |
| --- | --- | --- | --- |
| Correcto | Integración `iam-registration-upload.int-spec.ts` | PDF anónimo vigente seguido por `register-organization` que lo referencia | `201`; archivo reclamado, con owner y tenant definitivo. |
| Límite | Integración | Archivo a un segundo de su vencimiento, reclamado antes del job | Reclamo atómico exitoso; el job no lo borra. |
| Error | Integración de worker | Archivo anónimo vencido, sin referencias | Se borra una vez de objeto y BD; reintento no produce error. |
| Falla catalogada | E2E | `fileId` anónimo ya vencido al registrar | `422/PRECONDITION_FAILED/REGISTRATION_UPLOAD_EXPIRED`; sin crear usuario ni tenant. |

### IAM-02 — Media — Fallos de autenticación y MFA carecen de `reason` estable

El contrato del proyecto requiere una excepción de dominio con `HttpStatus`, `ErrorCode` y `details.reason`. IAM conserva excepciones de Nest sin detalle estructurado: activación inválida, usada o expirada ([`iam-assisted-registration.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/iam/services/iam-assisted-registration.service.ts#L188-L256)); restablecimiento inválido, usado o expirado ([`iam-password-reset.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/iam/services/iam-password-reset.service.ts#L202-L275)); login/refresh con credencial, sesión o token inválido ([`iam-auth.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/iam/services/iam-auth.service.ts#L384-L418), [`iam-auth.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/iam/services/iam-auth.service.ts#L596-L680)); y MFA ajeno o código inválido ([`iam-mfa.service.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/modules/iam/services/iam-mfa.service.ts#L64-L143)).

El filtro global asigna un `ErrorCode` según el status de una `HttpException`, pero no inventa `details.reason` ([`all-exceptions.filter.ts`](https://github.com/mdavila-2001/mantra-core-health-api/blob/02af1e09/src/common/filters/all-exceptions.filter.ts#L400-L430)). Por ello clientes y pruebas no tienen una clave estable para distinguir, por ejemplo, token vencido de token ya consumido, ni MFA ajeno de MFA inválido. La suite actual comprueba mayormente la clase de excepción o el efecto de repositorio, sin contrato HTTP de `status + code + reason` para esas rutas.

**Plan de corrección:**

1. Incorporar/validar un catálogo `iam.error-reasons.ts` y usar excepciones de dominio para cada falla pública.
2. Mantener el mismo status para no revelar existencia cuando corresponda, pero adjuntar razones internas estables: `ACTIVATION_TOKEN_INVALID`, `ACTIVATION_TOKEN_USED`, `ACTIVATION_TOKEN_EXPIRED`, `PASSWORD_RESET_TOKEN_INVALID`, `PASSWORD_RESET_TOKEN_USED`, `PASSWORD_RESET_TOKEN_EXPIRED`, `REFRESH_TOKEN_INVALID`, `REFRESH_TOKEN_EXPIRED`, `MFA_FACTOR_OWNER_REQUIRED` y `MFA_CODE_INVALID`.
3. Migrar las rutas que importan `UnauthorizedException`/`ForbiddenException` desde Nest y revisar también la ausencia de refresh cookie en el controlador.
4. Añadir pruebas E2E que atraviesen `AllExceptionsFilter`; verificar que token inexistente y usuario inexistente sigan sin convertirse en oráculo de cuentas.

| Caso | Tipo y prueba propuesta | Preparación / entrada | Resultado esperado |
| --- | --- | --- | --- |
| Correcto | E2E `iam-auth-errors.e2e-spec.ts` | Token de activación activo y contraseña válida | `200`, cuenta activa y token consumido. |
| Límite | E2E | Token de reset con `expires_at` igual al reloj controlado | Rechazo determinista, sin cambiar contraseña ni reabrir sesiones. |
| Error | E2E | Actor normal intenta enrolar MFA para otro `userId` | `403/FORBIDDEN/MFA_FACTOR_OWNER_REQUIRED`; no se crea factor. |
| Falla catalogada | E2E | Refresh token ya rotado o vencido | `401/UNAUTHENTICATED/REFRESH_TOKEN_INVALID` o `REFRESH_TOKEN_EXPIRED`; sesión revocada sólo en el caso de reúso definido. |

## Cobertura que debe mantenerse

Conservar las pruebas de rotación y detección de reúso de refresh, cierre de sesiones después de recuperación, hash Argon2, MFA, bloqueo por intentos, validación de DTOs y altas asistidas. Añadir integración con base de datos para la exclusividad de credenciales, el bloqueo de registro por documento y la carrera entre dos consumos del mismo token; las pruebas actuales con mocks no prueban restricciones, bloqueos ni el filtro HTTP completo.
