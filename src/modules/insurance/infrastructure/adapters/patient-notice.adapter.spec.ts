import { jest } from '@jest/globals';
import { PatientNoticeAdapter } from './patient-notice.adapter';

/**
 * Aviso in-app al paciente (carril 16, REQ-16-032): resuelve su cuenta, emite
 * en la bandeja y nunca lanza. Los colaboradores son dobles del contrato.
 */

const fn = () => jest.fn<(...args: any[]) => any>();

const input = {
  patientProfileId: 'patient-1',
  subject: 'Se emitió un cobro a su nombre',
  bodyText: 'Se le emitió una factura por 140.00.',
  destination: { type: 'INSURANCE_CLAIM' as const, id: 'claim-1' },
  debounceKey: 'insurance:INSURANCE_CLAIM:claim-1:line-1:invoice',
  tenantId: 'tenant-1',
  payloadJson: { patientAmount: '140.00' },
  actorUserId: 'user-billing',
};

function build(link: { userId: string } | null = { userId: 'user-patient' }) {
  const forked = {};
  const em = { fork: fn().mockReturnValue(forked) };
  const accountLinks = { findActiveByPerson: fn().mockResolvedValue(link) };
  const notifications = {
    emitInApp: fn().mockResolvedValue({ suppressed: false }),
  };
  const logger = { setContext: fn(), info: fn(), error: fn() };
  const adapter = new PatientNoticeAdapter(
    em as never,
    accountLinks as never,
    notifications as never,
    logger as never,
  );
  return { adapter, em, forked, accountLinks, notifications, logger };
}

describe('PatientNoticeAdapter', () => {
  it('emite en la bandeja del usuario de la cuenta activa del paciente', async () => {
    const { adapter, accountLinks, notifications, forked } = build();
    await adapter.notifyPatient(input);
    expect(accountLinks.findActiveByPerson).toHaveBeenCalledWith(
      forked,
      'patient-1',
    );
    expect(notifications.emitInApp).toHaveBeenCalledWith({
      recipientUserId: 'user-patient',
      category: 'CLINICAL',
      subject: input.subject,
      bodyText: input.bodyText,
      destination: input.destination,
      tenantId: 'tenant-1',
      debounceKey: input.debounceKey,
      payloadJson: input.payloadJson,
      actorUserId: 'user-billing',
    });
  });

  it('sin cuenta activa omite el aviso y lo deja en el log con ids', async () => {
    const { adapter, notifications, logger } = build(null);
    await expect(adapter.notifyPatient(input)).resolves.toBeUndefined();
    expect(notifications.emitInApp).not.toHaveBeenCalled();
    const logged = JSON.stringify(logger.info.mock.calls);
    expect(logged).toContain('claim-1');
    expect(logged).not.toContain('140.00');
  });

  it('si emitir falla no lanza: la factura ya está guardada', async () => {
    const { adapter, notifications, logger } = build();
    notifications.emitInApp.mockRejectedValue(new Error('smtp down'));
    await expect(adapter.notifyPatient(input)).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain('140.00');
  });

  it('si falla la búsqueda de la cuenta tampoco lanza', async () => {
    const { adapter, accountLinks, notifications } = build();
    accountLinks.findActiveByPerson.mockRejectedValue(new Error('db down'));
    await expect(adapter.notifyPatient(input)).resolves.toBeUndefined();
    expect(notifications.emitInApp).not.toHaveBeenCalled();
  });
});
