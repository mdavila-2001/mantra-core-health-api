import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DiagnosticOrdersRepository } from './diagnostic-orders.repository';
import { DUNIT } from '../../diagnostic_units/diagnostic_units.concepts';

/**
 * La consulta que decide qué preparación ve el paciente.
 *
 * Se prueba en el repositorio y no en el servicio porque **el filtro vive en el
 * `where`**: el servicio sólo consume lo que esta consulta devuelva, así que un
 * test allá arriba pasaría igual con el filtro puesto o quitado.
 *
 * Las dos cosas que fija:
 *
 * 1. **Sólo ofertas activas.** Un borrador tiene el texto a medias y una
 *    retirada suele estarlo porque el protocolo cambió: mostrar el «ayuno de 12
 *    horas» de una oferta retirada cuando pasó a 8 es dar una indicación
 *    clínica vencida a alguien que va a seguirla.
 * 2. **Orden explícito.** Sin `ORDER BY`, Postgres no garantiza orden y el
 *    servicio —que se queda con la primera fila— podría devolver textos
 *    distintos entre dos peticiones idénticas.
 */
describe('DiagnosticOrdersRepository · findPreparationByStudyConcepts', () => {
  const CONCEPT = 'concept-hemograma';

  function build() {
    const em = { find: mockFn().mockResolvedValue([]) };
    return { repo: new DiagnosticOrdersRepository(), em };
  }

  it('sólo pide ofertas ACTIVAS: un borrador o una retirada no dictan la preparación', async () => {
    const { repo, em } = build();

    await repo.findPreparationByStudyConcepts(em as any, [CONCEPT]);

    const [, where] = em.find.mock.calls[0];
    expect(where.statusConceptId).toBe(DUNIT.OFFERING_ACTIVE);
  });

  it('ordena explícitamente, para que «la primera» sea siempre la misma', async () => {
    const { repo, em } = build();

    await repo.findPreparationByStudyConcepts(em as any, [CONCEPT]);

    const [, , options] = em.find.mock.calls[0];
    expect(options?.orderBy).toBeDefined();
  });

  it('sigue exigiendo que haya texto', async () => {
    const { repo, em } = build();

    await repo.findPreparationByStudyConcepts(em as any, [CONCEPT]);

    const [, where] = em.find.mock.calls[0];
    expect(where.preparationInstructions).toEqual({ $ne: null });
  });

  it('sin conceptos no consulta la base', async () => {
    const { repo, em } = build();

    const output = await repo.findPreparationByStudyConcepts(em as any, []);

    expect(output).toEqual([]);
    expect(em.find).not.toHaveBeenCalled();
  });
});
