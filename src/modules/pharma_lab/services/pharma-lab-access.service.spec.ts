import { jest } from '@jest/globals';

/**
 * Crea una función simulada con la implementación dada.
 *
 * @param impl - Implementación que ejecuta el doble.
 * @returns La función simulada.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PharmaLabAccessService } from './pharma-lab-access.service';
import { PHL } from '../pharma_lab.concepts';

const LAB = '11111111-1111-1111-1111-111111111111';
const VISITOR = '22222222-2222-2222-2222-222222222222';
const USER = '33333333-3333-3333-3333-333333333333';
const ACTOR = { id: USER } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @param options - Estado inicial de los dobles.
 * @returns El servicio y el contexto de persistencia simulado.
 */
function build(options: {
  /** Estado del laboratorio, o `null` si no existe. */
  labStatus?: string | null;
  /** Estado de la vinculación del visitador. */
  visitorStatus?: string;
  /** Si la cuenta corresponde a un visitador. */
  visitorExists?: boolean;
}) {
  const labRow =
    options.labStatus === null
      ? null
      : { id: LAB, tenantId: 'tenant', statusConceptId: options.labStatus };
  const visitorRow =
    options.visitorExists === false
      ? null
      : {
          id: VISITOR,
          pharmaLabId: LAB,
          userId: USER,
          statusConceptId: options.visitorStatus ?? PHL.LINK_ACTIVE,
        };

  const orgRepo = { findLab: mockFn(async () => labRow) };
  const visitorsRepo = {
    findVisitorByUser: mockFn(async () => visitorRow),
    findVisitor: mockFn(async () => visitorRow),
  };
  const service = new PharmaLabAccessService(
    orgRepo as any,
    visitorsRepo as any,
  );
  return { service, em: {} as any };
}

describe('PharmaLabAccessService — regla principal del visitador', () => {
  it('deja operar al visitador con vinculación activa y laboratorio activo', async () => {
    const { service, em } = build({ labStatus: PHL.LAB_ACTIVE });

    const result = await service.requireOperatingVisitor(em, ACTOR);

    expect(result.visitor.id).toBe(VISITOR);
    expect(result.lab.id).toBe(LAB);
  });

  it('no deja operar a un visitador desvinculado', async () => {
    const { service, em } = build({
      labStatus: PHL.LAB_ACTIVE,
      visitorStatus: PHL.LINK_TERMINATED,
    });

    await expect(service.requireOperatingVisitor(em, ACTOR)).rejects.toThrow(
      'no tiene una vinculación activa',
    );
  });

  it('no deja operar a un visitador suspendido', async () => {
    const { service, em } = build({
      labStatus: PHL.LAB_ACTIVE,
      visitorStatus: PHL.LINK_SUSPENDED,
    });

    await expect(service.requireOperatingVisitor(em, ACTOR)).rejects.toThrow(
      'no tiene una vinculación activa',
    );
  });

  it('no deja operar cuando el laboratorio quedó suspendido', async () => {
    const { service, em } = build({ labStatus: PHL.LAB_SUSPENDED });

    await expect(service.requireOperatingVisitor(em, ACTOR)).rejects.toThrow(
      'laboratorio del visitador no está activo',
    );
  });

  it('no deja operar cuando el laboratorio ya no existe', async () => {
    const { service, em } = build({ labStatus: null });

    await expect(service.requireOperatingVisitor(em, ACTOR)).rejects.toThrow(
      'laboratorio del visitador no está activo',
    );
  });

  it('rechaza una cuenta que no es de un visitador', async () => {
    const { service, em } = build({
      labStatus: PHL.LAB_ACTIVE,
      visitorExists: false,
    });

    await expect(service.requireOperatingVisitor(em, ACTOR)).rejects.toThrow(
      'no corresponde a un visitador médico',
    );
  });

  it('permite leer un laboratorio suspendido, pero no operar sobre él', async () => {
    const { service, em } = build({ labStatus: PHL.LAB_SUSPENDED });

    await expect(service.requireLab(em, LAB)).resolves.toMatchObject({
      id: LAB,
    });
    await expect(service.requireActiveLab(em, LAB)).rejects.toThrow(
      'no está activo',
    );
  });
});
