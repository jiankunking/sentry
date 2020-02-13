import {t} from 'app/locale';
import {NewQuery} from 'app/types';

export const PERFORMANCE_EVENT_VIEW: Readonly<NewQuery> = {
  id: undefined,
  name: t('Performance'),
  query: '',
  projects: [],
  fields: ['title', 'event.type', 'project', 'user', 'timestamp'],
  orderby: '-timestamp',
  version: 2,
  range: '24h',
};
