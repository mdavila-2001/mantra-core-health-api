# Reporte — Auditoría de fallos de integración por datos locales

- Fecha: 2026-10-11 · Plan: [PLAN.md](./PLAN.md) · Rama: `justin/integration-data-audit-test`
- Peldaño de evidencia alcanzado: TESTED para la corrida de los specs; consultas de diagnóstico de sólo lectura confirmaron el estado del catálogo local. La funcionalidad no queda verificada.
- Avance: 4 / 4 microtareas (100 %).

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Se registró el resultado de la corrida autorizada de los tres specs de integración | `node -r dotenv/config --experimental-vm-modules node_modules/jest-cli/bin/jest.js --config ./test/jest-integration.json --ci --runInBand --silent --runTestsByPath test/integration/insurance-campaigns.int-spec.ts test/integration/insurance-plan-administration.int-spec.ts test/integration/glossary.int-spec.ts` | 3 suites fallaron; 11 pruebas fallidas, 19 aprobadas, 30 total; proceso terminó con código 1 en 28.255 s. |
| H1.S1.M2 | Se clasificaron las aserciones de glosario como deriva del contenido local/expectativas, y los 400 de seguros como ausencia de dato | Consulta SQL `BEGIN READ ONLY` / `ROLLBACK` en la base local; `node tools/terminology-import/load-glossary-es.mjs --dry-run --layers cie10es-diagnosticos` | `I10` tiene 0 filas en `terminology.catalog_concepts`; el NDJSON selectivo contiene `I10`; el dry-run planea 12.051 conceptos de CIE-10-ES Diagnósticos 2026 y no tocó ninguna base. La categoría de anatomía tiene 16 conceptos; los textos españoles de pulmón existen y el fallback respondió con `translated:false`. |
| H1.S1.M3 | Se dejó constancia del cleanup fallido y del tenant sintético que quedó en la base | Consulta SQL `BEGIN READ ONLY` / `ROLLBACK` a `directory.tenants` y `audit.audit_log` | Tenant `CA_0FCB00E6` (`71def89e-cfdc-43e7-8629-5da41096837a`) conserva 5 referencias en `audit.audit_log`; no se borró ni modificó ninguna fila de la bitácora. |
| H1.S1.M4 | Se cargó la capa de diagnósticos CIE-10-ES tras autorización explícita y confirmación del destino local | `DOTENV_CONFIG_PATH=../mantra-core-health-api/.env DB_HOST=127.0.0.1 DB_PORT=5433 DB_NAME=mantra_redesa_health node -r dotenv/config tools/terminology-import/load-glossary-es.mjs --layers cie10es-diagnosticos --apply`; después consulta SQL `BEGIN READ ONLY` / `ROLLBACK` | Cargador: 12.051 conceptos, 12.051 designaciones, 139.699 propiedades, 30.715 membresías, 20.268 relaciones en 5 s. Consulta: `I10` count = 1, display `Hipertensión esencial (primaria)`. |

## A medias
Ninguna microtarea a medias.

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| Limpieza del tenant sintético referenciado por WORM | BLOQUEADO | La solución del arnés para respetar `audit.audit_log` (seguimiento ya abierto en la sesión «Arnés de integración vs bitácora WORM»). No limpiar manualmente ni desactivar la protección. |

## Evidencia

Corrida autorizada (ambiente local, un worker; `DB_HOST=127.0.0.1`, `DB_PORT=5433`, `DB_NAME=mantra_redesa_health`, `ORM_SCHEMA_SYNC=off`, `RATE_LIMIT_DISABLED=true`):

```text
Test Suites: 3 failed, 3 total
Tests:       11 failed, 19 passed, 30 total
Time:        28.255 s
```

Fallos de glosario observados:

```text
memberCount: expected 6, received 16
concept search count: expected 6, received 16
locale fallback: translated=false; la aserción de texto busca "esponjoso del sistema respiratorio", frase ausente del texto español actual
```

Consultas de diagnóstico ejecutadas dentro de transacciones `READ ONLY` y revertidas:

```text
terminology.catalog_concepts: concept I10 count = 0
anatomy category: member count = 16; source_system = glossary-curated-es
lung properties: Spanish text present; English text absent
synthetic tenant CA_0FCB00E6: audit.audit_log references = 5
```

Dry-run selectivo de CIE-10-ES Diagnósticos 2026 (sin conexión a la base):

```text
perLayer.cie10es-diagnosticos = 12051
codeSystem = cie10es-diagnosticos-2026; concepts = 12051; designations = 12051
properties = 139699; memberships = 30715; relationships = 20268
Plan escrito en glossary-data-build/load-plan.dry-run.json. No se tocó ninguna base.
```

El NDJSON local identifica `I10` como «Hipertensión esencial (primaria)», fuente CIE-10-ES 2026 del Ministerio de Sanidad. La configuración inspeccionada de la API local señala `DB_HOST=localhost`, `DB_PORT=5433`, `DB_NAME=mantra_redesa_health` (se omitieron credenciales). La carga se ejecutó después de recibir autorización explícita.

La autorización explícita se recibió después del dry-run. El preflight conectó por `127.0.0.1:5433` y devolvió `database=mantra_redesa_health`, `server_address=172.18.0.2/32`, `server_port=5432` (el servidor local dentro del contenedor). Se aplicó sólo la capa selectiva:

```text
=== Carga del glosario ES a terminology.* (APPLY explícito) ===
[load] {"codeSystem":"cie10es-diagnosticos-2026","concepts":12051,"designations":12051,"properties":139699,"memberships":30715,"relationships":20268}
"segundos": 5
```

Consulta posterior en transacción de sólo lectura:

```text
"concepts": 12051, "designations": 12051, "properties": 139699,
"memberships": 30715, "relationships": 20268, "i10_count": 1
"code": "I10", "display": "Hipertensión esencial (primaria)"
```

La corrida del spec de seguros también falló durante su cleanup: `directory.tenants` sigue referenciado por `audit.audit_log` mediante `fk_audit_log_tenant_id`. La bitácora es WORM; se conservaron las cinco filas y no se intentó un borrado alternativo.

## No cubierto
- No se repitieron los specs después de la carga: el spec de seguros ya falló en cleanup y dejó un tenant sintético referenciado por WORM. Repetirlo antes de resolver el arnés sumaría residuos locales.
- El resultado exacto de cada aserción fallida de `insurance-plan-administration.int-spec.ts` no se conserva en este reporte; esa suite se contabiliza como fallida, sin atribuirle una causa no demostrada.
- No se corrieron specs después de redactar este reporte: no hubo cambios en código ni en las pruebas.

## Desvíos del plan
- Se amplió el alcance para incluir la carga selectiva de CIE-10-ES luego de recibir autorización explícita del propietario. La aprobación, la validación del destino local, el comando y los conteos resultantes quedaron registrados.
- No se repitió la integración después de cargar datos porque el cleanup anterior dejó una fila WORM referenciada; el nuevo estado de las pruebas de seguros tras la carga queda sin verificar.

## Riesgos residuales
- No se confirmó mediante una nueva llamada de integración si la carga elimina los 400; el dato existe ya en el catálogo local.
- Los tests del glosario fijan conteos y una frase que no coinciden con el catálogo curado local actual.
- Queda un tenant sintético local que el cleanup del harness no pudo borrar por la FK WORM.

## Decisiones y ambigüedades
- `I10` ausente se clasifica como DATA para la ejecución local. No demuestra un defecto del producto ni describe otros ambientes.
- Los dos conteos de anatomía se clasifican como deriva DATA/fixture: el catálogo curado contiene 16 elementos y ambas respuestas observadas reflejaron ese conteo.
- El fallback de locale se clasifica como expectativa de texto desactualizada: la respuesta tenía texto español y `translated:false`; la frase exacta esperada ya no está en el contenido actual.
- Los fallos del cleanup son de compatibilidad del arnés con la protección WORM. No se toca `audit.audit_log` y no se borra el tenant a mano.
