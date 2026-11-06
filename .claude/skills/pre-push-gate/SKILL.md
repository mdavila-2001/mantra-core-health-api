---
name: pre-push-gate
description: Obligatoria antes de CADA git push, PR o escritura remota en GitHub en la API. Asegura que la rama contiene el dev actual, que el resultado compila y que el cambio se probó de verdad con una prueba de integración contra Postgres real. Úsala siempre que vayas a subir algo.
allowed-tools: Read, Grep, Glob, Bash
---

# Pre-push gate (API)

Nace del informe `docs/trabajo/2026-11-05-historial-regresiones/INFORME.md`: en dos semanas un
merge borró una política RLS (API-1), un commit `wip` dejó un cobro sin `FOR UPDATE` (API-2) y
`dev` dejó de compilar tras fusiones (API-3). Ni `yarn build` ni las pruebas de unidad lo
detectan. **Nada sale de esta máquina sin esta puerta.**

## La pregunta que va antes de todo

> **¿Esto sirve a largo plazo? ¿Soluciona el problema a largo plazo? Si no, no sirve.**

Se responde **antes de escribir** la solución y queda en cada commit como
`Largo plazo: <respuesta>` (mínimo 25 caracteres; la puerta rechaza «sí», «ok» o vacío).

1. **¿Ataca la causa o el síntoma?** Nómbrala. Si no la sabes, el trabajo es encontrarla.
2. **¿Qué impide que vuelva?** Una prueba de integración, una restricción en la base, un
   gate. «Estaré atento» no impide nada.
3. **¿Lo entiende quien no vio la sesión?** Si la razón vive solo en el chat, se pierde.
4. **¿Qué deuda deja y quién la paga?** Lo pendiente se nombra con dueño.

**Si la respuesta honesta es «no sirve a largo plazo», NO se sube**: se le dice a la persona
qué haría falta de fondo y ella decide. Un parche que tapa el síntoma es deuda disfrazada de
avance. Prueba rápida: *si el mismo problema vuelve en dos semanas y nadie lo ve, no sirvió.*

## Qué impide

Dos capas: el hook de Claude Code (`.claude/settings.json` → `scripts/pre-push-gate.mjs hook`)
bloquea `git push`, `gh pr create`/`gh api` y las escrituras remotas del MCP de GitHub; y
`.githooks/pre-push` (el de Git, que ve cualquier push) verifica el SHA empujado. Ambos exigen
una prueba válida **para este commit exacto contra el `dev` actual**.

## Flujo obligatorio

0. **Responde la pregunta de largo plazo.**
1. **Pregunta «¿Quién es el responsable?»** y espera. Cada commit lleva `Responsable: <nombre>`.
2. **Rama nueva desde `dev`**, nunca una ya mergeada. `git fetch origin dev && git checkout -b <rama> origin/dev`.
3. **Un PR, un asunto.**
4. **Trae `dev` antes de probar** (`git merge origin/dev`). En un conflicto **gana `dev`** salvo lo
   que el PR cambia a propósito. Luego revisa:
   - `git diff origin/dev --stat` lista **solo tus archivos**;
   - **`git diff --diff-filter=D origin/dev HEAD`**: ningún archivo borrado que no hayas borrado
     tú (un merge que elimina un `.sql` de `database/SQL/patches` o un archivo de `src/orm/catalog`
     se revisa uno por uno; así se perdió API-1).
5. **Escribe la prueba que demuestra el cambio** en `test/integration/*.int-spec.ts`, contra
   **Postgres real con RLS forzado y el rol de runtime**. Los dobles y el ORM mockeado **no
   prueban persistencia**. Debe fallar sin tu cambio. Si el cambio mueve dinero: prueba de
   idempotencia (la misma operación dos veces) y de concurrencia sobre la fila. Si toca una
   política RLS: caso positivo y negativo (otro tenant). Si cruza servicios: prueba de duplicado.
   La puerta exige que el spec sea **nuevo o modificado en la rama**.
6. **Corre la puerta** (todo commiteado, árbol limpio, sin archivos sin trackear):

   ```bash
   node scripts/pre-push-gate.mjs run --int test/integration/mi-caso.int-spec.ts
   ```

   Hace, en orden: estado de Git (árbol limpio, `dev` contenido en HEAD, diff no vacío,
   `Responsable:` y `Largo plazo:` en los commits aún no subidos), `typecheck`, `eslint` de lo
   cambiado, `build`, pruebas de unidad relacionadas y la prueba de integración. Deja
   `.claude/gate/proof.json`.
7. **Sube** con `git push`. Si `dev` se movió, vuelve al paso 4.
8. **PR a `dev`** con sección «Evidencia» (resumen de `proof.json` y qué NO se probó). Si el
   cambio toca rutas o DTOs: regenerar el contrato OpenAPI (`yarn docs:openapi:generate`) y
   pasar por el pipeline de DDL si toca el modelo.

## Prohibido (cada punto salió de un incidente)

- **`--no-verify`, editar `proof.json` o la propia puerta.**
- **Archivos locales sin commitear que hagan pasar el build** (la puerta rechaza el árbol sucio).
- **Resolver un conflicto «tomando mi lado»** sin comparar contra `dev` y sin mirar los borrados.
- **Subir un commit `wip`** o «sin verificar» (API-2).
- **Reutilizar una rama mergeada.**
- **Debilitar un test para que pase.**
- **Mockear la base** para declarar terminado un cambio de persistencia.

## Si la puerta falla porque `dev` está roto

No lo tapes. Demuestra que el fallo es de `dev` (mismos errores en un worktree limpio de
`origin/dev`) y repórtalo con el archivo y el error. **Nunca** empujes saltándote la puerta.

## Si no se puede probar

Sin Postgres o sin forma de ejercitar el cambio: el veredicto es **BLOQUEADO**, no PASS. Dilo
con qué se intentó y qué lo destraba. Solo la persona responsable puede decidir saltarse la
puerta, por escrito.

## Límites (sin sobre-afirmar)

Prueba que el resultado del merge **compila y que el flujo probado funciona**. No prueba que el
spec sea bueno ni que no haya regresiones en otros módulos, ni sustituye la revisión humana.
Es **un freno, no una cerradura**:

- **`proof.json` es falsificable**: quien corre el script puede escribir el archivo.
- **`git push --no-verify`** apaga el hook de Git.
- **El hook de Claude Code mira el repositorio de la sesión**: con `git -C otro push` en una
  sesión multi-repo verifica el repo equivocado; el `pre-push` de Git del repo destino cuenta.
- **Solo documentación**: no tiene superficie observable; pasa sin prueba. Es decisión consciente.
- **Matemática de dinero, RLS y contratos entre servicios** necesitan además los gates propios
  del repo; esta puerta no los reemplaza.

**La cerradura de verdad vive en el servidor**: CI reactivado y, en la protección de rama de
`dev`, «rama actualizada con `dev`» más el check obligatorio. Eso no lo puede poner una skill.
