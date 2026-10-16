import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DiagnosticsPatientResultsService } from './diagnostics-patient-results.service';
import { DIAG } from '../diagnostics.concepts';
import { CLIN } from '../../clinical/clinical.concepts';

/**
 * Las órdenes diagnósticas vistas por el paciente — carril J1, tarea 2.
 *
 * Lo que estas pruebas fijan, y por qué cada una duele si se rompe:
 *
 * 1. **La lectura es del portal, no del mostrador.** Va sin `custodianTenantId`:
 *    el estudio que le pidieron en una clínica y el de otra son su lista. Si
 *    alguien le agrega el tenant «para aislar», el paciente deja de ver la mitad
 *    de sus órdenes según con qué organización tenga sesión.
 * 2. **Sólo laboratorio e imagenología.** `service_requests` también guarda
 *    derivaciones e interconsultas, y titular «mis estudios» sobre eso es
 *    mentirle.
 * 3. **Informe existente ≠ resultado visible.** Es la invariante cara: un
 *    informe redactado y no liberado NO es un resultado, y ofrecer «ver
 *    resultado» sobre un borrador es mostrar un diagnóstico que nadie firmó.
 * 4. **La preparación se empareja por concepto** y su ausencia se propaga como
 *    ausencia — no como «no hay que prepararse».
 */

const USER = { id: 'u1' } as any;
const PERSONA = 'per-1';
const PATIENT = 'p1';
const CONCEPT_BLOODCOUNT = 'code-hemograma';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @returns El servicio y sus dobles.
 */
function build() {
  const fork = {};
  const em = { fork: mockFn().mockReturnValue(fork) };
  const ordersRepo = {
    findOrdersForPatientPortal: mockFn().mockResolvedValue([]),
    findReportsByServiceRequests: mockFn().mockResolvedValue([]),
    findPreparationByStudyConcepts: mockFn().mockResolvedValue([]),
  };
  const reportsRepo = {
    findVersionsByReports: mockFn().mockResolvedValue([]),
    findReleaseEventsByVersions: mockFn().mockResolvedValue([]),
    findFilesByVersions: mockFn().mockResolvedValue([]),
    findResultsByVersions: mockFn().mockResolvedValue([]),
  };
  const accountLinksRepo = {
    findActiveByUser: mockFn().mockResolvedValue({ personId: PERSONA }),
  };
  const patientProfilesRepo = {
    findById: mockFn().mockResolvedValue({ profileId: PATIENT }),
  };
  const grantsRepo = {};
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new DiagnosticsPatientResultsService(
    em as any,
    ordersRepo as any,
    reportsRepo as any,
    accountLinksRepo as any,
    patientProfilesRepo as any,
    grantsRepo as any,
    {} as any,
    logger as any,
    {
      forOrders: mockFn(async () => new Map()),
      activeClaimForDispensation: mockFn(async () => undefined),
    } as any,
  );
  return { service, ordersRepo, reportsRepo, accountLinksRepo, fork };
}

/**
 * Una orden con los campos que el servicio proyecta.
 *
 * @param id - Identificador de la orden.
 * @returns La fila simulada.
 */
function order(id: string) {
  return {
    id,
    patientProfileId: PATIENT,
    encounterId: 'e1',
    codeConceptId: CONCEPT_BLOODCOUNT,
    categoryConceptId: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
    statusConceptId: 'st-1',
    priorityConceptId: 'prio-1',
    createdAt: new Date('2026-08-14T10:00:00Z'),
  };
}

describe('DiagnosticsPatientResultsService · listOwnOrders', () => {
  it('lee el portal sin acotar por tenant: las órdenes de la persona son una sola lista', async () => {
    const { service, ordersRepo, fork } = build();

    await service.listOwnOrders(USER, 50);

    expect(ordersRepo.findOrdersForPatientPortal).toHaveBeenCalledWith(
      fork,
      PATIENT,
      expect.anything(),
      51,
    );
    // Cuatro argumentos: si alguien mete el tenant, este contrato cambia.
    expect(ordersRepo.findOrdersForPatientPortal.mock.calls[0]).toHaveLength(4);
  });

  it('pide sólo laboratorio e imagenología, no toda orden de servicio', async () => {
    const { service, ordersRepo } = build();

    await service.listOwnOrders(USER, 50);

    const categories = ordersRepo.findOrdersForPatientPortal.mock.calls[0][2];
    expect([...categories].sort()).toEqual(
      [
        CLIN.SERVICE_REQUEST_CATEGORY_LAB,
        DIAG.SERVICE_REQUEST_CATEGORY_IMAGING,
      ].sort(),
    );
  });

  it('pide una fila de más y avisa que la lista quedó recortada', async () => {
    const { service, ordersRepo } = build();
    ordersRepo.findOrdersForPatientPortal.mockResolvedValue([
      order('o1'),
      order('o2'),
      order('o3'),
    ]);

    const output = await service.listOwnOrders(USER, 2);

    expect(output.items).toHaveLength(2);
    expect(output.truncated).toBe(true);
    expect(output.limit).toBe(2);
  });

  it('un informe SIN liberar no es un resultado: no ofrece abrirlo', async () => {
    const { service, ordersRepo, reportsRepo } = build();
    ordersRepo.findOrdersForPatientPortal.mockResolvedValue([order('o1')]);
    // El informe existe y cuelga de la orden…
    ordersRepo.findReportsByServiceRequests.mockResolvedValue([
      {
        id: 'rep-1',
        serviceRequestId: 'o1',
        codeConceptId: CONCEPT_BLOODCOUNT,
      },
    ]);
    // …pero no tiene ninguna versión liberada.
    reportsRepo.findVersionsByReports.mockResolvedValue([]);

    const output = await service.listOwnOrders(USER, 50);

    expect(output.items[0].hasReleasedResult).toBe(false);
    expect(output.items[0].reportId).toBeUndefined();
  });

  it('con la liberación visible para el paciente, enlaza el informe', async () => {
    const { service, ordersRepo, reportsRepo } = build();
    ordersRepo.findOrdersForPatientPortal.mockResolvedValue([order('o1')]);
    ordersRepo.findReportsByServiceRequests.mockResolvedValue([
      {
        id: 'rep-1',
        serviceRequestId: 'o1',
        codeConceptId: CONCEPT_BLOODCOUNT,
        custodianTenantId: 't1',
      },
    ]);
    reportsRepo.findVersionsByReports.mockResolvedValue([
      { id: 'ver-1', diagnosticReportId: 'rep-1', versionNumber: 1 },
    ]);
    reportsRepo.findReleaseEventsByVersions.mockResolvedValue([
      {
        diagnosticReportVersionId: 'ver-1',
        patientVisibilityConceptId: DIAG.VISIBILITY_PATIENT_VISIBLE,
        recordedAt: new Date('2026-08-15T09:00:00Z'),
      },
    ]);

    const output = await service.listOwnOrders(USER, 50);

    expect(output.items[0].hasReleasedResult).toBe(true);
    expect(output.items[0].reportId).toBe('rep-1');
  });

  it('con dos informes visibles de la misma orden, enlaza el liberado más reciente', async () => {
    const { service, ordersRepo, reportsRepo } = build();
    ordersRepo.findOrdersForPatientPortal.mockResolvedValue([order('o1')]);
    ordersRepo.findReportsByServiceRequests.mockResolvedValue([
      {
        id: 'rep-viejo',
        serviceRequestId: 'o1',
        codeConceptId: CONCEPT_BLOODCOUNT,
      },
      {
        id: 'rep-nuevo',
        serviceRequestId: 'o1',
        codeConceptId: CONCEPT_BLOODCOUNT,
      },
    ]);
    reportsRepo.findVersionsByReports.mockResolvedValue([
      { id: 'ver-viejo', diagnosticReportId: 'rep-viejo', versionNumber: 1 },
      { id: 'ver-nuevo', diagnosticReportId: 'rep-nuevo', versionNumber: 1 },
    ]);
    reportsRepo.findReleaseEventsByVersions.mockResolvedValue([
      {
        diagnosticReportVersionId: 'ver-viejo',
        patientVisibilityConceptId: DIAG.VISIBILITY_PATIENT_VISIBLE,
        recordedAt: new Date('2026-08-10T09:00:00Z'),
      },
      {
        diagnosticReportVersionId: 'ver-nuevo',
        patientVisibilityConceptId: DIAG.VISIBILITY_PATIENT_VISIBLE,
        recordedAt: new Date('2026-08-16T09:00:00Z'),
      },
    ]);

    const output = await service.listOwnOrders(USER, 50);

    // Un estudio repetido por muestra insuficiente deja dos informes: gana el
    // que la persona vino a ver, no el que salió primero de la iteración.
    expect(output.items[0].reportId).toBe('rep-nuevo');
  });

  it('trae la preparación del catálogo emparejada por concepto', async () => {
    const { service, ordersRepo } = build();
    ordersRepo.findOrdersForPatientPortal.mockResolvedValue([order('o1')]);
    ordersRepo.findPreparationByStudyConcepts.mockResolvedValue([
      {
        studyConceptId: CONCEPT_BLOODCOUNT,
        preparationInstructions: 'Ayuno de 8 horas.',
      },
    ]);

    const output = await service.listOwnOrders(USER, 50);

    expect(output.items[0].preparationInstructions).toBe('Ayuno de 8 horas.');
  });

  it('sin preparación publicada la deja ausente, no inventa un texto tranquilizador', async () => {
    const { service, ordersRepo } = build();
    ordersRepo.findOrdersForPatientPortal.mockResolvedValue([order('o1')]);

    const output = await service.listOwnOrders(USER, 50);

    expect(output.items[0].preparationInstructions).toBeUndefined();
  });

  it('una cuenta sin persona vinculada no lee órdenes de nadie', async () => {
    const { service, accountLinksRepo } = build();
    accountLinksRepo.findActiveByUser.mockResolvedValue(null);

    await expect(service.listOwnOrders(USER, 50)).rejects.toThrow();
  });
});
