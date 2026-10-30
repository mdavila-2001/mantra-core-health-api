import { jest } from '@jest/globals';
import { CronJob } from 'cron';
import {
  ADMISSIONS_SWEEP_JOB_NAME,
  AdmissionsExpireSweepJob,
} from './admissions-expire-sweep.job';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ENV_KEYS = [
  'ADMISSIONS_EXPIRE_SWEEP_ENABLED',
  'ADMISSIONS_EXPIRE_SWEEP_CRON',
] as const;

function build(
  sweep: { expired: number; abandoned: number; skipped: boolean } = {
    expired: 0,
    abandoned: 0,
    skipped: false,
  },
) {
  const api = { post: mockFn().mockResolvedValue(sweep) };
  const registry = { addCronJob: mockFn() };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
    debug: mockFn(),
  };
  const job = new AdmissionsExpireSweepJob(
    api as any,
    registry as any,
    logger as any,
  );
  return { job, api, registry, logger };
}

/** Los cron que el test agendó de verdad se paran para no dejar timers vivos. */
const scheduled: CronJob[] = [];
afterEach(() => {
  while (scheduled.length) scheduled.pop()?.stop();
  for (const key of ENV_KEYS) delete process.env[key];
});

function agendado(d: ReturnType<typeof build>): CronJob {
  const [name, cron] = d.registry.addCronJob.mock.calls[0] as [string, CronJob];
  expect(name).toBe(ADMISSIONS_SWEEP_JOB_NAME);
  scheduled.push(cron);
  return cron;
}

describe('AdmissionsExpireSweepJob · agenda', () => {
  it('por defecto agenda el barrido cada hora en punto', () => {
    const d = build();
    expect(d.job.schedule()).toBe('0 * * * *');
    const cron = agendado(d);
    expect(cron.isActive).toBe(true);
    const from = new Date('2026-10-29T10:15:00.000Z');
    const next = cron.cronTime.getNextDateFrom(from).toJSDate();
    expect(next.getUTCMinutes()).toBe(0);
    expect(next.getTime() - from.getTime()).toBe(45 * 60_000);
  });

  it('ADMISSIONS_EXPIRE_SWEEP_CRON cambia la cadencia', () => {
    process.env.ADMISSIONS_EXPIRE_SWEEP_CRON = '*/15 * * * *';
    const d = build();
    expect(d.job.schedule()).toBe('*/15 * * * *');
    const cron = agendado(d);
    const from = new Date('2026-10-29T10:01:00.000Z');
    expect(cron.cronTime.getNextDateFrom(from).toJSDate().getUTCMinutes()).toBe(
      15,
    );
  });

  it('ADMISSIONS_EXPIRE_SWEEP_ENABLED=false no agenda nada y lo avisa', () => {
    process.env.ADMISSIONS_EXPIRE_SWEEP_ENABLED = 'false';
    const d = build();
    expect(d.job.schedule()).toBeNull();
    expect(d.registry.addCronJob).not.toHaveBeenCalled();
    expect(d.logger.warn).toHaveBeenCalled();
  });

  it('una expresión inválida no tumba el worker: se avisa y rige la de por defecto', () => {
    process.env.ADMISSIONS_EXPIRE_SWEEP_CRON = 'cada tanto';
    const d = build();
    expect(() => d.job.onApplicationBootstrap()).not.toThrow();
    expect(d.logger.error).toHaveBeenCalled();
    expect(d.registry.addCronJob).toHaveBeenCalledTimes(1);
    agendado(d);
    expect(d.logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ cron: '0 * * * *' }),
      expect.any(String),
    );
  });

  it('si el registro del scheduler falla al arrancar, el proceso sigue vivo', () => {
    const d = build();
    d.registry.addCronJob.mockImplementation(() => {
      throw new Error('nombre duplicado');
    });
    expect(() => d.job.onApplicationBootstrap()).not.toThrow();
    expect(d.logger.error).toHaveBeenCalled();
  });
});

describe('AdmissionsExpireSweepJob · tick', () => {
  it('llama al barrido de la API como idempotente', async () => {
    const d = build();
    await d.job.tick();
    expect(d.api.post).toHaveBeenCalledWith(
      '/admissions/expire-sweep',
      {},
      { idempotent: true },
    );
  });

  it('informa cuando venció o se abandonó algo y calla cuando no hay novedades', async () => {
    const con = build({ expired: 2, abandoned: 1, skipped: false });
    await con.job.tick();
    expect(con.logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ expired: 2, abandoned: 1 }),
      expect.any(String),
    );
    const sin = build();
    await sin.job.tick();
    expect(sin.logger.info).not.toHaveBeenCalled();
  });

  it('si otro nodo tenía el barrido (skipped), lo registra y no es un error', async () => {
    const d = build({ expired: 0, abandoned: 0, skipped: true });
    await d.job.tick();
    expect(d.logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ skipped: true }),
      expect.any(String),
    );
    expect(d.logger.error).not.toHaveBeenCalled();
  });

  it('un fallo de la API (caída, 5xx, plazo) no tumba el proceso: el tick no lanza', async () => {
    const d = build();
    d.api.post.mockRejectedValue(new Error('API caída'));
    await expect(d.job.tick()).resolves.toBeUndefined();
    expect(d.logger.error).toHaveBeenCalled();
  });
});
