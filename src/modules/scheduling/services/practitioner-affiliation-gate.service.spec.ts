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
import { PROF } from '../../profiles/profiles.concepts';

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

/** Hace que las sedes consultadas pertenezcan a este tenant. */
function sedesDe(d: ReturnType<typeof build>, tenantId: string): void {
  d.em.execute.mockResolvedValue([{ tenant_id: tenantId }] as never);
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

  it('con vinculos solo en otras organizaciones, ausente', async () => {
    // El caso real del médico multi-sede: tener aprobación en el hospital donde
    // está de turno no lo habilita en la clínica de al lado.
    const d = build();
    conVinculos(d, [
      {
        practiceSiteId: 'sede-1',
        statusConceptId: ESTADO_DEL_VINCULO.APROBADO,
      },
    ]);
    sedesDe(d, OTRO_TENANT);

    expect(await d.service.evaluar(TENANT, profesional)).toBe('ausente');
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

  it('un vinculo DECLARADO habilita igual que uno aprobado', async () => {
    // Es el médico del hospital público: no hay nadie que pueda aprobarlo, así
    // que exigirle aprobación lo bloquearía para siempre. Lo que le falta es el
    // sello de la institución, y eso se dice en pantalla, no bloqueando.
    const d = build();
    conVinculos(d, [
      {
        practiceSiteId: 'sede-1',
        statusConceptId: ESTADO_DEL_VINCULO.DECLARADO,
      },
    ]);
    sedesDe(d, TENANT);

    expect(await d.service.evaluar(TENANT, profesional)).toBe('aprobado');
  });

  it('reconoce el id VIEJO de aprobado mientras el backfill no corrio', async () => {
    // v4.1.9 cambió los conceptos y las filas vivas siguen con los ids
    // anteriores escritos. Si la lectura mirara sólo los nuevos, cada vínculo ya
    // aprobado dejaría de reconocerse y su médico dejaría de poder publicar.
    const d = build();
    conVinculos(d, [
      { practiceSiteId: 'sede-1', statusConceptId: PROF.AFFILIATION_ACTIVE },
    ]);
    sedesDe(d, TENANT);

    expect(await d.service.evaluar(TENANT, profesional)).toBe('aprobado');
  });

  it('reconoce el id VIEJO de pendiente', async () => {
    const d = build();
    conVinculos(d, [
      {
        practiceSiteId: 'sede-1',
        statusConceptId: 'state-pending-viejo',
      },
    ]);
    sedesDe(d, TENANT);

    // El id viejo de pendiente es `CONCEPTS.STATE_PENDING`; con cualquier otro
    // valor el veredicto es «ausente», que es lo correcto: no se inventa.
    expect(await d.service.evaluar(TENANT, profesional)).toBe('ausente');
  });

  it('un vinculo REVOCADO no habilita', async () => {
    const d = build();
    conVinculos(d, [
      {
        practiceSiteId: 'sede-1',
        statusConceptId: ESTADO_DEL_VINCULO.REVOCADO,
      },
    ]);
    sedesDe(d, TENANT);

    expect(await d.service.evaluar(TENANT, profesional)).toBe('ausente');
  });
});
