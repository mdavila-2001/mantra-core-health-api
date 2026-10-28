import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { BadRequestException } from '@nestjs/common';
import { ResourceNotFoundException } from '../../../common';
import { PROCEDURE_IMPORT_MAX } from '../dto';
import {
  ProcedureImportService,
  matchTariffSpecialties,
  normalizeSpecialty,
  toDefaultPrice,
} from './procedure-import.service';

const admin = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const doctor = {
  id: 'user-med',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'hp-1',
} as any;

/** Las especialidades que publica el arancel de Santa Cruz (nombres reales). */
const TARIFF = [
  ['Auditoría Médica', 4],
  ['Cardiología', 98],
  ['Cirugía General', 319],
  ['Cirugía Pediátrica', 220],
  ['Dermatología', 110],
  ['Endocrinología, Metabolismo y Nutrición', 21],
  ['Emergenciología', 48],
  ['Gastroenterología y Endoscopía Digestiva', 57],
  ['Medicina Crítica y Terapia Intensiva', 42],
  ['Medicina Física y Rehabilitación', 45],
  ['Medicina General', 13],
  ['Medicina Interna', 45],
  ['Neurología', 72],
  ['Neurología Pediátrica', 59],
  ['Otorrinolaringología y Cirugía de Cabeza y Cuello', 240],
  ['Patología', 14],
  ['Pediatría', 207],
  ['Radiología', 131],
  ['Anestesiología, Reanimación y Dolor (anexo)', 14],
  ['Traumatología y Ortopedia', 908],
].map(([specialty, count]) => ({
  specialty: specialty as string,
  count: count as number,
}));

/** Nombres de las especialidades del arancel que le tocan a esos nombres. */
function names(...doctor: string[]): string[] {
  return matchTariffSpecialties(doctor, TARIFF).map((m) => m.specialty);
}

describe('matchTariffSpecialties', () => {
  it('«Cardiología» ↔ «Cardiología», sin tildes ni mayúsculas', () => {
    expect(names('Cardiología')).toEqual(['Cardiología']);
    expect(names('CARDIOLOGIA')).toEqual(['Cardiología']);
    expect(names('  cardiologia ')).toEqual(['Cardiología']);
  });

  it('ignora el sufijo «(anexo)» del arancel', () => {
    expect(names('Anestesiología')).toEqual([
      'Anestesiología, Reanimación y Dolor (anexo)',
    ]);
    expect(normalizeSpecialty('Cardiología (anexo)')).toBe('cardiologia');
  });

  it('el nombre del catálogo es el primero de un listado del arancel', () => {
    expect(names('Endocrinología')).toEqual([
      'Endocrinología, Metabolismo y Nutrición',
    ]);
    expect(names('Gastroenterología')).toEqual([
      'Gastroenterología y Endoscopía Digestiva',
    ]);
    expect(names('Otorrinolaringología')).toEqual([
      'Otorrinolaringología y Cirugía de Cabeza y Cuello',
    ]);
  });

  it('usa las equivalencias de nombre ya fijadas en las reglas del seed', () => {
    expect(names('Medicina de Emergencia')).toEqual(['Emergenciología']);
    expect(names('Medicina Intensiva')).toEqual([
      'Medicina Crítica y Terapia Intensiva',
    ]);
    expect(names('Anatomía Patológica')).toEqual(['Patología']);
  });

  it('lo exacto gana: «Neurología Pediátrica» no arrastra toda «Neurología»', () => {
    expect(names('Neurología Pediátrica')).toEqual(['Neurología Pediátrica']);
  });

  it('el arancel entero dentro del nombre del profesional sólo cuando no hay nada mejor', () => {
    expect(names('Cardiología Pediátrica')).toEqual(['Cardiología']);
    expect(names('Radiología e Imagenología')).toEqual(['Radiología']);
  });

  it('no da falsos positivos groseros', () => {
    // «Cirugía» a secas no puede traer todas las cirugías del arancel.
    expect(names('Cirugía')).toEqual([]);
    // Un fisioterapeuta no es medicina física ni un nutricionista, endocrinología.
    expect(names('Fisioterapia y Rehabilitación')).toEqual([]);
    expect(names('Nutrición y Dietética')).toEqual([]);
    // Medicina Familiar no es Medicina General ni Interna.
    expect(names('Medicina Familiar')).toEqual([]);
    expect(names('Odontología')).toEqual([]);
    expect(names('')).toEqual([]);
  });

  it('une varias especialidades sin repetir y ordena en español', () => {
    expect(names('Pediatría', 'Cardiología', 'Cardiología')).toEqual([
      'Cardiología',
      'Pediatría',
    ]);
  });

  it('devuelve el recuento del arancel', () => {
    expect(matchTariffSpecialties(['Cardiología'], TARIFF)).toEqual([
      { specialty: 'Cardiología', count: 98 },
    ]);
  });
});

describe('toDefaultPrice', () => {
  it('conserva un importe válido, redondea el que trae más decimales y cae a 0', () => {
    expect(toDefaultPrice('150')).toBe('150');
    expect(toDefaultPrice('150.5')).toBe('150.5');
    expect(toDefaultPrice('150.456')).toBe('150.46');
    expect(toDefaultPrice(null)).toBe('0');
    expect(toDefaultPrice('abc')).toBe('0');
    expect(toDefaultPrice('-3')).toBe('0');
  });
});

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns El servicio y sus dobles.
 */
function build() {
  const tx = {
    flush: mockFn().mockResolvedValue(undefined),
    execute: mockFn().mockResolvedValue([]),
  };
  const execute = mockFn().mockResolvedValue([]);
  const em = {
    getConnection: mockFn().mockReturnValue({ execute }),
    transactional: mockFn((cb: any) => cb(tx)),
  };
  let n = 0;
  const serviceCatalogRepo = {
    findExistingCodes: mockFn().mockResolvedValue(new Set<string>()),
    create: mockFn((_tx: unknown, data: any) => ({ id: `s${++n}`, ...data })),
  };
  const catalog = {
    assertRegistrationCanRegister: mockFn().mockResolvedValue(undefined),
    attachDefaultSatisfactionSurveys: mockFn().mockResolvedValue(undefined),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new ProcedureImportService(
    em as any,
    serviceCatalogRepo as any,
    catalog as any,
    logger as any,
  );
  return { service, tx, em, execute, serviceCatalogRepo, catalog, logger };
}

/** Filas del arancel como las devuelve la consulta de selección. */
function tariffRows(count: number, price: string | null = '10') {
  return Array.from({ length: count }, (_, i) => ({
    code: `procedure:bo:C${String(i).padStart(5, '0')}`,
    display: `Procedimiento ${i}`,
    price,
  }));
}

describe('ProcedureImportService.importProcedures', () => {
  const PRACTICE = '11111111-1111-4111-8111-111111111111';

  it('exige al menos un criterio y no toca la base', async () => {
    const d = build();

    await expect(
      d.service.importProcedures({ practiceId: PRACTICE } as any, admin),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      d.service.importProcedures(
        { practiceId: PRACTICE, specialties: [' '], codes: [], q: '  ' },
        admin,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(d.execute).not.toHaveBeenCalled();
    expect(d.catalog.assertRegistrationCanRegister).not.toHaveBeenCalled();
  });

  it('una práctica ajena responde 404 antes de leer el arancel', async () => {
    const d = build();
    d.catalog.assertRegistrationCanRegister.mockRejectedValue(
      new ResourceNotFoundException('Práctica no encontrada', {
        practiceId: PRACTICE,
      }),
    );

    await expect(
      d.service.importProcedures(
        { practiceId: PRACTICE, specialties: ['Cardiología'] },
        doctor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);

    expect(d.catalog.assertRegistrationCanRegister).toHaveBeenCalledWith(
      doctor,
      PRACTICE,
    );
    expect(d.execute).not.toHaveBeenCalled();
    expect(d.em.transactional).not.toHaveBeenCalled();
  });

  it('crea como el alta individual: nombre, código, precio de referencia, activo', async () => {
    const d = build();
    d.execute.mockResolvedValue([
      { code: 'procedure:bo:A', display: 'General', price: '150' },
      { code: 'procedure:bo:B', display: 'Sin precio', price: null },
    ]);

    const res = await d.service.importProcedures(
      { practiceId: PRACTICE, specialties: ['Cardiología'] },
      doctor,
    );

    expect(res).toEqual({ created: 2, skipped: 0, total: 2 });
    expect(d.serviceCatalogRepo.create).toHaveBeenNthCalledWith(1, d.tx, {
      practiceId: PRACTICE,
      code: 'procedure:bo:A',
      name: 'General',
      defaultPrice: '150',
      isActive: true,
      actorUserId: 'user-med',
    });
    expect(d.serviceCatalogRepo.create).toHaveBeenNthCalledWith(
      2,
      d.tx,
      expect.objectContaining({ code: 'procedure:bo:B', defaultPrice: '0' }),
    );
    // Misma garantía FT-31 que el alta individual: encuesta por servicio.
    expect(d.catalog.attachDefaultSatisfactionSurveys).toHaveBeenCalledTimes(1);
    expect(
      d.catalog.attachDefaultSatisfactionSurveys.mock.calls[0][1],
    ).toHaveLength(2);
    expect(d.tx.flush).toHaveBeenCalledTimes(1);
  });

  it('es idempotente: salta los códigos que la práctica ya tiene', async () => {
    const d = build();
    d.execute.mockResolvedValue(tariffRows(3));
    d.serviceCatalogRepo.findExistingCodes.mockResolvedValue(
      new Set(['procedure:bo:C00001']),
    );

    const res = await d.service.importProcedures(
      { practiceId: PRACTICE, specialties: ['Cardiología'] },
      admin,
    );

    expect(res).toEqual({ created: 2, skipped: 1, total: 3 });
    const created = d.serviceCatalogRepo.create.mock.calls.map(
      (c: any[]) => c[1].code,
    );
    expect(created).toEqual(['procedure:bo:C00000', 'procedure:bo:C00002']);
  });

  it('una segunda corrida con todo ya importado no crea nada ni escribe encuestas', async () => {
    const d = build();
    const rows = tariffRows(2);
    d.execute.mockResolvedValue(rows);
    d.serviceCatalogRepo.findExistingCodes.mockResolvedValue(
      new Set(rows.map((r) => r.code)),
    );

    const res = await d.service.importProcedures(
      { practiceId: PRACTICE, codes: rows.map((r) => r.code) },
      admin,
    );

    expect(res).toEqual({ created: 0, skipped: 2, total: 2 });
    expect(d.serviceCatalogRepo.create).not.toHaveBeenCalled();
    expect(d.catalog.attachDefaultSatisfactionSurveys).not.toHaveBeenCalled();
  });

  it('sin coincidencias responde ceros y no abre transacción', async () => {
    const d = build();
    d.execute.mockResolvedValue([]);

    await expect(
      d.service.importProcedures(
        { practiceId: PRACTICE, specialties: ['Inexistente'] },
        admin,
      ),
    ).resolves.toEqual({ created: 0, skipped: 0, total: 0 });
    expect(d.em.transactional).not.toHaveBeenCalled();
  });

  it('inserta en lotes y toma el cerrojo de la práctica dentro de la transacción', async () => {
    const d = build();
    d.execute.mockResolvedValue(tariffRows(1200));

    const res = await d.service.importProcedures(
      { practiceId: PRACTICE, q: 'consulta' },
      admin,
    );

    expect(res).toEqual({ created: 1200, skipped: 0, total: 1200 });
    // 500 + 500 + 200: un flush y un lote de encuestas por tanda.
    expect(d.tx.flush).toHaveBeenCalledTimes(3);
    expect(d.catalog.attachDefaultSatisfactionSurveys).toHaveBeenCalledTimes(3);
    expect(d.tx.execute).toHaveBeenCalledWith(
      expect.stringContaining('pg_advisory_xact_lock'),
      [expect.stringContaining(PRACTICE)],
    );
    // 1200 códigos en consultas de 1000.
    expect(d.serviceCatalogRepo.findExistingCodes).toHaveBeenCalledTimes(2);
  });

  it('un filtro que excede el tope responde 400 y no crea nada', async () => {
    const d = build();
    d.execute.mockResolvedValue(tariffRows(PROCEDURE_IMPORT_MAX + 1));

    await expect(
      d.service.importProcedures({ practiceId: PRACTICE, q: 'a' }, admin),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(d.em.transactional).not.toHaveBeenCalled();
    expect(d.serviceCatalogRepo.create).not.toHaveBeenCalled();
  });

  it('no duplica un código que el arancel repite', async () => {
    const d = build();
    const rows = tariffRows(1);
    d.execute.mockResolvedValue([...rows, ...rows]);

    const res = await d.service.importProcedures(
      { practiceId: PRACTICE, q: 'a' },
      admin,
    );

    expect(res).toEqual({ created: 1, skipped: 0, total: 1 });
  });
});

describe('ProcedureImportService.select', () => {
  it('arma el filtro con especialidad exacta, códigos y palabras sin tildes, todo por parámetros', async () => {
    const d = build();

    await d.service.select({
      specialties: ['Cardiología', 'Pediatría'],
      codes: ['procedure:bo:A'],
      q: 'Electrocardiograma  CONSULTA',
    });

    const [sql, params] = d.execute.mock.calls[0];
    expect(sql).toContain("sp.value_json #>> '{}' IN (?, ?)");
    expect(sql).toContain('c.code IN (?)');
    expect(sql.match(/translate\(lower\(c\.display\)/g)).toHaveLength(2);
    expect(params).toEqual([
      'procedure:reference-price',
      'procedure:%',
      'procedure:specialty',
      'Cardiología',
      'Pediatría',
      'procedure:bo:A',
      '%electrocardiograma%',
      '%consulta%',
      PROCEDURE_IMPORT_MAX + 1,
    ]);
    // Nada del usuario se concatena al SQL.
    expect(sql).not.toContain('Cardiología');
    expect(sql).not.toContain('electrocardiograma');
  });

  it('quita tildes y signos del texto: un comodín del usuario no llega al LIKE', async () => {
    const d = build();

    await d.service.select({ specialties: [], codes: [], q: '100% ácido_x' });

    const params = d.execute.mock.calls[0][1];
    expect(params.slice(2, -1)).toEqual(['%100%', '%acido%', '%x%']);
  });
});

describe('ProcedureImportService.listMySpecialties', () => {
  it('un usuario sin perfil profesional recibe la lista vacía sin consultar', async () => {
    const d = build();

    await expect(
      d.service.listMySpecialties({ id: 'u', roles: ['PATIENT'] } as any),
    ).resolves.toEqual({ items: [] });
    expect(d.execute).not.toHaveBeenCalled();
  });

  it('sin especialidad cargada no consulta el arancel', async () => {
    const d = build();
    d.execute.mockResolvedValueOnce([]);

    await expect(d.service.listMySpecialties(doctor)).resolves.toEqual({
      items: [],
    });
    expect(d.execute).toHaveBeenCalledTimes(1);
    expect(d.execute.mock.calls[0][1]).toEqual(['hp-1']);
  });

  it('cruza las especialidades del perfil con las del arancel', async () => {
    const d = build();
    d.execute
      .mockResolvedValueOnce([
        { display: 'Cardiología' },
        { display: 'Endocrinología' },
      ])
      .mockResolvedValueOnce(
        TARIFF.map((t) => ({
          especialidad: t.specialty,
          total: String(t.count),
        })),
      );

    await expect(d.service.listMySpecialties(doctor)).resolves.toEqual({
      items: [
        { specialty: 'Cardiología', count: 98 },
        {
          specialty: 'Endocrinología, Metabolismo y Nutrición',
          count: 21,
        },
      ],
    });
  });
});
