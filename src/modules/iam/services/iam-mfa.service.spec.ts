import { jest } from '@jest/globals';
import { generate, generateSecret } from 'otplib';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IamMfaService } from './iam-mfa.service';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  encryptSecret,
} from '../../../common';

const actor = { id: 'u1', roles: ['USER'] };

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  // `fork()` devuelve un em independiente para el registro de auditoría de fallos
  // (se persiste fuera de la transacción principal que hace rollback al lanzar).
  const auditEm = { flush: mockFn() };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => auditEm),
  };
  const usersRepo = { findById: mockFn() };
  const mfaRepo = {
    create: mockFn(),
    findByIdAndUser: mockFn(),
    findByUser: mockFn(),
    findVerifiedByUser: mockFn(),
  };
  const eventsRepo = { record: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new IamMfaService(
    em as any,
    usersRepo as any,
    mfaRepo,
    eventsRepo as any,
    logger as any,
  );
  return { service, tx, auditEm, em, usersRepo, mfaRepo, eventsRepo };
}

describe('IamMfaService (UC-01-03)', () => {
  it('enrolls a new TOTP factor, stores the encrypted secret and returns secret + otpauthUri', async () => {
    const d = build();
    d.usersRepo.findById.mockResolvedValue({ id: 'u1', displayName: 'Ana' });
    const factor: any = { id: 'f1', stateConceptId: CONCEPTS.STATE_PENDING };
    d.mfaRepo.create.mockReturnValue(factor);

    const res = await d.service.enrollOrVerify(
      'u1',
      { factorType: 'TOTP' },
      actor,
    );

    expect(res).toMatchObject({
      id: 'f1',
      userId: 'u1',
      state: CONCEPTS.STATE_PENDING,
    });
    // El secreto se genera, se cifra en el factor y se devuelve solo al enrolar.
    expect(res.secret).toEqual(expect.any(String));
    expect(res.otpauthUri).toContain('otpauth://totp/');
    expect(factor.secretEncrypted).toEqual(expect.any(String));
    expect(factor.secretEncrypted).not.toContain(res.secret!);
    expect(d.eventsRepo.record).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        eventTypeConceptId: CONCEPTS.SEC_MFA_ENROLL,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
      }),
    );
  });

  it('does not generate a secret for WEBAUTHN factors', async () => {
    const d = build();
    d.usersRepo.findById.mockResolvedValue({ id: 'u1', displayName: 'Ana' });
    const factor: any = { id: 'f1', stateConceptId: CONCEPTS.STATE_PENDING };
    d.mfaRepo.create.mockReturnValue(factor);

    const res = await d.service.enrollOrVerify(
      'u1',
      { factorType: 'WEBAUTHN' },
      actor,
    );

    expect(res.secret).toBeUndefined();
    expect(res.otpauthUri).toBeUndefined();
    expect(factor.secretEncrypted).toBeUndefined();
  });

  it('verifies a factor with a valid TOTP code and enables MFA on the user', async () => {
    const d = build();
    const secret = generateSecret();
    const user = {
      id: 'u1',
      mfaStatusConceptId: CONCEPTS.MFA_DISABLED,
      updatedAt: new Date(),
    };
    const factor = {
      id: 'f1',
      stateConceptId: CONCEPTS.STATE_PENDING,
      secretEncrypted: encryptSecret(secret),
      updatedAt: new Date(),
    };
    d.usersRepo.findById.mockResolvedValue(user);
    d.mfaRepo.findByIdAndUser.mockResolvedValue(factor);

    const code = await generate({ secret });
    const res = await d.service.enrollOrVerify(
      'u1',
      { verify: true, factorId: 'f1', code },
      actor,
    );

    expect(res.state).toBe(CONCEPTS.STATE_VERIFIED);
    expect(factor.stateConceptId).toBe(CONCEPTS.STATE_VERIFIED);
    expect(user.mfaStatusConceptId).toBe(CONCEPTS.MFA_ENABLED);
    // El secreto nunca se devuelve al verificar.
    expect(res.secret).toBeUndefined();
    expect(res.otpauthUri).toBeUndefined();
  });

  it('rejects an invalid TOTP code and records a FAILURE security event', async () => {
    const d = build();
    const user = { id: 'u1', mfaStatusConceptId: CONCEPTS.MFA_DISABLED };
    const factor = {
      id: 'f1',
      stateConceptId: CONCEPTS.STATE_PENDING,
      secretEncrypted: encryptSecret(generateSecret()),
    };
    d.usersRepo.findById.mockResolvedValue(user);
    d.mfaRepo.findByIdAndUser.mockResolvedValue(factor);

    await expect(
      d.service.enrollOrVerify(
        'u1',
        { verify: true, factorId: 'f1', code: '000000' },
        actor as any,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);

    // No se habilita el MFA ni se marca verificado.
    expect(factor.stateConceptId).toBe(CONCEPTS.STATE_PENDING);
    expect(user.mfaStatusConceptId).toBe(CONCEPTS.MFA_DISABLED);
    // El fallo se audita sobre un em independiente (fork) que se flushea.
    expect(d.em.fork).toHaveBeenCalled();
    expect(d.auditEm.flush).toHaveBeenCalled();
    expect(d.eventsRepo.record).toHaveBeenCalledWith(
      d.auditEm,
      expect.objectContaining({
        eventTypeConceptId: CONCEPTS.SEC_MFA_ENROLL,
        outcomeConceptId: CONCEPTS.OUTCOME_FAILURE,
      }),
    );
  });

  it('requires the code when verifying', async () => {
    const d = build();
    d.usersRepo.findById.mockResolvedValue({ id: 'u1' });
    d.mfaRepo.findByIdAndUser.mockResolvedValue({
      id: 'f1',
      secretEncrypted: encryptSecret(generateSecret()),
    });
    await expect(
      d.service.enrollOrVerify('u1', { verify: true, factorId: 'f1' }, actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('throws when the user does not exist', async () => {
    const d = build();
    d.usersRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.enrollOrVerify('u1', { factorType: 'TOTP' }, actor as any),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('throws when the factor to verify is not found', async () => {
    const d = build();
    d.usersRepo.findById.mockResolvedValue({ id: 'u1' });
    d.mfaRepo.findByIdAndUser.mockResolvedValue(null);
    await expect(
      d.service.enrollOrVerify(
        'u1',
        { verify: true, factorId: 'f1', code: '123456' },
        actor as any,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('requires factorType when enrolling (business rule)', async () => {
    const d = build();
    d.usersRepo.findById.mockResolvedValue({ id: 'u1' });
    await expect(
      d.service.enrollOrVerify('u1', {}, actor as any),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });
});
