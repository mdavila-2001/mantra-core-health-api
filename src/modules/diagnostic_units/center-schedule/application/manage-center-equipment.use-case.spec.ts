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

  it.each([
    ['ECO', DUNIT.EQUIPMENT_TYPE_ULTRASOUND, DUNIT.MODALITY_ULTRASOUND],
    ['RX', DUNIT.EQUIPMENT_TYPE_XRAY, DUNIT.MODALITY_XRAY],
    ['RM', DUNIT.EQUIPMENT_TYPE_MRI, DUNIT.MODALITY_MRI],
    ['TC', DUNIT.EQUIPMENT_TYPE_CT, DUNIT.MODALITY_CT],
    ['MG', DUNIT.EQUIPMENT_TYPE_MAMMOGRAPHY, DUNIT.MODALITY_MAMMOGRAPHY],
    [
      'DXA',
      DUNIT.EQUIPMENT_TYPE_BONE_DENSITOMETRY,
      DUNIT.MODALITY_BONE_DENSITOMETRY,
    ],
    ['LAB', DUNIT.EQUIPMENT_TYPE_SAMPLING_STATION, DUNIT.MODALITY_LABORATORY],
  ] as const)(
    'every modality registers a line with its own device type (%s)',
    async (modalityCode, type, modality) => {
      const d = build();
      await d.useCase.create(UNIT.id, { name: 'Equipo', modalityCode }, actor);
      expect(d.created[0]).toMatchObject({
        equipmentTypeConceptId: type,
        modalityConceptId: modality,
      });
    },
  );

  it('the device types are distinct concepts, none shared between modalities', () => {
    const types = [
      DUNIT.EQUIPMENT_TYPE_ULTRASOUND,
      DUNIT.EQUIPMENT_TYPE_XRAY,
      DUNIT.EQUIPMENT_TYPE_MRI,
      DUNIT.EQUIPMENT_TYPE_CT,
      DUNIT.EQUIPMENT_TYPE_MAMMOGRAPHY,
      DUNIT.EQUIPMENT_TYPE_BONE_DENSITOMETRY,
      DUNIT.EQUIPMENT_TYPE_SAMPLING_STATION,
      DUNIT.EQUIPMENT_TYPE_ANALYZER,
    ];
    expect(new Set(types).size).toBe(types.length);
    expect(types.every((id) => typeof id === 'string' && id.length > 0)).toBe(
      true,
    );
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
