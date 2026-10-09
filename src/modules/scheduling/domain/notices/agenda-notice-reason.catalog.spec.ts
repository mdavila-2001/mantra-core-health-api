import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  AGENDA_NOTICE_REASONS,
  isRetryable,
  reasonByCode,
  reasonByText,
} from './agenda-notice-reason.catalog';

/**
 * Los dos archivos que producen razones para esta relación.
 *
 * Se leen como **texto**, no se importan: lo que se está comprobando es que el
 * catálogo siga describiendo al código, y un import no ve los literales que
 * están dentro de un `return`.
 */
const ADAPTERS = join(
  process.cwd(),
  'src',
  'modules',
  'scheduling',
  'infrastructure',
  'adapters',
);
const SOURCES = [
  join(ADAPTERS, 'messaging-agenda-notice.adapter.ts'),
  join(ADAPTERS, 'support-admin-notice.adapter.ts'),
];

/**
 * Un literal asignado a alguno de los tres campos de razón.
 *
 * El `(?:[^,'"]*\?\?\s*)?` cubre el caso de la supresión, donde el texto del
 * catálogo es el respaldo de uno que puede venir de la base:
 * `skippedReason: request.suppressionReason ?? '…'`.
 */
const REASON_ASSIGNMENT =
  /(?:skippedReason|emailSkippedReason|chatSkippedReason)\s*:\s*(?:[^,'"]*\?\?\s*)?'((?:[^'\\]|\\.)*)'/g;

/** Los literales que el código emite hoy, leídos del fuente. */
function reasonsInCode(): string[] {
  const found = new Set<string>();
  for (const route of SOURCES) {
    // Prettier parte los literales largos en varias líneas; colapsar el espacio
    // vuelve a juntar `skippedReason:` con su texto.
    const source = readFileSync(route, 'utf8').replace(/\s+/g, ' ');
    for (const match of source.matchAll(REASON_ASSIGNMENT)) {
      found.add(match[1]);
    }
  }
  return [...found];
}

describe('catálogo de razones de AgendaNoticePort', () => {
  it('no tiene códigos ni textos repetidos', () => {
    const codes = AGENDA_NOTICE_REASONS.map((r) => r.code);
    const texts = AGENDA_NOTICE_REASONS.map((r) => r.text);

    expect(new Set(codes).size).toBe(codes.length);
    expect(new Set(texts).size).toBe(texts.length);
  });

  it('traduce un texto vivo a su código', () => {
    const reason = reasonByText('El destinatario no tiene cuenta de portal');

    expect(reason?.code).toBe('NO_PORTAL_ACCOUNT');
    expect(reason?.reasonClass).toBe('terminal');
  });

  it('devuelve null ante un texto que nadie catalogó, en vez de adivinar', () => {
    expect(reasonByText('vaya usted a saber')).toBeNull();
    expect(reasonByText(undefined)).toBeNull();
    expect(reasonByCode('NO_EXISTE')).toBeNull();
  });

  it('separa lo que se reintenta de lo que no', () => {
    expect(isRetryable('No se pudo encolar el correo')).toBe(true);
    expect(isRetryable('La cuenta no declaró correo')).toBe(false);
    expect(isRetryable('Ya había un aviso igual sin entregar')).toBe(false);
    // Lo desconocido no se reintenta: un bucle que nadie pidió es peor que un
    // aviso perdido que sí queda registrado.
    expect(isRetryable('un texto nuevo')).toBe(false);
  });

  it('el rebote no se cuenta como fallo', () => {
    const bounces = AGENDA_NOTICE_REASONS.filter(
      (r) => r.reasonClass === 'not-a-failure',
    );

    expect(bounces.map((r) => r.code).sort()).toEqual([
      'EMAIL_DEBOUNCED',
      'IN_APP_DEBOUNCED',
    ]);
  });

  describe('fidelidad contra el código', () => {
    it('cataloga TODAS las razones que los adaptadores emiten hoy', () => {
      const uncataloged = reasonsInCode().filter(
        (text) => reasonByText(text) === null,
      );

      // Si esto se pone en rojo, alguien agregó una razón y no la catalogó: el
      // arreglo es agregarla acá, no borrar la prueba.
      expect(uncataloged).toEqual([]);
    });

    it('no cataloga razones que el código ya no emite', () => {
      const live = new Set(reasonsInCode());
      const dead = AGENDA_NOTICE_REASONS.filter((r) => !live.has(r.text));

      expect(dead.map((r) => r.code)).toEqual([]);
    });

    it('lee de verdad los dos fuentes, y no una lista vacía', () => {
      // Sin este fusible, un cambio de ruta dejaría las dos pruebas de arriba
      // en verde sobre cero razones — que es la forma más silenciosa de mentir.
      expect(reasonsInCode().length).toBe(AGENDA_NOTICE_REASONS.length);
    });
  });
});
