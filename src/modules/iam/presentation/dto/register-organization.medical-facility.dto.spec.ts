import { describe, it, expect } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';

import { RegisterOrganizationDto } from './register-organization.dto';

/** Aplana el árbol de `ValidationError` a rutas `a.b[0].c`. */
function routesWithError(
  errors: readonly ValidationError[],
  prefix = '',
): string[] {
  const routes: string[] = [];
  for (const error of errors) {
    const route = prefix
      ? /^\d+$/.test(error.property)
        ? `${prefix}[${error.property}]`
        : `${prefix}.${error.property}`
      : error.property;
    if (error.constraints) routes.push(route);
    if (error.children && error.children.length > 0) {
      routes.push(...routesWithError(error.children, route));
    }
  }
  return [...new Set(routes)].sort();
}

/** Valida como el `ValidationPipe` global (whitelist + forbidNonWhitelisted). */
async function validateBody(body: Record<string, unknown>) {
  const dto = plainToInstance(RegisterOrganizationDto, body);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return { dto, routes: routesWithError(errors) };
}

const MEDICAL_FACILITY = {
  taxIdentifierNumber: '1023456789',
  healthFacilityRegistrationNumber: 'SEDES-SC-2020-0412',
  medicalDirector: {
    name: 'Ana',
    middleName: 'Lucía',
    lastName: 'Rojas',
    motherLastName: 'Paz',
    professionalLicenseNumber: 'MAT-12345',
    email: 'dir@clinica.bo',
    phone: '+591 70012345',
  },
  headquarters: {
    name: 'Casa central',
    addressLines: ['Av. San Martín 123'],
    latitude: -17.78,
    longitude: -63.18,
  },
  branches: [
    {
      name: 'Sucursal Equipetrol',
      addressLines: ['Av. Equipetrol 45'],
      latitude: -17.7,
      longitude: -63.1,
    },
  ],
};

/** Un alta de organización médica con el bloque `medicalFacility`. */
function registration(
  medicalFacility: Record<string, unknown> | undefined = MEDICAL_FACILITY,
  tenantType = 'CLINIC',
): Record<string, unknown> {
  return {
    organization: {
      code: 'CLINICA_Z',
      legalName: 'Clínica Z S.R.L.',
      tenantType,
      ...(medicalFacility === undefined ? {} : { medicalFacility }),
    },
    owner: {
      email: 'ana@ejemplo.test',
      password: 'secreto12',
      name: 'Ana',
      lastName: 'Paz',
    },
  };
}

describe('RegisterOrganizationDto · organization.medicalFacility', () => {
  it('acepta el bloque completo del contrato', async () => {
    expect((await validateBody(registration())).routes).toEqual([]);
  });

  it('el bloque es opcional: un cliente que no lo manda no se rompe', async () => {
    expect((await validateBody(registration(undefined))).routes).toEqual([]);
  });

  it('acepta el mínimo: NIT, registro sanitario y director (sin sedes)', async () => {
    const { headquarters: _hq, branches: _b, ...minimal } = MEDICAL_FACILITY;
    expect((await validateBody(registration(minimal))).routes).toEqual([]);
  });

  it('acepta director sin los campos opcionales', async () => {
    const {
      middleName: _m,
      motherLastName: _ml,
      phone: _p,
      ...director
    } = MEDICAL_FACILITY.medicalDirector;
    expect(
      (
        await validateBody(
          registration({ ...MEDICAL_FACILITY, medicalDirector: director }),
        )
      ).routes,
    ).toEqual([]);
  });

  it.each(['taxIdentifierNumber', 'healthFacilityRegistrationNumber'])(
    'exige %s cuando viene el bloque',
    async (field) => {
      const { [field]: _omitted, ...rest } = MEDICAL_FACILITY as Record<
        string,
        unknown
      >;
      expect((await validateBody(registration(rest))).routes).toContain(
        `organization.medicalFacility.${field}`,
      );
    },
  );

  it('exige el director médico cuando viene el bloque', async () => {
    const { medicalDirector: _omitted, ...rest } = MEDICAL_FACILITY;
    expect((await validateBody(registration(rest))).routes).toContain(
      'organization.medicalFacility.medicalDirector',
    );
  });

  it.each(['name', 'lastName', 'professionalLicenseNumber', 'email'] as const)(
    'exige %s del director médico',
    async (field) => {
      const director: Record<string, unknown> = {
        ...MEDICAL_FACILITY.medicalDirector,
      };
      delete director[field];
      expect(
        (
          await validateBody(
            registration({ ...MEDICAL_FACILITY, medicalDirector: director }),
          )
        ).routes,
      ).toContain(`organization.medicalFacility.medicalDirector.${field}`);
    },
  );

  describe('NIT', () => {
    it.each(['1023', '1023456789', '1023-456-789', '0'.repeat(20)])(
      'acepta %s',
      async (nit) => {
        expect(
          (
            await validateBody(
              registration({ ...MEDICAL_FACILITY, taxIdentifierNumber: nit }),
            )
          ).routes,
        ).toEqual([]);
      },
    );

    it.each(['102', '-1023', 'ABC1234', '1023 456', '1'.repeat(21), '102.345'])(
      'rechaza %s',
      async (nit) => {
        expect(
          (
            await validateBody(
              registration({ ...MEDICAL_FACILITY, taxIdentifierNumber: nit }),
            )
          ).routes,
        ).toContain('organization.medicalFacility.taxIdentifierNumber');
      },
    );
  });

  describe('número de registro sanitario', () => {
    it.each(['SEDES-SC-2020-0412', 'ABC', 'RS/2020/1.5', 'a'.repeat(50)])(
      'acepta %s',
      async (value) => {
        expect(
          (
            await validateBody(
              registration({
                ...MEDICAL_FACILITY,
                healthFacilityRegistrationNumber: value,
              }),
            )
          ).routes,
        ).toEqual([]);
      },
    );

    it.each(['AB', 'a'.repeat(51), 'SEDES 2020', 'SEDES_2020', 'ñandú-1', ''])(
      'rechaza %j',
      async (value) => {
        expect(
          (
            await validateBody(
              registration({
                ...MEDICAL_FACILITY,
                healthFacilityRegistrationNumber: value,
              }),
            )
          ).routes,
        ).toContain(
          'organization.medicalFacility.healthFacilityRegistrationNumber',
        );
      },
    );

    it('recorta los blancos de los extremos antes de validar', async () => {
      const { dto, routes } = await validateBody(
        registration({
          ...MEDICAL_FACILITY,
          taxIdentifierNumber: ' 1023456789 ',
          healthFacilityRegistrationNumber: '  SEDES-SC-2020-0412\n',
        }),
      );
      expect(routes).toEqual([]);
      expect(dto.organization.medicalFacility?.taxIdentifierNumber).toBe(
        '1023456789',
      );
      expect(
        dto.organization.medicalFacility?.healthFacilityRegistrationNumber,
      ).toBe('SEDES-SC-2020-0412');
    });
  });

  describe('matrícula del director médico', () => {
    it.each(['AB', 'a'.repeat(51), '  '])('rechaza %j', async (value) => {
      expect(
        (
          await validateBody(
            registration({
              ...MEDICAL_FACILITY,
              medicalDirector: {
                ...MEDICAL_FACILITY.medicalDirector,
                professionalLicenseNumber: value,
              },
            }),
          )
        ).routes,
      ).toContain(
        'organization.medicalFacility.medicalDirector.professionalLicenseNumber',
      );
    });

    it('rechaza un correo mal formado', async () => {
      expect(
        (
          await validateBody(
            registration({
              ...MEDICAL_FACILITY,
              medicalDirector: {
                ...MEDICAL_FACILITY.medicalDirector,
                email: 'no-es-un-correo',
              },
            }),
          )
        ).routes,
      ).toContain('organization.medicalFacility.medicalDirector.email');
    });
  });

  describe('coordenadas: ambas o ninguna', () => {
    it('rechaza la casa central con sólo latitud', async () => {
      const { routes } = await validateBody(
        registration({
          ...MEDICAL_FACILITY,
          headquarters: { addressLines: ['x'], latitude: -17.78 },
        }),
      );
      expect(routes).toContain(
        'organization.medicalFacility.headquarters.longitude',
      );
    });

    it('rechaza la casa central con sólo longitud', async () => {
      const { routes } = await validateBody(
        registration({
          ...MEDICAL_FACILITY,
          headquarters: { addressLines: ['x'], longitude: -63.18 },
        }),
      );
      expect(routes).toContain(
        'organization.medicalFacility.headquarters.latitude',
      );
    });

    it('rechaza una sucursal con sólo una coordenada', async () => {
      const { routes } = await validateBody(
        registration({
          ...MEDICAL_FACILITY,
          branches: [{ name: 'S', addressLines: ['x'], longitude: -63.1 }],
        }),
      );
      expect(routes).toContain(
        'organization.medicalFacility.branches[0].latitude',
      );
    });

    it('acepta una sede sin ninguna coordenada', async () => {
      expect(
        (
          await validateBody(
            registration({
              ...MEDICAL_FACILITY,
              headquarters: { addressLines: ['x'] },
              branches: [{ name: 'S', addressLines: ['x'] }],
            }),
          )
        ).routes,
      ).toEqual([]);
    });

    it('acepta {0, 0}: cero es una coordenada, no «sin dato»', async () => {
      expect(
        (
          await validateBody(
            registration({
              ...MEDICAL_FACILITY,
              headquarters: { addressLines: ['x'], latitude: 0, longitude: 0 },
            }),
          )
        ).routes,
      ).toEqual([]);
    });

    it('rechaza coordenadas fuera de rango', async () => {
      const { routes } = await validateBody(
        registration({
          ...MEDICAL_FACILITY,
          headquarters: { addressLines: ['x'], latitude: 91, longitude: 181 },
        }),
      );
      expect(routes).toEqual(
        expect.arrayContaining([
          'organization.medicalFacility.headquarters.latitude',
          'organization.medicalFacility.headquarters.longitude',
        ]),
      );
    });
  });

  describe('sedes', () => {
    it('la casa central exige al menos una línea de dirección', async () => {
      expect(
        (
          await validateBody(
            registration({
              ...MEDICAL_FACILITY,
              headquarters: { addressLines: [] },
            }),
          )
        ).routes,
      ).toContain('organization.medicalFacility.headquarters.addressLines');
    });

    it('la sucursal exige nombre', async () => {
      expect(
        (
          await validateBody(
            registration({
              ...MEDICAL_FACILITY,
              branches: [{ addressLines: ['x'] }],
            }),
          )
        ).routes,
      ).toContain('organization.medicalFacility.branches[0].name');
    });

    it('rechaza una línea de dirección vacía', async () => {
      expect(
        (
          await validateBody(
            registration({
              ...MEDICAL_FACILITY,
              headquarters: { addressLines: ['   '] },
            }),
          )
        ).routes,
      ).toContain('organization.medicalFacility.headquarters.addressLines');
    });

    it('admite 50 sucursales y rechaza 51', async () => {
      const make = (count: number) =>
        Array.from({ length: count }, (_, index) => ({
          name: `Sucursal ${index + 1}`,
          addressLines: ['x'],
        }));
      expect(
        (
          await validateBody(
            registration({ ...MEDICAL_FACILITY, branches: make(50) }),
          )
        ).routes,
      ).toEqual([]);
      expect(
        (
          await validateBody(
            registration({ ...MEDICAL_FACILITY, branches: make(51) }),
          )
        ).routes,
      ).toContain('organization.medicalFacility.branches');
    });

    it('rechaza una propiedad que el contrato no declara (forbidNonWhitelisted)', async () => {
      expect(
        (await validateBody(registration({ ...MEDICAL_FACILITY, beds: 120 })))
          .routes,
      ).toContain('organization.medicalFacility.beds');
    });
  });

  it.each(['HOSPITAL', 'CLINIC', 'MEDICAL_OFFICE', 'NURSING', 'HEALTH_OTHER'])(
    'el DTO acepta el bloque con %s',
    async (tenantType) => {
      expect(
        (await validateBody(registration(MEDICAL_FACILITY, tenantType))).routes,
      ).toEqual([]);
    },
  );
});
