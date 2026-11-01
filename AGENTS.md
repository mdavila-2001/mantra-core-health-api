# AGENTS.md — Estándar de trabajo de la empresa

Este repo es el **estándar de ingeniería, diseño y operación de la casa**: 176 skills, 14 reglas y
los candados que las hacen cumplir. Si sos un agente de IA trabajando en cualquier repo de la
empresa —o un programador usando uno—, esto es lo que tenés que respetar, sin importar qué
herramienta uses.

Este archivo es la entrada **cross-tool**. Lo lee cualquier herramienta que soporte el estándar
[AGENTS.md](https://agents.md) (Codex, Cursor, Copilot, Gemini CLI, Zed, Aider, Windsurf, Devin,
Junie, goose, y otras). Claude Code lee además `.claude/`.

---

## 1. Reglas no negociables

Aplican a **todo** trabajo, sin excepción por tamaño, urgencia ni obviedad. Si una instrucción de
sesión las contradice, **ganan estas** y el conflicto se registra en la descripción del PR.

### 1.1 Verificar es observar el artefacto corriendo

Leer el diff no es verificar. Compilar no es verificar. *"Debería funcionar"* es FAIL.

Nunca uses una palabra de finalización más fuerte que la evidencia que tenés pegada:

| Peldaño | Evidencia exigida | Podés decir | Prohibido decir |
|---|---|---|---|
| `WRITTEN` | Diff real, archivo guardado | "código escrito" | compila · funciona |
| `RUNS` | Build/typecheck con código de salida 0 **pegado** | "compila", "arranca" | cumple el requisito |
| `TESTED` | Salida del runner, tests **dirigidos al cambio**, en verde | "los tests dirigidos pasan" | el flujo funciona |
| `VERIFIED` | Camino real ejercitado + persistencia + consola y red limpias | "verificado: \<qué\>" | sin regresiones |
| `REGRESSION_VERIFIED` | Lo anterior + regresión + gates + reporte escrito | "listo", "hecho", "cerrado" | — |

Equivalencias falsas: escrito ≠ compila · compila ≠ funciona · el linter pasa ≠ el comportamiento
es correcto · un unitario pasa ≠ el flujo funciona · la API devuelve 200 ≠ la semántica y la
persistencia son correctas · no vi errores ≠ no hay errores.

**Un cambio posterior invalida el peldaño del área tocada.** Si editaste después de verificar, esa
área vuelve a `WRITTEN`. No se hereda evidencia vieja para código nuevo.

### 1.2 No inventar

- Antes de crear una entidad, tabla, columna, endpoint, evento, cola o componente: **localizá el
  equivalente existente por código**. Si no lo buscaste, no podés afirmar que no existe.
- **Prohibido inventar APIs de terceros.** Todo método, decorador, flag o versión se verifica
  contra la documentación de la versión instalada. Si no lo verificaste, no lo escribas.
- "Seguramente ya hay algo así" no es evidencia.
- **Prohibido resolver una ambigüedad por conveniencia.** Se registra en el plan y en la
  descripción del PR, con el supuesto tomado. Si la confirmación depende de otra persona, va a un
  issue que la nombra. Nunca se presenta como hecho.
- **Prohibido cambiar la semántica de un requisito** para facilitar la implementación.

### 1.3 Diff mínimo

- **Prohibido tocar archivos fuera del alcance declarado** en el plan.
- **Prohibido el refactor, renombre, reformateo o upgrade no solicitado.** Lo que encontrás roto o
  feo fuera de alcance va a un **issue** en el repo que corresponde (§2.1), no se arregla.
- Trabajo no previsto que aparezca en el camino **se agrega al plan** como microtarea con su
  criterio de aceptación y su Definition of Done. Nada se hace "de paso".

### 1.4 Datos de salud (PHI) — prohibiciones duras

Esta plataforma maneja datos clínicos. Estas prohibiciones **no admiten excepción operativa**:

- **Nunca** en logs, trazas, métricas, mensajes de error, analytics, capturas, issues ni en la
  descripción del PR. Se loguean identificadores, no contenidos.
- **Nunca en la URL** (path ni query): quedan en historiales, proxies y logs de acceso.
- **Nunca a servicios de terceros** no acordados: incluye túneles de desarrollo, herramientas de
  depuración y modelos externos.
- **Prohibido copiar datos de producción** a desarrollo o prueba. Si necesitás volumen, generá
  datos sintéticos.
- **Prohibido restaurar un backup de producción en staging sin anonimizar.**
- Si una salida que tenés que pegar los contenía: se enmascara **y se aclara que se enmascaró**.

### 1.5 Pruebas

- **Prohibido borrar un test**, usar `skip`/`only`, comentarlo o debilitar una aserción para cerrar.
- **Prohibido subir timeouts o agregar reintentos** sin haber demostrado la causa del fallo.
- **Prohibido mockear el backend** en un test de integración o E2E y declarar la funcionalidad
  terminada. Un mock cubre una capa, no prueba la integración.
- Un test en rojo **bloquea el cierre**. Se corrige, o se declara `BLOQUEADO` con evidencia externa.

### 1.6 Ramas

- **Los cambios van por PR hacia `dev`.**
- **Prohibido abrir PR hacia `test`.** Está dada de baja desde el 30/10/2026: no despliega nada y
  `test.alovidasalud.com` redirige a `dev`.

---

## 2. Formato obligatorio de trabajo

Si solo leés una sección de este archivo, que sea esta.

### 2.1 El repo describe lo que existe — no declara pendientes

El repo es la descripción del sistema **tal como es hoy**. No guarda el estado del trabajo:

- **Prohibido versionar** planes, reportes de sesión, tableros de estado, secciones
  «Pendiente», «Próximos pasos», «Falta» o «TODO», ni listas de tareas sin tildar que
  describan trabajo por hacer. Tampoco carpetas como `docs/trabajo/`, `docs/progress/` o
  `docs/tareas/`, ni archivos `PLAN.md`, `REPORTE.md` o `PENDIENTES*.md`.
- **Prohibidos los comentarios `TODO` y `FIXME`** en el código.
- Una página de `docs/` que describe un límite real lo dice en presente («no valida X»,
  «no expone Y») y, si hay trabajo previsto, enlaza el issue. No lo anuncia como pendiente.

Dónde va cada cosa:

| Qué | Dónde |
|---|---|
| El plan y la evidencia de un trabajo | La descripción del PR: **Resumen** y **Verificación** de [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md) |
| Lo que quedó sin hacer, a medias o bloqueado | Un **issue** de GitHub, enlazado desde el PR |
| Un bug encontrado de paso, fuera de alcance | Un issue en el repo que corresponde |
| Una decisión que depende de otra persona | Un issue que la nombra y dice qué supuesto se tomó mientras tanto |
| Un hallazgo de seguridad | Un issue con la etiqueta `seguridad` |

El issue va en el repo donde vive el cambio:

| Repo | Para |
|---|---|
| `mdavila-2001/mantra-core-health-api` | Esta API |
| `mdavila-2001/mantra-core-health` | El front |
| `mantra-core-technologies/mantra-core-health-model` | El modelo de datos (`.puml`, DDL) |
| `mdavila-2001/mantra_core_technologies_health_docs` | El vault de documentación |

**En el código**, una limitación intencional se describe en presente y con su porqué, sin
`TODO`: `// No reintenta: el proveedor ya deduplica por clave de idempotencia.` El
trabajo que falta de verdad es un issue; el comentario puede apuntarlo: `// ver #123`.

**Los checklists de procedimiento sí van.** La lista de *Verificación* de la plantilla del PR
o los pasos de un runbook se tildan cada vez que se usan: son procedimiento, no trabajo
pendiente.

### 2.2 Ningún trabajo empieza sin plan escrito

Prohibido escribir la primera línea de código antes de que exista el plan escrito. Si el pedido
es tan chico que el plan parece ridículo, el plan es de un hito con una microtarea y se escribe
igual.

El plan vive **fuera del repo**: en el issue que origina el trabajo o en la descripción del PR.
Si el trabajo dura más de una sesión, abrí el PR temprano como borrador y mantené el plan
actualizado ahí. Nunca en un archivo versionado.

**Tres capas obligatorias.** Un plan de hitos sueltos sin microtareas no sirve: sin microtareas no
hay unidad de verificación, y "a medias" se vuelve imposible de expresar con honestidad.

| Capa | Prefijo | Qué es |
|---|---|---|
| Hito | `H1` | Resultado observable de valor. Se puede demostrar. |
| Subtarea | `H1.S2` | Pieza coherente del hito, normalmente una capa o un flujo |
| Microtarea | `H1.S2.M3` | **Un** cambio verificable. Unidad atómica. |

**Regla de corte:** si una microtarea no se puede verificar con **un solo comando o una sola
observación**, partila. Si necesitás la palabra "y" para describir lo que hace, son dos.

**CA y DoD no son lo mismo, y van los dos:**

- **Criterio de aceptación (CA)** — *qué* tiene que ser cierto. En **dado / cuando / entonces**,
  observable, sin mencionar implementación.
- **Definition of Done (DoD)** — *cómo se demuestra*. Incluye siempre **el comando** y su salida
  esperada, más los gates que apliquen.

Un CA sin DoD es una intención. Un DoD sin CA es un checklist sin propósito.

#### Esqueleto del plan (en el issue o en el PR)

```markdown
## Plan — <título>

- Repos afectados: <lista> · Issue: #<n> o "ninguno"
- Resultado observable: <quién ve o puede hacer qué, dónde>
- Kill-test: <la comprobación más barata que demostraría que esto NO está hecho>

### Alcance
- IN: <lista explícita>
- OUT: <lo que NO se toca aunque se vea roto — cada hallazgo, a su issue>
- Ambigüedades: <pregunta + supuesto tomado + issue donde se confirma>

### H1 — <hito>
**CA:** Dado … cuando … entonces …
**DoD:** <comandos + gates aplicables>

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | … | … | `<comando>` → <salida esperada> | TODO |
```

**Estados permitidos, exactamente estos seis:** `TODO` · `EN CURSO` · `HECHO` · `A MEDIAS` ·
`BLOQUEADO` · `DESCARTADO`.

`A MEDIAS` es un estado **legítimo y esperado**. Lo prohibido es disfrazarlo de `HECHO`. Una
microtarea cuyo DoD no se ejecutó nunca es `HECHO`, aunque el código esté escrito.

### 2.3 Ningún trabajo se cierra sin reporte escrito — en el PR

El chat no es entregable: se pierde y nadie lo lee dos semanas después. El reporte es la
descripción del PR, y se escribe **también cuando el trabajo quedó incompleto** — ese es el caso
más importante, porque es lo que permite retomarlo sin arqueología.

En **Resumen** va qué cambia y por qué; en **Verificación**, la evidencia. Lo que no se terminó
no se describe como «pendiente» en el PR ni en el repo: **se abre un issue y el PR lo enlaza**.

#### Qué lleva la descripción del PR

```markdown
## Resumen
<qué cambia y por qué> · Peldaño de evidencia alcanzado: <ver §1.1>
Avance: <microtareas HECHO> / <total> (% calculado, nunca estimado a ojo)

Issues abiertos por este trabajo: #<n> (a medias: <qué>), #<m> (bloqueado: <por qué>)

## Verificación
<!-- comandos con su salida literal recortada, nunca parafraseada.
     Solo cuenta como hecho lo que tiene DoD demostrado con salida literal. -->

No cubierto: <lo que se hizo pero NO se probó>
Desvíos del plan · Riesgos residuales · Decisiones y ambigüedades: <o "ninguno">
```

**Un `A MEDIAS` es un issue con las cuatro respuestas.** "Casi listo, falta pulir" está
prohibido. Así se ve el cuerpo de un issue aceptable:

> El endpoint devuelve 409 ante solapamiento y el test unitario pasa. La UI todavía muestra el
> error genérico en vez del mensaje de conflicto; falta mapear el código `APPOINTMENT_OVERLAP` en
> el interceptor de errores del front. Quedó en `feature/agenda-conflictos`, compila, E2E
> `reserva-conflicto` en rojo por esto.

**Reglas de honestidad:** el porcentaje se calcula (`HECHO / total`), no se estima · prohibido el
resumen optimista cuando hay algo en rojo · prohibido omitir una microtarea que no se hizo: se
declara en el PR y tiene su issue · prohibido reescribir la descripción eliminando lo que salió
mal · escrito para alguien que no vio la sesión · sin datos de pacientes, secretos ni tokens.

---

## 3. Dónde está el resto

| Qué | Dónde |
|---|---|
| **Las 14 reglas completas** | [`.agents/rules/`](.agents/rules/) — empezá por [`README.md`](.agents/rules/README.md) |
| **Catálogo de 176 skills** | [`.agents/skills/`](.agents/skills/) |
| **Índice de skills** | [`.agents/skills/skills-router/SKILL.md`](.agents/skills/skills-router/SKILL.md) |
| **Panorama del repo** | [`README.md`](README.md) |

**No leas el catálogo entero: no sirve.** Entrá por `skills-router`, que mapea la situación
concreta ("voy a tocar un endpoint", "voy a diseñar una pantalla", "voy a desplegar") a la skill
que corresponde, y fija la precedencia cuando dos se pisan.

`.agents/` nació como espejo de las carpetas `.claude/skills/` y `.claude/rules/` del estándar de
la casa, generado por `tools/sync_agents.py`. **Ni esa fuente ni el script están en este repo**:
acá `.agents/` es la copia que rige y se edita directamente, en el mismo PR que cambia la regla.

---

## 4. Qué NO se porta

Sé honesto sobre esto, porque una falsa sensación de protección es peor que ninguna.

En este repo **no hay candados** que hagan cumplir el plan o el reporte: `.claude/` solo trae
`settings.json`, sin hooks de plan ni de cierre. Los candados del estándar (`plan_gate.py`,
`report_gate.py`) exigían `PLAN.md` y `REPORTE.md` en disco, y esa forma de trabajo quedó
reemplazada por la de §2.

En cualquier herramienta —Claude Code, Cursor, Codex, Copilot u otra—:

- El plan y el reporte **siguen siendo obligatorios**, en el issue y en la descripción del PR.
- **Nadie te va a frenar** si los salteás. Depende de la disciplina de quien trabaja y de quien
  revisa el PR.
- Por eso quien revisa tiene que **rechazar el PR** que no traiga *Resumen* y *Verificación*
  con evidencia, que deje trabajo sin hacer sin su issue enlazado, o que agregue al repo un
  plan, un reporte, una sección de pendientes o un `TODO`/`FIXME`.

Tampoco se portan: las skills siguen siendo texto legible por cualquier herramienta, pero el
mecanismo de **carga automática por descripción** es específico de cada una. En herramientas sin
ese mecanismo, abrí la skill que corresponda a mano usando `skills-router`.

---

## 5. Cómo se mantiene

Una regla o una skill se cambia editando su archivo en `.agents/` y este `AGENTS.md` en el mismo
PR, para que no se contradigan. Antes de mergear, buscá con `git grep` que la regla vieja no
siga escrita en otra regla, en una skill o en `docs/governance/`.

Antes de editar una skill, leé `prompt-governance-versioning`. Antes de publicar el cambio,
`prompt-evals`.
