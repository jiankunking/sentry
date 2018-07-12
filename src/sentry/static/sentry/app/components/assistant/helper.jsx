import React from 'react';
import styled from 'react-emotion';
import GuideDrawer from 'app/components/assistant/guideDrawer';
import SupportDrawer from 'app/components/assistant/supportDrawer';

/* AssistantHelper is responsible for rendering the guide and support drawers. */
export default class AssistantHelper extends React.Component {
  render() {
    return (
      <StyledHelper>
        <SupportDrawer />
        <GuideDrawer />
      </StyledHelper>
    );
  }
}

/* this globally controls the size of the component */
const StyledHelper = styled('div')`
  font-size: 1.4rem;
  @media (max-width: 600px) {
    display: none;
  }
`;
