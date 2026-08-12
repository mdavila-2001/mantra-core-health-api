import { AudioDomainError, AUDIO_ERROR } from '../domain/audio.errors';
import type { ResolveAudioRequest } from '../domain/audio.types';

/**
 * Validación del único borde programático del dominio.
 *
 * `AudioAssetResolver.resolve()` lo llaman otros módulos del backend por
 * inyección, no solo el controlador, así que la `ValidationPipe` global no cubre
 * ese camino: sin esta comprobación un `templateCode` de 5 000 caracteres o una
 * variable con un nombre extraño llegarían hasta una columna acotada y el fallo
 * sería un error crudo de PostgreSQL en mitad de un onboarding.
 *
 * Se valida a mano y no con `class-validator` porque la entrada es un objeto
 * literal de otro servicio, no un cuerpo HTTP: instanciar y transformar una clase
 * DTO para validarla añadiría dos pasos y una dependencia de metadatos a algo que
 * son seis comprobaciones.
 */

const TEMPLATE_CODE = /^[a-z0-9][a-z0-9._-]*$/u;
const VARIABLE_NAME = /^[a-zA-Z0-9_.-]+$/u;
const LANGUAGE_TAG = /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/u;

const LIMITS = {
  templateCode: 160,
  variableName: 64,
  variableValue: 200,
  variables: 16,
  actorId: 160,
  correlationId: 64,
  language: 20,
} as const;

/**
 * Valida y normaliza una solicitud de resolución.
 *
 * @returns la solicitud con solo los campos reconocidos: un objeto con claves de
 *          más se acepta pero sus extras se descartan, igual que hace
 *          `whitelist: true` en la tubería HTTP.
 * @throws AudioDomainError con **todos** los problemas encontrados.
 */
export function parseResolveAudioRequest(input: unknown): ResolveAudioRequest {
  const problems: string[] = [];
  const source = isRecord(input) ? input : {};
  if (!isRecord(input)) {
    problems.push('la solicitud debe ser un objeto');
  }

  const templateCode =
    typeof source.templateCode === 'string' ? source.templateCode : '';
  if (!templateCode) {
    problems.push('templateCode: requerido');
  } else if (templateCode.length > LIMITS.templateCode) {
    problems.push(`templateCode: máximo ${LIMITS.templateCode} caracteres`);
  } else if (!TEMPLATE_CODE.test(templateCode)) {
    problems.push(
      'templateCode: solo minúsculas, dígitos, punto, guion y guion bajo, empezando por alfanumérico',
    );
  }

  const variables = parseVariables(source.variables, problems);
  const actorId = optionalString(
    source.actorId,
    'actorId',
    LIMITS.actorId,
    problems,
  );
  const correlationId = optionalString(
    source.correlationId,
    'correlationId',
    LIMITS.correlationId,
    problems,
  );
  const language = optionalString(
    source.language,
    'language',
    LIMITS.language,
    problems,
  );
  if (language !== undefined && !LANGUAGE_TAG.test(language)) {
    problems.push('language: etiqueta de idioma inválida (p. ej. es-419)');
  }

  if (problems.length > 0) {
    throw new AudioDomainError(
      `Solicitud de audio inválida: ${problems.join('; ')}`,
      AUDIO_ERROR.requestInvalid,
    );
  }

  return {
    templateCode,
    ...(variables !== undefined ? { variables } : {}),
    ...(actorId !== undefined ? { actorId } : {}),
    ...(language !== undefined ? { language } : {}),
    ...(correlationId !== undefined ? { correlationId } : {}),
  };
}

function parseVariables(
  raw: unknown,
  problems: string[],
): Record<string, string> | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (!isRecord(raw)) {
    problems.push('variables: debe ser un objeto de cadenas');
    return undefined;
  }
  const entries = Object.entries(raw);
  if (entries.length === 0) return undefined;
  if (entries.length > LIMITS.variables) {
    problems.push(`variables: máximo ${LIMITS.variables} entradas`);
    return undefined;
  }

  const variables: Record<string, string> = {};
  for (const [name, value] of entries) {
    if (name.length > LIMITS.variableName || !VARIABLE_NAME.test(name)) {
      problems.push(`variables.${name}: nombre inválido`);
      continue;
    }
    if (typeof value !== 'string') {
      problems.push(`variables.${name}: debe ser una cadena`);
      continue;
    }
    if (value.length > LIMITS.variableValue) {
      problems.push(
        `variables.${name}: máximo ${LIMITS.variableValue} caracteres`,
      );
      continue;
    }
    variables[name] = value;
  }
  return variables;
}

function optionalString(
  raw: unknown,
  field: string,
  maxLength: number,
  problems: string[],
): string | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined;
  if (typeof raw !== 'string') {
    problems.push(`${field}: debe ser una cadena`);
    return undefined;
  }
  if (raw.length > maxLength) {
    problems.push(`${field}: máximo ${maxLength} caracteres`);
    return undefined;
  }
  return raw;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
