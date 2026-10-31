# Desfase de la copia de despliegue del DDL (`database/SQL`)

Medido el 2026-10-31 con `diff -rq ../mantra-core-health-model/SQL database/SQL`
(en esta máquina no hay `rsync`, así que `yarn db:vendor --check` no corre).

## Qué se encontró

- **Árbol base (`00_shared` … `41_scheduling`)**: 345 archivos distintos. La copia del API
  está en el esquema **4.0.10**; el modelo, en **4.2.79**. Este árbol no se tocó: el despliegue
  real parte de una base ya creada y aplica sólo `patches/`; sincronizar 345 archivos de un golpe
  (`yarn db:vendor`, que usa `rsync --delete`) además **borraría** tres parches que sólo existen en el
  API (abajo) y es una decisión de quien despliega, no de esta franja.
- **`patches/` en el modelo y no en el API** (copiados en esta franja, sin renumerar):
  `2026-10-29_infraestructura_f5_operaciones`, `2026-10-31_v4275_personal_apoyo`,
  `2026-10-31_v4278_gobierno_de_accesos`, `2026-10-31_v4279_revision_seguridad_gobierno`.
  Quedan sin copiar los del modelo posteriores (de otras franjas): `2026-10-31_v4280_observabilidad_sistema`
  y los cuatro `2026-10-31_v4281_*` (cargas masivas, gobierno de datos, idempotencia anónima,
  motor de aprobación).
- **`2026-08-05_tenant_rls.sql`** difería (el modelo añade la sección 4, tablas append-only); se copió la
  versión del modelo, que es superconjunto.
- **`patches/` en el API y no en el modelo** (se dejan como están, NO se borran):
  `2026-10-28_v4263_medical_facility`, `2026-10-29_v4267_practitioner_admissions`,
  `2026-10-31_secretaria_iniciador_vinculos`, y `2026-11-01_v4282_service_request_detalle` (nuevo, de
  esta tarea: todavía no está en el modelo).
- **Colisiones de numeración ya existentes** (no se renumeran, ya están aplicadas): v4249, v4263, v4264, v4265, v4267.
  En el modelo, v4.2.80 es observabilidad y v4.2.81 idempotencia, gobierno de datos y cargas masivas
  (manifiesto 4.2.81): el siguiente número libre es v4.2.82 (este parche).

## Pendiente (decisión humana)

Resolver el árbol base y los tres parches huérfanos del API (¿suben al modelo o se retiran?) antes de
correr `yarn db:vendor` sin `--check`.
