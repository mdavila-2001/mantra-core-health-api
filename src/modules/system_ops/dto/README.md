# DTOs de `system_ops`

`class-validator` + `class-transformer` + `@nestjs/swagger`. Los request validan
tipos, longitudes, uuids y objetos anidados (`@ValidateNested`); los response solo
exponen campos seguros (ids, estados, flags). Los `*_concept_id` se reciben como
uuid del cliente y en runtime provienen de `SYSOPS.*` / `CONCEPTS.*`.

Agrupados por área: `governance-catalog`, `governance-policy`, `retention-execution`,
`residency`, `legal-hold`, `backup`, `framework`, `assessment`, `draft` y
`common-response` (`IdResultDto`, `StatusResultDto`).
