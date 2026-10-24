set -e
S=/tmp/claude-0/-home-user-mantra-core-health-api/2203ffee-49cb-5450-8fd4-b87d147b9348/scratchpad
cd /home/user/mantra-core-health-api
P="psql -q -v ON_ERROR_STOP=1 -h 127.0.0.1 -p 5544 -U mantra"
$P -d postgres -c "drop database if exists symptoms_scratch" -c "create database symptoms_scratch"
for f in database/SQL/00_shared/*.sql database/SQL/03_terminology/0[1-4]_*.sql; do $P -d symptoms_scratch -f $f >/dev/null 2>&1; done
node $S/seed-scratch.mjs symptoms_scratch --with-excluded
export DB_HOST=127.0.0.1 DB_PORT=5544 DB_USER=mantra DB_PASSWORD= DB_NAME=symptoms_scratch
echo "### terms run 1"; T=$(date +%s); node tools/terminology-import/symptoms/load-symptoms.mjs --apply --glossary | grep '^\[load\]'; echo "($(( $(date +%s)-T )) s)"
echo "### terms run 2"; T=$(date +%s); node tools/terminology-import/symptoms/load-symptoms.mjs --apply --glossary | grep '^\[load\]'; echo "($(( $(date +%s)-T )) s)"
echo "### relations without model"; T=$(date +%s); node tools/terminology-import/symptoms/load-disease-phenotypes.mjs --apply 2>&1 | grep BLOQ || true; echo "($(( $(date +%s)-T )) s)"
$P -d symptoms_scratch -f tools/terminology-import/symptoms/proposal/concept_relationship_evidence.sql
node $S/seed-scratch-mondo.mjs
echo "### relations run 1"; T=$(date +%s); node tools/terminology-import/symptoms/load-disease-phenotypes.mjs --apply | tail -12; echo "($(( $(date +%s)-T )) s)"
echo "### relations run 2"; T=$(date +%s); node tools/terminology-import/symptoms/load-disease-phenotypes.mjs --apply | tail -8; echo "($(( $(date +%s)-T )) s)"
