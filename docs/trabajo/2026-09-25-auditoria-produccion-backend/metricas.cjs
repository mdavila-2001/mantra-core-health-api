// Medición de superficie y tamaño, no sustituye cobertura ni análisis semántico.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const ts = require('typescript');
const files = cp.execFileSync('rg', ['--files', 'src', '-g', '*.ts'], { encoding: 'utf8' }).trim().split(/\r?\n/);
const sizes = [];
const unsafe = { anyAssertions: 0, tsIgnore: 0 };
let endpoints = 0;
for (const file of files) {
  if (file.endsWith('.spec.ts') || file.includes(`${path.sep}entities${path.sep}`)) continue;
  const source = fs.readFileSync(file, 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  let decisions = 0;
  function visit(n) {
    if (ts.isIfStatement(n) || ts.isConditionalExpression(n) || ts.isCaseClause(n) || ts.isForStatement(n) || ts.isForOfStatement(n) || ts.isWhileStatement(n) || ts.isCatchClause(n)) decisions++;
    if (ts.isAsExpression(n) && n.type.kind === ts.SyntaxKind.AnyKeyword) unsafe.anyAssertions++;
    if (ts.isDecorator(n) && ts.isCallExpression(n.expression) && /^(Get|Post|Put|Patch|Delete|Options|Head|All)$/.test(n.expression.expression.getText(ast))) endpoints++;
    ts.forEachChild(n, visit);
  }
  visit(ast);
  unsafe.tsIgnore += (source.match(/@ts-ignore\b/g) || []).length;
  sizes.push({ file, lines: source.split('\n').length, decisions });
}
console.log(JSON.stringify({ tsFiles: files.length, suites: files.filter(f => f.endsWith('.spec.ts')).length,
  controllers: files.filter(f => f.endsWith('.controller.ts')).length, httpMethodDecorators: endpoints,
  moduleDirectories: fs.readdirSync('src/modules').filter(n => fs.statSync(path.join('src/modules', n)).isDirectory()).length,
  unsafe, largestRuntimeFiles: sizes.sort((a,b) => b.lines-a.lines).slice(0,15),
  mostBranchingFiles: [...sizes].sort((a,b) => b.decisions-a.decisions).slice(0,10),
  note: 'decision counts are AST decision nodes per file, not a calibrated complexity score; comments count toward lines'
}, null, 2));
