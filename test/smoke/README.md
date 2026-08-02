# test / smoke

Agrupa los componentes relacionados con **smoke** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Subcarpetas

- [`modules/`](./modules/README.md): componentes de modules.

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `registry.ts` | Implementación o recurso de soporte de esta carpeta. |
| `smoke-kit.ts` | Implementación o recurso de soporte de esta carpeta. |
| `smoke.int-spec.ts` | Implementación o recurso de soporte de esta carpeta. |

## Cómo correrlo

```bash
docker compose stop $(docker compose config --services | grep '^worker-')  # imprescindible
yarn smoke
docker compose start $(docker compose config --services | grep '^worker-')
```

**Los workers tienen que estar parados.** El smoke arranca con `reset: true`, que trunca todas
las tablas de negocio para ser reproducible; con los 21 workers corriendo contra la misma base
ocurren dos cosas: escriben filas mientras se trunca —lo que produce fallos erráticos que cambian
de caso en cada corrida— y la carga combinada llegó a tumbar Postgres a modo recuperación. Con los
workers parados la batería es determinista: 766/766.

Tras cada corrida la base queda vacía de datos de negocio. Para volver a usar Postman:
`yarn postman:bootstrap`.

Y si lo que se acaba de mergear no aparece en `:3000`, no es la base: es que el contenedor `api`
corre una imagen anterior. `yarn docker:api:refresh` la reconstruye y recrea también los workers,
que comparten esa misma imagen.

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
