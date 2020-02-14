import {t} from 'app/locale';
import {NewQuery} from 'app/types';
import {Location} from 'history';

const PERFORMANCE_EVENT_VIEW: Readonly<NewQuery> = {
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
  version: 2,
};

export function generatePerformanceQuery(location: Location): Readonly<NewQuery> {
  const extra: {[key: string]: string} = {};

  if (!location.query.statsPeriod) {
    extra.range = '24h';
  }

  if (!location.query.sort) {
    extra.orderby = '-avg_transaction_duration';
  } else {
    const sort = location.query.sort;
    extra.orderby =
      Array.isArray(sort) && sort.length > 0
        ? sort[sort.length - 1]
        : typeof sort === 'string'
        ? sort
        : '-avg_transaction_duration';
  }

  return Object.assign({}, PERFORMANCE_EVENT_VIEW, extra);
}
