# ADR-0015: Gestión de secretos — variables de entorno

## Estado
Aceptado, con riesgo residual documentado.

## Contexto
El sistema necesita secretos (`JWT_SECRET`, `MFA_ENCRYPTION_KEY`, credenciales de los 5 almacenes
de datos, credenciales de MinIO) disponibles en `api` y en los 20 workers.

## Fuerzas y restricciones
- Simplicidad de configuración vía `.env`/variables de entorno de contenedor.
- Sin evidencia en el código de integración con un gestor de secretos dedicado (Vault, AWS
  Secrets Manager, etc.) al momento de esta auditoría.

## Opciones consideradas
Vault/gestor de secretos dedicado vs. variables de entorno: el código usa la segunda opción —
`.env.example` documenta las variables, `ConfigModule.forRoot()` las valida con esquemas Joi al
arranque.

## Decisión
Variables de entorno como mecanismo de distribución de secretos, validadas al arranque
(`ormEnvSchema`, `authEnvSchema`, `loggingEnvSchema`, `workerEnvSchema` vía Joi) para que un
secreto ausente o mal formado aborte el proceso inmediatamente, no en el primer uso.

## Consecuencias positivas
- Fallo rápido: un `JWT_SECRET` ausente tumba el arranque, no falla silenciosamente en el primer
  login.
- Simplicidad operativa — sin infraestructura adicional de gestión de secretos que mantener.

## Consecuencias negativas
- Sin rotación automática de secretos.
- Sin auditoría de acceso a secretos individual (quién leyó qué secreto y cuándo) — una variable
  de entorno es legible por cualquier proceso con acceso al contenedor.
- Riesgo de fuga si un secreto termina en un log o en control de versiones por error.

## Riesgos
`docs/security/secrets-management.md` (Fase 13) debe evaluar si el volumen y sensibilidad de los
secretos (dato de salud, financiero) justifica migrar a un gestor dedicado. No se declara este
mecanismo "suficiente para producción" sin esa evaluación explícita.

## Evidencia
`.env.example`, `src/orm/config/orm.env.ts`, `src/worker/worker.env.ts`.

## Plan de revisión
Evaluar en Fase 13 (seguridad) si se requiere un gestor de secretos dedicado.
