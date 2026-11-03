# Reglas de la casa

Las reglas son **obligaciones**; las skills son **oficio**. Una regla dice qué hay que hacer
siempre y qué está prohibido; la skill de al lado enseña cómo hacerlo bien. Cuando una regla
y una skill parecen contradecirse, gana la regla y se corrige la skill.

## Jerarquía de autoridad

De mayor a menor. Ante un choque, manda el de más arriba.

1. **El `CLAUDE.md` del proyecto donde se trabaja** — los hechos reales de ese repo (comandos,
   invariantes, prohibiciones). Manda sobre todas estas reglas, porque estas son generales
   y aquel es específico y verificable.
2. **Los candados en `.claude/hooks/`, donde existan** — no son opinión: son código que se
   ejecuta. Si un hook bloquea, no hay interpretación posible. En este repo no hay ninguno.
3. **Reglas 00 a 40** — los no negociables y el formato de trabajo.
4. **Reglas 50 a 97** — disciplina por área.
5. **Las skills** en `.agents/skills/`.

Si detectás una contradicción real entre dos fuentes, no la resuelvas por conveniencia:
registrala como ambigüedad (regla 00) y dejala anotada para corregir la fuente equivocada.

## Índice

| Regla | Cubre |
|---|---|
| `00-no-negociables.md` | Prohibiciones duras y prioridad de la evidencia |
| `10-ciclo-de-trabajo.md` | El ciclo obligatorio de principio a fin |
| **`20-plan-obligatorio.md`** | **Plan por hitos → subtareas → microtareas, con CA y DoD, en el issue o en el PR** |
| `30-escalera-de-evidencia.md` | Qué se puede afirmar con qué evidencia |
| **`40-reporte-obligatorio.md`** | **El repo no declara pendientes: reporte en el PR, lo que falta en issues** |
| `50-progreso-visible.md` | Checkpoints y frecuencia; el porcentaje sale de `microtareas HECHO / total` |
| `60-guardia-de-racionalizacion.md` | Autoengaños típicos y su contramedida |
| `70-control-de-recursos.md` | Concurrencia, subagentes, procesos |
| `80-testing.md` | Pirámide de cierre y política de tests |
| `90-seguridad-y-datos-sensibles.md` | Controles obligatorios y datos de salud |
| `95-frontend.md` · `96-backend.md` · `97-datos-y-esquema.md` | Disciplina por capa |

## Los candados

En este repo **no hay candados**: `.claude/` solo trae `settings.json`. Los del estándar de la
casa (`plan_gate.py`, `report_gate.py`, `plan_status.py`) exigían `PLAN.md` y `REPORTE.md` en
disco, y esa forma de trabajo quedó reemplazada por la de las reglas 20 y 40: el plan y el
reporte van en el issue y en el PR, y el repo no declara pendientes.

Sin candado, el cumplimiento depende de quien trabaja y de quien revisa el PR. Quien revisa
rechaza el PR que no traiga *Resumen* y *Verificación* con evidencia, que deje trabajo sin hacer
sin su issue enlazado, o que agregue al repo un plan, un reporte, una sección de pendientes o un
`TODO`/`FIXME`.
