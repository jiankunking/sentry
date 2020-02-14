import React from 'react';
import styled from '@emotion/styled';
import {Location} from 'history';

import {t} from 'app/locale';
import {Organization} from 'app/types';
import space from 'app/styles/space';
import withOrganization from 'app/utils/withOrganization';
import SentryDocumentTitle from 'app/components/sentryDocumentTitle';
import GlobalSelectionHeader from 'app/components/organizations/globalSelectionHeader';
import {PageContent} from 'app/styles/organization';
import NoProjectMessage from 'app/components/noProjectMessage';
import EventView from 'app/views/eventsV2/eventView';

import {generatePerformanceQuery} from './data';
import Table from './table';

type Props = {
  organization: Organization;
  location: Location;
};

type State = {
  eventView: EventView;
};

function generatePerformanceEventView(location: Location): EventView {
  return EventView.fromNewQueryWithLocation(generatePerformanceQuery(location), location);
}

class PerformanceLanding extends React.Component<Props, State> {
  static getDerivedStateFromProps(nextProps: Props): State {
    return {eventView: generatePerformanceEventView(nextProps.location)};
  }

  state = {
    eventView: generatePerformanceEventView(this.props.location),
  };

  render() {
    const {organization, location} = this.props;

    return (
      <SentryDocumentTitle title={t('Performance')} objSlug={organization.slug}>
        <React.Fragment>
          <GlobalSelectionHeader organization={organization} />
          <PageContent>
            <NoProjectMessage organization={organization}>
              <StyledPageHeader>{t('Performance')}</StyledPageHeader>
              <Table
                eventView={this.state.eventView}
                organization={organization}
                location={location}
              />
            </NoProjectMessage>
          </PageContent>
        </React.Fragment>
      </SentryDocumentTitle>
    );
  }
}

const StyledPageHeader = styled('div')`
  display: flex;
  align-items: center;
  font-size: ${p => p.theme.headerFontSize};
  color: ${p => p.theme.gray4};
  height: 40px;
  margin-bottom: ${space(1)};
`;

export default withOrganization(PerformanceLanding);
