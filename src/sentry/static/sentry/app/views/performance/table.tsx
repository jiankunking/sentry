import React from 'react';
import {Location} from 'history';
import styled from '@emotion/styled';

import {t} from 'app/locale';
import {Organization} from 'app/types';
import {assert} from 'app/types/utils';
import {Client} from 'app/api';
import withApi from 'app/utils/withApi';
import space from 'app/styles/space';
import {Panel, PanelHeader, PanelBody, PanelItem} from 'app/components/panels';
import LoadingIndicator from 'app/components/loadingIndicator';
import EmptyStateWarning from 'app/components/emptyStateWarning';
import Pagination from 'app/components/pagination';
import EventView from 'app/views/eventsV2/eventView';
import {TableData, TableDataRow, TableColumn} from 'app/views/eventsV2/table/types';

type Props = {
  api: Client;
  eventView: EventView;
  organization: Organization;
  location: Location;
};

type State = {
  isLoading: boolean;
  tableFetchID: symbol | undefined;
  error: null | string;
  pageLinks: null | string;
  tableData: TableData | null | undefined;
};

class Table extends React.Component<Props, State> {
  state: State = {
    isLoading: true,
    tableFetchID: undefined,
    error: null,

    pageLinks: null,
    tableData: null,
  };

  componentDidMount() {
    this.fetchData();
  }

  fetchData = () => {
    const {eventView, organization, location} = this.props;

    if (!eventView.isValid()) {
      return;
    }

    const url = `/organizations/${organization.slug}/eventsv2/`;
    const tableFetchID = Symbol('tableFetchID');
    const apiPayload = eventView.getEventsAPIPayload(location);

    this.setState({isLoading: true, tableFetchID});

    this.props.api
      .requestPromise(url, {
        method: 'GET',
        includeAllArgs: true,
        query: apiPayload,
      })
      .then(([data, _, jqXHR]) => {
        if (this.state.tableFetchID !== tableFetchID) {
          // invariant: a different request was initiated after this request
          return;
        }

        this.setState(prevState => {
          return {
            isLoading: false,
            tableFetchID: undefined,
            error: null,
            pageLinks: jqXHR ? jqXHR.getResponseHeader('Link') : prevState.pageLinks,
            tableData: data,
          };
        });
      })
      .catch(err => {
        this.setState({
          isLoading: false,
          tableFetchID: undefined,
          error: err.responseJSON.detail,
          pageLinks: null,
          tableData: null,
        });
        // TODO: implement
        // setError(err.responseJSON.detail);
      });
  };

  renderResults = () => {
    const {isLoading, tableData} = this.state;

    if (isLoading) {
      return <LoadingIndicator />;
    }

    const hasResults = tableData && tableData.data && tableData.data.length > 0;

    if (!hasResults) {
      return (
        <EmptyStateWarning>
          <p>{t('No transactions found')}</p>
        </EmptyStateWarning>
      );
    }

    assert(this.state.tableData);

    const columnOrder = this.props.eventView.getColumns();

    return this.state.tableData.data.map((row, index) => {
      return (
        <React.Fragment key={index}>
          {this.renderRowItem(row, columnOrder)}
        </React.Fragment>
      );
    });
  };

  renderRowItem = (row: TableDataRow, columnOrder: TableColumn<React.ReactText>[]) => {
    // console.log('row', row, columnOrder);
    return (
      <PanelItem>
        <PanelRow>foo</PanelRow>
      </PanelItem>
    );
  };

  render() {
    return (
      <div>
        <Panel>
          <PanelHeader>
            <PanelRow>
              <div>{t('Transaction Name')}</div>
              <div>{t('Project Name')}</div>
              <div>{t('Throughput')}</div>
              <NumericColumn>{t('Error Rate')}</NumericColumn>
              <NumericColumn>{t('95th')}</NumericColumn>
              <NumericColumn>{t('Avg')}</NumericColumn>
              <NumericColumn>{t('Apdex')}</NumericColumn>
              <NumericColumn>{t('User Impact')}</NumericColumn>
            </PanelRow>
          </PanelHeader>
          <PanelBody>{this.renderResults()}</PanelBody>
        </Panel>
        <Pagination pageLinks={this.state.pageLinks} />
      </div>
    );
  }
}

const PanelRow = styled('div')`
  display: grid;
  grid-template-columns: 4fr 2fr 1fr 1fr 1fr 1fr 1fr 1fr;
  grid-column-gap: ${space(1.5)};
  width: 100%;
  align-items: center;
`;

const NumericColumn = styled('div')`
  text-align: right;
`;

export default withApi(Table);
