import React from 'react';

import {Organization} from 'app/types';
import withOrganization from 'app/utils/withOrganization';

type Props = {
  organization: Organization;
};

class PerformanceLanding extends React.Component<Props> {
  render() {
    console.log('props', this.props);
    return <div>foo</div>;
  }
}

export default withOrganization(PerformanceLanding);
