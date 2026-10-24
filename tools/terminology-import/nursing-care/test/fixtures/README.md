# Fixtures del importador de enfermería

Archivos REALES de las fuentes, copiados sin cambios salvo lo indicado y el fin de línea (git
normaliza CRLF → LF; los SHA-256 citados son de los originales). Se usan sólo en
`../nursing-care.test.mjs`.

| Archivo | Origen | Licencia | Cambio |
|---|---|---|---|
| `openEHR-EHR-OBSERVATION.fluid_balance.v1.adl` | github.com/openEHR/CKM-mirror @ `c3fdc43d`, `local/archetypes/entry/observation/` (SHA-256 `5854676d…2b4051`) | CC-BY-SA 4.0, © Australian Digital Health Agency, openEHR Foundation, Nasjonal IKT HF | ninguno |
| `openEHR-EHR-OBSERVATION.ecog.v2.adl` | ídem (SHA-256 `70af49d2…0eb6`) | CC-BY-SA 4.0, © openEHR Foundation; el arquetipo declara que la escala ECOG es de dominio público | ninguno |
| `openEHR-EHR-OBSERVATION.braden_scale.v1.prefix-until-definition.adl` | ídem, `openEHR-EHR-OBSERVATION.braden_scale.v1.adl` (SHA-256 del original `a10f4b7d…9655`) | CC-BY-SA 4.0 (arquetipo); la escala tiene copyright de B. Braden y N. Bergstrom | **recortado**: sólo las líneas anteriores a `definition` (encabezado, idiomas y descripción con el aviso de copyright). Los ítems y respuestas de la escala NO están. |
| `hl7-tho-7.0.1/NamingSystem-*.json` (12) | paquete npm `hl7.terminology@7.0.1` | CC0-1.0 | ninguno |

Atribución (CC-BY-SA): openEHR Foundation, openEHR Clinical Knowledge Manager, https://ckm.openehr.org/ — autores y traductores en cada archivo.
