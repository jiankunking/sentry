import React from 'react';

type Props = {
  totals: null | number;
};

export default function ChartFooter(props: Props) {
  const {totals} = props;

  const isNumber = typeof totals === 'number';

  // TODO: style this
  return <div>Totals: {isNumber ? totals : '-'}</div>;
}
