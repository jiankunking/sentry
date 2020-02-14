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
import {getFieldRenderer, MetaType} from 'app/views/eventsV2/utils';

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

    const hasResults =
      tableData && tableData.data && tableData.meta && tableData.data.length > 0;

    if (!hasResults) {
      return (
        <EmptyStateWarning>
          <p>{t('No transactions found')}</p>
        </EmptyStateWarning>
      );
    }

    assert(tableData);

    const columnOrder = this.props.eventView.getColumns();

    return tableData.data.map((row, index) => {
      assert(tableData.meta);
      return (
        <React.Fragment key={index}>
          {this.renderRowItem(row, columnOrder, tableData.meta)}
        </React.Fragment>
      );
    });
  };

  renderRowItem = (
    row: TableDataRow,
    columnOrder: TableColumn<React.ReactText>[],
    tableMeta: MetaType
  ) => {
    console.log('row', row, columnOrder);

    const {organization, location} = this.props;
    return (
      <PanelItem>
        <PanelRow>
          {columnOrder.map(column => {
            const fieldRenderer = getFieldRenderer(String(column.key), tableMeta);
            return (
              <ItemCell key={column.key}>
                {fieldRenderer(row, {organization, location})}
              </ItemCell>
            );
          })}
        </PanelRow>
      </PanelItem>
    );
  };

  render() {
    return (
      <div>
        <Panel>
          <TableGrid>
            <HeadCell>{t('Transaction Name')}</HeadCell>
            <HeadCell>{t('Project Name')}</HeadCell>
            <HeadCell>{t('Throughput')}</HeadCell>
            <HeadCell>
              <NumericColumn>{t('Error Rate')}</NumericColumn>
            </HeadCell>
            <HeadCell>
              <NumericColumn>{t('95th')}</NumericColumn>
            </HeadCell>
            <HeadCell>
              <NumericColumn>{t('Avg')}</NumericColumn>
            </HeadCell>
            <HeadCell>
              <NumericColumn>{t('Apdex')}</NumericColumn>
            </HeadCell>
            <HeadCell>
              <NumericColumn>{t('User Impact')}</NumericColumn>
            </HeadCell>
            <div>foo</div>
          </TableGrid>
        </Panel>
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
          <PanelBody>foo</PanelBody>
        </Panel>
        <Pagination pageLinks={this.state.pageLinks} />
      </div>
    );
  }
}

const TableGrid = styled('div')`
  display: grid;
  grid-template-columns: 4fr 2fr repeat(6, 1fr);
  width: 100%;
`;

const HeadCell = styled(PanelHeader)`
  background-color: ${p => p.theme.offWhite};
  text-overflow: ellipsis;
`;

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

const ItemCell = styled('div')`
  text-overflow: ellipsis;
`;

export default withApi(Table);
