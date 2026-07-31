# Mantenimiento

> Fase 14. Tareas de mantenimiento recurrente reales, derivadas de mecanismos ya implementados en
> código — no una lista genérica de "buenas prácticas".

## Mantenimiento de dependencias

`yarn audit` (ver [seguridad de dependencias](../security/dependency-security.md)) — sin cadencia
automatizada verificada en esta fase (candidato para CI, Fase 16).

## Mantenimiento del catálogo ORM

Cuando cambia el modelo de datos (`database/SQL/99_migrations`), el flujo real es:

```bash
yarn orm:catalog   # regenera índices/FK desde la bóveda de diseño
yarn orm:gen        # regenera entidades por introspección
yarn orm:audit       # verifica fidelidad contra graphify-out/fidelity-audit.json
```

Ver [migraciones](../data/migrations.md) para el flujo completo.

## Mantenimiento de la documentación de este portal

```bash
yarn docs:modules:sync   # re-espeja los 60 README.md de módulo
yarn docs:data:sync       # regenera el catálogo de entidades desde la bóveda + código
yarn docs:openapi:generate  # regenera el contrato OpenAPI desde los decoradores reales
yarn docs:validate          # Redocly + AsyncAPI + cobertura + enlaces
yarn docs:build              # mkdocs build --strict
```

Este portal está diseñado para **no desactualizarse silenciosamente** — ver
[política de documentación](../governance/documentation-policy.md).

## Purga/archivado de datos de alto volumen

Ver [retención](../data/retention.md) — el mecanismo (`system_ops.retention_policies`,
`partition_specs`) existe en código; la ejecución real y su cadencia no se verificaron en esta
fase contra un entorno real.

## Rotación de credenciales

Ver [gestión de secretos](../security/secrets-management.md) — `system_ops.key_rotation_events`
existe para el material criptográfico de PHI; para el resto de secretos (JWT, credenciales de
almacenes), sin proceso de rotación automatizado verificado.

## Ver también

- [Health checks](health-checks.md), [Escalado](scaling.md).
