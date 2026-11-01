import { describe, expect, it, jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { ResourceNotFoundException } from '../../../common';
import { ORGEXT } from '../../organization_extensions/organization_extensions.concepts';
import { PRAC } from '../practice.concepts';
import { TYPOLOGY_RULE_SEED } from '../domain/structure/structure-catalog';
import { SiteEstablishmentService } from './site-establishment.service';
import { translateStructureWriteError } from './structure-write-errors';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const TENANT = 'tenant-a';
const owner = { id: 'o1', roles: ['USER'] } as any;
const platform = { id: 'p1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const site: any = {
    id: 's1',
    practiceId: 'p1',
    tenantId: TENANT,
    statusConceptId: PRAC.SITE_ACTIVE,
    rowVersion: 3,
  };
  const spaces: any[] = [];
  const licenses: any[] = [];
  const tx: any = {
    flush: mockFn().mockResolvedValue(undefined),
    execute: mockFn().mockResolvedValue([]),
    findOne: mockFn().mockResolvedValue(null),
  };
  const em: any = {
    transactional: mockFn((cb: any) => cb(tx)),
    findOne: tx.findOne,
  };
  const access = {
    requireSite: mockFn(async (_t: any, id: string, tenant: string) => {
      if (id !== 's1' || tenant !== TENANT)
        throw new ResourceNotFoundException('Sitio no encontrado');
      return site;
    }),
    assertCanAdministerOrganization: mockFn().mockResolvedValue(undefined),
    assertCanRead: mockFn().mockResolvedValue(undefined),
    canWriteSite: mockFn().mockResolvedValue(true),
  };
  const spacesRepo = { findBySite: mockFn(async () => spaces) };
  const unitsRepo = { findById: mockFn().mockResolvedValue(null) };
  const rulesRepo = {
    typologyRules: mockFn().mockResolvedValue(TYPOLOGY_RULE_SEED),
  };
  const capacitiesRepo = {
    findBySite: mockFn().mockResolvedValue([]),
    create: mockFn((_t: any, d: any) => ({ id: 'dc1', ...d })),
  };
  const licensesRepo = {
    findBySite: mockFn(async () => licenses),
    findByIdInTenant: mockFn(
      async (_t: any, id: string, tenantId: string) =>
        licenses.find((l) => l.id === id && l.tenantId === tenantId) ?? null,
    ),
    findByNumber: mockFn().mockResolvedValue(null),
    create: mockFn((_t: any, d: any) => {
      const row = { id: `l${licenses.length + 1}`, rowVersion: 1, ...d };
      licenses.push(row);
      return row;
    }),
  };
  const historyRepo = { append: mockFn().mockResolvedValue(undefined) };
  const outbox = { publishDomainEvent: mockFn().mockResolvedValue({}) };
  const service = new SiteEstablishmentService(
    em,
    access as any,
    spacesRepo as any,
    unitsRepo as any,
    rulesRepo as any,
    capacitiesRepo as any,
    licensesRepo as any,
    historyRepo as any,
    outbox as any,
  );
  return { service, site, spaces, licenses, tx, access, licensesRepo, outbox };
}

describe('SiteEstablishmentService', () => {
  describe('datos regulatorios', () => {
    it('guarda códigos como conceptos y avisa las funciones obligatorias que faltan', async () => {
      const d = build();
      const res = await d.service.updateRegulatory(
        's1',
        {
          typologyCode: 'TYPOLOGY_HOSPITAL_L2',
          sedesCode: 'SEDES_LPZ',
          snisCode: '200101',
        },
        undefined,
        owner,
        TENANT,
      );
      expect(d.site.facilityTypologyConceptId).toBe(PRAC.TYPOLOGY_HOSPITAL_L2);
      expect(res.regulatory.sedes?.code).toBe('SEDES_LPZ');
      expect(res.regulatory.snisVerified).toBe(false);
      expect(res.missingRequiredFunctions.sort()).toEqual([
        'SPACE_FN_EMERGENCY_BOX',
        'SPACE_FN_INPATIENT_ROOM',
        'SPACE_FN_OPERATING_ROOM',
      ]);
    });

    it('tipología que deja espacios fuera de regla: 409 TYPOLOGY_CONFLICT con la lista', async () => {
      const d = build();
      d.spaces.push({
        id: 'q1',
        code: 'QX-1',
        name: 'Quirófano 1',
        spaceTypeConceptId: PRAC.SPACE_FN_OPERATING_ROOM,
        statusConceptId: PRAC.SPACE_ACTIVE,
      });
      const err: any = await d.service
        .updateRegulatory(
          's1',
          { typologyCode: 'TYPOLOGY_HEALTH_POST' },
          undefined,
          owner,
          TENANT,
        )
        .catch((e) => e);
      expect(err.getStatus()).toBe(409);
      expect(err.reason).toBe('TYPOLOGY_CONFLICT');
      expect(err.details.conflicts).toEqual([
        {
          spaceId: 'q1',
          code: 'QX-1',
          name: 'Quirófano 1',
          function: { code: 'SPACE_FN_OPERATING_ROOM', display: 'Quirófano' },
          functionCode: 'SPACE_FN_OPERATING_ROOM',
        },
      ]);
    });

    it('sede de otro tenant: 404; admin de sucursal (no de la org): 403', async () => {
      const d = build();
      await expect(
        d.service.updateRegulatory('s1', {}, undefined, owner, 'tenant-b'),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      d.access.assertCanAdministerOrganization.mockRejectedValue(
        new ForbiddenException('no'),
      );
      await expect(
        d.service.updateRegulatory('s1', {}, undefined, owner, TENANT),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('If-Match presente y distinto: 412', async () => {
      const d = build();
      await expect(
        d.service.updateRegulatory('s1', {}, '1', owner, TENANT),
      ).rejects.toMatchObject({ reason: 'ROW_VERSION_MISMATCH' });
    });
  });

  describe('verificación SNIS', () => {
    // Un rol de plataforma acotado al tenant (`scopedRoles`, MCH-001) no es la
    // plataforma: verificaría a su propia organización (#1241).
    it('plataforma acotada al tenant (aun el propio) no verifica ni cambia habilitaciones', async () => {
      for (const role of ['SECURITY_ADMIN', 'SUPERADMIN']) {
        const scoped = {
          id: 'p-a',
          roles: [role],
          scopedRoles: { [TENANT]: [role] },
        } as any;
        const d = build();
        d.site.snisCode = '200101';
        await expect(
          d.service.verifySnis('s1', scoped, TENANT),
        ).rejects.toBeInstanceOf(ForbiddenException);
        expect(d.tx.execute).not.toHaveBeenCalled();
        d.licenses.push({
          id: 'l1',
          practiceSiteId: 's1',
          tenantId: TENANT,
          licenseNumber: 'X',
          verificationStatusConceptId: ORGEXT.LICENSE_PENDING,
          rowVersion: 1,
        });
        await expect(
          d.service.updateLicense(
            'l1',
            { status: 'LIC_VALID' },
            undefined,
            scoped,
            TENANT,
          ),
        ).rejects.toBeInstanceOf(ForbiddenException);
      }
    });

    it('sólo plataforma', async () => {
      const d = build();
      d.site.snisCode = '200101';
      await expect(
        d.service.verifySnis('s1', owner, TENANT),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.tx.execute).not.toHaveBeenCalled();
    });

    it('plataforma: abre y cierra el contexto SYSTEM alrededor de la escritura', async () => {
      const d = build();
      d.site.snisCode = '200101';
      const res = await d.service.verifySnis('s1', platform, TENANT);
      expect(res.regulatory.snisVerified).toBe(true);
      const calls = d.tx.execute.mock.calls.map((c: any[]) => c[0]);
      expect(calls).toEqual([
        "select set_config('app.system_context', 'true', true)",
        "select set_config('app.system_context', 'false', true)",
      ]);
    });

    it('si la escritura choca (23505), responde el 409 y no intenta otra sentencia', async () => {
      const d = build();
      d.site.snisCode = '200101';
      d.tx.flush.mockRejectedValueOnce({
        code: '23505',
        constraint: 'ux_practice_sites_snis_code',
      });
      const err: any = await d.service
        .verifySnis('s1', platform, TENANT)
        .catch((e) => e);
      expect(err.reason).toBe('SNIS_CODE_UNAVAILABLE');
      expect(d.tx.execute).toHaveBeenCalledTimes(1);
    });

    it('sin código declarado: 422 SNIS_CODE_MISSING', async () => {
      const d = build();
      await expect(
        d.service.verifySnis('s1', platform, TENANT),
      ).rejects.toMatchObject({ reason: 'SNIS_CODE_MISSING' });
    });

    it('choque con un código verificado: 409 genérico, sin detalle', () => {
      const err: any = translateStructureWriteError({
        code: '23505',
        constraint: 'ux_practice_sites_snis_code',
        detail: 'Key (snis_code)=(200101) already exists.',
      });
      expect(err.getStatus()).toBe(409);
      expect(err.reason).toBe('SNIS_CODE_UNAVAILABLE');
      expect(JSON.stringify(err.getResponse())).not.toContain('200101');
    });

    it('FK cruzada de tenant (23503): 404 sin nombrar la restricción', () => {
      const err: any = translateStructureWriteError({
        cause: { code: '23503', constraint: 'fk_care_spaces_tenant_parent' },
      });
      expect(err).toBeInstanceOf(ResourceNotFoundException);
      expect(JSON.stringify(err.getResponse())).not.toContain('fk_');
    });
  });

  describe('habilitaciones (fachada sobre facility_licenses)', () => {
    it('alta: nace en trámite sobre la tabla de organization_extensions', async () => {
      const d = build();
      const res = await d.service.createLicense(
        's1',
        {
          authorityName: 'SEDES La Paz',
          resolutionNumber: 'RA-1',
          expiresOn: '2027-01-01',
        },
        owner,
        TENANT,
      );
      expect(res.status.code).toBe('LIC_IN_PROCESS');
      expect(d.licensesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          tenantId: TENANT,
          practiceSiteId: 's1',
          licenseNumber: 'RA-1',
          issuingAuthorityName: 'SEDES La Paz',
          verificationStatusConceptId: ORGEXT.LICENSE_PENDING,
        }),
      );
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventType: 'practice.site_license.created' }),
      );
    });

    it('verificada con vencimiento pasado se lee vencida', async () => {
      const d = build();
      d.licenses.push({
        id: 'l9',
        practiceSiteId: 's1',
        tenantId: TENANT,
        licenseNumber: 'X',
        verificationStatusConceptId: ORGEXT.LICENSE_VERIFIED,
        validTo: new Date('2020-01-01T00:00:00Z'),
        rowVersion: 1,
      });
      const [l] = await d.service.listLicenses('s1', owner, TENANT);
      expect(l.status.code).toBe('LIC_EXPIRED');
    });

    it('el estado lo cambia sólo la plataforma; suspendida no se puede guardar', async () => {
      const d = build();
      d.licenses.push({
        id: 'l1',
        practiceSiteId: 's1',
        tenantId: TENANT,
        licenseNumber: 'X',
        verificationStatusConceptId: ORGEXT.LICENSE_PENDING,
        rowVersion: 1,
      });
      await expect(
        d.service.updateLicense(
          'l1',
          { status: 'LIC_VALID' },
          undefined,
          owner,
          TENANT,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        d.service.updateLicense(
          'l1',
          { status: 'LIC_SUSPENDED' },
          undefined,
          platform,
          TENANT,
        ),
      ).rejects.toMatchObject({ reason: 'LICENSE_STATUS_UNSUPPORTED' });
      const ok = await d.service.updateLicense(
        'l1',
        { status: 'LIC_VALID' },
        undefined,
        platform,
        TENANT,
      );
      expect(ok.status.code).toBe('LIC_VALID');
    });

    it('notes con texto: 422 LICENSE_NOTES_UNSUPPORTED (sin columna); vacío se acepta', async () => {
      const d = build();
      await expect(
        d.service.createLicense(
          's1',
          { authorityName: 'SEDES', resolutionNumber: 'N-1', notes: 'algo' },
          owner,
          TENANT,
        ),
      ).rejects.toMatchObject({ reason: 'LICENSE_NOTES_UNSUPPORTED' });
      const ok = await d.service.createLicense(
        's1',
        { authorityName: 'SEDES', resolutionNumber: 'N-2', notes: '' },
        owner,
        TENANT,
      );
      expect(ok.status.code).toBe('LIC_IN_PROCESS');
    });

    it('la org edita una verificada: vuelve a en trámite', async () => {
      const d = build();
      d.licenses.push({
        id: 'l1',
        practiceSiteId: 's1',
        tenantId: TENANT,
        licenseNumber: 'X',
        verificationStatusConceptId: ORGEXT.LICENSE_VERIFIED,
        rowVersion: 1,
      });
      const res = await d.service.updateLicense(
        'l1',
        { resolutionNumber: 'Y' },
        undefined,
        owner,
        TENANT,
      );
      expect(res.status.code).toBe('LIC_IN_PROCESS');
    });

    it('habilitación de otro tenant: 404', async () => {
      const d = build();
      d.licenses.push({
        id: 'l1',
        practiceSiteId: 's1',
        tenantId: 'tenant-b',
        licenseNumber: 'X',
        verificationStatusConceptId: ORGEXT.LICENSE_PENDING,
        rowVersion: 1,
      });
      await expect(
        d.service.updateLicense(
          'l1',
          { resolutionNumber: 'Y' },
          undefined,
          owner,
          TENANT,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('capacidad', () => {
    it('declarada (sede + hospital) vs. derivada, con brechas', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue({ licensedBedCapacity: 40 });
      d.spaces.push(
        {
          id: 'b1',
          formConceptId: PRAC.LOC_FORM_BED,
          spaceTypeConceptId: PRAC.SPACE_FN_BED_STANDARD,
          statusConceptId: PRAC.SPACE_ACTIVE,
          censable: true,
        },
        {
          id: 'b2',
          formConceptId: PRAC.LOC_FORM_BED,
          spaceTypeConceptId: PRAC.SPACE_FN_BED_STANDARD,
          statusConceptId: PRAC.SPACE_PLANNED,
          censable: true,
        },
      );
      const res = await d.service.capacity('s1', owner, TENANT);
      expect(res.declared).toEqual([
        {
          kindCode: 'CAP_BEDS_CENSABLE',
          quantity: 40,
          asOf: null,
          resolutionNumber: null,
          source: 'hospital',
        },
      ]);
      expect(
        res.derived.find((x) => x.kindCode === 'CAP_BEDS_CENSABLE')?.quantity,
      ).toBe(1);
      expect(res.gaps).toEqual([
        { kindCode: 'CAP_BEDS_CENSABLE', declared: 40, derived: 1 },
      ]);
    });

    it('tipo de capacidad desconocido: 422', async () => {
      const d = build();
      await expect(
        d.service.declareCapacity(
          's1',
          { kindCode: 'CAMAS', quantity: 3, asOf: '2026-10-01' },
          owner,
          TENANT,
        ),
      ).rejects.toMatchObject({ reason: 'SPACE_UNKNOWN_CODE' });
    });
  });
});
