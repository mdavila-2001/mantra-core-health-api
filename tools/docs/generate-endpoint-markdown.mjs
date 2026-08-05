import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const ROOT = process.cwd();
const SPEC_PATH = path.join(ROOT, 'openapi', 'openapi.json');
const OUTPUT_DIR = path.join(ROOT, 'openapi', 'endpoints');
const HTTP_METHODS = new Set([
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options',
]);

const spec = JSON.parse(fs.readFileSync(SPEC_PATH, 'utf8'));
const schemas = spec.components?.schemas ?? {};

function walk(dir, predicate, result = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute, predicate, result);
    else if (predicate(absolute)) result.push(absolute);
  }
  return result;
}

function slug(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function md(value) {
  return String(value ?? '')
    .replace(/\r?\n/g, ' ')
    .replace(/\|/g, '\\|')
    .trim();
}

function code(value) {
  return `\`${String(value).replace(/\s+/g, ' ').trim().replace(/`/g, '\\`')}\``;
}

function getDecorators(node) {
  return ts.canHaveDecorators(node) ? (ts.getDecorators(node) ?? []) : [];
}

function decoratorInfo(decorator, sourceFile) {
  const expression = decorator.expression;
  if (ts.isCallExpression(expression)) {
    return {
      name: expression.expression.getText(sourceFile).split('.').at(-1),
      args: expression.arguments.map((arg) => arg.getText(sourceFile)),
      text: expression.getText(sourceFile),
    };
  }
  return {
    name: expression.getText(sourceFile).split('.').at(-1),
    args: [],
    text: expression.getText(sourceFile),
  };
}

function jsDoc(node) {
  const docs = ts.getJSDocCommentsAndTags(node).filter(ts.isJSDoc);
  return docs
    .map((doc) => {
      if (typeof doc.comment === 'string') return doc.comment;
      if (Array.isArray(doc.comment))
        return doc.comment.map((part) => part.text).join('');
      return '';
    })
    .join('\n')
    .replace(/\s+/g, ' ')
    .trim();
}

function literal(text) {
  if (text === undefined) return undefined;
  if (/^['"`][\s\S]*['"`]$/.test(text)) return text.slice(1, -1);
  if (text === 'true') return true;
  if (text === 'false') return false;
  if (text === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
  return text;
}

function parseDecoratorConstraints(decorators) {
  const constraints = {};
  for (const decorator of decorators) {
    const { name, args } = decorator;
    switch (name) {
      case 'IsEmail':
        constraints.format = 'email';
        break;
      case 'IsUUID':
        constraints.format = 'uuid';
        break;
      case 'IsUrl':
      case 'IsURL':
        constraints.format = 'uri';
        break;
      case 'IsDateString':
        constraints.format = 'date-time';
        break;
      case 'IsInt':
        constraints.integer = true;
        break;
      case 'IsPositive':
        constraints.exclusiveMinimum = 0;
        break;
      case 'IsNotEmpty':
        constraints.minLength ??= 1;
        break;
      case 'MinLength':
        constraints.minLength = literal(args[0]);
        break;
      case 'MaxLength':
        constraints.maxLength = literal(args[0]);
        break;
      case 'Length':
        constraints.minLength = literal(args[0]);
        constraints.maxLength = literal(args[1] ?? args[0]);
        break;
      case 'Min':
        constraints.minimum = literal(args[0]);
        break;
      case 'Max':
        constraints.maximum = literal(args[0]);
        break;
      case 'ArrayMinSize':
        constraints.minItems = literal(args[0]);
        break;
      case 'ArrayMaxSize':
        constraints.maxItems = literal(args[0]);
        break;
      case 'Matches':
        constraints.runtimePattern = args[0];
        break;
      case 'IsIn': {
        const values = args[0]
          ?.match(/['"]([^'"]+)['"]/g)
          ?.map((item) => item.slice(1, -1));
        if (values?.length) constraints.enum = values;
        break;
      }
    }
  }
  return constraints;
}

const sourceFiles = walk(
  path.join(ROOT, 'src'),
  (file) => file.endsWith('.ts') && !file.endsWith('.spec.ts'),
);
const classes = new Map();
const controllerMethods = new Map();
const dtoConstraints = new Map();
const sourceClassProperties = new Map();
const sourceTypeAliases = new Map();
const sourceEnums = new Map();

for (const file of sourceFiles) {
  const text = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const relative = path.relative(ROOT, file).replaceAll(path.sep, '/');

  for (const statement of sourceFile.statements) {
    if (ts.isTypeAliasDeclaration(statement)) {
      sourceTypeAliases.set(
        statement.name.text,
        statement.type.getText(sourceFile),
      );
      continue;
    }
    if (ts.isEnumDeclaration(statement)) {
      sourceEnums.set(
        statement.name.text,
        statement.members.map((member) =>
          member.initializer
            ? literal(member.initializer.getText(sourceFile))
            : member.name.getText(sourceFile),
        ),
      );
      continue;
    }
    if (!ts.isClassDeclaration(statement) || !statement.name) continue;
    const className = statement.name.text;
    const methods = new Map();
    const injected = new Map();
    const properties = new Map();
    const sourceProperties = new Map();

    for (const member of statement.members) {
      if (ts.isConstructorDeclaration(member)) {
        for (const parameter of member.parameters) {
          if (!ts.isIdentifier(parameter.name) || !parameter.type) continue;
          injected.set(parameter.name.text, parameter.type.getText(sourceFile));
        }
      }
      if (
        ts.isPropertyDeclaration(member) &&
        member.name &&
        ts.isIdentifier(member.name)
      ) {
        const decorators = getDecorators(member).map((item) =>
          decoratorInfo(item, sourceFile),
        );
        const apiProperty = decorators.find(
          (item) =>
            item.name === 'ApiProperty' || item.name === 'ApiPropertyOptional',
        );
        const apiOptions = apiProperty?.args[0] ?? '';
        const option = (name) => {
          const match = apiOptions.match(
            new RegExp(`${name}\\s*:\\s*(['\"\\\`])([\\s\\S]*?)\\1`),
          );
          return match?.[2];
        };
        const enumValues = apiOptions
          .match(/enum\s*:\s*\[([^\]]*)\]/)?.[1]
          ?.match(/['"]([^'"]+)['"]/g)
          ?.map((item) => item.slice(1, -1));
        properties.set(member.name.text, {
          constraints: parseDecoratorConstraints(decorators),
          decorators,
        });
        sourceProperties.set(member.name.text, {
          typeText: member.type?.getText(sourceFile) ?? 'unknown',
          optional:
            Boolean(member.questionToken) ||
            decorators.some(
              (item) =>
                item.name === 'IsOptional' ||
                item.name === 'ApiPropertyOptional',
            ),
          description: option('description') || jsDoc(member),
          example: option('example'),
          format: option('format'),
          enumValues,
          constraints: parseDecoratorConstraints(decorators),
        });
      }
      if (
        ts.isMethodDeclaration(member) &&
        member.name &&
        ts.isIdentifier(member.name)
      ) {
        methods.set(member.name.text, member);
      }
    }

    classes.set(className, {
      node: statement,
      sourceFile,
      relative,
      methods,
      injected,
      typeParameters:
        statement.typeParameters?.map((item) => item.name.text) ?? [],
    });
    if (properties.size) dtoConstraints.set(className, properties);
    if (sourceProperties.size)
      sourceClassProperties.set(className, sourceProperties);
  }
}

function sourceTypeSchema(typeText, seen = new Set()) {
  let value = typeText.trim();
  const nullable = /\bnull\b/.test(value);
  value = value
    .split('|')
    .map((item) => item.trim())
    .filter((item) => item !== 'null' && item !== 'undefined')
    .join(' | ');

  const literalValues = value
    .match(/(?:^|\|)\s*['"]([^'"]+)['"]/g)
    ?.map((item) => item.replace(/^[|\s'"]+|['"\s]+$/g, ''));
  if (
    literalValues?.length &&
    literalValues.length === value.split('|').length
  ) {
    return { type: 'string', enum: literalValues, nullable };
  }
  if (value.startsWith('{')) {
    const parsed = ts.createSourceFile(
      '__inline_response.ts',
      `type __InlineResponse = ${value};`,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    const alias = parsed.statements.find(ts.isTypeAliasDeclaration);
    if (alias && ts.isTypeLiteralNode(alias.type)) {
      const objectSchema = {
        type: 'object',
        properties: {},
        required: [],
        nullable,
      };
      for (const member of alias.type.members) {
        if (!ts.isPropertySignature(member) || !member.name || !member.type)
          continue;
        const propertyName = member.name
          .getText(parsed)
          .replace(/^['"]|['"]$/g, '');
        const propertySchema = sourceTypeSchema(
          member.type.getText(parsed),
          seen,
        );
        const description = jsDoc(member);
        if (description) propertySchema.description = description;
        objectSchema.properties[propertyName] = propertySchema;
        if (!member.questionToken) objectSchema.required.push(propertyName);
      }
      if (!objectSchema.required.length) delete objectSchema.required;
      return objectSchema;
    }
  }
  const arrayMatch = value.match(/^(?:Array|ReadonlyArray)<([\s\S]+)>$/);
  if (arrayMatch)
    return {
      type: 'array',
      items: sourceTypeSchema(arrayMatch[1], seen),
      nullable,
    };
  if (value.endsWith('[]'))
    return {
      type: 'array',
      items: sourceTypeSchema(value.slice(0, -2), seen),
      nullable,
    };
  if (value === 'string') return { type: 'string', nullable };
  if (value === 'number') return { type: 'number', nullable };
  if (value === 'boolean') return { type: 'boolean', nullable };
  if (value === 'Date')
    return { type: 'string', format: 'date-time', nullable };
  if (
    value === 'unknown' ||
    value === 'any' ||
    value === 'object' ||
    value.startsWith('Record<')
  ) {
    return { type: 'object', additionalProperties: true, nullable };
  }
  if (sourceEnums.has(value))
    return { type: 'string', enum: sourceEnums.get(value), nullable };
  if (sourceTypeAliases.has(value) && !seen.has(value)) {
    return sourceTypeSchema(
      sourceTypeAliases.get(value),
      new Set([...seen, value]),
    );
  }
  if (sourceClassProperties.has(value) || schemas[value])
    return { $ref: `#/components/schemas/${value}` };
  return {
    type: 'object',
    description: `Tipo TypeScript no expandido: ${value}`,
    nullable,
  };
}

// Swagger solo registra modelos alcanzables desde decoradores de request/response.
// Muchos controllers tipan su respuesta pero no usan @ApiOkResponse; se crea un
// esquema documental secundario desde las propiedades reales de esas clases. Los
// esquemas OpenAPI oficiales siempre tienen prioridad y nunca se sobrescriben.
function sourceClassSchema(className, replacements = new Map()) {
  const properties = sourceClassProperties.get(className);
  if (!properties) return undefined;
  const generated = { type: 'object', properties: {}, required: [] };
  for (const [propertyName, metadata] of properties) {
    let typeText = metadata.typeText;
    for (const [parameter, replacement] of replacements) {
      typeText = typeText.replace(
        new RegExp(`\\b${parameter}\\b`, 'g'),
        replacement,
      );
    }
    const propertySchema = {
      ...sourceTypeSchema(typeText),
      ...metadata.constraints,
    };
    if (metadata.description) propertySchema.description = metadata.description;
    if (metadata.example !== undefined)
      propertySchema.example = literal(metadata.example);
    if (metadata.format) propertySchema.format = metadata.format;
    if (metadata.enumValues?.length) propertySchema.enum = metadata.enumValues;
    generated.properties[propertyName] = propertySchema;
    if (!metadata.optional) generated.required.push(propertyName);
  }
  if (!generated.required.length) delete generated.required;
  return generated;
}

for (const [className] of sourceClassProperties) {
  if (schemas[className]) continue;
  const generated = sourceClassSchema(className);
  schemas[className] = generated;
}

function methodCalls(node, sourceFile) {
  const calls = [];
  function visit(current) {
    if (
      ts.isCallExpression(current) &&
      ts.isPropertyAccessExpression(current.expression) &&
      ts.isPropertyAccessExpression(current.expression.expression) &&
      current.expression.expression.expression.kind ===
        ts.SyntaxKind.ThisKeyword
    ) {
      calls.push({
        property: current.expression.expression.name.text,
        method: current.expression.name.text,
        text: current.expression.getText(sourceFile),
      });
    }
    ts.forEachChild(current, visit);
  }
  visit(node);
  return calls;
}

function directThisCalls(node) {
  const calls = [];
  function visit(current) {
    if (
      ts.isCallExpression(current) &&
      ts.isPropertyAccessExpression(current.expression) &&
      current.expression.expression.kind === ts.SyntaxKind.ThisKeyword
    ) {
      calls.push(current.expression.name.text);
    }
    ts.forEachChild(current, visit);
  }
  visit(node);
  return calls;
}

const exceptionCache = new Map();

function extractThrownExceptions(
  className,
  methodName,
  visited = new Set(),
  depth = 0,
) {
  const key = `${className}.${methodName}`;
  if (exceptionCache.has(key)) return exceptionCache.get(key);
  if (visited.has(key) || depth > 5) return [];
  visited.add(key);
  const classInfo = classes.get(className);
  const method = classInfo?.methods.get(methodName);
  if (!classInfo || !method) return [];

  const found = [];
  function visit(node) {
    if (
      ts.isThrowStatement(node) &&
      node.expression &&
      ts.isNewExpression(node.expression)
    ) {
      const exception = node.expression.expression
        .getText(classInfo.sourceFile)
        .split('.')
        .at(-1);
      const message = node.expression.arguments?.[0]?.getText(
        classInfo.sourceFile,
      );
      found.push({
        exception,
        message: literal(message),
        source: classInfo.relative,
      });
    }
    ts.forEachChild(node, visit);
  }
  visit(method);

  for (const helper of directThisCalls(method)) {
    found.push(
      ...extractThrownExceptions(className, helper, visited, depth + 1),
    );
  }
  for (const call of methodCalls(method, classInfo.sourceFile)) {
    const targetClass = classInfo.injected.get(call.property);
    if (targetClass) {
      found.push(
        ...extractThrownExceptions(
          targetClass,
          call.method,
          visited,
          depth + 1,
        ),
      );
    }
  }
  const unique = [
    ...new Map(
      found.map((item) => [
        `${item.exception}:${item.message}:${item.source}`,
        item,
      ]),
    ).values(),
  ];
  exceptionCache.set(key, unique);
  return unique;
}

for (const [className, classInfo] of classes) {
  if (!className.endsWith('Controller')) continue;
  const moduleMatch = classInfo.relative.match(/^src\/modules\/([^/]+)\//);
  const moduleName = moduleMatch?.[1] ?? 'app';
  const classDecorators = getDecorators(classInfo.node).map((item) =>
    decoratorInfo(item, classInfo.sourceFile),
  );

  for (const [methodName, method] of classInfo.methods) {
    const decorators = [
      ...classDecorators,
      ...getDecorators(method).map((item) =>
        decoratorInfo(item, classInfo.sourceFile),
      ),
    ];
    const roles = decorators
      .filter((item) => item.name === 'Roles')
      .flatMap((item) => item.args.map(literal));
    const throttle = decorators.find((item) => item.name === 'Throttle')?.text;
    const isPublic = decorators.some((item) => item.name === 'Public');
    const uuidParams = [];
    for (const parameter of method.parameters) {
      const paramDecorators = getDecorators(parameter).map((item) =>
        decoratorInfo(item, classInfo.sourceFile),
      );
      for (const decorator of paramDecorators) {
        if (
          decorator.name === 'Param' &&
          decorator.text.includes('ParseUUIDPipe')
        ) {
          uuidParams.push(literal(decorator.args[0]));
        }
      }
    }
    const returnType =
      method.type?.getText(classInfo.sourceFile) ?? 'no declarado';
    const calls = methodCalls(method, classInfo.sourceFile);
    const delegates = calls.map((call) => {
      const targetClass = classInfo.injected.get(call.property);
      return targetClass ? `${targetClass}.${call.method}` : call.text;
    });
    const exceptions = [];
    for (const call of calls) {
      const targetClass = classInfo.injected.get(call.property);
      if (targetClass)
        exceptions.push(...extractThrownExceptions(targetClass, call.method));
    }

    controllerMethods.set(`${className}_${methodName}`, {
      className,
      methodName,
      moduleName,
      source: classInfo.relative,
      jsDoc: jsDoc(method),
      returnType,
      roles: [...new Set(roles)],
      throttle,
      isPublic,
      uuidParams: [...new Set(uuidParams)],
      delegates: [...new Set(delegates)],
      exceptions: [
        ...new Map(
          exceptions.map((item) => [`${item.exception}:${item.message}`, item]),
        ).values(),
      ],
    });
  }
}

function dereference(schema) {
  if (!schema) return {};
  if (schema.$ref) return schemas[schema.$ref.split('/').at(-1)] ?? {};
  return schema;
}

function schemaName(schema) {
  return schema?.$ref?.split('/').at(-1);
}

function mergedSchema(schema) {
  if (!schema) return {};
  if (schema.$ref) return mergedSchema(dereference(schema));
  if (schema.allOf) {
    return schema.allOf.reduce(
      (acc, item) => {
        const current = mergedSchema(item);
        return {
          ...acc,
          ...current,
          properties: {
            ...(acc.properties ?? {}),
            ...(current.properties ?? {}),
          },
          required: [
            ...new Set([...(acc.required ?? []), ...(current.required ?? [])]),
          ],
        };
      },
      { ...schema, allOf: undefined },
    );
  }
  return schema;
}

function schemaType(schema) {
  if (!schema) return 'desconocido';
  if (schema.$ref) return schemaName(schema);
  if (schema.oneOf) return schema.oneOf.map(schemaType).join(' | ');
  if (schema.anyOf) return schema.anyOf.map(schemaType).join(' | ');
  if (schema.allOf) return schema.allOf.map(schemaType).join(' & ');
  if (schema.type === 'array') return `array<${schemaType(schema.items)}>`;
  return schema.type ?? (schema.properties ? 'object' : 'desconocido');
}

function runtimeConstraints(ownerName, propertyName) {
  return dtoConstraints.get(ownerName)?.get(propertyName)?.constraints ?? {};
}

function effectiveProperty(ownerName, propertyName, property) {
  return { ...runtimeConstraints(ownerName, propertyName), ...property };
}

function exampleString(name, schema) {
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (schema.enum?.length) return schema.enum[0];
  const lower = name.toLowerCase();
  switch (schema.format) {
    case 'uuid':
      return '00000000-0000-4000-8000-000000000001';
    case 'email':
      return 'usuario@example.com';
    case 'date-time':
      return '2026-07-31T12:00:00.000Z';
    case 'date':
      return '2026-07-31';
    case 'time':
      return '12:00:00';
    case 'uri':
    case 'url':
      return 'https://example.com/recurso';
    case 'binary':
      return '<contenido-binario>';
  }
  if (lower.includes('timezone') || lower.includes('time_zone'))
    return 'America/La_Paz';
  if (lower.includes('currency')) return 'BOB';
  if (lower.includes('country')) return 'BO';
  if (lower.includes('language') || lower.includes('locale')) return 'es-BO';
  if (lower.includes('phone')) return '+59170000000';
  if (lower === 'status') return 'ok';
  if (lower.includes('sha256') || lower.includes('hash')) return 'a'.repeat(64);
  if (lower === 'email' || lower.endsWith('email'))
    return 'usuario@example.com';
  if (lower.endsWith('id') || lower.endsWith('_id'))
    return '00000000-0000-4000-8000-000000000001';
  if (lower.includes('code')) return 'CODIGO_EJEMPLO';
  if (lower.includes('name')) return 'Nombre de ejemplo';
  if (
    lower.includes('description') ||
    lower.includes('reason') ||
    lower.includes('notes')
  ) {
    return 'Texto descriptivo de ejemplo';
  }
  const min = Number.isFinite(schema.minLength) ? schema.minLength : 1;
  const max = Number.isFinite(schema.maxLength) ? schema.maxLength : 80;
  let value = lower.includes('password') ? 'ClaveSegura2026!' : 'valor-ejemplo';
  while (value.length < min) value += 'x';
  return value.slice(0, Math.max(1, max));
}

function exampleForSchema(
  input,
  mode = 'full',
  name = 'value',
  seen = new Set(),
  ownerName,
) {
  if (!input) return null;
  if (input.example !== undefined) return input.example;
  if (input.default !== undefined) return input.default;
  if (input.$ref) {
    const refName = schemaName(input);
    if (seen.has(refName)) return `<${refName}>`;
    return exampleForSchema(
      dereference(input),
      mode,
      name,
      new Set([...seen, refName]),
      refName,
    );
  }
  if (input.oneOf?.length)
    return exampleForSchema(input.oneOf[0], mode, name, seen, ownerName);
  if (input.anyOf?.length)
    return exampleForSchema(input.anyOf[0], mode, name, seen, ownerName);
  const schema = mergedSchema(input);
  if (schema.type === 'array') {
    const count = Math.max(1, schema.minItems ?? 1);
    return Array.from({ length: count }, () =>
      exampleForSchema(schema.items, mode, name, seen, ownerName),
    );
  }
  if (schema.type === 'object' || schema.properties) {
    const result = {};
    const required = new Set(schema.required ?? []);
    for (const [propertyName, rawProperty] of Object.entries(
      schema.properties ?? {},
    )) {
      if (mode === 'minimal' && !required.has(propertyName)) continue;
      const property = effectiveProperty(ownerName, propertyName, rawProperty);
      result[propertyName] = exampleForSchema(
        property,
        mode,
        propertyName,
        seen,
        schemaName(rawProperty),
      );
    }
    if (!Object.keys(result).length && schema.additionalProperties)
      result.clave = 'valor';
    return result;
  }
  if (schema.type === 'integer') return Math.max(schema.minimum ?? 1, 1);
  if (schema.type === 'number') return Math.max(schema.minimum ?? 1, 1);
  if (schema.type === 'boolean') return schema.default ?? true;
  if (schema.type === 'string' || !schema.type)
    return exampleString(name, schema);
  return null;
}

function constraintText(input, ownerName, propertyName) {
  const schema = effectiveProperty(
    ownerName,
    propertyName,
    mergedSchema(input),
  );
  const parts = [];
  if (schema.format) parts.push(`formato ${code(schema.format)}`);
  if (schema.enum?.length)
    parts.push(`valores: ${schema.enum.map(code).join(', ')}`);
  if (schema.minLength !== undefined)
    parts.push(`longitud mínima ${schema.minLength}`);
  if (schema.maxLength !== undefined)
    parts.push(`longitud máxima ${schema.maxLength}`);
  if (schema.minimum !== undefined) parts.push(`mínimo ${schema.minimum}`);
  if (schema.exclusiveMinimum !== undefined)
    parts.push(`mayor que ${schema.exclusiveMinimum}`);
  if (schema.maximum !== undefined) parts.push(`máximo ${schema.maximum}`);
  if (schema.minItems !== undefined)
    parts.push(`mínimo ${schema.minItems} elemento(s)`);
  if (schema.maxItems !== undefined)
    parts.push(`máximo ${schema.maxItems} elemento(s)`);
  if (schema.pattern) parts.push(`patrón ${code(schema.pattern)}`);
  if (schema.runtimePattern)
    parts.push(`patrón runtime ${code(schema.runtimePattern)}`);
  if (schema.uniqueItems) parts.push('elementos únicos');
  if (schema.readOnly) parts.push('solo lectura');
  if (schema.writeOnly) parts.push('solo escritura');
  if (schema.nullable) parts.push('admite null');
  return parts.join('; ') || 'Sin restricción adicional declarada';
}

function fieldRows(
  input,
  ownerName = schemaName(input),
  prefix = '',
  requiredByParent = true,
  seen = new Set(),
  depth = 0,
) {
  if (!input || depth > 6) return [];
  if (input.$ref) {
    const refName = schemaName(input);
    if (seen.has(refName)) return [];
    return fieldRows(
      dereference(input),
      refName,
      prefix,
      requiredByParent,
      new Set([...seen, refName]),
      depth,
    );
  }
  const schema = mergedSchema(input);
  const rows = [];
  const required = new Set(schema.required ?? []);
  for (const [propertyName, rawProperty] of Object.entries(
    schema.properties ?? {},
  )) {
    const property = effectiveProperty(ownerName, propertyName, rawProperty);
    const field = prefix ? `${prefix}.${propertyName}` : propertyName;
    const isRequired = requiredByParent && required.has(propertyName);
    const example = exampleForSchema(
      property,
      'full',
      propertyName,
      seen,
      schemaName(rawProperty),
    );
    rows.push({
      field,
      required: isRequired ? 'Sí' : 'No',
      type: schemaType(property),
      constraints: constraintText(property, ownerName, propertyName),
      description:
        property.description ||
        'Sin descripción específica en el contrato OpenAPI.',
      example:
        typeof example === 'object' ? JSON.stringify(example) : String(example),
    });
    const nested = property.type === 'array' ? property.items : property;
    rows.push(
      ...fieldRows(
        nested,
        schemaName(nested),
        field + (property.type === 'array' ? '[]' : ''),
        isRequired,
        seen,
        depth + 1,
      ),
    );
  }
  return rows;
}

function renderFieldTable(schema, emptyMessage) {
  const rows = fieldRows(schema);
  if (!rows.length) return emptyMessage;
  return [
    '| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |',
    '|---|:---:|---|---|---|---|',
    ...rows.map(
      (row) =>
        `| ${code(row.field)} | ${row.required} | ${code(row.type)} | ${md(row.constraints)} | ${md(row.description)} | ${code(row.example)} |`,
    ),
  ].join('\n');
}

function parameterExample(parameter) {
  const schema = parameter.schema ?? {};
  return exampleForSchema(schema, 'full', parameter.name);
}

function renderParameters(parameters) {
  if (!parameters.length)
    return 'No hay parámetros de ruta, query ni cabeceras específicos de la operación.';
  return [
    '| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |',
    '|---|---|:---:|---|---|---|---|',
    ...parameters.map(
      (parameter) =>
        `| ${code(parameter.name)} | ${parameter.in} | ${parameter.required ? 'Sí' : 'No'} | ${code(schemaType(parameter.schema))} | ${md(constraintText(parameter.schema, '', parameter.name))} | ${md(parameter.description || 'Sin descripción específica en OpenAPI.')} | ${code(typeof parameterExample(parameter) === 'object' ? JSON.stringify(parameterExample(parameter)) : parameterExample(parameter))} |`,
    ),
  ].join('\n');
}

function extractResponseSchema(returnType) {
  if (!returnType || returnType === 'no declarado') return {};
  let normalized = returnType.trim();
  while (/^(Promise|Observable)<[\s\S]+>$/.test(normalized))
    normalized = normalized
      .replace(/^(Promise|Observable)<([\s\S]+)>$/, '$2')
      .trim();
  if (normalized === 'void' || normalized === 'undefined')
    return { void: true, type: normalized };
  const generic = normalized.match(/^(\w+)<([\s\S]+)>$/);
  if (generic && sourceClassProperties.has(generic[1])) {
    const parameters = classes.get(generic[1])?.typeParameters ?? [];
    // Los DTO genéricos del código usan actualmente un parámetro. El split se
    // conserva explícito para no fingir soporte de genéricos anidados múltiples.
    const argumentsList = parameters.length === 1 ? [generic[2].trim()] : [];
    if (argumentsList.length === parameters.length) {
      const replacements = new Map(
        parameters.map((parameter, index) => [parameter, argumentsList[index]]),
      );
      return {
        schema: sourceClassSchema(generic[1], replacements),
        type: normalized,
      };
    }
  }
  const array = normalized.endsWith('[]');
  const candidate = (array ? normalized.slice(0, -2) : normalized)
    .split(/[|&]/)[0]
    .trim()
    .replace(/^Readonly</, '')
    .replace(/>$/, '');
  if (schemas[candidate]) {
    return {
      schema: array
        ? {
            type: 'array',
            items: { $ref: `#/components/schemas/${candidate}` },
          }
        : { $ref: `#/components/schemas/${candidate}` },
      type: normalized,
    };
  }
  if (
    /^(string|number|boolean|Date)$/.test(normalized) ||
    normalized.startsWith('{')
  ) {
    return { schema: sourceTypeSchema(normalized), type: normalized };
  }
  return { type: normalized };
}

function successDescription(status, method) {
  const descriptions = {
    200: 'Operación completada correctamente.',
    201: 'Recurso creado o acción registrada correctamente.',
    202: 'Solicitud aceptada para procesamiento asíncrono.',
    204: 'Operación completada sin cuerpo de respuesta.',
  };
  return (
    descriptions[status] ??
    (method === 'get'
      ? 'Consulta completada correctamente.'
      : 'Operación completada correctamente.')
  );
}

const exceptionContract = {
  UnauthorizedException: [401, 'UNAUTHENTICATED'],
  ResourceNotFoundException: [404, 'NOT_FOUND'],
  NotFoundException: [404, 'NOT_FOUND'],
  ConflictException: [409, 'CONFLICT'],
  ConcurrencyConflictException: [409, 'CONCURRENCY_CONFLICT'],
  PreconditionFailedException: [422, 'PRECONDITION_FAILED'],
  BadRequestException: [400, 'VALIDATION_FAILED'],
  ForbiddenException: [403, 'FORBIDDEN'],
};

function errorRows(operation, source, hasInput) {
  const rows = [];
  const add = (status, errorCode, situation, evidence) => {
    const key = `${status}:${errorCode}:${situation}`;
    if (!rows.some((row) => row.key === key))
      rows.push({ key, status, errorCode, situation, evidence });
  };
  if (hasInput)
    add(
      400,
      'VALIDATION_FAILED',
      'Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.',
      'Pipeline global de validación',
    );
  if ((operation.security ?? []).length)
    add(
      401,
      'UNAUTHENTICATED',
      'JWT Bearer ausente, vencido o inválido.',
      'Guard global de autenticación',
    );
  if (
    (operation.security ?? []).length &&
    (source?.roles.length || source?.moduleName !== 'app')
  ) {
    add(
      403,
      'FORBIDDEN',
      source?.roles.length
        ? `El actor no posee alguno de los roles admitidos: ${source.roles.join(', ')}.`
        : 'El actor no tiene acceso al tenant o alcance exigido por la operación.',
      'Roles/tenant/guards de autorización',
    );
  }
  for (const thrown of source?.exceptions ?? []) {
    const contract = exceptionContract[thrown.exception];
    if (!contract) continue;
    add(
      contract[0],
      contract[1],
      typeof thrown.message === 'string'
        ? thrown.message
        : `El servicio lanza ${thrown.exception}.`,
      `Excepción explícita en ${thrown.source}`,
    );
  }
  if (operation.requestBody)
    add(
      413,
      'PAYLOAD_TOO_LARGE',
      'El body supera el límite global de 1 MB.',
      'Parser JSON/urlencoded global y filtro global de excepciones',
    );
  add(
    429,
    'RATE_LIMITED',
    source?.throttle
      ? `Se excede el límite particular ${source.throttle}.`
      : 'Se exceden 300 solicitudes por 60 segundos para la instancia.',
    'Throttler y filtro global de excepciones',
  );
  add(
    500,
    'INTERNAL',
    'Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno.',
    'Filtro global de excepciones',
  );
  return rows.sort((a, b) => a.status - b.status);
}

function errorExample(route, row) {
  return {
    code: row.errorCode,
    message: row.status >= 500 ? 'Error interno del servidor' : row.situation,
    correlationId: 'req-01J00000000000000000000000',
    timestamp: '2026-07-31T12:00:00.000Z',
    path: route,
  };
}

function renderErrors(operation, source, route, hasInput) {
  const rows = errorRows(operation, source, hasInput);
  const primary =
    rows.find((row) => row.status >= 400 && row.status < 500) ?? rows.at(-1);
  return [
    '| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |',
    '|---:|---|---|---|',
    ...rows.map(
      (row) =>
        `| ${row.status} | ${code(row.errorCode)} | ${md(row.situation)} | ${md(row.evidence)} |`,
    ),
    '',
    'Ejemplo de error normalizado:',
    '',
    '```json',
    JSON.stringify(errorExample(route, primary), null, 2),
    '```',
  ].join('\n');
}

function businessDescription(operation, method) {
  const summary =
    operation.summary ||
    operation.description ||
    `Operación ${method.toUpperCase()}`;
  const verbs = {
    get: 'consultar',
    post: 'ejecutar',
    put: 'reemplazar o registrar',
    patch: 'actualizar parcialmente',
    delete: 'eliminar o desactivar',
  };
  return `Permite al actor autorizado ${verbs[method] ?? 'ejecutar'} el caso de uso «${summary}». El resultado representa el efecto de negocio de esa acción dentro del módulo y respeta el aislamiento por tenant, las reglas de autorización y las invariantes del dominio.`;
}

function cleanJsDoc(value) {
  if (!value || /^(UC|C)-[\w-]+\.?$/.test(value)) return '';
  return value;
}

function requestBody(operation) {
  const entries = Object.entries(operation.requestBody?.content ?? {});
  if (!entries.length) return {};
  const [contentType, media] = entries[0];
  return {
    contentType,
    schema: media.schema,
    required: Boolean(operation.requestBody.required),
  };
}

function resolvedRoute(route, parameters, includeOptional) {
  let result = route;
  const query = [];
  for (const parameter of parameters) {
    if (!includeOptional && !parameter.required) continue;
    const value = parameterExample(parameter);
    if (parameter.in === 'path')
      result = result.replace(
        `{${parameter.name}}`,
        encodeURIComponent(String(value)),
      );
    if (parameter.in === 'query')
      query.push(
        `${encodeURIComponent(parameter.name)}=${encodeURIComponent(String(value))}`,
      );
  }
  return result + (query.length ? `?${query.join('&')}` : '');
}

function renderRequestExample(method, route, operation, source, mode) {
  const parameters = operation.parameters ?? [];
  const body = requestBody(operation);
  const lines = [
    `${method.toUpperCase()} ${resolvedRoute(route, parameters, mode === 'full')} HTTP/1.1`,
    'Host: localhost:3000',
  ];
  if ((operation.security ?? []).length)
    lines.push('Authorization: Bearer <access_token_jwt>');
  for (const parameter of parameters) {
    if (
      parameter.in !== 'header' ||
      (mode === 'minimal' && !parameter.required)
    )
      continue;
    lines.push(`${parameter.name}: ${parameterExample(parameter)}`);
  }
  if (body.schema) {
    lines.push(
      `Content-Type: ${body.contentType}`,
      '',
      JSON.stringify(exampleForSchema(body.schema, mode), null, 2),
    );
  }
  return ['```http', ...lines, '```'].join('\n');
}

function renderSuccess(operation, source, method) {
  const statuses = Object.entries(operation.responses ?? {});
  const responseType = extractResponseSchema(source?.returnType);
  const lines = [
    '| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |',
    '|---:|---|---|---|',
    ...statuses.map(([status, response]) => {
      const numeric = Number(status);
      const description =
        response.description || successDescription(numeric, method);
      return `| ${status} | ${md(description)} | ${code(source?.returnType ?? 'no declarado')} | ${response.content ? 'Sí' : 'No'} |`;
    }),
  ];
  if (responseType.void) {
    lines.push(
      '',
      'La operación no devuelve body según el tipo TypeScript del controlador.',
    );
  } else if (responseType.schema) {
    lines.push(
      '',
      `Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara ${code(responseType.type)}. Ejemplo completo derivado de ese DTO:`,
      '',
      '```json',
      JSON.stringify(exampleForSchema(responseType.schema, 'full'), null, 2),
      '```',
      '',
      'Campos de la respuesta:',
      '',
      renderFieldTable(
        responseType.schema,
        'El DTO de respuesta no declara campos documentables.',
      ),
    );
  } else {
    lines.push(
      '',
      `El controlador declara ${code(responseType.type || source?.returnType || 'un tipo no especificado')}, pero ese tipo no existe como esquema enlazable en ${code('components.schemas')}. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.`,
    );
  }
  lines.push(
    '',
    'En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.',
  );
  return lines.join('\n');
}

function renderEndpoint(endpoint, ordinal) {
  const { route, method, operation, source } = endpoint;
  const body = requestBody(operation);
  const parameters = operation.parameters ?? [];
  const hasInput = Boolean(body.schema || parameters.length);
  const sourceLink = source ? `../../${source.source}` : undefined;
  const systemDetails = [
    `NestJS resuelve ${code(method.toUpperCase() + ' ' + route)} en ${code(operation.operationId)}.`,
    source?.delegates.length
      ? `El controlador delega en ${source.delegates.map(code).join(', ')}.`
      : 'No se detectó una delegación adicional desde el controlador.',
    body.schema
      ? `Valida el body como ${code(schemaName(body.schema) ?? schemaType(body.schema))} y consume ${code(body.contentType)}.`
      : 'No recibe body.',
    source
      ? `El tipo de retorno estático es ${code(source.returnType)}.`
      : 'No se encontró metadato estático adicional del controlador.',
  ].join(' ');
  const restrictions = [];
  restrictions.push(
    (operation.security ?? []).length
      ? 'Requiere `Authorization: Bearer <JWT>`.'
      : 'Endpoint público: no exige JWT según el contrato y `@Public()` del código.',
  );
  if (source?.roles.length)
    restrictions.push(
      `Roles admitidos por ` +
        code('@Roles') +
        `: ${source.roles.map(code).join(', ')}.`,
    );
  if (source?.uuidParams.length)
    restrictions.push(
      `Deben ser UUID válidos: ${source.uuidParams.map(code).join(', ')}.`,
    );
  if (body.schema)
    restrictions.push(
      'El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).',
    );
  restrictions.push(
    source?.throttle
      ? `Rate limit particular: ${code(source.throttle)}.`
      : 'Rate limit global: 300 solicitudes por cada 60 segundos por instancia.',
  );
  restrictions.push(
    'CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.',
  );

  return [
    `## ${ordinal}. ${method.toUpperCase()} ${route}`,
    '',
    `- **Módulo:** ${code(source?.moduleName ?? operation.tags?.[0] ?? 'sin-clasificar')}`,
    `- **Etiqueta OpenAPI:** ${(operation.tags ?? []).map(code).join(', ') || 'Sin etiqueta'}`,
    `- **Nombre:** ${md(operation.summary || operation.operationId)}`,
    `- **Operation ID:** ${code(operation.operationId)}`,
    `- **Autenticación:** ${(operation.security ?? []).length ? 'JWT Bearer obligatoria' : 'Pública'}`,
    sourceLink
      ? `- **Implementación:** [${source.className}.${source.methodName}](${sourceLink})`
      : '- **Implementación:** no localizada automáticamente',
    '',
    '### Descripción de negocio',
    '',
    operation.description || businessDescription(operation, method),
    cleanJsDoc(source?.jsDoc)
      ? `\nContexto declarado en el controlador: ${cleanJsDoc(source.jsDoc)}`
      : '',
    '',
    '### Descripción del sistema',
    '',
    systemDetails,
    '',
    '### Parámetros',
    '',
    renderParameters(parameters),
    '',
    '### Payload mínimo aceptable',
    '',
    body.schema
      ? `Incluye únicamente los campos obligatorios del DTO ${code(schemaName(body.schema) ?? schemaType(body.schema))}; los campos opcionales se omiten.`
      : 'La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.',
    '',
    renderRequestExample(method, route, operation, source, 'minimal'),
    '',
    '### Restricciones a considerar',
    '',
    ...restrictions.map((item) => `- ${item}`),
    '',
    body.schema
      ? renderFieldTable(
          body.schema,
          'El body no declara campos documentables.',
        )
      : '',
    '',
    '### Payload completo de ejemplo',
    '',
    body.schema
      ? 'Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.'
      : 'No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.',
    '',
    renderRequestExample(method, route, operation, source, 'full'),
    '',
    '### Respuestas generales esperadas',
    '',
    renderSuccess(operation, source, method),
    '',
    '### Respuestas de error posibles',
    '',
    renderErrors(operation, source, route, hasInput),
    '',
    '---',
    '',
  ].join('\n');
}

const endpoints = [];
for (const [route, pathItem] of Object.entries(spec.paths ?? {})) {
  for (const [method, operation] of Object.entries(pathItem)) {
    if (!HTTP_METHODS.has(method)) continue;
    const source = controllerMethods.get(operation.operationId.split('__')[0]);
    endpoints.push({
      route,
      method,
      operation,
      source,
      moduleName: source?.moduleName ?? operation.tags?.[0] ?? 'sin-clasificar',
    });
  }
}

const byModule = new Map();
for (const endpoint of endpoints) {
  const list = byModule.get(endpoint.moduleName) ?? [];
  list.push(endpoint);
  byModule.set(endpoint.moduleName, list);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
for (const existing of fs.readdirSync(OUTPUT_DIR)) {
  if (existing.endsWith('.md')) fs.unlinkSync(path.join(OUTPUT_DIR, existing));
}

const indexRows = [];
let documented = 0;
for (const [moduleName, moduleEndpoints] of [...byModule.entries()].sort(
  ([a], [b]) => a.localeCompare(b),
)) {
  moduleEndpoints.sort(
    (a, b) =>
      a.route.localeCompare(b.route) || a.method.localeCompare(b.method),
  );
  const filename = `${slug(moduleName)}.md`;
  const tags = [
    ...new Set(moduleEndpoints.flatMap((item) => item.operation.tags ?? [])),
  ].sort();
  const controllers = [
    ...new Set(
      moduleEndpoints.map((item) => item.source?.className).filter(Boolean),
    ),
  ].sort();
  const content = [
    '<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->',
    '',
    `# Endpoints del módulo ${code(moduleName)}`,
    '',
    `Referencia exhaustiva de ${moduleEndpoints.length} operación(es) del módulo ${code(moduleName)}, derivada del contrato OpenAPI y del código TypeScript.`,
    '',
    `- **Etiquetas OpenAPI:** ${tags.map(code).join(', ') || 'Sin etiquetas'}`,
    `- **Controladores:** ${controllers.map(code).join(', ') || 'No localizados'}`,
    '- **Contrato fuente:** [openapi.json](../openapi.json)',
    '- **Convenciones transversales:** [README.md](README.md)',
    '',
    '## Índice del módulo',
    '',
    ...moduleEndpoints.map(
      (item, index) =>
        `${index + 1}. [${item.method.toUpperCase()} ${item.route}](#${index + 1}-${slug(item.method + '-' + item.route)}) — ${item.operation.summary || item.operation.operationId}`,
    ),
    '',
    '---',
    '',
    ...moduleEndpoints.map((item, index) => renderEndpoint(item, index + 1)),
  ].join('\n');
  fs.writeFileSync(path.join(OUTPUT_DIR, filename), content + '\n', 'utf8');
  indexRows.push({
    moduleName,
    filename,
    count: moduleEndpoints.length,
    tags,
    controllers: controllers.length,
  });
  documented += moduleEndpoints.length;
}

const index = [
  '<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->',
  '',
  '# Referencia ultra detallada de endpoints',
  '',
  `Esta referencia documenta **${documented} de ${endpoints.length} operaciones HTTP** registradas en ${code('openapi/openapi.json')}, agrupadas en **${byModule.size} módulos**. Cada endpoint incluye módulo, nombre, descripciones de negocio y sistema, parámetros, payload mínimo, restricciones, payload completo, respuesta exitosa y errores posibles.`,
  '',
  '## Cómo interpretar la referencia',
  '',
  '- **Fuente contractual:** rutas, métodos, parámetros, seguridad, DTOs de entrada y status exitosos proceden de `openapi.json`.',
  '- **Fuente de implementación:** controlador, roles, UUID pipes, servicio delegado, tipo TypeScript de retorno y excepciones explícitas se extraen del AST de `src/`.',
  '- **Payload mínimo:** contiene solo propiedades marcadas como obligatorias. Si el objeto no tiene campos obligatorios, `{}` es el body estructural mínimo; las reglas de negocio todavía pueden exigir coherencia entre campos opcionales.',
  '- **Payload completo:** incluye todos los campos documentados. Es un ejemplo sintáctico; UUID, códigos de catálogo y referencias deben existir en el tenant real.',
  '- **Respuestas:** el OpenAPI actual no enlaza schemas de respuesta. Cuando el retorno TypeScript coincide con un DTO Swagger, esta referencia lo muestra como evidencia de implementación, señalando expresamente la brecha contractual.',
  '- **Errores:** se combinan errores transversales reales con excepciones detectadas en los servicios alcanzables desde el controlador. No todos los errores son alcanzables en todas las ramas de ejecución.',
  '',
  '## Reglas transversales',
  '',
  '- Autenticación JWT Bearer por defecto; solo las operaciones con `security: []` son públicas.',
  '- Validación global con transformación implícita, `whitelist: true` y `forbidNonWhitelisted: true`.',
  '- Límite de body JSON/urlencoded: 1 MB. Archivos grandes siguen flujos de almacenamiento de objetos.',
  '- Rate limit global: 300 solicitudes cada 60 segundos por instancia; autenticación aplica límites más estrictos.',
  '- Aislamiento multi-tenant mediante el contexto del actor y, cuando corresponda, `X-Tenant-Id`.',
  '- Errores normalizados como `{ code, message, correlationId?, details?, timestamp, path }`.',
  '- Respuestas trazables mediante la cabecera `x-trace-id`.',
  '',
  '## Forma general del error',
  '',
  '```json',
  JSON.stringify(
    {
      code: 'VALIDATION_FAILED',
      message: 'Error de validación',
      correlationId: 'req-01J00000000000000000000000',
      details: { violations: ['email must be an email'] },
      timestamp: '2026-07-31T12:00:00.000Z',
      path: '/ruta',
    },
    null,
    2,
  ),
  '```',
  '',
  '## Módulos',
  '',
  '| Módulo | Endpoints | Etiquetas OpenAPI | Controladores |',
  '|---|---:|---|---:|',
  ...indexRows.map(
    (row) =>
      `| [${row.moduleName}](${row.filename}) | ${row.count} | ${row.tags.map(code).join(', ')} | ${row.controllers} |`,
  ),
  '',
  '## Regeneración y control de cobertura',
  '',
  '```bash',
  'yarn docs:endpoints:generate',
  '```',
  '',
  `La generación falla si la cantidad documentada difiere de las ${endpoints.length} operaciones encontradas. Los archivos de esta carpeta son derivados; los cambios permanentes deben hacerse en decoradores, DTOs, controladores, servicios o en el generador.`,
  '',
].join('\n');

fs.writeFileSync(path.join(OUTPUT_DIR, 'README.md'), index, 'utf8');

const rootIndex = [
  '<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->',
  '',
  '# Documentación de endpoints',
  '',
  `Se documentan **${documented} de ${endpoints.length} endpoints** en **${byModule.size} módulos**. La referencia completa, convenciones y modelo de error están en [openapi/endpoints/README.md](endpoints/README.md).`,
  '',
  '| Módulo | Endpoints | Documento |',
  '|---|---:|---|',
  ...indexRows.map(
    (row) =>
      `| ${code(row.moduleName)} | ${row.count} | [Abrir referencia](endpoints/${row.filename}) |`,
  ),
  '',
  'Regenerar con `yarn docs:endpoints:generate` después de modificar rutas, DTOs, controladores o servicios.',
  '',
].join('\n');

fs.writeFileSync(path.join(ROOT, 'openapi', 'ENDPOINTS.md'), rootIndex, 'utf8');

if (documented !== endpoints.length) {
  throw new Error(
    `Cobertura incompleta: ${documented}/${endpoints.length} endpoints documentados`,
  );
}

console.log(
  `Documentación generada: ${documented} endpoints, ${byModule.size} módulos, ${indexRows.length + 1} archivos Markdown.`,
);
