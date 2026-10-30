# src / common / errors

Agrupa los componentes relacionados con **errors** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `domain.exception.ts` | Implementación o recurso de soporte de esta carpeta. |
| `error-codes.ts` | Implementación o recurso de soporte de esta carpeta. |
| `system-error-reasons.ts` | Catálogo de `reason` de sistema (guards, pipes de query, readiness, secretos). `code` dice el tipo HTTP; `reason` dice cuál fue. |
| `reasoned-http-exceptions.ts` | Fábricas `badRequestWithReason`/`forbiddenWithReason`/`unauthorizedWithReason`/`serviceUnavailableWithReason`: devuelven la clase de Nest (los `instanceof` existentes siguen valiendo) con cuerpo `{ code, message, reason, details }`. |
| `secret-cipher.error.ts` | `SecretCipherError`: secreto cifrado ilegible; el filtro lo sirve como 500 `INTERNAL` con `reason: SECRET_CIPHER_INVALID`. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
