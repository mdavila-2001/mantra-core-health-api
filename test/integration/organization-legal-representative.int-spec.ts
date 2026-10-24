import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  deleteRegisteredOrganizations,
  type TestContext,
} from './harness';
import { TenantLegalRepresentatives } from '../../src/modules/directory/entities';
import { Persons } from '../../src/modules/profiles/entities';
import { Identifiers, ContactPoints } from '../../src/modules/common/entities';
import { CatalogConcepts } from '../../src/modules/terminology/entities';
import { CONCEPTS } from '../../src/common';

/**
 * Subtarea 1.4 · el representante legal (con su poder notariado en PDF) y
 * las tres gerencias de contacto de una aseguradora, en
 * `POST /iam/auth/register-organization`.
 *
 * `directory.tenant_legal_representatives` existe desde v4.0.4 y hasta esta
 * subtarea no tenía un solo escritor. Cubre: cuatro `profiles.persons`
 * (representante + 3 gerentes) con su CI/correo/celular en las tablas
 * polimórficas de `common`, el poder materializado como un documento de
 * afiliación más (`PODER_REPRESENTANTE_LEGAL`/`NOTARIA`), y la lectura de
 * vuelta en `GET /tenants/me`.
 */
describe('1.4 · representante legal y gerencias del alta de organización (integración)', () => {
  let ctx: TestContext;
  const marca = randomUUID().slice(0, 8);

  const creados: { userId: string; tenantId: string }[] = [];
  /** Se acumulan para el `afterAll`: `deleteRegisteredOrganizations` sólo ve `tenantId`. */
  const personIdsCreados: string[] = [];

  const http = () => request(ctx.app.getHttpServer());

  const PDF = Buffer.from('%PDF-1.7\nsubtarea 1.4\n');

  /** Sube un PDF anónimo y devuelve su `fileId`. */
  async function subirPdf(nombre: string): Promise<string> {
    const res = await http()
      .post('/iam/auth/upload-registration-document')
      .attach('file', PDF, { filename: nombre, contentType: 'application/pdf' })
      .expect(201);
    return res.body.fileId;
  }

  /** Los cinco documentos de la empresa, cada uno con su propia pre-carga. */
  async function subirLosCincoDocumentos(): Promise<Record<string, string>> {
    return {
      constitutionFileId: await subirPdf('escritura.pdf'),
      taxIdentifierFileId: await subirPdf('nit.pdf'),
      commerceRegistryFileId: await subirPdf('seprec.pdf'),
      operatingLicenseFileId: await subirPdf('licencia.pdf'),
      healthAuthorityCertificateFileId: await subirPdf('sedes.pdf'),
    };
  }

  function gerencia(nombre: string, celular: string, correo: string) {
    return { fullName: nombre, phone: celular, email: correo };
  }

  function altaDto(overrides: {
    code: string;
    email: string;
    legalDocuments?: Record<string, string>;
    legalRepresentative?: Record<string, unknown>;
    executives?: Record<string, unknown>;
  }) {
    return {
      organization: {
        code: overrides.code,
        legalName: `Aseguradora ${overrides.code} S.R.L.`,
        tenantType: 'PAYER',
        legalEntityType: 'SRL',
        payer: {
          carrierCode: `CAR_${overrides.code}`,
          sigla: overrides.code.slice(0, 6),
          address: 'Av. Siempre Viva 123',
          regulatorIdentifier: `NIT-${overrides.code}`,
        },
        legalDocuments: overrides.legalDocuments,
        legalRepresentative: overrides.legalRepresentative,
        executives: overrides.executives,
      },
      owner: {
        email: overrides.email,
        password: 'S3cret-passw0rd',
        name: 'Elena',
        lastName: 'Salas',
      },
    };
  }

  async function login(email: string): Promise<string> {
    const res = await http()
      .post('/iam/auth/login')
      .send({ email, password: 'S3cret-passw0rd' })
      .expect(200);
    return res.body.accessToken;
  }

  /** El código del concepto (mayúsculas, castellano) de un uuid del catálogo. */
  async function codigoDe(conceptId: string): Promise<string> {
    const concepto = await ctx.orm.em
      .fork()
      .findOneOrFail(CatalogConcepts, { id: conceptId });
    return concepto.code;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
    await deleteRegisteredOrganizations(creados);

    // Cierra la escalera: sin la entrada de `tenant_legal_representatives` en
    // `TENANT_ESCRIBE_EN` y sin capturar `personIds` antes del bucle
    // (`harness.ts`), las cuatro personas por alta sobrevivirían al borrado
    // del tenant.
    if (creados.length > 0) {
      const marcadoresTenant = creados.map(() => '?').join(', ');
      const vinculosRestantes = await ctx.orm.em
        .getConnection()
        .execute<Array<{ count: string }>>(
          `select count(*)::text as count from directory.tenant_legal_representatives where tenant_id in (${marcadoresTenant})`,
          creados.map((c) => c.tenantId),
        );
      expect(vinculosRestantes[0]?.count).toBe('0');
    }
    if (personIdsCreados.length > 0) {
      const marcadoresPersona = personIdsCreados.map(() => '?').join(', ');
      const personasRestantes = await ctx.orm.em
        .getConnection()
        .execute<Array<{ count: string }>>(
          `select count(*)::text as count from profiles.persons where id in (${marcadoresPersona})`,
          personIdsCreados,
        );
      expect(personasRestantes[0]?.count).toBe('0');
    }
  });

  it('escenario 1 · alta con representante y las tres gerencias: 4 vínculos, is_primary sólo en el representante', async () => {
    const codigo = `REP1_${marca}`;
    const legalDocuments = await subirLosCincoDocumentos();
    const powerOfAttorneyFileId = await subirPdf('poder.pdf');

    const res = await http()
      .post('/iam/auth/register-organization')
      .send(
        altaDto({
          code: codigo,
          email: `rep1-${marca}@example.test`,
          legalDocuments,
          legalRepresentative: {
            fullName: 'Mariana Siles Justiniano',
            idNumber: '4872190 SC',
            email: 'legal@aseguradora.com',
            powerOfAttorneyFileId,
          },
          executives: {
            generalManager: gerencia(
              'Carlos Mendoza',
              '+591 70000001',
              'gm@aseguradora.com',
            ),
            commercialManager: gerencia(
              'Ana Paz',
              '+591 70000002',
              'cm@aseguradora.com',
            ),
            marketingManager: gerencia(
              'Luis Rojas',
              '+591 70000003',
              'mm@aseguradora.com',
            ),
          },
        }),
      )
      .expect(201);

    creados.push({ userId: res.body.ownerUserId, tenantId: res.body.tenantId });
    expect(res.body.representativesRegistered).toBe(4);

    const em = ctx.orm.em.fork();
    const vinculos = await em.find(TenantLegalRepresentatives, {
      tenantId: res.body.tenantId,
    });
    expect(vinculos).toHaveLength(4);
    personIdsCreados.push(...vinculos.map((v) => v.personId));

    const roles = new Map<string, (typeof vinculos)[number]>();
    for (const vinculo of vinculos) {
      roles.set(await codigoDe(vinculo.representativeRoleConceptId), vinculo);
    }
    expect([...roles.keys()].sort()).toEqual(
      [
        'GERENTE_COMERCIAL',
        'GERENTE_GENERAL',
        'GERENTE_MARKETING',
        'REPRESENTANTE_LEGAL',
      ].sort(),
    );

    const representante = roles.get('REPRESENTANTE_LEGAL');
    expect(representante?.isPrimary).toBe(true);
    expect(representante?.ciIdentifierId).not.toBeNull();
    expect(representante?.powerOfAttorneyDocumentId).not.toBeNull();

    for (const rol of [
      'GERENTE_GENERAL',
      'GERENTE_COMERCIAL',
      'GERENTE_MARKETING',
    ]) {
      const gerente = roles.get(rol);
      // `null`, no `undefined`: así hidrata MikroORM una columna nullable sin
      // valor (no se declaró al crear la fila). Es justo lo que se quiere:
      // la UK `(tenant_id, is_primary)` no es parcial y un `false` repetido
      // la violaría igual que un `true` repetido.
      expect(gerente?.isPrimary).toBeNull();
    }
  });

  it('escenario 2 · las cuatro personas, en partes, su CI y sus contactos vigentes', async () => {
    const codigo = `REP2_${marca}`;
    const powerOfAttorneyFileId = await subirPdf('poder.pdf');

    // Este es el escenario que manda el nombre EN PARTES (no `fullName`): el
    // representante lleva `middleName` para fijar que el plegado de un
    // tercer nombre en `middleName` —ya resuelto del lado del cliente— llega
    // intacto a `profiles.persons.middle_name`.
    const res = await http()
      .post('/iam/auth/register-organization')
      .send(
        altaDto({
          code: codigo,
          email: `rep2-${marca}@example.test`,
          legalRepresentative: {
            name: 'Mariana',
            middleName: 'Elena Sofía',
            lastName: 'Siles',
            motherLastName: 'Justiniano',
            idNumber: '4872190 SC',
            email: 'legal@aseguradora.com',
            powerOfAttorneyFileId,
          },
          executives: {
            generalManager: {
              name: 'Carlos',
              lastName: 'Mendoza',
              phone: '+591 70000001',
              email: 'gm@aseguradora.com',
            },
            commercialManager: {
              name: 'Ana',
              lastName: 'Paz',
              phone: '+591 70000002',
              email: 'cm@aseguradora.com',
            },
            marketingManager: {
              name: 'Luis',
              lastName: 'Rojas',
              phone: '+591 70000003',
              email: 'mm@aseguradora.com',
            },
          },
        }),
      )
      .expect(201);

    creados.push({ userId: res.body.ownerUserId, tenantId: res.body.tenantId });

    const em = ctx.orm.em.fork();
    const vinculos = await em.find(TenantLegalRepresentatives, {
      tenantId: res.body.tenantId,
    });
    personIdsCreados.push(...vinculos.map((v) => v.personId));

    const personas = await em.find(Persons, {
      id: { $in: vinculos.map((v) => v.personId) },
    });
    // `display_name` lo compone la API a partir de las partes —el cliente ya
    // no manda un nombre completo—, así que sigue siendo el mismo valor que
    // antes de esta subtarea.
    const nombres = new Set(personas.map((p) => p.displayName));
    expect(nombres).toEqual(
      new Set([
        'Mariana Elena Sofía Siles Justiniano',
        'Carlos Mendoza',
        'Ana Paz',
        'Luis Rojas',
      ]),
    );

    const representantePersona = personas.find(
      (p) => p.displayName === 'Mariana Elena Sofía Siles Justiniano',
    );
    expect(representantePersona).toMatchObject({
      name: 'Mariana',
      middleName: 'Elena Sofía',
      lastName: 'Siles',
      motherLastName: 'Justiniano',
    });
    const gerenteGeneral = personas.find(
      (p) => p.displayName === 'Carlos Mendoza',
    );
    expect(gerenteGeneral).toMatchObject({
      name: 'Carlos',
      lastName: 'Mendoza',
      motherLastName: null,
    });

    const representante = vinculos.find(
      (v) => v.ciIdentifierId !== undefined && v.ciIdentifierId !== null,
    );
    const identificador = await em.findOneOrFail(Identifiers, {
      id: representante!.ciIdentifierId!,
    });
    expect(identificador.value).toBe('4872190 SC');
    expect(identificador.ownerTypeConceptId).toBe(CONCEPTS.OWNER_PERSON);
    expect(await codigoDe(identificador.typeConceptId)).toBe('NATIONAL_ID');

    const contactos = await em.find(ContactPoints, {
      ownerId: { $in: vinculos.map((v) => v.personId) },
    });
    const correos = new Set(
      contactos
        .filter((c) => c.systemConceptId === CONCEPTS.CONTACT_EMAIL)
        .map((c) => c.value),
    );
    expect(correos).toEqual(
      new Set([
        'legal@aseguradora.com',
        'gm@aseguradora.com',
        'cm@aseguradora.com',
        'mm@aseguradora.com',
      ]),
    );
    const celulares = new Set(
      contactos
        .filter((c) => c.systemConceptId === CONCEPTS.CONTACT_MOBILE)
        .map((c) => c.value),
    );
    expect(celulares).toEqual(
      new Set(['+591 70000001', '+591 70000002', '+591 70000003']),
    );
    for (const contacto of contactos) {
      expect(contacto.ownerTypeConceptId).toBe(CONCEPTS.OWNER_PERSON);
      expect(contacto.useConceptId).toBe(CONCEPTS.CONTACT_USE_WORK);
    }
  });

  it('escenario 2b · con fullName (forma legada), las partes quedan NULL y display_name es el compuesto tal cual', async () => {
    const codigo = `REP2B_${marca}`;
    const powerOfAttorneyFileId = await subirPdf('poder.pdf');

    const res = await http()
      .post('/iam/auth/register-organization')
      .send(
        altaDto({
          code: codigo,
          email: `rep2b-${marca}@example.test`,
          legalRepresentative: {
            fullName: 'Lic. Mariana Siles Justiniano',
            idNumber: '4872190 SC',
            email: 'legal@aseguradora.com',
            powerOfAttorneyFileId,
          },
        }),
      )
      .expect(201);

    creados.push({ userId: res.body.ownerUserId, tenantId: res.body.tenantId });

    const em = ctx.orm.em.fork();
    const vinculos = await em.find(TenantLegalRepresentatives, {
      tenantId: res.body.tenantId,
    });
    personIdsCreados.push(...vinculos.map((v) => v.personId));

    const persona = await em.findOneOrFail(Persons, {
      id: vinculos[0]!.personId,
    });
    // Sin partes que adivinar: `fullName` manda tal cual, exactamente como
    // antes de esta subtarea.
    expect(persona.displayName).toBe('Lic. Mariana Siles Justiniano');
    expect(persona.name).toBeNull();
    expect(persona.middleName).toBeNull();
    expect(persona.lastName).toBeNull();
    expect(persona.motherLastName).toBeNull();
  });

  it('escenario 3 · el documento del poder: PODER_REPRESENTANTE_LEGAL, NOTARIA, PENDIENTE y de quién es', async () => {
    const codigo = `REP3_${marca}`;
    const powerOfAttorneyFileId = await subirPdf('poder.pdf');

    const res = await http()
      .post('/iam/auth/register-organization')
      .send(
        altaDto({
          code: codigo,
          email: `rep3-${marca}@example.test`,
          legalRepresentative: {
            fullName: 'Mariana Siles',
            idNumber: '4872190 SC',
            email: 'legal@aseguradora.com',
            powerOfAttorneyFileId,
          },
        }),
      )
      .expect(201);

    creados.push({ userId: res.body.ownerUserId, tenantId: res.body.tenantId });

    const em = ctx.orm.em.fork();
    const [representante] = await em.find(TenantLegalRepresentatives, {
      tenantId: res.body.tenantId,
    });
    personIdsCreados.push(representante.personId);

    const [documento] = await ctx.orm.em.getConnection().execute<
      Array<{
        document_type_concept_id: string;
        issuing_authority_concept_id: string;
        verification_status_concept_id: string;
        related_person_id: string;
        file_id: string;
      }>
    >(
      `select document_type_concept_id, issuing_authority_concept_id,
                verification_status_concept_id, related_person_id, file_id
           from directory.tenant_affiliation_documents
          where id = ?`,
      [representante.powerOfAttorneyDocumentId],
    );

    expect(documento).toBeDefined();
    expect(await codigoDe(documento.document_type_concept_id)).toBe(
      'PODER_REPRESENTANTE_LEGAL',
    );
    expect(await codigoDe(documento.issuing_authority_concept_id)).toBe(
      'NOTARIA',
    );
    expect(await codigoDe(documento.verification_status_concept_id)).toBe(
      'PENDIENTE',
    );
    expect(documento.related_person_id).toBe(representante.personId);
    expect(documento.file_id).toBe(powerOfAttorneyFileId);

    const [archivo] = await ctx.orm.em
      .getConnection()
      .execute<Array<{ tenant_id: string }>>(
        `select tenant_id from common.files where id = ?`,
        [powerOfAttorneyFileId],
      );
    expect(archivo.tenant_id).toBe(res.body.tenantId);
  });

  it('escenario 4 · el mismo archivo como poder y como constitución es 422, sin tenant nuevo', async () => {
    const codigo = `REP4_${marca}`;
    const legalDocuments = await subirLosCincoDocumentos();

    const res = await http()
      .post('/iam/auth/register-organization')
      .send(
        altaDto({
          code: codigo,
          email: `rep4-${marca}@example.test`,
          legalDocuments,
          legalRepresentative: {
            fullName: 'Mariana Siles',
            idNumber: '4872190 SC',
            email: 'legal@aseguradora.com',
            // Repite el archivo de la escritura de constitución.
            powerOfAttorneyFileId: legalDocuments.constitutionFileId,
          },
        }),
      )
      .expect(422);

    expect(res.body.code).toBe('PRECONDITION_FAILED');

    const em = ctx.orm.em.fork();
    const tenant = await em
      .getConnection()
      .execute(`select id from directory.tenants where code = ?`, [codigo]);
    expect(tenant).toHaveLength(0);
  });

  it('escenario 5 · un powerOfAttorneyFileId inexistente es 422 y no crea nada', async () => {
    const codigo = `REP5_${marca}`;

    const res = await http()
      .post('/iam/auth/register-organization')
      .send(
        altaDto({
          code: codigo,
          email: `rep5-${marca}@example.test`,
          legalRepresentative: {
            fullName: 'Mariana Siles',
            idNumber: '4872190 SC',
            email: 'legal@aseguradora.com',
            powerOfAttorneyFileId: randomUUID(),
          },
        }),
      )
      .expect(422);

    expect(res.body.code).toBe('PRECONDITION_FAILED');
  });

  it('escenario 6 · un correo inválido en una gerencia es 400, nombrando la ruta exacta', async () => {
    const codigo = `REP6_${marca}`;

    const res = await http()
      .post('/iam/auth/register-organization')
      .send(
        altaDto({
          code: codigo,
          email: `rep6-${marca}@example.test`,
          executives: {
            generalManager: gerencia(
              'Carlos Mendoza',
              '+591 70000001',
              'gm@aseguradora.com',
            ),
            commercialManager: gerencia(
              'Ana Paz',
              '+591 70000002',
              'cm@aseguradora.com',
            ),
            marketingManager: gerencia(
              'Luis Rojas',
              '+591 70000003',
              'mm.arroba.invalido',
            ),
          },
        }),
      )
      .expect(400);

    expect(JSON.stringify(res.body)).toContain(
      'organization.executives.marketingManager.email',
    );
  });

  it('escenario 6b · el bloque `executives` sin una gerencia es 400 nombrándola', async () => {
    const codigo = `REP6B_${marca}`;

    const res = await http()
      .post('/iam/auth/register-organization')
      .send(
        altaDto({
          code: codigo,
          email: `rep6b-${marca}@example.test`,
          executives: {
            generalManager: gerencia(
              'Carlos Mendoza',
              '+591 70000001',
              'gm@aseguradora.com',
            ),
            commercialManager: gerencia(
              'Ana Paz',
              '+591 70000002',
              'cm@aseguradora.com',
            ),
            // Falta marketingManager.
          },
        }),
      )
      .expect(400);

    expect(JSON.stringify(res.body)).toContain(
      'organization.executives.marketingManager',
    );
  });

  it('escenario 7 · sin representante ni gerencias, el alta sigue 201 y sin filas', async () => {
    const codigo = `REP7_${marca}`;

    const res = await http()
      .post('/iam/auth/register-organization')
      .send(altaDto({ code: codigo, email: `rep7-${marca}@example.test` }))
      .expect(201);

    creados.push({ userId: res.body.ownerUserId, tenantId: res.body.tenantId });
    expect(res.body.representativesRegistered).toBeUndefined();

    const em = ctx.orm.em.fork();
    const vinculos = await em.find(TenantLegalRepresentatives, {
      tenantId: res.body.tenantId,
    });
    expect(vinculos).toHaveLength(0);
  });

  it('escenario 8 · GET /tenants/me devuelve el representante y las gerencias en orden canónico', async () => {
    const codigo = `REP8_${marca}`;
    const email = `rep8-${marca}@example.test`;
    const powerOfAttorneyFileId = await subirPdf('poder.pdf');

    const res = await http()
      .post('/iam/auth/register-organization')
      .send(
        altaDto({
          code: codigo,
          email,
          // El representante manda las partes (verifica que GET /tenants/me
          // también las lea de vuelta); las gerencias siguen con `fullName`
          // (forma legada), a propósito: la lectura convive con las dos.
          legalRepresentative: {
            name: 'Mariana',
            middleName: 'Elena Sofía',
            lastName: 'Siles',
            motherLastName: 'Justiniano',
            idNumber: '4872190 SC',
            email: 'legal@aseguradora.com',
            powerOfAttorneyFileId,
          },
          executives: {
            generalManager: gerencia(
              'Carlos Mendoza',
              '+591 70000001',
              'gm@aseguradora.com',
            ),
            commercialManager: gerencia(
              'Ana Paz',
              '+591 70000002',
              'cm@aseguradora.com',
            ),
            marketingManager: gerencia(
              'Luis Rojas',
              '+591 70000003',
              'mm@aseguradora.com',
            ),
          },
        }),
      )
      .expect(201);

    creados.push({ userId: res.body.ownerUserId, tenantId: res.body.tenantId });
    const em = ctx.orm.em.fork();
    const vinculos = await em.find(TenantLegalRepresentatives, {
      tenantId: res.body.tenantId,
    });
    personIdsCreados.push(...vinculos.map((v) => v.personId));

    const token = await login(email);
    const misOrganizaciones = await http()
      .get('/tenants/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const organizacion = misOrganizaciones.body.items.find(
      (item: { id: string }) => item.id === res.body.tenantId,
    );
    expect(organizacion?.legalRepresentative).toMatchObject({
      role: 'LEGAL_REPRESENTATIVE',
      fullName: 'Mariana Elena Sofía Siles Justiniano',
      name: 'Mariana',
      middleName: 'Elena Sofía',
      lastName: 'Siles',
      motherLastName: 'Justiniano',
      email: 'legal@aseguradora.com',
      idNumber: '4872190 SC',
    });
    // Las gerencias mandaron `fullName` (forma legada): sin partes que leer.
    expect(organizacion?.executives[0].name).toBeUndefined();
    expect(organizacion?.executives).toHaveLength(3);
    expect(organizacion?.executives[2]).toMatchObject({
      role: 'MARKETING_MANAGER',
      fullName: 'Luis Rojas',
      phone: '+591 70000003',
    });
  });
});
