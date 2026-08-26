import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PractitionerAffiliationGateService } from './practitioner-affiliation-gate.service';
import { ESTADO_DEL_VINCULO } from '../../profiles/services/profiles-affiliations.service';

const TENANT = '11111111-1111-1111-1111-111111111111';
const OTRO_TENANT = '22222222-2222-2222-2222-222222222222';
const HPID = '33333333-3333-3333-3333-333333333333';

/** El profesional de la sesión. */
const profesional = { id: 'user-1', practitionerProfileId: HPID } as any;

/**
 * Arma el servicio con un `EntityManager` doble.
 *
 * @returns El servicio y el doble, para programar y observar.
 */
function build() {
  const em = {
    find: mockFn(async () => []),
    execute: mockFn(async () => []),
  };
  const service = new PractitionerAffiliationGateService(em as any);
  return { service, em };
}

/** Deja al profesional con los vínculos indicados. */
function conVinculos(
  d: ReturnType<typeof build>,
  vinculos: { practiceSiteId: string | null; statusConceptId: string }[],
): void {
  d.em.find.mockResolvedValue(
    vinculos.map((v) => ({ ...v, organizationName: 'Hospital' })) as never,
  );
}

/** Hace que todas las sedes consultadas pertenezcan a este tenant. */
function sedesDe(d: ReturnType<typeof build>, tenantId: string): void {
  d.em.execute.mockImplementation(async (_sql: string, params: any[]) =>
    (params[0] as string[]).map((sede) => ({
      site_id: sede,
      tenant_id: tenantId,
    })),
  );
}

/** Reparte las sedes entre organizaciones, sede por sede. */
function sedesRepartidas(
  d: ReturnType<typeof build>,
  porSede: Record<string, string>,
): void {
  d.em.execute.mockImplementation(async (_sql: string, params: any[]) =>
    (params[0] as string[])
      .filter((sede) => porSede[sede] !== undefined)
      .map((sede) => ({ site_id: sede, tenant_id: porSede[sede] })),
  );
}

describe('PractitionerAffiliationGateService', () => {
  it('sin perfil profesional no hay vinculo que evaluar', async () => {
    // Quien no es profesional llega acá por otra puerta (un admin operando la
    // agenda de la organización); la regla no le aplica.
    const d = build();

    const veredicto = await d.service.evaluar(TENANT, {
      id: 'user-admin',
    } as any);

    expect(veredicto).toBe('sin-vinculos');
    expect(d.em.find).not.toHaveBeenCalled();
  });

  it('sin ninguna afiliacion registrada devuelve sin-vinculos', async () => {
    // El consultorio propio nunca pidió permiso a nadie, y el médico recién
    // llegado todavía no pertenece a ninguna institución.
    const d = build();

    expect(await d.service.evaluar(TENANT, profesional)).toBe('sin-vinculos');
  });

  it('vinculos de solo texto libre no dicen nada de ningun tenant', async () => {
    // Hoy la afiliación se pide escribiendo el nombre del hospital a mano:
    // `practice_site_id` es nulo en TODAS las de la base viva. Tomar uno de
    // ésos como negativa dejaría al médico sin publicar ni en su propio
    // consultorio, castigándolo por haber declarado dónde trabaja.
    const d = build();
    conVinculos(d, [
      { practiceSiteId: null, statusConceptId: ESTADO_DEL_VINCULO.APROBADO },
      { practiceSiteId: null, statusConceptId: ESTADO_DEL_VINCULO.PENDIENTE },
    ]);

    expect(await d.service.evaluar(TENANT, profesional)).toBe('sin-vinculos');
    expect(d.em.execute).not.toHaveBeenCalled();
  });

  it('con vinculo aprobado a una sede de esa organizacion, aprobado', async () => {
    const d = build();
    conVinculos(d, [
      {
        practiceSiteId: 'sede-1',
        statusConceptId: ESTADO_DEL_VINCULO.APROBADO,
      },
    ]);
    sedesDe(d, TENANT);

    expect(await d.service.evaluar(TENANT, profesional)).toBe('aprobado');
  });

  it('con el vinculo todavia sin responder, pendiente', async () => {
    const d = build();
    conVinculos(d, [
      {
        practiceSiteId: 'sede-1',
        statusConceptId: ESTADO_DEL_VINCULO.PENDIENTE,
      },
    ]);
    sedesDe(d, TENANT);

    expect(await d.service.evaluar(TENANT, profesional)).toBe('pendiente');
  });

  /**
   * Antes esto daba `ausente`, y era el defecto: el veredicto miraba si el
   * profesional tenía vínculos **en general**, no si tenía uno con ESTA
   * organización. En cuanto una institución le aprobaba el suyo, su propio
   * consultorio —donde no hay vínculo que pedir— pasaba a leerse como una
   * organización más de la que faltaba el vínculo, y el médico dejaba de poder
   * publicar ahí. Tener una aprobación en otro lado lo dejaba peor que no tener
   * ninguna.
   *
   * Lo que la regla protege sigue protegido: para bloquear una organización
   * hace falta un vínculo suyo sin aprobar, y eso lo cubren los dos casos de
   * abajo.
   */
  it('un vinculo en otra organizacion no dice nada de esta', async () => {
    const d = build();
    conVinculos(d, [
      {
        practiceSiteId: 'sede-1',
        statusConceptId: ESTADO_DEL_VINCULO.APROBADO,
      },
    ]);
    sedesDe(d, OTRO_TENANT);

    expect(await d.service.evaluar(TENANT, profesional)).toBe('sin-vinculos');
  });

  /**
   * El caso multi-sede completo, que es el que motivó todo esto: aprobado en la
   * institución y, con el mismo perfil, dueño de su consultorio. Las dos
   * respuestas tienen que dejarlo trabajar.
   */
  it('aprobado en la institucion y libre en su propio consultorio', async () => {
    const d = build();
    conVinculos(d, [
      {
        practiceSiteId: 'sede-caja',
        statusConceptId: ESTADO_DEL_VINCULO.APROBADO,
      },
    ]);
    sedesRepartidas(d, { 'sede-caja': OTRO_TENANT });

    expect(await d.service.evaluar(OTRO_TENANT, profesional)).toBe('aprobado');
    expect(await d.service.evaluar(TENANT, profesional)).toBe('sin-vinculos');
  });

  /**
   * Y el reverso: un vínculo pendiente en la institución no se diluye porque el
   * profesional tenga otros aprobados en otras partes.
   */
  it('el pendiente de esta organizacion no lo tapan los aprobados de otras', async () => {
    const d = build();
    conVinculos(d, [
      {
        practiceSiteId: 'sede-otra',
        statusConceptId: ESTADO_DEL_VINCULO.APROBADO,
      },
      {
        practiceSiteId: 'sede-esta',
        statusConceptId: ESTADO_DEL_VINCULO.PENDIENTE,
      },
    ]);
    sedesRepartidas(d, {
      'sede-otra': OTRO_TENANT,
      'sede-esta': TENANT,
    });

    expect(await d.service.evaluar(TENANT, profesional)).toBe('pendiente');
  });

  it('el vinculo aprobado gana sobre el pendiente de la misma organizacion', async () => {
    // Un médico puede haber pedido dos sedes de la misma organización y tener
    // una aprobada: lo que decide es la que ya le dijeron que sí.
    const d = build();
    conVinculos(d, [
      {
        practiceSiteId: 'sede-1',
        statusConceptId: ESTADO_DEL_VINCULO.PENDIENTE,
      },
      {
        practiceSiteId: 'sede-2',
        statusConceptId: ESTADO_DEL_VINCULO.APROBADO,
      },
    ]);
    sedesDe(d, TENANT);

    expect(await d.service.evaluar(TENANT, profesional)).toBe('aprobado');
  });

  it('un vinculo rechazado no habilita ni figura como pendiente', async () => {
    const d = build();
    conVinculos(d, [
      {
        practiceSiteId: 'sede-1',
        statusConceptId: ESTADO_DEL_VINCULO.RECHAZADO,
      },
    ]);
    sedesDe(d, TENANT);

    expect(await d.service.evaluar(TENANT, profesional)).toBe('ausente');
  });

  it('resuelve las sedes en una sola consulta, no una por sede', async () => {
    // Un médico con agenda en cinco hospitales haría cinco viajes a la base en
    // cada publicación.
    const d = build();
    conVinculos(d, [
      {
        practiceSiteId: 'sede-1',
        statusConceptId: ESTADO_DEL_VINCULO.APROBADO,
      },
      {
        practiceSiteId: 'sede-2',
        statusConceptId: ESTADO_DEL_VINCULO.APROBADO,
      },
      {
        practiceSiteId: 'sede-3',
        statusConceptId: ESTADO_DEL_VINCULO.APROBADO,
      },
    ]);
    sedesDe(d, TENANT);

    await d.service.evaluar(TENANT, profesional);

    expect(d.em.execute).toHaveBeenCalledTimes(1);
    expect(d.em.execute.mock.calls[0][1]).toEqual([
      ['sede-1', 'sede-2', 'sede-3'],
    ]);
  });

  /**
   * Quién administra una sede lo dice `managing_tenant_id`, que es la columna
   * que mira la aprobación del vínculo. Si acá se preguntara sólo por el tenant
   * de la práctica, una sede administrada por otra organización daría un
   * veredicto distinto del que dio la aprobación: aprobada allá, ausente acá.
   */
  it('la sede la manda quien la administra, no la práctica que la contiene', async () => {
    const d = build();
    conVinculos(d, [
      {
        practiceSiteId: 'sede-1',
        statusConceptId: ESTADO_DEL_VINCULO.APROBADO,
      },
    ]);
    sedesDe(d, TENANT);

    const veredicto = await d.service.evaluar(TENANT, profesional);

    expect(veredicto).toBe('aprobado');
    const [sql] = d.em.execute.mock.calls[0];
    expect(sql).toContain('COALESCE(s.managing_tenant_id, p.tenant_id)');
  });

  /**
   * El puente devuelve el par completo: sin el id de la sede no se puede saber
   * de cuál organización es cada vínculo, que es justamente lo que la regla
   * pregunta.
   */
  it('el puente dice a que organizacion pertenece cada sede', async () => {
    const d = build();
    conVinculos(d, [
      {
        practiceSiteId: 'sede-1',
        statusConceptId: ESTADO_DEL_VINCULO.APROBADO,
      },
    ]);
    sedesDe(d, TENANT);

    await d.service.evaluar(TENANT, profesional);

    const [sql] = d.em.execute.mock.calls[0];
    expect(sql).toContain('s.id AS site_id');
  });
});
