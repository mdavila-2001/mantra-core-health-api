// A qué estado HTTP y código de error se traduce cada `throw new X(...)`.
//
// Dos orígenes:
//   - clases del proyecto (`src/common/errors/domain.exception.ts`): se leen del AST,
//     porque el nombre engaña (`PreconditionFailedException` del proyecto responde 422,
//     no 412);
//   - excepciones de `@nestjs/common`: tabla fija, documentada por Nest.
// Cuál de las dos es se decide por el `import` del archivo que la lanza.
import ts from 'typescript';

const ESTADOS = {
  CONTINUE: 100,
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

/** Excepciones de `@nestjs/common` y el estado que fija cada una. */
const NEST = {
  BadRequestException: 400,
  UnauthorizedException: 401,
  ForbiddenException: 403,
  NotFoundException: 404,
  MethodNotAllowedException: 405,
  NotAcceptableException: 406,
  RequestTimeoutException: 408,
  ConflictException: 409,
  GoneException: 410,
  PreconditionFailedException: 412,
  PayloadTooLargeException: 413,
  UnsupportedMediaTypeException: 415,
  UnprocessableEntityException: 422,
  InternalServerErrorException: 500,
  NotImplementedException: 501,
  BadGatewayException: 502,
  ServiceUnavailableException: 503,
  GatewayTimeoutException: 504,
};

/** Código de error estable que el filtro global asigna a cada estado (all-exceptions.filter.ts). */
const CODIGO_POR_ESTADO = {
  400: 'VALIDATION_FAILED',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  422: 'PRECONDITION_FAILED',
  429: 'RATE_LIMITED',
  503: 'DEPENDENCY_UNAVAILABLE',
  504: 'TIMEOUT',
};

/**
 * @param {ReturnType<import('./ast.mjs').buildSourceIndex>} index
 * @returns {{
 *   propias: Map<string, {estado: number, codigo: string|null, fuente: string}>,
 *   resolver: (nombre: string, importadaDe: string|undefined) => {estado: number|null, codigo: string|null, origen: string},
 * }}
 */
export function leerExcepciones(index) {
  const propias = new Map();

  // clases del proyecto cuyo constructor llama a super(HttpStatus.X, ErrorCode.Y, …)
  for (const info of index.classesPorClave.values()) {
    if (!info.relative.startsWith('src/common/errors/')) continue;
    const nombre = info.node.name.text;
    const constructor = info.node.members.find(ts.isConstructorDeclaration);
    const texto = constructor?.getText(info.sourceFile) ?? '';
    const estado = texto.match(/HttpStatus\.([A-Z_]+)/)?.[1];
    const codigo = texto.match(/ErrorCode\.([A-Z_]+)/)?.[1];
    if (estado && ESTADOS[estado])
      propias.set(nombre, {
        estado: ESTADOS[estado],
        codigo: codigo ?? null,
        fuente: `${info.relative}:${info.sourceFile.getLineAndCharacterOfPosition(info.node.name.getStart()).line + 1}`,
      });
  }

  function resolver(nombre, importadaDe) {
    const deNest = importadaDe?.startsWith('@nestjs/');
    if (!deNest && propias.has(nombre)) {
      const propia = propias.get(nombre);
      return {
        estado: propia.estado,
        codigo: propia.codigo,
        origen: 'PROYECTO',
      };
    }
    if (NEST[nombre]) {
      const estado = NEST[nombre];
      return {
        estado,
        codigo: CODIGO_POR_ESTADO[estado] ?? null,
        origen: 'NEST',
      };
    }
    return { estado: null, codigo: null, origen: 'DESCONOCIDO' };
  }
  return { propias, resolver, codigoPorEstado: CODIGO_POR_ESTADO };
}
