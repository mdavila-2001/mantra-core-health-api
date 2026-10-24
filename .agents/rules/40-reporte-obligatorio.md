# 40 — Reporte obligatorio en el PR; lo que falta, en issues

**Ningún trabajo se cierra sin reporte escrito.** El chat no es entregable: se pierde y nadie lo
lee dos semanas después. El reporte es la **descripción del PR**, y lo que quedó sin hacer es un
**issue** enlazado desde ahí.

## 1. El repo describe lo que existe

El repo es la descripción del sistema tal como es hoy. **No declara pendientes.**

- **Prohibido versionar** planes, reportes de sesión, tableros de estado, secciones «Pendiente»,
  «Próximos pasos», «Falta» o «TODO», ni listas de tareas sin tildar que describan trabajo por
  hacer. Tampoco carpetas como `docs/trabajo/`, `docs/progress/` o `docs/tareas/`, ni archivos
  `PLAN.md`, `REPORTE.md` o `PENDIENTES*.md`.
- **Prohibidos los comentarios `TODO` y `FIXME`** en el código. Una limitación intencional se
  describe en presente, con su porqué: `// No reintenta: el proveedor ya deduplica por clave de
  idempotencia.` El trabajo que falta de verdad es un issue; el comentario puede apuntarlo:
  `// ver #123`.
- Una página de documentación que describe un límite real lo dice en presente («no valida X») y,
  si hay trabajo previsto, enlaza el issue. No lo anuncia como pendiente.
- **Los checklists de procedimiento sí van.** La lista de *Verificación* de la plantilla del PR o
  los pasos de un runbook se tildan cada vez que se usan: son procedimiento, no trabajo pendiente.

## 2. Dónde va cada cosa

| Qué | Dónde |
|---|---|
| El plan | El issue que origina el trabajo o la descripción del PR (regla 20) |
| El reporte y la evidencia | La descripción del PR: **Resumen** y **Verificación** de la plantilla del repo |
| Lo que quedó sin hacer, a medias o bloqueado | Un **issue**, enlazado desde el PR |
| Un bug encontrado de paso, fuera de alcance | Un issue en el repo que corresponde |
| Una decisión que depende de otra persona | Un issue que la nombra y dice qué supuesto se tomó mientras tanto |
| Un hallazgo de seguridad | Un issue con la etiqueta `seguridad` |

El issue se abre **en el repo donde vive el cambio** (API, front, modelo de datos o vault de
documentación); el `AGENTS.md` del proyecto lista cuáles son. Un cambio que cruza repos tiene un
issue por repo, enlazados entre sí (ver `github-issues-projects`).

## 3. Cuándo se escribe

- Al cerrar el trabajo. Siempre.
- Al cerrar la sesión aunque el trabajo **no** esté terminado — ese es el caso más importante:
  el PR (en borrador si hace falta) y los issues son lo que permite retomarlo sin arqueología.
- Al entregar el control por un bloqueo externo: el bloqueo es un issue.

No existe "lo reporto cuando termine". Si la sesión termina, el reporte se escribe.

## 4. Qué lleva la descripción del PR

### Completado
Solo entra lo que tiene **CA cumplido y DoD demostrado con salida literal**:

| ID | Qué se logró (observable) | Comando de verificación | Resultado |
|---|---|---|---|
| H1.S1.M1 | … | `<comando>` | PASS + salida recortada |

Si no podés pegar la salida, **no va en Completado**. Va en A medias.

### A medias
La sección que más importa y la que se suele falsear. Cada ítem se nombra en el PR y **tiene su
issue**, con las cuatro respuestas:

1. **Qué anda** — la parte que sí funciona, demostrada.
2. **Qué no anda** — el comportamiento concreto que falta o falla.
3. **Qué falta exactamente** — los pasos que restan, no "terminarlo".
4. **Dónde quedó** — archivos tocados, rama, y si el código quedó en un estado que compila o no.

> Ejemplo aceptable: "El endpoint devuelve 409 ante solapamiento y el test unitario pasa.
> La UI todavía muestra el error genérico en vez del mensaje de conflicto; falta mapear el código
> `APPOINTMENT_OVERLAP` en el interceptor de errores del front. Quedó en `feature/agenda-conflictos`,
> compila, E2E `reserva-conflicto` en rojo por esto."

> Ejemplo prohibido: "H2 — casi listo, falta pulir."

### Issues abiertos
Lo que no se empezó, lo bloqueado y lo descartado no se lista como «pendiente»: cada cosa que
alguien tiene que retomar es un issue, y el PR los enlaza. En los bloqueados, el issue dice qué
los destraba y de quién depende. Lo `DESCARTADO` se declara en el PR con su razón y quién lo
decidió.

### Además
- **Evidencia** — comandos con su salida literal recortada, nunca parafraseada.
- **No cubierto** — lo que quedó **fuera de verificación** aunque el código esté escrito: lo que
  se hizo pero no se probó, y los caminos que no se ejercitaron. Es distinto de lo que no se hizo.
- **Desvíos del plan** — todo lo que se ejecutó distinto de lo planificado, con el porqué.
- **Riesgos residuales** — lo que queda frágil, con su impacto. Si hay que actuar, es un issue.
- **Decisiones y ambigüedades** — qué se decidió sin confirmación y qué supuesto se tomó. Lo que
  hay que confirmar con alguien, en un issue.

Una sección sin contenido se escribe con "ninguno": borrarla hace que se lea como que no se revisó.

## 5. Plantilla

Sobre la plantilla del repo (`.github/PULL_REQUEST_TEMPLATE.md`), sin reemplazarla:

~~~markdown
## Resumen
<qué cambia y por qué>
Peldaño de evidencia alcanzado: <ver regla 30> · Avance: <HECHO> / <total> (<%> calculado)
Issues abiertos por este trabajo: #<n> (a medias: <qué>), #<m> (bloqueado: <por qué>) | ninguno

## Verificación
<checklist de la plantilla, tildado según lo que se corrió>

```text
<comando>
<salida literal recortada>
```

No cubierto: … · Desvíos del plan: … · Riesgos residuales: … · Decisiones y ambigüedades: …
~~~

## 6. Reglas de honestidad

1. **El porcentaje se calcula**, no se estima: `microtareas HECHO / total`. Nada de "80% listo".
2. **Prohibido el resumen optimista** cuando hay algo en rojo. Si QA falla, el PR lo dice
   en la primera línea, no en un párrafo al final.
3. **Prohibido omitir una microtarea** que no se hizo. Se declara en el PR como `A MEDIAS`,
   `BLOQUEADO` o `DESCARTADO`, y lo que hay que retomar tiene su issue.
4. **El reporte no usa palabras más fuertes que la evidencia** (regla 30). Si el peldaño es
   `WRITTEN`, el PR no dice "funciona".
5. **Sin datos sensibles.** Ninguna salida pegada en un PR o un issue puede contener datos reales
   de pacientes, secretos ni tokens. Si la salida los tenía, se enmascara y se aclara que se
   enmascaró.
6. **Escrito para alguien que no vio la sesión.** Sin referencias a "lo que hablamos antes".

## 7. Prohibiciones

- Cerrar sin reporte en el PR.
- Reportar solo en el chat.
- Versionar un plan, un reporte, una sección de pendientes o un `TODO`/`FIXME`.
- Dejar algo a medias, bloqueado o encontrado de paso sin su issue.
- Un ítem en A medias sin las cuatro respuestas.
- Declarar Completado sin salida literal del DoD.
- Reescribir la descripción del PR para que quede más linda eliminando lo que salió mal.

## 8. Jerarquía entre reportes

| Reporte | Alcance | Relación |
|---|---|---|
| Descripción del PR (esta regla) | El trabajo completo | **Raíz.** Sin ella no se cierra. |
| Reporte de evidencia de QA | Solo la campaña de pruebas | Comentario o adjunto del PR, **enlazado** desde la descripción. Ver `qa-evidence-reporting`. |
| Reporte de seguridad / accesibilidad / visual | Solo ese gate | Sección de la descripción o comentario del PR; los hallazgos, a issues. |
| Resumen en el chat | Comunicación del momento | **No es un reporte.** No sustituye a la descripción del PR. |

Si un reporte anidado tiene su propia sección "No cubierto", la descripción del PR **consolida**:
lo que quedó sin cubrir en QA queda sin cubrir en el trabajo, y tiene que aparecer arriba. Está
prohibido que una limitación quede enterrada en un reporte anidado y no suba a la raíz.

El cierre de turno (`finish-your-turn`) exige además un resumen honesto en la respuesta. Ese
resumen es **adicional** al PR, no alternativo: un turno que solo reporta en el chat incumple
esta regla.

## 9. Relación con las skills

El oficio de redactarlo está en `work-report-md` y `qa-evidence-reporting`; el de abrir y
etiquetar los issues, en `github-issues-projects`.
Esta regla fija la **obligación**; las skills enseñan el **cómo**.
Relacionadas: `evidence-and-verification`, `progress-reporting`, `finish-your-turn`,
`github-pull-requests`.
