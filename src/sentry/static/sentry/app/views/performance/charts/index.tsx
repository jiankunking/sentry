import React from 'react';
import styled from '@emotion/styled';
import * as Sentry from '@sentry/browser';
import {Location} from 'history';
import {ECharts} from 'echarts';
import * as ReactRouter from 'react-router';

import {Organization} from 'app/types';
import {Client} from 'app/api';
import withApi from 'app/utils/withApi';
import getDynamicText from 'app/utils/getDynamicText';
import {Panel} from 'app/components/panels';
import EventView from 'app/views/eventsV2/eventView';
import {fetchTotalCount} from 'app/views/eventsV2/utils';

import Chart from './chart';
import Footer from './footer';

type Props = {
  api: Client;
  eventView: EventView;
  organization: Organization;
  location: Location;
  router: ReactRouter.InjectedRouter;
};

type State = {
  totalValues: null | number;
  eChartsInstances: ECharts[];
  toolTipPosition: [number, number] | undefined;
};

class Container extends React.Component<Props, State> {
  state: State = {
    totalValues: null,
    eChartsInstances: [],
    toolTipPosition: undefined,
  };

  componentDidMount() {
    this.mounted = true;

    this.fetchTotalCount();
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  mounted: boolean = false;

  async fetchTotalCount() {
    const {api, organization, location, eventView} = this.props;
    if (!eventView.isValid() || !this.mounted) {
      return;
    }

    try {
      const totals = await fetchTotalCount(
        api,
        organization.slug,
        eventView.getEventsAPIPayload(location)
      );

      if (this.mounted) {
        this.setState({totalValues: totals});
      }
    } catch (err) {
      Sentry.captureException(err);
    }
  }

  onEchartsReady = (chart: ECharts) => {
    this.setState(state => {
      return {
        ...state,
        eChartsInstances: [...state.eChartsInstances, chart],
      };
    });
  };

  render() {
    const {api, organization, location, eventView, router} = this.props;

    const apdexEventView = eventView.clone();
    apdexEventView.yAxis = 'apdex()';

    const rpmEventView = eventView.clone();
    rpmEventView.yAxis = 'rpm()';

    return (
      <Panel>
        <ChartsContainer>
          <React.Fragment>
            {getDynamicText({
              value: (
                <Chart
                  api={api}
                  organization={organization}
                  location={location}
                  eventView={apdexEventView}
                  onEchartsReady={this.onEchartsReady}
                  router={router}
                />
              ),
              fixed: 'performance charts left',
            })}
          </React.Fragment>
          <React.Fragment>
            {getDynamicText({
              value: (
                <Chart
                  api={api}
                  organization={organization}
                  location={location}
                  eventView={rpmEventView}
                  onEchartsReady={this.onEchartsReady}
                  router={router}
                />
              ),
              fixed: 'performance charts right',
            })}
          </React.Fragment>
        </ChartsContainer>
        <Footer totals={this.state.totalValues} />
      </Panel>
    );
  }
}

export const ChartsContainer = styled('div')`
  display: flex;
`;

export default withApi(Container);
