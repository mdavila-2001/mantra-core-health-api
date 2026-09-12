import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import { CreateAdjudicationDto } from './claims.dto';

/**
 * Aplana los errores de `class-validator`, incluidos los de un `@ValidateNested`
 * (como `lineAdjudications`), a las rutas con punto (`lineAdjudications[0].policyClauseReference`).
 *
 * @param errores - Errores devueltos por `validate`.
 * @param prefijo - Ruta acumulada de las llamadas recursivas.
 * @returns Las rutas de las propiedades con error, ordenadas y sin repetidos.
 */
function rutasConError(
  errores: readonly ValidationError[],
  prefijo = '',
): string[] {
  const rutas: string[] = [];
  for (const error of errores) {
    const ruta = prefijo ? `${prefijo}.${error.property}` : error.property;
    if (error.constraints) rutas.push(ruta);
    if (error.children && error.children.length > 0) {
      rutas.push(...rutasConError(error.children, ruta));
    }
  }
  return [...new Set(rutas)].sort();
}

const LINEA_ID = '11111111-1111-4111-8111-111111111111';

/** Un `CreateAdjudicationDto` mínimo, con una sola línea. */
function dtoDe(linea: Record<string, unknown>): Record<string, unknown> {
  return {
    outcome: 'DENIED',
    lineAdjudications: [{ insuranceClaimLineId: LINEA_ID, ...linea }],
  };
}

async function propiedadesConError(
  alta: Record<string, unknown>,
): Promise<string[]> {
  const dto = plainToInstance(CreateAdjudicationDto, alta);
  const errores = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return rutasConError(errores);
}

/**
 * `LineAdjudicationDto.policyClauseReference`/`.denialRationale` — subtarea 2.2.
 *
 * El registro de procesos del stakeholder (MÓDULO ASEGURADORA · 2 · 3) exige que
 * un rechazo cite la cláusula del contrato: acá se prueba que la API lo hace
 * cumplir con un 400, no sólo que lo acepta cuando llega.
 */
describe('LineAdjudicationDto · cláusula y justificación del rechazo', () => {
  it('DENIED sin cláusula: 400 en policyClauseReference (Escenario 2)', async () => {
    expect(await propiedadesConError(dtoDe({ decision: 'DENIED' }))).toEqual([
      'lineAdjudications.0.policyClauseReference',
    ]);
  });

  it('DENIED con cláusula vacía: también rechazada', async () => {
    expect(
      await propiedadesConError(
        dtoDe({ decision: 'DENIED', policyClauseReference: '' }),
      ),
    ).toEqual(['lineAdjudications.0.policyClauseReference']);
  });

  it('DENIED con cláusula: sin errores', async () => {
    expect(
      await propiedadesConError(
        dtoDe({
          decision: 'DENIED',
          policyClauseReference: 'Cláusula 12.3: Fármaco fuera de vademécum',
        }),
      ),
    ).toEqual([]);
  });

  it('APPROVED sin cláusula: sin errores — no es obligatoria al aprobar', async () => {
    expect(await propiedadesConError(dtoDe({ decision: 'APPROVED' }))).toEqual(
      [],
    );
  });

  it('APPROVED con cláusula demasiado larga: sí se valida (maxLength)', async () => {
    expect(
      await propiedadesConError(
        dtoDe({ decision: 'APPROVED', policyClauseReference: 'x'.repeat(256) }),
      ),
    ).toEqual(['lineAdjudications.0.policyClauseReference']);
  });

  it('denialRationale demasiado larga: rechazada', async () => {
    expect(
      await propiedadesConError(
        dtoDe({
          decision: 'DENIED',
          policyClauseReference: 'Cláusula 4.1',
          denialRationale: 'x'.repeat(4001),
        }),
      ),
    ).toEqual(['lineAdjudications.0.denialRationale']);
  });

  it('denialRationale es opcional incluso al denegar', async () => {
    expect(
      await propiedadesConError(
        dtoDe({ decision: 'DENIED', policyClauseReference: 'Cláusula 4.1' }),
      ),
    ).toEqual([]);
  });
});
