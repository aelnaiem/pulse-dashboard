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

/**
 * Utilities for automatically refreshing metric caches on a scheduled interval.
 *
 * Metrics are cached in memory as they are updated relatively infrequently (on the order of hours),
 * in /server/core/metricsApi.js. Invoking the metricsApi.fetch methods performs a cache check: if
 * the TTL has expired then the metrics are re-retrieved and cached again. Otherwise, the cached
 * metrics are returned straight away. Because of this, some of these refresh calls do not actually
 * trigger a refresh. Note that the metric caches do not reset the TTL on reads, so this is okay.
 */

const metricsApi = require('./metricsApi');
const demoMode = require('../utils/demoMode');

const isDemoMode = demoMode.isDemoMode();

const METRIC_REFRESH_INTERVAL_MS = 1000 * 60 * 30; // Refresh metrics every 30 minutes
const CACHED_STATE_CODES = [
  'US_MO',
  'US_ND',
];

/**
 * Performs a refresh of the free through recovery metrics cache, logging success or failure.
 */
function refreshFreeThroughRecoveryMetrics() {
  CACHED_STATE_CODES.forEach((stateCode) => {
    metricsApi.fetchFreeThroughRecoveryMetrics(isDemoMode, stateCode, (err, data) => {
      if (err) {
        console.log(`Encountered error during scheduled fetch-and-cache
          of Free Through Recovery metrics for ${stateCode}: ${err}`);
      } else {
        console.log(`Executed scheduled fetch-and-cache of Free Through Recovery metrics for ${stateCode}`);
      }
    });
  });
}

/**
 * Performs a refresh of the reincarceration metrics cache, logging success or failure.
 */
function refreshReincarcerationMetrics() {
  CACHED_STATE_CODES.forEach((stateCode) => {
    metricsApi.fetchReincarcerationMetrics(isDemoMode, stateCode, (err, data) => {
      if (err) {
        console.log(`Encountered error during scheduled fetch-and-cache
          of reincarceration metrics for ${stateCode}: ${err}`);
      } else {
        console.log(`Executed scheduled fetch-and-cache of reincarceration metrics for ${stateCode}`);
      }
    });
  });
}

/**
 * Performs a refresh of the revocation metrics cache, logging success or failure.
 */
function refreshRevocationMetrics() {
  CACHED_STATE_CODES.forEach((stateCode) => {
    metricsApi.fetchRevocationMetrics(isDemoMode, stateCode, (err, data) => {
      if (err) {
        console.log(`Encountered error during scheduled fetch-and-cache
          of revocation metrics for ${stateCode}: ${err}`);
      } else {
        console.log(`Executed scheduled fetch-and-cache of revocation metrics for ${stateCode}`);
      }
    });
  });
}

/**
 * Performs a refresh of the snapshot metrics cache, logging success or failure.
 */
function refreshSnapshotMetrics() {
  CACHED_STATE_CODES.forEach((stateCode) => {
    metricsApi.fetchSnapshotMetrics(isDemoMode, stateCode, (err, data) => {
      if (err) {
        console.log(`Encountered error during scheduled fetch-and-cache
          of snapshot metrics for ${stateCode}: ${err}`);
      } else {
        console.log(`Executed scheduled fetch-and-cache of snapshot metrics for ${stateCode}`);
      }
    });
  });
}

/**
 * A convenience method for scheduling a task to execute on an infinite schedule, but invoking the
 * first execution now instead of waiting the initial interval.
 */
function executeAndSetInterval(fn, intervalMS) {
  fn();
  setInterval(fn, intervalMS);
}

if (!isDemoMode) {
  executeAndSetInterval(refreshFreeThroughRecoveryMetrics, METRIC_REFRESH_INTERVAL_MS);
  executeAndSetInterval(refreshReincarcerationMetrics, METRIC_REFRESH_INTERVAL_MS);
  executeAndSetInterval(refreshRevocationMetrics, METRIC_REFRESH_INTERVAL_MS);
  executeAndSetInterval(refreshSnapshotMetrics, METRIC_REFRESH_INTERVAL_MS);
}
