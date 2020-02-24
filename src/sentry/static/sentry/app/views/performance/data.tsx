import {t} from 'app/locale';
import {NewQuery} from 'app/types';
import {Location} from 'history';

export const PERFORMANCE_EVENT_VIEW: Readonly<NewQuery> = {
  id: undefined,
  name: t('Performance'),
  query: 'event.type:transaction',
  projects: [],
  fields: [
    'transaction',
    'project',
    'rpm()',
    'error_rate',
    'p95()',
    'avg(transaction.duration)',
    'apdex()',
    'impact()',
  ],
  version: 2,
};

export function generatePerformanceQuery(location: Location): Readonly<NewQuery> {
  const extra: {[key: string]: string} = {};

  const {query} = location;

  if (!query?.statsPeriod) {
    extra.range = '24h';
  }

  if (!query?.sort) {
    extra.orderby = '-avg_transaction_duration';
  } else {
    const sort = query?.sort;
    extra.orderby =
      Array.isArray(sort) && sort.length > 0
        ? sort[sort.length - 1]
        : typeof sort === 'string'
        ? sort
        : '-avg_transaction_duration';
  }

  return Object.assign({}, PERFORMANCE_EVENT_VIEW, extra);
}
