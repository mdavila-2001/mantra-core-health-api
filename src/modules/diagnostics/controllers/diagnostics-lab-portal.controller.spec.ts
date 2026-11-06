import { describe, expect, it, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Readable } from 'node:stream';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { runWithTenant } from '../../../common';
import { LabStaffGuard } from '../guards';
import { DiagnosticsLabPortalController } from './diagnostics-lab-portal.controller';
import { DiagnosticsLabResultsController } from './diagnostics-lab-results.controller';
import {
  DiagnosticsLabUploadsController,
  readRawBody,
} from './diagnostics-lab-uploads.controller';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const actor = { id: 'user-1' } as any;

describe('laboratory portal controllers', () => {
  it('all are under /diagnostics/lab and authorized by LabStaffGuard, not @Roles', () => {
    for (const controller of [
      DiagnosticsLabPortalController,
      DiagnosticsLabResultsController,
      DiagnosticsLabUploadsController,
    ]) {
      expect(Reflect.getMetadata(GUARDS_METADATA, controller)).toEqual([
        LabStaffGuard,
      ]);
      expect(Reflect.getMetadata(ROLES_KEY, controller)).toBeUndefined();
      expect(String(Reflect.getMetadata(PATH_METADATA, controller))).toMatch(
        /^diagnostics\/lab/,
      );
    }
  });

  it('delegate with the tenant of the context', async () => {
    const summary = { summary: mockFn() };
    const orders = { list: mockFn(), transition: mockFn() };
    const results = { targets: mockFn(), list: mockFn() };
    const writes = { withdraw: mockFn() };
    const uploads = { start: mockFn(), complete: mockFn(), abort: mockFn() };
    const intake = {
      lookupPatient: mockFn(),
      create: mockFn(),
      update: mockFn(),
    };
    const portal = new DiagnosticsLabPortalController(
      summary as any,
      orders as any,
      results as any,
      intake as any,
    );
    const files = new DiagnosticsLabResultsController(
      results as any,
      writes as any,
    );
    const upload = new DiagnosticsLabUploadsController(uploads as any);
    await runWithTenant('lab-1', async () => {
      await portal.getSummary();
      await portal.listOrders({ limit: 50, cursor: 'c' });
      await portal.transition('sr-1', { action: 'RECEIVE' }, actor);
      await portal.lookupPatient({ nationalId: '1234567' });
      await portal.createOrder(
        {
          patientProfileId: 'p-1',
          codeConceptId: 'c-1',
          category: 'LAB' as const,
        },
        actor,
      );
      await portal.updateOrder(
        'sr-2',
        { codeConceptId: 'c-2', category: 'LAB' as const },
        actor,
      );
      await portal.listResultTargets();
      await files.listResultFiles({ kind: 'PDF' });
      await files.searchResultFiles({ q: 'ana' });
      await files.withdrawResult('f-1', { reason: 'error' }, actor);
      await upload.start({} as any);
      await upload.complete('u-1', actor);
      upload.abort('u-1');
    });
    expect(summary.summary).toHaveBeenCalledWith('lab-1');
    expect(orders.list).toHaveBeenCalledWith('lab-1', {
      limit: 50,
      cursor: 'c',
    });
    expect(orders.transition).toHaveBeenCalledWith(
      'lab-1',
      'sr-1',
      { action: 'RECEIVE' },
      actor,
    );
    expect(intake.lookupPatient).toHaveBeenCalledWith('1234567');
    expect(intake.create).toHaveBeenCalledWith(
      'lab-1',
      {
        patientProfileId: 'p-1',
        codeConceptId: 'c-1',
        category: 'LAB' as const,
      },
      actor,
    );
    expect(intake.update).toHaveBeenCalledWith(
      'lab-1',
      'sr-2',
      { codeConceptId: 'c-2', category: 'LAB' as const },
      actor,
    );
    expect(results.targets).toHaveBeenCalledWith('lab-1');
    expect(results.list).toHaveBeenCalledWith('lab-1', { kind: 'PDF' });
    expect(results.list).toHaveBeenCalledWith('lab-1', { q: 'ana' });
    expect(writes.withdraw).toHaveBeenCalledWith(
      'lab-1',
      'f-1',
      'error',
      actor,
    );
    expect(uploads.start).toHaveBeenCalledWith('lab-1', {});
    expect(uploads.complete).toHaveBeenCalledWith('lab-1', 'u-1', actor);
    expect(uploads.abort).toHaveBeenCalledWith('lab-1', 'u-1');
  });

  it('without a tenant in the context nothing reaches the services', async () => {
    const orders = { list: mockFn(), transition: mockFn() };
    const intake = { create: mockFn(), update: mockFn() };
    const portal = new DiagnosticsLabPortalController(
      { summary: mockFn() } as any,
      orders as any,
      { targets: mockFn() } as any,
      intake as any,
    );
    await expect(async () => portal.listOrders({})).rejects.toThrow(/tenant/i);
    await expect(async () =>
      portal.createOrder(
        { patientProfileId: 'p', codeConceptId: 'c', category: 'LAB' as const },
        actor,
      ),
    ).rejects.toThrow(/tenant/i);
    await expect(async () =>
      portal.updateOrder(
        'sr',
        { codeConceptId: 'c', category: 'LAB' as const },
        actor,
      ),
    ).rejects.toThrow(/tenant/i);
    expect(orders.list).not.toHaveBeenCalled();
    expect(intake.create).not.toHaveBeenCalled();
    expect(intake.update).not.toHaveBeenCalled();
  });

  it('readRawBody joins the stream and refuses more than the limit', async () => {
    const ok = Readable.from([Buffer.from('ab'), Buffer.from('c')]) as any;
    await expect(readRawBody(ok, 3)).resolves.toEqual(Buffer.from('abc'));
    const big = Readable.from([Buffer.from('abcd')]) as any;
    await expect(readRawBody(big, 3)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
