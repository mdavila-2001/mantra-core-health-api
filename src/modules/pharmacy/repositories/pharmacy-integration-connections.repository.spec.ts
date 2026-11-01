import { jest } from '@jest/globals';
import { PharmacyIntegrationConnections } from '../entities';
import { PharmacyIntegrationConnectionsRepository } from './pharmacy-integration-connections.repository';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

describe('PharmacyIntegrationConnectionsRepository', () => {
  const repo = new PharmacyIntegrationConnectionsRepository();

  describe('create', () => {
    it('deja connection_id nulo cuando no hay conexión de integraciones', () => {
      const em = { create: mockFn((_entity: unknown, data: unknown) => data) };

      repo.create(em as any, {
        pharmacyId: 'ph1',
        integrationModeConceptId: 'mode1',
        statusConceptId: 'st1',
      });

      const [entity, data] = em.create.mock.calls[0];
      expect(entity).toBe(PharmacyIntegrationConnections);
      expect(data.connectionId).toBeUndefined();
      expect(data.connectionId).not.toBe(data.id);
    });

    it('conserva la conexión de integraciones cuando se aporta', () => {
      const em = { create: mockFn((_entity: unknown, data: unknown) => data) };

      repo.create(em as any, {
        pharmacyId: 'ph1',
        connectionId: 'pc1',
        integrationModeConceptId: 'mode1',
        statusConceptId: 'st1',
      });

      expect(em.create.mock.calls[0][1].connectionId).toBe('pc1');
    });
  });
});
