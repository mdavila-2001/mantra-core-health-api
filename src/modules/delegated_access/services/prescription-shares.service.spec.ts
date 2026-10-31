import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { CLIN } from '../../clinical/clinical.concepts';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason } from '../delegated_access.error-reasons';
import { hashShareToken, issueShareToken } from './prescription-share-token';
import {
  DAY,
  ENCOUNTER,
  PATIENT,
  SHARE,
  TENANT,
  build,
  doctorActor,
  item,
  link,
  otherDoctorActor,
  otherPatientActor,
  patientActor,
  thrown,
} from './prescription-shares.testing';

describe('PrescriptionSharesService', () => {
  describe('create', () => {
    it('comparte solo los ítems emitidos y vigentes del encuentro', async () => {
      const { service, repo } = build();
      repo.findItemsByEncounter.mockResolvedValue([
        item(),
        item(),
        item({ statusConceptId: CLIN.MEDICATION_REQUEST_REPLACED }),
        item({ statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT }),
      ]);
      const result = await service.create(
        { encounterId: ENCOUNTER },
        patientActor,
      );
      expect(result.itemCount).toBe(2);
      expect(result.shareId).toBe(SHARE);
      expect(result.token).toHaveLength(43);
      expect(result.url).toMatch(new RegExp(`/rx/${result.token}$`));
    });

    it('la url usa WEB_APP_BASE_URL sin barra final', async () => {
      const previous = process.env.WEB_APP_BASE_URL;
      process.env.WEB_APP_BASE_URL = 'https://web.example.test/';
      try {
        const { service, repo } = build();
        repo.findItemsByEncounter.mockResolvedValue([item()]);
        const result = await service.create(
          { encounterId: ENCOUNTER },
          patientActor,
        );
        expect(result.url).toBe(`https://web.example.test/rx/${result.token}`);
      } finally {
        if (previous === undefined) delete process.env.WEB_APP_BASE_URL;
        else process.env.WEB_APP_BASE_URL = previous;
      }
    });

    it('guarda el hash y nunca el token en claro', async () => {
      const { service, repo, created } = build();
      repo.findItemsByEncounter.mockResolvedValue([item()]);
      const result = await service.create(
        { encounterId: ENCOUNTER },
        patientActor,
      );
      expect(created).toHaveLength(1);
      expect(created[0].tokenHash).toBe(hashShareToken(result.token));
      expect(JSON.stringify(created)).not.toContain(result.token);
    });

    it('llena las columnas del enlace (tenant custodio, paciente, recurso, alcance, estado, actor)', async () => {
      const { service, repo, created } = build();
      repo.findItemsByEncounter.mockResolvedValue([item()]);
      await service.create({ encounterId: ENCOUNTER }, patientActor);
      expect(created[0]).toMatchObject({
        tenantId: TENANT,
        patientProfileId: PATIENT,
        resourceTypeConceptId: DELEG.SHARE_RESOURCE_PRESCRIPTION_ENCOUNTER,
        resourceId: ENCOUNTER,
        scopeConceptId: DELEG.SHARE_SCOPE_PHARMACY_DISPENSE,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: patientActor.id,
      });
      expect(created[0]).not.toHaveProperty('recipientLabel');
      expect(created[0]).not.toHaveProperty('purposeOfUseConceptId');
    });

    it('vence con el valid_to más próximo de los ítems vigentes', async () => {
      const { service, repo } = build();
      const soon = new Date(Date.now() + 5 * DAY);
      repo.findItemsByEncounter.mockResolvedValue([
        item({ validTo: new Date(Date.now() + 10 * DAY) }),
        item({ validTo: soon }),
      ]);
      const result = await service.create(
        { encounterId: ENCOUNTER },
        patientActor,
      );
      expect(result.expiresAt).toEqual(soon);
    });

    it('un fármaco suelto es una receta de un ítem', async () => {
      const { service, repo, created } = build();
      const single = item({ encounterId: undefined });
      repo.findItemById.mockResolvedValue(single);
      const result = await service.create(
        { medicationRequestId: single.id },
        patientActor,
      );
      expect(result.itemCount).toBe(1);
      expect(created[0]).toMatchObject({
        resourceTypeConceptId: DELEG.SHARE_RESOURCE_MEDICATION_REQUEST,
        resourceId: single.id,
      });
    });

    it.each([
      ['ninguno', {}],
      ['los dos', { encounterId: ENCOUNTER, medicationRequestId: ENCOUNTER }],
    ])('400 si no viene exactamente uno de los ids (%s)', async (_, dto) => {
      const { service, repo } = build();
      const error = await thrown(service.create(dto as any, patientActor));
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.getResponse()).toMatchObject({
        code: 'VALIDATION_FAILED',
        reason: DelegatedAccessErrorReason.PRESCRIPTION_SHARE_TARGET_INVALID,
      });
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('la receta de otro paciente da el mismo 404 que una inexistente', async () => {
      const { service, repo } = build();
      repo.findItemsByEncounter.mockResolvedValue([]);
      const missing = await thrown(
        service.create({ encounterId: ENCOUNTER }, patientActor),
      );
      repo.findItemsByEncounter.mockResolvedValue([item()]);
      const foreign = await thrown(
        service.create({ encounterId: ENCOUNTER }, otherPatientActor),
      );
      expect(missing).toBeInstanceOf(ResourceNotFoundException);
      expect(foreign).toBeInstanceOf(ResourceNotFoundException);
      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('la médica que emitió la receta la comparte', async () => {
      const { service, repo, created } = build();
      repo.findItemsByEncounter.mockResolvedValue([item(), item()]);
      const result = await service.create(
        { encounterId: ENCOUNTER },
        doctorActor,
      );
      expect(result.itemCount).toBe(2);
      expect(created[0].actorUserId).toBe(doctorActor.id);
    });

    it('una médica que no la emitió recibe 403', async () => {
      const { service, repo } = build();
      repo.findItemsByEncounter.mockResolvedValue([item()]);
      const error = await thrown(
        service.create({ encounterId: ENCOUNTER }, otherDoctorActor),
      );
      expect(error).toBeInstanceOf(ForbiddenException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('sin ítems vigentes responde 422 PRESCRIPTION_SHARE_NO_ACTIVE_ITEMS', async () => {
      const { service, repo } = build();
      repo.findItemsByEncounter.mockResolvedValue([
        item({ validTo: new Date(Date.now() - DAY) }),
        item({ statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT }),
      ]);
      const error = await thrown(
        service.create({ encounterId: ENCOUNTER }, patientActor),
      );
      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(error.getStatus()).toBe(422);
      expect(error.reason).toBe(
        DelegatedAccessErrorReason.PRESCRIPTION_SHARE_NO_ACTIVE_ITEMS,
      );
      expect(error.details).toEqual({
        reason: DelegatedAccessErrorReason.PRESCRIPTION_SHARE_NO_ACTIVE_ITEMS,
      });
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('el log de creación no lleva el token', async () => {
      const { service, repo, logger } = build();
      repo.findItemsByEncounter.mockResolvedValue([item()]);
      const result = await service.create(
        { encounterId: ENCOUNTER },
        patientActor,
      );
      expect(JSON.stringify(logger.info.mock.calls)).not.toContain(
        result.token,
      );
    });
  });

  describe('listForPatient', () => {
    it('lista sin token ni hash, con estado y aperturas', async () => {
      const { service, repo } = build();
      repo.findByPatient.mockResolvedValue([link()]);
      repo.findItemsForResources.mockResolvedValue([item()]);
      repo.countOpenedByLinkIds.mockResolvedValue(new Map([[SHARE, 3]]));
      const result = await service.listForPatient(PATIENT, patientActor);
      expect(result).toEqual([
        {
          shareId: SHARE,
          resourceType: 'PRESCRIPTION_ENCOUNTER',
          resourceId: ENCOUNTER,
          createdAt: expect.any(Date),
          expiresAt: expect.any(Date),
          status: 'VALID',
          endedReason: null,
          uses: 3,
        },
      ]);
      expect(Object.keys(result[0])).not.toEqual(
        expect.arrayContaining(['token']),
      );
      expect(Object.keys(result[0])).not.toEqual(
        expect.arrayContaining(['tokenHash']),
      );
      expect(repo.findByPatient).toHaveBeenCalledWith(
        expect.anything(),
        PATIENT,
        undefined,
      );
    });

    it('pide el conteo de aperturas una sola vez para todos los enlaces', async () => {
      const { service, repo } = build();
      const second = '77777777-7777-4777-8777-777777777778';
      repo.findByPatient.mockResolvedValue([link(), link({ id: second })]);
      repo.findItemsForResources.mockResolvedValue([item()]);
      repo.countOpenedByLinkIds.mockResolvedValue(new Map([[second, 5]]));
      const result = await service.listForPatient(PATIENT, patientActor);
      expect(repo.countOpenedByLinkIds).toHaveBeenCalledTimes(1);
      expect(repo.countOpenedByLinkIds).toHaveBeenCalledWith(
        expect.anything(),
        [SHARE, second],
      );
      expect(result.map((row) => row.uses)).toEqual([0, 5]);
    });

    it('sin enlaces no cuenta aperturas', async () => {
      const { service, repo } = build();
      repo.findByPatient.mockResolvedValue([]);
      await expect(
        service.listForPatient(PATIENT, patientActor),
      ).resolves.toEqual([]);
      expect(repo.countOpenedByLinkIds).not.toHaveBeenCalled();
    });

    it('un enlace cuya receta ya no tiene ítems vigentes se lee EXPIRED', async () => {
      const { service, repo } = build();
      repo.findByPatient.mockResolvedValue([link()]);
      repo.findItemsForResources.mockResolvedValue([
        item({ statusConceptId: CLIN.MEDICATION_REQUEST_INVALIDATED }),
      ]);
      const [row] = await service.listForPatient(PATIENT, patientActor);
      expect(row.status).toBe('EXPIRED');
      expect(row.uses).toBe(0);
    });

    it('otro paciente recibe 404', async () => {
      const { service, repo } = build();
      const error = await thrown(
        service.listForPatient(PATIENT, otherPatientActor),
      );
      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(repo.findByPatient).not.toHaveBeenCalled();
    });

    it('una médica ve solo los que creó', async () => {
      const { service, repo } = build();
      await service.listForPatient(PATIENT, doctorActor);
      expect(repo.findByPatient).toHaveBeenCalledWith(
        expect.anything(),
        PATIENT,
        doctorActor.id,
      );
    });
  });

  describe('revoke', () => {
    it('el dueño revoca: estado, fecha y quién', async () => {
      const { service, repo } = build();
      const row = link();
      repo.findById.mockResolvedValue(row);
      await service.revoke(SHARE, patientActor);
      expect(row.statusConceptId).toBe(CONCEPTS.STATE_REVOKED);
      expect(row.revokedAt).toBeInstanceOf(Date);
      expect(row.revokedByUserId).toBe(patientActor.id);
    });

    it('quien lo creó también lo revoca', async () => {
      const { service, repo } = build();
      const row = link({ createdByUserId: doctorActor.id });
      repo.findById.mockResolvedValue(row);
      await service.revoke(SHARE, doctorActor);
      expect(row.statusConceptId).toBe(CONCEPTS.STATE_REVOKED);
    });

    it('revocar uno ajeno es 404 y no cambia nada', async () => {
      const { service, repo } = build();
      const row = link();
      repo.findById.mockResolvedValue(row);
      const error = await thrown(service.revoke(SHARE, otherPatientActor));
      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(row.statusConceptId).toBe(CONCEPTS.STATE_ACTIVE);
      expect(row.revokedAt).toBeUndefined();
    });

    it('revocar dos veces no cambia la primera revocación', async () => {
      const { service, repo } = build();
      const first = new Date('2026-10-01T00:00:00.000Z');
      const row = link({
        statusConceptId: CONCEPTS.STATE_REVOKED,
        revokedAt: first,
        revokedByUserId: patientActor.id,
      });
      repo.findById.mockResolvedValue(row);
      await service.revoke(SHARE, patientActor);
      expect(row.revokedAt).toBe(first);
    });
  });

  describe('resolveOwnership', () => {
    it('200 para el dueño, sin registrar uso', async () => {
      const { service, repo } = build();
      const { token, tokenHash } = issueShareToken();
      repo.findByTokenHash.mockResolvedValue(link({ tokenHash }));
      const result = await service.resolveOwnership(token, patientActor);
      expect(result).toEqual({
        shareId: SHARE,
        resourceType: 'PRESCRIPTION_ENCOUNTER',
        resourceId: ENCOUNTER,
      });
      expect(repo.findByTokenHash).toHaveBeenCalledWith(
        expect.anything(),
        tokenHash,
      );
      expect(repo.appendUse).not.toHaveBeenCalled();
    });

    it('404 para otro, sin registrar uso', async () => {
      const { service, repo } = build();
      const { token } = issueShareToken();
      repo.findByTokenHash.mockResolvedValue(link());
      const error = await thrown(
        service.resolveOwnership(token, otherPatientActor),
      );
      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(repo.appendUse).not.toHaveBeenCalled();
    });

    it('un token mal formado es 404 sin consultar la base', async () => {
      const { service, repo } = build();
      const error = await thrown(
        service.resolveOwnership('corto', patientActor),
      );
      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(repo.findByTokenHash).not.toHaveBeenCalled();
    });
  });
});
