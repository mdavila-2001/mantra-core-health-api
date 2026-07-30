# DTOs — Pharmacy

`class-validator` + `class-transformer` + `@nestjs/swagger`. Los DTO de request
validan tipos, requeridos, longitudes, uuids, enums y objetos anidados
(`@ValidateNested`). Los de respuesta exponen solo campos seguros.

- `create-pharmacy.dto.ts` — alta de farmacia + `InitialLicenseDto` anidado (UC-24-01).
- `create-site.dto.ts` — sede dispensadora (UC-24-02).
- `verify-license.dto.ts` — verificación/rechazo de licencia (UC-24-03).
- `create-product.dto.ts` — producto + `ProductIdentifierDto[]` (UC-24-04).
- `create-price-list.dto.ts` — lista de precios (UC-24-05).
- `create-price.dto.ts` — precio versionado (UC-24-06).
- `create-connection.dto.ts` — conexión de integración (UC-24-07).
- `create-mapping.dto.ts` — mapeo de producto externo (UC-24-08).
- `responses.dto.ts` — respuestas + `StatusResultDto` + proyección de catálogo (UC-24-11).
