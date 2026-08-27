import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { MedicationDispensationsService } from './medication-dispensations.service';
import { PINV } from '../pharmacy_inventory.concepts';
import { PreconditionFailedException } from '../../../common';

const actor = { id: 'pharm-1', roles: ['PHARMACIST'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const dispensationsRepo = {
    create: mockFn(() => ({ id: 'disp1' })),
    createLine: mockFn(() => ({ id: 'dl1' })),
    findByIdempotencyKey: mockFn(),
    findLines: mockFn(async () => []),
    findById: mockFn(),
  };
  const reservationsRepo = {
    findById: mockFn(),
    findLinesByReservation: mockFn(async () => []),
  };
  const stockRepo = {
    findByKey: mockFn(),
    findByKeyForUpdate: mockFn(),
    create: mockFn(),
  };
  const ledgerRepo = {
    nextSequence: mockFn(async () => '1'),
    append: mockFn(() => ({ id: 'led1' })),
    findEntryIdsBySource: mockFn(async () => []),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new MedicationDispensationsService(
    em as any,
    dispensationsRepo,
    reservationsRepo as any,
    stockRepo as any,
    ledgerRepo,
    logger as any,
  );
  return {
    service,
    tx,
    dispensationsRepo,
    reservationsRepo,
    stockRepo,
    ledgerRepo,
  };
}

describe('MedicationDispensationsService', () => {
  it('dispense: locks the stock position FOR UPDATE before the read-modify-write', async () => {
    const d = build();
    d.stockRepo.findByKeyForUpdate.mockResolvedValue({
      onHandQuantity: '10',
      reservedQuantity: '0',
      quarantineQuantity: '0',
      availableQuantity: '10',
    });
    const dto = {
      pharmacySiteId: 's1',
      patientProfileId: 'pat1',
      lines: [
        {
          inventoryLocationId: 'loc1',
          pharmacyProductId: 'p1',
          inventoryLotId: 'lot1',
          dispensedQuantity: 3,
        },
      ],
    };
    const res = await d.service.dispense('ph1', dto, actor);
    expect(res.id).toBe('disp1');
    // Toma el lock, no un read suelto.
    expect(d.stockRepo.findByKeyForUpdate).toHaveBeenCalledWith(d.tx, {
      inventoryLocationId: 'loc1',
      pharmacyProductId: 'p1',
      inventoryLotId: 'lot1',
    });
    expect(d.stockRepo.findByKey).not.toHaveBeenCalled();
  });

  it('dispense: a patient ORDER cannot be closed through the generic route', async () => {
    const d = build();
    // La reserva referida es un pedido de paciente (estado PINV_ORDER_*):
    // su entrega exige el codigo de retiro y acumula por linea (FAR-E3).
    d.reservationsRepo.findById.mockResolvedValue({
      id: 'res-order',
      reservationStatusConceptId: PINV.ORDER_LISTO_PARA_RETIRO,
    });

    await expect(
      d.service.dispense(
        'ph1',
        {
          pharmacySiteId: 's1',
          patientProfileId: 'pat1',
          inventoryReservationId: 'res-order',
          lines: [
            {
              inventoryLocationId: 'loc1',
              pharmacyProductId: 'p1',
              dispensedQuantity: 1,
            },
          ],
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    // Cero efectos: ni dispensacion, ni ledger, ni stock.
    expect(d.dispensationsRepo.create).not.toHaveBeenCalled();
    expect(d.ledgerRepo.append).not.toHaveBeenCalled();
  });

  it('dispense: insufficient on-hand throws 422', async () => {
    const d = build();
    d.stockRepo.findByKeyForUpdate.mockResolvedValue({
      onHandQuantity: '1',
      reservedQuantity: '0',
      quarantineQuantity: '0',
      availableQuantity: '1',
    });
    const dto = {
      pharmacySiteId: 's1',
      patientProfileId: 'pat1',
      lines: [
        {
          inventoryLocationId: 'loc1',
          pharmacyProductId: 'p1',
          dispensedQuantity: 5,
        },
      ],
    };
    await expect(
      d.service.dispense('ph1', dto as any, actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('dispense: idempotent retry returns the existing dispensation without touching stock', async () => {
    const d = build();
    d.dispensationsRepo.findByIdempotencyKey.mockResolvedValue({
      id: 'disp-existing',
    });
    d.dispensationsRepo.findLines.mockResolvedValue([{ id: 'dl-existing' }]);
    d.ledgerRepo.findEntryIdsBySource.mockResolvedValue(['led-existing']);
    const dto = {
      pharmacySiteId: 's1',
      patientProfileId: 'pat1',
      idempotencyKey: 'idem-disp',
      lines: [
        {
          inventoryLocationId: 'loc1',
          pharmacyProductId: 'p1',
          dispensedQuantity: 3,
        },
      ],
    };
    const res = await d.service.dispense('ph1', dto, actor);
    expect(res).toEqual({
      id: 'disp-existing',
      lineIds: ['dl-existing'],
      ledgerEntryIds: ['led-existing'],
    });
    expect(d.dispensationsRepo.findByIdempotencyKey).toHaveBeenCalledWith(
      d.tx,
      'ph1',
      'idem-disp',
    );
    // No repite el efecto.
    expect(d.dispensationsRepo.create).not.toHaveBeenCalled();
    expect(d.stockRepo.findByKeyForUpdate).not.toHaveBeenCalled();
    expect(d.ledgerRepo.append).not.toHaveBeenCalled();
  });
});
