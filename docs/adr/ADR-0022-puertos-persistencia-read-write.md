# ADR-0022: Puertos de persistencia con rutas de lectura y escritura separadas

## Estado
Aceptado.

## Contexto

La capa de datos no tenía ninguna costura. La auditoría del código encontró:

- 257 servicios inyectan `EntityManager` de MikroORM directamente. La capa de aplicación depende
  de una clase de infraestructura, así que sustituir o complementar el ORM exigiría tocar los 60
  módulos.
- 1363 operaciones de lectura y 870 de escritura salen por **la misma conexión**. No hay forma de
  mandar un informe pesado a una réplica sin reescribir el servicio que lo genera.
- 854 llamadas a `em.transactional` reparten la decisión transaccional por toda la base de código.
- La aplicación se conecta como `mantra`: SUPERUSER con `CREATEROLE`, `CREATEDB` y **`BYPASSRLS`**,
  y propietario de las 1216 tablas. Hay políticas RLS activas en 288 tablas que el runtime **se
  salta por completo**, porque un superusuario las ignora por definición.
- Los errores del driver suben crudos: distinguir "clave duplicada" de "sin privilegios" obliga a
  comparar cadenas SQLSTATE dentro de un servicio de negocio.

## Fuerzas y restricciones

- **1212 tablas y 412 archivos de repositorio.** Reescribirlos de una vez no es una opción
  realista ni segura.
- Los repositorios ya reciben el `EntityManager` **por parámetro**. Ese es el punto de corte
  natural: permite introducir puertos sin tocar las consultas.
- El proyecto ya es políglota (ADR-0003), pero MongoDB, Redis y OpenSearch viven en tres módulos
  que no tienen ninguna entidad del ORM y no pasan por esta capa.
- Cualquier cambio debe poder revertirse sin desplegar código.

## Opciones consideradas

**A. Repositorio genérico único (`ReadRepository<T>` para todo).** Descartada. Un criterio
genérico acaba siendo el `where` del ORM con otro nombre, y entonces la abstracción no abstrae:
cambia la forma de escribir la consulta sin desacoplar nada.

**B. Migrar los 60 módulos a la vez.** Descartada. 412 repositorios y 4212 pruebas; el riesgo de
regresión no guarda ninguna proporción con el beneficio de hacerlo en un solo paso.

**C. Sustituir MikroORM.** Descartada. El ORM no es el problema —el acoplamiento a él sí—, y
ADR-0002 ya lo eligió por razones que siguen siendo válidas.

**D. Puertos + adaptadores + enrutado declarativo, con migración módulo a módulo.** Elegida.

## Decisión

Se añade `src/persistence` **junto a** `src/orm`, sin retirarlo:

1. **Puertos** de lectura, escritura y transacción, con contextos propios (`ReadContext`,
   `WriteContext`, `TransactionContext`) que sustituyen al `EntityManager` en la firma de la capa
   de aplicación. Los puertos de dominio son específicos y con nombres de negocio.
2. **Registro central de conexiones** con alias. Cuando lectura y escritura resultan equivalentes
   —comparando una huella sanitizada que incluye usuario, host, puerto, base y TLS— los dos
   nombres lógicos se publican sobre **un único pool**. Es el caso por defecto.
3. **Router declarativo** que valida en el arranque que ninguna escritura vaya a una conexión de
   solo lectura ni a la administrativa, y que desvía a la primaria las lecturas que declaran
   `strong` o `read-after-write`.
4. **Adaptadores PostgreSQL** de lectura y escritura sobre instancias de MikroORM; la secundaria
   solo se crea si la configuración lo pide.
5. **Errores normalizados** con traducción de SQLSTATE. El `DETAIL` de PostgreSQL **no** se
   propaga: en una violación de unicidad contiene el valor duplicado, que puede ser un correo o un
   número de historia.
6. **Capacidades declaradas por motor**, para que el arranque rechace una ruta que exija
   transacciones a un motor que no las tiene en este despliegue.
7. **Roles `mantra_writer` y `mantra_reader`**, aprovisionados de forma idempotente y verificados
   ejecutando operaciones reales.
8. **Migración por módulo** vía `PERSISTENCE_PORTS_MODULES`, con `scheduling` como piloto.

PostgreSQL sigue siendo el motor por defecto: existe decisión documentada previa (ADR-0003), que
es el segundo criterio de precedencia, por delante del valor por defecto.

## Consecuencias positivas

- La ruta de lectura puede apuntar a un rol de solo lectura, a una réplica o a otro proveedor sin
  tocar un solo servicio.
- Las lecturas ejecutadas con un rol que no puede escribir convierten en error visible (42501) un
  bug que hoy pasaría desapercibido.
- El `BYPASSRLS` del rol de runtime deja de ser inevitable: hay un camino para que la aplicación
  opere bajo las políticas RLS que ya existen.
- Un fallo de configuración del enrutado mata el proceso en el arranque, no en la primera reserva
  de cita en producción.
- Los errores de persistencia son un vocabulario estable y no filtran datos personales.

## Consecuencias negativas

- Convivencia temporal de dos caminos de acceso a datos hasta que los 60 módulos migren. Es
  deliberado (fase «expand» del §47) y tiene coste: dos formas de hacer lo mismo en el árbol.
- Un adaptador por puerto añade una capa de indirección frente a llamar al repositorio.
- Con rutas separadas hay dos instancias de MikroORM, y la segunda vuelve a descubrir las 1184
  entidades: memoria adicional real. Por eso solo se crea si la configuración la pide.

## Riesgos

- **El piloto es un único módulo.** El resto sigue con el acoplamiento anterior; este ADR describe
  la dirección, no un estado alcanzado.
- **Los roles nuevos no se usan todavía en runtime.** Están creados y verificados, pero
  `DB_READ_USER` no está fijado en ningún despliegue: activarlo es una decisión operativa
  pendiente, y hasta que se tome, la separación es una capacidad y no un hecho.
- El desvío `fallback-to-primary` ejecutaría lecturas con la credencial de escritura. Por eso el
  valor por defecto es `fail-fast`.

## Evidencia

- `src/persistence/`, `src/modules/scheduling/ports/`, `scripts/postgres/`.
- 132 pruebas unitarias y de contrato, 13 de privilegios contra PostgreSQL real, 10 de integración
  sobre la aplicación.
- `yarn db:provision:dev` ejecutado tres veces seguidas contra la base local: mismo estado final,
  10 comprobaciones de privilegio en verde.

## Plan de revisión

Revisar cuando el segundo módulo migre, y de nuevo cuando `DB_READ_USER` se fije en un despliegue
real. Si al cabo de dos módulos el patrón resulta más caro de lo que aporta, la vuelta atrás es
vaciar `PERSISTENCE_PORTS_MODULES` y retirar `src/persistence`, porque nada fuera de él depende de
sus tipos.
