<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/auth_providers/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `auth_providers`

**Fuente:** [`src/modules/auth_providers/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/auth_providers/README.md)
· 1 controllers · 2 services · 1 repositories · 9 entidades · 1 DTO

---

# Módulo 40 — Proveedores de Identidad y Login Federado

Alta de proveedores OIDC/SAML/OAuth2, configuración de protocolo por entorno, claves de firma con
rotación, mapeo de claims a atributos, vínculo por tenant, reglas de aprovisionamiento, login
federado con `state`/`nonce`, vinculación y desvinculación de identidades.

## Casos de uso cubiertos (12)

| UC | Endpoint | Descripción |
| --- | --- | --- |
| UC-40-01 | `POST /auth-providers/identity-providers` | Registrar proveedor OIDC/SAML |
| UC-40-02 | `POST /auth-providers/identity-providers/:id/protocol-configs` | Configurar protocolo e importar JWKS |
| UC-40-03 | `POST /auth-providers/identity-providers/:id/signing-keys` | Publicar clave de firma |
| UC-40-04 | `PUT /auth-providers/identity-providers/:id/attribute-mappings` | Mapeo de claims a atributos |
| UC-40-05 | `POST /auth-providers/tenant-bindings` | Vincular proveedor a tenant |
| UC-40-06 | `POST /auth-providers/identity-providers/:id/provisioning-rules` | Regla de aprovisionamiento |
| UC-40-07 | `POST /auth-providers/identity-providers/by-code/:code/authorize` | Iniciar login federado |
| UC-40-08 | `POST /auth-providers/identity-providers/by-code/:code/callback` | Procesar callback |
| UC-40-09 | `POST /auth-providers/account-link-requests` | Solicitar vinculación de cuenta |
| UC-40-10 | `POST /auth-providers/account-link-requests/complete` | Completar vinculación |
| UC-40-11 | `POST /auth-providers/identity-providers/:id/signing-keys/rotate` | Rotar clave de firma |
| UC-40-12 | `POST /auth-providers/federated-identities/:id/unlink` | Desvincular identidad |

El caso de uso escribe `signing-keys:rotate`; Nest 11 (path-to-regexp v8) trata `:` como inicio de
parámetro en cualquier punto del segmento, así que la ruta publicada usa segmentos planos. Es la
misma convención que sigue el resto del proyecto.

## Entidades

`identity_providers`, `provider_protocol_configs`, `provider_signing_keys`,
`provider_attribute_mappings`, `provider_tenant_bindings`, `provisioning_rules`,
`federated_identities`, `federated_login_attempts` (append-only), `account_link_requests`.

## Flujo general

```
proveedor (draft)
   │
   ├─ protocol-configs ──> configuración activa del entorno + JWKS importado ⇒ proveedor active
   ├─ signing-keys ──────> clave activa
   ├─ attribute-mappings > mapeo completo, un claim identificador
   ├─ tenant-bindings ───> quién puede usarlo y con qué rol
   └─ provisioning-rules > condición sobre claims, por prioridad

authorize ──> intento `initiated` + state/nonce + authorizeUrl
   │
callback (state válido)
   ├─ identidad existente y activa ──────> success
   ├─ identidad revocada ────────────────> failure: identity revoked
   ├─ sin identidad + JIT + userId ──────> identidad creada, success (provisioned)
   └─ sin identidad ─────────────────────> failure: no provision + token de vinculación

account-link-requests ──> token (una sola vez) ──> complete ──> identidad activa
federated-identities/:id/unlink ──> identidad revocada + intento `unlinked`
```

## Reglas de negocio

- **El proveedor nace en borrador** y sólo pasa a activo al configurar su protocolo. Un proveedor sin
  endpoints ni claves no puede autenticar a nadie, y dejarlo activo sería mentir sobre su estado.
- **Un proveedor no global necesita tenant dueño**: sin él no lo podría usar nadie.
- **Una configuración activa por entorno**: reconfigurar deshabilita la anterior. Con dos quedaría
  sin decidir con cuál se autentica.
- **Cada protocolo exige lo suyo**: SAML pide entity ID y ACS URL; OIDC y OAuth2 piden cliente y los
  endpoints de autorización y token; OIDC además JWKS o documento de descubrimiento. Sin eso el
  fallo aparecería en el primer login real, no al configurar.
- **Las claves rotadas se retiran con gracia**, no se borran: retirar de golpe la saliente
  invalidaría los tokens ya firmados que están en vuelo. Con `graceHours: 0` se retiran al instante,
  que es lo que se quiere ante una clave comprometida.
- **El mapeo exige exactamente un claim identificador**: sin él no se sabe qué distingue a un sujeto
  de otro; con dos, el login sería ambiguo. El claim de origen no puede repetirse.
- **Aprovisionar automáticamente exige rol por defecto**: crear usuarios sin permisos es tan inútil
  como caro de corregir a mano después.
- **La prioridad de la regla es única** y decide la primera que case. Dos reglas empatadas dejarían
  el resultado a merced del orden de lectura.
- **Denegar por omisión**: si hay reglas y ninguna casa, no se aprovisiona.
- **Una regla DENY no asigna rol ni tenant**: sería una contradicción que nadie sabría leer después.
- **El `state` es lo único que liga el callback con un inicio nuestro**, y sólo se acepta una vez:
  sin esa comprobación cualquiera podría inyectar una respuesta.
- **Restringir por dominio y no recibir correo no es "todo permitido"**: sin correo, el login se
  rechaza.
- **El token de vinculación se devuelve una sola vez**; en la tabla queda su hash SHA-256. Si la
  tabla se filtra, no sirve para vincular cuentas.
- **Desvincular revoca, no borra**: el histórico de logins apunta a la identidad y hay que poder
  explicar quién entró y con qué.
- **`federated_login_attempts` es append-only**: todo desenlace queda registrado, también el rechazo
  —que es justo el que hay que poder auditar.

## Frontera del módulo

Este módulo **no crea usuarios locales**: `iam.users` es de otro esquema y escribir allí cruzaría la
frontera. Por eso el callback acepta un `userId` ya resuelto por IAM y, cuando no lo hay, devuelve un
token de vinculación en lugar de inventar el usuario. El aprovisionamiento JIT de la identidad
federada sí ocurre aquí, porque la identidad es nuestra.

## Permisos

`IDENTITY_ADMIN` cubre el módulo entero y es el único que registra proveedores, configura protocolos,
publica y rota claves, fija mapeos, vincula tenants, define reglas y desvincula. `AUTH_SERVICE`
—el servicio de autenticación— inicia logins, procesa callbacks y opera la vinculación de cuentas.

Ninguna ruta es pública: el callback llega desde el servicio de autenticación, no desde el navegador
del usuario.

## Concurrencia

`FOR UPDATE` sobre el proveedor en toda reconfiguración, sobre la configuración del entorno que se
reemplaza, sobre las claves activas al rotar (publicar la nueva y retirar las salientes deben ver el
mismo conjunto), sobre el mapeo que se reemplaza en bloque, sobre el vínculo del tenant, sobre la
identidad del sujeto en el callback y sobre la solicitud de vinculación que se completa.
`row_version` aporta bloqueo optimista automático.

## Logs

`operation: 'auth-providers.<área>.<acción>'`. Nivel `warn` ante rotación de clave, rechazo de login
y revocación de identidad. No se loguean secretos, tokens ni claims: el `clientSecretRef` es una
referencia al vault, nunca el secreto.

## Pruebas

`yarn test --testPathPatterns=auth_providers` — 96 pruebas (84 de servicio + 12 de delegación del
controlador).

## Pendiente

- **Descubrimiento remoto del JWKS**: el endpoint acepta las claves ya descubiertas
  (`discoveredKeys`); traerlas del `jwks_uri` o del documento de descubrimiento corresponde al
  conector de integraciones (módulo 12), que es quien sale a la red.
- **Verificación de la firma del token**: el callback recibe los claims ya verificados por quien
  llama. Validar la firma contra las claves publicadas vive en el servicio de autenticación.
- **Creación de la sesión**: UC-40-08 resuelve la identidad y el usuario; emitir la sesión y sus
  tokens es de `iam`.
- **Aprovisionamiento del usuario local**: `auto_provision` y `default_role_concept_id` quedan
  declarados en el vínculo; crear el usuario y asignarle el rol es de `iam`.
- **Proyección `read_models.provider_mapping_v`**: la nota del caso de uso la declara eventual vía
  outbox; se poblará con el módulo 35.
- **Outbox**: `ProviderRegistered`, `SigningKeyRotated`, `FederatedLoginSucceeded`,
  `IdentityUnlinked` se emitirán cuando exista el módulo 35.

