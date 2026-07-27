import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CanonicalResourcesService } from './canonical-resources.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['CLINICAL_INFORMATICIAN'] };
const RESOURCE = '11111111-1111-1111-1111-111111111111';
const TARGET = '22222222-2222-2222-2222-222222222222';
const VERSION = '33333333-3333-3333-3333-333333333333';
const TENANT = '44444444-4444-4444-4444-444444444444';
const TYPE = '55555555-5555-5555-5555-555555555555';
const DOMAIN_ENTITY = '66666666-6666-6666-6666-666666666666';

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const resourcesRepo = {
    findResourceForUpdate: mockFn(),
    createIdentifier: mockFn(() => ({ id: 'identifier-1' })),
    findIdentifier: mockFn(() => Promise.resolve(null)),
    findPrimaryIdentifierForUpdate: mockFn(() => Promise.resolve(null)),
    createRelationship: mockFn(() => ({ id: 'relationship-1' })),
    findLiveRelationshipForUpdate: mockFn(() => Promise.resolve(null)),
    findLiveRelationshipsForUpdate: mockFn(() => Promise.resolve([])),
    createBinding: mockFn(() => ({ id: 'binding-1' })),
    findBinding: mockFn(() => Promise.resolve(null)),
    findLiveBindingsForUpdate: mockFn(() => Promise.resolve([])),
  };
  const provenanceRepo = {
    createProvenanceRecord: mockFn(() => ({ id: 'provenance-1' })),
    createProvenanceTarget: mockFn(() => ({ id: 'target-1' })),
    createLineageEdge: mockFn(() => ({ id: 'edge-1' })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new CanonicalResourcesService(
    em as any,
    resourcesRepo as any,
    provenanceRepo,
    logger as any,
  );
  return { service, tx, resourcesRepo, provenanceRepo, logger };
}

function activeResource(overrides: Record<string, unknown> = {}): any {
  return {
    id: RESOURCE,
    custodianTenantId: TENANT,
    currentVersionId: VERSION,
    lifecycleStatusConceptId: CONCEPTS.RESOURCE_ACTIVE,
    ...overrides,
  };
}

describe('CanonicalResourcesService', () => {
  describe('registerIdentifier (UC-52-04)', () => {
    const dto: any = {
      identifierSystem: 'http://minsal.cl/run',
      identifierValue: '12345678-9',
    };

    it('registers a non-primary identifier', async () => {
      const d = build();
      d.resourcesRepo.findResourceForUpdate.mockResolvedValue(activeResource());

      const res = await d.service.registerIdentifier(RESOURCE, dto);

      expect(res).toEqual({
        id: 'identifier-1',
        canonicalHealthResourceId: RESOURCE,
        isPrimary: false,
        supersededIdentifierId: undefined,
      });
      expect(
        d.resourcesRepo.findPrimaryIdentifierForUpdate,
      ).not.toHaveBeenCalled();
    });

    it('closes the previous primary identifier of the same system', async () => {
      const d = build();
      d.resourcesRepo.findResourceForUpdate.mockResolvedValue(activeResource());
      const previous: any = { id: 'identifier-prev' };
      d.resourcesRepo.findPrimaryIdentifierForUpdate.mockResolvedValue(
        previous,
      );

      const res = await d.service.registerIdentifier(RESOURCE, {
        ...dto,
        isPrimary: true,
      });

      expect(res.supersededIdentifierId).toBe('identifier-prev');
      expect(previous.effectiveTo).toBeInstanceOf(Date);
    });

    it('rejects the same identifier twice on the resource', async () => {
      const d = build();
      d.resourcesRepo.findResourceForUpdate.mockResolvedValue(activeResource());
      d.resourcesRepo.findIdentifier.mockResolvedValue({
        id: 'identifier-prev',
      });

      await expect(
        d.service.registerIdentifier(RESOURCE, dto),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses adding identifiers to a retired resource', async () => {
      const d = build();
      d.resourcesRepo.findResourceForUpdate.mockResolvedValue(
        activeResource({ lifecycleStatusConceptId: CONCEPTS.RESOURCE_RETIRED }),
      );

      await expect(
        d.service.registerIdentifier(RESOURCE, dto),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the resource does not exist', async () => {
      const d = build();
      d.resourcesRepo.findResourceForUpdate.mockResolvedValue(null);

      await expect(
        d.service.registerIdentifier(RESOURCE, dto),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('createRelationship (UC-52-05)', () => {
    const dto: any = {
      targetResourceId: TARGET,
      relationshipTypeConceptId: TYPE,
    };

    function wire(
      d: ReturnType<typeof build>,
      target = activeResource({ id: TARGET }),
    ) {
      const source = activeResource();
      d.resourcesRepo.findResourceForUpdate.mockImplementation(
        (_tx: any, id: string) =>
          Promise.resolve(
            id === RESOURCE ? source : id === TARGET ? target : null,
          ),
      );
      return { source, target };
    }

    it('links the two resources', async () => {
      const d = build();
      wire(d);

      const res = await d.service.createRelationship(RESOURCE, dto);

      expect(res).toEqual({
        id: 'relationship-1',
        sourceResourceId: RESOURCE,
        targetResourceId: TARGET,
        supersededRelationshipId: undefined,
      });
    });

    it('closes the previous live relationship of the same pair and type', async () => {
      const d = build();
      wire(d);
      const previous: any = { id: 'relationship-prev' };
      d.resourcesRepo.findLiveRelationshipForUpdate.mockResolvedValue(previous);

      const res = await d.service.createRelationship(RESOURCE, dto);

      expect(res.supersededRelationshipId).toBe('relationship-prev');
      expect(previous.effectiveTo).toBeInstanceOf(Date);
    });

    it('refuses relating a resource to itself', async () => {
      const d = build();

      await expect(
        d.service.createRelationship(RESOURCE, {
          ...dto,
          targetResourceId: RESOURCE,
        }),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses relating resources of different custodians', async () => {
      const d = build();
      wire(d, activeResource({ id: TARGET, custodianTenantId: 'otro-tenant' }));

      await expect(
        d.service.createRelationship(RESOURCE, dto),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses relating a retired resource', async () => {
      const d = build();
      wire(
        d,
        activeResource({
          id: TARGET,
          lifecycleStatusConceptId: CONCEPTS.RESOURCE_RETIRED,
        }),
      );

      await expect(
        d.service.createRelationship(RESOURCE, dto),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the target does not exist', async () => {
      const d = build();
      d.resourcesRepo.findResourceForUpdate.mockImplementation(
        (_tx: any, id: string) =>
          Promise.resolve(id === RESOURCE ? activeResource() : null),
      );

      await expect(
        d.service.createRelationship(RESOURCE, dto),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('createBinding (UC-52-06)', () => {
    const dto: any = {
      domainEntityTypeConceptId: TYPE,
      domainEntityId: DOMAIN_ENTITY,
    };

    it('binds the resource and leaves a lineage edge', async () => {
      const d = build();
      d.resourcesRepo.findResourceForUpdate.mockResolvedValue(activeResource());

      const res = await d.service.createBinding(RESOURCE, dto);

      expect(res).toEqual({
        id: 'binding-1',
        canonicalHealthResourceId: RESOURCE,
        bindingStatusConceptId: CONCEPTS.BINDING_BOUND,
        lineageEdgeId: 'edge-1',
      });
      expect(d.provenanceRepo.createLineageEdge).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          sourceId: VERSION,
          targetId: DOMAIN_ENTITY,
          transformationTypeConceptId: CONCEPTS.LINEAGE_BIND,
        }),
      );
    });

    it('refuses binding a resource with no live version', async () => {
      const d = build();
      d.resourcesRepo.findResourceForUpdate.mockResolvedValue(
        activeResource({ currentVersionId: undefined }),
      );

      await expect(
        d.service.createBinding(RESOURCE, dto),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects the same binding twice', async () => {
      const d = build();
      d.resourcesRepo.findResourceForUpdate.mockResolvedValue(activeResource());
      d.resourcesRepo.findBinding.mockResolvedValue({ id: 'binding-prev' });

      await expect(
        d.service.createBinding(RESOURCE, dto),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses binding a retired resource', async () => {
      const d = build();
      d.resourcesRepo.findResourceForUpdate.mockResolvedValue(
        activeResource({ lifecycleStatusConceptId: CONCEPTS.RESOURCE_RETIRED }),
      );

      await expect(
        d.service.createBinding(RESOURCE, dto),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the resource does not exist', async () => {
      const d = build();
      d.resourcesRepo.findResourceForUpdate.mockResolvedValue(null);

      await expect(
        d.service.createBinding(RESOURCE, dto),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('retireResource (UC-52-14)', () => {
    const dto: any = { reason: 'duplicado del recurso canónico principal' };

    it('retires the resource and closes its bindings and relationships', async () => {
      const d = build();
      const resource = activeResource();
      const binding: any = { id: 'binding-1' };
      const relationship: any = { id: 'relationship-1' };
      d.resourcesRepo.findResourceForUpdate.mockResolvedValue(resource);
      d.resourcesRepo.findLiveBindingsForUpdate.mockResolvedValue([binding]);
      d.resourcesRepo.findLiveRelationshipsForUpdate.mockResolvedValue([
        relationship,
      ]);

      const res = await d.service.retireResource(RESOURCE, dto, actor);

      expect(res).toEqual({
        id: RESOURCE,
        lifecycleStatusConceptId: CONCEPTS.RESOURCE_RETIRED,
        closedBindings: 1,
        closedRelationships: 1,
        provenanceRecordId: 'provenance-1',
      });
      expect(resource.lifecycleStatusConceptId).toBe(CONCEPTS.RESOURCE_RETIRED);
      expect(binding.endedAt).toBeInstanceOf(Date);
      expect(relationship.effectiveTo).toBeInstanceOf(Date);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('writes retirement provenance against the resource', async () => {
      const d = build();
      d.resourcesRepo.findResourceForUpdate.mockResolvedValue(activeResource());

      await d.service.retireResource(RESOURCE, dto, actor);

      expect(d.provenanceRepo.createProvenanceRecord).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ activityConceptId: CONCEPTS.PROV_RETIRE }),
      );
      expect(d.provenanceRepo.createProvenanceTarget).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          targetTypeConceptId: CONCEPTS.HD_ENTITY_CANONICAL_RESOURCE,
          targetId: RESOURCE,
        }),
      );
    });

    it('refuses retiring twice', async () => {
      const d = build();
      d.resourcesRepo.findResourceForUpdate.mockResolvedValue(
        activeResource({ lifecycleStatusConceptId: CONCEPTS.RESOURCE_RETIRED }),
      );

      await expect(
        d.service.retireResource(RESOURCE, dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('fails when the resource does not exist', async () => {
      const d = build();
      d.resourcesRepo.findResourceForUpdate.mockResolvedValue(null);

      await expect(
        d.service.retireResource(RESOURCE, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
