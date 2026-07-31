import { bootstrapWorker } from './worker/bootstrap';
import { TimeSeriesWorkerModule } from './worker/jobs/time_series/time_series.worker-module';

void bootstrapWorker(TimeSeriesWorkerModule, 'time_series');
