import { jest } from '@jest/globals';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { encodeKeysetCursor } from '../../../common/pagination/keyset-cursor';
import { patientCoverageReferenceDate } from '../../profiles/patient-coverage-validity';
import { INS } from '../insurance.concepts';
import type { CreateInsuranceCampaignDto } from '../dto/insurance-campaigns.dto';
import { InsuranceCampaignsService } from './insurance-campaigns.service';

const fn = jest.fn as unknown as (impl?: (...args: any[]) => any) => any;

const TENANT_ID = 'tenant-andina';
const CARRIER = { id: 'carrier-andina', tenantId: TENANT_ID };
const OPERATOR = { id: 'user-operator', roles: ['USER'] } as never;
const PATIENT = { id: 'user-patient', roles: ['PATIENT'] } as never;
const SUPERADMIN = { id: 'user-root', roles: ['SUPERADMIN'] } as never;
const PROFILE_ID = '11111111-1111-4111-8111-111111111111';

/** Día civil de hoy (La Paz) desplazado `days` días. */
function civil(days: number): string {
  const base = Date.parse(`${patientCoverageReferenceDate()}T12:00:00.000Z`);
  return new Date(base + days * 86_400_000).toISOString().slice(0, 10);
}

function createDto(
  overrides: Partial<CreateInsuranceCampaignDto> = {},
): CreateInsuranceCampaignDto {
  return {
    code: 'CMP-CARDIO-2026',
    title: 'Chequeo Preventivo Cardiovascular y Perfil Lipídico',
    campaignType: 'LABORATORY',
    targetConditionCode: 'I10',
    copayBonusPercentage: 100,
    validFrom: civil(0),
    validTo: civil(60),
    partners: [
      {
        role: 'PROVIDER',
        type: 'LABORATORY',
        name: 'Laboratorio Central AloVida',
      },
      { role: 'PROVIDER', type: 'PHARMACY', name: 'Farmacias Aliadas' },
    ],
    ...overrides,
  };
}

function campaignRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'camp-1',
    code: 'CMP-CARDIO-2026',
    title: 'Chequeo Preventivo Cardiovascular y Perfil Lipídico',
    description: null,
    campaign_type_concept_id: INS.CAMPAIGN_TYPE_LABORATORY,
    status_concept_id: INS.CAMPAIGN_ACTIVE,
    target_condition_code: 'I10',
    target_condition_display: 'Hipertensión esencial',
    copay_bonus_percentage: '100.00',
    valid_from: civil(0),
    valid_to: civil(60),
    activated_at: '2026-09-25T10:00:00.000000Z',
    created_at: '2026-09-25T10:00:00.123456Z',
    updated_at: '2026-09-25T10:00:00.123456Z',
    partners: [
      {
        id: 'partner-1',
        role_concept_id: INS.CAMPAIGN_PARTNER_ROLE_PROVIDER,
        type_concept_id: INS.CAMPAIGN_PARTNER_TYPE_LABORATORY,
        name: 'Laboratorio Central AloVida',
        network_provider_membership_id: null,
      },
    ],
    ...overrides,
  };
}

function build() {
  const tx = { flush: fn().mockResolvedValue(undefined) };
  const em = {
    transactional: fn((work: (t: typeof tx) => unknown) => work(tx)),
    fork: fn().mockReturnValue(tx),
  };
  const created = { id: 'camp-1' };
  const repo = {
    findByCarrierAndCode: fn().mockResolvedValue(null),
    findEntityForCarrier: fn().mockResolvedValue(null),
    createCampaign: fn().mockReturnValue(created),
    createPartner: fn().mockReturnValue({ id: 'partner-x' }),
    resolveIcd10ConceptId: fn().mockResolvedValue('concept-i10'),
    getRowForCarrier: fn().mockResolvedValue(campaignRow()),
    listRowsByCarrier: fn().mockResolvedValue([]),
    findCurrentCarrierIdsForPatient: fn().mockResolvedValue([]),
    listActiveRowsForCarriers: fn().mockResolvedValue([]),
  };
  const catalog = { findCarrierByTenantId: fn().mockResolvedValue(CARRIER) };
  const tenantAdministration = {
    assertCanAdminister: fn().mockResolvedValue(undefined),
    assertCanRead: fn().mockResolvedValue(undefined),
  };
  const profileOwnership = {
    assertOwnsPatientProfile: fn().mockResolvedValue(undefined),
  };
  const auditTrail = { record: fn().mockResolvedValue(undefined) };
  const service = new InsuranceCampaignsService(
    em as never,
    repo as never,
    catalog as never,
    tenantAdministration as never,
    profileOwnership as never,
    auditTrail as never,
  );
  return {
    service,
    tx,
    em,
    repo,
    catalog,
    tenantAdministration,
    profileOwnership,
    auditTrail,
  };
}

const asOperator = <T>(work: () => Promise<T>) =>
  runWithTenant(TENANT_ID, work);

describe('InsuranceCampaignsService · alta y activación (CA-4.1)', () => {
  it('crea la campaña en borrador con sus aliados y deja auditoría', async () => {
    const { service, repo, tx, auditTrail } = build();

    const result = await asOperator(() =>
      service.create(createDto(), OPERATOR),
    );

    expect(repo.createCampaign).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        insuranceCarrierId: CARRIER.id,
        code: 'CMP-CARDIO-2026',
        statusConceptId: INS.CAMPAIGN_DRAFT,
        campaignTypeConceptId: INS.CAMPAIGN_TYPE_LABORATORY,
        targetConditionConceptId: 'concept-i10',
        copayBonusPercentage: '100',
        activatedAt: undefined,
        actorUserId: 'user-operator',
      }),
    );
    expect(repo.createPartner).toHaveBeenCalledTimes(2);
    expect(repo.createPartner).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        insuranceCampaignId: 'camp-1',
        partnerRoleConceptId: INS.CAMPAIGN_PARTNER_ROLE_PROVIDER,
        partnerTypeConceptId: INS.CAMPAIGN_PARTNER_TYPE_PHARMACY,
        partnerName: 'Farmacias Aliadas',
      }),
    );
    expect(auditTrail.record).toHaveBeenCalledWith(
      tx,
      OPERATOR,
      expect.objectContaining({ action: 'INSURANCE_CAMPAIGN_CREATED' }),
    );
    expect(result.code).toBe('CMP-CARDIO-2026');
  });

  it('persiste el padre antes que los aliados (las FK son uuid planas)', async () => {
    const { service, repo, tx } = build();
    const order: string[] = [];
    repo.createCampaign.mockImplementation(() => {
      order.push('campaña');
      return { id: 'camp-1' };
    });
    repo.createPartner.mockImplementation(() => {
      order.push('aliado');
      return {};
    });
    tx.flush.mockImplementation(async () => {
      order.push('flush');
    });

    await asOperator(() => service.create(createDto(), OPERATOR));

    expect(order.slice(0, 3)).toEqual(['campaña', 'flush', 'aliado']);
  });

  it('con activate=true nace ACTIVE y sella activatedAt', async () => {
    const { service, repo, tx } = build();

    await asOperator(() =>
      service.create(createDto({ activate: true }), OPERATOR),
    );

    expect(repo.createCampaign).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        statusConceptId: INS.CAMPAIGN_ACTIVE,
        activatedAt: expect.any(Date),
      }),
    );
  });

  it('guarda las fechas como día civil estable (mediodía UTC)', async () => {
    const { service, repo } = build();

    await asOperator(() =>
      service.create(
        createDto({ validFrom: '2026-10-01', validTo: '2026-12-31' }),
        OPERATOR,
      ),
    );

    const data = repo.createCampaign.mock.calls[0][1];
    expect(data.validFrom.toISOString()).toBe('2026-10-01T12:00:00.000Z');
    expect(data.validTo.toISOString()).toBe('2026-12-31T12:00:00.000Z');
  });

  it('resuelve el CIE-10 en mayúsculas y lo guarda como concepto', async () => {
    const { service, repo, tx } = build();

    await asOperator(() =>
      service.create(createDto({ targetConditionCode: ' i10 ' }), OPERATOR),
    );

    expect(repo.resolveIcd10ConceptId).toHaveBeenCalledWith(tx, 'I10');
  });

  it('sin patología no consulta el catálogo y deja el concepto vacío', async () => {
    const { service, repo } = build();

    await asOperator(() =>
      service.create(createDto({ targetConditionCode: undefined }), OPERATOR),
    );

    expect(repo.resolveIcd10ConceptId).not.toHaveBeenCalled();
    expect(repo.createCampaign.mock.calls[0][1].targetConditionConceptId).toBe(
      undefined,
    );
  });
});

describe('InsuranceCampaignsService · validaciones negativas (CA-4.6)', () => {
  it('rechaza fechas invertidas con 400 y no persiste nada', async () => {
    const { service, repo } = build();

    await expect(
      asOperator(() =>
        service.create(
          createDto({ validFrom: civil(10), validTo: civil(1) }),
          OPERATOR,
        ),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.createCampaign).not.toHaveBeenCalled();
  });

  it('rechaza activar una campaña cuya vigencia ya terminó', async () => {
    const { service, repo } = build();

    await expect(
      asOperator(() =>
        service.create(
          createDto({
            activate: true,
            validFrom: civil(-30),
            validTo: civil(-1),
          }),
          OPERATOR,
        ),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.createCampaign).not.toHaveBeenCalled();
  });

  it('rechaza un código repetido en la misma aseguradora con 409', async () => {
    const { service, repo } = build();
    repo.findByCarrierAndCode.mockResolvedValue({ id: 'otra' });

    await expect(
      asOperator(() => service.create(createDto(), OPERATOR)),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repo.findByCarrierAndCode).toHaveBeenCalledWith(
      expect.anything(),
      CARRIER.id,
      'CMP-CARDIO-2026',
    );
    expect(repo.createCampaign).not.toHaveBeenCalled();
  });

  it('rechaza un CIE-10 que el catálogo no conoce con 400', async () => {
    const { service, repo } = build();
    repo.resolveIcd10ConceptId.mockResolvedValue(null);

    await expect(
      asOperator(() =>
        service.create(createDto({ targetConditionCode: 'ZZZ9' }), OPERATOR),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.createCampaign).not.toHaveBeenCalled();
  });
});

describe('InsuranceCampaignsService · control de acceso administrativo (CA-4.7)', () => {
  it('un paciente sin tenant recibe 403, no 412', async () => {
    const { service, repo } = build();

    await expect(service.create(createDto(), PATIENT)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(repo.createCampaign).not.toHaveBeenCalled();
  });

  it('un actor con tenant pero sin rol de administración recibe 403', async () => {
    const { service, repo, tenantAdministration } = build();
    tenantAdministration.assertCanAdminister.mockRejectedValue(
      new ForbiddenException('Se requiere ser OWNER o ADMIN'),
    );

    await expect(
      asOperator(() => service.create(createDto(), PATIENT)),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.createCampaign).not.toHaveBeenCalled();
  });

  it('una organización que no es aseguradora recibe 403', async () => {
    const { service, catalog, repo } = build();
    catalog.findCarrierByTenantId.mockResolvedValue(null);

    await expect(
      asOperator(() => service.create(createDto(), OPERATOR)),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.createCampaign).not.toHaveBeenCalled();
  });

  it('la plataforma sin X-Tenant-Id recibe la pista de 422', async () => {
    const { service } = build();

    await expect(
      service.create(createDto(), SUPERADMIN),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('autoriza antes de validar: un paciente con datos inválidos ve 403, no 400', async () => {
    const { service } = build();

    await expect(
      service.create(
        createDto({ validFrom: civil(9), validTo: civil(1) }),
        PATIENT,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('InsuranceCampaignsService · cambio de estado', () => {
  function withCampaign(status: string, validTo = civil(60)) {
    const ctx = build();
    const entity = {
      id: 'camp-1',
      statusConceptId: status,
      activatedAt: undefined as Date | undefined,
      updatedAt: new Date(0),
      updatedByUserId: undefined as string | undefined,
    };
    ctx.repo.findEntityForCarrier.mockResolvedValue(entity);
    ctx.repo.getRowForCarrier.mockResolvedValue(
      campaignRow({ valid_to: validTo }),
    );
    return { ...ctx, entity };
  }

  it('DRAFT → ACTIVE activa, sella activatedAt y audita', async () => {
    const { service, entity, tx, auditTrail } = withCampaign(
      INS.CAMPAIGN_DRAFT,
    );

    await asOperator(() =>
      service.changeStatus('camp-1', { status: 'ACTIVE' }, OPERATOR),
    );

    expect(entity.statusConceptId).toBe(INS.CAMPAIGN_ACTIVE);
    expect(entity.activatedAt).toBeInstanceOf(Date);
    expect(entity.updatedByUserId).toBe('user-operator');
    expect(auditTrail.record).toHaveBeenCalledWith(
      tx,
      OPERATOR,
      expect.objectContaining({ action: 'INSURANCE_CAMPAIGN_STATUS_CHANGED' }),
    );
  });

  it('ACTIVE ⇄ PAUSED y ACTIVE → EXPIRED están permitidos', async () => {
    for (const [from, to, expected] of [
      [INS.CAMPAIGN_ACTIVE, 'PAUSED', INS.CAMPAIGN_PAUSED],
      [INS.CAMPAIGN_PAUSED, 'ACTIVE', INS.CAMPAIGN_ACTIVE],
      [INS.CAMPAIGN_ACTIVE, 'EXPIRED', INS.CAMPAIGN_EXPIRED],
    ] as const) {
      const { service, entity } = withCampaign(from);
      await asOperator(() =>
        service.changeStatus('camp-1', { status: to }, OPERATOR),
      );
      expect(entity.statusConceptId).toBe(expected);
    }
  });

  it('una transición fuera de la tabla responde 422 y no muta', async () => {
    for (const [from, to] of [
      [INS.CAMPAIGN_DRAFT, 'PAUSED'],
      [INS.CAMPAIGN_DRAFT, 'EXPIRED'],
      [INS.CAMPAIGN_EXPIRED, 'ACTIVE'],
      [INS.CAMPAIGN_EXPIRED, 'PAUSED'],
    ] as const) {
      const { service, entity, auditTrail } = withCampaign(from);
      await expect(
        asOperator(() =>
          service.changeStatus('camp-1', { status: to }, OPERATOR),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(entity.statusConceptId).toBe(from);
      expect(auditTrail.record).not.toHaveBeenCalled();
    }
  });

  it('no activa una campaña cuya vigencia ya venció', async () => {
    const { service, entity } = withCampaign(INS.CAMPAIGN_PAUSED, civil(-1));

    await expect(
      asOperator(() =>
        service.changeStatus('camp-1', { status: 'ACTIVE' }, OPERATOR),
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(entity.statusConceptId).toBe(INS.CAMPAIGN_PAUSED);
  });

  it('repetir el estado actual es idempotente: no escribe ni audita', async () => {
    const { service, tx, auditTrail } = withCampaign(INS.CAMPAIGN_ACTIVE);

    await asOperator(() =>
      service.changeStatus('camp-1', { status: 'ACTIVE' }, OPERATOR),
    );

    expect(tx.flush).not.toHaveBeenCalled();
    expect(auditTrail.record).not.toHaveBeenCalled();
  });

  it('una campaña de otra aseguradora responde 404, igual que una inexistente', async () => {
    const { service, repo } = build();
    repo.findEntityForCarrier.mockResolvedValue(null);

    await expect(
      asOperator(() =>
        service.changeStatus('camp-ajena', { status: 'ACTIVE' }, OPERATOR),
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(repo.findEntityForCarrier).toHaveBeenCalledWith(
      expect.anything(),
      CARRIER.id,
      'camp-ajena',
    );
  });

  it('un paciente no puede cambiar el estado (403)', async () => {
    const { service, tenantAdministration } = build();
    tenantAdministration.assertCanAdminister.mockRejectedValue(
      new ForbiddenException('Se requiere ser OWNER o ADMIN'),
    );

    await expect(
      asOperator(() =>
        service.changeStatus('camp-1', { status: 'ACTIVE' }, PATIENT),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('InsuranceCampaignsService · listado administrativo', () => {
  it('traduce los filtros a conceptos y acota por aseguradora', async () => {
    const { service, repo, tenantAdministration } = build();

    await asOperator(() =>
      service.list({ type: 'PHARMACY', status: 'PAUSED', limit: 10 }, OPERATOR),
    );

    expect(tenantAdministration.assertCanRead).toHaveBeenCalled();
    expect(repo.listRowsByCarrier).toHaveBeenCalledWith(
      expect.anything(),
      CARRIER.id,
      {
        typeConceptId: INS.CAMPAIGN_TYPE_PHARMACY,
        statusConceptId: INS.CAMPAIGN_PAUSED,
        after: undefined,
        limit: 11,
      },
    );
  });

  it('pide una fila de más y devuelve nextCursor sólo si hay página siguiente', async () => {
    const { service, repo } = build();
    repo.listRowsByCarrier.mockResolvedValue([
      campaignRow({ id: 'a' }),
      campaignRow({ id: 'b' }),
      campaignRow({ id: 'c', created_at: '2026-09-24T00:00:00.000001Z' }),
    ]);

    const page = await asOperator(() => service.list({ limit: 2 }, OPERATOR));

    expect(page.items.map((item) => item.id)).toEqual(['a', 'b']);
    expect(page.nextCursor).toEqual(expect.any(String));
  });

  it('la última página no trae cursor', async () => {
    const { service, repo } = build();
    repo.listRowsByCarrier.mockResolvedValue([campaignRow()]);

    const page = await asOperator(() => service.list({ limit: 5 }, OPERATOR));

    expect(page.nextCursor).toBeNull();
  });

  it('reenvía el cursor decodificado y rechaza uno inválido con 400', async () => {
    const { service, repo } = build();
    const cursor = encodeKeysetCursor({
      createdAt: '2026-09-25T10:00:00.123456Z',
      id: 'camp-9',
    });

    await asOperator(() => service.list({ cursor }, OPERATOR));
    expect(repo.listRowsByCarrier.mock.calls[0][2].after).toEqual({
      createdAt: '2026-09-25T10:00:00.123456Z',
      id: 'camp-9',
    });

    await expect(
      asOperator(() =>
        service.list({ cursor: '%%no-es-un-cursor%%' }, OPERATOR),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('mapea la fila: bonificación numérica, patología y aliados', async () => {
    const { service, repo } = build();
    repo.getRowForCarrier.mockResolvedValue(campaignRow());

    const dto = await asOperator(() => service.getById('camp-1', OPERATOR));

    expect(dto).toMatchObject({
      id: 'camp-1',
      campaignType: 'LABORATORY',
      status: 'ACTIVE',
      copayBonusPercentage: 100,
      targetCondition: { code: 'I10', display: 'Hipertensión esencial' },
    });
    expect(dto.partners[0]).toMatchObject({
      role: 'PROVIDER',
      type: 'LABORATORY',
    });
  });

  it('una campaña inexistente o de otra aseguradora responde 404', async () => {
    const { service, repo } = build();
    repo.getRowForCarrier.mockResolvedValue(null);

    await expect(
      asOperator(() => service.getById('nada', OPERATOR)),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(repo.getRowForCarrier).toHaveBeenCalledWith(
      expect.anything(),
      CARRIER.id,
      'nada',
    );
  });
});

describe('InsuranceCampaignsService · afiliado (CA-4.2 a CA-4.5)', () => {
  const patientRow = (overrides: Record<string, unknown> = {}) => ({
    ...campaignRow(),
    carrier_name: 'Seguros Andina',
    ...overrides,
  });

  it('CA-4.5: el perfil de otro afiliado responde 403 y la denegación se audita', async () => {
    const { service, profileOwnership, auditTrail, repo, tx } = build();
    profileOwnership.assertOwnsPatientProfile.mockRejectedValue(
      new ForbiddenException('Sólo el titular del perfil'),
    );

    await expect(
      service.listActiveForPatient(PROFILE_ID, PATIENT),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(auditTrail.record).toHaveBeenCalledWith(
      tx,
      PATIENT,
      expect.objectContaining({
        action: 'INSURANCE_CAMPAIGN_ACCESS_DENIED',
        entity: 'patient_profile',
        entityId: PROFILE_ID,
        success: false,
      }),
    );
    expect(repo.findCurrentCarrierIdsForPatient).not.toHaveBeenCalled();
    expect(repo.listActiveRowsForCarriers).not.toHaveBeenCalled();
  });

  it('un fallo que no es 403 se propaga sin registrarse como denegación', async () => {
    const { service, profileOwnership, auditTrail } = build();
    profileOwnership.assertOwnsPatientProfile.mockRejectedValue(
      new Error('la base no responde'),
    );

    await expect(
      service.listActiveForPatient(PROFILE_ID, PATIENT),
    ).rejects.toThrow('la base no responde');
    expect(auditTrail.record).not.toHaveBeenCalled();
  });

  it('CA-4.4: sólo consulta las aseguradoras de las coberturas vigentes del titular', async () => {
    const { service, repo, tx } = build();
    repo.findCurrentCarrierIdsForPatient.mockResolvedValue(['carrier-andina']);
    repo.listActiveRowsForCarriers.mockResolvedValue([patientRow()]);

    await service.listActiveForPatient(PROFILE_ID, PATIENT);

    expect(repo.findCurrentCarrierIdsForPatient).toHaveBeenCalledWith(
      tx,
      PROFILE_ID,
      patientCoverageReferenceDate(),
    );
    expect(repo.listActiveRowsForCarriers).toHaveBeenCalledWith(
      tx,
      ['carrier-andina'],
      patientCoverageReferenceDate(),
    );
  });

  it('sin cobertura vigente no hay campañas', async () => {
    const { service, repo } = build();
    repo.findCurrentCarrierIdsForPatient.mockResolvedValue([]);
    repo.listActiveRowsForCarriers.mockResolvedValue([]);

    await expect(
      service.listActiveForPatient(PROFILE_ID, PATIENT),
    ).resolves.toEqual([]);
    expect(repo.listActiveRowsForCarriers).toHaveBeenCalledWith(
      expect.anything(),
      [],
      expect.any(String),
    );
  });

  it('CA-4.2: entrega título, bonificación, vigencia, aseguradora y aliados', async () => {
    const { service, repo } = build();
    repo.findCurrentCarrierIdsForPatient.mockResolvedValue(['carrier-andina']);
    repo.listActiveRowsForCarriers.mockResolvedValue([patientRow()]);

    const [dto] = await service.listActiveForPatient(PROFILE_ID, PATIENT);

    expect(dto).toMatchObject({
      code: 'CMP-CARDIO-2026',
      campaignType: 'LABORATORY',
      copayBonusPercentage: 100,
      carrierName: 'Seguros Andina',
      targetCondition: { code: 'I10' },
      partners: [
        {
          role: 'PROVIDER',
          type: 'LABORATORY',
          name: 'Laboratorio Central AloVida',
        },
      ],
    });
  });

  it('la respuesta del afiliado no filtra ids internos ni el estado', async () => {
    const { service, repo } = build();
    repo.findCurrentCarrierIdsForPatient.mockResolvedValue(['carrier-andina']);
    repo.listActiveRowsForCarriers.mockResolvedValue([
      patientRow({
        insurance_carrier_id: 'carrier-andina',
        created_by_user_id: 'user-operator',
        partner_tenant_id: 'tenant-x',
      }),
    ]);

    const [dto] = await service.listActiveForPatient(PROFILE_ID, PATIENT);

    expect(Object.keys(dto).sort()).toEqual(
      [
        'campaignType',
        'carrierName',
        'code',
        'copayBonusPercentage',
        'description',
        'id',
        'partners',
        'targetCondition',
        'title',
        'validFrom',
        'validTo',
      ].sort(),
    );
    expect(Object.keys(dto.partners[0]).sort()).toEqual([
      'name',
      'role',
      'type',
    ]);
    expect(JSON.stringify(dto)).not.toContain('carrier-andina');
    expect(JSON.stringify(dto)).not.toContain('user-operator');
  });
});
