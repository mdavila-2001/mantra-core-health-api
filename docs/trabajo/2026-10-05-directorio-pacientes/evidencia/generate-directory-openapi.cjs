// Generate only the directory contract from its real Nest controller and DTOs.
// No AppModule, ORM, environment loading or network connections are instantiated.
require('reflect-metadata');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS', moduleResolution: 'node', resolvePackageJsonExports: false } });
const fs = require('node:fs');
const path = require('node:path');
const { Test } = require('@nestjs/testing');
const { SwaggerModule, DocumentBuilder } = require('@nestjs/swagger');
const { dump } = require('js-yaml');
const { InsurerPatientsController } = require(path.join(process.cwd(), 'src/modules/insurance/controllers/insurer-patients.controller.ts'));
const { InsurerPatientsService } = require(path.join(process.cwd(), 'src/modules/insurance/services/insurer-patients.service.ts'));

(async () => {
  const moduleRef = await Test.createTestingModule({
    controllers: [InsurerPatientsController],
    providers: [{ provide: InsurerPatientsService, useValue: {} }],
  }).compile();
  const app = moduleRef.createNestApplication();
  try {
    await app.init();
    const fragment = SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('Patient directory').setVersion('1').addBearerAuth().build());
    const source = 'openapi/openapi.json';
    const document = JSON.parse(fs.readFileSync(source, 'utf8'));
    for (const key of Object.keys(document.paths)) {
      if (key === '/insurance/patients' || key.startsWith('/insurance/patients/')) delete document.paths[key];
    }
    for (const name of Object.keys(document.components.schemas)) {
      if (name.startsWith('InsurerPatient')) delete document.components.schemas[name];
    }
    Object.assign(document.paths, fragment.paths);
    Object.assign(document.components.schemas, fragment.components.schemas);
    for (const operations of Object.values(fragment.paths)) {
      for (const operation of Object.values(operations)) {
        for (const [status, name] of [['401', 'Unauthorized'], ['500', 'InternalServerError']]) {
          if (document.components.responses?.[name] && !operation.responses[status]) operation.responses[status] = { $ref: `#/components/responses/${name}` };
        }
      }
    }
    fs.writeFileSync(source, JSON.stringify(document, null, 2) + '\n');
    fs.writeFileSync('openapi/openapi.yaml', dump(document, { lineWidth: 120, noRefs: true }));
    console.log(`Generated ${Object.keys(fragment.paths).length} directory paths and ${Object.keys(fragment.components.schemas).length} schemas from real Nest metadata; other paths preserved.`);
  } finally { await app.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
