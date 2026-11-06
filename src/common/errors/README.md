# src / common / errors

Groups **errors**-related components and keeps this system responsibility cohesive.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `domain.exception.ts` | Support implementation or resource for this folder. |
| `error-codes.ts` | Support implementation or resource for this folder. |
| `system-error-reasons.ts` | Catálogo de `reason` de sistema (guards, pipes de query, readiness, secretos). `code` dice el tipo HTTP; `reason` dice cuál fue. |
| `reasoned-http-exceptions.ts` | Fábricas `badRequestWithReason`/`forbiddenWithReason`/`unauthorizedWithReason`/`serviceUnavailableWithReason`: devuelven la clase de Nest (los `instanceof` existentes siguen valiendo) con cuerpo `{ code, message, reason, details }`. |
| `secret-cipher.error.ts` | `SecretCipherError`: secreto cifrado ilegible; el filtro lo sirve como 500 `INTERNAL` con `reason: SECRET_CIPHER_INVALID`. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
