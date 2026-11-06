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
/** Runs of a paragraph, items of a list and runs of an item, each. */
export const REPORT_BODY_MAX_PER_BLOCK = 200;
/** Runs and list items across the whole body: structure, not only text, is bounded. */
export const REPORT_BODY_MAX_PARTS = 5000;

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

/** Counts every run and list item parsed, so the whole body stays bounded. */
interface PartBudget {
  used: number;
}

function spend(budget: PartBudget, count: number): void {
  if (count > REPORT_BODY_MAX_PER_BLOCK) {
    invalid(`más de ${REPORT_BODY_MAX_PER_BLOCK} partes en un bloque`);
  }
  budget.used += count;
  if (budget.used > REPORT_BODY_MAX_PARTS) {
    invalid(`más de ${REPORT_BODY_MAX_PARTS} partes en el informe`);
  }
}

/** Runs of a paragraph or list item; empty runs are dropped. */
function parseRuns(raw: unknown, budget: PartBudget): ReportRun[] {
  if (!Array.isArray(raw)) invalid('"runs" debe ser una lista');
  spend(budget, raw.length);
  return raw.map(parseRun).filter((run) => run.text !== '');
}

function parseBlock(raw: unknown, budget: PartBudget): ReportBlock {
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
      return { type: 'paragraph', runs: parseRuns(raw.runs, budget) };
    case 'list':
      if (typeof raw.ordered !== 'boolean' || !Array.isArray(raw.items)) {
        invalid('lista sin "ordered" o "items"');
      }
      spend(budget, raw.items.length);
      return {
        type: 'list',
        ordered: raw.ordered,
        // Empty items are dropped: they would only add structure, not content.
        items: raw.items
          .map((item) => parseRuns(item, budget))
          .filter((runs) => runs.length > 0),
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
 * {@link REPORT_BODY_MAX_BLOCKS} blocks, {@link REPORT_BODY_MAX_PER_BLOCK}
 * parts per block, {@link REPORT_BODY_MAX_PARTS} runs and items in total and
 * {@link REPORT_BODY_MAX_CHARS} characters of text. Unknown keys and empty
 * runs or items are dropped.
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
  const budget: PartBudget = { used: 0 };
  const body: ReportBody = {
    version: 1,
    blocks: raw.blocks.map((block) => parseBlock(block, budget)),
  };
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
