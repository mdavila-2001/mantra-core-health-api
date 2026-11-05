import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { MedicationDispensationsService } from '../application/medication-dispensations/medication-dispensations.service';
import { DispenseMedicationUseCase } from '../application/medication-dispensations/dispense-medication.use-case';
import { ReverseMedicationDispensationUseCase } from '../application/medication-dispensations/reverse-medication-dispensation.use-case';
import { PINV } from '../domain/pharmacy_inventory.concepts';
import { allowAllScope } from '../application/scope/pharmacy-inventory-scope.testing';
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
  const scope = allowAllScope();
  const dispense = new DispenseMedicationUseCase(
    em as any,
    dispensationsRepo,
    reservationsRepo as any,
    stockRepo as any,
    ledgerRepo,
    scope,
    logger as any,
  );
  const reverse = new ReverseMedicationDispensationUseCase(
    em as any,
    dispensationsRepo,
    reservationsRepo as any,
    stockRepo as any,
    ledgerRepo,
    scope,
    logger as any,
  );
  const service = new MedicationDispensationsService(
    dispense,
    reverse,
    logger as any,
  );
  return {
    service,
    tx,
    dispensationsRepo,
    reservationsRepo,
    stockRepo,
    ledgerRepo,
    scope,
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
      pharmacyId: 'ph1',
      pharmacySiteId: 's1',
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

  it('reverse: appends a compensating entry and restores stock at the supplied location', async () => {
    const d = build();
    d.dispensationsRepo.findById.mockResolvedValue({
      id: 'disp1',
      pharmacyId: 'ph1',
      pharmacySiteId: 'site1',
      dispensationStatusConceptId: PINV.DISPENSE_DISPENSED,
    });
    d.dispensationsRepo.findLines.mockResolvedValue([
      {
        pharmacyProductId: 'product1',
        inventoryLotId: 'lot1',
        dispensedQuantity: '3',
      },
    ]);
    const position = {
      onHandQuantity: '4',
      reservedQuantity: '1',
      quarantineQuantity: '0',
    };
    d.stockRepo.findByKeyForUpdate.mockResolvedValue(position);

    await expect(
      d.service.reverse('disp1', { inventoryLocationId: 'loc1' } as any, actor),
    ).resolves.toEqual({ id: 'disp1', status: 'REVERSED' });
    expect(d.ledgerRepo.append).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        movementTypeConceptId: PINV.MV_DISPENSE_REVERSAL,
        quantityDelta: '3',
        inventoryLocationId: 'loc1',
      }),
    );
    expect(position).toMatchObject({
      onHandQuantity: '7',
      availableQuantity: '6',
    });
  });
});
