import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DiagnosticSeverity, Parser } from '@asyncapi/parser';

const path = resolve(process.argv[2] ?? 'asyncapi/asyncapi.yaml');
const source = readFileSync(path, 'utf8');
const { document, diagnostics } = await new Parser().parse(source, {
  source: path,
});

for (const diagnostic of diagnostics) {
  const severity =
    diagnostic.severity === DiagnosticSeverity.Error ? 'error' : 'warning';
  const location = diagnostic.range
    ? `${diagnostic.range.start.line + 1}:${diagnostic.range.start.character + 1}`
    : '?:?';
  console.error(`${path}:${location} ${severity} ${diagnostic.code}: ${diagnostic.message}`);
}

const errors = diagnostics.filter(
  (diagnostic) => diagnostic.severity === DiagnosticSeverity.Error,
);
if (!document || errors.length > 0) {
  console.error(`AsyncAPI inválido: ${errors.length} error(es).`);
  process.exit(1);
}

console.log(
  `AsyncAPI válido: ${diagnostics.length - errors.length} advertencia(s), 0 errores.`,
);
