import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  deleteRegisteredOrganizations,
  type TestContext,
} from './harness';
import { CONCEPTS } from '../../src/common';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import { DIR } from '../../src/modules/directory/directory.concepts';
import {
  Tenants,
  TenantMedicalFacilities,
  TenantMedicalFacilitySites,
} from '../../src/modules/directory/entities';
import { Practices } from '../../src/modules/practice/entities';
import { DiagnosticUnits } from '../../src/modules/diagnostic_units/entities';

/**
 * Alta de establecimientos médicos (`HOSPITAL`, `CLINIC`, `MEDICAL_OFFICE`,
 * `NURSING`, `HEALTH_OTHER`) con el bloque `organization.medicalFacility` en
 * `POST /iam/auth/register-organization`: NIT, número de registro ante la
 * autoridad sanitaria, director médico con matrícula, casa central y
 * sucursales, persistidos en la misma transacción del alta.
 *
 * Necesita la base de integración con las tablas
 * `directory.tenant_medical_facilities` y
 * `directory.tenant_medical_facility_sites` (modelo v4.2.63).
 */
describe('alta de establecimiento médico (integración)', () => {
  let ctx: TestContext;
  const marca = randomUUID().slice(0, 8);

  /** Cuentas y tenants creados por esta suite, para limpiar al final. */
  const creados: { userId: string; tenantId: string }[] = [];

  const http = () => request(ctx.app.getHttpServer());

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  });

  afterAll(async () => {
    // Cerrar la app antes de limpiar: apaga el worker de mensajería, que si
    // siguiera corriendo podría insertar filas entre el escaneo y el borrado.
    await ctx.app.close();
    await deleteRegisteredOrganizations(creados);
  });

  const gerencia = (nombre: string, n: number) => ({
    name: nombre,
    lastName: 'Gerente',
    phone: `+591 7000000${n}`,
    email: `gerencia${n}-${marca}@example.test`,
  });

  /**
   * Número de registro sanitario único por corrida. El DTO lo acota a
   * `MEDICAL_FACILITY_REGISTRATION_PATTERN` (`[A-Za-z0-9./-]`, sin `_`), y los
   * sufijos que se arman con el tipo de tenant (`MEDICAL_OFFICE`) lo traían.
   */
  const registro = (sufijo: string) =>
    `SEDES-${marca}-${sufijo.replace(/_/g, '-')}`;

  /** El bloque `medicalFacility` completo, con un registro único por corrida. */
  const bloque = (sufijo: string) => ({
    taxIdentifierNumber: '1023456789',
    healthFacilityRegistrationNumber: registro(sufijo),
    medicalDirector: {
      name: 'Ana',
      middleName: 'Lucía',
      lastName: 'Rojas',
      motherLastName: 'Paz',
      professionalLicenseNumber: `MAT-${marca}`,
      email: `director-${sufijo}-${marca}@example.test`,
      phone: '+591 70012345',
    },
    headquarters: {
      name: 'Casa central',
      addressLines: ['Av. San Martín 123', 'Edificio Torre, piso 2'],
      latitude: -17.78,
      longitude: -63.18,
    },
    branches: [
      {
        name: 'Sucursal Equipetrol',
        addressLines: ['Av. Equipetrol 45'],
        latitude: -17.7,
        longitude: -63.1,
      },
      { name: 'Sucursal Norte', addressLines: ['Av. Banzer km 5'] },
    ],
  });

  const alta = (
    code: string,
    tenantType: string,
    medicalFacility?: Record<string, unknown>,
    extra: Record<string, unknown> = {},
  ) => ({
    organization: {
      code,
      legalName: `Establecimiento ${code} S.R.L.`,
      tenantType,
      countryConceptId: CONCEPTS.COUNTRY_BO,
      jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
      ...(medicalFacility ? { medicalFacility } : {}),
      ...extra,
    },
    owner: {
      email: `${code.toLowerCase()}@example.test`,
      password: 'S3cret-passw0rd',
      name: 'Elena',
      lastName: 'Salas',
    },
  });

  it('HOSPITAL con el bloque completo y las tres gerencias → 201, todo persistido en el alta', async () => {
    const res = await http()
      .post('/iam/auth/register-organization')
      .send(
        alta(`MED_HOSP_${marca}`, 'HOSPITAL', bloque('HOSP'), {
          executives: {
            generalManager: gerencia('Carlos', 1),
            commercialManager: gerencia('Ana', 2),
            marketingManager: gerencia('Luis', 3),
          },
        }),
      )
      .expect(201);
    creados.push({ userId: res.body.ownerUserId, tenantId: res.body.tenantId });

    expect(res.body.medicalFacilityRegistered).toBe(true);
    expect(res.body.representativesRegistered).toBe(3);

    const em = ctx.orm.em.fork();
    const tenant = await em.findOneOrFail(Tenants, { id: res.body.tenantId });
    expect(tenant.statusConceptId).toBe(DIR.TENANT_PENDING);
    expect(tenant.verificationStatusConceptId).toBe(DIR.TENANT_UNVERIFIED);
    expect(tenant.tenantTypeConceptId).toBe(CONCEPTS.TENANT_TYPE_HOSPITAL);

    const facility = await em.findOneOrFail(TenantMedicalFacilities, {
      tenantId: res.body.tenantId,
    });
    expect(facility).toMatchObject({
      taxIdentifierNumber: '1023456789',
      healthFacilityRegistrationNumber: `SEDES-${marca}-HOSP`,
      medicalDirectorName: 'Ana',
      medicalDirectorMiddleName: 'Lucía',
      medicalDirectorLastName: 'Rojas',
      medicalDirectorMotherLastName: 'Paz',
      medicalDirectorLicenseNumber: `MAT-${marca}`,
      medicalDirectorEmail: `director-HOSP-${marca}@example.test`,
      medicalDirectorPhone: '+591 70012345',
      createdByUserId: res.body.ownerUserId,
    });

    const sites = await em.find(
      TenantMedicalFacilitySites,
      { medicalFacilityId: facility.id },
      { orderBy: { ordinal: 'ASC' } },
    );
    expect(sites.map((s) => [s.siteKind, s.ordinal, s.name])).toEqual([
      ['headquarters', 0, 'Casa central'],
      ['branch', 1, 'Sucursal Equipetrol'],
      ['branch', 2, 'Sucursal Norte'],
    ]);
    expect(sites[0].addressLines).toEqual([
      'Av. San Martín 123',
      'Edificio Torre, piso 2',
    ]);
    expect(Number(sites[0].latitude)).toBeCloseTo(-17.78);
    expect(Number(sites[0].longitude)).toBeCloseTo(-63.18);
    expect(sites[2].latitude).toBeNull();
    expect(sites[2].longitude).toBeNull();
    expect(sites.every((s) => s.tenantId === res.body.tenantId)).toBe(true);

    // La práctica y la sede operativas NO nacen en el alta: son de
    // `medical-center-setup`, tras la verificación.
    expect(await em.count(Practices, { tenantId: res.body.tenantId })).toBe(0);
    expect(
      await em.count(DiagnosticUnits, { tenantId: res.body.tenantId }),
    ).toBe(0);
  });

  it.each(['CLINIC', 'MEDICAL_OFFICE', 'NURSING', 'HEALTH_OTHER'])(
    '%s con el bloque mínimo (sin sedes) → 201 y la fila del establecimiento',
    async (tenantType) => {
      const {
        headquarters: _hq,
        branches: _br,
        ...minimo
      } = bloque(tenantType);
      const res = await http()
        .post('/iam/auth/register-organization')
        .send(alta(`MED_${tenantType}_${marca}`, tenantType, minimo))
        .expect(201);
      creados.push({
        userId: res.body.ownerUserId,
        tenantId: res.body.tenantId,
      });
      expect(res.body.medicalFacilityRegistered).toBe(true);

      const em = ctx.orm.em.fork();
      const facility = await em.findOneOrFail(TenantMedicalFacilities, {
        tenantId: res.body.tenantId,
      });
      expect(facility.healthFacilityRegistrationNumber).toBe(
        registro(tenantType),
      );
      expect(
        await em.count(TenantMedicalFacilitySites, {
          medicalFacilityId: facility.id,
        }),
      ).toBe(0);
    },
  );

  it('un tipo médico sin el bloque se registra igual (compatibilidad) → medicalFacilityRegistered=false', async () => {
    const res = await http()
      .post('/iam/auth/register-organization')
      .send(alta(`MED_SIN_${marca}`, 'HOSPITAL'))
      .expect(201);
    creados.push({ userId: res.body.ownerUserId, tenantId: res.body.tenantId });

    expect(res.body.medicalFacilityRegistered).toBe(false);
    const em = ctx.orm.em.fork();
    expect(
      await em.count(TenantMedicalFacilities, { tenantId: res.body.tenantId }),
    ).toBe(0);
  });

  it.each(['PHARMACY', 'DIAGNOSTIC_CENTER', 'PROVIDER'])(
    'el bloque con %s → 422, sin cuenta ni tenant',
    async (tenantType) => {
      const code = `MED_422_${tenantType}_${marca}`;
      const res = await http()
        .post('/iam/auth/register-organization')
        .send(alta(code, tenantType, bloque(`X${tenantType}`)))
        .expect(422);

      expect(res.body.code).toBe('PRECONDITION_FAILED');
      expect(JSON.stringify(res.body)).toContain('medicalFacility');

      const em = ctx.orm.em.fork();
      expect(await em.count(Tenants, { code })).toBe(0);
      const restos = await em.getConnection().execute<{ id: string }[]>(
        `select u.id as id from iam.users u
           join iam.authentication_credentials c on c.user_id = u.id
          where c.external_subject = ?`,
        [`${code.toLowerCase()}@example.test`],
      );
      expect(restos).toHaveLength(0);
    },
  );

  it('una sede con sólo latitud → 400 de validación', async () => {
    const res = await http()
      .post('/iam/auth/register-organization')
      .send(
        alta(`MED_400_${marca}`, 'CLINIC', {
          ...bloque('400'),
          headquarters: { addressLines: ['x'], latitude: -17.78 },
        }),
      )
      .expect(400);
    expect(JSON.stringify(res.body)).toContain('longitude');
  });

  it('un NIT con letras → 400 de validación', async () => {
    await http()
      .post('/iam/auth/register-organization')
      .send(
        alta(`MED_NIT_${marca}`, 'CLINIC', {
          ...bloque('NIT'),
          taxIdentifierNumber: 'ABC-123',
        }),
      )
      .expect(400);
  });

  it('si el alta falla después de persistir el establecimiento, no queda nada (misma transacción)', async () => {
    const code = `MED_ROLLBACK_${marca}`;
    // Un fileId que no existe: el alta lo descubre al vincular los papeles,
    // DESPUÉS de haber persistido el establecimiento y sus sedes.
    const inexistente = () => randomUUID();
    await http()
      .post('/iam/auth/register-organization')
      .send(
        alta(code, 'CLINIC', bloque('RB'), {
          legalEntityType: 'SRL',
          legalDocuments: {
            constitutionFileId: inexistente(),
            taxIdentifierFileId: inexistente(),
            commerceRegistryFileId: inexistente(),
            operatingLicenseFileId: inexistente(),
            healthAuthorityCertificateFileId: inexistente(),
          },
        }),
      )
      .expect(422);

    const em = ctx.orm.em.fork();
    expect(await em.count(Tenants, { code })).toBe(0);
    expect(
      await em.count(TenantMedicalFacilities, {
        healthFacilityRegistrationNumber: `SEDES-${marca}-RB`,
      }),
    ).toBe(0);
  });
});
