import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DiagnosticEquipmentService } from './diagnostic-equipment.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { DUNIT } from '../diagnostic_units.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const sitesRepo = { findById: mockFn() };
  const equipmentRepo = {
    findById: mockFn(),
    findBySerial: mockFn().mockResolvedValue(null),
    create: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new DiagnosticEquipmentService(
    em as any,
    sitesRepo as any,
    equipmentRepo,
    logger as any,
  );
  return { service, tx, sitesRepo, equipmentRepo };
}

const activeSite = () => ({
  id: 's1',
  statusConceptId: DUNIT.SITE_ACTIVE,
  imagingAvailable: false,
  updatedAt: new Date(),
});

describe('DiagnosticEquipmentService', () => {
  describe('addEquipment (UC-23-09)', () => {
    it('rejects when the site is not active (precondition)', async () => {
      const d = build();
      d.sitesRepo.findById.mockResolvedValue({
        id: 's1',
        statusConceptId: 'other',
      });
      await expect(
        d.service.addEquipment(
          's1',
          { equipmentTypeConceptId: 'et1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a duplicate serial number (conflict)', async () => {
      const d = build();
      d.sitesRepo.findById.mockResolvedValue(activeSite());
      d.equipmentRepo.findBySerial.mockResolvedValue({ id: 'e1' });
      await expect(
        d.service.addEquipment(
          's1',
          { equipmentTypeConceptId: 'et1', serialNumber: 'SN1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('registers equipment and flips imaging_available on first imaging device', async () => {
      const d = build();
      const site = activeSite();
      d.sitesRepo.findById.mockResolvedValue(site);
      d.equipmentRepo.create.mockReturnValue({
        id: 'e1',
        operationalStatusConceptId: DUNIT.EQUIPMENT_OPERATIONAL,
      });
      const res = await d.service.addEquipment(
        's1',
        { equipmentTypeConceptId: 'et1', modalityConceptId: 'mod1' },
        actor,
      );
      expect(res.id).toBe('e1');
      expect(site.imagingAvailable).toBe(true);
    });
  });

  describe('updateEquipment (UC-23-09)', () => {
    it('throws when the equipment does not exist', async () => {
      const d = build();
      d.equipmentRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.updateEquipment('missing', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('updates the operational status', async () => {
      const d = build();
      const equipment = {
        id: 'e1',
        diagnosticUnitSiteId: 's1',
        operationalStatusConceptId: DUNIT.EQUIPMENT_OPERATIONAL,
        updatedAt: new Date(),
      };
      d.equipmentRepo.findById.mockResolvedValue(equipment);
      const res = await d.service.updateEquipment(
        'e1',
        { operationalStatusConceptId: DUNIT.EQUIPMENT_MAINTENANCE },
        actor,
      );
      expect(res.operationalStatus).toBe(DUNIT.EQUIPMENT_MAINTENANCE);
    });
  });
});
