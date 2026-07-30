# DTOs de proveedores de identidad

Contratos de entrada y salida. La validación vive en `class-validator`; la documentación, en
`@nestjs/swagger`.

## Convenciones

- Los identificadores de concepto viajan como UUID (`*ConceptId`). Los vocabularios cortos que el
  cliente elige —protocolo, categoría, entorno, autenticación del endpoint de token, efecto de la
  regla— viajan como literales legibles (`'OIDC'`, `'PRODUCTION'`, `'ALLOW'`) y el servicio los
  traduce al concepto. Pedirle al cliente un UUID para decir `OIDC` sería inutilizable.
- Las fechas de entrada son ISO-8601 (`@IsISO8601`); las de salida, `toISOString()`.
- Los `*ResponseDto` devuelven identificadores y estado, no la entidad entera.

## Vocabularios

| Tipo | Valores |
| --- | --- |
| `IdpProtocol` | `OIDC`, `SAML`, `OAUTH2` |
| `IdpCategory` | `ENTERPRISE`, `SOCIAL`, `GOVERNMENT` |
| `IdpEnvironment` | `DEVELOPMENT`, `STAGING`, `PRODUCTION` |
| `TokenEndpointAuth` | `CLIENT_SECRET_POST`, `CLIENT_SECRET_BASIC`, `PRIVATE_KEY_JWT` |
| `ProvisioningEffect` | `ALLOW`, `DENY` |

## Por caso de uso

| UC | Entrada | Salida |
| --- | --- | --- |
| 01 | `CreateProviderDto` | `ProviderResponseDto` |
| 02 | `ConfigureProtocolDto` (+ `DiscoveredKeyDto`) | `ProtocolConfigResponseDto` |
| 03 | `PublishSigningKeyDto` | `SigningKeyResponseDto` |
| 04 | `SetAttributeMappingsDto` (+ `AttributeMappingDto`) | `AttributeMappingsResponseDto` |
| 05 | `BindTenantDto` | `BindingResponseDto` |
| 06 | `CreateProvisioningRuleDto` | `ProvisioningRuleResponseDto` |
| 07 | `StartLoginDto` | `StartLoginResponseDto` |
| 08 | `ProcessCallbackDto` | `CallbackResponseDto` |
| 09 | `RequestAccountLinkDto` | `AccountLinkRequestResponseDto` |
| 10 | `CompleteAccountLinkDto` | `CompleteAccountLinkResponseDto` |
| 11 | `RotateSigningKeyDto` | `RotateKeyResponseDto` |
| 12 | `UnlinkIdentityDto` | `UnlinkIdentityResponseDto` |

## Decisiones que no son obvias

- **`RotateSigningKeyDto extends PublishSigningKeyDto`**: rotar es publicar una clave y, además,
  retirar las salientes. El único campo propio es `graceHours` (0–720, 24 por defecto).
- **`clientSecretRef`, no `clientSecret`**: la referencia al vault, nunca el secreto. Un secreto en
  el cuerpo acabaría en los logs de alguien.
- **`ConfigureProtocolDto` tiene casi todo opcional**: cada protocolo exige un subconjunto distinto
  y `class-validator` no puede expresar esa dependencia. La comprobación está en el servicio, donde
  se conoce el protocolo del proveedor.
- **`discoveredKeys`**: el JWKS llega ya descubierto. Salir a la red es del conector de
  integraciones; este módulo importa lo que le entregan.
- **`ProcessCallbackDto.userId` es opcional**: el módulo no crea usuarios locales. Con él y con JIT
  habilitado se aprovisiona la identidad; sin él, la respuesta trae un token de vinculación.
- **`ProcessCallbackDto.claims` llega ya verificado** por quien llama; validar la firma es del
  servicio de autenticación.
- **`CallbackResponseDto` no lanza en el rechazo**: devuelve `outcomeConceptId`,
  `failureReasonConceptId` y el `attemptId`. Un 4xx perdería el intento que hay que auditar.
- **`linkToken` sólo aparece en la respuesta**: en la tabla vive su hash SHA-256.
- **`AttributeMappingDto.isIdentifier`**: exactamente uno en el conjunto; la comprobación es del
  servicio porque mira el array completo.
- **`SetAttributeMappingsDto` usa `@ArrayMinSize(1)`**: un mapeo vacío dejaría al proveedor sin forma
  de identificar al sujeto.

## Pruebas

Sin suite propia: los DTOs se validan por el `ValidationPipe` global y se ejercitan desde las
pruebas de servicio y de controlador.
