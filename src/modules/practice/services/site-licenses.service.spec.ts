import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { ORGEXT } from '../../organization_extensions/organization_extensions.concepts';
import { REGULATORY } from '../infrastructure-catalog';
import { PracticeErrorReason } from '../practice.error-reasons';
import { RowVersionMismatchException } from '../http/row-version';
import { SiteLicensesService } from './site-licenses.service';
import {
  TENANT_A,
  TENANT_B,
  actor,
  makeSite,
  mockFn,
} from './infrastructure.testing';
import { runWithTenant } from '../../../common';

const lic = (code: string) => REGULATORY.licenseStatus.byInput(code)!.id;

const makeLicense = (overrides: Record<string, unknown> = {}): any => ({
  id: 'l1',
  tenantId: TENANT_A,
  practiceSiteId: 's1',
  licenseTypeConceptId: ORGEXT.LICENSE_TYPE_OPERATING,
  licenseNumber: 'RES-1',
  issuingAuthorityName: 'SEDES',
  verificationStatusConceptId: lic('LIC_VALID'),
  rowVersion: 1,
  ...overrides,
});

function build(license: any = null) {
  const tx = {
    flush: mockFn().mockResolvedValue(undefined),
    find: mockFn().mockResolvedValue([]),
  };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const context = {
    site: mockFn().mockResolvedValue({
      site: makeSite(),
      tenantId: TENANT_A,
      access: { level: 'ORG' },
    }),
  };
  const created: any[] = [];
  const licensesRepo = {
    findByNumber: mockFn().mockResolvedValue(null),
    findByIdInTenant: mockFn().mockResolvedValue(license),
    create: mockFn((_tx: any, data: any) => {
      const row = makeLicense({
        ...data,
        id: 'l-new',
        licenseNumber: data.licenseNumber,
        rowVersion: 1,
      });
      created.push(row);
      return row;
    }),
  };
  const references = {
    healthcareServiceInTenants: mockFn().mockResolvedValue(true),
    fileInTenants: mockFn().mockResolvedValue(true),
  };
  const unitsRepo = { findById: mockFn().mockResolvedValue(null) };
  const events = { publish: mockFn().mockResolvedValue(undefined) };
  const service = new SiteLicensesService(
    em as any,
    context as any,
    licensesRepo as any,
    references as any,
    unitsRepo as any,
    events as any,
  );
  return {
    service,
    tx,
    context,
    licensesRepo,
    references,
    unitsRepo,
    events,
    created,
  };
}
const conTenant = <T>(fn: () => Promise<T>): Promise<T> =>
  runWithTenant(TENANT_A, fn);
const isoDay = (offsetDays: number): string =>
  new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);

describe('SiteLicensesService.view (INV-21: el vencimiento se calcula al leer)', () => {
  const { service } = build();
  const today = new Date('2026-10-29T12:00:00Z');

  it('LIC_VALID con vencimiento de ayer se lee LIC_EXPIRED y conserva el estado guardado', () => {
    const view = service.view(
      makeLicense({ validTo: new Date('2026-10-28') }),
      today,
    );
    expect(view.status.code).toBe('LIC_EXPIRED');
    expect(view.storedStatus.code).toBe('LIC_VALID');
  });

  it('vence hoy: sigue vigente; sin vencimiento: vigente; a futuro: vigente', () => {
    expect(
      service.view(makeLicense({ validTo: new Date('2026-10-29') }), today)
        .status.code,
    ).toBe('LIC_VALID');
    expect(
      service.view(makeLicense({ validTo: undefined }), today).status.code,
    ).toBe('LIC_VALID');
    expect(
      service.view(makeLicense({ validTo: new Date('2099-01-01') }), today)
        .status.code,
    ).toBe('LIC_VALID');
  });

  it('una suspendida o en trámite no se convierte en vencida por la fecha', () => {
    for (const code of ['LIC_SUSPENDED', 'LIC_IN_PROCESS', 'LIC_REVOKED']) {
      const view = service.view(
        makeLicense({
          verificationStatusConceptId: lic(code),
          validTo: new Date('2020-01-01'),
        }),
        today,
      );
      expect(view.status.code).toBe(code);
    }
  });

  it('traduce el vocabulario heredado de facility_licenses (pendiente, verificada, rechazada)', () => {
    const mapa: Array<[string, string]> = [
      [ORGEXT.LICENSE_PENDING, 'LIC_IN_PROCESS'],
      [ORGEXT.LICENSE_VERIFIED, 'LIC_VALID'],
      [ORGEXT.LICENSE_REJECTED, 'LIC_REVOKED'],
    ];
    for (const [legado, esperado] of mapa) {
      expect(
        service.view(
          makeLicense({ verificationStatusConceptId: legado }),
          today,
        ).status.code,
      ).toBe(esperado);
    }
  });

  it('mapea los campos de facility_licenses a los del contrato', () => {
    const view = service.view(
      makeLicense({
        validFrom: new Date('2026-01-10'),
        validTo: new Date('2027-01-10'),
        evidenceFileId: 'f1',
        clinicalUnitId: 'u1',
      }),
      today,
    );
    expect(view).toMatchObject({
      authorityName: 'SEDES',
      resolutionNumber: 'RES-1',
      issuedOn: '2026-01-10',
      expiresOn: '2027-01-10',
      documentFileId: 'f1',
      clinicalUnitId: 'u1',
      healthcareServiceId: null,
    });
  });
});

describe('SiteLicensesService.create', () => {
  it('registra sobre facility_licenses con tenant, sede, estado LIC_* y evento', async () => {
    const d = build();
    const view = await d.service.create(
      's1',
      {
        resolutionNumber: ' RES-9 ',
        authorityName: 'SEDES',
        issuedOn: '2026-01-01',
        expiresOn: '2027-01-01',
        status: 'LIC_VALID',
      },
      actor,
      'req-1',
    );
    expect(d.context.site).toHaveBeenCalledWith(
      d.tx,
      's1',
      actor,
      'regulatory',
    );
    expect(d.licensesRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        tenantId: TENANT_A,
        practiceSiteId: 's1',
        licenseNumber: 'RES-9',
        verificationStatusConceptId: lic('LIC_VALID'),
        facilityTypeConceptId: ORGEXT.FACILITY_TYPE_HOSPITAL,
        licenseTypeConceptId: ORGEXT.LICENSE_TYPE_OPERATING,
      }),
    );
    expect(view.resolutionNumber).toBe('RES-9');
    expect(d.events.publish).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        type: 'practice.site_license.created',
        correlationId: 'req-1',
      }),
    );
  });

  it('por omisión nace en trámite; un estado inventado, número repetido o vencimiento anterior a la emisión: 422/409/422', async () => {
    const d = build();
    await d.service.create('s1', { resolutionNumber: 'R' }, actor);
    expect(d.licensesRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        verificationStatusConceptId: lic('LIC_IN_PROCESS'),
      }),
    );
    await expect(
      d.service.create('s1', { resolutionNumber: 'R', status: 'LIC_X' }, actor),
    ).rejects.toMatchObject({
      reason: PracticeErrorReason.CATALOG_CODE_INVALID,
    });
    await expect(
      d.service.create(
        's1',
        {
          resolutionNumber: 'R',
          issuedOn: '2026-05-01',
          expiresOn: '2026-01-01',
        },
        actor,
      ),
    ).rejects.toMatchObject({
      reason: PracticeErrorReason.VALIDITY_RANGE_INVALID,
    });
    d.licensesRepo.findByNumber.mockResolvedValue(makeLicense());
    await expect(
      d.service.create('s1', { resolutionNumber: 'RES-1' }, actor),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('la unidad, el servicio y el archivo de otro tenant responden 404; la unidad de otra sede, 422', async () => {
    const d = build();
    await expect(
      d.service.create(
        's1',
        { resolutionNumber: 'R', clinicalUnitId: 'u9' },
        actor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    d.unitsRepo.findById.mockResolvedValue({
      id: 'u9',
      tenantId: TENANT_B,
      practiceSiteId: 's1',
    });
    await expect(
      d.service.create(
        's1',
        { resolutionNumber: 'R', clinicalUnitId: 'u9' },
        actor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    d.unitsRepo.findById.mockResolvedValue({
      id: 'u9',
      tenantId: TENANT_A,
      practiceSiteId: 's9',
    });
    await expect(
      d.service.create(
        's1',
        { resolutionNumber: 'R', clinicalUnitId: 'u9' },
        actor,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    d.references.healthcareServiceInTenants.mockResolvedValue(false);
    await expect(
      d.service.create(
        's1',
        { resolutionNumber: 'R', healthcareServiceId: 'h1' },
        actor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    d.references.fileInTenants.mockResolvedValue(false);
    await expect(
      d.service.create(
        's1',
        { resolutionNumber: 'R', documentFileId: 'f1' },
        actor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.licensesRepo.create).not.toHaveBeenCalled();
  });
});

describe('SiteLicensesService.update', () => {
  it('con If-Match vigente cambia el estado y publica; versión vieja 412; habilitación de otro tenant 404', async () => {
    const license = makeLicense();
    const d = build(license);
    const view = await conTenant(() =>
      d.service.update(
        'l1',
        { status: 'LIC_SUSPENDED', expiresOn: isoDay(30) },
        1,
        actor,
        'req-2',
      ),
    );
    expect(license.verificationStatusConceptId).toBe(lic('LIC_SUSPENDED'));
    expect(view.status.code).toBe('LIC_SUSPENDED');
    expect(d.events.publish).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        type: 'practice.site_license.updated',
        payload: expect.objectContaining({
          changedFields: expect.arrayContaining(['status', 'expiresOn']),
        }),
      }),
    );

    await expect(
      conTenant(() =>
        build(makeLicense({ rowVersion: 3 })).service.update(
          'l1',
          { status: 'LIC_VALID' },
          1,
          actor,
        ),
      ),
    ).rejects.toBeInstanceOf(RowVersionMismatchException);
    const ajena = build(makeLicense({ tenantId: TENANT_B }));
    await expect(
      conTenant(() =>
        ajena.service.update('l1', { status: 'LIC_VALID' }, 1, actor),
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(ajena.context.site).not.toHaveBeenCalled();
  });

  it('un PATCH sin cambios no versiona; el vencimiento no puede quedar antes de la emisión (usa la fecha ya guardada)', async () => {
    const license = makeLicense({ validFrom: new Date('2026-06-01') });
    const d = build(license);
    await conTenant(() => d.service.update('l1', {}, 1, actor));
    expect(d.tx.flush).not.toHaveBeenCalled();
    await expect(
      conTenant(() =>
        d.service.update('l1', { expiresOn: '2026-01-01' }, 1, actor),
      ),
    ).rejects.toMatchObject({
      reason: PracticeErrorReason.VALIDITY_RANGE_INVALID,
    });
  });
});
