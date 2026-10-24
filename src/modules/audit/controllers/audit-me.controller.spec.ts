import { jest } from '@jest/globals';
import { ValidationPipe } from '@nestjs/common';
import { AuditMeController } from './audit-me.controller';
import { MyDataAccessQueryDto } from '../dto/audit-query.dto';

// Fábrica de mocks con tipos sueltos: el contrato que se prueba es el del controlador, no el de jest.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const titular = {
  id: 'u-pac',
  roles: ['PATIENT'],
  patientProfileId: 'p-1',
} as any;

function build() {
  const query = {
    myDataAccess: mockFn().mockResolvedValue({
      items: [],
      nextCursor: null,
      limit: 50,
    }),
  };
  const controller = new AuditMeController(query as any);
  return { controller, query };
}

describe('AuditMeController', () => {
  it('delega en el servicio con el actor de la sesión y la consulta, sin id de paciente', async () => {
    const d = build();
    const q = { limit: 10 } as MyDataAccessQueryDto;

    const res = await d.controller.myDataAccess(titular, q);

    expect(d.query.myDataAccess).toHaveBeenCalledWith(titular, q);
    expect(res.limit).toBe(50);
  });
});

describe('MyDataAccessQueryDto (contrato del query string)', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  });
  const run = (value: Record<string, unknown>) =>
    pipe.transform(value, {
      type: 'query',
      metatype: MyDataAccessQueryDto,
      data: '',
    });

  it('acepta rango, límite y cursor', async () => {
    const dto = (await run({
      from: '2026-10-01T00:00:00.000Z',
      to: '2026-10-24T00:00:00.000Z',
      limit: '25',
      cursor: 'abc',
    })) as MyDataAccessQueryDto;

    expect(dto.limit).toBe(25);
    expect(dto.cursor).toBe('abc');
  });

  it.each(['patientProfileId', 'userId', 'tenantId', 'resourceType'])(
    'rechaza %s: el titular, el actor y el tenant no se eligen por parámetro',
    async (param) => {
      await expect(
        run({ [param]: '00000000-0000-4000-8000-000000000001' }),
      ).rejects.toMatchObject({ status: 400 });
    },
  );

  it('rechaza un límite fuera de 1..200 y una fecha que no es ISO 8601', async () => {
    await expect(run({ limit: '0' })).rejects.toMatchObject({ status: 400 });
    await expect(run({ limit: '201' })).rejects.toMatchObject({ status: 400 });
    await expect(run({ from: 'ayer' })).rejects.toMatchObject({ status: 400 });
  });
});
