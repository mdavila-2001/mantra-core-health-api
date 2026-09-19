#!/usr/bin/env bash
# =========================================================================
# Mantra Core Technologies · ALOVIDA Health Ecosystem
# MCH-016 · Ensayo LOCAL de restauración de PostgreSQL.
#
# QUÉ ES Y QUÉ NO ES.
# Esto es un ensayo en la máquina de desarrollo: `pg_dump` de la base local,
# `pg_restore` en una base de trabajo APARTE del mismo contenedor, conteo de
# tablas clave y medición del tiempo. Sirve para demostrar que el volcado es
# restaurable y para tener un número de RTO de referencia.
#
# NO es la prueba que pide MCH-016. No demuestra:
#   - restauración en infraestructura nueva (esto corre en el mismo motor);
#   - consistencia entre Postgres, Mongo y los objetos de MinIO;
#   - recuperación desde el backup real de producción, que no está definido
#     en este repositorio.
# El RPO no se mide acá: un `pg_dump` tomado a demanda tiene pérdida cero por
# construcción, y decir "RPO=0" a partir de eso sería mentir. Se informa como
# no medido, que es el contrato de MCH-023.
#
# SEGURIDAD DE LA BASE PRINCIPAL.
# La base principal sólo se LEE (`pg_dump`). La base de trabajo se crea, se usa
# y se borra; el script se niega a arrancar si el nombre de la base de trabajo
# coincide con el de la principal.
#
# USO:
#   bash scripts/recovery/drill-postgres.sh
#   DRILL_KEEP=1 bash scripts/recovery/drill-postgres.sh   # no borra la copia
#
# VARIABLES (con sus valores por omisión):
#   DRILL_CONTAINER=mantra-redesa-postgres-1   contenedor del motor
#   DRILL_SOURCE_DB=$POSTGRES_DB               base a volcar (sólo lectura)
#   DRILL_TARGET_DB=mantra_restore_drill       base de trabajo, se borra al final
#   DRILL_OUT_DIR=.drill                       dónde deja dump e informe
#   DRILL_MINIO_CONTAINER=mantra-redesa-minio-1  contenedor de objetos
#   DRILL_KEEP=0                               1 para conservar la base de trabajo
# =========================================================================
set -euo pipefail

CONTAINER="${DRILL_CONTAINER:-mantra-redesa-postgres-1}"
TARGET_DB="${DRILL_TARGET_DB:-mantra_restore_drill}"
OUT_DIR="${DRILL_OUT_DIR:-.drill}"
MINIO_CONTAINER="${DRILL_MINIO_CONTAINER:-mantra-redesa-minio-1}"
KEEP="${DRILL_KEEP:-0}"

# --- credenciales: las del contenedor, que pueden no coincidir con el .env ---
docker inspect "$CONTAINER" >/dev/null 2>&1 || {
    echo "ERROR: no existe el contenedor '$CONTAINER'." >&2
    echo "Levantá el stack local:" >&2
    echo "  docker compose --profile local-db up -d postgres postgres-init" >&2
    exit 1
}

PGUSER="$(docker exec "$CONTAINER" printenv POSTGRES_USER)"
PGPASSWORD="$(docker exec "$CONTAINER" printenv POSTGRES_PASSWORD)"
SOURCE_DB="${DRILL_SOURCE_DB:-$(docker exec "$CONTAINER" printenv POSTGRES_DB)}"
export PGPASSWORD

if [[ "$SOURCE_DB" == "$TARGET_DB" ]]; then
    echo "ERROR: la base de trabajo ('$TARGET_DB') no puede ser la principal." >&2
    exit 1
fi

mkdir -p "$OUT_DIR"
DUMP_IN_CONTAINER="/tmp/drill-${TARGET_DB}.dump"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
REPORT="${OUT_DIR}/drill-postgres-${STAMP}.md"

# Ejecuta un cliente de Postgres dentro del contenedor del motor.
en_motor() {
    docker exec -e PGPASSWORD="$PGPASSWORD" "$CONTAINER" "$@"
}

# Cuenta filas de una tabla en la base indicada.
#
# En dos pasos a propósito: Postgres planifica la consulta entera antes de
# evaluar nada, así que un `CASE WHEN to_regclass(...) IS NULL ... ELSE SELECT
# count(*) FROM tabla END` revienta igual si la tabla no existe. Primero se
# pregunta si está, recién después se cuenta.
#
# Devuelve el número, 'n/d' si la tabla no existe, o 'error' si la consulta
# falló por cualquier otro motivo. Los tres se distinguen: un 'error' a ambos
# lados NO es una coincidencia, es un ensayo que no probó nada sobre esa tabla.
contar() {
    local db="$1" tabla="$2" existe conteo
    existe="$(en_motor psql -U "$PGUSER" -d "$db" -qtAc \
        "SELECT to_regclass('${tabla}') IS NOT NULL" 2>/dev/null \
        | tr -d '[:space:]')" || { echo 'error'; return; }
    case "$existe" in
        t) ;;
        f) echo 'n/d'; return ;;
        *) echo 'error'; return ;;
    esac
    conteo="$(en_motor psql -U "$PGUSER" -d "$db" -qtAc \
        "SELECT count(*) FROM ${tabla}" 2>/dev/null \
        | tr -d '[:space:]')" || { echo 'error'; return; }
    [[ -n "$conteo" ]] && echo "$conteo" || echo 'error'
}

# Tablas centinela: una por dominio de los que importan para abrir una historia
# clínica completa. Si alguna no coincide —o no se pudo consultar— el ensayo
# falla. Están verificadas contra el esquema vivo; si el modelo las renombra,
# esta lista tiene que seguirlo, y el propio script avisa porque dará 'n/d'.
TABLAS_CLAVE=(
    "iam.users"
    "directory.tenants"
    "clinical.encounters"
    "clinical.observations"
    "clinical.conditions"
    "common.files"
    "audit.audit_log"
    "audit.data_access_log"
    "system_ops.backup_policies"
    "system_ops.restore_test_runs"
)

# Deja la base de trabajo sin rastros pase lo que pase.
limpiar() {
    en_motor rm -f "$DUMP_IN_CONTAINER" >/dev/null 2>&1 || true
    if [[ "$KEEP" == "1" ]]; then
        echo ">>> DRILL_KEEP=1: la base '$TARGET_DB' queda en pie."
        return
    fi
    en_motor psql -U "$PGUSER" -d postgres -qc \
        "DROP DATABASE IF EXISTS \"${TARGET_DB}\" WITH (FORCE)" >/dev/null 2>&1 || true
}
trap limpiar EXIT

echo ">>> Ensayo LOCAL de restauración · origen='${SOURCE_DB}' destino='${TARGET_DB}'"
echo ">>> La base de origen sólo se lee."

# ------------------------------------------------------------------ 1. volcado
echo ">>> [1/5] pg_dump de '${SOURCE_DB}'..."
T_DUMP_INI=$(date +%s)
en_motor pg_dump -U "$PGUSER" -d "$SOURCE_DB" -Fc -f "$DUMP_IN_CONTAINER"
T_DUMP_FIN=$(date +%s)
SEG_DUMP=$((T_DUMP_FIN - T_DUMP_INI))
BYTES_DUMP="$(en_motor stat -c %s "$DUMP_IN_CONTAINER" | tr -d '[:space:]')"
echo "    volcado en ${SEG_DUMP}s · ${BYTES_DUMP} bytes"

# --------------------------------------------------------------- 2. restaurado
echo ">>> [2/5] restaurando en '${TARGET_DB}' (base de trabajo aparte)..."
en_motor psql -U "$PGUSER" -d postgres -qc \
    "DROP DATABASE IF EXISTS \"${TARGET_DB}\" WITH (FORCE)"
en_motor psql -U "$PGUSER" -d postgres -qc "CREATE DATABASE \"${TARGET_DB}\""

T_REST_INI=$(date +%s)
# pg_restore devuelve != 0 por avisos benignos (extensiones ya presentes, dueños
# que no existen). Se captura la salida y se decide por los conteos, no por el
# código: los errores reales aparecen igual en el informe.
set +e
RESTORE_LOG="$(en_motor pg_restore -U "$PGUSER" -d "$TARGET_DB" \
    --no-owner --no-privileges "$DUMP_IN_CONTAINER" 2>&1)"
RESTORE_RC=$?
set -e
T_REST_FIN=$(date +%s)
SEG_RESTORE=$((T_REST_FIN - T_REST_INI))
N_AVISOS="$(printf '%s\n' "$RESTORE_LOG" | grep -c "^pg_restore: error" || true)"
echo "    restaurado en ${SEG_RESTORE}s (rc=${RESTORE_RC}, ${N_AVISOS} línea(s) de error de pg_restore)"

# ----------------------------------------------------------------- 3. conteos
echo ">>> [3/5] comparando conteos de tablas clave..."
FILAS_INFORME=""
DIFERENCIAS=0
for tabla in "${TABLAS_CLAVE[@]}"; do
    origen="$(contar "$SOURCE_DB" "$tabla")"
    destino="$(contar "$TARGET_DB" "$tabla")"
    # Un 'error' a ambos lados NO es una coincidencia: es una tabla sobre la que
    # el ensayo no demostró nada. Se cuenta como fallo, o el informe estaría
    # declarando verde algo que nunca se llegó a mirar.
    if [[ "$origen" == "error" || "$destino" == "error" ]]; then
        veredicto="**NO SE PUDO CONSULTAR**"
        DIFERENCIAS=$((DIFERENCIAS + 1))
    elif [[ "$origen" == "n/d" && "$destino" == "n/d" ]]; then
        veredicto="**NO EXISTE** (revisá la lista de centinelas)"
        DIFERENCIAS=$((DIFERENCIAS + 1))
    elif [[ "$origen" == "$destino" ]]; then
        veredicto="coincide"
    else
        veredicto="**DIFIERE**"
        DIFERENCIAS=$((DIFERENCIAS + 1))
    fi
    printf '    %-34s origen=%-8s restaurada=%-8s %s\n' \
        "$tabla" "$origen" "$destino" "$veredicto"
    FILAS_INFORME+="| \`${tabla}\` | ${origen} | ${destino} | ${veredicto} |"$'\n'
done

# ---------------------------------------------------------------- 4. adjuntos
# Una historia clínica sin sus adjuntos no está recuperada. `common.file_versions`
# guarda la referencia (`bucket_or_container` + `object_key`) pero los bytes viven
# en MinIO, que este volcado NO toca. Acá se contrasta una cosa contra la otra:
# referencias sin objeto (adjunto perdido) y objetos sin referencia (huérfano).
echo ">>> [4/5] adjuntos: referencias en Postgres contra objetos en MinIO..."

N_REFERENCIAS="$(en_motor psql -U "$PGUSER" -d "$SOURCE_DB" -qtAc \
    "SELECT count(*) FROM common.file_versions WHERE object_key IS NOT NULL" \
    2>/dev/null | tr -d '[:space:]')"
N_REFERENCIAS="${N_REFERENCIAS:-error}"

# MinIO guarda cada objeto como un directorio con su `xl.meta`; los buckets son
# los directorios de primer nivel salvo `.minio.sys`. Se cuenta sobre el disco
# del contenedor porque el cliente `mc` no está instalado en esta imagen.
if docker inspect "$MINIO_CONTAINER" >/dev/null 2>&1; then
    N_OBJETOS="$(docker exec "$MINIO_CONTAINER" sh -c \
        "find /data -mindepth 1 -maxdepth 1 -type d ! -name '.minio.sys' -exec find {} -name xl.meta \; 2>/dev/null | wc -l" \
        2>/dev/null | tr -d '[:space:]')"
    N_OBJETOS="${N_OBJETOS:-error}"
    MINIO_ESTADO="contenedor \`${MINIO_CONTAINER}\`"
else
    N_OBJETOS="n/d"
    MINIO_ESTADO="**el contenedor \`${MINIO_CONTAINER}\` no está levantado**"
fi

if [[ "$N_REFERENCIAS" == "0" && "$N_OBJETOS" == "0" ]]; then
    ADJUNTOS_VEREDICTO="**nada que ensayar**: no hay ni referencias ni objetos en este entorno. El ensayo NO dice nada sobre la recuperación de adjuntos."
    ADJUNTOS_OK=0
elif [[ "$N_REFERENCIAS" == "error" || "$N_OBJETOS" == "error" || "$N_OBJETOS" == "n/d" ]]; then
    ADJUNTOS_VEREDICTO="**no se pudo comparar** (referencias=${N_REFERENCIAS}, objetos=${N_OBJETOS})."
    ADJUNTOS_OK=0
elif [[ "$N_REFERENCIAS" == "$N_OBJETOS" ]]; then
    ADJUNTOS_VEREDICTO="coinciden en cantidad (${N_REFERENCIAS}). Coincidir en número no prueba que sean los mismos objetos; para eso hace falta el listado por \`object_key\`."
    ADJUNTOS_OK=1
else
    ADJUNTOS_VEREDICTO="**difieren**: ${N_REFERENCIAS} referencia(s) en Postgres contra ${N_OBJETOS} objeto(s) en MinIO. Hay adjuntos perdidos, huérfanos, o ambos."
    ADJUNTOS_OK=0
fi
echo "    referencias=${N_REFERENCIAS} objetos=${N_OBJETOS}"
echo "    ${ADJUNTOS_VEREDICTO}"

# ----------------------------------------------------------------- 5. informe
echo ">>> [5/5] informe en ${REPORT}"
if [[ "$DIFERENCIAS" -eq 0 ]]; then
    ESTADO_CONTEOS="todas las tablas clave coinciden"
else
    ESTADO_CONTEOS="**${DIFERENCIAS} tabla(s) clave no coinciden o no se pudieron consultar**"
fi

cat > "$REPORT" <<EOF
# Ensayo local de restauración de PostgreSQL

**Fecha (UTC):** ${STAMP}
**Alcance:** ensayo en la máquina de desarrollo. **No** es la restauración en
infraestructura nueva que pide MCH-016.

| | |
|---|---|
| Contenedor | \`${CONTAINER}\` |
| Base de origen (sólo lectura) | \`${SOURCE_DB}\` |
| Base de trabajo | \`${TARGET_DB}\` (se borra al terminar salvo \`DRILL_KEEP=1\`) |

## Lo que se midió

| Medición | Valor |
|---|---|
| Tiempo de \`pg_dump\` | ${SEG_DUMP} s |
| Tamaño del volcado | ${BYTES_DUMP} bytes |
| Tiempo de \`pg_restore\` | ${SEG_RESTORE} s |
| Código de \`pg_restore\` | ${RESTORE_RC} (${N_AVISOS} línea(s) de error) |
| **RTO local medido** (dump + restore) | **$((SEG_DUMP + SEG_RESTORE)) s** |
| RPO | **no medido** — ver abajo |

### Conteos de tablas clave

| Tabla | Origen | Restaurada | |
|---|---:|---:|---|
${FILAS_INFORME}
**Resultado:** ${ESTADO_CONTEOS}.

### Adjuntos (Postgres contra MinIO)

Origen de los objetos: ${MINIO_ESTADO}.

| | |
|---|---:|
| Referencias en \`common.file_versions\` con \`object_key\` | ${N_REFERENCIAS} |
| Objetos en MinIO | ${N_OBJETOS} |

**Resultado:** ${ADJUNTOS_VEREDICTO}

El volcado de Postgres **no incluye los bytes de los adjuntos**. Estas dos cifras
se comparan justamente para que eso no pase inadvertido: las filas pueden volver
enteras y el adjunto no estar.

## Lo que NO se midió, y por qué

- **RPO.** El volcado se toma a demanda: su pérdida de datos es cero por
  construcción, no por una capacidad de recuperación demostrada. Informar
  \`RPO=0\` desde acá sería inventar evidencia. Se registra como **no medido**
  (\`NOT_MEASURED\`, contrato de MCH-023). Medirlo de verdad exige un backup
  programado real y conocer su periodicidad.
- **Restauración en infraestructura nueva.** Esto restaura en el mismo motor y
  la misma máquina. No prueba que un host vacío pueda reconstruirse.
- **Consistencia entre almacenes.** Mongo, OpenSearch, Redis y los objetos de
  MinIO no entran en este volcado. Una historia clínica con adjuntos NO queda
  demostrada como recuperable: las filas de \`common.files\` viajan, los bytes
  del objeto no.
- **El backup real de producción.** No está definido en este repositorio.

## Cómo registrarlo en el sistema

\`POST /internal/ops/restore-test-runs\` con \`measuredRtoSeconds\` = el RTO de
arriba y **sin** \`measuredRpoSeconds\`. El servicio devolverá
\`objectiveStatus: NOT_MEASURED\`, que es lo correcto: este ensayo no alcanza
para declarar el objetivo cumplido.
EOF

echo
echo "================================================================"
echo " Ensayo LOCAL terminado. RTO local: $((SEG_DUMP + SEG_RESTORE))s. RPO: no medido."
echo " ${ESTADO_CONTEOS}"
echo " Informe: ${REPORT}"
echo " Esto NO demuestra recuperación ante desastre: leé el informe."
echo "================================================================"

[[ "$DIFERENCIAS" -eq 0 && "$ADJUNTOS_OK" -eq 1 ]] || exit 1
