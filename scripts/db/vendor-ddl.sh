#!/usr/bin/env bash
# =========================================================================
# Mantra Core Technologies · ALOVIDA
# Sincroniza el DDL canónico del workspace (`../SQL`, `../NoSQL`) con la copia
# versionada del repositorio (`database/SQL`, `database/NoSQL`).
#
# POR QUÉ EXISTE
# --------------
# El esquema relacional se genera y se edita en `~/…/alovida/SQL`, que es una
# carpeta HERMANA de este repositorio y **no es un repositorio git**. Eso
# funciona mientras todo el mundo trabaja en la misma máquina, y se rompe en el
# momento en que alguien despliega: una plataforma de despliegue (Coolify, CI,
# un VPS) clona ESTE repositorio y nada más. Sin la copia de `database/`, el
# contenedor de inicialización arranca con `/init/SQL` vacío, la base queda sin
# tablas y la aplicación responde 500 en la primera escritura.
#
# `docker-compose.yml` (desarrollo local) sigue montando `../SQL` para que quien
# edita el DDL vea el efecto sin copiar nada. `docker-compose.coolify.yml`
# (despliegue) monta `./database/SQL`. Este script es el puente entre los dos, y
# `--check` es la comprobación que impide desplegar una copia atrasada.
#
#   bash scripts/db/vendor-ddl.sh            # copia ../SQL y ../NoSQL a database/
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
workspace_root="$(cd "$repo_root/.." && pwd)"

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
    source_dir="$workspace_root/$tree"
    target_dir="$repo_root/database/$tree"

    if [[ ! -d "$source_dir" ]]; then
        if [[ "$mode" == "sync" ]]; then
            echo "!!! No existe $source_dir." >&2
            echo "    El DDL canónico vive fuera del repositorio; sin él no hay nada que" >&2
            echo "    sincronizar. Clonar/copiar el workspace completo, no solo este repo." >&2
            exit 1
        fi

        # Modo comprobación sin origen: es el caso de CI. Se verifica que la
        # copia versionada existe y tiene contenido real, que es lo único
        # comprobable aquí y el fallo que rompería el despliegue.
        echo "=== $source_dir no está (clon sin el workspace): no hay con qué comparar"
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
