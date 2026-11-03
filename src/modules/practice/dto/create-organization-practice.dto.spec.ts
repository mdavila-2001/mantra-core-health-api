import { describe, it, expect } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';

import { CreateOrganizationPracticeDto } from './create-organization-practice.dto';

const VALID = {
  name: 'Centro Médico Norte',
  site: {
    name: 'Sede Norte',
    addressText: 'Av. San Martín 123',
    latitude: -17.78,
    longitude: -63.18,
    cityText: 'Santa Cruz de la Sierra',
  },
};

/** Rutas `a.b` de las propiedades que quedaron mal. */
function routes(errors: readonly ValidationError[], prefix = ''): string[] {
  const out: string[] = [];
  for (const error of errors) {
    const route = prefix ? `${prefix}.${error.property}` : error.property;
    if (error.constraints) out.push(route);
    if (error.children?.length) out.push(...routes(error.children, route));
  }
  return [...new Set(out)].sort();
}

async function propertiesWithError(body: Record<string, unknown>) {
  const dto = plainToInstance(CreateOrganizationPracticeDto, body);
  return routes(
    await validate(dto, { whitelist: true, forbidNonWhitelisted: true }),
  );
}

describe('CreateOrganizationPracticeDto', () => {
  it('acepta el cuerpo completo', async () => {
    expect(await propertiesWithError(VALID)).toEqual([]);
  });

  it('acepta el cuerpo sin la ciudad', async () => {
    const { cityText: _omit, ...site } = VALID.site;
    expect(await propertiesWithError({ ...VALID, site })).toEqual([]);
  });

  it.each([
    ['latitud sobre 90', { latitude: 91 }, 'site.latitude'],
    ['latitud bajo -90', { latitude: -90.5 }, 'site.latitude'],
    ['longitud sobre 180', { longitude: 181 }, 'site.longitude'],
    ['longitud bajo -180', { longitude: -180.1 }, 'site.longitude'],
  ])('rechaza %s', async (_caso, patch, route) => {
    expect(
      await propertiesWithError({
        ...VALID,
        site: { ...VALID.site, ...patch },
      }),
    ).toEqual([route]);
  });

  it('exige dirección y coordenadas', async () => {
    const site = { name: 'Sede Norte' };
    expect(await propertiesWithError({ ...VALID, site })).toEqual([
      'site.addressText',
      'site.latitude',
      'site.longitude',
    ]);
  });

  it('exige la sede', async () => {
    expect(await propertiesWithError({ name: 'Centro Médico Norte' })).toEqual([
      'site',
    ]);
  });

  it('rechaza una clave desconocida', async () => {
    expect(await propertiesWithError({ ...VALID, tenantId: 'x' })).toEqual([
      'tenantId',
    ]);
  });
});
