# Reporte — M2 · MacBook: roles, cuentas y directorio de médicos (preproducción 2026-09-26)

> **AVANCE: 10 / 17 microtareas — 58,8 %.** (`HECHO / total`, contado fila por fila en `PLAN.md`;
> `BLOQUEADO` y `TODO` no suman, aunque las dos `BLOQUEADO` de acá tienen contrato de solución
> escrito, no son un signo de interrogación vacío.) H1 y H4.S1.M1/M3 cerrados. H2 cerrado salvo
> procedencia por fila (bloqueada, no DDL). H3 (5 microtareas) pasó a otra máquina (Mac Mini,
> worktree/rama propios) por indicación explícita del propietario a mitad de turno — no cuenta como
> hecho ni como pendiente de este carril, se documenta el traspaso.

- Fecha: 2026-09-26 · Plan: [PLAN.md](./PLAN.md) · Rama: `pablo/test-m2-macbook-roles-cuentas-directorio`
  (worktree `../wt-m2-macbook`, sobre `origin/test@016caaa1`)
- Peldaño de evidencia alcanzado: **`VERIFIED`** para H1, H2 y H4 (camino real ejercitado contra
  Postgres/API en vivo, sin mocks) — no `REGRESSION_VERIFIED` porque falta la regresión cruzada con
  el resto de los 36 carriles (no corrida por otras máquinas todavía) y el PR mergeable (rama no
  pusheada, ver "Riesgos residuales").

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Inventario real de roles vs `role-mapping.ts` | `grep -rn "@Roles(" src \| grep -E "BILLING\|FINANCE\|ACCOUNTING_APPROVER"` | Corrige la hipótesis del encargo: son roles de negocio (`authz.roles`), no del `RoleCode` global de 6 |
| H1.S1.M2 | `authz.business-roles.seed.ts` (BILLING, FINANCE, ACCOUNTING_APPROVER) registrado en `SYSTEM_ROLE_SEED` | `yarn seed:boot` (1ra y 2da pasada) | 1ra: `inserted:3`. 2da: `inserted:0` (idempotente) |
| H1.S1.M3 | `mergeRoleCodes` advierte (no calla) un `role_concept_id` sin mapear en `role-mapping.ts` | `jest iam-auth.service.spec.ts` | 27/27 verde, incluido el test nuevo |
| H1.S2 | Verificado que el médico autorregistrado (sólo `PRACTITIONER`) no recibe 403 en check-in/mostrador/ficha | `curl` con token real contra check-in, `appointments/direct`, `service-requests` | Los tres devolvieron 400 (validación de DTO), nunca 403 — sin token: 401. Ningún código nuevo hizo falta |
| H2.S1.M1–M2 | `PeopleSeedService` + `synthetic-person.ts` + `markdown-table.ts` | `SEED_PEOPLE_ENABLED=true SEED_PEOPLE_PASSWORD=12345678 yarn start` | 1ra corrida: 9 médicos + 92 pacientes creados. 2da corrida (`yarn seed:boot`): 0 nuevos, 9+92 "existing" |
| H2.S1.M4 | Login real de una muestra por rol | `curl /iam/auth/login` con `nationalId` sintético | 200, `roles:["USER","PATIENT"]`; médico ya verificado en H1.S2 con `PRACTITIONER` |
| H4.S1.M1 | IDOR de `GET /common/files/links` cerrado (`canActorReadOwnFile` + 403 si no hay nada visible) | `curl` con token de dueño y de extraño sobre el mismo `ownerId` | Dueño: 200 con su adjunto. Extraño: 403 exacto, no lista vacía |
| H4.S1.M3 | `GET /:id/signed-content` (`@Public()`, firma HMAC verificada) reemplaza el token-en-URL | `curl` sin ningún header `Authorization`; y con `expires` forjado | Sin token: 200 con los bytes reales subidos. Forjado: 403 "Firma de descarga inválida" |

## A medias
Ninguna — todo lo que se abrió esta sesión se cerró como `HECHO`, `BLOQUEADO` (con las cuatro
respuestas) o se traspasó explícitamente (H3).

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| H2.S1.M3 | BLOQUEADO | Procedencia por fila (`source_file`/`source_row`/`synthetic`) no tiene dónde vivir: no existen las columnas (DDL, fuera de alcance) ni un actor de auditoría (el autorregistro público no acepta uno sin tocar `iam-*-self-registration.service.ts` más allá de lo mínimo). Decisión del propietario: ¿bloquea el cierre de H2, o el requisito funcional alcanza? |
| H4.S1.M2 | BLOQUEADO | El paciente lee su propio PDF de resultado exige autorización **contextual** (`diagnostic_report` liberado + pertenece al paciente), que vive en `clinical` (dueño: M3), explícitamente OUT de este carril. Contrato exacto del método a escribir, documentado en `PLAN.md` |
| H3 (los 8 restantes) | Traspasado | Mac Mini, worktree `wt-m2-h3`, rama propia sobre `origin/test`. Recibió por chat: los hallazgos de AMB-02/AMB-03 (no existen `normalize_padron.py` ni `observed-specialties.dataset.json`) y aviso de que `synthetic-person.ts`/`markdown-table.ts` viven en esta rama, todavía sin pushear |

## Evidencia
```text
$ yarn typecheck                                    → exit 0 (repetido tras cada cambio)
$ jest src/common/seed/                              → 22 suites, 191/191
$ jest src/modules/common/                           → 14 suites, 117/117
$ jest src/modules/iam/services/iam-auth.service.spec.ts → 27/27

$ SEED_PEOPLE_ENABLED=true SEED_PEOPLE_PASSWORD=12345678 yarn start
"padrón de personas","inserted":101,"detail":{"practitionersCreated":9,"patientsCreated":92,
 "skipped":["...4 médicos sin matrícula del Ministerio..."]}

$ yarn seed:boot   (segunda pasada, mismo entorno)
"padrón de personas","inserted":0,"detail":{"practitionersExisting":9,"patientsExisting":92}

$ curl -X POST /iam/auth/login -d '{"nationalId":"2313877","password":"12345678"}'
→ 200 {"roles":["USER","PATIENT"], "name":"LICZY PAOLA NUÑEZ CALLEJAS", ...}

$ curl /common/files/links?ownerType=PATIENT&ownerId=<X>  (con token del dueño)   → 200, 1 item
$ curl /common/files/links?ownerType=PATIENT&ownerId=<X>  (con token de un tercero) → 403 exacto

$ curl -X POST /common/files/<id>/download-url        → {"url":".../signed-content?...signature=..."}
$ curl <esa url>, SIN header Authorization            → 200, bytes reales
$ curl <esa url con expires forjado>                   → 403 "Firma de descarga inválida"
```
Todo pegado, sin PHI ni credenciales reales — las cuentas usadas son sintéticas
(`*.alovida.test`, contraseña por variable de entorno).

## No cubierto
- Regresión cruzada con los otros 5 carriles de la máquina (M1/M3/M4/M5/M6): no corrida, porque
  esos carriles no cerraron todavía (varios en `TODO` al momento de este reporte).
- `H3.S2.M2` (mapeo de especialidades) y en general todo H3: no evaluado por esta sesión más allá
  del descubrimiento de que sus datasets de referencia no existen (AMB-02/AMB-03), pasado a la
  máquina que lo va a ejecutar.
- El seed de personas no se corrió contra los datasets de H3 (Alianza/Nacional, ~1400 filas): sólo
  contra el padrón de 335 filas de H2. El rendimiento a esa escala (autorregistro completo por fila,
  sin lote) no está medido — a esa escala sí importaría, a 105 no.
- Gate `gh pr checks`/`gh pr view --json mergeable` de la regla 35.2: no aplica todavía porque no
  hay PR (el push del branch está bloqueado, ver abajo).

## Desvíos del plan
- El plan original preveía escribir `insurance.roles.ts` dentro de `src/modules/insurance/` para
  `BILLING`/`FINANCE`. Se cambió a un único archivo `src/modules/authz/authz.business-roles.seed.ts`
  con los tres roles (incluido `ACCOUNTING_APPROVER`) porque `FINANCE` ya se usaba en módulos
  ajenos a `insurance` (`ads`, `pharma_lab`) — no era "de insurance", era transversal — y esto evita
  crear dos archivos de rol para tres códigos relacionados. Documentado en `PLAN.md`, sección H1.
- H3 se retiró del alcance de esta sesión a mitad de turno, por indicación directa del propietario
  (no una decisión mía): pasó a la máquina Mac Mini con su propio worktree y rama.

## Riesgos residuales
- **La rama no está pusheada.** `git push` fue denegado por el clasificador de permisos del entorno
  ("Out-of-Place Publication") en el primer intento de este turno; no se reintentó por otra vía
  (instrucción explícita de no rodear la denegación). Los cuatro commits (`c986315f`, `573b8818`,
  `7b32b2a8`, `356702a2`) existen sólo en el worktree local. **Acción pendiente del usuario:**
  aprobar el push o correrlo él mismo desde `wt-m2-macbook`.
- Postgres/Redis (`mantra-redesa-postgres-1`/`-redis-1`) quedan corriendo a propósito, para
  continuidad entre sesiones; comparten volumen con otras sesiones/carriles previos (1310+ tablas
  preexistentes) — no se verificó deriva de esquema contra `origin/dev` del modelo (regla 97.2)
  porque este carril no tocó DDL ni dependió de tablas nuevas.
- El proceso de la API sigue corriendo en background (`yarn start` con `SEED_PEOPLE_ENABLED=true`) —
  no se detuvo al cierre porque la próxima acción razonable (retomar H2/verificar algo más) lo
  necesita; si se cierra la sesión sin retomar, hay que pararlo a mano o dejarlo, ya que no escribe
  nada nuevo en reposo (el seed sólo corre una vez al boot).
- Las ~101 cuentas sintéticas sembradas (y las ~3 cuentas de prueba manuales de H1/H4:
  `carril.m2.h1s2@alovida.test`, `extrano.m2.h4@alovida.test`, y la de paciente asociada) viven en
  la base compartida de este worktree. Son claramente sintéticas (dominio `@alovida.test`,
  contraseña conocida) y no PHI real, pero si esta base se promueve a un entorno compartido con
  otras máquinas, alguien debería confirmar que el criterio "13+92" sigue siendo el querido antes de
  considerarlas definitivas.

## Decisiones y ambigüedades
- **AMB-01** (H1): `ACCOUNTING_APPROVER`/`BILLING`/`FINANCE` se declaran en
  `src/modules/authz/authz.business-roles.seed.ts` (IN scope), no dentro de `insurance`/`accounting`
  (OUT). Resuelto y aplicado, no sólo registrado — ver "Desvíos del plan".
- **AMB-02** (H3, traspasada): `normalize_padron.py` citado por el encargo no existe en ningún repo
  local. Avisado a la máquina que sigue con H3.
- **AMB-03** (H3, traspasada): `observed-specialties.dataset.json` tampoco existe. Avisado igual.
- **AMB-04** (H2): no hay manera de marcar procedencia por fila hoy (ni columnas — DDL, fuera de
  alcance — ni actor de auditoría — el autorregistro público no lo acepta). Registrado como
  `BLOQUEADO`, con las dos rutas de solución posibles y su costo, para que el propietario decida.
- **Q-01/Q-02/Q-03** del encargo original (mostrador del médico, agenda de médicos de red,
  especialidades sin mapear): siguen registradas, sin resolver, sin haber bloqueado nada de lo que
  sí se cerró.

## Cierre de turno
- Sesión activa hasta este punto sin corte de uso (el corte anterior, documentado en una versión
  previa de este archivo, quedó superado: se retomó y se completó el trabajo).
- H1, H2 (salvo procedencia) y H4 (salvo lectura contextual del paciente) están `VERIFIED` en el
  peldaño de la regla 30, con evidencia real pegada arriba.
- H3 pasó a otra máquina por indicación del propietario a mitad de turno; no quedó a medias por esta
  sesión, se traspasó.
- Pendiente de acción humana: aprobar/ejecutar el `git push` de la rama (bloqueado por el
  clasificador de permisos), y decidir las dos ambigüedades bloqueantes (AMB-04, H4.S1.M2).
