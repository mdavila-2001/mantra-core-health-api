set -e
S=/tmp/claude-0/-home-user-mantra-core-health-api/2203ffee-49cb-5450-8fd4-b87d147b9348/scratchpad
export DB_HOST=127.0.0.1 DB_PORT=5544 DB_USER=mantra DB_PASSWORD= DB_NAME=integration_scratch
echo '# Base de integración: catálogo real de seed-diseases (PR #688, snapshot f7f84be1) + este corpus'
cd /var/tmp/wt-diseases
echo '$ sh tools/terminology-import/diseases/test/disposable-db/fresh-db.sh   (de #688)'
sh tools/terminology-import/diseases/test/disposable-db/fresh-db.sh 2>&1 | tail -1
echo '$ node --max-old-space-size=8000 tools/terminology-import/diseases/load-catalog.mjs --from-snapshot --systems omim,orphanet,decipher,mondo,doid,mesh'
node --max-old-space-size=8000 tools/terminology-import/diseases/load-catalog.mjs --from-snapshot --systems omim,orphanet,decipher,mondo,doid,mesh > /dev/null 2>&1
psql -h 127.0.0.1 -p 5544 -U mantra -d integration_scratch -Atc "select cs.internal_code, count(*) from terminology.catalog_concepts cc join terminology.code_system_versions v on v.id=cc.code_system_version_id join terminology.code_systems cs on cs.id=v.code_system_id group by 1 order by 1"
cd /home/user/mantra-core-health-api
echo '$ node evidencia/andamio/seed-missing-internal.mjs integration_scratch'
node $S/seed-missing-internal.mjs integration_scratch
for i in 1 2; do echo "\$ load-symptoms.mjs --apply   (corrida $i)"; T=$(date +%s); node tools/terminology-import/symptoms/load-symptoms.mjs --apply | grep '^\[load\]'; echo "($(( $(date +%s)-T )) s)"; done
echo '$ load-disease-phenotypes.mjs --apply   (sin la tabla propuesta)'
node tools/terminology-import/symptoms/load-disease-phenotypes.mjs --apply 2>&1 | grep BLOQ || true
echo '$ psql -f tools/terminology-import/symptoms/proposal/concept_relationship_evidence.sql   (sólo en esta base desechable)'
psql -q -h 127.0.0.1 -p 5544 -U mantra -d integration_scratch -f tools/terminology-import/symptoms/proposal/concept_relationship_evidence.sql
for s in hpoa mondo doid hpo-common-disease; do echo "\$ load-disease-phenotypes.mjs --check --sources $s"; node tools/terminology-import/symptoms/load-disease-phenotypes.mjs --check --sources $s | sed -n '2,60p'; done
for i in 1 2; do echo "\$ load-disease-phenotypes.mjs --apply   (corrida $i)"; T=$(date +%s); node tools/terminology-import/symptoms/load-disease-phenotypes.mjs --apply | tail -8; echo "($(( $(date +%s)-T )) s)"; done
