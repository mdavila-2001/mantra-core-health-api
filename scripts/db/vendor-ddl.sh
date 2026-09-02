#!/usr/bin/env bash
# =========================================================================
# Mantra Core Technologies · ALOVIDA
# Sincroniza el DDL canónico del workspace (`../SQL`, `../NoSQL`) con la copia
# versionada del repositorio (`database/SQL`, `database/NoSQL`).
#
# POR QUÉ EXISTE
# --------------
# El esquema relacional vive en OTRO repositorio —`mantra-core-health-model`,
# que se clona como HERMANO de éste (ver el commit 19ef5a17, que cerró B-2)— y
# `docker-compose.yml` lo monta desde `../mantra-core-health-model/SQL`.
#
# Que el modelo tenga repositorio propio arregla el versionado, pero NO arregla
# el despliegue: una plataforma como Coolify clona ESTE repositorio y nada más.
# Sin la copia de `database/`, el contenedor de inicialización arranca con
# `/init/SQL` vacío, la base queda sin tablas y la aplicación responde 500 en la
# primera escritura.
#
# `docker-compose.yml` (desarrollo local) sigue montando el repositorio del
# modelo, para que quien edita el DDL vea el efecto sin copiar nada.
# `docker-compose.coolify.yml` (despliegue) monta `./database/SQL`. Este script
# es el puente entre los dos, y `--check` es la comprobación que impide
# desplegar una copia atrasada.
#
#   bash scripts/db/vendor-ddl.sh            # copia el modelo a database/
#   bash scripts/db/vendor-ddl.sh --check    # falla si difieren
#
# `--check` sirve a dos entornos distintos y hace algo distinto en cada uno,
# porque el DDL canónico vive FUERA del repositorio:
#
#   · En la máquina de quien programa (existe `../SQL`) compara las dos copias
#     y falla si difieren. Es la comprobación de antes de desplegar.
#   · En CI (solo se clona este repositorio, `../SQL` no existe) no hay contra
#     qué comparar, así que verifica lo que sí puede: que `database/` está y es
#     coherente. Eso captura el fallo que de verdad importa allí — que alguien
#     borre o vacíe la copia versionada y el despliegue se quede sin esquema.
# =========================================================================
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# El repositorio del modelo, hermano de éste. `MODEL_REPO` permite apuntar a
# otra ruta sin editar el script (CI, un clon en otro sitio).
model_root="${MODEL_REPO:-$(cd "$repo_root/.." && pwd)/mantra-core-health-model}"

mode="sync"
if [[ "${1:-}" == "--check" ]]; then
    mode="check"
elif [[ $# -gt 0 ]]; then
    echo "uso: $0 [--check]" >&2
    exit 2
fi

# `--delete` es deliberado: un archivo que se borró del origen tiene que
# desaparecer también de la copia, o la base de un despliegue aplicaría DDL que
# el modelo ya retiró.
rsync_flags=(-a --delete --exclude '.DS_Store' --exclude '__pycache__/' --exclude '*.pyc')

status=0
for tree in SQL NoSQL; do
    source_dir="$model_root/$tree"
    target_dir="$repo_root/database/$tree"

    if [[ ! -d "$source_dir" ]]; then
        if [[ "$mode" == "sync" ]]; then
            echo "!!! No existe $source_dir." >&2
            echo "    El DDL canónico vive en el repositorio del modelo. Clonarlo como" >&2
            echo "    hermano de éste:" >&2
            echo "      gh repo clone mantra-core-technologies/mantra-core-health-model" >&2
            echo "    o apuntar a donde esté con MODEL_REPO=/ruta/al/modelo." >&2
            exit 1
        fi

        # Modo comprobación sin origen: es el caso de CI. Se verifica que la
        # copia versionada existe y tiene contenido real, que es lo único
        # comprobable aquí y el fallo que rompería el despliegue.
        echo "=== $source_dir no está (clon sin el repositorio del modelo): no hay con qué comparar"
        if [[ ! -d "$target_dir" ]]; then
            echo "!!! ...y database/$tree tampoco existe. El despliegue arrancaría con" >&2
            echo "    /init/$tree vacío: base sin tablas y 500 en la primera escritura." >&2
            status=1
            continue
        fi
        archivos="$(find "$target_dir" -type f -name '*.sql' -o -type f -name '*.json' | wc -l | tr -d ' ')"
        if [[ "$archivos" -lt 10 ]]; then
            echo "!!! database/$tree tiene solo $archivos archivos: la copia está incompleta." >&2
            status=1
        else
            echo "=== database/$tree presente ($archivos archivos)"
        fi
        continue
    fi

    if [[ "$mode" == "check" ]]; then
        # `-n` (dry-run) + `-i` (itemize): rsync lista lo que cambiaría sin
        # tocar nada. Salida vacía = las dos copias coinciden.
        diff_output="$(rsync "${rsync_flags[@]}" -ni "$source_dir/" "$target_dir/")"
        if [[ -n "$diff_output" ]]; then
            echo "!!! database/$tree está desincronizado con $tree/:" >&2
            echo "$diff_output" >&2
            echo "    Ejecutar: bash scripts/db/vendor-ddl.sh" >&2
            status=1
        else
            echo "=== database/$tree al día"
        fi
    else
        mkdir -p "$target_dir"
        rsync "${rsync_flags[@]}" "$source_dir/" "$target_dir/"
        echo ">>> database/$tree sincronizado desde $source_dir"
    fi
done

exit "$status"
