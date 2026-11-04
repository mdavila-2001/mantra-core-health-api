import { describe, expect, it, jest } from '@jest/globals';
import { ForeignKeyConstraintViolationException } from '@mikro-orm/core';
import { DUNIT } from '../../diagnostic_units.concepts';
import { DiagnosticEquipment } from '../../entities';
import { ManageCenterEquipmentUseCase } from './manage-center-equipment.use-case';

const UNIT = { id: 'unit-1' };
const actor = { id: 'user-1' } as never;

function build(device: Record<string, unknown> | null = null) {
  const created: Record<string, unknown>[] = [];
  const tx = {
    findOne: jest.fn(async (entity: unknown) =>
      entity === DiagnosticEquipment
        ? device
        : { id: 'site-1', diagnosticUnitId: UNIT.id },
    ),
    create: jest.fn((_: unknown, data: Record<string, unknown>) => {
      created.push(data);
      return data;
    }),
    remove: jest.fn(),
    flush: jest.fn(async () => undefined),
  };
  const em = {
    transactional: jest.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
  };
  const reader = {
    staffUnit: jest.fn(async () => UNIT),
    view: jest.fn(async () => ({ tag: 'view' })),
  };
  const context = { load: jest.fn(async () => ({})) };
  const useCase = new ManageCenterEquipmentUseCase(
    em as never,
    context as never,
    reader as never,
  );
  return { useCase, tx, created };
}

describe('ManageCenterEquipmentUseCase', () => {
  it('registers an ultrasound line with its catalog type, operational', async () => {
    const d = build();
    await expect(
      d.useCase.create(
        UNIT.id,
        { name: ' Ecógrafo 2 ', modalityCode: 'ECO' },
        actor,
      ),
    ).resolves.toEqual({ tag: 'view' });
    expect(d.created[0]).toMatchObject({
      diagnosticUnitSiteId: 'site-1',
      equipmentTypeConceptId: DUNIT.EQUIPMENT_TYPE_ULTRASOUND,
      modalityConceptId: DUNIT.MODALITY_ULTRASOUND,
      model: 'Ecógrafo 2',
      operationalStatusConceptId: DUNIT.EQUIPMENT_OPERATIONAL,
    });
  });

  it('a device without modality is an analyzer', async () => {
    const d = build();
    await d.useCase.create(
      UNIT.id,
      { name: 'Analizador', modalityCode: null },
      actor,
    );
    expect(d.created[0]).toMatchObject({
      equipmentTypeConceptId: DUNIT.EQUIPMENT_TYPE_ANALYZER,
      modalityConceptId: null,
    });
  });

  it('refuses a modality the catalog has no device type for (422)', async () => {
    const d = build();
    await expect(
      d.useCase.create(
        UNIT.id,
        { name: 'Resonador', modalityCode: 'RM' },
        actor,
      ),
    ).rejects.toMatchObject({ status: 422 });
  });

  it('a device of another center answers 404', async () => {
    const d = build({ id: 'eq-9', diagnosticUnitSiteId: 'site-1' });
    d.tx.findOne.mockImplementation(async (entity: unknown) =>
      entity === DiagnosticEquipment
        ? { id: 'eq-9', diagnosticUnitSiteId: 'site-x' }
        : { id: 'site-x', diagnosticUnitId: 'other-unit' },
    );
    await expect(d.useCase.remove(UNIT.id, 'eq-9')).rejects.toMatchObject({
      status: 404,
    });
  });

  it('a device already referenced cannot be removed (409)', async () => {
    const d = build({ id: 'eq-1', diagnosticUnitSiteId: 'site-1' });
    d.tx.flush.mockRejectedValue(
      new ForeignKeyConstraintViolationException(new Error('fk')),
    );
    await expect(d.useCase.remove(UNIT.id, 'eq-1')).rejects.toMatchObject({
      status: 409,
    });
  });
});
