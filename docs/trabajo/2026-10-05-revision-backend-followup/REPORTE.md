# Reporte — Seguimiento de la revisión backend

- Fecha: 2026-10-05 · Plan: [PLAN.md](./PLAN.md) · Rama: `pablo/revision-backend-2026-10-04`.
- Peldaño de evidencia alcanzado: `VERIFIED` para documentación y tooling documental.
- Avance: 10 / 10 microtareas (100 %). El cierre de regresión permanece bloqueado por rojos heredados de `origin/dev`.

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Se integró `origin/dev` sin rebase ni conflictos | `git show --no-patch --pretty=raw 9d631747` | Merge con padres `6a886462` y `75383cce` |
| H1.S1.M2 | El generador enlaza la fuente vigente en `dev` y conserva un solo salto final | `node --test tools/docs/sync-module-docs.test.mjs` | 1 test verde; antes falló contra `blob/master` |
| H1.S1.M3 | Se regeneraron los 70 módulos contra la base integrada | `corepack yarn docs:modules:sync` dos veces | 273 controllers, 412 services, 410 repositories, 1262 entities y 510 DTO; diff idempotente |
| H2.S1.M1 | La evidencia histórica quedó fijada al SHA auditado `02af1e09` | `rg` dirigido sobre los cuatro subárboles | 858 referencias al SHA; cero referencias a `blob/dev` |
| H2.S1.M2 | El informe público refleja los códigos reales | Inspección del diff contra las excepciones fuente | `400/VALIDATION_FAILED` y `404/NOT_FOUND`, sin `reason` estable |
| H2.S1.M3 | El README declara el alcance real | `rg 'tooling de sincronización'` | Coincidencia en el cierre del README maestro |
| H3.S1.M1 | Los gates documentales pasaron | `corepack yarn docs:coverage`; `corepack yarn docs:links` | 445 páginas, 70 módulos y 1020 enlaces internos sin rotos |
| H3.S1.M2 | La documentación construyó en modo estricto | `python -m mkdocs build --strict` | Código 0; 4,54 s |
| H3.S1.M3 | Se ejecutaron los gates técnicos aplicables | `corepack yarn typecheck`; `git diff --check`; lint y spec dirigido | Typecheck y diff verdes; rojos heredados reproducidos |
| H3.S1.M4 | Se registraron resultados, límites y bloqueos | Inspección de este reporte contra el plan | Estructura obligatoria completa |

## A medias

ninguna

## Pendiente

ninguna dentro del alcance autorizado. Los bloqueos heredados quedan en Riesgos residuales.

## Evidencia

```text
$ node --test tools/docs/sync-module-docs.test.mjs
tests 1; pass 1; fail 0

$ corepack yarn docs:modules:sync
Sincronizados 70 módulos → docs/modules/

$ corepack yarn docs:coverage
Verificados: 445 páginas de docs/, 70 módulos reales.
Cobertura documental OK.

$ corepack yarn docs:links
1020 enlaces internos verificados en 445 páginas.
Sin enlaces rotos.

$ python -m mkdocs build --strict
Documentation built in 4.54 seconds
exit 0

$ corepack yarn typecheck
exit 0

$ git diff --check
exit 0

$ git diff --quiet origin/dev -- '*.ts' '*.json' '*.sql'
exit 0
```

## No cubierto

- No se ejecutaron migraciones, Compose, smoke destructivo ni pruebas contra datos reales; este seguimiento cambia sólo documentación y tooling documental.
- No se repitió la suite completa después del merge porque el lint heredado la bloquea antes de Jest. Se reprodujo por separado el spec rojo de `insurance`.

## Desvíos del plan

- `origin/dev` avanzó después del primer push del follow-up. Se integró antes de regenerar para que el catálogo corresponda al merge real del PR.
- La prueba del generador no se agregó a `package.json`: el plan original prohíbe modificar JSON. Se ejecutó directamente con `node --test`.

## Riesgos residuales

1. `corepack yarn lint` falla con cuatro errores `prettier/prettier` en `src/modules/terminology/services/concepts.service.ts:949-952`, archivo incorporado sin cambios desde `origin/dev`.
2. `corepack yarn test src/modules/insurance/controllers/insurance-controllers.spec.ts --runInBand` reproduce 20 pruebas verdes y una roja: el spec espera `BILLING_OPERATOR` y `SECURITY_ADMIN`, mientras el controlador también declara `BILLING`, `FINANCE`, `INSURANCE_OPERATOR` y `USER`.
3. La última suite completa observada dejó cobertura global de ramas en 68,73 %, por debajo del umbral de 69 %.
4. MkDocs emitió avisos informativos por anclas históricas y por el anuncio de MkDocs 2.0, aunque `--strict` terminó con código 0.

No se usó `skip`, no se borraron aserciones y no se redujeron umbrales o exclusiones. El alcance autorizado excluye cambios de runtime, JSON y SQL, por lo que los tres rojos técnicos requieren un cambio de código separado.

## Decisiones y ambigüedades

- La evidencia auditada usa el SHA inmutable `02af1e09`.
- Los enlaces navegables de los espejos generados usan `dev`.
- El PR no se declara con regresión verde mientras persistan los tres rojos heredados descritos arriba.
- No quedan ambigüedades pendientes dentro del alcance documental.
