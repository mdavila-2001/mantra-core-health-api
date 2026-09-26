# Decisiones de producto y de diseño — H1 (BR-04, BR-05, BR-20)

Carril M7 · Lenovo Legion · 2026-09-26. Cada decisión abierta se resolvió con el criterio **más seguro**
y quedó registrada acá con su porqué. Ninguna detuvo el resto del hito.

## D-I — Cookie httpOnly del refresh (BR-04, TX-10, TX-28)

- **Elegido:** opción C (transición) con destino A. La API **honra** `AUTH_REFRESH_COOKIE_NAME`, `_PATH` y
  `_SAMESITE` (TX-28) y el front soporta los dos modos. El **default de la API sigue apagado**
  (`AUTH_REFRESH_COOKIE_ENABLED:-false` en `docker-compose.coolify.yml`).
- **Por qué:** encender la cookie sin el cambio del front pierde la sesión en cada recarga, y a la inversa. Se
  enciende **sólo junto** con el front: `AUTH_REFRESH_COOKIE_ENABLED=true` en la API **y**
  `PUBLIC_REFRESH_COOKIE=true` en el build del front, en el mismo despliegue. Queda a cargo de quien despliega
  (M1: contrato escrito en el REPORT).
- **Nombre de la cookie:** el default de `AUTH_REFRESH_COOKIE_NAME` pasa de `mch_refresh` a `redesa_refresh`
  (el nombre que la cookie ya tenía en el código): honrar la variable no cambia el nombre efectivo de nadie.
  Declarar `mch_refresh` lo cambia (verificado en vivo).
- **Mismo origen (TX-20):** no se abre CORS. Documentado en `src/common/auth/README.md`.

## TX-11 — `ownTenantId`

- **Elegido:** el front deja de esperarlo (recomendado por el prompt). La última organización elegida se recuerda
  **por persona** en el dispositivo (`<userId>|<tenantId>`), así el segundo login entra sin selector y otra persona
  en el mismo dispositivo no hereda el contexto. «Mi consultorio» como concepto del modelo queda fuera (es una
  decisión de modelo, va aparte).

## TX-29 — MFA

- **Elegido:** desafío `401 details.reason = MFA_REQUIRED` (o `MFA_INVALID`) **detrás de la bandera
  `AUTH_MFA_CHALLENGE_ENABLED`, apagada** (compose y `.env.example`). Aplica a cuentas con un factor **verificado**.
- **Por qué apagada:** encenderla exige que el cliente sepa pedir el código (el front ya lo hace, pero un cliente
  móvil o un despliegue viejo quedaría sin poder entrar). **No implementado:** exigir MFA a los roles
  administrativos (requiere un flujo de alta de factor con un token de alcance limitado; sin él, exigirlo dejaría
  afuera al admin que todavía no tiene factor). Queda como pendiente con dueño M2 (roles administrativos).

## ID-24 — cambio de contraseña y sesiones

- **Elegido:** entra en el lanzamiento: `POST /iam/auth/change-password`, `GET /iam/me/sessions`,
  `POST /iam/me/sessions/:id/revoke`. Un error de contraseña es **422** con `details.reason`, nunca 401 (el cliente
  cierra la sesión ante un 401 y acá la sesión es válida).

## URL firmada (BR-05, TX-09)

- **Elegido:** variante intermedia de la B del prompt. Los recursos clínicos se leen por la **ruta del contexto**
  con bearer (auditada con actor). Además, `GET /common/files/:id/content` **valida la firma cuando viene**
  (403 si es inválida, 410 si venció) y **sigue exigiendo sesión y titularidad**: la firma no habilita a nadie a
  leer lo que no subió. No se retiró `download-url` porque otros flujos la usan.

## Escaneo y almacenamiento (BR-05, TX-33, TX-34)

- **Escaneo:** apagado **explícito** en Coolify (`MALWARE_SCAN_ENABLED=false`, sin `worker-files` ni clamd). Las
  lecturas por contexto no lo exigen; la URL firmada responde 422 `SCAN_PENDING`. Encenderlo (recomendado para PHI)
  exige sumar `clamav` + `worker-files` al compose de Coolify: contrato para M1.
- **Almacenamiento:** el prefijo S3 por defecto pasa de `audio-assets` a `uploads`. El volumen `api_storage` no tiene
  respaldo declarado: pendiente de operaciones (M1). El endpoint interno de MinIO nunca se entrega al navegador.

## Consentimiento informado y acceso (BR-20)

- **Fuente de verdad (CL-77):** la opción (a): `consent.treatment_informed_consents`. Nueva ruta del médico
  `POST /consent/encounters/:encounterId/informed-consent` (paciente y tenant salen del encuentro; exige poder
  escribir la historia). **No se tocó el `@Roles('SECURITY_ADMIN')` de la ruta existente** (regla: los `@Roles` de
  endpoints existentes son de M2). Los consentimientos ya capturados como formulario no se reescriben.
- **Solicitud de acceso (CV-07):** la opción (a): `authz/care-relationships/request` es la canónica.
  `consent/practitioner-access-requests` queda sin uso desde el front (no se retiró; se documenta).
- **Break-the-glass:** sin cambios de `@Roles` (`CLINICAL_APPROVER`/`SECURITY_ADMIN`). **Contrato para M2/BR-06:**
  ningún médico autorregistrado recibe `CLINICAL_APPROVER`; hasta que se asigne, la acción de emergencia del front
  sólo aparece para quien ya tiene el rol.
- Maquetas de `features/alovida/accesos/` (front): quedan fuera del menú; las reemplazan las pantallas reales.

## Hallazgo del propio carril

- `AuthzCareRelationshipsService.revokeCareRelationship` marcaba **EXPIRED** (y no cerraba la vigencia) a una relación
  sin fin porque `valid_to` llega como `null` y `null <= now` es verdadero. Corregido (`!= null`) con spec de
  regresión. Encontrado reproduciendo contra la base viva.
