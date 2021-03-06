// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2019 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';

import { COLORS } from '../../../assets/scripts/constants/colors';
import { configureDownloadButtons } from '../../../assets/scripts/utils/downloads';
import { filterFacilities } from '../../../utils/transforms/datasets';

const ReincarcerationRateByTransitionalFacility = (props) => {
  const [chartLabels, setChartLabels] = useState([]);
  const [chartDataPoints, setChartDataPoints] = useState([]);

  const chartId = 'reincarcerationRateByTransitionalFacility';

  const processResponse = () => {
    const { ratesByTransitionalFacility: ratesByFacility } = props;

    let dataPoints = [];
    if (ratesByFacility) {
      ratesByFacility.forEach((data) => {
        const {
          release_facility: facility,
          recidivism_rate: recidivismRate,
          state_code: stateCode,
        } = data;
        dataPoints.push([facility, recidivismRate, stateCode]);
      });
    }

    if (dataPoints.length > 0) {
      const stateCode = dataPoints[0][2];
      dataPoints = filterFacilities(dataPoints, 'TRANSITIONAL', stateCode);
    }

    // Sort by recidivism rate
    const sorted = dataPoints.sort((a, b) => (a[1] - b[1]));

    setChartLabels(sorted.map((element) => element[0]));
    setChartDataPoints(sorted.map((element) => element[1]));
  };

  useEffect(() => {
    processResponse();
  }, [props.ratesByTransitionalFacility]);

  const chart = (
    <Bar
      id={chartId}
      data={{
        labels: chartLabels,
        datasets: [{
          label: 'Reincarceration rate',
          backgroundColor: COLORS['blue-standard-2'],
          hoverBackgroundColor: COLORS['blue-standard-2'],
          yAxisID: 'y-axis-left',
          data: chartDataPoints,
        }],
      }}
      options={{
        responsive: true,
        legend: {
          display: false,
        },
        tooltips: {
          backgroundColor: COLORS['grey-800-light'],
          mode: 'index',
          callbacks: {
            label(tooltipItems, data) {
              const { index } = tooltipItems;
              if (data.datasets[tooltipItems.datasetIndex].label === 'Reincarceration rate') {
                return `${data.datasets[tooltipItems.datasetIndex].label}: ${(data.datasets[tooltipItems.datasetIndex].data[index] * 100).toFixed(2)}%`;
              }
              return `${data.datasets[tooltipItems.datasetIndex].label}: ${(data.datasets[tooltipItems.datasetIndex].data[index])}`;
            },
          },
        },
        scaleShowValues: true,
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true,
            },
            position: 'left',
            id: 'y-axis-left',
            scaleLabel: {
              display: true,
              labelString: 'Reincarceration rate',
            },
          }],
          xAxes: [{
            ticks: {
              autoSkip: false,
            },
            scaleLabel: {
              display: true,
              labelString: 'Facility',
            },
          }],
        },
      }}
    />
  );

  const exportedStructureCallback = () => (
    {
      metric: 'Reincarceration rate by transitional facility',
      series: [],
    });

  configureDownloadButtons(chartId, 'REINCARCERATION RATE BY TRANSITIONAL FACILITY',
    chart.props.data.datasets, chart.props.data.labels,
    document.getElementById(chartId), exportedStructureCallback);

  return chart;
};

export default ReincarcerationRateByTransitionalFacility;
