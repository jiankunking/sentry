import {t} from 'app/locale';
import {NewQuery} from 'app/types';

export const PERFORMANCE_EVENT_VIEW: Readonly<NewQuery> = {
  id: undefined,
  name: t('Performance'),
  query: 'event.type:transaction',
  projects: [],
  fields: [
    'transaction',
    'project',
    // TODO: rename to rpm()
    'rpm',
    'error_rate',
    'p95()',
    'avg(transaction.duration)',
    'apdex',
    'impact',
  ],
  orderby: '-avg_transaction_duration',
  version: 2,
  range: '24h',
};
