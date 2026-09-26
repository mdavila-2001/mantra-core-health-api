import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AllergyIntolerancesService } from './allergy-intolerances.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { OwnerType } from '../../common/dto';
import { CLIN } from '../clinical.concepts';

const actor = { id: 'user-1', roles: [] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const allergyRepo = {
    findActiveBySubstance: mockFn(),
    findById: mockFn(),
    create: mockFn(),
    createReaction: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  // P26: por defecto el encuentro existe y es del paciente del alta.
  const encountersRepo = {
    findById: mockFn().mockResolvedValue({
      id: 'enc-1',
      patientProfileId: 'p1',
    }),
  };
  const filesService = {
    createLink: mockFn().mockResolvedValue({ id: 'link-1' }),
    listLinkedFilesOf: mockFn().mockResolvedValue({ items: [], count: 0 }),
  };
  const clinicalRead = {
    assertPuedeEscribirHistoria: mockFn().mockResolvedValue(undefined),
    assertPuedeLeerHistoria: mockFn().mockResolvedValue(undefined),
  };
  const service = new AllergyIntolerancesService(
    em as any,
    allergyRepo as any,
    logger as any,
    encountersRepo as any,
    filesService as any,
    clinicalRead as any,
  );
  return {
    service,
    tx,
    allergyRepo,
    encountersRepo,
    filesService,
    clinicalRead,
  };
}

/** La alergia que devuelve `create` por defecto. */
function alergiaCreada(over: Record<string, unknown> = {}) {
  return {
    id: 'alg1',
    patientProfileId: 'p1',
    clinicalStatusConceptId: CLIN.ALLERGY_ACTIVE,
    createdAt: new Date(),
    ...over,
  };
}

describe('AllergyIntolerancesService (UC-08-09)', () => {
  it('records an allergy with reactions, flushing parent before children', async () => {
    const d = build();
    d.allergyRepo.findActiveBySubstance.mockResolvedValue(null);
    d.allergyRepo.create.mockReturnValue(alergiaCreada());
    d.allergyRepo.createReaction.mockReturnValue({ id: 'rx1' });

    const res = await d.service.create(
      {
        custodianTenantId: 't1',
        patientProfileId: 'p1',
        substanceConceptId: 's1',
        reactions: [{ manifestationConceptId: 'm1' }],
      },
      actor,
    );

    expect(res.reactionIds).toEqual(['rx1']);
    expect(res.encounterId).toBeNull();
    expect(d.tx.flush).toHaveBeenCalledTimes(2);
    expect(d.encountersRepo.findById).not.toHaveBeenCalled();
  });

  it('rejects a duplicate active allergy for the substance', async () => {
    const d = build();
    d.allergyRepo.findActiveBySubstance.mockResolvedValue({ id: 'existing' });
    await expect(
      d.service.create(
        {
          custodianTenantId: 't1',
          patientProfileId: 'p1',
          substanceConceptId: 's1',
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  // P26 / CL-01 — la alergia atada a la consulta en curso.
  describe('encounterId (P26 / CL-01)', () => {
    it('persiste el encuentro cuando es del mismo paciente y lo devuelve', async () => {
      const d = build();
      d.allergyRepo.findActiveBySubstance.mockResolvedValue(null);
      d.allergyRepo.create.mockReturnValue(
        alergiaCreada({ encounterId: 'enc-1' }),
      );

      const res = await d.service.create(
        {
          custodianTenantId: 't1',
          patientProfileId: 'p1',
          substanceConceptId: 's1',
          encounterId: 'enc-1',
        },
        actor,
      );

      expect(d.allergyRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ encounterId: 'enc-1' }),
      );
      expect(res.encounterId).toBe('enc-1');
    });

    it('rechaza (422) un encuentro de otro paciente y no crea nada', async () => {
      const d = build();
      d.encountersRepo.findById.mockResolvedValue({
        id: 'enc-9',
        patientProfileId: 'OTRO-PACIENTE',
      });
      await expect(
        d.service.create(
          {
            custodianTenantId: 't1',
            patientProfileId: 'p1',
            substanceConceptId: 's1',
            encounterId: 'enc-9',
          },
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.allergyRepo.create).not.toHaveBeenCalled();
    });

    it('rechaza (422) un encuentro inexistente', async () => {
      const d = build();
      d.encountersRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.create(
          {
            custodianTenantId: 't1',
            patientProfileId: 'p1',
            substanceConceptId: 's1',
            encounterId: 'no-existe',
          },
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.allergyRepo.create).not.toHaveBeenCalled();
    });
  });

  // P25 / CL-05 — adjuntos de la alergia, calcados de `procedures`.
  // P25 / BR-11 §1.C — listar adjuntos es leer la historia.
  describe('listAttachments (P25)', () => {
    it('lista por la ruta clínica tras la política de lectura del paciente de la fila', async () => {
      const d = build();
      d.allergyRepo.findById.mockResolvedValue({
        id: 'alg1',
        patientProfileId: 'p1',
      });
      const res = await d.service.listAttachments('alg1', actor);
      expect(d.clinicalRead.assertPuedeLeerHistoria).toHaveBeenCalledWith(
        'p1',
        actor,
      );
      expect(d.filesService.listLinkedFilesOf).toHaveBeenCalledWith(
        OwnerType.ALLERGY_INTOLERANCE,
        'alg1',
      );
      expect(res).toEqual({ items: [], count: 0 });
    });

    it('responde 404 antes de autorizar y no lista nada sin acceso', async () => {
      const d = build();
      d.allergyRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.listAttachments('nope', actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      d.allergyRepo.findById.mockResolvedValue({
        id: 'alg1',
        patientProfileId: 'p1',
      });
      d.clinicalRead.assertPuedeLeerHistoria.mockRejectedValue(
        new Error('403'),
      );
      await expect(d.service.listAttachments('alg1', actor)).rejects.toThrow(
        '403',
      );
      expect(d.filesService.listLinkedFilesOf).not.toHaveBeenCalled();
    });
  });

  describe('attachFile (P25)', () => {
    it('liga el archivo a la alergia con OWNER_ALLERGY_INTOLERANCE tras autorizar por el paciente de la fila', async () => {
      const d = build();
      d.allergyRepo.findById.mockResolvedValue({
        id: 'alg1',
        patientProfileId: 'p1',
      });

      const res = await d.service.attachFile('alg1', { fileId: 'f1' }, actor);

      expect(d.clinicalRead.assertPuedeEscribirHistoria).toHaveBeenCalledWith(
        'p1',
        actor,
      );
      expect(d.filesService.createLink).toHaveBeenCalledWith(
        'f1',
        { ownerType: OwnerType.ALLERGY_INTOLERANCE, ownerId: 'alg1' },
        actor,
      );
      expect(res).toEqual({ id: 'link-1' });
    });

    it('responde 404 antes de autorizar cuando la alergia no existe', async () => {
      const d = build();
      d.allergyRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.attachFile('nope', { fileId: 'f1' }, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.clinicalRead.assertPuedeEscribirHistoria).not.toHaveBeenCalled();
      expect(d.filesService.createLink).not.toHaveBeenCalled();
    });

    it('no liga nada si el actor no puede escribir la historia', async () => {
      const d = build();
      d.allergyRepo.findById.mockResolvedValue({
        id: 'alg1',
        patientProfileId: 'p1',
      });
      d.clinicalRead.assertPuedeEscribirHistoria.mockRejectedValue(
        new Error('403'),
      );
      await expect(
        d.service.attachFile('alg1', { fileId: 'f1' }, actor),
      ).rejects.toThrow('403');
      expect(d.filesService.createLink).not.toHaveBeenCalled();
    });
  });
});
