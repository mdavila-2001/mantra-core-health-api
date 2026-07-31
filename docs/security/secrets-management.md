# Gestión de secretos

> Fase 13. Ver [ADR-0015](../adr/ADR-0015-secretos-variables-entorno.md) para la decisión
> completa y sus consecuencias — esta página añade el inventario real de secretos y las
> excepciones donde el sistema sí gestiona rotación/cifrado de forma más sofisticada.

## Inventario real de secretos (`.env.example`)

Ver [variables de entorno](../getting-started/environment-variables.md) para la tabla completa.
Categorías: credenciales de base de datos (2 roles distintos, aplicación vs. administrativo — ver
[aislamiento de tenant](tenant-isolation.md)), `JWT_SECRET`, `MFA_ENCRYPTION_KEY`, credenciales de
MinIO, credenciales de los demás almacenes.

## Excepción: gestión de llaves de cifrado para PHI

A diferencia del resto de secretos (variables de entorno planas), el cifrado de PHI en reposo usa
un mecanismo más sofisticado: `system_ops.encryption_keys` + `system_ops.key_rotation_events`,
con `external_key_ref` apuntando a un KMS/HSM externo (nunca la llave en la propia base) y campo
`next_rotation_at` para rotación programada. Es decir: **el material criptográfico crítico no
sigue el patrón de "variable de entorno"** — tiene su propio ciclo de vida gobernado.

## Claves de API — hash, no texto plano

`iam.api_keys` almacena `key_hash`, no la clave en claro — coherente con la regla "secretos jamás
en claro" del estándar de diseño del proyecto (ver [modelo de amenazas](threat-model.md)).

## Llaves de firma de federación

`auth_providers` almacena únicamente la **parte pública** (`public_key`) de las llaves de firma
usadas para verificar tokens de proveedores de identidad federados — el material privado nunca
entra a este sistema.

## Riesgo residual

Los secretos "planos" (JWT, credenciales de almacenes) no tienen rotación automática ni auditoría
de acceso individual verificada en esta fase — ver `SEC-002`... realmente `ADR-0015` §"Riesgos".
No se declara "suficiente para producción" sin una evaluación explícita de si el volumen y
sensibilidad de estos secretos justifica migrar a un gestor dedicado (Vault, AWS Secrets Manager).

## Ver también

- [ADR-0015: Gestión de secretos — variables de entorno](../adr/ADR-0015-secretos-variables-entorno.md)
- [Modelo de amenazas](threat-model.md)
