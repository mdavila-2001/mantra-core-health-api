import { describe, it, expect, jest } from '@jest/globals';
import { ValueSetsService } from './value-sets.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';

const actor: AuthenticatedUser = { id: 'actor-1', roles: ['SECURITY_ADMIN'] };

function build() {
  const tx = { flush: jest.fn(() => Promise.resolve()) };
  const em = {
    transactional: jest.fn((cb: (t: typeof tx) => unknown) => cb(tx)),
  } as any;
  const valueSetsRepo = {
    findById: jest.fn(),
    findByInternalCode: jest.fn(),
    createValueSet: jest.fn(),
    createVersion: jest.fn(),
    createRule: jest.fn(),
    findVersionForUpdate: jest.fn(),
    findDefaultVersionsForUpdate: jest.fn(() => Promise.resolve([])),
    findRulesByVersion: jest.fn(() => Promise.resolve([])),
    deleteMembersByVersion: jest.fn(() => Promise.resolve(0)),
    createMember: jest.fn(),
  } as any;
  const conceptsRepo = {
    findByVersion: jest.fn(() => Promise.resolve([])),
  } as any;
  const versionsRepo = { findDefaultActiveVersion: jest.fn() } as any;
  const relationshipsRepo = {
    findByTypeForSources: jest.fn(() => Promise.resolve([])),
  } as any;
  const designationsRepo = {
    findPropertyForConcepts: jest.fn(() => Promise.resolve([])),
  } as any;
  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as any;
  const service = new ValueSetsService(
    em,
    valueSetsRepo,
    conceptsRepo,
    versionsRepo,
    relationshipsRepo,
    designationsRepo,
    logger,
  );
  return {
    service,
    tx,
    valueSetsRepo,
    conceptsRepo,
    versionsRepo,
    relationshipsRepo,
    designationsRepo,
    logger,
  };
}

describe('ValueSetsService', () => {
  const dto = {
    internalCode: 'vs-sex',
    name: 'Sex',
    canonicalUrl: 'http://x/vs',
    rules: [
      { codeSystemId: 'cs-1', operator: 'IN' as const },
      { codeSystemId: 'cs-2', operator: 'IS_A' as const, included: false },
    ],
  };

  it('crea conjunto, versión inicial 1.0.0 por defecto y reglas con flush por nivel', async () => {
    const { service, valueSetsRepo, tx } = build();
    valueSetsRepo.findByInternalCode.mockResolvedValue(null);
    valueSetsRepo.createValueSet.mockReturnValue({ id: 'vs-1' });
    valueSetsRepo.createVersion.mockReturnValue({ id: 'vsv-1' });
    valueSetsRepo.createRule.mockReturnValue({ id: 'r' });

    const result = await service.createValueSet(dto, actor);

    expect(valueSetsRepo.createVersion).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        valueSetId: 'vs-1',
        version: '1.0.0',
        isDefault: true,
      }),
    );
    expect(valueSetsRepo.createRule).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        operatorConceptId: CONCEPTS.VS_OP_IN,
        included: true,
      }),
    );
    expect(valueSetsRepo.createRule).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({
        operatorConceptId: CONCEPTS.VS_OP_IS_A,
        included: false,
      }),
    );
    expect(result).toEqual({ id: 'vs-1', versionId: 'vsv-1', rulesCount: 2 });
    // Un flush por nivel: conjunto, versión, reglas.
    expect(tx.flush).toHaveBeenCalledTimes(3);
  });

  it('crea un conjunto sin reglas', async () => {
    const { service, valueSetsRepo } = build();
    valueSetsRepo.findByInternalCode.mockResolvedValue(null);
    valueSetsRepo.createValueSet.mockReturnValue({ id: 'vs-1' });
    valueSetsRepo.createVersion.mockReturnValue({ id: 'vsv-1' });

    const result = await service.createValueSet(
      { internalCode: 'vs-x', name: 'X', canonicalUrl: 'http://x' },
      actor,
    );

    expect(valueSetsRepo.createRule).not.toHaveBeenCalled();
    expect(result).toEqual({ id: 'vs-1', versionId: 'vsv-1', rulesCount: 0 });
  });

  it('rechaza código interno duplicado con ConflictException', async () => {
    const { service, valueSetsRepo } = build();
    valueSetsRepo.findByInternalCode.mockResolvedValue({ id: 'existing' });

    await expect(service.createValueSet(dto, actor)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  describe('expandValueSet', () => {
    const CONCEPT_A = { id: 'c-a', code: 'A' };
    const CONCEPT_B = { id: 'c-b', code: 'B' };
    const CONCEPT_C = { id: 'c-c', code: 'C' };

    /** Prepara el camino feliz: conjunto, versión en borrador y catálogo A/B/C. */
    function setUp(harness: ReturnType<typeof build>, rules: unknown[]) {
      const version = {
        id: 'vsv-1',
        valueSetId: 'vs-1',
        stateConceptId: CONCEPTS.TERM_DRAFT,
        updatedAt: new Date(0),
      } as any;
      harness.valueSetsRepo.findById.mockResolvedValue({ id: 'vs-1' });
      harness.valueSetsRepo.findVersionForUpdate.mockResolvedValue(version);
      harness.valueSetsRepo.findRulesByVersion.mockResolvedValue(rules);
      harness.versionsRepo.findDefaultActiveVersion.mockResolvedValue({
        id: 'csv-1',
      });
      harness.conceptsRepo.findByVersion.mockResolvedValue([
        CONCEPT_A,
        CONCEPT_B,
        CONCEPT_C,
      ]);
      return version;
    }

    /** Ids de concepto en el orden en que se materializaron como miembros. */
    function members(harness: ReturnType<typeof build>): string[] {
      return harness.valueSetsRepo.createMember.mock.calls.map(
        (call: any[]) => call[1].conceptId,
      );
    }

    it('sin operador toma la versión completa del sistema de códigos', async () => {
      const harness = build();
      setUp(harness, [{ id: 'r-1', codeSystemId: 'cs-1', included: true }]);

      const result = await harness.service.expandValueSet(
        'vs-1',
        { valueSetVersionId: 'vsv-1' },
        actor,
      );

      expect(members(harness)).toEqual(['c-a', 'c-b', 'c-c']);
      expect(result.includedMembers).toBe(3);
      expect(result.rulesEvaluated).toBe(1);
    });

    it('operador in selecciona sólo los códigos listados', async () => {
      const harness = build();
      setUp(harness, [
        {
          id: 'r-1',
          codeSystemId: 'cs-1',
          operatorConceptId: CONCEPTS.VS_OP_IN,
          value: 'A, C',
          included: true,
        },
      ]);

      await harness.service.expandValueSet(
        'vs-1',
        { valueSetVersionId: 'vsv-1' },
        actor,
      );

      expect(members(harness)).toEqual(['c-a', 'c-c']);
    });

    it('operador is-a arrastra los descendientes transitivos', async () => {
      const harness = build();
      setUp(harness, [
        {
          id: 'r-1',
          codeSystemId: 'cs-1',
          operatorConceptId: CONCEPTS.VS_OP_IS_A,
          value: 'A',
          included: true,
        },
      ]);
      // B is-a A, C is-a B: C entra por transitividad.
      harness.relationshipsRepo.findByTypeForSources.mockResolvedValue([
        { sourceConceptId: 'c-b', targetConceptId: 'c-a' },
        { sourceConceptId: 'c-c', targetConceptId: 'c-b' },
      ]);

      await harness.service.expandValueSet(
        'vs-1',
        { valueSetVersionId: 'vsv-1' },
        actor,
      );

      expect(members(harness)).toEqual(['c-a', 'c-b', 'c-c']);
    });

    it('operador is-a no se cuelga con una jerarquía cíclica', async () => {
      const harness = build();
      setUp(harness, [
        {
          id: 'r-1',
          codeSystemId: 'cs-1',
          operatorConceptId: CONCEPTS.VS_OP_IS_A,
          value: 'A',
          included: true,
        },
      ]);
      harness.relationshipsRepo.findByTypeForSources.mockResolvedValue([
        { sourceConceptId: 'c-b', targetConceptId: 'c-a' },
        { sourceConceptId: 'c-a', targetConceptId: 'c-b' },
      ]);

      await harness.service.expandValueSet(
        'vs-1',
        { valueSetVersionId: 'vsv-1' },
        actor,
      );

      expect(members(harness)).toEqual(['c-a', 'c-b']);
    });

    it('operador prop compara el valor textual de la propiedad', async () => {
      const harness = build();
      setUp(harness, [
        {
          id: 'r-1',
          codeSystemId: 'cs-1',
          operatorConceptId: CONCEPTS.VS_OP_PROP,
          property: 'chapter',
          value: 'IV',
          included: true,
        },
      ]);
      harness.designationsRepo.findPropertyForConcepts.mockResolvedValue([
        { conceptId: 'c-b', valueJson: 'IV' },
        { conceptId: 'c-c', valueJson: 'V' },
      ]);

      await harness.service.expandValueSet(
        'vs-1',
        { valueSetVersionId: 'vsv-1' },
        actor,
      );

      expect(members(harness)).toEqual(['c-b']);
    });

    it('las reglas de exclusión restan al final, sea cual sea su orden', async () => {
      const harness = build();
      setUp(harness, [
        {
          id: 'r-1',
          codeSystemId: 'cs-1',
          operatorConceptId: CONCEPTS.VS_OP_IN,
          value: 'B',
          included: false,
        },
        { id: 'r-2', codeSystemId: 'cs-1', included: true },
      ]);

      await harness.service.expandValueSet(
        'vs-1',
        { valueSetVersionId: 'vsv-1' },
        actor,
      );

      expect(members(harness)).toEqual(['c-a', 'c-c']);
    });

    it('no repite un concepto seleccionado por dos reglas', async () => {
      const harness = build();
      setUp(harness, [
        {
          id: 'r-1',
          codeSystemId: 'cs-1',
          operatorConceptId: CONCEPTS.VS_OP_IN,
          value: 'A',
          included: true,
        },
        {
          id: 'r-2',
          codeSystemId: 'cs-1',
          operatorConceptId: CONCEPTS.VS_OP_IN,
          value: 'A,B',
          included: true,
        },
      ]);

      await harness.service.expandValueSet(
        'vs-1',
        { valueSetVersionId: 'vsv-1' },
        actor,
      );

      expect(members(harness)).toEqual(['c-a', 'c-b']);
    });

    it('ignora la regla cuyo sistema de códigos no tiene versión vigente', async () => {
      const harness = build();
      setUp(harness, [{ id: 'r-1', codeSystemId: 'cs-1', included: true }]);
      harness.versionsRepo.findDefaultActiveVersion.mockResolvedValue(null);

      const result = await harness.service.expandValueSet(
        'vs-1',
        { valueSetVersionId: 'vsv-1' },
        actor,
      );

      expect(result.includedMembers).toBe(0);
      expect(harness.logger.warn).toHaveBeenCalled();
    });

    it('ignora la regla con un operador desconocido', async () => {
      const harness = build();
      setUp(harness, [
        {
          id: 'r-1',
          codeSystemId: 'cs-1',
          operatorConceptId: 'operador-inventado',
          included: true,
        },
      ]);

      const result = await harness.service.expandValueSet(
        'vs-1',
        { valueSetVersionId: 'vsv-1' },
        actor,
      );

      expect(result.includedMembers).toBe(0);
      expect(harness.logger.warn).toHaveBeenCalled();
    });

    it('reemplaza los miembros anteriores y activa la versión', async () => {
      const harness = build();
      const version = setUp(harness, []);
      harness.valueSetsRepo.deleteMembersByVersion.mockResolvedValue(7);

      const result = await harness.service.expandValueSet(
        'vs-1',
        { valueSetVersionId: 'vsv-1' },
        actor,
      );

      expect(harness.valueSetsRepo.deleteMembersByVersion).toHaveBeenCalledWith(
        expect.anything(),
        'vsv-1',
      );
      expect(version.stateConceptId).toBe(CONCEPTS.TERM_ACTIVE);
      expect(result.replacedMembers).toBe(7);
    });

    it('con activate=false deja la versión en su estado', async () => {
      const harness = build();
      const version = setUp(harness, []);

      await harness.service.expandValueSet(
        'vs-1',
        { valueSetVersionId: 'vsv-1', activate: false },
        actor,
      );

      expect(version.stateConceptId).toBe(CONCEPTS.TERM_DRAFT);
    });

    it('con makeDefault degrada la versión por defecto anterior', async () => {
      const harness = build();
      const version = setUp(harness, []);
      const previous = { id: 'vsv-0', isDefault: true, updatedAt: new Date(0) };
      harness.valueSetsRepo.findDefaultVersionsForUpdate.mockResolvedValue([
        previous,
      ]);

      await harness.service.expandValueSet(
        'vs-1',
        { valueSetVersionId: 'vsv-1', makeDefault: true },
        actor,
      );

      expect(previous.isDefault).toBe(false);
      expect(version.isDefault).toBe(true);
    });

    it('lanza NotFound si el conjunto de valores no existe', async () => {
      const harness = build();
      harness.valueSetsRepo.findById.mockResolvedValue(null);

      await expect(
        harness.service.expandValueSet(
          'vs-x',
          { valueSetVersionId: 'vsv-1' },
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('lanza NotFound si la versión no existe', async () => {
      const harness = build();
      harness.valueSetsRepo.findById.mockResolvedValue({ id: 'vs-1' });
      harness.valueSetsRepo.findVersionForUpdate.mockResolvedValue(null);

      await expect(
        harness.service.expandValueSet(
          'vs-1',
          { valueSetVersionId: 'vsv-x' },
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rechaza expandir la versión de otro conjunto (Conflict)', async () => {
      const harness = build();
      harness.valueSetsRepo.findById.mockResolvedValue({ id: 'vs-1' });
      harness.valueSetsRepo.findVersionForUpdate.mockResolvedValue({
        id: 'vsv-1',
        valueSetId: 'vs-otro',
        stateConceptId: CONCEPTS.TERM_DRAFT,
      });

      await expect(
        harness.service.expandValueSet(
          'vs-1',
          { valueSetVersionId: 'vsv-1' },
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rechaza expandir una versión retirada (PreconditionFailed)', async () => {
      const harness = build();
      harness.valueSetsRepo.findById.mockResolvedValue({ id: 'vs-1' });
      harness.valueSetsRepo.findVersionForUpdate.mockResolvedValue({
        id: 'vsv-1',
        valueSetId: 'vs-1',
        stateConceptId: CONCEPTS.TERM_RETIRED,
      });

      await expect(
        harness.service.expandValueSet(
          'vs-1',
          { valueSetVersionId: 'vsv-1' },
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });
});
