import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ReceivedClaimDecisionDto } from './received-claims.dto';

/**
 * Los errores de validación, como los vería el `ValidationPipe` global de
 * `main.ts` (`whitelist` y `forbidNonWhitelisted`).
 *
 * @param body - Lo que mandaría el cliente.
 * @returns Las propiedades que no pasaron, en orden.
 */
async function errors(body: unknown): Promise<string[]> {
  const dto = plainToInstance(ReceivedClaimDecisionDto, body);
  const errores = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return errores.map((e) => e.property).sort();
}

describe('ReceivedClaimDecisionDto', () => {
  describe('correcto', () => {
    it.each(['APPROVED', 'PARTIAL', 'REJECTED'])(
      'acepta el resultado %s solo',
      async (outcome) => {
        expect(await errors({ outcome })).toEqual([]);
      },
    );

    it('acepta el cuerpo completo de una aprobación parcial', async () => {
      expect(
        await errors({
          outcome: 'PARTIAL',
          approvedAmount: '200.00',
          reason: 'El plan cubre la mitad',
          policyClauseReference: 'Cláusula 7.2',
        }),
      ).toEqual([]);
    });
  });

  describe('límite', () => {
    it.each(['0', '0.5', '0.05', '1', '400.25', '1234567.89'])(
      'acepta el monto %s',
      async (approvedAmount) => {
        expect(await errors({ outcome: 'PARTIAL', approvedAmount })).toEqual(
          [],
        );
      },
    );

    it('acepta un motivo de 1000 caracteres y una cláusula de 255', async () => {
      expect(
        await errors({
          outcome: 'REJECTED',
          reason: 'a'.repeat(1000),
          policyClauseReference: 'c'.repeat(255),
        }),
      ).toEqual([]);
    });
  });

  describe('inválido', () => {
    it.each([
      ['un resultado fuera del set', { outcome: 'DENIED' }],
      ['un resultado ausente', {}],
      ['un resultado en minúsculas', { outcome: 'approved' }],
    ])('rechaza %s', async (_caso, body) => {
      expect(await errors(body)).toEqual(['outcome']);
    });

    it.each(['abc', '-5', '10.123', '1,5', '1e3', '', ' 10.00'])(
      'rechaza el monto %j',
      async (approvedAmount) => {
        expect(await errors({ outcome: 'PARTIAL', approvedAmount })).toEqual(
          ['approvedAmount'],
        );
      },
    );

    it('rechaza un monto que no es cadena: el dinero viaja como cadena decimal', async () => {
      expect(
        await errors({ outcome: 'PARTIAL', approvedAmount: 200 }),
      ).toEqual(['approvedAmount']);
    });

    it('rechaza un motivo de más de 1000 caracteres y una cláusula de más de 255', async () => {
      expect(
        await errors({
          outcome: 'REJECTED',
          reason: 'a'.repeat(1001),
          policyClauseReference: 'c'.repeat(256),
        }),
      ).toEqual(['policyClauseReference', 'reason']);
    });

    it('rechaza claves que el contrato no declara: no se cuela un estado, un autor ni un id', async () => {
      expect(
        await errors({
          outcome: 'APPROVED',
          statusConceptId: 'x',
          decidedBy: 'x',
          insuranceCarrierId: 'x',
        }),
      ).toEqual(['decidedBy', 'insuranceCarrierId', 'statusConceptId']);
    });
  });
});
