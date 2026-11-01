# PLAN DE TRABAJO — Autenticación Identity & Sesiones JWT (AloVida Backend v2.0.0)

**Fecha:** 2026-10-31  
**Repositorio:** `C:\Alovida\alovida-backend`  
**Objetivo:** Implementar el sistema de autenticación de grado médico con Argon2id, emisión y rotación de tokens JWT (Access & Refresh), endpoints de sesión y estrategia Passport JWT integrada con RBAC Zero-Trust.

---

## 1. Contexto & Seguridad de Grado Médico

AloVida gestiona datos de salud altamente sensibles (PHI / Ley 1173 de Bolivia). La capa de identidad debe garantizar:
1. **Hasheo de Contraseñas:** Algoritmo **Argon2id** (ganador del Password Hashing Competition) para máxima resistencia contra ataques de fuerza bruta y GPU/ASIC.
2. **Tokens de Acceso de Corta Duración:** `accessToken` con expiración de 15 minutos con claims estandarizados (`sub`, `nationalId`, `roles`, `tenantId`).
3. **Tokens de Refresco (Refresh Tokens) Rotativos:** Vida de 7 días, con invalidación en logout para prevenir secuestro de sesión.
4. **Protección Zero-Trust:** Integración nativa con `JwtAuthGuard` y `RolesGuard` donde todas las rutas son privadas por defecto salvo las decoradas con `@Public()`.

---

## 2. Hitos de Implementación

### H1 — Generación de Artefactos con Nest CLI
- Generar `IdentityService` (`yarn --cwd c:\Alovida\alovida-backend nest g s modules/identity/services/identity --no-flat`).
- Generar `IdentityController` (`yarn --cwd c:\Alovida\alovida-backend nest g co modules/identity/controllers/identity --no-flat`).

### H2 — DTOs de Autenticación
- `login.dto.ts`: Identificador (CI o Email) y contraseña.
- `refresh-token.dto.ts`: Token de refresco para rotación.
- `register-credentials.dto.ts`: Registro interno de credenciales para nuevos usuarios.

### H3 — Servicio de Identidad con Argon2id y JWT
- Métodos: `hashPassword(password)`, `verifyPassword(hash, plain)`, `login(dto)`, `refresh(dto)`, `logout(refreshToken)`.
- Manejo de excepciones sanitizado (`UnauthorizedException` sin revelar si falló el usuario o la contraseña).

### H4 — Estrategia Passport JWT
- Implementar `JwtStrategy` en `src/modules/identity/strategies/jwt.strategy.ts`.
- Validación de claims de usuario e inyección en `req.user` cumpliendo con la interfaz `AuthenticatedUser`.

### H5 — Controlador de Identidad
- `POST /identity/login` (`@Public()`).
- `POST /identity/refresh` (`@Public()`).
- `POST /identity/logout` (requiere token autenticado).
- `GET /identity/me` (consulta de perfil y roles de la sesión activa).

### H6 — Pruebas Unitarias y de Integración (.spec.ts)
- Suites para `IdentityService`, `IdentityController`, y `JwtStrategy`.
- Verificación de la suite completa (>80 tests pasando).

---

## 3. Criterios de Aceptación (Dado / Cuando / Entonces)

### CA-1: Autenticación Exitosa con Argon2id
- **Dado** un usuario registrado con CI boliviano y contraseña válida,
- **Cuando** invoca `POST /identity/login`,
- **Entonces** recibe HTTP 200 con `accessToken`, `refreshToken` y objeto `user` con sus roles oficiales de salud boliviana sin incluir `passwordHash`.

### CA-2: Rechazo Seguro de Credenciales Inválidas
- **Dado** un intento de inicio de sesión con contraseña incorrecta o usuario inexistente,
- **Cuando** invoca `POST /identity/login`,
- **Entonces** el sistema responde HTTP 401 Unauthorized de forma genérica ("Credenciales inválidas") sin filtrar datos internos.

### CA-3: Rotación y Renovación de Tokens
- **Dado** un `refreshToken` válido,
- **Cuando** se solicita `POST /identity/refresh`,
- **Entonces** se emite un nuevo `accessToken` válido por 15 minutos.

---

## 4. Definición de Hecho (DoD)
- [ ] Servicio y controlador generados con Nest CLI.
- [ ] DTOs de login y refresh validados con `class-validator`.
- [ ] Contraseñas hasheadas exclusivamente con `argon2.hash()`.
- [ ] `JwtStrategy` configurada y proveyendo `AuthenticatedUser`.
- [ ] `yarn build` exitoso con código 0.
- [ ] `yarn test` con todas las suites en verde.
- [ ] `REPORTE.md` completado y evidencia en `evidencia/`.
