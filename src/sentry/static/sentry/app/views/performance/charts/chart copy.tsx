import React from 'react';
import styled from '@emotion/styled';
import {Location} from 'history';
import {ECharts} from 'echarts';

import isEqual from 'lodash/isEqual';

import {Client} from 'app/api';
import {getParams} from 'app/components/organizations/globalSelectionHeader/getParams';
import {getUtcToLocalDateObject} from 'app/utils/dates';
import {getInterval} from 'app/components/charts/utils';
import EventsRequest from 'app/views/events/utils/eventsRequest';
import theme from 'app/utils/theme';
import {IconWarning} from 'app/icons';
import LoadingIndicator from 'app/components/loadingIndicator';
import {Organization} from 'app/types';
import EventView from 'app/views/eventsV2/eventView';
import AreaChart from 'app/components/charts/areaChart';

type Props = {
  api: Client;
  organization: Organization;
  location: Location;
  eventView: EventView;
  onEchartsReady: (chart: ECharts) => void;
  onToolTipPosition: (position: [number, number] | undefined) => void;
};

class Chart extends React.Component<Props> {
  shouldComponentUpdate(nextProps) {
    // We pay for the cost of the deep comparison here since it is cheaper
    // than the cost for rendering the graph, which can take ~200ms to ~300ms to
    // render.

    return !isEqual(this.getRefreshProps(this.props), this.getRefreshProps(nextProps));
  }

  getRefreshProps(props: Props) {
    // get props that are relevant to the API payload for the graph

    const {organization, location, eventView} = props;

    const apiPayload = eventView.getEventsAPIPayload(location);

    const query = apiPayload.query;
    const start = apiPayload.start ? getUtcToLocalDateObject(apiPayload.start) : null;
    const end = apiPayload.end ? getUtcToLocalDateObject(apiPayload.end) : null;
    const period: string | undefined = apiPayload.statsPeriod as any;

    return {
      organization,
      apiPayload,
      query,
      start,
      end,
      period,
      project: eventView.project,
      environment: eventView.environment,
      yAxis: eventView.getYAxis(),
    };
  }

  handleChartReady = (chart: ECharts) => {
    console.log('lol', chart);

    this.props.onEchartsReady(chart);

    // chart.on('mousemove', 'tooltip', params => {
    //   console.log('params', params);
    // });

    // chart.dispatchAction({
    //   type: 'takeGlobalCursor',
    //   key: 'dataZoomSelect',
    //   dataZoomSelectActive: true,
    // });

    // callIfFunction(this.props.onChartReady, chart);
  };

  getTooltipConfig = () => {
    return {
      position: (pos, _params, dom, _rec, _size) => {
        // console.log('_params', _params);

        const positionCoords: [number, number] = [pos[0], pos[1]];
        this.props.onToolTipPosition(positionCoords);

        // Center the tooltip slightly above the cursor.
        const tipWidth = dom.clientWidth;
        const tipHeight = dom.clientHeight;
        return [pos[0] - tipWidth / 2, pos[1] - tipHeight - 16];
      },
    };
  };

  render() {
    const {api, location} = this.props;
    const {
      query,
      start,
      end,
      period,
      organization,
      project,
      environment,
      yAxis,
    } = this.getRefreshProps(this.props);

    return (
      <Container>
        <EventsRequest
          organization={organization}
          api={api}
          query={query}
          start={start}
          end={end}
          period={period}
          interval={getInterval({start, end, period}, true)}
          project={project as number[]}
          environment={environment as string[]}
          includePrevious={false}
          yAxis={yAxis}
        >
          {({loading, reloading, timeseriesData, errored}) => {
            if (errored) {
              // TODO: style this
              return (
                <div>
                  <IconWarning color={theme.gray2} size="lg" />
                </div>
              );
            }

            if (loading || reloading) {
              // TODO: style this
              return (
                <div>
                  <LoadingIndicator mini />
                </div>
              );
            }

            const {utc} = getParams(location.query);

            if (timeseriesData && timeseriesData.length > 0) {
              timeseriesData[0].seriesName = yAxis;
            }

            // const data = (timeseriesData || []).map(series => {
            //   return {
            //     ...series,
            //     // areaStyle: {
            //     //   opacity: 0.4,
            //     // },
            //     // lineStyle: {
            //     //   opacity: 1,
            //     //   width: 1.5,
            //     // },
            //     // smooth: true,
            //   };
            // });

            // TODO: copy from eventsChart.jsx and miniGraph.tsx

            // const legend = {
            //   right: 16,
            //   top: 16,
            //   selectedMode: false,
            //   icon: 'circle',
            //   itemHeight: 8,
            //   itemWidth: 8,
            //   itemGap: 12,
            //   align: 'left',
            //   textStyle: {
            //     verticalAlign: 'top',
            //     fontSize: 11,
            //     fontFamily: 'Rubik',
            //   },
            //   data: ['Current'],
            // };

            return (
              <div>
                <AreaChart
                  series={[...timeseriesData]}
                  seriesOptions={{
                    showSymbol: false,
                  }}
                  grid={{
                    left: '24px',
                    right: '24px',
                    top: '24px',
                    bottom: '12px',
                  }}
                  utc={utc === 'true'}
                  isGroupedByDate
                  showTimeInTooltip
                  onChartReady={this.handleChartReady}
                  tooltip={this.getTooltipConfig()}
                />
              </div>
            );
          }}
        </EventsRequest>
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
