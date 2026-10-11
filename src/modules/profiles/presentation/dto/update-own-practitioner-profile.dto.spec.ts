import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { UpdateOwnPractitionerProfileDto } from './update-practitioner-profile.dto';

describe('UpdateOwnPractitionerProfileDto · dirección de trabajo', () => {
  it('acepta dirección y el par de coordenadas laborales', () => {
    const dto = plainToInstance(UpdateOwnPractitionerProfileDto, {
      workAddressLines: 'Calle Warnes 45',
      workLatitude: -17.78,
      workLongitude: -63.18,
    });

    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rechaza una coordenada laboral incompleta', () => {
    const dto = plainToInstance(UpdateOwnPractitionerProfileDto, {
      workLatitude: -17.78,
    });

    expect(validateSync(dto).map((error) => error.property)).toContain(
      'workLongitude',
    );
  });

  it('acepta quitar el GPS laboral con dos null explícitos', () => {
    const dto = plainToInstance(UpdateOwnPractitionerProfileDto, {
      workLatitude: null,
      workLongitude: null,
    });

    expect(validateSync(dto)).toHaveLength(0);
  });
});

describe('UpdateOwnPractitionerProfileDto · identidad fiscal', () => {
  it('acepta NIT y razón social en el PATCH profesional', () => {
    const dto = plainToInstance(UpdateOwnPractitionerProfileDto, {
      taxId: '1020304050',
      taxHolderName: 'Consultorio Uno',
    });

    expect(
      validateSync(dto, { whitelist: true, forbidNonWhitelisted: true }),
    ).toHaveLength(0);
  });

  it('rechaza un NIT que excede el contrato', () => {
    const dto = plainToInstance(UpdateOwnPractitionerProfileDto, {
      taxId: '1'.repeat(21),
    });

    expect(validateSync(dto).map((error) => error.property)).toContain('taxId');
  });
});
