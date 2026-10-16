# Molde de módulo (DDD por capas)

Decisión: [ADR-0026](../adr/ADR-0026-molde-de-modulo-ddd.md). Módulo piloto y referencia viva:
[`src/modules/scheduling`](../../src/modules/scheduling/README.md). Lo hace cumplir
`src/architecture/module-layering.spec.ts`, que sólo mira los módulos de `MIGRATED_MODULES`.

## Árbol objetivo

```text
src/modules/<módulo>/
├── <módulo>.module.ts       cableado Nest: providers y { provide: TOKEN_DEL_PUERTO, useExisting: Adaptador }
├── <módulo>.tokens.ts       (si hace falta) constantes sin capa, p. ej. el nombre ante persistencia
├── entities/                ENTIDADES ORM GENERADAS (gen_entities.py): intocables
├── domain/                  reglas puras
│   ├── <módulo>.concepts.ts
│   └── <subdominio>/        estados, políticas, máquinas de estado, cálculos, tipos
├── application/
│   ├── ports/               interfaces + tokens hacia otros contextos y servicios externos
│   └── <área>/
│       ├── <área>.service.ts      FACHADA fina: misma API pública, sin reglas
│       ├── support/               colaboradores compartidos (acceso, notificador, …)
│       └── use-cases/*.use-case.ts  una clase = una operación = una transacción
├── infrastructure/
│   ├── repositories/        acceso a datos propio
│   ├── adapters/            implementan los puertos (una clase por puerto)
│   └── persistence/ config/ seed/
└── presentation/
    ├── controllers/         HTTP: orquesta, sin reglas
    └── dto/                 contrato HTTP
```

## Qué va en cada capa

| Capa | Contiene | No contiene |
| --- | --- | --- |
| `domain/` | funciones puras, constantes, tipos estructurales, máquinas de estado, políticas (devuelven un veredicto, no lanzan excepciones HTTP) | Nest, MikroORM, entidades, repositorios, otros módulos |
| `application/` | casos de uso (orquestan: cargar → decidir con el dominio → persistir → avisar), fachadas, colaboradores, puertos | adaptadores, consultas SQL, decoradores HTTP |
| `infrastructure/` | repositorios, adaptadores a otros contextos, mensajería, persistencia, configuración | reglas de negocio |
| `presentation/` | controllers y DTO | reglas de negocio, acceso a datos |

## Reglas de dependencia (las verifica el spec)

1. `domain/` no importa `@nestjs/*`, `@mikro-orm/*`, `nestjs-pino`, `entities/`, ni
   `application/`, `infrastructure/`, `presentation/`, ni el **barril** `src/common`
   (arrastra Nest; sí sus archivos puros: `common/constants/concepts`).
2. `application/` no importa `infrastructure/` salvo `infrastructure/repositories/` (excepción
   declarada, ver «Trampas») y no toma de `presentation/` más que `presentation/dto`.
3. `presentation/` no importa `infrastructure/`.
4. **Los otros módulos entran sólo por un puerto**: un archivo fuera de `infrastructure/` no
   importa nada de otro módulo, salvo sus `*.concepts.ts` (terminología compartida). El puerto se
   declara en `application/ports/` y lo implementa un adaptador en `infrastructure/adapters/`.
5. `entities/` no se edita ni se mueve (lo regenera `gen_entities.py`).
6. Un módulo ajeno se consume con lo que ese módulo **ya exporta**; no se le agregan exports.

## Cómo nombrar

- Puerto: `<Capacidad>Port` (interfaz) + `<CAPACIDAD>_PORT` (token `Symbol`) en
  `application/ports/<capacidad>.port.ts`. Nombres de negocio y tipos propios; ningún tipo ajeno
  cruza el puerto.
- Adaptador: `<ContextoOrigen><Capacidad>Adapter` en `infrastructure/adapters/`
  (`ProfilesPatientRepresentationAdapter`).
- Caso de uso: `<Verbo><Objeto>UseCase` con `execute(...)` (y `executeInTransaction(tx, …)` si otro
  caso de uso lo reutiliza dentro de su transacción). Archivo `<verbo>-<objeto>.use-case.ts`.
- Fachada: conserva el nombre histórico (`SchedulingBookingsService`) y delega con
  `Parameters<UseCase['execute']>`; no tiene lógica, de modo que controllers y otros módulos no
  cambian.
- Identificadores en inglés (regla 29). Se conservan en castellano **sólo** las claves de
  contrato HTTP (DTO, `details` de errores, respuestas) y la prosa de usuario (de usted).

## Receta para migrar un módulo

1. `git mv` por capas y reescribir los especificadores con el AST (no con `sed`); typecheck.
2. Renombrar a inglés con el `LanguageService` (`findRenameLocations`), con chequeo de choque de
   nombres; excluir DTO, `entities/` y claves de contrato. Después, buscar claves de mocks en los
   specs (los dobles `any` no los renombra el compilador).
3. Extraer a `domain/` lo puro; los límites del dominio devuelven veredictos y la capa de aplicación
   los traduce a la excepción HTTP con el **mismo** mensaje.
4. Un puerto por dependencia de otro contexto, con su adaptador; las pruebas arman los
   casos de uso con `*.testing.ts` y los adaptadores reales sobre dobles.
5. Partir el servicio grande: extraer los métodos **textualmente** a clases (el cuerpo no cambia),
   fachada con la API anterior.
6. Sumar el módulo a `MIGRATED_MODULES` y dejar el spec de arquitectura en verde.

## Trampas (encontradas en el piloto)

- **Los repositorios propios siguen siendo clases de `infrastructure/` que `application/` importa.**
  Hacer de ellos interfaces exige separar el modelo de dominio de la entidad ORM (decisión A3 del
  inventario). El spec la permite explícitamente (`OWN_REPOSITORIES`) y nada más.
- **El `EntityManager` sigue siendo la unidad de trabajo** de los puertos (`UnitOfWork` lo nombra en un
  solo archivo para poder cambiarlo).
- **Renombrar con LanguageService conserva claves viejas**: un `{ x }` abreviado se vuelve
  `{ x: nuevo }` para no cambiar el contrato; revisarlas una a una (y los alias `export { a as b }`).
- **Los mocks `as any` no se renombran**; hay que buscar claves y llamadas `jest.fn` con el nombre
  viejo. Los literales de `describe/it` y los mensajes quedan como están.
- **Un campo y un método con el mismo nombre en la fachada** se pisan (el campo gana): los campos de
  la fachada llevan sufijo `UseCase`.
- **Las excepciones HTTP no van en `domain/`**: `requireReason` se partió en `judgeReason`
  (dominio) y `requireReason` (aplicación) para conservar mensaje y `failureCode`.
- **Un `.spec` que lee archivos** (p. ej. el catálogo de razones) depende de rutas: se rompe al mover.
- **`import type` para puertos** inyectados con `@Inject(TOKEN)` (emitDecoratorMetadata + isolatedModules).
- **Archivos Windows (CRLF/BOM)**: operar por posición, no por regex de línea, para no tocar el resto.

## Qué replicar y qué no

Replicar: capas, puertos con adaptador y token, casos de uso como clases con `execute`, fachada fina,
`*.testing.ts`, spec de capas, dominio puro con veredictos, renombrado por AST.
No replicar: la excepción de los repositorios propios (es deuda, no diseño), las constantes duplicadas por
servicio (se consolidan en `domain/` al migrar) ni la cobertura de dobles `any` sin adaptadores reales.
