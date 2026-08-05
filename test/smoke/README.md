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

## Recorridos por actor

Además de los archivos por módulo, hay cuatro agrupados por **tipo de usuario**. Los de módulo
ejercen los endpoints de a uno y siempre como administrador, lo que comprueba que responden pero
no que el titular pueda recorrer su camino: un endpoint puede devolver 201 al admin y 403 al
dueño de los datos, y esa diferencia es la que importa.

| Archivo | Actor | Corre con |
| --- | --- | --- |
| `modules/paciente.smoke.ts` | Paciente | Su propio token, desde el login con documento |
| `modules/medico.smoke.ts` | Profesional de salud | Su propio token |
| `modules/organizacion.smoke.ts` | Owner de una organización | El token del owner |
| `modules/administrador.smoke.ts` | Plataforma | El token de administrador |

Para eso `SmokeCase` acepta `token`: sin él los endpoints `/me` resolvían el titular desde el JWT
del administrador y el caso pasaba sin haber probado nada.

Van **al final** del registro. Puestos al principio, el cierre de sesión del paciente alteraba el
estado compartido y los casos de `accounting` empezaban a recibir 401.

```bash
yarn smoke                                    # todo, incluidos los cuatro recorridos
yarn smoke -t "Paciente"                      # jest filtra por nombre del test, no por módulo:
                                              # el runner agrupa todo en un solo `it`, así que
                                              # para un actor suelto conviene leer el resultado
                                              # en output.smoke.test.json filtrando `module`
```

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
