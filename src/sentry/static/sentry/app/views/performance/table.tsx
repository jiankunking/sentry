import React from 'react';
import {Location} from 'history';

import {Organization} from 'app/types';
import {Client} from 'app/api';
import withApi from 'app/utils/withApi';
import {Panel, PanelHeader, PanelBody, PanelItem} from 'app/components/panels';
import EventView from 'app/views/eventsV2/eventView';
import LoadingIndicator from 'app/components/loadingIndicator';

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
  tableData: any | null | undefined;
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
    if (this.state.isLoading) {
      return <LoadingIndicator />;
    }

    return (
      <React.Fragment>
        <PanelItem>Panel Item</PanelItem>
        <PanelItem>Panel Item</PanelItem>
        <PanelItem>Panel Item</PanelItem>
      </React.Fragment>
    );
  };

  render() {
    console.log('tableData', this.state);
    return (
      <Panel>
        <PanelHeader>Panel Header</PanelHeader>

        <PanelBody>{this.renderResults()}</PanelBody>
      </Panel>
    );
  }
}

export default withApi(Table);
