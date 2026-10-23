// Índice del código fuente de la API (AST de TypeScript), compartido por los
// generadores de documentación:
//   - tools/docs/generate-endpoint-markdown.mjs
//   - tools/inventario/*
// Recorre `src/**/*.ts` (sin specs) y expone, por clase, sus métodos, dependencias
// inyectadas y propiedades de DTO; y, por handler de controlador, sus decoradores,
// delegación al servicio y excepciones alcanzables. No ejecuta ni importa el código.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

export function walk(dir, predicate, result = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute, predicate, result);
    else if (predicate(absolute)) result.push(absolute);
  }
  return result;
}

export function getDecorators(node) {
  return ts.canHaveDecorators(node) ? (ts.getDecorators(node) ?? []) : [];
}

export function decoratorInfo(decorator, sourceFile) {
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

export function jsDoc(node) {
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

export function literal(text) {
  if (text === undefined) return undefined;
  if (/^['"`][\s\S]*['"`]$/.test(text)) return text.slice(1, -1);
  if (text === 'true') return true;
  if (text === 'false') return false;
  if (text === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
  return text;
}

export function parseDecoratorConstraints(decorators) {
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

const TIPOS_MAPEADOS = new Set([
  'OmitType',
  'PickType',
  'PartialType',
  'IntersectionType',
]);

/**
 * Base de una clase de DTO: `extends Base` o `extends OmitType(Base, ['x'])`
 * (también `PickType`, `PartialType`, `IntersectionType`). Devuelve la clase base y,
 * si corresponde, qué propiedades se omiten o se eligen.
 */
function herenciaDe(statement, sourceFile) {
  const extiende = statement.heritageClauses?.find(
    (clause) => clause.token === ts.SyntaxKind.ExtendsKeyword,
  )?.types[0];
  if (!extiende) return null;
  const expresion = extiende.expression;
  if (ts.isIdentifier(expresion)) return { base: expresion.text };
  if (
    ts.isCallExpression(expresion) &&
    ts.isIdentifier(expresion.expression) &&
    TIPOS_MAPEADOS.has(expresion.expression.text)
  ) {
    const [base, lista] = expresion.arguments;
    if (!base || !ts.isIdentifier(base)) return null;
    const nombres = lista
      ? [...lista.getText(sourceFile).matchAll(/['"`]([^'"`]+)['"`]/g)].map(
          (match) => match[1],
        )
      : [];
    const tipo = expresion.expression.text;
    return {
      base: base.text,
      omitir: tipo === 'OmitType' ? nombres : undefined,
      elegir: tipo === 'PickType' ? nombres : undefined,
    };
  }
  return null;
}

/**
 * Construye el índice del código fuente.
 *
 * Las claves de `controllerMethods` son `${Controller}_${método}`, que es como
 * NestJS arma el `operationId` del contrato.
 *
 * @param {string} root - Raíz del repositorio de la API.
 */
export function buildSourceIndex(root = process.cwd()) {
  const sourceFiles = walk(
    path.join(root, 'src'),
    (file) => file.endsWith('.ts') && !file.endsWith('.spec.ts'),
  );
  const classes = new Map();
  const controllerMethods = new Map();
  const dtoConstraints = new Map();
  const sourceClassProperties = new Map();
  const sourceTypeAliases = new Map();
  const sourceEnums = new Map();
  // nombre publicado en el contrato (@ApiSchema({ name })) → nombre de la clase
  const apiSchemaAliases = new Map();
  // Dos módulos pueden declarar una clase con el mismo nombre: estos mapas usan
  // la clave `archivo#Clase`, que no se pisa.
  const dtoConstraintsPorClave = new Map();
  // todos los archivos leídos (también los que no declaran clases, p. ej. constantes)
  const archivos = new Map();
  const classesPorClave = new Map();
  const classesPorNombre = new Map();
  // puerto (interface o clase abstracta) → claves de las clases que lo implementan
  const implementaciones = new Map();
  const herenciaPorClave = new Map();

  for (const file of sourceFiles) {
    const text = fs.readFileSync(file, 'utf8');
    const sourceFile = ts.createSourceFile(
      file,
      text,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    const relative = path.relative(root, file).replaceAll(path.sep, '/');
    archivos.set(relative, sourceFile);

    // identificador local → ruta con la que se importó (para resolver nombres repetidos)
    const imports = new Map();
    const importAlias = new Map();
    for (const statement of sourceFile.statements) {
      if (!ts.isImportDeclaration(statement) || !statement.importClause)
        continue;
      const origen = statement.moduleSpecifier.text;
      const { name, namedBindings } = statement.importClause;
      if (name) imports.set(name.text, origen);
      if (namedBindings && ts.isNamedImports(namedBindings))
        for (const element of namedBindings.elements) {
          imports.set(element.name.text, origen);
          // `import { Original as Local }`: el nombre de la clase es `Original`
          if (element.propertyName)
            importAlias.set(element.name.text, element.propertyName.text);
        }
    }

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
            injected.set(
              parameter.name.text,
              parameter.type.getText(sourceFile),
            );
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
              item.name === 'ApiProperty' ||
              item.name === 'ApiPropertyOptional',
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
          const fuente = `${relative}:${
            sourceFile.getLineAndCharacterOfPosition(member.name.getStart())
              .line + 1
          }`;
          properties.set(member.name.text, {
            constraints: parseDecoratorConstraints(decorators),
            decorators,
            fuente,
          });
          sourceProperties.set(member.name.text, {
            fuente,
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

      const alias = getDecorators(statement)
        .map((item) => decoratorInfo(item, sourceFile))
        .find((item) => item.name === 'ApiSchema')
        ?.args[0]?.match(/name\s*:\s*['"`]([^'"`]+)['"`]/)?.[1];
      const clave = `${relative}#${className}`;
      if (alias) apiSchemaAliases.set(alias, clave);

      const info = {
        node: statement,
        sourceFile,
        relative,
        imports,
        importAlias,
        methods,
        injected,
        typeParameters:
          statement.typeParameters?.map((item) => item.name.text) ?? [],
      };
      classes.set(className, info);
      classesPorClave.set(clave, info);
      for (const clausula of statement.heritageClauses ?? []) {
        for (const tipo of clausula.types) {
          const base = tipo.expression.getText(sourceFile);
          if (!/^[A-Za-z0-9_]+$/.test(base)) continue;
          implementaciones.set(base, [
            ...(implementaciones.get(base) ?? []),
            clave,
          ]);
        }
      }
      classesPorNombre.set(className, [
        ...(classesPorNombre.get(className) ?? []),
        clave,
      ]);
      if (properties.size) dtoConstraints.set(className, properties);
      dtoConstraintsPorClave.set(clave, properties);
      const herencia = herenciaDe(statement, sourceFile);
      if (herencia) herenciaPorClave.set(clave, { ...herencia, relative });
      if (sourceProperties.size)
        sourceClassProperties.set(className, sourceProperties);
    }
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

  // `@Roles(...ROLES_DEL_PORTAL)`: el arreglo vive en un archivo de constantes. Se resuelve por
  // nombre sólo si es único en el repo; si no, el argumento queda tal cual (nunca se adivina).
  let arreglosDeTexto;
  function arreglosConstantes() {
    if (arreglosDeTexto) return arreglosDeTexto;
    arreglosDeTexto = new Map();
    const ambiguos = new Set();
    for (const [, archivo] of archivos)
      for (const statement of archivo.statements) {
        if (!ts.isVariableStatement(statement)) continue;
        for (const declaracion of statement.declarationList.declarations) {
          if (!ts.isIdentifier(declaracion.name) || !declaracion.initializer)
            continue;
          let valor = declaracion.initializer;
          while (
            ts.isAsExpression(valor) ||
            ts.isSatisfiesExpression(valor) ||
            ts.isParenthesizedExpression(valor)
          )
            valor = valor.expression;
          if (!ts.isArrayLiteralExpression(valor)) continue;
          if (!valor.elements.every((e) => ts.isStringLiteralLike(e))) continue;
          const nombre = declaracion.name.text;
          if (arreglosDeTexto.has(nombre)) ambiguos.add(nombre);
          arreglosDeTexto.set(
            nombre,
            valor.elements.map((e) => e.text),
          );
        }
      }
    for (const nombre of ambiguos) arreglosDeTexto.delete(nombre);
    return arreglosDeTexto;
  }
  function rolesDeArgumento(texto) {
    const spread = /^\.\.\.([A-Za-z_$][\w$]*)$/.exec(texto.trim());
    const resuelto = spread && arreglosConstantes().get(spread[1]);
    return resuelto ?? [literal(texto)];
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
        .flatMap((item) => item.args.flatMap(rolesDeArgumento));
      const throttle = decorators.find(
        (item) => item.name === 'Throttle',
      )?.text;
      const isPublic = decorators.some((item) => item.name === 'Public');
      const uuidParams = [];
      const parametros = []; // @Body / @Param / @Query / @Headers de cada handler
      for (const parameter of method.parameters) {
        const paramDecorators = getDecorators(parameter).map((item) =>
          decoratorInfo(item, classInfo.sourceFile),
        );
        const origen = paramDecorators.find((item) =>
          ['Body', 'Param', 'Query', 'Headers'].includes(item.name),
        );
        if (origen)
          parametros.push({
            en: origen.name,
            nombre: literal(origen.args[0]) ?? null,
            tipo: parameter.type?.getText(classInfo.sourceFile) ?? null,
            uuid: paramDecorators.some(
              (item) =>
                item.name === 'Param' && item.text.includes('ParseUUIDPipe'),
            ),
          });
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

      const decoratorNamed = (name) =>
        decorators.find((item) => item.name === name);
      const verbo = decorators.find((item) =>
        ['Get', 'Post', 'Put', 'Patch', 'Delete'].includes(item.name),
      );
      const controllerPath = literal(
        classDecorators.find((item) => item.name === 'Controller')?.args[0],
      );
      controllerMethods.set(`${className}_${methodName}`, {
        className,
        methodName,
        moduleName,
        source: classInfo.relative,
        line:
          classInfo.sourceFile.getLineAndCharacterOfPosition(method.getStart())
            .line + 1,
        decorators: [...new Set(decorators.map((item) => item.name))],
        httpVerb: verbo?.name.toUpperCase(),
        routePath: [controllerPath, literal(verbo?.args[0])]
          .filter((part) => typeof part === 'string' && part)
          .join('/'),
        httpCode: decoratorNamed('HttpCode')?.args[0],
        requiresVerifiedIdentity: Boolean(
          decoratorNamed('RequiresVerifiedIdentity'),
        ),
        calls: calls.map((call) => ({
          property: call.property,
          method: call.method,
          targetClass: classInfo.injected.get(call.property) ?? null,
        })),
        jsDoc: jsDoc(method),
        returnType,
        roles: [...new Set(roles)],
        throttle,
        isPublic,
        uuidParams: [...new Set(uuidParams)],
        parametros,
        delegates: [...new Set(delegates)],
        exceptions: [
          ...new Map(
            exceptions.map((item) => [
              `${item.exception}:${item.message}`,
              item,
            ]),
          ).values(),
        ],
      });
    }
  }

  return {
    classes,
    controllerMethods,
    dtoConstraints,
    sourceClassProperties,
    sourceTypeAliases,
    sourceEnums,
    apiSchemaAliases,
    dtoConstraintsPorClave,
    herenciaPorClave,
    archivos,
    classesPorClave,
    classesPorNombre,
    implementaciones,
    extractThrownExceptions,
  };
}
