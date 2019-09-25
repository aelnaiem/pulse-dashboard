import React, { useState, useEffect } from 'react';

import { Line } from 'react-chartjs-2';
import { configureDownloadButtons } from '../../../assets/scripts/charts/chartJS/downloads';
import { COLORS } from '../../../assets/scripts/constants/colors';
import { monthNamesWithYearsFromNumbers } from '../../../utils/monthConversion';
import { sortAndFilterMostRecentMonths } from '../../../utils/dataOrganizing';
import { generateTrendlineDataset, getTooltipWithoutTrendline } from '../../../utils/trendline';
import {
  getGoalForChart, getMinForGoalAndData, getMaxForGoalAndData, trendlineGoalText,
  goalLabelContentString,
} from '../../../utils/metricGoal';

const RevocationAdmissionsSnapshot = (props) => {
  const [chartLabels, setChartLabels] = useState([]);
  const [chartDataPoints, setChartDataPoints] = useState([]);
  const [chartMinValue, setChartMinValue] = useState();
  const [chartMaxValue, setChartMaxValue] = useState();

  const GOAL = getGoalForChart('US_ND', 'revocation-admissions-snapshot-chart');
  const stepSize = 10;

  const processResponse = () => {
    const { revocationAdmissionsByMonth: countsByMonth } = props;

    if (countsByMonth) {
      const dataPoints = [];

      countsByMonth.forEach((data) => {
        const { year, month } = data;
        const newAdmissions = parseInt(data.new_admissions, 10);
        const technicals = parseInt(data.technicals, 10);
        const nonTechnicals = parseInt(data.non_technicals, 10);
        const unknownRevocations = parseInt(data.unknown_revocations, 10);
        const total = technicals + nonTechnicals + unknownRevocations + newAdmissions;
        const revocations = (technicals + nonTechnicals + unknownRevocations);
        const percentRevocations = (100 * (revocations / total)).toFixed(2);
        dataPoints.push({ year, month, percentRevocations });
      });

      const sorted = sortAndFilterMostRecentMonths(dataPoints, 13);
      const chartDataValues = sorted.map((element) => element.percentRevocations);
      const min = getMinForGoalAndData(GOAL.value, chartDataValues, stepSize);
      const max = getMaxForGoalAndData(GOAL.value, chartDataValues, stepSize);

      setChartLabels(monthNamesWithYearsFromNumbers(sorted.map((element) => element.month), true));
      setChartDataPoints(chartDataValues);
      setChartMinValue(min);
      setChartMaxValue(max);
    }
  };

  useEffect(() => {
    processResponse();
  }, [props.revocationAdmissionsByMonth]);

  const chart = (
    <Line
      id="revocation-admissions-snapshot-chart"
      data={{
        labels: chartLabels,
        datasets: [{
          label: 'data',
          backgroundColor: COLORS['blue-standard'],
          borderColor: COLORS['blue-standard'],
          pointBackgroundColor: COLORS['blue-standard'],
          pointRadius: 4,
          hitRadius: 5,
          fill: false,
          borderWidth: 2,
          lineTension: 0,
          data: chartDataPoints,
        }, generateTrendlineDataset(chartDataPoints, COLORS['blue-standard-light']),
        ],
      }}
      options={{
        legend: {
          display: false,
          position: 'right',
          labels: {
            usePointStyle: true,
            boxWidth: 5,
          },
        },
        tooltips: {
          enabled: true,
          mode: 'point',
          callbacks: {
            label: (tooltipItem, data) => (getTooltipWithoutTrendline(tooltipItem, data, '%')),
          },
        },
        scales: {
          xAxes: [{
            ticks: {
              fontColor: COLORS['grey-600'],
              autoSkip: false,
            },
            scaleLabel: {
              display: true,
              labelString: 'Month',
              fontColor: COLORS['grey-500'],
              fontStyle: 'bold',
            },
            gridLines: {
              color: '#FFF',
            },
          }],
          yAxes: [{
            ticks: {
              fontColor: COLORS['grey-600'],
              min: chartMinValue,
              max: chartMaxValue,
              stepSize,
            },
            scaleLabel: {
              display: true,
              labelString: '% of admissions',
              fontColor: COLORS['grey-500'],
              fontStyle: 'bold',
            },
            gridLines: {
              color: COLORS['grey-300'],
            },
          }],
        },
        annotation: {
          drawTime: 'afterDatasetsDraw',
          events: ['click'],

          // Array of annotation configuration objects
          // See below for detailed descriptions of the annotation options
          annotations: [{
            type: 'line',
            mode: 'horizontal',
            value: GOAL.value,

            // optional annotation ID (must be unique)
            id: 'revocation-admissions-snapshot-goal-line',
            scaleID: 'y-axis-0',

            drawTime: 'afterDatasetsDraw',

            borderColor: COLORS['red-standard'],
            borderWidth: 2,
            borderDash: [2, 2],
            borderDashOffset: 5,
            label: {
              enabled: true,
              content: goalLabelContentString(GOAL),
              position: 'right',

              // Background color of label, default below
              backgroundColor: 'rgba(0, 0, 0, 0)',

              fontFamily: 'sans-serif',
              fontSize: 12,
              fontStyle: 'bold',
              fontColor: COLORS['red-standard'],

              // Adjustment along x-axis (left-right) of label relative to above
              // number (can be negative). For horizontal lines positioned left
              // or right, negative values move the label toward the edge, and
              // positive values toward the center.
              xAdjust: 0,

              // Adjustment along y-axis (top-bottom) of label relative to above
              // number (can be negative). For vertical lines positioned top or
              // bottom, negative values move the label toward the edge, and
              // positive values toward the center.
              yAdjust: 10,
            },

            onClick(e) { return e; },
          }],
        },
      }}
    />
  );

  const exportedStructureCallback = function exportedStructureCallback() {
    return {
      metric: 'percentage-of-admissions-from-revocations',
      series: [],
    };
  };
  configureDownloadButtons('revocationAdmissions', 'Snapshot', chart.props,
    document.getElementById('revocation-admissions-snapshot-chart'), exportedStructureCallback);

  const header = document.getElementById(props.header);
  const trendlineValues = chart.props.data.datasets[1].data;
  const trendlineText = trendlineGoalText(trendlineValues, GOAL);

  if (header) {
    const title = `The percent of prison admissions due to revocations of probation and parole has been <b style='color:#809AE5'>trending ${trendlineText}.</b>`;
    header.innerHTML = title;
  }

  return (chart);
};

export default RevocationAdmissionsSnapshot;
