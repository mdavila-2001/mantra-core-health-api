import load_seeds
cfg=load_seeds.load_config()
if cfg['POSTGRES_DB'] != 'alovida_dev':
    raise SystemExit('Este complemento sólo admite la base alovida_dev')
conn=load_seeds.connect_pg(cfg)
report=load_seeds.Report()
try:
    tables=conn.execute("SELECT DISTINCT n.nspname, t.relname FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE c.contype='f' AND n.nspname NOT LIKE '\\_timescaledb%' AND n.nspname NOT IN ('pg_catalog','information_schema')").fetchall()
    report.touched_tables.update(tables)
    load_seeds.verify_foreign_keys(conn,report)
    if report.warnings:
        report.print_summary()
        raise SystemExit(1)
    print('Integridad relacional: 0 referencias huérfanas')
finally:
    conn.close()
