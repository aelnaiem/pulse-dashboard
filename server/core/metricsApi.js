/**
 * Utilities for retrieving and caching metrics for the app.
 *
 * In the current implementation, metrics are stored in pre-processed json files in Google Cloud
 * Storage. Those files are pulled down and cached in memory with a TTL. That TTL is unaffected by
 * access to the cache, so files are re-fetched at a predictable cadence, allowing for updates to
 * those files to be quickly reflected in the app without frequent requests to GCS.
 */

var objectStorage = require('./objectStorage');
var cacheManager = require('cache-manager');

const BUCKET_NAME = process.env.METRIC_BUCKET;
const METRIC_CACHE_TTL_SECONDS = 60 * 60;  // Expire items in the cache after 1 hour

var memoryCache = cacheManager.caching({ store: 'memory', ttl: METRIC_CACHE_TTL_SECONDS });

const FILES_BY_METRIC_TYPE = {
  programEval: [
    'cost_effectiveness_by_program.json',
    'recidivism_rate_by_program.json',
  ],
  reincarceration: [
    'admissions_versus_releases_by_month.json',
    'reincarceration_rate_by_release_facility.json',
    'reincarceration_rate_by_stay_length.json',
    'reincarcerations_by_month.json',
  ],
  revocation: [
    'revocations_by_county_60_days.json',
    'revocations_by_officer_60_days.json',
    'admissions_by_type_60_days.json',
    'revocations_by_month.json',
    'revocations_by_race_60_days.json',
    'revocations_by_supervision_type_by_month.json',
    'revocations_by_violation_type_by_month.json',
  ],
  snapshot: [
    'admissions_by_type_by_month.json',
    'average_change_lsir_score_by_month.json',
    'avg_days_at_liberty_by_month.json',
    'supervision_termination_by_type_by_month.json',
  ],
};

/**
 * Retrieves all metric files for the given metric type from Google Cloud Storage.
 *
 * Returns a list of Promises, one per metric file for the given type, where each Promise will
 * eventually return either an error or an object with two keys:
 *   - `fileKey`: a unique key for identifying the metric file, e.g. 'revocations_by_month'
 *   - `contents`: the contents of the file deserialized into JS objects/arrays
 */
function fetchMetricsFromGCS(stateCode, metricType) {
  const promises = [];

  const files = FILES_BY_METRIC_TYPE[metricType];
  files.forEach(function (filename) {
    const fileKey = filename.replace('.json', '');
    promises.push(objectStorage.downloadFile(BUCKET_NAME, stateCode, filename)
    .then(function (contents) {
      return { fileKey: fileKey, contents: contents };
    }));
  });

  return promises;
}

/**
 * Retrieves the metrics for the given metric type and passes them into the given callback.
 *
 * The callback should be a function with a signature of `function (error, results)`. `results` is
 * a single object with keys mapping to individual metric files and values corresponding to the
 * deserialized contents of those files.
 *
 * First checks the cache to see if the metrics with the given type are already in memory and not
 * expired beyond the configured TTL. If not, then fetches the metrics for that type from the
 * appropriate files and invokes the callback only once all files have been retrieved.
 */
function fetchMetrics(stateCode, metricType, callback) {
  return memoryCache.wrap(metricType, function (cacheCb) {
      console.log(`Fetching ${metricType} metrics from GCS...`);
      const metricPromises = fetchMetricsFromGCS(stateCode, metricType);

      Promise.all(metricPromises).then(function (allFileContents) {
        console.log(`Fetched all ${metricType} metrics from GCS`);
        const results = {};
        allFileContents.forEach(function (contents) {
          console.log(`Fetched contents for fileKey: ${contents.fileKey}`);
          const deserializedFile = convertDownloadToJson(contents.contents);
          results[contents.fileKey] = deserializedFile;
        });

        cacheCb(null, results);
      });
  }, callback);
}

/**
 * Converts the given contents, a Buffer of bytes, into a JS object or array.
 */
function convertDownloadToJson(contents) {
  const stringContents = contents.toString();
  if (!stringContents || stringContents.length === 0) {
    return null;
  }

  const jsonObject = [];
  const splitStrings = stringContents.split('\n');
  splitStrings.forEach((line) => {
    if (line) {
      jsonObject.push(JSON.parse(line));
    }
  });

  return jsonObject;
}

function fetchSnapshotMetrics(callback) {
  return fetchMetrics('US_ND', 'snapshot', callback);
}

function fetchReincarcerationMetrics(callback) {
  return fetchMetrics('US_ND', 'reincarceration', callback);
}

function fetchRevocationMetrics(callback) {
  return fetchMetrics('US_ND', 'revocation', callback);
}

function fetchProgramEvalMetrics(callback) {
  return fetchMetrics('US_ND', 'programEval', callback);
}

module.exports = {
  fetchProgramEvalMetrics,
  fetchReincarcerationMetrics,
  fetchRevocationMetrics,
  fetchSnapshotMetrics,
};