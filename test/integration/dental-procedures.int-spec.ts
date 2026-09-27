import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { SEED } from '../../src/common';
import { PERIOP } from '../../src/modules/procedures_perioperative/procedures_perioperative.concepts';

/**
 * Histórico odontológico de punta a punta (punto 7 del reclamo).
 *
 * Es la prueba que sostiene la decisión de diseño del carril: **odontología no
 * necesitó tabla nueva**. Se registra como procedimiento clínico con categoría
 * odontológica y la pieza va a `procedure_body_sites`, dos tablas que ya
 * existían. Si esa lectura del modelo fuera equivocada, este archivo falla en el
 * primer `POST` —contra el esquema real, no contra un doble.
 *
 * Cada caso **escribe y vuelve a leer**, que es la regla que este repositorio le
 * exige a cualquier alta: un formulario cuyo resultado no se puede consultar es
 * un formulario que se traga el dato, y ya pasó una vez.
 */
describe('Histórico odontológico (integración)', () => {
  let ctx: TestContext;
  /** Sufijo único: la suite corre contra una base con datos de otras corridas. */
  const u = Date.now();

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  const http = () => request(ctx.app.getHttpServer());
  // Las rutas de `dental-procedures` exigen el tenant del contexto (TENANT_REQUIRED).
  const auth = () => ({
    ...bearer(ctx.adminToken),
    'X-Tenant-Id': SEED.tenantId,
  });

  /** Da de alta un paciente y devuelve su `profileId`. */
  async function createPatient(suffix: string): Promise<string> {
    const res = await http()
      .post('/profiles/patients')
      .set(auth())
      .send({
        patientCode: `ODO-${u}-${suffix}`,
        displayName: `Paciente ${suffix}`,
        birthDate: '1990-05-14',
      })
      .expect(201);
    return res.body.profileId as string;
  }

  describe('el catálogo', () => {
    /**
     * Sin catálogo la pantalla de alta no tiene forma honesta de llenar sus
     * selectores: los identificadores son UUID derivados del seed y llevarlos
     * escritos a mano en el frontend los desincroniza el día que se agregue uno.
     */
    it('sirve códigos, las 32 piezas y los cuatro cuadrantes', async () => {
      const res = await http()
        .get('/dental-procedures/catalog')
        .set(auth())
        .expect(200);

      expect(res.body.teeth).toHaveLength(32);
      expect(res.body.quadrants).toHaveLength(4);
      expect(res.body.procedureCodes.length).toBeGreaterThan(0);
      expect(res.body.teeth[0]).toMatchObject({ code: 'FDI_11' });
    });

    /**
     * El catálogo lo sirve el seed; los conceptos tienen que estar **en la
     * base**, porque `clinical.procedures.code_concept_id` es una clave foránea
     * contra `terminology.catalog_concepts`. Si el seed no los materializó, el
     * alta de más abajo moriría con un 23503 y no con un error de negocio.
     */
    it('los conceptos que sirve están sembrados de verdad', async () => {
      const res = await http()
        .get('/dental-procedures/catalog')
        .set(auth())
        .expect(200);

      const ids = res.body.teeth.map((t: { conceptId: string }) => t.conceptId);
      expect(ids).toContain(PERIOP.TOOTH_36);
    });
  });

  describe('el ciclo completo: registrar y volver a ver', () => {
    it('un tratamiento con pieza aparece en el histórico de la persona', async () => {
      const patientProfileId = await createPatient('ciclo');
      const catalogo = await http()
        .get('/dental-procedures/catalog')
        .set(auth())
        .expect(200);
      const codigo = catalogo.body.procedureCodes[0].conceptId as string;

      const alta = await http()
        .post('/dental-procedures')
        .set(auth())
        .send({
          patientProfileId,
          procedureCodeConceptId: codigo,
          toothSiteConceptId: PERIOP.TOOTH_36,
          siteDetail: 'Cara oclusal',
          noteText: 'Restauración con composite.',
          performedAt: '2026-08-10T14:00:00.000Z',
        })
        .expect(201);

      expect(alta.body.id).toBeDefined();

      const historico = await http()
        .get(`/dental-procedures?patientProfileId=${patientProfileId}`)
        .set(auth())
        .expect(200);

      expect(historico.body.total).toBe(1);
      const [item] = historico.body.items;
      expect(item.id).toBe(alta.body.id);
      expect(item.procedureCodeConceptId).toBe(codigo);
      expect(item.noteText).toBe('Restauración con composite.');
      // La pieza es lo que distingue un histórico odontológico de una lista de
      // procedimientos cualquiera: si no vuelve, el punto no está cerrado.
      expect(item.sites).toHaveLength(1);
      expect(item.sites[0].bodySiteConceptId).toBe(PERIOP.TOOTH_36);
      expect(item.sites[0].description).toBe('Cara oclusal');
    });

    it('un tratamiento sin pieza también se registra y se lee', async () => {
      const patientProfileId = await createPatient('sin-pieza');
      const catalogo = await http()
        .get('/dental-procedures/catalog')
        .set(auth())
        .expect(200);

      await http()
        .post('/dental-procedures')
        .set(auth())
        .send({
          patientProfileId,
          procedureCodeConceptId: catalogo.body.procedureCodes[0].conceptId,
          noteText: 'Control anual.',
        })
        .expect(201);

      const historico = await http()
        .get(`/dental-procedures?patientProfileId=${patientProfileId}`)
        .set(auth())
        .expect(200);

      expect(historico.body.total).toBe(1);
      expect(historico.body.items[0].sites).toEqual([]);
    });

    /** El histórico es de una persona: el de otra no se le puede colar. */
    it('el histórico está acotado al paciente pedido', async () => {
      const unaPersona = await createPatient('propio');
      const otraPersona = await createPatient('ajeno');
      const catalogo = await http()
        .get('/dental-procedures/catalog')
        .set(auth())
        .expect(200);
      const codigo = catalogo.body.procedureCodes[0].conceptId as string;

      await http()
        .post('/dental-procedures')
        .set(auth())
        .send({ patientProfileId: unaPersona, procedureCodeConceptId: codigo })
        .expect(201);

      const historico = await http()
        .get(`/dental-procedures?patientProfileId=${otraPersona}`)
        .set(auth())
        .expect(200);

      expect(historico.body.total).toBe(0);
      expect(historico.body.items).toEqual([]);
    });

    /**
     * El histórico se ordena por cuándo se trató a la persona, no por cuándo se
     * cargó: un tratamiento viejo cargado hoy tiene que caer en su lugar, o el
     * orden deja de significar nada.
     */
    it('ordena por fecha de tratamiento, no por fecha de carga', async () => {
      const patientProfileId = await createPatient('orden');
      const catalogo = await http()
        .get('/dental-procedures/catalog')
        .set(auth())
        .expect(200);
      const codigo = catalogo.body.procedureCodes[0].conceptId as string;

      // Se carga primero el viejo y después el reciente, a propósito.
      await http()
        .post('/dental-procedures')
        .set(auth())
        .send({
          patientProfileId,
          procedureCodeConceptId: codigo,
          noteText: 'El viejo',
          performedAt: '2020-01-01T10:00:00.000Z',
        })
        .expect(201);
      await http()
        .post('/dental-procedures')
        .set(auth())
        .send({
          patientProfileId,
          procedureCodeConceptId: codigo,
          noteText: 'El reciente',
          performedAt: '2026-01-01T10:00:00.000Z',
        })
        .expect(201);

      const historico = await http()
        .get(`/dental-procedures?patientProfileId=${patientProfileId}`)
        .set(auth())
        .expect(200);

      expect(
        historico.body.items.map((i: { noteText: string }) => i.noteText),
      ).toEqual(['El reciente', 'El viejo']);
    });

    /**
     * El total va aparte de la página: un histórico clínico recortado en
     * silencio se lee como «no hay más antecedentes», que es lo contrario de lo
     * que pasó.
     */
    it('el tope recorta la página pero el total sigue diciendo la verdad', async () => {
      const patientProfileId = await createPatient('tope');
      const catalogo = await http()
        .get('/dental-procedures/catalog')
        .set(auth())
        .expect(200);
      const codigo = catalogo.body.procedureCodes[0].conceptId as string;

      for (const nota of ['uno', 'dos', 'tres']) {
        await http()
          .post('/dental-procedures')
          .set(auth())
          .send({
            patientProfileId,
            procedureCodeConceptId: codigo,
            noteText: nota,
          })
          .expect(201);
      }

      const historico = await http()
        .get(`/dental-procedures?patientProfileId=${patientProfileId}&limit=2`)
        .set(auth())
        .expect(200);

      expect(historico.body.items).toHaveLength(2);
      expect(historico.body.total).toBe(3);
    });
  });

  describe('lo que no se acepta', () => {
    /**
     * La clave foránea sólo exige que el concepto exista. Sin la comprobación
     * del servicio, cualquier concepto del catálogo transversal entraría como
     * «pieza tratada» y la base lo aceptaría.
     */
    it('rechaza un concepto que no es pieza ni cuadrante', async () => {
      const patientProfileId = await createPatient('sitio-malo');
      const catalogo = await http()
        .get('/dental-procedures/catalog')
        .set(auth())
        .expect(200);

      await http()
        .post('/dental-procedures')
        .set(auth())
        .send({
          patientProfileId,
          procedureCodeConceptId: catalogo.body.procedureCodes[0].conceptId,
          // Un concepto válido del catálogo, pero que no es un sitio dental.
          toothSiteConceptId: catalogo.body.procedureCodes[0].conceptId,
        })
        .expect(422);
    });

    it('rechaza la cara tratada sin pieza', async () => {
      const patientProfileId = await createPatient('cara-sin-pieza');
      const catalogo = await http()
        .get('/dental-procedures/catalog')
        .set(auth())
        .expect(200);

      await http()
        .post('/dental-procedures')
        .set(auth())
        .send({
          patientProfileId,
          procedureCodeConceptId: catalogo.body.procedureCodes[0].conceptId,
          siteDetail: 'Cara oclusal',
        })
        .expect(422);
    });

    it('rechaza un cuerpo sin paciente', async () => {
      const catalogo = await http()
        .get('/dental-procedures/catalog')
        .set(auth())
        .expect(200);

      await http()
        .post('/dental-procedures')
        .set(auth())
        .send({
          procedureCodeConceptId: catalogo.body.procedureCodes[0].conceptId,
        })
        .expect(400);
    });

    it('el histórico exige decir de quién', async () => {
      await http().get('/dental-procedures').set(auth()).expect(400);
    });
  });
});
