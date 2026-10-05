# Revisión transversal: build y dependencias

## 1. Fecha, alcance y cobertura real

- Fecha de observación: 2026-10-05. Rama: `pablo/revision-backend-2026-10-04`; commit: `02af1e09`.
- Alcance: `package.json`, `yarn.lock`, `tsconfig.json`, `tsconfig.build.json`, `eslint.config.mjs`, `nest-cli.json`, referencias versionadas a dependencias y árbol instalado de Yarn 4.14.1. No se modificó código ni configuración.
- Comandos ejecutados desde la raíz del worktree: `corepack yarn typecheck` (**salida 0**, sin diagnósticos); `corepack yarn eslint src --no-cache` (**salida 0**, sin diagnósticos); `corepack yarn npm audit --recursive --json` (**salida 1**, 23 registros); `corepack yarn npm audit --recursive --environment development --json` (**salida 1**, mismos 23 registros); `corepack yarn npm audit --recursive --environment production --json` (**salida 0**, sin registros). Se ejecutaron también `corepack yarn why -R` para los tres paquetes con avisos y `corepack yarn tsc --showConfig -p tsconfig.json`.
- Cobertura de TypeScript: `--showConfig` enumeró **4.946 archivos**: 4.748 en `src/`, 168 en `test/`, 29 en `mock-provider-server/` y uno en `docs/`. ESLint se ejecutó sólo sobre `src/`; su configuración excluye el catálogo ORM generado ([eslint.config.mjs](../../../eslint.config.mjs#L14)) y relaja ciertas reglas en specs ([eslint.config.mjs](../../../eslint.config.mjs#L65)).
- No cubierto: build con emisión, suite de tests, contenedor desplegado, rutas HTTP reales, uso de dependencias fuera del repositorio versionado, análisis del paquete separado `mock-provider-server` (no figura como workspace en `corepack yarn workspaces list`), ni el contenido de seguridad del tarball externo `xlsx` ([package.json](../../../package.json#L204)). La auditoría de Yarn consulta avisos conocidos del registro npm; una salida 0 no prueba ausencia universal de vulnerabilidades.

## 2. Resumen ejecutivo

| Estado | Conteo | Evidencia |
| --- | ---: | --- |
| Typecheck y ESLint sobre `src/` | 2 verdes | Ambos comandos terminaron con código 0 y salida vacía. |
| Hallazgos confirmados, severidad de esta revisión | 1 medio, 2 bajos | BLD-01 a BLD-03. No se confirmó explotación remota ni falla de producción. |
| Avisos de seguridad del registro en dependencias de desarrollo | 19 registros: 16 `high`, 3 `moderate` | `brace-expansion` 8, `fast-uri` 7, `js-yaml` 4. Son registros por versión/advisory, no 19 paquetes distintos. |
| Avisos de deprecación | 4 registros `moderate` | `eslint`, `glob`, `inflight`, `memfs`; la etiqueta de Yarn no los convierte en cuatro CVE. |
| Auditoría del entorno de producción | 0 registros | `corepack yarn npm audit --recursive --environment production --json`, salida 0. |

El hallazgo de seguridad afecta al árbol de herramientas de desarrollo según la clasificación reproducible de Yarn. La posibilidad de que una entrada controlada por un atacante llegue a esas funciones **no está demostrada**; por eso la severidad operativa aquí es **media**, aunque varios avisos externos tengan severidad `high`.

## 3. Mapa de la unidad

No hay endpoints, jobs, entidades, eventos ni catálogo `reason` propios de esta unidad. Su superficie observable es la cadena de compilación y análisis:

| Entrada | Configuración y dependencias relevantes | Salida |
| --- | --- | --- |
| `corepack yarn typecheck` | Script `tsc --noEmit --incremental false -p tsconfig.json` ([package.json](../../../package.json#L75)); `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`, `skipLibCheck: true`, `noFallthroughCasesInSwitch: false` ([tsconfig.json](../../../tsconfig.json#L19)). | Diagnósticos de TypeScript y código de salida. |
| `corepack yarn eslint src --no-cache` | Configuración TypeScript con análisis tipado; catálogo ORM generado ignorado y reglas relajadas en tests ([eslint.config.mjs](../../../eslint.config.mjs#L14)). | Diagnósticos de ESLint y código de salida. |
| `corepack yarn npm audit --recursive` | Resoluciones directas de `brace-expansion` 1.1.17 y 2.1.3 ([package.json](../../../package.json#L11)); árbol completo de `yarn.lock`. | Avisos del registro npm y código de salida. |
| Instalación y build | `packageManager: yarn@4.14.1` ([package.json](../../../package.json#L8)); `tsconfig.build.json` extiende la configuración estricta y fija `rootDir: "."` ([tsconfig.build.json](../../../tsconfig.build.json#L2)). | `dist/src/…` cuando se emite; la emisión no se probó en esta revisión. |

`corepack yarn why -R` trazó `brace-expansion` 1.x a ESLint, Nest CLI, Jest y AsyncAPI; 2.x a Testcontainers; `fast-uri` 3.1.4 a AJV bajo Nest CLI y AsyncAPI; y `js-yaml` 3.15.0/4.3.0 a Jest, ESLint, Nest CLI y AsyncAPI. El `js-yaml` directo y el de Swagger resuelven a 5.4.2; no son las versiones señaladas por esos cuatro avisos.

## 4. Hallazgos verificados y plan de corrección

### BLD-01 — Versiones vulnerables en el árbol de desarrollo — media

**Evidencia.** [package.json:11](../../../package.json#L11) fija `"brace-expansion@npm:^1.1.7": "1.1.17"` y [package.json:12](../../../package.json#L12) fija la serie 2.x en `2.1.3`. El lock confirma ambas ([yarn.lock:5492](../../../yarn.lock#L5492), [yarn.lock:5502](../../../yarn.lock#L5502)); también confirma `fast-uri` 3.1.4 ([yarn.lock:7113](../../../yarn.lock#L7113)) y `js-yaml` 3.15.0/4.3.0 ([yarn.lock:8705](../../../yarn.lock#L8705), [yarn.lock:8717](../../../yarn.lock#L8717)). El registro reportó 19 avisos de seguridad sobre esas versiones. Las fichas [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895), [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr), [GHSA-qw65-cvwx-89v3](https://github.com/advisories/GHSA-qw65-cvwx-89v3) y [GHSA-5p4m-2wfm-xmqj](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj) confirman rangos afectados y mecanismos; hay otros avisos para las mismas versiones.

**Problema e impacto.** Las herramientas instaladas conservan versiones con fallas conocidas de consumo excesivo de CPU/memoria o confusión de URI. El escenario plausible es procesamiento de patrones o documentos no confiables durante tareas de desarrollo/CI; no se identificó una ruta HTTP que las invoque. `corepack yarn npm audit --recursive --environment production --json` devuelve 0, lo que refuta una afirmación de exposición demostrada en el árbol de producción.

**Plan paso a paso.** (1) En una corrección separada, retirar o actualizar las resoluciones 1.x/2.x de `brace-expansion` en `package.json`, manteniendo la serie 5.x ya fijada en 5.0.12; resolver las ramas 1.x a **≥1.1.21** y 2.x a **≥2.1.7**, según el aviso más reciente. (2) Resolver `fast-uri` 3.x a una versión que cierre todos los avisos del registro y `js-yaml` 3.x/4.x a las versiones corregidas para cada aviso, actualizando los padres cuando una resolución directa no sea compatible. (3) Regenerar `yarn.lock` con `corepack yarn install --immutable` sólo después de preparar el cambio de manifiesto/lock y comprobar compatibilidad; correr typecheck, ESLint, build y las pruebas dirigidas de CLI, AsyncAPI y Jest. (4) Repetir auditorías de desarrollo y producción, y revisar manualmente el tarball externo de `xlsx` por separado. Riesgos: diferencias de parser/glob y compatibilidad de dependencias transitivas; no se propone DDL.

**Veredicto adversarial:** confirmado el inventario vulnerable, refutada la lectura de que los 19 registros representen 19 paquetes o una explotación en producción. La severidad operativa queda en media hasta demostrar una entrada explotable.

### BLD-02 — Dos dependencias directas sin referencia versionada observable — baja

**Evidencia.** `source-map-support` y `tsx` están declaradas en [package.json:242](../../../package.json#L242) y [package.json:246](../../../package.json#L246). La búsqueda reproducible `rg -n 'source-map-support|tsx' .github .yarn scripts tools src test eslint.config.mjs nest-cli.json package.json --glob '!yarn.lock' --glob '!*.map'` devolvió sólo esas dos declaraciones. Los scripts del mismo `package.json` tampoco las invocan. `corepack yarn why -R` muestra que existen por declaración directa.

**Problema e impacto.** Mantener declaraciones directas sin uso versionado observable aumenta la superficie de mantenimiento. Quitar la declaración de `source-map-support` no necesariamente sacaría el paquete instalado: `corepack yarn why -R source-map-support` también lo sitúa bajo Terser y Jest. No se ha probado que quitar las declaraciones preserve todos los flujos: puede existir uso manual no documentado. El hallazgo probado es **ausencia de referencia en los artefactos examinados**, no seguridad de eliminación ni ahorro de instalación.

**Plan paso a paso.** (1) Confirmar con responsables si se usan comandos manuales externos al repo. (2) Si no existen, retirar cada declaración por separado en una rama de corrección y regenerar el lock. (3) Ejecutar `corepack yarn install --immutable`, typecheck, ESLint y build, además de los flujos de depuración que el equipo confirme. (4) Si un flujo falla, restaurar la dependencia y documentar su uso en scripts o instrucciones versionadas. Riesgo: dependencia de herramientas locales no registrada; no hay DDL.

**Intento de refutación:** un escaneo textual aislado habría marcado erróneamente `eslint-config-prettier` y `@nestjs/schematics`; se descartaron porque el `recommended.js` instalado de `eslint-plugin-prettier` requiere el primero y [nest-cli.json:3](../../../nest-cli.json#L3) usa el segundo. Los paquetes `@types/*` tampoco se clasificaron como sin uso por su carga implícita por TypeScript.

### BLD-03 — Avisos de deprecación en herramientas — baja

**Evidencia.** La salida de `corepack yarn npm audit --recursive --environment development --json` incluye `eslint@9.39.5`, `glob@7.2.3`, `inflight@1.0.6` y `memfs@3.6.0` con identificadores que terminan en `(deprecation)`. `corepack yarn why -R` sitúa `glob`/`inflight` bajo la cadena de cobertura de Jest y `memfs` bajo Nest CLI; `eslint` es dependencia directa ([package.json:234](../../../package.json#L234)).

**Problema e impacto.** Hay herramientas obsoletas o marcadas por sus mantenedores; pueden requerir mantenimiento adicional. No se demostró que una de esas cuatro entradas sea una vulnerabilidad explotable de esta aplicación. El aviso de `memfs` sólo dice `this will be v4`; se registra como deprecación, sin atribuirle un fallo de seguridad.

**Plan paso a paso.** (1) Revisar compatibilidad y ciclo de soporte de ESLint con la configuración instalada. (2) Trazar qué actualización de Jest/Nest CLI elimina cada cadena transitiva; evitar forzar versiones incompatibles. (3) Aplicar cambios en una rama de corrección y ejecutar instalación inmutable, typecheck, ESLint y pruebas dirigidas de cobertura/build. (4) Registrar los avisos restantes con justificación de impacto y fecha de revisión. No hay DDL.

**Veredicto adversarial:** confirmado como deprecación por el registro, refutada su equiparación automática con los 19 avisos de seguridad.

## 5. Plan de cuatro pruebas por hallazgo

Las filas son **pruebas propuestas**, no ejecutadas. En una unidad de build no existe transporte HTTP ni `DomainException`; por eso «falla catalogada» no tiene `HttpStatus`, `ErrorCode` o `reason` aplicables. El fallo observable es el código de salida y el diagnóstico del CLI, sin inventar un catálogo de negocio.

| Hallazgo | Caso | Tipo y spec propuesto | Preparación y entrada exacta | Resultado esperado |
| --- | --- | --- | --- | --- |
| BLD-01 | Correcto | Integración de dependencias; `test/build/dependency-audit.spec.ts` o gate CI | Lock corregido; `corepack yarn npm audit --recursive --environment development --json`. | Salida 0 y sin advisories sobre `brace-expansion`, `fast-uri`, `js-yaml`. |
| BLD-01 | Límite | Integración de lock; mismo gate | `corepack yarn install --immutable` con padres que aún requieren series 1.x/2.x de `brace-expansion`. | Instalación 0 sin alterar lock y versiones resueltas fuera de todos los rangos afectados. |
| BLD-01 | Error | Prueba negativa de gate; mismo gate | Fixture aislada que fija `brace-expansion@1.1.17`; ejecutar auditoría recursiva. | Salida distinta de 0 y advisory identificable; el gate no oculta la falla. |
| BLD-01 | Falla catalogada | No aplica: comando CLI, sin spec de DomainException | Mismo caso negativo anterior. | Código de salida 1 y registro `GHSA-…`; `HttpStatus`, `ErrorCode` y `reason` de negocio: **no aplican**. |
| BLD-02 | Correcto | Integración de toolchain; `test/build/manifest-usage.spec.ts` | Retirar una candidata en rama aislada; `corepack yarn install --immutable && corepack yarn typecheck`. | Ambos comandos 0; el manifiesto y lock siguen coherentes. |
| BLD-02 | Límite | Integración de CLI; mismo spec | Ejecutar build y flujos manuales confirmados tras quitar `tsx` o `source-map-support`, una por vez. | Los flujos terminan 0 y preservan salida/rutas previstas. |
| BLD-02 | Error | Prueba negativa de manifiesto; mismo spec | Quitar una dependencia realmente requerida por un script en fixture aislada. | La verificación falla con módulo/comando faltante; demuestra que el gate detecta uso real. |
| BLD-02 | Falla catalogada | No aplica: manifiesto/CLI | Fixture negativa anterior. | Código distinto de 0 y diagnóstico reproducible; sin `HttpStatus`, `ErrorCode` ni `reason`. |
| BLD-03 | Correcto | Integración de dependencias; `test/build/deprecation-audit.spec.ts` o gate CI | Actualizar padres; `corepack yarn npm audit --recursive --environment development --json`. | Sin los cuatro avisos de deprecación señalados, o lista aprobada explícita. |
| BLD-03 | Límite | Integración de toolchain; mismo gate | Versiones nuevas con configuración actual; `corepack yarn typecheck` y `corepack yarn eslint src --no-cache`. | Ambos terminan 0 y sin diagnósticos. |
| BLD-03 | Error | Prueba negativa del gate; mismo gate | Fixture aislada que reinstala `glob@7.2.3` por un padre. | Aparece aviso `(deprecation)` y el gate lo informa. |
| BLD-03 | Falla catalogada | No aplica: aviso de paquete, no excepción de dominio | Fixture negativa anterior. | Diagnóstico del registro y salida definida por el gate; sin `HttpStatus`, `ErrorCode` ni `reason`. |

## 6. Matriz de pruebas de la unidad completa

| Superficie | Correcto | Límite | Error | Falla catalogada |
| --- | --- | --- | --- | --- |
| Typecheck (`package.json` script) | Configuración actual: salida 0 **observada**. | Archivo TS fixture con nulabilidad compleja: validar `strictNullChecks`. | Fixture con tipo incompatible: `tsc` debe salir distinto de 0 y señalar archivo/línea. | No aplica: `TSxxxx` y salida del compilador, sin contrato HTTP. |
| ESLint sobre `src/` | Configuración actual: salida 0 **observada**. | Fixture productiva frente a spec: comprobar las reglas diferenciadas. | Fixture con regla violada: ESLint debe salir distinto de 0 y ubicarla. | No aplica: ID de regla y salida del CLI, sin `ErrorCode` de dominio. |
| Audit de dependencias | Producción: salida 0 **observada**. | Desarrollo recursivo: 23 avisos y salida 1 **observados**. | Fixture con versión vulnerable conocida: el gate debe fallar. | No aplica: advisory del registro, sin `reason` de negocio. |
| Uso de dependencias directas | Las candidatas muestran sólo declaración **observada**. | Herramientas de uso implícito (`@types/*`, `eslint-config-prettier`) no se marcan para retiro. | Quitar una dependencia requerida en fixture debe romper build/lint. | No aplica: fallo de instalación o ejecución, sin contrato de errores de la API. |

Esta matriz no afirma haber ejecutado fixtures negativos ni el build. Lo observado se distingue de lo propuesto en cada celda.

## 7. Catálogo de errores

Reasons a crear: **ninguno**. Reasons huérfanos o mal usados: **no evaluados**, porque esta revisión no inspeccionó rutas de negocio. `tsc`, ESLint y Yarn emiten diagnósticos y códigos de proceso; no atraviesan `src/common/errors/domain.exception.ts`. No corresponde inventar `HttpStatus`, `ErrorCode` ni `reason` para sus fallos. Si un script futuro se expone como endpoint o job de aplicación, debe revisarse entonces contra el contrato de errores de esa unidad.

## 8. Olas de ejecución y esfuerzo

| Ola | Hallazgo | Esfuerzo | Dependencia y salida esperada |
| --- | --- | --- | --- |
| 1 | BLD-01 | M | Ajustar resoluciones/padres con el equipo de toolchain; lock inmutable, auditoría de desarrollo sin esos avisos y pruebas de herramientas dirigidas. |
| 2 | BLD-02 | S | Confirmar uso manual antes de retirar declaraciones una por vez; instalación y build verificados. |
| 2 | BLD-03 | M | Coordinar upgrades de ESLint, Jest y Nest CLI; evitar cambios masivos sin compatibilidad comprobada. |

La revisión documental queda escrita, pero las correcciones y sus pruebas propuestas siguen pendientes. No se ha usado un peldaño de verificación de comportamiento de API.

## 9. Trabajo pendiente de integrar y límites de decisión

La tabla de commits pendientes del plan (§2) menciona cambios de módulos, DTOs, seeds y auth/files; ninguno aporta evidencia directa para alterar este inventario de build en el commit revisado. Contrastar de nuevo `package.json` y `yarn.lock` cuando esos cambios lleguen a `dev`, especialmente el checkpoint de auth/files que menciona `package.json`. El plan externo exige `PLAN.md` y `REPORTE.md` generales por `AGENTS.md`; el encargo acotó la escritura a este único informe, por lo que no se crearon esos archivos ni se hizo commit/PR.
