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

import React from 'react';

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
  );
}

function normalizeDistrictName(district) {
  const normalized = district.replace('-', ' ');
  return toTitleCase(normalized);
}

class DistrictToggle extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.DistrictOption = this.DistrictOption.bind(this);
    this.DistrictList = this.DistrictList.bind(this);
  }

  handleChange(changeEvent) {
    const { value } = changeEvent.target;
    const { onDistrictUpdate } = this.props;
    onDistrictUpdate(value);
  }

  DistrictOption(props) {
    return <option value={props.value}>{normalizeDistrictName(props.value)}</option>
  }

  DistrictList() {
    const { districts } = this.props;
    districts.sort();

    const districtOptions = districts.map(
      (district) => <this.DistrictOption key={district} value={district} />,
    );
    return (
      <select id="district-toggle" className="form-control" onChange={this.handleChange}>
        <this.DistrictOption key="all" value="all" />
        {districtOptions}
      </select>
    );
  }

  render() {
    return (
      <form>
        <this.DistrictList />
      </form>
    );
  }
}

export default DistrictToggle;