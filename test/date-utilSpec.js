describe('DateUtil', function() {
  var DateUtill;
  var BASE_URL = 'http://dummy.local';

  beforeEach(module('metry'));

  beforeEach(function() {
    angular.module('metry')
      .constant('METRY_BASE_URL', BASE_URL)
      .value('METRY_AUTH_CONFIG', {disabled: true});
  });

  beforeEach(inject(function(mryDateUtil) {
    DateUtil = mryDateUtil;
  }));

  describe('Period format tests', function() {
    it('should format single periods correctly', function() {
      var date = new Date(1426511608541);

      expect(DateUtil.getPeriod(date, 'month')).toEqual('2015');
      expect(DateUtil.getPeriod(date, 'day')).toEqual('201503');
      expect(DateUtil.getPeriod(date, 'hour')).toEqual('20150316');
      expect(DateUtil.getHourPeriod(date)).toEqual('2015031614');
    });

    it('should format range periods correctly', function() {
      var startDate = new Date(1423919853690);
      var endDate = new Date(1426511608541);

      expect(DateUtil.getPeriod([startDate, endDate], 'month')).toEqual('201502-201503');
      expect(DateUtil.getPeriod([startDate, endDate], 'day')).toEqual('20150214-20150316');
      expect(DateUtil.getPeriod([startDate, endDate], 'hour')).toEqual('20150214-20150316');
      expect(DateUtil.getHourPeriod([startDate, endDate])).toEqual('2015021414-2015031614');
    });
  });

  describe('Period parsing tests', function() {
    it('should parse dates correctly', function() {
      var dayString = '19830206';
      var monthString = '199502';
      var yearString = '1999';
      var hourString = '200410151020';

      expect(DateUtil.getDate(dayString).getTime()).toEqual(413334000000);
      expect(DateUtil.getDate(monthString).getTime()).toEqual(791593200000);
      expect(DateUtil.getDate(yearString).getTime()).toEqual(915145200000);
      expect(DateUtil.getDate(hourString).getTime()).toEqual(1097828400000);
    });

    it('should return null if null given as input', function() {
      expect(DateUtil.getDate(null)).toBe(null);
    });
  });

  describe('ISO parsing test', function() {
    it('should parse ISO dates correctly', function() {
      var isoDateString = '2014-08-23T22:00+0000';

      expect(DateUtil.parseISO(isoDateString).getTime()).toEqual(1408831200000);
    });
  });
});
