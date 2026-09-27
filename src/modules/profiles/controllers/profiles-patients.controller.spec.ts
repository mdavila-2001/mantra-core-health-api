import { jest } from '@jest/globals';
import { readFileSync } from 'node:fs';
import {
  HttpStatus,
  RequestMethod,
  ValidationPipe,
  type ArgumentMetadata,
} from '@nestjs/common';
import {
  HEADERS_METADATA,
  HTTP_CODE_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ProfilesPatientsController } from './profiles-patients.controller';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { SearchPatientsQueryDto } from '../dto';

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
    searchPatients: mockFn(),
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

/**
 * La búsqueda de pacientes por cuerpo: el nombre (`q`) y el documento
 * (`nationalId`) no pueden viajar en la URL, que registran los logs de acceso.
 */
describe('ProfilesPatientsController — búsqueda sin datos del paciente en la URL', () => {
  const proto = ProfilesPatientsController.prototype as unknown as Record<
    string,
    object
  >;

  it('correcto — POST patients/search delega en el servicio igual que el GET', async () => {
    const d = build();
    d.patientsService.searchPatients.mockResolvedValue({ items: [] });
    const filtros = {
      q: 'Quispe',
      nationalId: '4455667',
      issuerAdministrativeAreaConceptId: '6f1c1d1e-0000-4000-8000-000000000001',
      cursor: 'c-1',
      limit: 10,
    };

    await d.controller.searchPatientsByBody(filtros, actor);
    await d.controller.searchPatients(filtros, actor);

    const esperado = {
      query: 'Quispe',
      nationalId: '4455667',
      issuerAdministrativeAreaConceptId: '6f1c1d1e-0000-4000-8000-000000000001',
      cursor: 'c-1',
      limit: 10,
    };
    expect(d.patientsService.searchPatients).toHaveBeenNthCalledWith(
      1,
      esperado,
      actor,
    );
    expect(d.patientsService.searchPatients).toHaveBeenNthCalledWith(
      2,
      esperado,
      actor,
    );
  });

  it('correcto — los tres filtros de catálogo llegan al servicio', async () => {
    const d = build();
    d.patientsService.searchPatients.mockResolvedValue({ items: [] });

    await d.controller.searchPatientsByBody(
      {
        q: 'Ana',
        aboGroupConceptId: 'abo-o',
        rhFactorConceptId: 'rh-pos',
        clinicalLanguageConceptId: 'lang-ay',
      },
      actor,
    );

    expect(d.patientsService.searchPatients).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'Ana',
        aboGroupConceptId: 'abo-o',
        rhFactorConceptId: 'rh-pos',
        clinicalLanguageConceptId: 'lang-ay',
      }),
      actor,
    );
  });

  it('límite — sin tope en el cuerpo aplica el de siempre (50)', async () => {
    const d = build();
    d.patientsService.searchPatients.mockResolvedValue({ items: [] });

    await d.controller.searchPatientsByBody({}, actor);

    expect(d.patientsService.searchPatients).toHaveBeenCalledWith(
      {
        query: undefined,
        nationalId: undefined,
        issuerAdministrativeAreaConceptId: undefined,
        cursor: undefined,
        limit: 50,
      },
      actor,
    );
  });

  it('es POST patients/search, responde 200 y exige los mismos roles que el GET', () => {
    const porCuerpo = proto.searchPatientsByBody;
    expect(Reflect.getMetadata(METHOD_METADATA, porCuerpo)).toBe(
      RequestMethod.POST,
    );
    expect(Reflect.getMetadata(PATH_METADATA, porCuerpo)).toBe(
      'patients/search',
    );
    expect(Reflect.getMetadata(HTTP_CODE_METADATA, porCuerpo)).toBe(
      HttpStatus.OK,
    );
    expect(Reflect.getMetadata(ROLES_KEY, porCuerpo)).toEqual(
      Reflect.getMetadata(ROLES_KEY, proto.searchPatients),
    );
  });

  it('el GET sigue vivo pero anuncia su reemplazo (Deprecation + Link)', () => {
    expect(Reflect.getMetadata(HEADERS_METADATA, proto.searchPatients)).toEqual(
      expect.arrayContaining([
        { name: 'Deprecation', value: 'true' },
        {
          name: 'Link',
          value: '</profiles/patients/search>; rel="successor-version"',
        },
      ]),
    );
  });

  describe('validación del cuerpo (mismo ValidationPipe que main.ts)', () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    });
    const meta: ArgumentMetadata = {
      type: 'body',
      metatype: SearchPatientsQueryDto,
    };

    it('correcto — acepta nombre, documento y tope', async () => {
      await expect(
        pipe.transform({ q: 'Ana', nationalId: '123', limit: 5 }, meta),
      ).resolves.toMatchObject({ q: 'Ana', nationalId: '123', limit: 5 });
    });

    it('límite — tope 500 pasa, 501 no', async () => {
      await expect(pipe.transform({ limit: 500 }, meta)).resolves.toMatchObject(
        { limit: 500 },
      );
      await expect(pipe.transform({ limit: 501 }, meta)).rejects.toThrow();
    });

    it('correcto — acepta los tres filtros de catálogo como uuid', async () => {
      const uuid = '6f1c1d1e-0000-4000-8000-000000000001';
      await expect(
        pipe.transform(
          {
            q: 'Ana',
            aboGroupConceptId: uuid,
            rhFactorConceptId: uuid,
            clinicalLanguageConceptId: uuid,
          },
          meta,
        ),
      ).resolves.toMatchObject({ aboGroupConceptId: uuid });
    });

    it('inválido — un filtro de catálogo que no es uuid es 400', async () => {
      await expect(
        pipe.transform({ q: 'Ana', aboGroupConceptId: 'O+' }, meta),
      ).rejects.toThrow();
    });

    it('inválido — un campo no declarado es 400, no se ignora', async () => {
      await expect(
        pipe.transform({ q: 'Ana', password: 'x' }, meta),
      ).rejects.toThrow();
    });
  });
});
