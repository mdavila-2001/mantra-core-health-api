# Runbook: datos que la ronda de seguridad no migra

> Procedimientos manuales para tres conjuntos de filas que los arreglos de la ronda de seguridad
> dejaron como estaban: cuentas asistidas sin persona (#820), filas anteriores a la columna
> `tenant_id` y los residuos de la prueba `lane16` en una base compartida (#827). Ninguno corre solo
> ni lo ejecuta una migración: cada uno exige una decisión de quien opera la base.

## Reglas comunes

- **Primero lectura.** Cada procedimiento empieza con una consulta de solo lectura que dice cuántas
  filas toca. Si el número no coincide con lo esperado, se detiene todo.
- **Una transacción, un respaldo.** Cada escritura va en `BEGIN … COMMIT` y, antes de confirmar,
  guarda en un CSV los identificadores que creó o cambió. Ese CSV es la entrada de la reversión.
- **Nada de datos clínicos en los respaldos.** Los CSV llevan identificadores (`uuid`), nunca
  nombres, correos ni documentos.
- **Con RLS activa**, el rol que ejecuta debe ver todas las filas: dentro de la transacción se
  declara `SET LOCAL app.system_context = 'true'`, el mismo mecanismo del barrido `SYSTEM` (ver
  [aislamiento de tenant](../../security/tenant-isolation.md)). Sin eso las consultas devuelven 0
  filas y parecen limpias.
- **Una base descartable primero.** Se ensaya sobre una copia anonimizada; nunca se copian datos de
  producción a desarrollo.
- Los cambios de esquema no entran por acá: van por `.puml` → `SQL/` → base → ORM
  ([ADR-0021](../../adr/ADR-0021-fuente-unica-de-ddl.md)).

## 1. Cuentas asistidas sin persona (#820)

**Qué pasó.** El alta asistida (`POST /iam/users/assisted-registration`) creaba la cuenta y no la
persona. Desde el arreglo crea `profiles.persons`, `profiles.person_profiles`,
`profiles.patient_profiles` y el vínculo `SELF` en `profiles.person_account_links` en la misma
transacción. Las cuentas creadas antes quedaron sin persona: su titular recibe
`ACCOUNT_WITHOUT_LINKED_PERSON` al abrir su propio perfil.

**Decisión previa.** Reparar es optativo: una cuenta que nunca se activó puede simplemente
volver a darse de alta. El procedimiento sirve para las que sí se activaron.

### 1.1 Diagnóstico (solo lectura)

Una cuenta asistida se reconoce por su evento de seguridad (`detail_json.flow`).

```sql
SELECT count(*) AS cuentas_asistidas_sin_persona
FROM iam.users u
WHERE EXISTS (
        SELECT 1 FROM iam.security_events e
         WHERE e.user_id = u.id
           AND e.detail_json ->> 'flow' = 'assisted-registration')
  AND NOT EXISTS (
        SELECT 1 FROM profiles.person_account_links l
         WHERE l.user_id = u.id AND l.valid_to IS NULL);
```

El número que devuelve es el que debe crear el paso 1.3 (`INSERT 0 <n>` en cada tabla).

### 1.2 Identificadores de los conceptos

Los conceptos tienen ids deterministas (`defineModuleConcepts`). Con la API compilada
(`yarn build`) se escriben como variables de `psql`:

```bash
node -e "const { PROF } = require('./dist/src/modules/profiles/profiles.concepts.js');
for (const k of ['PERSON_ACTIVE','VITAL_ALIVE','PROFILE_TYPE_PATIENT','PROFILE_ACTIVE','LINKAGE_UNLINKED','ACCOUNT_LINK_SELF','ACCOUNT_LINK_VERIFIED','ACCOUNT_LINK_ACTIVE'])
  console.log('\\\\set ' + k.toLowerCase() + ' ' + PROF[k]);" > ids-820.psql
```

### 1.3 Reparación

El nombre de la persona es el `display_name` de la cuenta: las partes (nombre, apellidos) no se
guardaron en `iam.users` y quedan vacías hasta que el titular las complete con
`PATCH /profiles/patients/me`.

```sql
\set ON_ERROR_STOP on
\i ids-820.psql

BEGIN;
SET LOCAL app.system_context = 'true';

CREATE TEMP TABLE bf820 ON COMMIT DROP AS
SELECT u.id AS user_id, gen_random_uuid() AS person_id, u.display_name
  FROM iam.users u
 WHERE EXISTS (
         SELECT 1 FROM iam.security_events e
          WHERE e.user_id = u.id
            AND e.detail_json ->> 'flow' = 'assisted-registration')
   AND NOT EXISTS (
         SELECT 1 FROM profiles.person_account_links l
          WHERE l.user_id = u.id AND l.valid_to IS NULL);

INSERT INTO profiles.persons
       (id, person_status_concept_id, vital_status_concept_id, display_name, created_at, updated_at)
SELECT person_id, :'person_active'::uuid, :'vital_alive'::uuid, display_name, now(), now()
  FROM bf820;

INSERT INTO profiles.person_profiles
       (id, person_id, profile_type_concept_id, status_concept_id, created_at, updated_at)
SELECT gen_random_uuid(), person_id, :'profile_type_patient'::uuid, :'profile_active'::uuid, now(), now()
  FROM bf820;

INSERT INTO profiles.patient_profiles
       (profile_id, patient_code, record_linkage_status_concept_id, created_at, updated_at)
SELECT person_id, 'PAT-' || gen_random_uuid(), :'linkage_unlinked'::uuid, now(), now()
  FROM bf820;

INSERT INTO profiles.person_account_links
       (id, person_id, user_id, link_type_concept_id, verification_status_concept_id,
        status_concept_id, valid_from, created_at, updated_at)
SELECT gen_random_uuid(), person_id, user_id, :'account_link_self'::uuid,
       :'account_link_verified'::uuid, :'account_link_active'::uuid, now(), now(), now()
  FROM bf820;

\copy bf820 (user_id, person_id) TO 'bf820-ids.csv' CSV HEADER
COMMIT;
```

### 1.4 Verificación

1. Repetir la consulta del paso 1.1: devuelve `0`.
2. Con la cuenta de un titular de prueba (no con datos reales de un paciente), `GET
   /profiles/patients/me/summary` responde 200 y ya no `ACCOUNT_WITHOUT_LINKED_PERSON`.

### 1.5 Reversión

Solo es seguro si las personas creadas no recibieron nada más (identificadores, contactos,
consultas). Si alguna `DELETE` falla por una clave foránea, esa persona ya tiene datos y no se
borra: se corrige a mano.

```sql
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL app.system_context = 'true';
CREATE TEMP TABLE bf820_undo (user_id uuid, person_id uuid) ON COMMIT DROP;
\copy bf820_undo FROM 'bf820-ids.csv' CSV HEADER

DELETE FROM profiles.person_account_links l USING bf820_undo b
 WHERE l.person_id = b.person_id AND l.user_id = b.user_id;
DELETE FROM profiles.patient_profiles p USING bf820_undo b WHERE p.profile_id = b.person_id;
DELETE FROM profiles.person_profiles p USING bf820_undo b WHERE p.person_id = b.person_id;
DELETE FROM profiles.persons p USING bf820_undo b WHERE p.id = b.person_id;
COMMIT;
```

Las tablas `audit.*_history` conservan el rastro de la creación y de la reversión; esas filas no se
borran.

## 2. Filas con `tenant_id` nulo

**Qué pasó.** Los arreglos de aislamiento por tenant añadieron o empezaron a exigir
`tenant_id` en tablas cuyas filas anteriores quedaron con el valor nulo. Un tenant ordinario **no
alcanza** una fila sin tenant (responde 404 como ante un id inexistente): solo la ve el barrido
`SYSTEM` global. Aplica a los contratos de integración
(`integration_contracts.integration_contracts`, sin backfill por diseño: el proveedor externo es
global y compartido entre organizaciones), a los agentes y las políticas de automatización
(`automation.*`), a los componentes y cambios de `platform_ops.*` y a las suites y entornos de
`qa_execution.*`.

**Qué tenant le corresponde a cada fila no se deduce del esquema.** Lo decide quien conoce a la
organización dueña; el procedimiento solo aplica esa decisión.

### 2.1 Diagnóstico (solo lectura)

Cuenta, por tabla, cuántas filas no tienen tenant:

```sql
BEGIN;
SET LOCAL app.system_context = 'true';

SELECT format(
         'SELECT %L AS tabla, count(*) FILTER (WHERE tenant_id IS NULL) AS sin_tenant, count(*) AS total FROM %I.%I',
         c.table_schema || '.' || c.table_name, c.table_schema, c.table_name)
  FROM information_schema.columns c
  JOIN information_schema.tables t
    ON t.table_schema = c.table_schema AND t.table_name = c.table_name AND t.table_type = 'BASE TABLE'
 WHERE c.column_name = 'tenant_id' AND c.is_nullable = 'YES'
   AND c.table_schema IN ('integration_contracts', 'automation', 'platform_ops', 'qa_execution', 'identity_assurance')
 ORDER BY c.table_schema, c.table_name
\gexec

COMMIT;
```

Para listar las filas de una tabla (ids, no contenido):

```sql
SELECT id FROM integration_contracts.integration_contracts WHERE tenant_id IS NULL;
```

### 2.2 Asignación

La decisión llega como un CSV de tres columnas, `tabla,id,tenant_id`, con una fila por registro
(la tabla en la forma `esquema.tabla`). El nombre de la tabla de cada `UPDATE` está escrito en la
sentencia: nunca se interpola desde el CSV. Se escribe una sentencia por tabla del CSV; la de
abajo es la de los contratos de integración y las demás repiten el patrón (las tablas de estos
esquemas tienen la clave primaria `id`).

```sql
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL app.system_context = 'true';

CREATE TEMP TABLE asignaciones (tabla text, id uuid, tenant_id uuid) ON COMMIT DROP;
\copy asignaciones FROM 'asignaciones.csv' CSV HEADER

-- Cada tenant del CSV tiene que existir (la clave foránea lo exige donde está definida).
SELECT a.tenant_id FROM asignaciones a
 WHERE NOT EXISTS (SELECT 1 FROM directory.tenants d WHERE d.id = a.tenant_id);   -- debe devolver 0 filas

UPDATE integration_contracts.integration_contracts t
   SET tenant_id = a.tenant_id
  FROM asignaciones a
 WHERE a.tabla = 'integration_contracts.integration_contracts'
   AND t.id = a.id AND t.tenant_id IS NULL;

-- UPDATE automation.agents …, UPDATE platform_ops.service_components …, etc., con el mismo patrón.

COMMIT;
```

`UPDATE <n>` por tabla debe coincidir con las filas de ese `tabla` en el CSV; si no, `ROLLBACK`.
La condición `t.tenant_id IS NULL` impide pisar una fila que ya tiene dueño.

### 2.3 Verificación

Repetir el paso 2.1: las filas asignadas dejan de contarse en `sin_tenant`. Con el administrador
del tenant destino, `GET` del recurso por su id responde 200 (antes 404).

### 2.4 Reversión

El mismo CSV devuelve las filas al estado nulo, solo si siguen con el tenant que se les asignó:

```sql
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL app.system_context = 'true';
CREATE TEMP TABLE asignaciones (tabla text, id uuid, tenant_id uuid) ON COMMIT DROP;
\copy asignaciones FROM 'asignaciones.csv' CSV HEADER

UPDATE integration_contracts.integration_contracts t
   SET tenant_id = NULL
  FROM asignaciones a
 WHERE a.tabla = 'integration_contracts.integration_contracts'
   AND t.id = a.id AND t.tenant_id = a.tenant_id;

COMMIT;
```

## 3. Datos de la prueba `lane16` en una base compartida (#827)

**Qué pasó.** `lane16-patient-invoice-flow` dejó filas sintéticas con el marcador
`LANE16-67806b38` en una base compartida. Desde el arreglo la prueba se niega a correr contra una
base que no se declare descartable (ver `test/integration/disposable-database.ts`), así que no se
agregan más.

**Por qué no se borra con un script de este repo.** Esas filas incluyen historial de solo inserción
(`audit.invoices_history`, `audit.insurance_claims_history`) y decisiones inmutables por trigger
(`insurance.claim_appeal_decisions`). Un `DELETE` suelto falla o, peor, deja la base
inconsistente: el borrado lo hace la administración de la base con su procedimiento aprobado.

### 3.1 Verificación previa (solo lectura)

Lo que se entrega a la administración de la base es esta consulta y su resultado:

```sql
SELECT 'claims' AS tabla, count(*) FROM insurance.insurance_claims
 WHERE claim_identifier LIKE 'LANE16-67806b38%'
UNION ALL
SELECT 'coverage', count(*) FROM insurance.patient_coverages
 WHERE member_identifier LIKE 'LANE16-67806b38%'
UNION ALL
SELECT 'disputes', count(*) FROM insurance.claim_disputes d
  JOIN insurance.insurance_claims c ON c.id = d.insurance_claim_id
 WHERE c.claim_identifier LIKE 'LANE16-67806b38%'
UNION ALL
SELECT 'appeal_decisions', count(*) FROM insurance.claim_appeal_decisions ad
  JOIN insurance.insurance_claims c ON c.id = ad.insurance_claim_id
 WHERE c.claim_identifier LIKE 'LANE16-67806b38%';
```

Resultado esperado de la corrida original: 17 reclamos, 1 cobertura, 1 disputa y 1 decisión de
apelación (y 9 facturas que cuelgan de esos reclamos). Un número distinto significa que la base
tiene otras filas con ese prefijo o que alguien ya borró parte: se detiene y se consulta.

### 3.2 Después del borrado

Repetir la consulta del paso 3.1: las cuatro filas devuelven `0`. Las filas de `audit.*_history`
que corresponden al marcador no se eliminan; la administración de la base decide si se archivan.
