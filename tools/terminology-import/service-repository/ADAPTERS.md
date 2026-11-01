# Contrato de los adaptadores de fuentes

Cada fuente del repositorio universal de servicios es un módulo en
`lib/adapters/<clave>.mjs` (ESM, Node 22, sin dependencias nuevas: `node:*`,
`xlsx` y `pdftotext -layout` del sistema vía `child_process` están disponibles).
`build-service-repository.mjs` los importa todos y arma el corpus.

## Exportaciones obligatorias

```js
/** Metadatos de la fuente (van a terminology_sources / code_systems / versions). */
export const meta = {
  internalCode: 'es-mu-sms-2026',          // = codeSystem de cada registro; minúsculas y guiones
  name: 'Precios públicos del Servicio Murciano de Salud 2026',
  version: '2026',
  validFrom: '2026-05-01',                 // o null si la fuente no la declara (no inventar)
  source: {
    code: 'ES_MU_SMS',                     // MAYÚSCULAS, único
    name: 'Servicio Murciano de Salud (España)',
    owner: 'Consejería de Salud de la Región de Murcia',
    officialUrl: 'https://…',              // URL oficial exacta del archivo
    license: 'Texto con cita verificable (ver FUENTES.md)',
  },
  files: [{ path: 'es-mu-sms-precios-publicos-2026/BORM-….pdf', sha256: '…' }], // relativo a sourcesDir
};

/** Texto crudo de la fuente → registros. PURA: sin red ni disco. Es lo que prueba el test. */
export function parse(text /* o el objeto que corresponda */) { return { records, report }; }

/** Lee los archivos (verificando sha256 → aborta si no coincide) y llama a parse. */
export async function build({ sourcesDir }) { return { records, report }; }
```

`report = { read, kept, excluded: { '<motivo>': n } }` — todo lo que no entra, contado con su motivo.

## Registro

```json
{
  "codeSystem": "es-mu-sms-2026",
  "code": "CO.01.01",
  "display": "Consulta primera de Cardiología",
  "synonyms": [{ "value": "…", "lang": "es" }],
  "chapter": "Consultas externas › Cardiología",
  "specialties": [{ "code": "CARDIOLOGIA", "method": "section-heading", "detail": "encabezado «Cardiología»" }],
  "price": { "value": 123.45, "unit": "EUR" },
  "reviewStatus": "source-verbatim",
  "sourceRef": { "page": 12, "section": "B3.5" }
}
```

Reglas (no negociables, AGENTS.md §1.2 «No inventar»):

1. `display` es el texto de la fuente **tal cual** (se colapsan espacios y guiones de corte de línea; nada más). No se traduce, no se reescribe, no se cambia mayúsculas.
2. `code` es el código de la fuente; único dentro del `codeSystem`. Si la fuente no tiene código por línea, el adaptador **no** inventa uno: descarta y cuenta el motivo.
3. `specialties[].code` es uno de los 63 códigos de `src/common/seed/data/specialty-services/model-specialties.json`, y SOLO si la fuente lo dice: el encabezado/sección nombra la especialidad (`section-heading`) o el texto nombra al prestador (`descriptor`). Sinónimos aceptados sólo los obvios y documentados en el adaptador (p. ej. «Aparato digestivo» → `GASTROENTEROLOGIA`, «Traumatología» → `TRAUMATOLOGIA`, «Estomatología/Odontología» → `ODONTOLOGIA`). Si la sección nombra una especialidad que el modelo no tiene (Neurocirugía, Cirugía Plástica, Alergología…), se deja `specialties` vacío y se cuenta en `report.unmappedSpecialties`.
4. **Se excluyen** (contados): GRD / procesos de hospitalización por grupo diagnóstico, estancias por día, tasas administrativas (copias, expedición de documentos), transporte sanitario por kilómetro, medicamentos y material sueltos. **Se mantienen** consultas, pruebas diagnósticas, procedimientos, intervenciones, terapias, sesiones y programas.
5. `price` sólo si la fuente lo publica en esa línea, con su unidad (`EUR`, `ARS`, `COP`, `CLP`…). Sin conversión.
6. `reviewStatus`: `source-verbatim` si el texto sale limpio; `review-needed` si la extracción del PDF lo dejó dudoso (cortes, columnas mezcladas).

## Test

`test/<clave>.test.mjs` con `node:test`: `parse` sobre un fragmento real recortado de la fuente (fixture en `test/fixtures/<clave>.*`, < 50 KB) comprobando códigos, nombres, especialidad y exclusiones. Correr con
`node --test "tools/terminology-import/service-repository/test/*.test.mjs"`.
