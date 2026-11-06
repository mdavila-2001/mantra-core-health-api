import { describe, expect, it } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { reportFileRoleOf, RDRAFT } from '../report-drafts.concepts';
import {
  isReportBodyEmpty,
  parseReportBody,
  REPORT_BODY_MAX_BLOCKS,
  REPORT_BODY_MAX_CHARS,
  REPORT_BODY_MAX_PARTS,
  REPORT_BODY_MAX_PER_BLOCK,
  reportContentHash,
  reportPlainText,
  storedReportBody,
} from './report-body';

const body = {
  version: 1,
  blocks: [
    { type: 'heading', level: 2, text: 'Hemograma' },
    {
      type: 'paragraph',
      runs: [
        { text: 'Valores ', extra: 'dropped' },
        { text: 'normales', bold: true, italic: false },
      ],
    },
    {
      type: 'list',
      ordered: false,
      items: [[{ text: 'Hb 14' }], [{ text: 'Hto 42' }]],
    },
    { type: 'list', ordered: true, items: [[{ text: 'Control' }]] },
  ],
};

describe('report-body', () => {
  it('parses the front contract and drops unknown keys and false marks', () => {
    const parsed = parseReportBody(body);
    expect(parsed.blocks[1]).toEqual({
      type: 'paragraph',
      runs: [{ text: 'Valores ' }, { text: 'normales', bold: true }],
    });
  });

  it.each([
    ['not an object', 'x'],
    ['wrong version', { version: 2, blocks: [] }],
    ['unknown block', { version: 1, blocks: [{ type: 'table' }] }],
    [
      'bad heading level',
      { version: 1, blocks: [{ type: 'heading', level: 1, text: 'x' }] },
    ],
    [
      'non-boolean mark',
      {
        version: 1,
        blocks: [{ type: 'paragraph', runs: [{ text: 'a', bold: 'yes' }] }],
      },
    ],
  ])('rejects %s with 400', (_label, raw) => {
    expect(() => parseReportBody(raw)).toThrow(BadRequestException);
  });

  it('limits blocks and total characters', () => {
    const paragraph = { type: 'paragraph', runs: [{ text: 'a' }] };
    expect(() =>
      parseReportBody({
        version: 1,
        blocks: Array(REPORT_BODY_MAX_BLOCKS + 1).fill(paragraph),
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      parseReportBody({
        version: 1,
        blocks: [
          {
            type: 'paragraph',
            runs: [{ text: 'a'.repeat(REPORT_BODY_MAX_CHARS + 1) }],
          },
        ],
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      parseReportBody({
        version: 1,
        blocks: [
          {
            type: 'paragraph',
            runs: [{ text: 'a'.repeat(REPORT_BODY_MAX_CHARS) }],
          },
        ],
      }),
    ).not.toThrow();
  });

  it('bounds the structure: parts per block, total parts, and drops empty runs and items', () => {
    const empty = { text: '' };
    expect(() =>
      parseReportBody({
        version: 1,
        blocks: [
          {
            type: 'paragraph',
            runs: Array(REPORT_BODY_MAX_PER_BLOCK + 1).fill(empty),
          },
        ],
      }),
    ).toThrow(BadRequestException);
    const fullParagraph = {
      type: 'paragraph',
      runs: Array(REPORT_BODY_MAX_PER_BLOCK).fill(empty),
    };
    const blocks = Math.ceil(
      (REPORT_BODY_MAX_PARTS + 1) / REPORT_BODY_MAX_PER_BLOCK,
    );
    expect(() =>
      parseReportBody({
        version: 1,
        blocks: Array(blocks).fill(fullParagraph),
      }),
    ).toThrow(BadRequestException);
    const parsed = parseReportBody({
      version: 1,
      blocks: [
        { type: 'paragraph', runs: [empty, { text: 'ok' }] },
        { type: 'list', ordered: false, items: [[empty], [{ text: 'x' }]] },
      ],
    });
    expect(parsed.blocks).toEqual([
      { type: 'paragraph', runs: [{ text: 'ok' }] },
      { type: 'list', ordered: false, items: [[{ text: 'x' }]] },
    ]);
  });

  it('derives the plain-text conclusion with blank lines and list prefixes', () => {
    expect(reportPlainText(parseReportBody(body))).toBe(
      'Hemograma\n\nValores normales\n\n• Hb 14\n• Hto 42\n\n1. Control',
    );
  });

  it('detects an empty body and reads legacy rows as empty', () => {
    expect(
      isReportBodyEmpty(
        parseReportBody({
          version: 1,
          blocks: [{ type: 'paragraph', runs: [{ text: '  ' }] }],
        }),
      ),
    ).toBe(true);
    expect(isReportBodyEmpty(parseReportBody(body))).toBe(false);
    expect(storedReportBody({ blocks: [] })).toEqual({
      version: 1,
      blocks: [],
    });
  });

  it('hashes the canonical content deterministically and changes with any field', () => {
    const content = {
      versionId: 'v1',
      serviceRequestId: 'sr1',
      issuerTenantId: 't1',
      signerProfileId: 'p1',
      issuedAt: new Date('2026-11-05T12:00:00Z'),
      body: parseReportBody(body),
    };
    const hash = reportContentHash(content);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(reportContentHash({ ...content })).toBe(hash);
    expect(reportContentHash({ ...content, signerProfileId: 'p2' })).not.toBe(
      hash,
    );
  });

  it('maps file content roles to the patient DTO role', () => {
    expect(reportFileRoleOf(RDRAFT.REPORT_FILE_OFFICIAL)).toBe('OFFICIAL');
    expect(reportFileRoleOf(RDRAFT.REPORT_FILE_ANNEX)).toBe('ANNEX');
    expect(reportFileRoleOf('other')).toBeNull();
  });
});
