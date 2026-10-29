import { coerceImportRow } from './infrastructure-import';

describe('coerceImportRow', () => {
  it('convierte el texto de un CSV: números, booleanos y vacíos', () => {
    const row = coerceImportRow(
      {
        code: ' H-1 ',
        name: 'Hab',
        formCode: 'LOC_FORM_ROOM',
        parentCode: 'P',
        floorNumber: '3',
        areaM2: '14.5',
        censable: 'true',
        description: '   ',
        line: '12',
      },
      4,
    );
    expect(row).toMatchObject({
      code: 'H-1',
      name: 'Hab',
      formCode: 'LOC_FORM_ROOM',
      parentCode: 'P',
      floorNumber: 3,
      areaM2: 14.5,
      censable: true,
      line: 12,
    });
    expect(row.description).toBeUndefined();
  });

  it('lo ilegible queda como NaN o vacío para que la validación lo reporte en su línea; nunca lanza', () => {
    const row = coerceImportRow(
      { code: 'X', name: 'x', areaM2: 'mucho', censable: 'tal vez' },
      7,
    );
    expect(Number.isNaN(row.areaM2)).toBe(true);
    expect(Number.isNaN(row.censable as unknown as number)).toBe(true);
    expect(row.line).toBe(7);
    for (const rara of [null, undefined, 'texto', 42, []]) {
      expect(coerceImportRow(rara, 2)).toMatchObject({
        code: '',
        name: '',
        line: 2,
      });
    }
  });

  it('descarta campos desconocidos y no deja pasar activate', () => {
    const row = coerceImportRow(
      { code: 'C', name: 'n', activate: true, rol: 'admin' },
      1,
    ) as unknown as Record<string, unknown>;
    expect(row.activate).toBeUndefined();
    expect(row.rol).toBeUndefined();
  });
});
