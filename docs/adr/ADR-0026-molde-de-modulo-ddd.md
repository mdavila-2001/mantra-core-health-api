# ADR-0026: Molde de módulo por capas (DDD) con puertos hacia otros contextos

## Estado
Aceptado (piloto: `scheduling`). Aplica a cada módulo en cuanto se migra.

## Contexto

El inventario del 2026-10-08 midió que los 70 módulos se organizan por tipo de archivo
(`controllers/ services/ repositories/ entities/ dto/`), sin capas: 388 de 406 servicios hablan
directo con el `EntityManager`, 153 pasan de 400 líneas y `scheduling-bookings.service.ts` llegaba a
3 865 líneas con 14+ dependencias de otros contextos (seguros, perfiles, formularios, clínica,
avisos). Los identificadores internos mezclaban castellano e inglés. Las entidades las genera
`gen_entities.py` y no se editan a mano.

## Decisión

Todo módulo adopta el árbol y las reglas de `docs/architecture/module-layout.md`:

- `domain/` puro (sin Nest ni MikroORM), `application/` (casos de uso, un caso = una operación = una
  transacción; fachada fina con la API pública histórica), `infrastructure/` (repositorios y
  adaptadores) y `presentation/` (controllers y DTO). `entities/` no se mueve.
- Las dependencias de otros contextos entran **sólo por un puerto** definido en el módulo
  (interfaz + token) con su adaptador en `infrastructure/adapters/`.
- Refactor puro: el contrato HTTP (rutas, DTO, códigos, mensajes) y las claves de payloads de error
  no cambian; los identificadores internos pasan a inglés.
- La regla es ejecutable: `src/architecture/module-layering.spec.ts` verifica los imports de los
  módulos listados en `MIGRATED_MODULES`. Cada PR de migración suma su módulo a esa lista.

## Consecuencias

- Los servicios dejan de ser puntos de acoplamiento entre módulos; un cambio en `insurance` o
  `profiles` toca un adaptador, no la agenda.
- Quedan abiertas dos deudas conscientes: (1) los repositorios propios siguen importándose desde
  `application/` (excepción nombrada en el spec) hasta decidir si se separa el modelo de dominio de la
  entidad ORM; (2) los DTO siguen siendo el tipo de entrada/salida de los casos de uso.
- Costo: más archivos (una clase por operación) y un `*.testing.ts` por fachada para las pruebas.

## Alternativas descartadas

- Reescribir los repositorios como interfaces con mapeadores en el piloto: cambia consultas y no es
  refactor puro; se deja como decisión del propietario.
- Un solo servicio con métodos "limpios": no resuelve el acoplamiento ni el tamaño.
