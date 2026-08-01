# Runbook: Tokens o autenticación fallando

> Fase 14. Ver [autenticación](../../api/authentication.md).

## Síntoma

Usuarios no pueden iniciar sesión, o tokens válidos son rechazados masivamente
(`401 UNAUTHENTICATED`, ver [modelo de error](../../api/error-model.md)).

## Diagnóstico

1. **Todos** los usuarios afectados, o un subconjunto — un subconjunto sugiere
   `iam.account_lockouts` (bloqueo tras `ACCOUNT_LOCK_THRESHOLD` intentos fallidos, posible
   ataque de fuerza bruta) más que un fallo sistémico.
2. Si es total: verificar `JWT_SECRET` — un cambio o rotación no coordinada invalida todos los
   tokens emitidos con el secreto anterior.
3. Verificar que `POST /iam/auth/login`/`POST /iam/auth/token/refresh` (endpoints públicos, ver
   [autenticación](../../api/authentication.md)) responden — si fallan ellos mismos con 5xx, el
   problema es de infraestructura (base de datos), no del mecanismo de auth en sí.
4. Verificar reloj del sistema — un JWT con `exp` mal calculado por desfase de reloj entre
   instancias puede rechazar tokens válidos.

## Mitigación

- Bloqueos masivos por fuerza bruta: coordinar con `SECURITY_ADMIN` antes de desbloquear en masa
  — podría ser un ataque activo, no un falso positivo.
- Secreto rotado sin coordinación: todos los usuarios deben re-autenticarse — comunicar el
  impacto, no es un bug a revertir silenciosamente si la rotación fue intencional.
- Infraestructura caída: ver [base de datos degradada](database-degraded.md).

## Escalación

`SECURITY_ADMIN`/`IDENTITY_ADMIN` si hay sospecha de ataque; `SRE` si es infraestructura.
