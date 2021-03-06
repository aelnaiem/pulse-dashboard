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
import * as $ from 'jquery';
import { Bar } from 'react-chartjs-2';

import { COLORS, COLORS_FIVE_VALUES } from '../../../assets/scripts/constants/colors';
import { configureDownloadButtons } from '../../../assets/scripts/utils/downloads';
import { toHtmlFriendly, toHumanReadable, toInt } from '../../../utils/transforms/labels';

const RevocationCountByOfficer = (props) => {
  const [chartLabels, setChartLabels] = useState([]);
  const [absconsionDataPoints, setAbsconsionDataPoints] = useState([]);
  const [newOffenseDataPoints, setNewOffenseDataPoints] = useState([]);
  const [technicalDataPoints, setTechnicalDataPoints] = useState([]);
  const [unknownDataPoints, setUnknownDataPoints] = useState([]);
  const [allChartData, setAllChartData] = useState({});
  const [visibleOfficeName, setvisibleOfficeName] = useState('');
  const [displayOfficerIds, setDisplayOfficerIds] = useState(true);
  const chartId = 'revocationsByOfficer';

  /**
   * Organizes the labels and data points so the chart can display the values
   * for the officers in the given `visibleOffice`.
   * `dataPoints` must be a dictionary where the office names are the keys,
   * and the values are arrays of dictionaries with values for the following keys:
   *    - officerID
   *    - violationsByType
   * Returns an array of officer ID labels and a dictionary of data points for
   * each violation type.
   */
  function getDataForVisibleOffice(dataPoints, visibleOffice) {
    const officerLabels = [];
    const officerViolationCountsByType = {
      ABSCONDED: [],
      FELONY: [],
      TECHNICAL: [],
      UNKNOWN_VIOLATION_TYPE: [],
    };

    let visibleOfficeData = [];

    if (visibleOffice === 'All-Officers') {
      Object.keys(dataPoints).forEach((office) => {
        dataPoints[office].forEach((officerData) => {
          visibleOfficeData.push(officerData);
        });
      });
    } else {
      visibleOfficeData = dataPoints[visibleOffice];
    }

    if (visibleOfficeData) {
      const sortedDataPoints = visibleOfficeData.sort((a, b) => (
        a.officerId - b.officerId));

      for (let i = 0; i < sortedDataPoints.length; i += 1) {
        officerLabels.push(sortedDataPoints[i].officerId);
        const revocationCountsByType = sortedDataPoints[i].violationsByType;
        Object.keys(revocationCountsByType).forEach((violationType) => {
          officerViolationCountsByType[violationType].push(revocationCountsByType[violationType]);
        });
      }
    }

    return { officerLabels, officerViolationCountsByType };
  }

  /**
   * Sets the labels and data points of the chart to display the values for the
   * officers in the given `visibleOffice`.
   */
  function setDataForVisibleOffice(
    officerLabels, officerViolationCountsByType, visibleOffice,
  ) {
    if (visibleOffice === 'All-Officers') {
      setDisplayOfficerIds(false);
    } else {
      setDisplayOfficerIds(true);
    }

    setvisibleOfficeName(visibleOffice);
    setChartLabels(officerLabels);
    setAbsconsionDataPoints(officerViolationCountsByType.ABSCONDED);
    setNewOffenseDataPoints(officerViolationCountsByType.FELONY);
    setTechnicalDataPoints(officerViolationCountsByType.TECHNICAL);
    setUnknownDataPoints(officerViolationCountsByType.UNKNOWN_VIOLATION_TYPE);
  }

  function configureDownloads(
    officerLabels, officerViolationCountsByType, visibleOffice,
  ) {
    const exportedStructureCallback = () => (
      {
        office: visibleOffice,
        metric: 'Revocation counts by officer',
        series: [],
      });

    const downloadableDataFormat = [
      {
        label: 'Absconsion',
        data: officerViolationCountsByType.ABSCONDED,
      },
      {
        label: 'New Offense',
        data: officerViolationCountsByType.FELONY,
      },
      {
        label: 'Technical',
        data: officerViolationCountsByType.TECHNICAL,
      },
      {
        label: 'Unknown Type',
        data: officerViolationCountsByType.UNKNOWN_VIOLATION_TYPE,
      },
    ];

    const humanReadableOfficerLabels = officerLabels.map((element) => `Officer ${element}`);
    const officeReadable = toHumanReadable(visibleOffice).toUpperCase();
    const chartTitle = `REVOCATIONS BY OFFICER - ${officeReadable} - 60 DAYS`;

    const convertValuesToNumbers = false;
    configureDownloadButtons(chartId, chartTitle,
      downloadableDataFormat, humanReadableOfficerLabels, document.getElementById(chartId),
      exportedStructureCallback, convertValuesToNumbers);
  }

  const processResponse = () => {
    const { revocationCountsByOfficer, officeData, dropdownId } = props;
    const offices = {};
    const officeIds = [];

    if (officeData) {
      officeData.forEach((office) => {
        const {
          site_id: officeId,
          site_name: officeName,
        } = office;

        offices[officeId] = toHtmlFriendly(officeName);
        officeIds.push(officeId);
      });
    }

    const dataPoints = {};
    if (revocationCountsByOfficer) {
      revocationCountsByOfficer.forEach((data) => {
        const {
          officer_external_id: officerIDRaw, absconsion_count: absconsionCount,
          felony_count: felonyCount, technical_count: technicalCount,
          unknown_count: unknownCount, site_id: officeId,
        } = data;

        const violationsByType = {
          ABSCONDED: toInt(absconsionCount),
          FELONY: toInt(felonyCount),
          TECHNICAL: toInt(technicalCount),
          UNKNOWN_VIOLATION_TYPE: toInt(unknownCount),
        };

        let officeName = offices[toInt(officeId)];
        if (officeName && officerIDRaw !== 'OFFICER_UNKNOWN') {
          officeName = toHtmlFriendly(officeName);
          const officerId = toInt(officerIDRaw);
          if (dataPoints[officeName] == null) {
            dataPoints[officeName] = [];
          }
          dataPoints[officeName].push({
            officerId,
            violationsByType,
          });
        }
      });
    }

    // Disable any office name from the dropdown menu if there is no data
    // for that office
    Object.values(offices).forEach((officeName) => {
      if (!dataPoints[officeName]) {
        $(`#${dropdownId}-${officeName}`).addClass('disabled');
      }
    });

    // Show data for the first office name that has data
    const visibleOffice = 'All-Officers';
    dataPoints[visibleOffice] = [];
    const {
      officerLabels, officerViolationCountsByType,
    } = getDataForVisibleOffice(dataPoints, visibleOffice);
    setDataForVisibleOffice(officerLabels, officerViolationCountsByType, visibleOffice);
    configureDownloads(officerLabels, officerViolationCountsByType, visibleOffice);
    setAllChartData(dataPoints);
  };

  useEffect(() => {
    processResponse();
  }, [props.revocationCountsByOfficer]);

  const chart = (
    <Bar
      id={chartId}
      redraw // This forces a redraw of the entire chart on every change
      data={{
        labels: chartLabels,
        datasets: [{
          label: 'Absconsion',
          backgroundColor: COLORS_FIVE_VALUES[0],
          hoverBackgroundColor: COLORS_FIVE_VALUES[0],
          hoverBorderColor: COLORS_FIVE_VALUES[0],
          data: absconsionDataPoints,
        }, {
          label: 'New Offense',
          backgroundColor: COLORS_FIVE_VALUES[1],
          hoverBackgroundColor: COLORS_FIVE_VALUES[1],
          hoverBorderColor: COLORS_FIVE_VALUES[1],
          data: newOffenseDataPoints,
        }, {
          label: 'Technical',
          backgroundColor: COLORS_FIVE_VALUES[2],
          hoverBackgroundColor: COLORS_FIVE_VALUES[2],
          hoverBorderColor: COLORS_FIVE_VALUES[2],
          data: technicalDataPoints,
        }, {
          label: 'Unknown Type',
          backgroundColor: COLORS_FIVE_VALUES[3],
          hoverBackgroundColor: COLORS_FIVE_VALUES[3],
          hoverBorderColor: COLORS_FIVE_VALUES[3],
          data: unknownDataPoints,
        },
        ],
      }}
      options={{
        responsive: true,
        legend: {
          position: 'bottom',
          boxWidth: 10,
        },
        tooltips: {
          backgroundColor: COLORS['grey-800-light'],
          mode: 'index',
          intersect: false,
          callbacks: {
            title: (tooltipItem) => ('Officer '.concat(tooltipItem[0].label)),
          },
        },
        scales: {
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Officer ID',
            },
            stacked: true,
            ticks: {
              display: displayOfficerIds,
            },
          }],
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Revocation count',
            },
            stacked: true,
            ticks: {
              stepSize: 1,
            },
          }],
        },
      }}
    />
  );

  const processDatasetChange = (officeName) => {
    const {
      officerLabels, officerViolationCountsByType,
    } = getDataForVisibleOffice(allChartData, officeName);
    setDataForVisibleOffice(officerLabels, officerViolationCountsByType, officeName);
    configureDownloads(officerLabels, officerViolationCountsByType, officeName);
  };

  // Set the dropdown toggle text to be the visible office name
  $(`#${props.dropdownId}`).text(toHumanReadable(visibleOfficeName));

  Object.keys(allChartData).forEach((officeName) => {
    const dropdownItemId = `${props.dropdownId}-${officeName}`;
    const dropdownItem = document.getElementById(dropdownItemId);
    if (dropdownItem) {
      // Configure the callback for each dropdown item to change the visible dataset
      dropdownItem.onclick = function changeDataset() {
        processDatasetChange(officeName);
      };

      // Set the active dropdown item to be the visible office name
      if (officeName === visibleOfficeName) {
        $(`#${dropdownItemId}`).addClass('active');
      } else {
        $(`#${dropdownItemId}`).removeClass('active');
      }
    }
  });


  return chart;
};


export default RevocationCountByOfficer;
