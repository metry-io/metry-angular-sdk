/**
  DateUtil
  --------

  This module provides helper function to create request periods from
  Javascript date objects.

  Typically, you use the getPeriod(dates, granularity) function, which in
  its turn calls an appropriate function, depending on the granularity.

  The dates parameter can be either a single date, which returns a single
  period (e.g. YYYYMMDD), or an array with two Dates (range), which returns
  a period range, (e.g. YYYYMM-YYYYMM)

  To parse a period into a date, use the getDate(period) function. This will
  return a Date with the provided period. Periods without months or days will
  have the missing value set to 1, i.e. getDate("2004") will return a the Date
  2014-01-01.
**/

var ObjectUtil = require('./object-util.js');

module.exports = {
  getDate: getDate,
  getHourPeriod: getHourPeriod,
  getDayPeriod: getDayPeriod,
  getMonthPeriod: getMonthPeriod,
  getPeriod: getPeriod,
  getYearPeriod: getYearPeriod,
  daysInMonth: daysInMonth,
  parseISO: parseISO,
  periodFromComponents: _periodFormat
};

function _zeroPaddedString(number) {
  if (number === null || number === undefined) { return ''; }

  return (number < 10 ? '0' : '') + number;
}

function _periodFormat(year, month, day, hour) {
  if (month !== null && month !== undefined) { month ++; }

  return _zeroPaddedString(year) +
         _zeroPaddedString(month) +
         _zeroPaddedString(day) +
         _zeroPaddedString(hour);
}

function periodsFormat(dates, func) {
  if (!ObjectUtil.isArray(dates)) { return func(dates); }
  return dates.map(func).join('-');
}

function getYearPeriod(dates) {
  return periodsFormat(dates, function(date) {
    return _periodFormat(date.getFullYear());
  });
}

function getMonthPeriod(dates) {
  return periodsFormat(dates, function(date) {
    return _periodFormat(date.getFullYear(), date.getMonth());
  });
}

function getDayPeriod(dates) {
  return periodsFormat(dates, function(date) {
    return _periodFormat(date.getFullYear(), date.getMonth(), date.getDate());
  });
}

function getHourPeriod(dates) {
  return periodsFormat(dates, function(date) {
    return _periodFormat(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours()
    );
  });
}
// Returns a period for the provided date range, or single date.
// Will auto-calculate period style depending on granularity, unless force is
// set to true.
// E.g. when getting day granularity for a single date, the function will assume
// you want day values for the date's month.

function getPeriod(dates, granularity, forced) {
  var isArray = ObjectUtil.isArray(dates);
  var isRange = (isArray && dates.length > 1);

  if ((isArray && dates.length === 0) || dates === null || dates === undefined) {
    return null;
  }

  if (granularity === 'month') {
    return (isRange || forced) ? getMonthPeriod(dates) : getYearPeriod(dates);
  }

  if (granularity === 'day') {
    return (isRange || forced) ? getDayPeriod(dates) : getMonthPeriod(dates);
  }

  if (granularity === 'week' && !isRange) {
    // Special case. Week is no actual granularity. This returns a week period
    // starting at the specified date. No checks are made to determine if the
    // provided date actually is the first day in a week.
    var start = (isArray) ? dates[0] : dates;
    var end = new Date(start.getTime());
    end.setDate(end.getDate() + 6);

    return getDayPeriod([start, end]);
  }

  return getDayPeriod(dates);
}

function getDate(period) {
  if (typeof period === 'number') { period = period.toString(); }
  if (period === null || period === undefined || period.length < 4) { return null; }

  var components = [parseInt(period.substr(0, 4), 10)];
  var i = 0, len = period.length;

  while (4 + (i * 2) < len) {
    components[i + 1] = parseInt(period.substr(4 + (2 * i), 2));
    i++;
  }

  return new Date(components[0],                          // hour
                  components[1] ? components[1] - 1 : 0,  // month
                  components[2] || 1,                     // day
                  components[3] || 0,                     // hour
                  components[4] || 0,                     // min
                  components[5] || 0);                    // second
}

// Helper function for returning the number of days in a month
function daysInMonth(date) {
  var d = new Date(date.getTime());
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);

  return d.getDate();
}

// IE and Safari fail at parsing ISO strings without : in time zone offset.
// This is a fix for that. This fix only accounts for whole hours in offset.
function parseISO(dateString) {
  var timestamp = Date.parse(dateString);

  if (!isNaN(timestamp)) {
    return new Date(timestamp);
  }

  var date, offsetString, offset;
  var components = dateString.slice(0,-5).split(/\D/).map(function(itm){
    return parseInt(itm, 10) || 0;
  });

  components[1]-= 1;
  offsetString = dateString.slice(-5);
  offset = parseInt(offsetString, 10) / 100;

  date = new Date(Date.UTC.apply(Date, components));
  date.setHours(date.getHours() - offset);
  return date;
}
