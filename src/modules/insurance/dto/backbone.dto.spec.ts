import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreatePlanBenefitDto,
  CreatePlanDto,
  UpdateCarrierContactChannelsDto,
  UpdatePlanBenefitDto,
  UpdatePlanBenefitRulesDto,
} from './backbone.dto';

describe('DTOs administrativos de planes y coberturas', () => {
  it('rechaza una vigencia cuyo fin precede al inicio', async () => {
    const dto = plainToInstance(CreatePlanDto, {
      planCode: 'ORO',
      name: 'Plan Oro',
      effectiveFrom: '2026-12-31',
      effectiveTo: '2026-01-01',
    });

    expect(await validate(dto)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'effectiveTo' }),
      ]),
    );
  });

  it.each([
    ['coveragePercent', '100.01'],
    ['coveragePercent', '-1'],
    ['copayAmount', '-1'],
    ['deductibleAmount', '1.234'],
    ['annualLimitAmount', '10.999'],
  ])('rechaza %s inválido (%s)', async (field, value) => {
    const body = {
      coveragePercent: null,
      copayAmount: null,
      deductibleAmount: null,
      annualLimitAmount: null,
      [field]: value,
    };

    const errors = await validate(plainToInstance(UpdatePlanBenefitDto, body));
    expect(errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: field })]),
    );
  });

  it('acepta null para borrar cada importe', async () => {
    const dto = plainToInstance(UpdatePlanBenefitDto, {
      coveragePercent: null,
      copayAmount: null,
      deductibleAmount: null,
      annualLimitAmount: null,
    });

    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('valida categoría, fechas e importes al crear una cobertura', async () => {
    const dto = plainToInstance(CreatePlanBenefitDto, {
      benefitCategoryConceptId: 'not-a-uuid',
      effectiveFrom: 'ayer',
      coveragePercent: '101',
      copayAmount: '1.001',
    });

    const errors = await validate(dto);
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining([
        'benefitCategoryConceptId',
        'effectiveFrom',
        'coveragePercent',
        'copayAmount',
      ]),
    );
  });

  it('rechaza documentos repetidos o fuera del catálogo y exclusiones largas', async () => {
    const dto = plainToInstance(UpdatePlanBenefitRulesDto, {
      requiresPriorAuthorization: true,
      requiredDocuments: ['FIRMA_MEDICO', 'FIRMA_MEDICO', 'OTRO'],
      exclusionNotes: 'x'.repeat(1001),
    });

    const errors = await validate(dto);
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['requiredDocuments', 'exclusionNotes']),
    );
  });
});

describe('UpdateCarrierContactChannelsDto', () => {
  it('rechaza un WhatsApp sin el signo +', async () => {
    const dto = plainToInstance(UpdateCarrierContactChannelsDto, {
      whatsappNumber: '59171548278',
      callCenterPhone: null,
      supportEmail: null,
    });

    const errors = await validate(dto);
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['whatsappNumber']),
    );
    expect(
      Object.values(
        errors.find((e) => e.property === 'whatsappNumber')?.constraints ?? {},
      ),
    ).toEqual(expect.arrayContaining([expect.stringContaining('E.164')]));
  });

  it('normaliza espacios y separadores del WhatsApp antes de validar', async () => {
    const dto = plainToInstance(UpdateCarrierContactChannelsDto, {
      whatsappNumber: '+591 715-48278',
      callCenterPhone: null,
      supportEmail: null,
    });

    expect(dto.whatsappNumber).toBe('+59171548278');
    expect(await validate(dto)).toEqual([]);
  });

  it('rechaza un WhatsApp con letras', async () => {
    const dto = plainToInstance(UpdateCarrierContactChannelsDto, {
      whatsappNumber: '+591abc48278',
      callCenterPhone: null,
      supportEmail: null,
    });

    expect((await validate(dto)).map((e) => e.property)).toEqual(
      expect.arrayContaining(['whatsappNumber']),
    );
  });

  it('acepta los tres canales en null (borrado)', async () => {
    const dto = plainToInstance(UpdateCarrierContactChannelsDto, {
      whatsappNumber: null,
      callCenterPhone: null,
      supportEmail: null,
    });

    expect(await validate(dto)).toEqual([]);
  });

  it('acepta una línea de call center boliviana (no es E.164)', async () => {
    const dto = plainToInstance(UpdateCarrierContactChannelsDto, {
      whatsappNumber: null,
      callCenterPhone: '800-10-6060',
      supportEmail: null,
    });

    expect(await validate(dto)).toEqual([]);
  });

  it('rechaza un correo inválido', async () => {
    const dto = plainToInstance(UpdateCarrierContactChannelsDto, {
      whatsappNumber: null,
      callCenterPhone: null,
      supportEmail: 'no-es-un-correo',
    });

    expect((await validate(dto)).map((e) => e.property)).toEqual(
      expect.arrayContaining(['supportEmail']),
    );
  });
});
