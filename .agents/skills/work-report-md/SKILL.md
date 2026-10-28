---
name: work-report-md
description: Cómo se escribe el reporte que cierra un trabajo en la descripción del PR — qué gana el derecho a entrar en COMPLETADO, cómo convertir lo que quedó A MEDIAS o sin hacer en issues con sus cuatro respuestas obligatorias (qué anda, qué no anda, qué falta exactamente, dónde quedó), cómo pegar evidencia recortada sin parafrasear y enmascarando datos sensibles, y por qué "No cubierto" no es lo mismo que "no se hizo". Usar al cerrar cualquier trabajo, al terminar una sesión con algo incompleto, o al retomar trabajo ajeno.
effort: high
---

# Reporte de trabajo en el PR

La regla `40-reporte-obligatorio` fija que **ningún trabajo se cierra sin reporte**, y que ese
reporte va en la **descripción del PR** (secciones *Resumen* y *Verificación* de la plantilla del
repo). Lo que quedó sin terminar no se anota como «pendiente» ni en el PR ni en el repo: es un
**issue**, y el PR lo enlaza. El repo describe lo que existe; nunca guarda el estado del trabajo.

Esta skill enseña a escribirlo para lo único que importa: que alguien que no estuvo pueda retomar
el trabajo sin preguntarte nada. No es un resumen de lo que hiciste, es el **estado verificado del
sistema** más los issues exactos de lo que quedó sin terminar.

## Cuándo aplica

- Al cerrar el trabajo.
- Al cerrar la sesión aunque falte mucho — el caso más importante y el que más se saltea.
- Al devolver el control por un bloqueo externo.

La evidencia específica de QA (casos, veredictos, capturas por viewport) se redacta con
`qa-evidence-reporting` y se referencia desde acá. Los checkpoints **durante** el trabajo son
`progress-reporting`; esto es el artefacto **al cerrar**.

## 1. La barra de entrada de cada sección

Ubicá cada microtarea del plan en una sola sección. La pregunta que decide es siempre la misma:
**¿corriste el DoD y tenés la salida?**

| Situación | Sección |
|---|---|
| DoD ejecutado, salida pegada, CA cumplido | COMPLETADO |
| Código escrito sin correr el DoD, DoD en rojo, o parte anda y parte no | A MEDIAS |
| No se empezó o está trabado por algo externo | ISSUES ABIERTOS (`TODO` / `BLOQUEADO`): un issue por cosa |
| Se decidió no hacerlo | `DESCARTADO`, declarado en el PR con su razón y quién lo decidió |

"Está escrito pero no lo probé" **nunca** es COMPLETADO. Es la trampa más común y la que destruye
la confianza en el reporte entero: basta un ítem falso para que nadie crea en los otros.

## 2. COMPLETADO

Una fila por microtarea, con el comando y su resultado. Si no podés pegar la salida, no va acá.

```markdown
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | La base rechaza turnos solapados del mismo profesional | inserción solapada manual | PASS — salida abajo, en *Verificación* |
| H1.S2.M1 | El conflicto devuelve 409 `APPOINTMENT_OVERLAP` | test de API del conflicto | PASS — `Tests: 4 passed, 4 total` |
```

Escribí el "qué se logró" en términos **observables**: "la base rechaza turnos solapados", no
"agregué el constraint".

## 3. A MEDIAS: un issue con las cuatro respuestas

La sección que más importa. En el PR se nombra el ítem y se enlaza su issue; en el issue van las
cuatro respuestas. Falta una y el ítem no está reportado.

❌ Inútil — no permite retomar nada:
```markdown
### H1.S3.M1 — Mostrar el conflicto
Casi listo, falta pulir el front.
```

✅ Accionable — otra persona lo retoma sin preguntar (cuerpo del issue):
```markdown
### Mapear el conflicto de turno al mensaje de la UI
- Qué anda: el front recibe el 409 y el interceptor lo captura; el test de API
  del backend está en verde (salida en el PR #<n>).
- Qué no anda: la pantalla muestra el mensaje genérico "Ocurrió un error" en vez
  del texto de conflicto de horario.
- Qué falta exactamente: agregar la entrada `APPOINTMENT_OVERLAP` al mapa de códigos
  del interceptor de errores y su texto; el mapa ya existe y tiene tres entradas.
- Dónde quedó: rama `feature/agenda-conflictos`, compila y typecheck en verde;
  E2E `reserva-conflicto` en rojo únicamente por esta aserción.
```

- **Qué anda** — solo lo demostrado, con su evidencia. Si no lo corriste, no va acá.
- **Qué no anda** — el comportamiento observado, no la causa supuesta; si no la investigaste,
  decilo (ver `root-cause-debugging`).
- **Qué falta exactamente** — pasos nombrables. "Terminarlo", "pulirlo" y "ajustar detalles" no
  son pasos. Si no sabés qué falta, escribí "falta diagnosticar por qué X" y qué intentaste.
- **Dónde quedó** — rama, archivos tocados, y **si compila o no**: eso decide si quien retoma
  puede correr algo o tiene que arreglar primero.

## 4. ISSUES ABIERTOS

Lo que no se empezó o está bloqueado es un issue, abierto en el repo donde vive el cambio y
enlazado desde el PR. En los bloqueados, el issue dice qué los destraba y de quién depende — un
bloqueo sin dueño no se resuelve nunca. Un hallazgo de seguridad lleva la etiqueta `seguridad`.

```markdown
Issues abiertos por este trabajo:
- #231 — índice por rango para solapamientos (BLOQUEADO: la extensión no está habilitada en
  pruebas; depende de infraestructura)
- #232 — bloqueo de franjas desde la agenda del profesional (TODO)

Descartado: H1.S3.M3 — producto confirmó que los turnos contiguos no son conflicto.
```

## 5. Evidencia: recortar sin parafrasear

Recortar está bien. **Reescribir no.** Lo pegado tiene que ser texto que salió de la máquina, no
tu resumen. Importa la línea del veredicto, el conteo, y el error **completo** cuando falla.
❌ "Los tests pasaron correctamente." ✅ `Tests: 12 passed, 12 total`.

**Datos sensibles.** Ninguna salida puede llevar datos reales de pacientes, secretos ni tokens.
Enmascaralos y **declará que enmascaraste**: si no lo aclarás, quien lee no sabe si el sistema no
los emitió o si vos los sacaste. Las salidas largas, capturas y traces van como adjunto o
comentario del PR, nunca a una carpeta del repo.

```text
409 APPOINTMENT_OVERLAP profesional=<ID-ENMASCARADO> franja=10:00-10:30
(paciente y documento enmascarados manualmente para este reporte)
```

## 6. "No cubierto" no es "no se hizo"

| | Qué es | Ejemplo |
|---|---|---|
| **No se hizo** | Va a un issue | "No se implementó el bloqueo de franjas" → #232 |
| **No cubierto** | Se hizo, **no se verificó** | "Se probó con dos escrituras simultáneas, no con diez; no se ejercitó en móvil" |

"No cubierto" declara los límites de tu propia verificación: caminos no ejercitados, dispositivos
no probados, volúmenes no alcanzados. Omitirlo convierte un PASS parcial en PASS total a ojos del
que lee — un overclaim aunque cada frase sea cierta por separado.

## 7. Cuando todo salió mal

Sin maquillaje y sin dramatismo. Si QA está en rojo va en la **primera línea**:

```markdown
## Resumen
**Estado: no entregable.** El E2E de conflicto está en rojo; la invariante de base funciona
pero el flujo completo todavía deja pasar la segunda reserva desde la UI.
- Avance: 3 / 7 microtareas HECHO (43 %)
```

Un fallo bien reportado vale **más** que un éxito reportado vago: uno se retoma, el otro se audita.

## 8. Escribir para quien no vio la sesión

Nada de "como hablamos" ni "ese archivo". Nombrá los artefactos completos (ruta, rama, ID de
microtarea), sin pronombres sin antecedente. Test rápido: leelo como alguien que se sumó hoy — si
tenés que preguntar algo, falta información.

## 9. Retomar un trabajo ajeno

El orden de lectura de un PR previo (estado → A MEDIAS → dónde quedó → No cubierto → issues) está en
[references/retomar-trabajo.md](references/retomar-trabajo.md). Si no te alcanza para arrancar,
eso es un defecto del reporte: anotalo.

## Anti-patrones

| Anti-patrón | Por qué falla | Arreglo |
|---|---|---|
| "Casi listo", "falta pulir" | No es accionable | Las cuatro respuestas |
| Escrito pero no probado en COMPLETADO | Overclaim | Va a A MEDIAS |
| Porcentaje inventado | Oculta el estado | `HECHO / total` |
| Borrar lo que falló | Miente por omisión | Se declara con su estado |
| Lista de pendientes en un `.md` del repo | El repo pasa a declarar trabajo por hacer | Un issue por cosa, enlazado desde el PR |
| Resumen optimista con QA en rojo | Engaña al que decide | El rojo va primero |
| Salida parafraseada o secciones vacías borradas | No es evidencia / se lee como "no había nada" | Pegar literal; escribir "ninguna" |
| Sin "No cubierto" | PASS parcial leído como total | Declarar los límites |

## Evidencia / DoD

El reporte está terminado cuando podés mostrar todo esto:

- [ ] La descripción del PR tiene *Resumen* y *Verificación* completas.
- [ ] Toda microtarea del plan está en exactamente una sección y los conteos cuadran:
      `COMPLETADO + A MEDIAS + ISSUES ABIERTOS + DESCARTADO == total del plan`.
- [ ] Cada ítem de COMPLETADO tiene comando y salida literal en el PR.
- [ ] Cada ítem de A MEDIAS tiene su issue con las cuatro respuestas, con "dónde quedó"
      indicando si compila.
- [ ] El diff no agrega planes, reportes, secciones de pendientes ni `TODO`/`FIXME` al repo.
- [ ] El porcentaje coincide con `HECHO / total` calculado, y el peldaño declarado no es más
      fuerte que lo demostrado (ver `evidence-and-verification`).
- [ ] Ninguna salida pegada tiene datos de pacientes, secretos ni tokens; lo enmascarado, declarado.
- [ ] Existen "No cubierto", "Desvíos del plan", "Riesgos residuales" y "Decisiones y
      ambigüedades", con contenido o con "ninguna".

## Checklist

- [ ] Se escribió aunque el trabajo no haya terminado.
- [ ] Si algo está en rojo, se dice en la primera línea.
- [ ] Los bloqueos nombran qué los destraba y de quién dependen; se lee sin contexto de la sesión.
- [ ] El estado coincide con el del plan del issue o del PR (ver `milestone-planning`).
- [ ] Antes de cerrar el turno se pasó por `finish-your-turn`.
