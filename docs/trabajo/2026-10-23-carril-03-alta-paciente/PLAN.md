# Plan — Carril 03: correcciones del flujo de alta de paciente

- Fecha: 2026-10-23 · Repos afectados: `mantra-core-health-api` (rama `carril-03/alta-paciente`, base `dev`), `mantra-core-health` (rama `carril-03/alta-paciente`, base `mockup`) · Predecesor: commits de Itzan (parentesco y razón social) y de Pablo Arauz (alta en 5 pasos, 2026-10-21)
- Resultado observable: en `/auth/register/patient` el paciente suma celulares y contactos de emergencia con «+», y se guardan como filas reales; ni un correo sin dominio ni una fecha de nacimiento fuera de rango llegan a crear la cuenta.
- Kill-test: `POST /iam/auth/register-patient` con `additionalPhones` deja una sola fila de teléfono, o con `birthDate: "2999-01-01"` responde 201 → no está hecho.

## Alcance
- IN:
  - API: rango de `birthDate`; `additionalPhones` y `additionalEmergencyContacts` en el DTO y el servicio; `openapi.json/yaml` regenerados.
  - FE: correo con dominio; «+» de celulares y de contactos de emergencia; contrato del mock regenerado; suite e2e del alta al día con los 5 pasos.
- OUT:
  - Orden de páginas: queda el de Pablo (`2ecfebbb1`, decisión de Leo 2026-10-23).
  - Zona y nombres múltiples como colección: requieren cambio en `mantra-core-health-model`, que no se toca.
  - Sistema de puntos Alovida: área Promoción, trabajo aparte.
  - Fallos preexistentes ajenos al alta (ver REPORTE).
- Ambigüedades registradas:
  - Departamento de emisión obligatorio (commit `b300adebb`) vs. «el resto opcional». Queda obligatorio: decisión de Leo, 2026-10-23.

## H1 — La fecha de nacimiento fuera de rango no entra por la API
**CA:** Dado un alta con `birthDate` futura o anterior a 1910, cuando se envía, entonces la API responde 400.
**DoD:** jest del DTO en verde + POST real contra la API local.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Validador `IsBirthDateInRange` | 2999/1909-12-31 → error; 1910-01-01 y hoy → sin error | `yarn test register-patient.dto` → PASS | HECHO |
| H1.S1.M2 | Rechazo en la API real | POST con 2999-01-01 → 400 | script `api-real-check.mjs` → `status: 400` | HECHO |

## H2 — El correo sin terminación de dominio no pasa el paso
**CA:** Dado `ana@gmail`, cuando se intenta crear la cuenta, entonces el alta no sale y el campo marca error.
**DoD:** vitest + Playwright en navegador.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H2.S1.M1 | `Validators.pattern(CORREO_CON_DOMINIO)` | `ana@gmail` inválido; `ana.quispe@correo.umsa.bo` válido | `yarn ng test --include=register-patient` → PASS | HECHO |
| H2.S1.M2 | Prueba en navegador | se ve «Ingrese un correo válido.» | `carril-03-alta-paciente.spec.ts` → PASS | HECHO |

## H3 — Multicampos de celular y contacto de emergencia, de punta a punta
**CA:** Dado que el paciente suma dos celulares y un contacto con «+», cuando crea la cuenta, entonces la base guarda tres teléfonos (principal con rank 1) y una persona relacionada por cada contacto, con su parentesco.
**DoD:** jest + vitest + Playwright contra mock y contra la API real + consulta a la base.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H3.S1.M1 | DTO: `additionalPhones` (≤4) y `additionalEmergencyContacts` (≤4, nombre obligatorio) | texto libre o tope+1 → error | `yarn test register-patient.dto` → PASS | HECHO |
| H3.S1.M2 | Servicio: teléfonos con rank 1..n y un `related_person` por contacto | rank del principal = 1 | `yarn test iam-patient-self-registration.service` → PASS | HECHO |
| H3.S1.M3 | `openapi.json/yaml` regenerados | diff sólo con los campos nuevos | `yarn docs:openapi:generate` → 70 líneas | HECHO |
| H3.S2.M1 | Contrato del mock regenerado | `RegisterPatientDto` acepta las claves nuevas | `node scripts/gen-mock-contract.mjs …/openapi.json` | HECHO |
| H3.S2.M2 | `FormArray` + «+» en la página de contacto + cuerpo del alta | arreglos viajan sólo si hay valores | `yarn ng test --include=register-patient` → PASS | HECHO |
| H3.S2.M3 | Navegador (desktop y 390 px) | casilla vacía frena el paso; alta llega a éxito | `carril-03-alta-paciente.spec.ts` → PASS | HECHO |
| H3.S3.M1 | API real + base | 3 teléfonos rank 1-3; 3 personas con parentesco | script + `psql` sobre la base local | HECHO |

## H4 — Suite e2e del alta al día con los 5 pasos
**CA:** Dado el alta de 5 pasos, cuando se corren los specs del alta de paciente, entonces pasan contra el mock y contra la API real.
**DoD:** Playwright `--workers=1`.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H4.S1.M1 | Helper `support/registro-paciente.ts` (`PASOS_DEL_ALTA`, `completarContacto`) | deja la pantalla en el paso esperado | specs que lo usan → PASS | HECHO |
| H4.S1.M2 | `registro-empresa-y-mapa`, `registro-documento-ayuda`, `altas-sin-cobertura` (paciente), `auditoria-qa-mockup` (TC-02..04), `registro-persistencia` | PASS | `yarn playwright test …` → PASS | HECHO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| RAM de la máquina local (15 GB, casi llena) | servidores matados por presión de memoria | correr de a una cosa, Docker sólo con postgres/redis/mongo |
| La rama `test` diverge de `dev` | el mismo cambio puede no aplicar limpio | cherry-pick por rama, PR por rama |
