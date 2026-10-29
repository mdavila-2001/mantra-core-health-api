import { countCells } from './bed-board-read.service';

const cell = (over: any = {}): any => ({
  id: 'c',
  assignable: false,
  occupancy: { code: 'OCC_FREE' },
  availability: { code: 'SPACE_OP_AVAILABLE' },
  hygiene: { code: 'HYG_INSPECTED' },
  isolation: { code: 'ISO_NONE' },
  ...over,
});

describe('countCells · recuentos derivados del tablero', () => {
  it('cuenta cada eje por separado, sin escribir nada a mano', () => {
    const counts = countCells([
      cell({ assignable: true }),
      cell({
        occupancy: { code: 'OCC_OCCUPIED' },
        isolation: { code: 'ISO_CONTACT' },
      }),
      cell({ occupancy: { code: 'OCC_RESERVED' } }),
      cell({ availability: { code: 'SPACE_OP_BLOCKED_CLINICAL' } }),
      cell({ availability: { code: 'SPACE_OP_CLOSED' } }),
      cell({ availability: { code: 'SPACE_OP_MAINTENANCE' } }),
      cell({ hygiene: { code: 'HYG_DIRTY' } }),
      cell({ hygiene: { code: 'HYG_CLEANING' } }),
      cell({ hygiene: { code: 'HYG_CONTAMINATED' } }),
    ]);
    expect(counts).toEqual({
      total: 9,
      assignable: 1,
      occupied: 1,
      reserved: 1,
      blocked: 2,
      maintenance: 1,
      dirty: 1,
      cleaning: 1,
      isolation: 1,
      contaminated: 1,
    });
  });

  it('una unidad sin camas tiene todos los recuentos en cero', () => {
    expect(countCells([])).toMatchObject({
      total: 0,
      assignable: 0,
      occupied: 0,
    });
  });
});
