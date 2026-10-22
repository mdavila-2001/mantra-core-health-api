# Reporte - H6 - Organizacion, clinica extendida y contrato de calidad (BR-28/BR-29/BR-30) - M7 - Lenovo Legion

> AVANCE: BR-28: 3/3 microtareas priorizadas HECHO (CV-13 parcial, CV-14, CV-20) - BR-29: 3/4 HECHO (CV-10
> parcial, CV-11 parcial, CV-12 con correccion de seguridad) + CV-23 no cubierto - BR-30: 1/8 HECHO (TX-14) +
> TX-23 (OpenAPI) HECHO + 5 NO CUBIERTO/BLOQUEADO (TX-24, TX-25, TX-27, CV-21 solo doc, CV-25, AG-44 front-only).
> Peldano alcanzado: VERIFIED para lo que corrio contra Postgres real (Docker efimero, legion-h6-pg, puerto 5460)
> y contra la API real levantada (puerto 3600 y, para el spec de integracion, el puerto efimero de supertest):
> rutas mapeadas, curl en vivo, test:integration con dos tenants reales creados por HTTP. Para lo demas
> (auth-providers, health-context, N+1, CI, e2e real, geo), NO CUBIERTO, no se declara hecho.

- Fecha: 2026-09-26 - Maquina: M7 - Lenovo Legion - Plan: docs/trabajo/2026-09-26-h6-organizacion-clinica-calidad/PLAN.md
  - Decisiones: docs/progress/DECISIONS.md (seccion "H6")
- Rama: legion/test-h6-organizacion-calidad, desde origin/test, PR contra test
- Compuertas: corepack yarn typecheck exit 0 - corepack yarn lint exit 0 - corepack yarn build exit 0 -
  1531 tests unitarios en verde en los modulos tocados - 7/7 en el spec de integracion nuevo, salidas en este
  directorio

## Completado

| ID | Que se logro (observable) | Comando | Resultado |
|---|---|---|---|
| H6.S1.M1 (CV-14) | GET /practices/:practiceId/role-assignments (filtro de estado + cursor keyset), acotado al tenant del actor | corepack yarn test src/modules/practice + test:integration | PASS. Mapeada en runtime (mapped-routes.txt); aislamiento 404 verificado en vivo (integration-admin-listados.log) |
| H6.S1.M2 (CV-13, parcial) | GET /delegated-permission-sets acotado al tenant (repositorio findByTenantPage, cursor por id) | idem | PASS unitario + integracion (tenant B nunca ve los sets de tenant A) |
| H6.S1.M3 (CV-20) | GET /profiles/credentials?state= - cola de verificacion de titulos | corepack yarn test src/modules/profiles | PASS, mapeada en runtime |
| H6.S2.M1 (CV-10, parcial) | GET /referrals/me - el paciente lee sus propias derivaciones, titularidad resuelta por person_account_links (nunca por un id del cliente) | corepack yarn test src/modules/clinical_ext | PASS 3 specs nuevos |
| H6.S2.M2 (CV-11, parcial) | GET /patient-coverages/me - "Mi cobertura" del paciente, mismo criterio de titularidad | corepack yarn test src/modules/insurance | PASS (spec nuevo coverage.service.spec.ts) |
| H6.S2.M3 (CV-12) | GET /billing/invoices, GET /billing/invoices/:id, GET /billing/patient-statements, sin ninguna accion de cobro | corepack yarn test src/modules/billing + test:integration | PASS. Incluye la correccion de seguridad de abajo |
| H6.S3.M1 (TX-14) | genReqId: UUID v4 por defecto; solo respeta el X-Request-Id entrante si TRUST_PROXY_HOPS>0 (detras de nginx); eco en la cabecera de respuesta | corepack yarn test src/logging + curl -si contra la API viva | PASS 5/5 (src/logging/request-id.spec.ts); curl real con X-Request-Id y correlationId coincidentes (live-request-id.txt) |
| H6.S3.M2 (TX-23) | OpenAPI regenerado sobre TODO lo agregado en H6 (mas H1/H2, ya mergeados en la rama) | node tools/openapi/generate-openapi.mjs contra Postgres real | 1290 paths, 1412 operaciones; las 8 rutas nuevas confirmadas en openapi/openapi.json |
| (hallazgo de seguridad, fuera de BR-28/29, corregido en la misma sesion) | Un aviso automatico de revision detecto que las 3 lecturas nuevas de billing aceptaban practiceId de la query sin verificar el tenant (IDOR). Corregido con PracticeTenantLookupService.findTenantOfPractice antes de cualquier consulta; 404 sin distinguir "no existe" de "es de otro tenant" | specs de aislamiento + test:integration | PASS |

Kill-test (tomar 3 hallazgos al azar y reproducir contra el artefacto real): se reprodujeron en vivo, contra
Postgres real y la API levantada:
1. GET /practices/:id/role-assignments de una practica de otro tenant devuelve 404, no una lista vacia silenciosa
   ni un 403 que confirme la existencia (antes: la ruta no existia).
2. GET /billing/invoices?practiceId=<de otro tenant> devuelve 404 (antes de la correccion de seguridad de esta
   misma sesion: 200 con las facturas ajenas).
3. Cualquier peticion sin X-Request-Id recibe uno nuevo (UUID v4) en la respuesta y en el cuerpo de error
   (correlationId), el mismo que loguea pino-http; antes: contador de proceso, repetible entre reinicios.

## A medias

### CV-13 - hubs de administracion
- Que anda: delegated-permission-sets y profiles/credentials tienen lectura real, probada y acotada.
- Que no anda: auth-providers (proveedores sin secretos), health-context, identity-authorities/
  identity-policies, practitioner-delegates/org-user-assignments/access-requests siguen sin ningun GET.
- Que falta exactamente: repetir el mismo patron (repositorio findByTenantPage/lectura global + DTO + service +
  controller) para cada uno; el patron ya esta probado y replicado tres veces en este mismo diff.
- Donde quedo: sin empezar, fuera del presupuesto de esta sesion.

### CV-10/CV-11 - derivaciones, teleconsulta y cobertura, del lado del front
- Que anda: la API expone GET /referrals/me y GET /patient-coverages/me, probados.
- Que no anda: ninguna pantalla nueva del front las consume; virtual-encounters (teleconsulta) no tiene ningun
  GET nuevo en esta sesion.
- Que falta exactamente: clientes de datos + pantallas en mantra-core-health.
- Donde quedo: contrato de API listo; front NO CUBIERTO.

## Pendiente

| ID | Estado | Que lo destraba |
|---|---|---|
| TX-24 (CI efectivo) | BLOQUEADO | Runner self-hosted operativo o decision de moverse a un runner de GitHub, infraestructura de M1; el CLAUDE.md del repo ya declara el CI caido |
| TX-25 (suite real e2e, SSR+nginx+limite de tasa) | BLOQUEADO | Un tercer stack completo (build production-api + nginx + Postgres con seeds), no entra en el presupuesto de RAM (~2 GB compartidos con H4/H5) ni de tiempo de esta sesion |
| TX-27 (N+1, 5 pantallas) | NO CUBIERTO | Disenar y construir las lecturas en lote del lado de la API |
| CV-25 (geolocalizacion fuera del menu) | NO CUBIERTO, investigado | Un canMatch + una marca de "fuera del menu" que no dependa de borrar la seccion del registro que tambien genera las rutas, ver DECISIONS.md |
| AG-44 residuo 2 (.puml de data_catalog/qa_execution) | Pedido a M1 | Sin DDL en este repo; el modelo vive en mantra-core-health-model |
| auth-providers, health-context, identity-authorities/policies, resto de delegated_access (CV-13) | NO CUBIERTO | Replicar el patron ya usado 3 veces en este diff |

## Evidencia

- mapped-routes.txt - las 8 rutas nuevas mapeadas por node dist/src/main.js contra Postgres real (puerto 5460) y
  arrancando en el puerto 3600.
- live-request-id.txt - curl real mostrando X-Request-Id y correlationId.
- integration-admin-listados.log - test:integration completo: test/integration/admin-listados.int-spec.ts, 7/7 en
  verde, con el log estructurado de cada peticion (dos tenants reales creados por POST
  /iam/auth/register-organization, aislamiento probado en las tres lecturas de practice/delegated_access/billing).
- unit-tests-h6.log - 1215 tests unitarios en verde en los modulos tocados (mas otros 316 de practice/
  delegated_access ya cubiertos en una corrida separada, total 1531).
- typecheck.log, lint.log - tsc --noEmit y eslint en verde sobre todo el repo.
- openapi/openapi.json y .yaml regenerados y commiteados: git diff --stat -- openapi/ da 6024 inserciones, 1787
  borrados (incluye lo ya mergeado de H1/H2, siguiendo la instruccion de H6: regenerar sobre todo lo que esta en
  la rama propia).

## No cubierto

- auth-providers (listado sin secretos), health-context, identity-authorities/identity-policies,
  practitioner-delegates/org-user-assignments/access-requests: sin ningun GET nuevo (CV-13 parcial).
- virtual-encounters (teleconsulta): sin GET nuevo (CV-10 parcial).
- CV-23 (perioperatorio honesto): sin tocar; la seccion front sigue como estaba.
- Adjudicacion/EOB/apelacion de seguros (lado aseguradora), POST /patient-coverages abierto al paciente
  (BR-29 parrafo 5.2 opcion a): fuera de alcance por decision registrada (ver DECISIONS.md).
- TX-24 (CI efectivo), TX-25 (suite real e2e), TX-27 (N+1): ver seccion Pendiente.
- CV-25 (geo fuera del menu): investigado, no implementado, ver DECISIONS.md.
- Front: ninguna pantalla nueva para los 6 endpoints agregados en H6.

## Desvios del plan

- El plan original de BR-28 preveia tocar 6 modulos (practice, delegated_access, auth_providers,
  identity_assurance, health_context, profiles); se cerraron 3 de 6 por presupuesto de sesion, priorizando los
  hallazgos explicitamente citados por el encargo de M7 (CV-13, CV-14, CV-20, ID-19 parcial).
- Se agrego una correccion de seguridad no pedida por BR-28/BR-29 (IDOR en las lecturas nuevas de billing),
  encontrada por un aviso automatico de revision sobre el propio diff, corregida en la misma sesion con specs de
  regresion.
- No se ejecuto la suite completa del repo (corepack yarn test a secas): por RAM compartida con otros dos
  agentes (regla 70), se corrieron los modulos tocados (1531 tests) mas typecheck/lint sobre el repo entero.

## Riesgos residuales

- Los endpoints nuevos de SECURITY_ADMIN en billing/practice/delegated_access heredan ese rol por no abrir un
  camino de autorizacion nuevo sin revision de M2; si D-BR28-2(A) se aprueba mas adelante, hay que revisar estas
  rutas tambien.
- CI de ambos repos sigue sin bloquear nada (TX-24): un PR puede mergearse con el openapi.json desactualizado
  otra vez si nadie corre docs:openapi:generate a mano.

## Decisiones y ambiguedades

Ver docs/progress/DECISIONS.md, seccion "H6 (BR-28/BR-29/BR-30)": D-BR28-1/2/3, BR-29 parrafo 5.1/5.2, CV-25
(investigado y no implementado), TX-24/TX-25 (bloqueados con causa) y el hallazgo de seguridad corregido.

## Ambiente de verificacion (y su baja)

- Postgres efimero propio: contenedor Docker legion-h6-pg (imagen postgres:16-alpine, puerto 5460), con el DDL de
  database/SQL aplicado directo (apply_all.sql + apply_deferred.sql, sin db:vendor, sin las extensiones
  pgvector/TimescaleDB de NoSQL/58-59, que ningun modulo tocado necesita).
- API levantada con node dist/src/main.js, puerto 3600, ORM_SCHEMA_SYNC=off, contra ese Postgres.
- Se baja al terminar (docker stop legion-h6-pg && docker rm legion-h6-pg). No se tocaron contenedores de otros
  agentes (legion-h4-*, legion-h5-*) ni secretos ajenos.
