# Copia de despliegue del DDL (`database/SQL`)

`database/SQL` y `database/NoSQL` son una copia vendorizada del modelo
(`mantra-core-health-model`, ADR-0021). La fuente es siempre el modelo: un cambio de DDL empieza
en un `.puml`, se genera con `gen_ddl.py` y se trae acá con `yarn db:vendor`.

## Estado al 2026-10-31

Medido con `diff -rq ../mantra-core-health-model/SQL database/SQL` (y lo mismo para `NoSQL/`)
contra el modelo **v4.2.82** (mantra-core-technologies/mantra-core-health-model#102):

- **Árbol base y `patches/`: idénticos al modelo.** No quedan parches que existan sólo en el API.
- Los parches que antes vivían sólo acá (`v4263_medical_facility`, `v4267_practitioner_admissions`,
  `infraestructura_f1c` … `f5_*`, `f2_f5_integracion(_b)`, `admision_crea_el_vinculo(_b)`,
  `secretaria_iniciador_vinculos`, `v4282_service_request_detalle`) ahora están en el modelo, con
  su `.puml`, y conservan el mismo nombre de archivo.
- `2026-10-31_secretaria_iniciador_vinculos.sql` pasó a la versión del modelo: mismo efecto, sin
  duplicar la FK. Una base donde ya se aplicó la versión anterior no necesita volver a aplicarlo.
- `check_ddl_sources.py` del modelo: «Fuentes de DDL OK».

## Cómo comprobarlo

```bash
yarn db:vendor --check   # usa rsync; si no está instalado, diff -rq como arriba
```

Las entidades ORM todavía no se regeneraron contra v4.2.82; ver
mdavila-2001/mantra-core-health-api#1235.
