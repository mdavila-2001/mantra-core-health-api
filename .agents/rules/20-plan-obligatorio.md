# 20 — Plan obligatorio por hitos, subtareas y microtareas

**Ningún trabajo empieza sin plan escrito.** No hay excepción por tamaño, urgencia ni
obviedad. Si el pedido es tan chico que el plan parece ridículo, el plan es de un hito con una
microtarea y se escribe igual: cuesta treinta segundos y es lo que hace auditable el trabajo.

Prohibido escribir el primer `Edit`/`Write` de código antes de que exista el plan escrito.

## 1. Dónde vive

**Fuera del repo.** El repo describe lo que existe; el plan es estado del trabajo y no se versiona.

| Qué | Dónde |
|---|---|
| El plan | En el **issue** que origina el trabajo o en la **descripción del PR**. Si el trabajo dura más de una sesión, el plan vive en el issue de origen. Los PR nunca se abren en borrador: se abren listos y mergeables. |
| El reporte | En la descripción del PR (ver regla 40) |
| La evidencia | Salida literal en la *Verificación* del PR; capturas y traces adjuntos al PR o al issue |

Lo que no es negociable es que **el plan y el reporte queden escritos donde el equipo los lee**,
no solo en el chat. Prohibido crear `docs/trabajo/`, `PLAN.md`, `REPORTE.md` o cualquier otro
archivo de plan o de estado en el repo.

> [!important] Si el trabajo es un carril
> Un carril que cruza repos se documenta en su **issue padre** y sus sub-issues (ver
> `lane-authoring` y `github-issues-projects`). El plan vive ahí y no se duplica en otro lado. Lo
> que esta regla exige en ese caso es que el plan del carril **cumpla igual** las tres capas (§2),
> los CA y DoD (§3) y los estados (§5). Un plan de implementación sin microtareas verificables no
> satisface esta regla por más que se llame plan.

## 2. Las tres capas

| Capa | Prefijo | Qué es | Tamaño | Criterio de aceptación | DoD |
|---|---|---|---|---|---|
| **Hito** | `H1` | Resultado observable de valor para alguien. Se puede demostrar. | Se cierra en una o varias sesiones | Obligatorio, en términos de usuario | Obligatorio |
| **Subtarea** | `H1.S2` | Pieza coherente del hito, normalmente una capa o un flujo | 1–4 horas de trabajo | Obligatorio, verificable | Obligatorio |
| **Microtarea** | `H1.S2.M3` | **Un** cambio verificable. Unidad atómica de ejecución. | ≤ 1 cambio con una verificación | Obligatorio, binario | Obligatorio, con comando |

**Regla de descomposición:** si una microtarea no se puede verificar con **un solo comando o una
sola observación**, no es una microtarea: partila. Si necesitás la palabra "y" para describir lo
que hace, son dos.

**Regla de profundidad:** las tres capas son obligatorias. No se permite un plan de hitos sueltos
sin microtareas, porque sin microtareas no hay unidad de verificación y el estado "a medias" se
vuelve imposible de expresar con honestidad.

## 3. Criterio de aceptación vs Definition of Done

No son lo mismo y hay que escribir los dos. Confundirlos es el error más común.

- **Criterio de aceptación (CA)** — *qué* tiene que ser cierto para el usuario o el sistema.
  Se escribe en **dado / cuando / entonces**, es observable y no menciona implementación.
  > CA: Dado un profesional con agenda ocupada de 10:00 a 10:30, cuando un paciente intenta
  > reservar 10:15, entonces la API responde 409 y la UI muestra el conflicto sin perder el formulario.

- **Definition of Done (DoD)** — *cómo se demuestra*, y qué más tiene que estar en verde.
  Incluye siempre el **comando de verificación** y su salida esperada.
  > DoD: `yarn test appointments` en verde (pegar salida) · E2E `reserva-conflicto` PASS con trace ·
  > migración/patch aplicado · sin PHI en el log del 409 · revisado contra `security-guardrails`.

Un CA sin DoD es una intención. Un DoD sin CA es un checklist sin propósito. Faltando cualquiera
de los dos, la microtarea **no está lista para ejecutarse**.

## 4. Formato del plan

```markdown
## Plan — <título>

- Repos afectados: <lista> · Issue: #<n> o "ninguno" · Predecesor: <trabajo previo o "ninguno">
- Resultado observable: <una frase: quién ve o puede hacer qué, dónde>
- Kill-test: <la comprobación más barata que demostraría que esto NO está hecho>

## Alcance
- IN: <lista explícita>
- OUT: <lista explícita — lo que NO se toca aunque se vea roto>
- Ambigüedades registradas: <pregunta abierta + supuesto que se tomó + issue donde se confirma>

## H1 — <nombre del hito>
**CA:** Dado … cuando … entonces …
**DoD:** <comandos + gates aplicables>
**Estado:** TODO

### H1.S1 — <nombre de la subtarea>
**CA:** …
**DoD:** …
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | … | … | `<comando>` → <salida esperada> | TODO |
| H1.S1.M2 | … | … | `<comando>` → <salida esperada> | TODO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
```

## 5. Estados permitidos

Exactamente estos seis. No se inventan otros, no se usan porcentajes inventados.

| Estado | Significa | Exige |
|---|---|---|
| `TODO` | No se empezó | — |
| `EN CURSO` | Se empezó, no terminó | Qué falta concretamente |
| `HECHO` | CA cumplido **y** DoD demostrado | Salida literal del comando del DoD |
| `A MEDIAS` | Parte funciona, parte no | **Qué anda, qué no anda, y qué falta exactamente** |
| `BLOQUEADO` | No se puede avanzar | Qué bloquea, qué se intentó, qué lo destraba, de quién depende |
| `DESCARTADO` | Se decidió no hacerlo | Por qué y quién lo decidió |

`A MEDIAS` es un estado **legítimo y esperado**. Lo que está prohibido es disfrazarlo de `HECHO`.
Una microtarea cuyo DoD no se ejecutó nunca es `HECHO`, aunque el código esté escrito.

## 6. Reglas de ejecución

1. **Una microtarea a la vez.** No se abren dos en `EN CURSO` simultáneamente.
2. **El plan se actualiza en el momento**, no al final. El plan del issue o del PR es la verdad del estado.
3. **Cerrar una microtarea exige ejecutar su DoD** y pegar la salida en la *Verificación* del PR. Sin eso, `A MEDIAS`.
4. **Una subtarea es `HECHO`** solo si todas sus microtareas son `HECHO` o `DESCARTADO` con razón.
5. **Un hito es `HECHO`** solo si además pasan los gates aplicables (regla 30 y regla 80).
6. **Descubrimiento a mitad de camino:** si aparece trabajo no previsto, se **agrega al plan** como
   microtarea nueva con su CA y DoD. No se hace "de paso" sin registrarlo (ver regla de alcance).
7. **Si el plan resulta equivocado**, se corrige el plan explícitamente y se deja constancia del
   cambio. Lo prohibido es ejecutar algo distinto de lo planificado sin tocar el plan.

## 7. Prohibiciones

- Empezar a codear sin el plan escrito en el issue o en el PR.
- Versionar el plan, su estado o lo que quedó sin hacer en un archivo del repo.
- Planes de un solo nivel ("hacer el endpoint") sin descomposición en microtareas.
- Microtareas sin comando de verificación en el DoD.
- Marcar `HECHO` sin haber corrido el DoD.
- Usar porcentajes de avance que no salgan de `microtareas HECHO / total`.
- Borrar del plan una microtarea que no se hizo, en lugar de marcarla `A MEDIAS`, `BLOQUEADO` o `DESCARTADO`.
- Cerrar la sesión con microtareas en `EN CURSO` sin pasarlas a `A MEDIAS` con el detalle de qué falta.

## 8. Relación con las skills

El detalle operativo de cómo descomponer, cómo redactar CA y cómo elegir el DoD está en la skill
`milestone-planning`. Esta regla fija la **obligación**; la skill enseña el **oficio**.
Skills relacionadas: `requirements-and-acceptance`, `vertical-slicing`, `outcome-first`,
`evidence-and-verification`, `scope-discipline`.
