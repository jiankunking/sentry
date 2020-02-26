import React from 'react';
import styled from '@emotion/styled';
import {Location} from 'history';
import {ECharts} from 'echarts';
import * as ReactRouter from 'react-router';

import isEqual from 'lodash/isEqual';

import {Client} from 'app/api';
import {getParams} from 'app/components/organizations/globalSelectionHeader/getParams';
import {getUtcToLocalDateObject} from 'app/utils/dates';
import {Organization} from 'app/types';
import EventView from 'app/views/eventsV2/eventView';
import {EventsChart} from 'app/views/events/eventsChart';

type Props = {
  api: Client;
  organization: Organization;
  location: Location;
  eventView: EventView;
  router: ReactRouter.InjectedRouter;
  onEchartsReady: (chart: ECharts) => void;
};

class Chart extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    const {eventView, ...restProps} = this.props;
    const {eventView: nextEventView, ...restNextProps} = nextProps;

    if (!eventView.isEqualTo(nextEventView)) {
      return true;
    }

    return !isEqual(restProps, restNextProps);
  }

  render() {
    const {api, eventView, location, organization, router} = this.props;

    const yAxisValue = eventView.getYAxis();

    const globalSelection = eventView.getGlobalSelection();
    const start = globalSelection.start
      ? getUtcToLocalDateObject(globalSelection.start)
      : undefined;

    const end = globalSelection.end
      ? getUtcToLocalDateObject(globalSelection.end)
      : undefined;

    const {utc} = getParams(location.query);

    return (
      <Container>
        <EventsChart
          api={api}
          router={router}
          query={eventView.getEventsAPIPayload(location).query}
          organization={organization}
          yAxis={yAxisValue}
          projects={globalSelection.project}
          environments={globalSelection.environment}
          start={start}
          end={end}
          period={globalSelection.statsPeriod}
          utc={utc === 'true'}
        />
      </Container>
    );
  }
}

const Container = styled('div')`
  min-width: 50%;
  max-width: 50%;
  width: 50%;

  outline: 1px red solid;
`;

export default Chart;
