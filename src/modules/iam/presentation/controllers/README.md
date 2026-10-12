# IAM — Controllers

Thin HTTP layer. Controllers validate params (`ParseUUIDPipe`), read the caller
via `@CurrentUser()`, apply guards (`@Roles`, `@Public`) and delegate to a service.
No business logic lives here. Response bodies are DTOs.

## `IamUsersController` — `/iam/users`

| Method + path | UC | Guard | Code |
| --- | --- | --- | --- |
| `POST /iam/users` | UC-01-01 | `SECURITY_ADMIN` | 201 |
| `POST /iam/users/:id/credentials/federated` | UC-01-02 | `SECURITY_ADMIN` | 201 |
| `POST /iam/users/:id/credentials/:cid/revoke` | UC-01-09 | `SECURITY_ADMIN` | 200 |
| `POST /iam/users/:id/mfa-factors` | UC-01-03 | authenticated | 201 |
| `POST /iam/users/:id/devices` | UC-01-05 | authenticated | 201 |
| `POST /iam/users/:id/lock` | UC-01-07 | `SECURITY_ADMIN` | 200 |
| `POST /iam/users/:id/global-roles` | UC-01-10 | `SECURITY_ADMIN` | 200 |
| `POST /iam/users/:id/anonymize` | UC-01-12 | `SECURITY_ADMIN` | 200 |

## `IamAuthController` — `/iam/auth`

| Method + path | UC | Guard | Code |
| --- | --- | --- | --- |
| `POST /iam/auth/login` | UC-01-04 | `@Public` | 200 |
| `POST /iam/auth/token/refresh` | UC-01-06 | `@Public` | 200 |
| `POST /iam/auth/logout-all` | UC-01-08 | authenticated | 200 |
| `POST /iam/auth/sessions/purge` | UC-01-11 | `SECURITY_ADMIN` | 200 |
