import json
import sys
import load_seeds

cfg = load_seeds.load_config()
if cfg['POSTGRES_DB'] != 'alovida_dev':
    raise SystemExit('Este complemento sólo admite la base alovida_dev')
if sys.argv[1] == 'buscador':
    package = json.loads((load_seeds.GENERALES_DIR / '57_search_platform.seeds.json').read_text())
    report = load_seeds.Report()
    for index in ['provider_directory_search_docs', 'organization_directory_search_docs']:
        docs = []
        for original in package['mock']['records'][index]:
            geo = original.get('geo')
            if isinstance(geo, dict) and set(geo) != {'lat', 'lon'}:
                doc = dict(original)
                doc.pop('geo')
                docs.append(doc)
        imported = load_seeds.opensearch_bulk(cfg['OPENSEARCH_NODE'], index, docs, 'template_code', report)
        assert imported == len(docs) and not report.warnings
        print(index, ':', imported, 'documentos importados; ubicación ausente en origen, campo geo omitido')
elif sys.argv[1] == 'restaurar-directorio':
    package=json.loads((load_seeds.GENERALES_DIR/'19_community.seeds.json').read_text())
    source={row['id']:row for row in package['boot']['records']['public_profiles']}
    conn=load_seeds.connect_pg(cfg)
    try:
        ids=conn.execute('SELECT p.id FROM community.public_profiles p JOIN profiles.health_practitioner_profiles h ON h.profile_id=p.target_id').fetchall()
        originals=[source[str(row[0])] for row in ids if str(row[0]) in source]
        report=load_seeds.Report()
        load_seeds.insert_records(conn,'community','public_profiles',originals,report,refresh=True)
        conn.commit()
        print('Perfiles institucionales originales restaurados:',len(originals))
    finally:
        conn.close()
else:
    raise SystemExit('Fase desconocida')
