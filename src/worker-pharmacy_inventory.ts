import { bootstrapWorker } from './worker/bootstrap';
import { PharmacyInventoryWorkerModule } from './worker/jobs/pharmacy_inventory/pharmacy-inventory.worker-module';

void bootstrapWorker(PharmacyInventoryWorkerModule, 'pharmacy_inventory');
