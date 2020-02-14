import React from 'react';
import {Location} from 'history';
import styled from '@emotion/styled';

import {t} from 'app/locale';
import {Organization} from 'app/types';
import {assert} from 'app/types/utils';
import {Client} from 'app/api';
import withApi from 'app/utils/withApi';
import space from 'app/styles/space';
import {Panel, PanelHeader, PanelItem} from 'app/components/panels';
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
      return (
        <SpanEntireRow>
          <LoadingIndicator />
        </SpanEntireRow>
      );
    }

    const hasResults =
      tableData && tableData.data && tableData.meta && tableData.data.length > 0;

    if (!hasResults) {
      return (
        <SpanEntireRow>
          <EmptyStateWarning>
            <p>{t('No transactions found')}</p>
          </EmptyStateWarning>
        </SpanEntireRow>
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
    const {organization, location} = this.props;
    const lastIndex = columnOrder.length - 1;
    return columnOrder.map((column, index) => {
      const fieldRenderer = getFieldRenderer(String(column.key), tableMeta);
      return (
        <BodyCell key={column.key} first={index === 0} last={index === lastIndex}>
          {fieldRenderer(row, {organization, location})}
        </BodyCell>
      );
    });
  };

  render() {
    return (
      <div>
        <Panel>
          <TableGrid>
            <HeadCell first>{t('Transaction Name')}</HeadCell>
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
            <HeadCell last>
              <NumericColumn>{t('User Impact')}</NumericColumn>
            </HeadCell>
            {this.renderResults()}
          </TableGrid>
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

const HeadCell = styled(PanelHeader)<{first?: boolean; last?: boolean}>`
  background-color: ${p => p.theme.offWhite};
  text-overflow: ellipsis;

  padding: ${props => {
    /* top | right | bottom | left */

    if (props.first) {
      return `${space(2)} ${space(1)} ${space(2)} ${space(2)}`;
    }

    if (props.last) {
      return `${space(2)} ${space(2)} ${space(2)} ${space(1)}`;
    }

    return `${space(2)} ${space(1)} ${space(2)} ${space(1)}`;
  }};
`;

const BodyCell = styled(PanelItem)<{first?: boolean; last?: boolean}>`
  text-overflow: ellipsis;

  padding: ${props => {
    /* top | right | bottom | left */

    if (props.first) {
      return `${space(2)} ${space(1)} ${space(2)} ${space(2)}`;
    }

    if (props.last) {
      return `${space(2)} ${space(2)} ${space(2)} ${space(1)}`;
    }

    return `${space(2)} ${space(1)} ${space(2)} ${space(1)}`;
  }};
`;

const SpanEntireRow = styled('div')`
  grid-column: 1 / -1;
`;

const NumericColumn = styled('div')`
  text-align: right;
`;

export default withApi(Table);
