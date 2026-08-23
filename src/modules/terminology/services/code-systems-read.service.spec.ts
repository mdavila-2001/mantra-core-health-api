import { describe, expect, it, jest } from '@jest/globals';

import { CONCEPTS } from '../../../common';
import { CodeSystemsReadService } from './code-systems-read.service';

/**
 * Esta lista es lo único que decide qué versión se le ofrece a quien va a
 * importar conceptos, así que su error más caro no es fallar: es ofrecer una
 * versión que el importador va a rechazar. La persona sube el archivo, espera, y
 * recién ahí se entera de que esa versión nunca los iba a aceptar.
 *
 * Por eso lo que se fija acá es la **equivalencia** con el criterio del
 * importador (`ConceptFileImportService`: sólo borrador o sin estado), no una
 * lista de estados escrita a mano que puede quedar desfasada.
 *
 * @param versiones - Las filas que devuelve la base.
 */
function armar(versiones: readonly Record<string, unknown>[]) {
  const fork = {
    find: jest.fn<() => Promise<unknown>>().mockResolvedValue(versiones),
  };
  const em = { fork: jest.fn(() => fork) };

  return {
    service: new CodeSystemsReadService(em as never),
  };
}

/** Una fila de versión con el estado indicado. */
function version(stateConceptId: string | null): Record<string, unknown> {
  return {
    id: `v-${String(stateConceptId)}`,
    codeSystemId: 'cs-1',
    version: '2026',
    stateConceptId,
    isDefault: false,
    publishedAt: null,
  };
}

describe('CodeSystemsReadService', () => {
  it('un borrador y una versión sin estado admiten conceptos', async () => {
    // El `null` es el hueco que dejan los ETL de `tools/terminology-import/`:
    // no fijan estado, y son ~450 000 conceptos ya cargados.
    const { service } = armar([version(CONCEPTS.TERM_DRAFT), version(null)]);

    const [borrador, sinEstado] = await service.listVersions('cs-1');

    expect(borrador.state).toBe('DRAFT');
    expect(borrador.acceptsConcepts).toBe(true);
    expect(sinEstado.state).toBe('UNKNOWN');
    expect(sinEstado.acceptsConcepts).toBe(true);
  });

  it('una versión publicada no admite conceptos', async () => {
    const { service } = armar([version(CONCEPTS.TERM_ACTIVE)]);

    const [publicada] = await service.listVersions('cs-1');

    expect(publicada.state).toBe('ACTIVE');
    expect(publicada.acceptsConcepts).toBe(false);
  });

  it('una versión retirada u obsoleta tampoco los admite, y se nombra', async () => {
    // El criterio era `!== TERM_ACTIVE`, que dejaba pasar estas dos: el
    // desplegable las ofrecía y el 422 llegaba recién al enviar el archivo.
    // Además caían en `UNKNOWN`, que acá significa «sin estado» —el caso que sí
    // los admite—, así que la etiqueta reforzaba el engaño.
    const { service } = armar([
      version(CONCEPTS.TERM_RETIRED),
      version(CONCEPTS.TERM_DEPRECATED),
    ]);

    const [retirada, obsoleta] = await service.listVersions('cs-1');

    expect(retirada.state).toBe('RETIRED');
    expect(retirada.acceptsConcepts).toBe(false);
    expect(obsoleta.state).toBe('DEPRECATED');
    expect(obsoleta.acceptsConcepts).toBe(false);
  });
});
