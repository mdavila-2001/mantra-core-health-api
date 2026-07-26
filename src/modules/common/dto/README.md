# Common · DTOs

Request and response contracts, validated with `class-validator` /
`class-transformer` and documented with `@nestjs/swagger`. The global
`ValidationPipe` (whitelist + forbidNonWhitelisted + transform) rejects unknown
properties. Response DTOs expose only safe fields.

## Enums (`enums.ts`)

Input enums are readable keys that services translate into `*_concept_id` values
from `CONCEPTS`; they are never persisted as text.

`OwnerType`, `IdentifierType`, `IdentifierUse`, `ContactSystem`, `ContactUse`,
`FileCategory`, `FileSensitivity`, `DerivativeType`, `LinkRole`, `LinkVisibility`,
`ScanResult`.

## Request DTOs

| DTO | Endpoint |
|---|---|
| `CreateIdentifierDto` | POST /common/identifiers |
| `CreateContactPointDto` | POST /common/contact-points |
| `VerifyContactPointDto` | POST /common/contact-points/:id/verify |
| `CreateAddressDto` | POST /common/addresses |
| `CreateFileDto` | POST /common/files |
| `CreateFileVersionDto` | POST /common/files/:id/versions |
| `CreateFileDerivativeDto` | POST /common/files/:id/versions/:vid/derivatives |
| `CreateFileLinkDto` | POST /common/files/:id/links |
| `ScanResultDto` | POST /internal/files/versions/:vid/scan-result |

## Response DTOs

`IdentifierResponseDto`, `ContactPointResponseDto`, `AddressResponseDto`,
`FileResponseDto`, `FileVersionResponseDto`, `FileDerivativeResponseDto`,
`FileLinkResponseDto`, `DeleteFileResponseDto`, `DownloadUrlResponseDto`.

### Notes

- `CreateAddressDto.lines` is `string[]`; it is serialized to a single column by
  the service. `country` defaults to `PE`.
- `sizeBytes` is a positive integer in requests; it surfaces as a `string`
  (bigint) in `FileVersionResponseDto`.
- `VerifyContactPointDto.code` is optional and accepted as-is in this
  implementation (see the service note about a real OTP flow).
