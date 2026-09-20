import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  AGENDA_NOTICE_REASONS,
  esReintentable,
  razonDeCodigo,
  razonDeTexto,
} from './agenda-notice-reason.catalog';

/**
 * Los dos archivos que producen razones para esta relación.
 *
 * Se leen como **texto**, no se importan: lo que se está comprobando es que el
 * catálogo siga describiendo al código, y un import no ve los literales que
 * están dentro de un `return`.
 */
const ADAPTADORES = join(
  process.cwd(),
  'src',
  'modules',
  'scheduling',
  'adapters',
);
const FUENTES = [
  join(ADAPTADORES, 'messaging-agenda-notice.adapter.ts'),
  join(ADAPTADORES, 'support-admin-notice.adapter.ts'),
];

/**
 * Un literal asignado a alguno de los tres campos de razón.
 *
 * El `(?:[^,'"]*\?\?\s*)?` cubre el caso de la supresión, donde el texto del
 * catálogo es el respaldo de uno que puede venir de la base:
 * `skippedReason: request.suppressionReason ?? '…'`.
 */
const ASIGNACION_DE_RAZON =
  /(?:skippedReason|emailSkippedReason|chatSkippedReason)\s*:\s*(?:[^,'"]*\?\?\s*)?'((?:[^'\\]|\\.)*)'/g;

/** Los literales que el código emite hoy, leídos del fuente. */
function razonesEnElCodigo(): string[] {
  const encontradas = new Set<string>();
  for (const ruta of FUENTES) {
    // Prettier parte los literales largos en varias líneas; colapsar el espacio
    // vuelve a juntar `skippedReason:` con su texto.
    const fuente = readFileSync(ruta, 'utf8').replace(/\s+/g, ' ');
    for (const coincidencia of fuente.matchAll(ASIGNACION_DE_RAZON)) {
      encontradas.add(coincidencia[1]);
    }
  }
  return [...encontradas];
}

describe('catálogo de razones de AgendaNoticePort', () => {
  it('no tiene códigos ni textos repetidos', () => {
    const codigos = AGENDA_NOTICE_REASONS.map((r) => r.code);
    const textos = AGENDA_NOTICE_REASONS.map((r) => r.text);

    expect(new Set(codigos).size).toBe(codigos.length);
    expect(new Set(textos).size).toBe(textos.length);
  });

  it('traduce un texto vivo a su código', () => {
    const razon = razonDeTexto('El destinatario no tiene cuenta de portal');

    expect(razon?.code).toBe('NO_PORTAL_ACCOUNT');
    expect(razon?.reasonClass).toBe('terminal');
  });

  it('devuelve null ante un texto que nadie catalogó, en vez de adivinar', () => {
    expect(razonDeTexto('vaya usted a saber')).toBeNull();
    expect(razonDeTexto(undefined)).toBeNull();
    expect(razonDeCodigo('NO_EXISTE')).toBeNull();
  });

  it('separa lo que se reintenta de lo que no', () => {
    expect(esReintentable('No se pudo encolar el correo')).toBe(true);
    expect(esReintentable('La cuenta no declaró correo')).toBe(false);
    expect(esReintentable('Ya había un aviso igual sin entregar')).toBe(false);
    // Lo desconocido no se reintenta: un bucle que nadie pidió es peor que un
    // aviso perdido que sí queda registrado.
    expect(esReintentable('un texto nuevo')).toBe(false);
  });

  it('el rebote no se cuenta como fallo', () => {
    const rebotes = AGENDA_NOTICE_REASONS.filter(
      (r) => r.reasonClass === 'not-a-failure',
    );

    expect(rebotes.map((r) => r.code).sort()).toEqual([
      'EMAIL_DEBOUNCED',
      'IN_APP_DEBOUNCED',
    ]);
  });

  describe('fidelidad contra el código', () => {
    it('cataloga TODAS las razones que los adaptadores emiten hoy', () => {
      const sinCatalogar = razonesEnElCodigo().filter(
        (texto) => razonDeTexto(texto) === null,
      );

      // Si esto se pone en rojo, alguien agregó una razón y no la catalogó: el
      // arreglo es agregarla acá, no borrar la prueba.
      expect(sinCatalogar).toEqual([]);
    });

    it('no cataloga razones que el código ya no emite', () => {
      const vivas = new Set(razonesEnElCodigo());
      const muertas = AGENDA_NOTICE_REASONS.filter((r) => !vivas.has(r.text));

      expect(muertas.map((r) => r.code)).toEqual([]);
    });

    it('lee de verdad los dos fuentes, y no una lista vacía', () => {
      // Sin este fusible, un cambio de ruta dejaría las dos pruebas de arriba
      // en verde sobre cero razones — que es la forma más silenciosa de mentir.
      expect(razonesEnElCodigo().length).toBe(AGENDA_NOTICE_REASONS.length);
    });
  });
});
