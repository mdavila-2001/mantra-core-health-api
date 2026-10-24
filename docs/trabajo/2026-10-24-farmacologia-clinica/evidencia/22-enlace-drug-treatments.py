# Enlace POR CÓDIGO entre los tratamientos farmacológicos (data/ de drug-treatments, en dev) y las
# monografías de farmacología clínica. Sin base: lee los dos NDJSON. drug-treatments no trae ATC;
# trae RXCUI y UNII. Un fármaco enlaza si alguno de sus RXCUI es un ingrediente (TTY IN) del puente
# RxNav de una monografía, o alguno de sus UNII es el de una monografía de UN solo ingrediente.
# Uso: python3 -I 22-enlace-drug-treatments.py <monographs.ndjson> <dir data/ de drug-treatments>
import gzip, json, glob, sys
rx2atc, unii2atc = {}, {}
with open(sys.argv[1]) as f:
    for l in f:
        m = json.loads(l); r = m.get('rxnorm') or {}
        for c in r.get('rxcuis') or []:
            if c.get('tty') == 'IN': rx2atc.setdefault(c['rxcui'], set()).add(m['code'])
        if len(r.get('ingredients') or []) == 1:
            for u in r.get('unii') or []: unii2atc.setdefault(u, set()).add(m['code'])
drugs = {}
for f in sorted(glob.glob(sys.argv[2] + '/drug-treatments-*.ndjson.gz')):
    for l in gzip.open(f, 'rt'):
        r = json.loads(l); codes = r['drug'].get('codes', []) + (r.get('crosswalk') or {}).get('drug', [])
        d = drugs.setdefault(json.dumps(r['drug'].get('codes'), sort_keys=True), {'rx': set(), 'unii': set(), 'rows': 0}); d['rows'] += 1
        for c in codes:
            if c['system'] == 'RXCUI': d['rx'].add(c['code'])
            if c['system'] == 'UNII': d['unii'].add(c['code'])
s = dict(drugs=len(drugs), rows=0, withRxcui=0, withUnii=0, linkedByRxcuiIN=0, linkedByUnii=0, linkedAny=0, rowsLinked=0, atc5Reached=set())
for d in drugs.values():
    a = set().union(*[rx2atc.get(x, set()) for x in d['rx']]); b = set().union(*[unii2atc.get(x, set()) for x in d['unii']])
    s['rows'] += d['rows']; s['withRxcui'] += bool(d['rx']); s['withUnii'] += bool(d['unii'])
    s['linkedByRxcuiIN'] += bool(a); s['linkedByUnii'] += bool(b)
    if a or b: s['linkedAny'] += 1; s['rowsLinked'] += d['rows']; s['atc5Reached'] |= a | b
s['atc5Reached'] = len(s['atc5Reached'])
print(json.dumps(s, indent=1))
