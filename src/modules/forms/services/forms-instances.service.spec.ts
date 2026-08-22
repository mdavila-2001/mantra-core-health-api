import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { FormsInstancesService } from './forms-instances.service';
import { FORMS } from '../forms.concepts';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'clin-1', roles: ['USER'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  // `findOne` responde `null`: el recurso no es un encuentro, así que la
  // instancia se tipa como paciente — el default de siempre. El caso del
  // encuentro tiene su propia prueba, que devuelve una fila.
  const tx = {
    flush: mockFn().mockResolvedValue(undefined),
    findOne: mockFn().mockResolvedValue(null),
  };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const instancesRepo = {
    findByResourceAndVersion: mockFn(),
    findById: mockFn(),
    create: mockFn(),
  };
  const valuesRepo = {
    findPreliminaryByInstance: mockFn().mockResolvedValue([]),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new FormsInstancesService(
    em as any,
    instancesRepo as any,
    valuesRepo as any,
    logger as any,
  );
  return { service, tx, instancesRepo, valuesRepo };
}

describe('FormsInstancesService', () => {
  describe('openInstance (UC-09-07)', () => {
    it('opens a new instance for a resource', async () => {
      const d = build();
      d.instancesRepo.findByResourceAndVersion.mockResolvedValue(null);
      d.instancesRepo.create.mockReturnValue({
        id: 'i1',
        schemaVersion: 1,
        stateConceptId: FORMS.INSTANCE_OPEN,
      });
      const res = await d.service.openInstance({ resourceId: 'r1' }, actor);
      expect(res).toEqual({
        id: 'i1',
        schemaVersion: 1,
        state: FORMS.INSTANCE_OPEN,
      });
    });

    it('rejects a duplicate instance', async () => {
      const d = build();
      d.instancesRepo.findByResourceAndVersion.mockResolvedValue({ id: 'i0' });
      await expect(
        d.service.openInstance({ resourceId: 'r1' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('types the instance as ENCOUNTER when the resource is one', async () => {
      const d = build();
      d.instancesRepo.findByResourceAndVersion.mockResolvedValue(null);
      d.instancesRepo.create.mockReturnValue({ id: 'i1', schemaVersion: 1 });
      // El recurso resulta ser un encuentro: el tipo lo resuelve el servidor,
      // porque el cliente no puede llevar el uuid del concepto escrito.
      d.tx.findOne.mockResolvedValue({ id: 'enc-1' });

      await d.service.openInstance({ resourceId: 'enc-1' } as any, actor);

      expect(d.instancesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          resourceTypeConceptId: FORMS.RESOURCE_TYPE_ENCOUNTER,
        }),
      );
    });

    it('respects the type the caller declares', async () => {
      const d = build();
      d.instancesRepo.findByResourceAndVersion.mockResolvedValue(null);
      d.instancesRepo.create.mockReturnValue({ id: 'i1', schemaVersion: 1 });
      d.tx.findOne.mockResolvedValue({ id: 'enc-1' });

      await d.service.openInstance(
        { resourceId: 'enc-1', resourceTypeConceptId: 'otro-tipo' } as any,
        actor,
      );

      expect(d.instancesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ resourceTypeConceptId: 'otro-tipo' }),
      );
    });

    it('the duplicate check ignores the resource type', async () => {
      const d = build();
      d.instancesRepo.findByResourceAndVersion.mockResolvedValue(null);
      d.instancesRepo.create.mockReturnValue({ id: 'i1', schemaVersion: 1 });

      await d.service.openInstance({ resourceId: 'r1' } as any, actor);

      // Sin el tipo en la clave: una instancia vieja tipada como paciente
      // sobre el mismo encuentro tiene que seguir chocando.
      expect(d.instancesRepo.findByResourceAndVersion).toHaveBeenCalledWith(
        d.tx,
        'r1',
        1,
      );
    });
  });

  describe('closeInstance (UC-09-11)', () => {
    it('closes an open instance and finalizes preliminary values', async () => {
      const d = build();
      const instance = {
        id: 'i1',
        stateConceptId: FORMS.INSTANCE_OPEN,
        updatedAt: new Date(),
      };
      const prelim = {
        id: 'v1',
        valueStatusConceptId: FORMS.VALUE_PRELIMINARY,
        updatedAt: new Date(),
      };
      d.instancesRepo.findById.mockResolvedValue(instance);
      d.valuesRepo.findPreliminaryByInstance.mockResolvedValue([prelim]);
      const res = await d.service.closeInstance('i1', actor);
      expect(res).toEqual({ ok: true });
      expect(instance.stateConceptId).toBe(FORMS.INSTANCE_CLOSED);
      expect(prelim.valueStatusConceptId).toBe(FORMS.VALUE_FINAL);
    });

    it('rejects closing an instance that is not open', async () => {
      const d = build();
      d.instancesRepo.findById.mockResolvedValue({
        id: 'i1',
        stateConceptId: FORMS.INSTANCE_CLOSED,
      });
      await expect(d.service.closeInstance('i1', actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('throws when the instance does not exist', async () => {
      const d = build();
      d.instancesRepo.findById.mockResolvedValue(null);
      await expect(d.service.closeInstance('i1', actor)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });
});
