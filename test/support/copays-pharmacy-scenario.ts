import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { CLIN } from '../../src/modules/clinical/clinical.concepts';
import type { ClaimLineDto } from '../../src/modules/insurance/dto';
import type { PharmacyOrderDto } from '../../src/modules/pharmacy_inventory/dto';
import { bearer, type TestContext } from '../integration/harness';

interface ScenarioInput {
  pharmacyTenantId: string;
  patientToken: string;
  patientProfileId: string;
  currencyConceptId: string;
}
export interface CopaysPharmacyOrder {
  orderId: string;
  lines: ClaimLineDto[];
}
export interface CopaysPharmacyScenario {
  pharmacyId: string;
  siteId: string;
  productIds: string[];
  medicationRequestId: string;
  orders: CopaysPharmacyOrder[];
  createOrder(): Promise<CopaysPharmacyOrder>;
  ready(orderId: string): Promise<string>;
  dispense(
    orderId: string,
    pickupCode: string,
    productIds?: string[],
  ): Promise<PharmacyOrderDto>;
}

/** El escenario y sus identificadores se construyen únicamente mediante la API. */
export async function createCopaysPharmacyScenario(
  ctx: TestContext,
  input: ScenarioInput,
): Promise<CopaysPharmacyScenario> {
  const tag = randomUUID().slice(0, 8);
  const adminHeaders = {
    ...bearer(ctx.adminToken),
    'X-Tenant-Id': input.pharmacyTenantId,
  };
  const patientHeaders = {
    ...bearer(input.patientToken),
    'X-Tenant-Id': input.pharmacyTenantId,
  };
  async function post<T>(
    path: string,
    body: unknown,
    patient = false,
    expected = 201,
  ): Promise<T> {
    const response = await request(ctx.app.getHttpServer())
      .post(path)
      .set(patient ? patientHeaders : adminHeaders)
      .send(body as object);
    if (response.status !== expected) {
      throw new Error(
        path +
          ' expected ' +
          expected +
          ', received ' +
          response.status +
          ': ' +
          JSON.stringify(response.body),
      );
    }
    return response.body as T;
  }

  const practice = await post<{ id: string }>('/practices', {
    tenantId: input.pharmacyTenantId,
    code: 'copays-practice-' + tag,
    name: 'Sede de farmacia de prueba',
  });
  const practiceSite = await post<{ id: string }>(
    '/practices/' + practice.id + '/sites',
    {
      code: 'copays-site-' + tag,
      name: 'Mostrador de prueba',
      managingTenantId: input.pharmacyTenantId,
    },
  );
  const pharmacy = await post<{ id: string; licenseId: string }>(
    '/pharmacies',
    {
      tenantId: input.pharmacyTenantId,
      code: 'copays-pharmacy-' + tag,
      legalName: 'Farmacia de prueba de copagos',
      tradeName: 'Farmacia de prueba',
      license: { licenseNumber: 'copays-license-' + tag },
    },
  );
  await post(
    '/pharmacies/' +
      pharmacy.id +
      '/licenses/' +
      pharmacy.licenseId +
      '/verify',
    { approve: true },
    false,
    200,
  );
  const site = await post<{ id: string }>(
    '/pharmacies/' + pharmacy.id + '/sites',
    {
      practiceSiteId: practiceSite.id,
      code: 'copays-pharmacy-site-' + tag,
      name: 'Mostrador',
      pickupAvailable: true,
    },
  );
  const productIds: string[] = [];
  const medicines = [CLIN.MEDICATION_PARACETAMOL, CLIN.MEDICATION_IBUPROFENO];
  for (const [index, medicationConceptId] of medicines.entries()) {
    const product = await post<{ id: string }>(
      '/pharmacies/' + pharmacy.id + '/products',
      {
        productCode: 'copays-product-' + index + '-' + tag,
        medicationConceptId,
        genericName: index === 0 ? 'Paracetamol' : 'Ibuprofeno',
        brandName: 'Presentación de prueba ' + index,
        requiresPrescription: false,
      },
    );
    productIds.push(product.id);
  }
  const priceList = await post<{ id: string }>(
    '/pharmacies/' + pharmacy.id + '/price-lists',
    {
      code: 'copays-public-' + tag,
      priceListType: 'PUBLIC',
      publicVisibility: true,
      pharmacySiteId: site.id,
      currencyConceptId: input.currencyConceptId,
    },
  );
  for (const [index, productId] of productIds.entries()) {
    await post(
      '/pharmacies/' + pharmacy.id + '/price-lists/' + priceList.id + '/prices',
      {
        pharmacyProductId: productId,
        unitAmount: index === 0 ? 20 : 30,
        patientAmount: index === 0 ? 20 : 30,
      },
    );
  }
  const location = await post<{ id: string }>(
    '/pharmacy/' + site.id + '/inventory-locations',
    {
      code: 'copays-stock-' + tag,
      name: 'Stock de prueba',
      controlledAccess: false,
    },
  );
  const supplier = await post<{ id: string }>(
    '/pharmacy/' + pharmacy.id + '/suppliers',
    {
      supplierTenantId: input.pharmacyTenantId,
      supplierCode: 'copays-supplier-' + tag,
    },
  );
  const purchase = await post<{ id: string; lineIds: string[] }>(
    '/pharmacy/' + pharmacy.id + '/purchase-orders',
    {
      pharmacySiteId: site.id,
      pharmacySupplierId: supplier.id,
      lines: productIds.map((pharmacyProductId) => ({
        pharmacyProductId,
        orderedQuantity: 40,
        unitCostAmount: 10,
      })),
    },
  );
  const receiptBase = {
    pharmacyPurchaseOrderId: purchase.id,
    pharmacySiteId: site.id,
    inventoryLocationId: location.id,
  };
  const stockLine = (index: number, lot: string, quantity: number) => ({
    pharmacyPurchaseOrderLineId: purchase.lineIds[index],
    pharmacyProductId: productIds[index],
    lotNumber: tag + '-' + lot,
    receivedQuantity: quantity,
    acceptedQuantity: quantity,
    unitCostAmount: 10,
    expiresAt: '2099-01-01T00:00:00Z',
  });
  await post('/pharmacy/' + pharmacy.id + '/goods-receipts', {
    ...receiptBase,
    lines: [stockLine(0, 'a', 1), stockLine(0, 'b', 1), stockLine(1, 'c', 20)],
  });
  const prescription = await post<{ id: string }>(
    '/clinical/medication-requests',
    {
      custodianTenantId: input.pharmacyTenantId,
      patientProfileId: input.patientProfileId,
      medicationConceptId: medicines[0],
      prescriberProfileId: ctx.practitionerSubtypeId,
      quantityDecimal: 10,
      doseText: 'Según indicación profesional',
      unitConceptId: CLIN.MEDICATION_UNIT_TABLET,
    },
  );
  await post(
    '/clinical/medication-requests/' + prescription.id + '/sign',
    {},
    false,
    200,
  );
  await post(
    '/clinical/medication-requests/' + prescription.id + '/issue',
    {},
    false,
    200,
  );

  async function createOrder(): Promise<CopaysPharmacyOrder> {
    const order = await post<{ id: string }>(
      '/pharmacy/orders',
      {
        siteId: site.id,
        medicationRequestId: prescription.id,
        deliveryMode: 'RETIRO',
        idempotencyKey: randomUUID(),
        lines: productIds.map((productId) => ({ productId, quantity: 2 })),
      },
      true,
    );
    await post('/pharmacy/orders/' + order.id + '/review', {}, false, 200);
    await post('/pharmacy/orders/' + order.id + '/confirm', {}, false, 200);
    const response = await request(ctx.app.getHttpServer())
      .get('/pharmacy/orders/' + order.id)
      .set(adminHeaders)
      .expect(200);
    const physicalLines = (response.body as PharmacyOrderDto).reservationLines;
    return {
      orderId: order.id,
      lines: physicalLines.map((line, index) => {
        if (line.billedAmount === null)
          throw new Error('Una porción confirmada no tiene importe congelado');
        return {
          lineSequence: index + 1,
          inventoryReservationLineId: line.id,
          quantity: line.quantity,
          billedAmount: line.billedAmount,
        };
      }),
    };
  }
  const first = await createOrder();
  // El primer pedido cruza dos lotes físicos del mismo producto.
  await post('/pharmacy/' + pharmacy.id + '/goods-receipts', {
    ...receiptBase,
    lines: [stockLine(0, 'd', 20)],
  });
  const second = await createOrder();
  return {
    pharmacyId: pharmacy.id,
    siteId: site.id,
    productIds,
    medicationRequestId: prescription.id,
    orders: [first, second],
    createOrder,
    async ready(orderId: string): Promise<string> {
      await post('/pharmacy/orders/' + orderId + '/ready', {}, false, 200);
      const response = await request(ctx.app.getHttpServer())
        .get('/pharmacy/orders/' + orderId)
        .set(patientHeaders)
        .expect(200);
      const order = response.body as PharmacyOrderDto;
      if (!order.pickupCode)
        throw new Error('El pedido listo no entregó su código al titular');
      return order.pickupCode;
    },
    dispense: (orderId, pickupCode, products) =>
      post<PharmacyOrderDto>(
        '/pharmacy/orders/' + orderId + '/dispense',
        {
          pickupCode,
          ...(products ? { productIds: products } : {}),
          idempotencyKey: randomUUID(),
        },
        false,
        200,
      ),
  };
}
