import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const ignored = new Set([
  '.git',
  'node_modules',
  'dist',
  'coverage',
  'graphify-out',
]);
const sourceExtensions = new Set(['.ts', '.mts', '.cts']);

function walk(directory, result = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute, result);
    else result.push(absolute);
  }
  return result;
}

function words(identifier) {
  return identifier
    .replace(/Dto$/, ' DTO')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLocaleLowerCase('es');
}

function declarationName(node) {
  if (node.name && ts.isIdentifier(node.name)) return node.name.text;
  if (node.name && ts.isStringLiteral(node.name)) return node.name.text;
  return ts.isConstructorDeclaration(node) ? 'constructor' : 'declaración';
}

function hasDocumentation(source, node) {
  const fullStart = node.getFullStart();
  const start = node.getStart(source);
  return source.text.slice(fullStart, start).includes('/**');
}

function indentationAt(text, position) {
  const lineStart = text.lastIndexOf('\n', position - 1) + 1;
  return text.slice(lineStart, position).match(/^\s*/)?.[0] ?? '';
}

function descriptionFor(node, name, relativeFile) {
  const label = words(name);
  if (ts.isConstructorDeclaration(node))
    return 'Inicializa la instancia y sus dependencias.';
  if (ts.isClassDeclaration(node)) {
    if (name.endsWith('Controller'))
      return `Expone las operaciones HTTP de ${label.replace(/ controller$/, '')}.`;
    if (name.endsWith('Service'))
      return `Orquesta las reglas de negocio de ${label.replace(/ service$/, '')}.`;
    if (name.endsWith('Repository'))
      return `Centraliza el acceso persistente de ${label.replace(/ repository$/, '')}.`;
    if (name.endsWith('Module'))
      return `Configura las dependencias NestJS de ${label.replace(/ module$/, '')}.`;
    if (name.endsWith('Dto'))
      return `Define el contrato validado para ${label.replace(/ dto$/, '')}.`;
    if (relativeFile.includes('/entities/')) {
      const table = path.basename(relativeFile).replace(/\.entity\.ts$/, '');
      return `Mapea la entidad persistente asociada a \`${table}\`.`;
    }
    return `Implementa la responsabilidad de ${label}.`;
  }
  if (ts.isInterfaceDeclaration(node))
    return `Describe el contrato estructural de ${label}.`;
  if (ts.isTypeAliasDeclaration(node))
    return `Define el tipo de dominio ${label}.`;
  if (ts.isEnumDeclaration(node))
    return `Enumera los valores admitidos para ${label}.`;
  if (ts.isPropertyDeclaration(node) || ts.isPropertySignature(node)) {
    if (name === 'id') return 'Identificador único de la instancia.';
    if (name === 'createdAt') return 'Fecha y hora en que se creó el registro.';
    if (name === 'updatedAt') return 'Fecha y hora de la última actualización.';
    if (name === 'deletedAt')
      return 'Fecha y hora de la eliminación lógica, si corresponde.';
    if (name === 'rowVersion')
      return 'Versión usada para controlar actualizaciones concurrentes.';
    if (/Id$/.test(name))
      return `Identificador asociado a ${label.replace(/ id$/, '')}.`;
    return `Valor de ${label} mantenido por la instancia.`;
  }
  if (ts.isGetAccessorDeclaration(node)) return `Obtiene ${label}.`;
  if (ts.isSetAccessorDeclaration(node)) return `Actualiza ${label}.`;
  if (name === 'build' && relativeFile.endsWith('.spec.ts'))
    return 'Construye el sistema bajo prueba con dependencias controladas.';
  if (/^(find|get|load|list|search|resolve|read|fetch|has|is|can)/.test(name))
    return `Consulta ${label}.`;
  if (/^(create|add|register|provision|issue|build|generate)/.test(name))
    return `Crea ${label}.`;
  if (/^(update|set|change|touch|assign|link|connect)/.test(name))
    return `Actualiza ${label}.`;
  if (/^(delete|remove|revoke|cancel|close|disable)/.test(name))
    return `Elimina o desactiva ${label}.`;
  if (/^(validate|assert|ensure|check)/.test(name)) return `Valida ${label}.`;
  if (/^(map|to|serialize|transform|convert)/.test(name))
    return `Transforma ${label}.`;
  return `Ejecuta la operación ${label}.`;
}

function parameterDescription(parameter) {
  const name = declarationName(parameter);
  if (name === 'dto') return 'Datos validados de la operación.';
  if (name === 'actor' || name === 'user')
    return 'Usuario autenticado que ejecuta la operación.';
  if (name === 'em' || name === 'tx')
    return 'Contexto de persistencia o transacción activa.';
  if (/id$/i.test(name))
    return `Identificador de ${words(name).replace(/ id$/, '')}.`;
  return `Valor de ${words(name)} requerido por la operación.`;
}

function buildDocumentation(source, node, relativeFile) {
  const name = declarationName(node);
  const lines = ['/**', ` * ${descriptionFor(node, name, relativeFile)}`];
  const parameters = node.parameters ?? [];
  if (parameters.length) {
    lines.push(' *');
    for (const parameter of parameters) {
      lines.push(
        ` * @param ${declarationName(parameter)} - ${parameterDescription(parameter)}`,
      );
    }
  }
  const functionLike =
    ts.isFunctionLike(node) && !ts.isConstructorDeclaration(node);
  if (functionLike) {
    const returnType = node.type?.getText(source) ?? '';
    if (
      returnType !== 'void' &&
      returnType !== 'Promise<void>' &&
      name !== 'constructor'
    ) {
      lines.push(
        ` * @returns Resultado de ${words(name)}${returnType ? ` conforme al contrato \`${returnType}\`` : ''}.`,
      );
    }
    if (node.body && node.body.getText(source).includes('throw ')) {
      lines.push(
        ' * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.',
      );
    }
  }
  lines.push(' */');
  return lines;
}

function shouldDocument(node) {
  return (
    ts.isClassDeclaration(node) ||
    ts.isInterfaceDeclaration(node) ||
    ts.isTypeAliasDeclaration(node) ||
    ts.isEnumDeclaration(node) ||
    ts.isFunctionDeclaration(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isMethodSignature(node) ||
    ts.isConstructorDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node) ||
    ts.isPropertyDeclaration(node) ||
    ts.isPropertySignature(node)
  );
}

function namedArrowStatement(node) {
  if (
    !ts.isVariableStatement(node) ||
    node.declarationList.declarations.length !== 1
  )
    return undefined;
  const declaration = node.declarationList.declarations[0];
  if (!ts.isIdentifier(declaration.name) || !declaration.initializer)
    return undefined;
  if (
    !ts.isArrowFunction(declaration.initializer) &&
    !ts.isFunctionExpression(declaration.initializer)
  )
    return undefined;
  return { name: declaration.name.text, functionNode: declaration.initializer };
}

function refineGeneratedText(text) {
  return text
    .replace(
      / \* Representa la entidad persistente ([^.]+)\./g,
      (_match, table) =>
        ` * Mapea la entidad persistente asociada a \`${table.replace(/ /g, '_')}\`.`,
    )
    .replace(/ \* Almacena id\./g, ' * Identificador único de la instancia.')
    .replace(
      / \* Almacena created at\./g,
      ' * Fecha y hora en que se creó el registro.',
    )
    .replace(
      / \* Almacena updated at\./g,
      ' * Fecha y hora de la última actualización.',
    )
    .replace(
      / \* Almacena deleted at\./g,
      ' * Fecha y hora de la eliminación lógica, si corresponde.',
    )
    .replace(
      / \* Almacena row version\./g,
      ' * Versión usada para controlar actualizaciones concurrentes.',
    )
    .replace(/ \* Almacena ([^.]+) id\./g, ' * Identificador asociado a $1.')
    .replace(
      / \* Almacena ([^.]+)\./g,
      ' * Valor de $1 mantenido por la instancia.',
    )
    .replace(
      / \* Crea build\./g,
      ' * Construye el sistema bajo prueba con dependencias controladas.',
    );
}

function documentSource(file) {
  const text = fs.readFileSync(file, 'utf8');
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const relativeFile = path.relative(root, file).split(path.sep).join('/');
  const insertions = [];
  function visit(node) {
    if (shouldDocument(node) && !hasDocumentation(source, node)) {
      const position = node.getStart(source);
      const indent = indentationAt(text, position);
      const comment = buildDocumentation(source, node, relativeFile)
        .map((line) => indent + line)
        .join('\n');
      insertions.push({ position, value: `${comment}\n` });
    }
    const arrow = namedArrowStatement(node);
    if (arrow && !hasDocumentation(source, node)) {
      const position = node.getStart(source);
      const indent = indentationAt(text, position);
      const proxy = {
        ...arrow.functionNode,
        name: ts.factory.createIdentifier(arrow.name),
      };
      const comment = buildDocumentation(source, proxy, relativeFile)
        .map((line) => indent + line)
        .join('\n');
      insertions.push({ position, value: `${comment}\n` });
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  let output = text;
  for (const insertion of insertions.sort((a, b) => b.position - a.position)) {
    output =
      output.slice(0, insertion.position) +
      insertion.value +
      output.slice(insertion.position);
  }
  output = refineGeneratedText(output);
  if (output !== text) fs.writeFileSync(file, output);
  return insertions.length;
}

const folderPurpose = {
  controllers:
    'Adaptadores HTTP que validan solicitudes, aplican autorización y delegan la lógica en servicios.',
  dto: 'Contratos de entrada y salida, validación y documentación de la API.',
  entities: 'Entidades y relaciones que representan el modelo persistente.',
  repositories:
    'Consultas y operaciones de persistencia aisladas de la lógica de negocio.',
  services: 'Casos de uso, reglas de negocio y coordinación transaccional.',
  constants: 'Constantes compartidas y vocabulario estable del dominio.',
  guards: 'Controles de autenticación y autorización previos a cada operación.',
  decorators: 'Decoradores reutilizables y metadatos declarativos.',
  filters: 'Traducción centralizada de errores a respuestas de transporte.',
  interceptors:
    'Comportamiento transversal aplicado antes o después de una operación.',
  middleware:
    'Procesamiento transversal de solicitudes antes del enrutamiento.',
  providers: 'Integraciones y proveedores inyectables de infraestructura.',
  migrations: 'Cambios versionados y reproducibles del esquema de datos.',
  test: 'Pruebas automatizadas, configuración y utilidades de verificación.',
  tests: 'Pruebas automatizadas, configuración y utilidades de verificación.',
  tools:
    'Herramientas de mantenimiento, auditoría y automatización del repositorio.',
};

function describeFile(name) {
  if (name === 'index.ts') return 'Punto de exportación pública de la carpeta.';
  if (name.endsWith('.spec.ts'))
    return 'Pruebas unitarias del componente homónimo.';
  if (name.endsWith('.entity.ts'))
    return 'Mapeo de una entidad persistente y sus relaciones.';
  if (name.endsWith('.controller.ts'))
    return 'Endpoints HTTP y adaptación del transporte.';
  if (name.endsWith('.service.ts')) return 'Casos de uso y reglas de negocio.';
  if (name.endsWith('.repository.ts'))
    return 'Consultas y operaciones de persistencia.';
  if (name.endsWith('.dto.ts'))
    return 'Contratos validados de entrada y salida.';
  if (name.endsWith('.module.ts'))
    return 'Composición de dependencias del módulo NestJS.';
  if (name.endsWith('.config.ts'))
    return 'Configuración tipada del componente.';
  if (name.endsWith('.json'))
    return 'Configuración o datos estructurados de soporte.';
  if (name.endsWith('.mjs') || name.endsWith('.js'))
    return 'Automatización ejecutable de mantenimiento.';
  return 'Implementación o recurso de soporte de esta carpeta.';
}

function titleFor(relative) {
  if (!relative || relative === '.') return 'Guía del repositorio';
  return relative
    .split(path.sep)
    .map((part) => part.replace(/[_-]/g, ' '))
    .join(' / ');
}

function createReadme(directory) {
  const readme = path.join(directory, 'README.md');
  if (fs.existsSync(readme)) return false;
  const entries = fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => !ignored.has(entry.name));
  if (!entries.length) return false;
  const relative = path.relative(root, directory) || '.';
  const basename = path.basename(directory);
  const purpose =
    folderPurpose[basename] ??
    `Agrupa los componentes relacionados con **${words(basename)}** y mantiene cohesionada esta responsabilidad del sistema.`;
  const files = entries
    .filter((entry) => entry.isFile() && entry.name !== 'README.md')
    .sort((a, b) => a.name.localeCompare(b.name));
  const folders = entries
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));
  const lines = [`# ${titleFor(relative)}`, '', purpose, '', '## Contenido'];
  if (!files.length && !folders.length)
    lines.push(
      '',
      'Esta carpeta no contiene artefactos mantenidos actualmente.',
    );
  if (folders.length) {
    lines.push('', '### Subcarpetas', '');
    for (const folder of folders)
      lines.push(
        `- [\`${folder.name}/\`](./${folder.name}/README.md): ${folderPurpose[folder.name] ?? `componentes de ${words(folder.name)}.`}`,
      );
  }
  if (files.length) {
    lines.push(
      '',
      '### Archivos',
      '',
      '| Archivo | Responsabilidad |',
      '| --- | --- |',
    );
    for (const file of files)
      lines.push(`| \`${file.name}\` | ${describeFile(file.name)} |`);
  }
  lines.push(
    '',
    '## Criterios de mantenimiento',
    '',
    '- Mantener las reglas de negocio fuera de los adaptadores de transporte.',
    '- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.',
    '- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.',
    '',
  );
  fs.writeFileSync(readme, lines.join('\n'));
  return true;
}

const files = walk(root);
let comments = 0;
for (const file of files) {
  if (sourceExtensions.has(path.extname(file)) && !file.endsWith('.d.ts'))
    comments += documentSource(file);
}

const directories = [...new Set(files.map((file) => path.dirname(file)))].sort(
  (a, b) => b.length - a.length,
);
let readmes = 0;
for (const directory of directories) if (createReadme(directory)) readmes += 1;

console.log(
  JSON.stringify(
    { documentedDeclarations: comments, createdReadmes: readmes },
    null,
    2,
  ),
);
