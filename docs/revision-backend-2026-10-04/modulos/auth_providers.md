# Revisión del módulo `auth_providers` — ALOVIDA

## Alcance y evidencia

- Fecha: 2026-10-05. Configuración OIDC/SAML/OAuth, claves, mapeos, bindings,
  reglas, intentos de login, vinculación y desvinculación.
- `corepack yarn test src/modules/auth_providers --runInBand --silent` → **3
  suites y 96 pruebas aprobadas**. No existe una integración contra un proveedor
  externo ni contra el servicio que verifica firmas.

## Hallazgo confirmado

### AUTHP-01 — Media — URLs de protocolo aceptan texto arbitrario y el flujo posterior no puede clasificarlas

`ConfigureProtocolDto` declara `authorizeUrl`, `tokenUrl`, `userinfoUrl`,
`jwksUri`, `metadataUrl` y `samlAcsUrl` solamente como `@IsString`, sin
`@IsUrl`, esquema permitido, longitud ni bloqueo de fragmento/credenciales
([auth-providers.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/auth_providers/dto/auth-providers.dto.ts#L214-L275)).
`assertProtocolShape` sólo exige que algunos campos existan
([auth-providers-config.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/auth_providers/services/auth-providers-config.service.ts#L658-L704))
y la configuración se persiste tal cual ([#L188-L210](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/auth_providers/services/auth-providers-config.service.ts#L188-L210)).

El inicio de login concatena la URL configurada con parámetros sin validarla
([federated-login.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/auth_providers/services/federated-login.service.ts#L640-L671)). Un administrador puede dejar una configuración inválida o con un
esquema no HTTPS y el cliente que usa `authorizeUrl` recibirá un destino no
conforme; cuando el conector de descubrimiento/JWKS se integre, el mismo dato
será una entrada SSRF si no se valida en ambos bordes.

**Plan de corrección.** Validar al escribir y al consumir: URL absoluta HTTPS,
host sin credenciales, tamaño máximo, sin fragmento y allowlist explícita cuando
corresponda. Para entornos locales, permitir HTTP sólo bajo una bandera de
desarrollo. Mantener una guarda SSRF en el conector de red, aun si el DTO ya fue
validado. Traducir configuraciones históricas inválidas a una falla catalogada.

| Caso | Tipo y preparación | Entrada / resultado esperado |
| --- | --- | --- |
| Correcto | Unit/integración con endpoint HTTPS válido. | Configura y devuelve URL de autorización con parámetros codificados. |
| Límite | URL HTTPS de longitud máxima y query existente. | Se conserva query y agrega `state`/`nonce` correctamente. |
| Error | `javascript:`, URL relativa, credenciales, fragmento o URL sobredimensionada. | No persiste la configuración. |
| Falla catalogada | E2E de configuración. | `400`, `VALIDATION_ERROR`, `AUTH_PROVIDER_INVALID_PROTOCOL_URL`. |

## Controles que sí se sostienen

- El estado de login se registra y se acepta una vez; el token de vinculación se
  persiste sólo como hash.
- La autoaprobación de configuración no existe en esta superficie: roles y
  estado del proveedor se validan antes de usar bindings o reglas.
- La comprobación criptográfica de tokens y la descarga remota JWKS pertenecen
  a otro servicio; sus contratos deben reutilizar la validación anterior.

## Ola

| Ola | Hallazgo | Esfuerzo |
|---|---|---:|
| 2 | AUTHP-01 | S |
