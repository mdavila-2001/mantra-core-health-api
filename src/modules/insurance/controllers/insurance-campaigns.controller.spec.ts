import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import {
  ActiveCampaignsQueryDto,
  CreateInsuranceCampaignDto,
  InsuranceCampaignListQueryDto,
  UpdateInsuranceCampaignDto,
  UpdateInsuranceCampaignStatusDto,
} from '../dto';

/** Rutas con error, aplanando `@ValidateNested` (p. ej. `partners[0].role`). */
function rutasWithError(
  errors: readonly ValidationError[],
  prefix = '',
): string[] {
  const rutas: string[] = [];
  for (const error of errors) {
    const ruta = prefix ? `${prefix}.${error.property}` : error.property;
    if (error.constraints) rutas.push(ruta);
    if (error.children && error.children.length > 0) {
      rutas.push(...rutasWithError(error.children, ruta));
    }
  }
  return [...new Set(rutas)].sort();
}

async function errors<T extends object>(
  cls: new () => T,
  registration: Record<string, unknown>,
): Promise<string[]> {
  const dto = plainToInstance(cls, registration);
  const errores = await validate(dto as object, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return rutasWithError(errores);
}

const VALID_PARTNER = {
  role: 'PROVIDER',
  type: 'LABORATORY',
  name: 'Laboratorio Central AloVida',
};

function validCreate(overrides: Record<string, unknown> = {}) {
  return {
    code: 'CMP-CARDIO-2026',
    title: 'Chequeo Preventivo Cardiovascular',
    campaignType: 'LABORATORY',
    targetConditionCode: 'I10',
    copayBonusPercentage: 100,
    validFrom: '2026-09-25',
    validTo: '2026-11-24',
    partners: [VALID_PARTNER],
    ...overrides,
  };
}

/**
 * DoD A.3 de la Tarea 4: el `ValidationPipe` global (`whitelist` +
 * `forbidNonWhitelisted`, `src/main.ts`) rechaza campos no autorizados y
 * valores fuera de rango ANTES de que el controlador vea el request. Estas
 * pruebas ejercitan esa validación directamente sobre los DTO, sin levantar
 * la app — mismo patrón que `dto/claims.dto.spec.ts`.
 */
describe('Validación de los DTO de campañas preventivas (ValidationPipe)', () => {
  it('un alta válida no tiene errores', async () => {
    expect(await errors(CreateInsuranceCampaignDto, validCreate())).toEqual([]);
  });

  it.each([
    ['insuranceCarrierId', 'carrier-ajeno'],
    ['tenantId', 'tenant-ajeno'],
    ['status', 'ACTIVE'],
    ['createdByUserId', 'user-x'],
  ])('rechaza el campo no autorizado `%s`', async (campo, valor) => {
    const errores = await errors(CreateInsuranceCampaignDto, {
      ...validCreate(),
      [campo]: valor,
    });
    expect(errores).toContain(campo);
  });

  it('rechaza copayBonusPercentage mayor a 100', async () => {
    const errores = await errors(CreateInsuranceCampaignDto, {
      ...validCreate(),
      copayBonusPercentage: 101,
    });
    expect(errores).toContain('copayBonusPercentage');
  });

  it('rechaza copayBonusPercentage con más de 2 decimales', async () => {
    const errores = await errors(CreateInsuranceCampaignDto, {
      ...validCreate(),
      copayBonusPercentage: 99.999,
    });
    expect(errores).toContain('copayBonusPercentage');
  });

  it('rechaza el código en minúsculas', async () => {
    const errores = await errors(CreateInsuranceCampaignDto, {
      ...validCreate(),
      code: 'cmp-cardio-2026',
    });
    expect(errores).toContain('code');
  });

  it('rechaza una fecha fuera de AAAA-MM-DD', async () => {
    const errores = await errors(CreateInsuranceCampaignDto, {
      ...validCreate(),
      validFrom: '25/09/2026',
    });
    expect(errores).toContain('validFrom');
  });

  it('rechaza cero aliados', async () => {
    const errores = await errors(CreateInsuranceCampaignDto, {
      ...validCreate(),
      partners: [],
    });
    expect(errores).toContain('partners');
  });

  it('rechaza más de 20 aliados', async () => {
    const errores = await errors(CreateInsuranceCampaignDto, {
      ...validCreate(),
      partners: Array.from({ length: 21 }, () => VALID_PARTNER),
    });
    expect(errores).toContain('partners');
  });

  it('rechaza un rol de aliado que no está en el catálogo', async () => {
    const errores = await errors(CreateInsuranceCampaignDto, {
      ...validCreate(),
      partners: [{ ...VALID_PARTNER, role: 'INVESTOR' }],
    });
    expect(errores).toContain('partners.0.role');
  });

  it('rechaza `DRAFT` como destino del cambio de estado (no es un target válido)', async () => {
    const errores = await errors(UpdateInsuranceCampaignStatusDto, {
      status: 'DRAFT',
    });
    expect(errores).toContain('status');
  });

  it('rechaza `code` en la edición: es inmutable, no está en el DTO', async () => {
    const errores = await errors(UpdateInsuranceCampaignDto, {
      code: 'CMP-NUEVO',
      title: 'Igual válido',
    });
    expect(errores).toContain('code');
  });

  it('una edición vacía (sin ningún campo) no tiene errores: todo es opcional', async () => {
    expect(await errors(UpdateInsuranceCampaignDto, {})).toEqual([]);
  });

  it.each([0, 101])('rechaza limit=%i en el listado', async (limit) => {
    const errores = await errors(InsuranceCampaignListQueryDto, { limit });
    expect(errores).toContain('limit');
  });

  it('acepta limit dentro de 1..100', async () => {
    expect(await errors(InsuranceCampaignListQueryDto, { limit: 50 })).toEqual(
      [],
    );
  });

  it('rechaza un carrierId que no es uuid en la consulta pública', async () => {
    const errores = await errors(ActiveCampaignsQueryDto, {
      carrierId: 'no-es-un-uuid',
    });
    expect(errores).toContain('carrierId');
  });

  it('la consulta pública sin filtro no tiene errores', async () => {
    expect(await errors(ActiveCampaignsQueryDto, {})).toEqual([]);
  });
});
