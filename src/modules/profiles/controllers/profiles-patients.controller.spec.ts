import { jest } from '@jest/globals';
import { readFileSync } from 'node:fs';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ProfilesPatientsController } from './profiles-patients.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const patientsService = {
    registerPatient: mockFn(),
    linkAccount: mockFn(),
    addIdentityLink: mockFn(),
    mergePatients: mockFn(),
    reverseMerge: mockFn(),
    addRelatedPerson: mockFn(),
    grantPortalProxy: mockFn(),
    decease: mockFn(),
    getOwnProfile: mockFn(),
    updateOwnProfile: mockFn(),
    setOwnPhoto: mockFn(),
    removeOwnPhoto: mockFn(),
    getOwnDependents: mockFn(),
    registerOwnDependent: mockFn(),
  };
  const controller = new ProfilesPatientsController(patientsService as any);
  return { controller, patientsService };
}

describe('ProfilesPatientsController', () => {
  it('delegates registerPatient (UC-05-01)', async () => {
    const d = build();
    const dto = { patientCode: 'PC-1' };
    d.patientsService.registerPatient.mockResolvedValue({ profileId: 'pp1' });
    await expect(
      d.controller.registerPatient(dto as any, actor),
    ).resolves.toEqual({ profileId: 'pp1' });
    expect(d.patientsService.registerPatient).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates linkAccount (UC-05-02)', async () => {
    const d = build();
    const dto = { userId: 'u1' };
    await d.controller.linkAccount('p1', dto, actor);
    expect(d.patientsService.linkAccount).toHaveBeenCalledWith(
      'p1',
      dto,
      actor,
    );
  });

  it('delegates addIdentityLink (UC-05-07)', async () => {
    const d = build();
    const dto = {
      sourceTenantId: 't1',
      sourcePatientIdentifier: 'x',
      confidenceScore: 0.9,
    };
    await d.controller.addIdentityLink('pp1', dto, actor);
    expect(d.patientsService.addIdentityLink).toHaveBeenCalledWith(
      'pp1',
      dto,
      actor,
    );
  });

  it('delegates mergePatients (UC-05-08)', async () => {
    const d = build();
    const dto = { survivingPatientProfileId: 'a', mergedPatientProfileId: 'b' };
    await d.controller.mergePatients(dto, actor);
    expect(d.patientsService.mergePatients).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates reverseMerge (UC-05-09)', async () => {
    const d = build();
    await d.controller.reverseMerge('e1', {}, actor);
    expect(d.patientsService.reverseMerge).toHaveBeenCalledWith(
      'e1',
      {},
      actor,
    );
  });

  it('delegates addRelatedPerson (UC-05-10)', async () => {
    const d = build();
    const dto = { displayName: 'Mom' };
    await d.controller.addRelatedPerson('pp1', dto, actor);
    expect(d.patientsService.addRelatedPerson).toHaveBeenCalledWith(
      'pp1',
      dto,
      actor,
    );
  });

  it('delegates grantPortalProxy (UC-05-11)', async () => {
    const d = build();
    const dto = {
      proxyUserId: 'u1',
      scopeValueSetId: 's1',
      legalBasisRecordId: 'lb1',
    };
    await d.controller.grantPortalProxy('pp1', dto, actor);
    expect(d.patientsService.grantPortalProxy).toHaveBeenCalledWith(
      'pp1',
      dto,
      actor,
    );
  });

  it('delegates decease (UC-05-12)', async () => {
    const d = build();
    await d.controller.decease('p1', {}, actor);
    expect(d.patientsService.decease).toHaveBeenCalledWith('p1', {}, actor);
  });

  // El sujeto de las rutas `me` no viaja como parámetro: lo resuelve el
  // servicio desde la sesión, y lo único que el controller aporta es el actor.
  const titular = { id: 'user-1', roles: [] } as any;

  it('delega getOwnProfile con el actor de la sesión', async () => {
    const d = build();
    d.patientsService.getOwnProfile.mockResolvedValue({ personId: 'per-1' });

    await expect(d.controller.getOwnProfile(titular)).resolves.toEqual({
      personId: 'per-1',
    });
    expect(d.patientsService.getOwnProfile).toHaveBeenCalledWith(titular);
  });

  it('delega updateOwnProfile con el cuerpo y el actor', async () => {
    const d = build();
    const dto = { name: 'Ada' };
    d.patientsService.updateOwnProfile.mockResolvedValue({ personId: 'per-1' });

    await d.controller.updateOwnProfile(dto, titular);

    expect(d.patientsService.updateOwnProfile).toHaveBeenCalledWith(
      dto,
      titular,
    );
  });

  it('delega setOwnPhoto con el cuerpo y el actor', async () => {
    const d = build();
    const dto = { fileId: 'file-1' };
    d.patientsService.setOwnPhoto.mockResolvedValue({ personId: 'per-1' });

    await expect(d.controller.setOwnPhoto(dto, titular)).resolves.toEqual({
      personId: 'per-1',
    });
    expect(d.patientsService.setOwnPhoto).toHaveBeenCalledWith(dto, titular);
  });

  it('delega removeOwnPhoto con el actor de la sesión', async () => {
    const d = build();
    d.patientsService.removeOwnPhoto.mockResolvedValue({ personId: 'per-1' });

    await expect(d.controller.removeOwnPhoto(titular)).resolves.toEqual({
      personId: 'per-1',
    });
    expect(d.patientsService.removeOwnPhoto).toHaveBeenCalledWith(titular);
  });

  it('delega getOwnDependents con el actor de la sesión', async () => {
    const d = build();
    d.patientsService.getOwnDependents.mockResolvedValue([]);

    await expect(d.controller.getOwnDependents(titular)).resolves.toEqual([]);
    // El sujeto lo resuelve el servidor: no hay parámetro que apunte a otro.
    expect(d.patientsService.getOwnDependents).toHaveBeenCalledWith(titular);
  });

  it('delega registerOwnDependent con el cuerpo y el actor', async () => {
    const d = build();
    const dto = { name: 'Mateo', lastName: 'Quispe' } as any;
    d.patientsService.registerOwnDependent.mockResolvedValue({
      patientProfileId: 'pp-hijo',
    });

    await expect(
      d.controller.registerOwnDependent(dto, titular),
    ).resolves.toEqual({ patientProfileId: 'pp-hijo' });
    expect(d.patientsService.registerOwnDependent).toHaveBeenCalledWith(
      dto,
      titular,
    );
  });

  it('las rutas de dependientes se declaran antes que `patients/:profileId`', () => {
    // Nest resuelve por orden de declaración: si `patients/:profileId` fuera
    // primero, capturaría `patients/me/dependents` y respondería 400 por uuid
    // mal formado en vez de la lista. Lo mismo que ya vale para `me/summary`.
    // Ruta desde la raíz del repo: jest corre desde ahí, y `import.meta` no
    // está disponible bajo el tsconfig raíz (compila a CommonJS).
    const fuente = readFileSync(
      'src/modules/profiles/controllers/profiles-patients.controller.ts',
      'utf8',
    );
    const dependientes = fuente.indexOf("@Get('patients/me/dependents')");
    const alta = fuente.indexOf("@Post('patients/me/dependents')");
    const porId = fuente.indexOf("@Get('patients/:profileId')");

    expect(dependientes).toBeGreaterThan(-1);
    expect(alta).toBeGreaterThan(-1);
    expect(porId).toBeGreaterThan(-1);
    expect(dependientes).toBeLessThan(porId);
    expect(alta).toBeLessThan(porId);
  });
});
