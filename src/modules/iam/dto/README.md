# IAM — DTOs

Request/response contracts. Requests use `class-validator` + `class-transformer`
(the global `ValidationPipe` runs with `whitelist` + `forbidNonWhitelisted` +
`transform`, so every accepted field must be declared). Responses expose only safe
fields — never secret hashes, raw refresh tokens beyond first issuance, or PHI.

| DTO | Used by | Notes |
| --- | --- | --- |
| `CreateUserDto` / `UserResponseDto` | UC-01-01 | `email` is the login identity; response omits secrets. |
| `LinkFederatedCredentialDto` | UC-01-02 | Provider + external subject. |
| `MfaFactorDto` | UC-01-03 | Dual-purpose: enroll (`factorType`) or verify (`verify`+`factorId`). |
| `LoginDto` / `TokenResponseDto` | UC-01-04 | Credentials in, token pair out. |
| `CreateDeviceDto` | UC-01-05 | Optional `trust` marks the device trusted. |
| `RefreshTokenDto` | UC-01-06 | Raw refresh token; server hashes to look up. |
| `LockUserDto` | UC-01-07 | Optional admin reason. |
| `GlobalRoleDto` | UC-01-10 | `role` + `action` (GRANT/REVOKE). |
| `LogoutAllResultDto` | UC-01-08 | `{ revokedSessions }`. |
| `PurgeResultDto` | UC-01-11 | `{ expiredSessions, expiredTokens }`. |
| `StatusResultDto` | UC-01-07/09/10/12 | Generic `{ ok }` acknowledgement. |
