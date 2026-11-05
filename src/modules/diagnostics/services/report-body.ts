import { BadRequestException } from '@nestjs/common';
import { createHash } from 'node:crypto';

/** One run of inline text with its marks. */
export interface ReportRun {
  readonly text: string;
  readonly bold?: boolean;
  readonly italic?: boolean;
  readonly underline?: boolean;
}

/** One block of the report document (contract shared with the front). */
export type ReportBlock =
  | { readonly type: 'heading'; readonly level: 2 | 3; readonly text: string }
  | { readonly type: 'paragraph'; readonly runs: readonly ReportRun[] }
  | {
      readonly type: 'list';
      readonly ordered: boolean;
      readonly items: readonly (readonly ReportRun[])[];
    };

/** `report_drafts.body_json`. */
export interface ReportBody {
  readonly version: 1;
  readonly blocks: readonly ReportBlock[];
}

export const REPORT_BODY_MAX_BLOCKS = 2000;
export const REPORT_BODY_MAX_CHARS = 20000;

/** Body of a brand-new draft. */
export const EMPTY_REPORT_BODY: ReportBody = { version: 1, blocks: [] };

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function invalid(detail: string): never {
  throw new BadRequestException(
    `El informe no tiene un formato válido: ${detail}`,
  );
}

function parseRun(raw: unknown): ReportRun {
  if (!isObject(raw) || typeof raw.text !== 'string')
    invalid('texto sin "text"');
  for (const mark of ['bold', 'italic', 'underline'] as const) {
    if (raw[mark] !== undefined && typeof raw[mark] !== 'boolean') {
      invalid(`marca "${mark}" no booleana`);
    }
  }
  return {
    text: raw.text,
    ...(raw.bold ? { bold: true } : {}),
    ...(raw.italic ? { italic: true } : {}),
    ...(raw.underline ? { underline: true } : {}),
  };
}

function parseRuns(raw: unknown): ReportRun[] {
  if (!Array.isArray(raw)) invalid('"runs" debe ser una lista');
  return raw.map(parseRun);
}

function parseBlock(raw: unknown): ReportBlock {
  if (!isObject(raw)) invalid('bloque no es un objeto');
  switch (raw.type) {
    case 'heading':
      if (
        (raw.level !== 2 && raw.level !== 3) ||
        typeof raw.text !== 'string'
      ) {
        invalid('título con nivel o texto inválido');
      }
      return { type: 'heading', level: raw.level, text: raw.text };
    case 'paragraph':
      return { type: 'paragraph', runs: parseRuns(raw.runs) };
    case 'list':
      if (typeof raw.ordered !== 'boolean' || !Array.isArray(raw.items)) {
        invalid('lista sin "ordered" o "items"');
      }
      return {
        type: 'list',
        ordered: raw.ordered,
        items: raw.items.map(parseRuns),
      };
    default:
      return invalid('tipo de bloque desconocido');
  }
}

/** Every text of the body, in document order. */
function texts(body: ReportBody): string[] {
  return body.blocks.flatMap((block) => {
    if (block.type === 'heading') return [block.text];
    if (block.type === 'paragraph') return block.runs.map((r) => r.text);
    return block.items.flatMap((item) => item.map((r) => r.text));
  });
}

/**
 * Validates and normalizes a client body: known blocks only, at most
 * {@link REPORT_BODY_MAX_BLOCKS} blocks and {@link REPORT_BODY_MAX_CHARS}
 * characters of text in total. Unknown keys are dropped.
 *
 * @throws BadRequestException when the shape or the limits are not met.
 */
export function parseReportBody(raw: unknown): ReportBody {
  if (!isObject(raw) || raw.version !== 1 || !Array.isArray(raw.blocks)) {
    invalid('se espera { version: 1, blocks: [] }');
  }
  if (raw.blocks.length > REPORT_BODY_MAX_BLOCKS) {
    invalid(`más de ${REPORT_BODY_MAX_BLOCKS} bloques`);
  }
  const body: ReportBody = { version: 1, blocks: raw.blocks.map(parseBlock) };
  const chars = texts(body).reduce((sum, text) => sum + text.length, 0);
  if (chars > REPORT_BODY_MAX_CHARS) {
    invalid(`más de ${REPORT_BODY_MAX_CHARS} caracteres`);
  }
  return body;
}

/** Reads a stored body; a row written before this contract reads as empty. */
export function storedReportBody(raw: unknown): ReportBody {
  try {
    return parseReportBody(raw);
  } catch {
    return EMPTY_REPORT_BODY;
  }
}

/** `true` when the body has no visible text. */
export function isReportBodyEmpty(body: ReportBody): boolean {
  return texts(body).every((text) => text.trim() === '');
}

const joinRuns = (runs: readonly ReportRun[]): string =>
  runs.map((run) => run.text).join('');

/**
 * Plain-text conclusion (`conclusion_text`): blocks separated by a blank
 * line, list items prefixed with "• " or "1. ".
 */
export function reportPlainText(body: ReportBody): string {
  return body.blocks
    .map((block) => {
      if (block.type === 'heading') return block.text;
      if (block.type === 'paragraph') return joinRuns(block.runs);
      return block.items
        .map(
          (item, i) =>
            `${block.ordered ? `${i + 1}. ` : '• '}${joinRuns(item)}`,
        )
        .join('\n');
    })
    .filter((text) => text.trim() !== '')
    .join('\n\n');
}

/** What the SHA-256 of a published version covers. */
export interface ReportCanonicalContent {
  readonly versionId: string;
  readonly serviceRequestId: string;
  readonly issuerTenantId: string;
  readonly signerProfileId: string;
  readonly issuedAt: Date;
  readonly body: ReportBody;
}

/**
 * SHA-256 of the canonical content: a JSON array in fixed order, so the same
 * report always hashes the same and any change to text, signer, issuer or
 * date changes it.
 */
export function reportContentHash(content: ReportCanonicalContent): string {
  const canonical = JSON.stringify([
    'diagnostic-report/v1',
    content.versionId,
    content.serviceRequestId,
    content.issuerTenantId,
    content.signerProfileId,
    content.issuedAt.toISOString(),
    content.body,
  ]);
  return createHash('sha256').update(canonical).digest('hex');
}
