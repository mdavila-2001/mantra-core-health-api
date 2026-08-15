# CARRIL 13 y 16 — backend · organización médica y laboratorio médico

Informe del carril en `mantra-core-health-api`, según
`alovida_carriles_CORREGIDO_fullspec_2026-08-15/lanes/13_MEDICAL_ORGANIZATION.md`
y `16_MEDICAL_LAB_ORG.md`.

- **Branch:** `fix/alovida-c13-medical_organization`
- **Base:** `origin/dev` en `51895db8`
- **Fuente funcional:** líneas 2579–3210 (C13) y 4383–4757 (C16) de
  `references/SPEC_FUNCIONAL_COMPLETA_5738_LINEAS.md`

---

## 1. El defecto que cierra este carril

Los dos módulos estaban construidos **de escritura y no de lectura**.

`practice` (M14) tenía **once operaciones de comando y tres lecturas**
—prácticas, sedes y espacios—. Se daban de alta áreas, servicios, plantilla,
acreditaciones e inventario, y **ninguna operación los volvía a mencionar**: la
estructura de la organización existía en la base y no existía para nadie. El
administrador registraba un quirófano y el sistema no se lo mostraba nunca más.

`diagnostic_units` (M23) sí tenía lectura, pero **sólo la del directorio
público**: filtra a unidades activas *y* verificadas, ofertas activas y precios
de cronogramas marcados como públicos. Es lo correcto para el paciente del
carril 11 y es exactamente lo que un administrador no puede usar — la unidad que
todavía no publicó desaparece de todas las pantallas, la oferta que retiró no se
puede reactivar porque no se puede encontrar, y el convenio con una aseguradora
no existe. El personal del laboratorio no aparecía en ninguna lectura.

## 2. Lo que se agregó

### CARRIL 13 — `GET /practices/:practiceId/organization`

Devuelve **el árbol completo de una organización médica en una lectura**: ficha,
sedes, áreas, infraestructura, servicios, plantilla profesional, documentación
legal e inventario.

Una sola respuesta y no siete endpoints porque las siete listas cuelgan del
**mismo** `practiceId`, se miran juntas y no significan nada por separado. Es el
criterio que ya usaba `GET /diagnostic-units/:id` en el propio repositorio.

| Archivo | Qué es |
|---|---|
| `src/modules/practice/repositories/practice-organization-read.repository.ts` | Las consultas por lote del árbol |
| `src/modules/practice/services/practice-organization-read.service.ts` | La composición y el aislamiento por tenant |
| `src/modules/practice/dto/organization-console.dto.ts` | El contrato de respuesta |
| `src/modules/practice/controllers/practices.controller.ts` | El endpoint |
| `src/modules/practice/practice.module.ts` | Registro de proveedores |

Decisiones que el código documenta y conviene destacar:

- **Nada se filtra por estado.** La consola administra también lo retirado, lo
  suspendido y lo vencido; ocultarlo dejaría al administrador sin ver por qué
  una sede dejó de aparecer en las pantallas de atención.
- **Una práctica de otro tenant responde el mismo `404` que una inexistente.**
  Distinguirlas convertiría el endpoint en un detector de identificadores
  ajenos.
- **`daysToExpiry` se calcula en el servidor**, a medianoche UTC. La alerta por
  vencimiento que pide la especificación tiene que dar el mismo resultado en
  toda pantalla, y el reloj del navegador no es base confiable.
- **`belowReorderLevel` es `false` sin umbral configurado.** Sin umbral no hay
  faltante que declarar; decir `true` sería una alarma inventada.
- **Los conceptos viajan resueltos** (`code` + `display`) en una sola lectura de
  terminología para todo el árbol, no uno por fila.

### CARRIL 16 — `GET /diagnostic-units/administration` y `/:id/administration`

La consola del laboratorio: el mismo dominio **sin** los filtros de publicación,
más el personal con sus permisos de validación y firma.

| Archivo | Qué es |
|---|---|
| `src/modules/diagnostic_units/repositories/diagnostic-units-admin-read.repository.ts` | Consultas sin filtro de publicación |
| `src/modules/diagnostic_units/services/diagnostic-units-admin-read.service.ts` | Composición, alertas y `publiclyListed` |
| `src/modules/diagnostic_units/dto/administration-read.dto.ts` | El contrato de respuesta |
| `src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts` | Los dos endpoints |
| `src/modules/diagnostic_units/diagnostic_units.module.ts` | Registro de proveedores |

- **`publiclyListed` informa el filtro del directorio en vez de aplicarlo**, con
  la misma regla (activa **y** verificada). Así la consola puede decir «esto no
  se ve todavía» sin reimplementar la regla y arriesgarse a contradecirla.
- **`GET administration` va declarado antes que `@Get(':id')`.** Nest resuelve
  en orden de declaración y ese parámetro lleva `ParseUUIDPipe`: al revés, la
  ruta literal caería en el parámetro y el pipe respondería 400.
- **Se devuelven todos los cronogramas de precios**, también los internos: sin
  ellos no hay manera de administrar un convenio con una aseguradora.
- **Un precio cuyo cronograma no vino se descarta**, no se inventa.

### Compartido

`src/modules/profiles/read/practitioner-names.ts` — el recorrido de dos saltos
(`health_practitioner_profiles` → `person_profiles` → `persons`) que resuelve el
nombre de un profesional. Es una **función pura** sobre el `EntityManager` y no
un servicio inyectable a propósito: la necesitan `practice` y `diagnostic_units`,
que no importan `ProfilesModule`, y hacerlos importarlo abriría dependencias
entre módulos con riesgo de ciclo. Evita que cada carril escriba su propia
versión del mismo recorrido.

## 3. Lo que NO se hizo, y por qué

La especificación de los dos carriles abarca además contabilidad, red social,
foros, encuestas, notificaciones, reservas de análisis, resultados y visitadores
médicos. **No se implementaron acá**: cada uno tiene su módulo y su carril
propios (M16 contabilidad, M19 comunidad, M09 formularios, M25 mensajería, M20
diagnósticos, M41 agenda). Construir una segunda versión dentro de `practice` o
de `diagnostic_units` sería exactamente la duplicación que la regla 3 del carril
prohíbe.

Las pantallas del front **declaran esa cobertura en texto**, con el módulo donde
vive cada dominio, en vez de dibujar pestañas que no persisten.

## 4. Pruebas

```
yarn typecheck                                  → sin errores
yarn test src/modules/practice \
         src/modules/diagnostic_units           → 19 suites, 145 tests, 0 fallos
yarn lint                                       → 0 errores
```

Cobertura nueva:

- `practice-organization-read.service.spec.ts` — aislamiento por tenant (404 sin
  distinguir), traducción de conceptos, recuento de áreas y espacios por sede,
  consulta por lote, resolución y ausencia de nombre profesional, los tres casos
  de `daysToExpiry` (futuro, hoy, vencido), el umbral de reposición con y sin
  configurar, y una única lectura de terminología sin repetidos.
- `diagnostic-units-admin-read.service.spec.ts` — que la consola devuelve la
  unidad sin publicar, que `publiclyListed` distingue, que los precios internos
  entran, que un precio huérfano se descarta, que el integrante sin asignación
  resoluble no se pierde, y las cuentas de calibración y vencimiento.
- Los dos controladores: que delegan en el servicio administrativo y **no** en
  el de directorio, y que el tenant del contexto llega al servicio.

## 5. Evidencia contra el stack vivo

Los tres endpoints se verificaron con la aplicación real, no con dobles: el
front del carril servido por `ng serve` proxeando a esta API, recorrido con
Playwright sobre Chromium (`scripts/e2e-carril-13-16.mjs` del repositorio del
front).

```
GET /practices/:id/organization          → HTTP 200 · 4 sedes reales del seed
GET /diagnostic-units/administration     → HTTP 200 · {items: [], count: 0}
```

Las rutas quedan registradas en el arranque del contenedor:

```
Mapped {/practices/:practiceId/organization, GET} route
Mapped {/diagnostic-units/administration, GET} route
Mapped {/diagnostic-units/:id/administration, GET} route
```

El listado de laboratorios devolvió vacío porque **los conceptos del módulo 23
nunca se materializaron en esta base local** y `tools/redesa/seed-diagnostic-units.mjs`
se detiene en vez de inventarlos — que es el comportamiento correcto del
seeder. Lo que quedó probado end-to-end de C16 es el recorrido completo
—sesión, rol, petición, respuesta y estado vacío—; el camino con datos lo
cubren las pruebas unitarias.

## 6. Deuda y hallazgos ajenos

- **Dos errores de formato preexistentes en `profiles`** (`prettier/prettier` en
  `profiles-practitioners.controller.ts` y `profiles-practitioners.service.spec.ts`)
  dejaban `yarn lint` en rojo en `origin/dev`. Se corrigieron —son sólo saltos de
  línea— porque de lo contrario bloqueaban el PR de este carril. No son de este
  carril y se declaran acá.
- El módulo sigue **sin escritura nueva**: este carril agrega lecturas. Las altas
  y bajas ya existían y no se tocaron.
- `practice.practitioner_role_assignments` estaba vacía en el entorno local; la
  pantalla de plantilla lo dice como vacío con acción, no como fallo.
