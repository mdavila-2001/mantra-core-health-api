import { jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { PrescriptionDocumentsService } from './prescription-documents.service';
import { CatalogConcepts } from '../../terminology/entities/catalog_concepts.entity';
import { Persons } from '../../profiles/entities/persons.entity';

const issued = {
  id: 'rx-1',
  patientProfileId: 'patient-1',
  medicationConceptId: 'med-1',
  statusConceptId: 'status-1',
  issuedAt: new Date('2026-10-01T12:00:00Z'),
  doseText: '500 mg',
  frequencyText: 'cada 8 horas',
  patientInstructionsText: 'Tomar después de comer',
};

function setup(rows = [issued]) {
  const em: any = {};
  em.fork = () => em;
  em.findAndCount = jest.fn(async () => [rows, rows.length]);
  em.findOne = jest.fn(async () => rows[0] ?? null);
  em.find = jest.fn(async (entity: unknown) => {
    if (entity === CatalogConcepts)
      return [
        { id: 'med-1', display: 'Amoxicilina' },
        { id: 'status-1', display: 'Activa' },
      ];
    if (entity === Persons)
      return [{ id: 'patient-1', displayName: 'Ana Pérez' }];
    return [];
  });
  return { service: new PrescriptionDocumentsService(em), em };
}

describe('PrescriptionDocumentsService', () => {
  it('lista recetas emitidas con nombres legibles y total', async () => {
    const { service, em } = setup();
    const page = await service.list('patient-1', 0, 50);
    expect(page.total).toBe(1);
    expect(page.items[0]?.medication).toBe('Amoxicilina');
    expect(page.items[0]?.status).toBe('Activa');
    expect(em.findAndCount).toHaveBeenCalledWith(
      expect.anything(),
      { patientProfileId: 'patient-1', issuedAt: { $ne: null } },
      expect.objectContaining({ limit: 50 }),
    );
  });

  it('no entrega un borrador como receta emitida', async () => {
    const { service } = setup([{ ...issued, issuedAt: undefined } as any]);
    await expect(service.one('rx-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('produce bytes PDF con la receta y el histórico', async () => {
    const { service } = setup();
    const one = await service.pdf([issued] as any, 'Receta médica');
    const history = await service.pdf(
      [issued, issued] as any,
      'Historial de recetas',
    );
    expect(one.subarray(0, 4).toString()).toBe('%PDF');
    expect(history.subarray(0, 4).toString()).toBe('%PDF');
    expect(history.length).toBeGreaterThan(one.length);
  });

  it('exporta más de 200 recetas sin depender del tope del resumen', async () => {
    const { service, em } = setup();
    const first = Array.from({ length: 200 }, (_, index) => ({
      ...issued,
      id: `rx-${String(200 - index).padStart(3, '0')}`,
    }));
    em.find
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce([{ ...issued, id: 'rx-000' }]);
    const rows = await service.all('patient-1');
    expect(rows).toHaveLength(201);
    expect(new Set(rows.map((row) => row.id)).size).toBe(201);
    expect(em.find.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({ $or: expect.any(Array) }),
    );
  });
});
