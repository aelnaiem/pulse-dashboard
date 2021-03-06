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

import React, { Component } from 'react';
import {
  ComposableMap,
  ZoomableGroup,
  Geographies,
  Geography,
} from 'react-simple-maps';
import ReactTooltip from 'react-tooltip';
import { geoAlbersUsa } from 'd3-geo';

import { COLORS } from '../../../assets/scripts/constants/colors';
import { configureDownloadButtons } from '../../../assets/scripts/utils/downloads';
import geographyObject from '../../../assets/static/maps/us_nd.json';
import { colorForValue, countyNameFromCode } from '../../../utils/charts/choropleth';
import { toInt } from '../../../utils/transforms/labels';

const chartId = 'revocationsByCounty';

const centerNDLong = -100.5;
const centerNDLat = 47.3;

function revocationCountForCounty(chartDataPoints, countyName) {
  const revocationsForCounty = chartDataPoints[countyName.toUpperCase()];
  if (revocationsForCounty) {
    return revocationsForCounty;
  }

  return 0;
}

class RevocationsByCounty extends Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.revocationsByCounty = this.props.revocationsByCounty;
    this.chartDataPoints = {};
    this.maxValue = -1e100;

    if (this.revocationsByCounty) {
      this.revocationsByCounty.forEach((data) => {
        const {
          state_code: stateCode,
          county_code: countyCode,
          revocation_count: revocationCount,
        } = data;

        const revocationCountNum = toInt(revocationCount);

        if (countyCode !== 'UNKNOWN_COUNTY') {
          if (revocationCountNum > this.maxValue) {
            this.maxValue = revocationCountNum;
          }
          const standardCountyName = countyNameFromCode(stateCode, countyCode);
          this.chartDataPoints[standardCountyName] = revocationCountNum;
        }
      });
    }
  }

  componentDidMount() {
    const exportedStructureCallback = () => (
      {
        metric: 'Revocations by county',
        series: [],
      });

    const downloadableDataFormat = [{
      data: Object.values(this.chartDataPoints),
      label: 'revocationsByCounty',
    }];

    configureDownloadButtons(chartId, 'REVOCATIONS BY COUNTY - 60 DAYS',
      downloadableDataFormat,
      Object.keys(this.chartDataPoints),
      document.getElementById(chartId), exportedStructureCallback);

    setTimeout(() => {
      ReactTooltip.rebuild();
    }, 100);
  }

  render() {
    return (
      <div className="map-container" id={chartId}>
        <ComposableMap
          projection={geoAlbersUsa}
          projectionConfig={{ scale: 1000 }}
          width={980}
          height={500}
          style={{
            width: '100%',
            height: 'auto',
          }}
        >
          <ZoomableGroup center={[centerNDLong, centerNDLat]} zoom={7} disablePanning>
            <Geographies geography={geographyObject}>
              {(geographies, projection) => geographies.map((geography) => (
                <Geography
                  key={geography.properties.NAME}
                  data-tip={geography.properties.NAME
                    + ': '.concat(revocationCountForCounty(this.chartDataPoints, geography.properties.NAME))}
                  geography={geography}
                  projection={projection}
                  style={{
                    default: {
                      fill: colorForValue(
                        revocationCountForCounty(this.chartDataPoints, geography.properties.NAME),
                        geography.properties.NAME,
                        this.maxValue, false,
                      ),
                      stroke: COLORS['grey-700'],
                      strokeWidth: 0.2,
                      outline: 'none',
                    },
                    hover: {
                      fill: colorForValue(
                        revocationCountForCounty(this.chartDataPoints, geography.properties.NAME),
                        geography.properties.NAME,
                        this.maxValue, true,
                      ),
                      stroke: COLORS['grey-700'],
                      strokeWidth: 0.2,
                      outline: 'none',
                    },
                    pressed: {
                      fill: '#CFD8DC',
                      stroke: COLORS['grey-700'],
                      strokeWidth: 0.2,
                      outline: 'none',
                    },
                  }}
                />
              ))
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
        <ReactTooltip />
      </div>
    );
  }
}

export default RevocationsByCounty;
