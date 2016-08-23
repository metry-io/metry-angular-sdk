describe('Metry Resource', function() {
  var mry, $httpBackend;
  var BASE_URL = 'http://dummy.local';

  beforeEach(module('metry'));

  beforeEach(function() {
    angular.module('metry')
      .constant('METRY_BASE_URL', BASE_URL)
      .value('METRY_AUTH_CONFIG', {disabled: true});
  });

  beforeEach(inject(function(_$httpBackend_, _mry_) {
    $httpBackend = _$httpBackend_;
    mry = _mry_;
  }));

  afterEach(function () {
    $httpBackend.verifyNoOutstandingRequest();
    $httpBackend.verifyNoOutstandingExpectation();
  });

  it('should create services with the all request methods', function() {
    var resource = mry('test');

    expect(resource.get).toBeDefined();
    expect(resource.save).toBeDefined();
    expect(resource.query).toBeDefined();
    expect(resource.delete).toBeDefined();
    expect(resource.batch).toBeDefined();
    expect(resource.of).toBeDefined();
    expect(resource.action).toBeDefined();
  });

  it('should GET a resource with id from the api', function() {
    var resource = mry('tests');
    var testId = '67890';
    var url = [BASE_URL, 'api/2.0', 'tests', testId].join('/');

    $httpBackend.expectGET(url).respond(200, {});
    resource.get(testId);
    $httpBackend.flush();
  });

  it('should query the api with the endpoint of a given collection', function() {
    var resource = mry('tests');
    var url = [BASE_URL, 'api/2.0', 'tests'].join('/');

    $httpBackend.expectGET(url).respond(200, {});
    resource.query();
    $httpBackend.flush();
  });

  it('should POST a new resource to the api when saving', function() {
    var resource = mry('tests');
    var test = {
      name: 'Working test'
    };
    var url = [BASE_URL, 'api/2.0', 'tests'].join('/');

    $httpBackend.expectPOST(url).respond(200, {});
    resource.save(test);
    $httpBackend.flush();
  });

  it('should PUT a resource with id to the api when saving', function() {
    var resource = mry('tests');
    var test = {
      _id: '12345',
      name: 'Working test'
    };
    var url = [BASE_URL, 'api/2.0', 'tests', test._id].join('/');

    $httpBackend.expectPUT(url, {name: 'Working test'}).respond(200, {});
    resource.save(test);
    $httpBackend.flush();
  });

  it('should not alter the PUT object when saving', function() {
    var resource = mry('tests');
    var test = {
      _id: '12345',
      name: 'Working test'
    };
    var url = [BASE_URL, 'api/2.0', 'tests', test._id].join('/');

    $httpBackend.expectPUT(url, {name: 'Working test'}).respond(200, {});
    resource.save(test);
    $httpBackend.flush();
    expect(test._id).toBe('12345');
    expect(test.name).toBe('Working test');
  });

  it('should DELETE a resource with id from the api', function() {
    var resource = mry('tests');
    var testId = '67890';
    var url = [BASE_URL, 'api/2.0', 'tests', testId].join('/');

    $httpBackend.expectDELETE(url).respond(200, {});
    resource.delete(testId);
    $httpBackend.flush();
  });

  it('should run an action for a resource with PUT as default', function() {
    var resource = mry('tests');
    var testId = '67890';
    var action = 'postpone';
    var url = [BASE_URL, 'api/2.0', 'tests', testId, action].join('/');

    $httpBackend.expectPUT(url).respond(200, {});
    resource.action(action, testId);
    $httpBackend.flush();
  });

  it('should run batch update for a resource with PUT as default', function() {
    var resource = mry('tests');
    var testIds = ['67890', '12345'];
    var batchData = {test: 'testing'};
    var url = BASE_URL + '/api/2.0/tests/groupupdate';
    var putData = [{_id: '67890', test: 'testing'},{_id: '12345', test: 'testing'}];

    $httpBackend.expectPUT(url, putData).respond(200, {});
    resource.batch('groupupdate', testIds, batchData);
    $httpBackend.flush();
  });

  it('should create a child collection for a collection using of method', function() {
    var resource = mry('tests').of('testers');
    var testId = '67890';
    var url = [BASE_URL, 'api/2.0', 'testers', 'tests', testId].join('/');

    $httpBackend.expectGET(url).respond(200, {});
    resource.get(testId);
    $httpBackend.flush();
  });

  it('should create a child collection for an object in a collection using the of method', function() {
    var testId = '67890';
    var testerId = '1337tester';
    var url = [BASE_URL, 'api/2.0', 'testers', testerId, 'tests', testId].join('/');
    var resource = mry('tests').of('testers', testerId);

    $httpBackend.expectGET(url).respond(200, {});
    resource.get(testId);
    $httpBackend.flush();
  });

  it('should use override config parameters using passed in config', function() {
    var resource = mry('tests');
    var testId = '12345';
    var url = [BASE_URL, 'api/2.0', 'tests', testId].join('/');

    $httpBackend.expectPOST(url).respond(200, {});
    resource.get(testId, {method: 'POST'});
    $httpBackend.flush();
  });

  // DATA FETCHING
  it('should assume electricity metric unless specified', function() {
    var dummyId = 'id12345';
    var url = [BASE_URL, 'api/2.0', 'consumptions', dummyId, 'day', '20150101'].join('/');
    var urlElectricity = url + '?metrics=energy';

    $httpBackend.expectGET(urlElectricity).respond(200, {});
    mry('consumptions').getData(dummyId, 'day', '20150101');
    $httpBackend.flush();
  });

  it('should respect the provided metrics', function() {
    var dummyId = 'id12345';
    var url = [BASE_URL, 'api/2.0', 'consumptions', dummyId, 'day', '20150101'].join('/');
    var urlFlow = url + '?metrics=flow';

    $httpBackend.expectGET(urlFlow).respond(200, {});
    mry('consumptions').getData(dummyId, 'day', '20150101', 'flow');
    $httpBackend.flush();
  });

  it('should allow extra params along with metrics', function() {
    var dummyIds = 'id12345,id434234,id243245';
    var url = [BASE_URL, 'api/2.0', 'consumptions', 'sum', 'day', '20150101'].join('/');
    var urlFlow = url + '?meters=' + dummyIds + '&metrics=flow';

    $httpBackend.expectGET(urlFlow).respond(200, {});
    mry('consumptions').getData('sum', 'day', '20150101', 'flow', {meters: dummyIds});
    $httpBackend.flush();
  });

  it('should allow fetching multiple metrics', function() {
    var dummyId = 'id12345';
    var url = [BASE_URL, 'api/2.0', 'consumptions', dummyId, 'day', '20150101'].join('/');
    var urlFlow = url + '?metrics=flow,energy';

    $httpBackend.expectGET(urlFlow).respond(200, {});
    mry('consumptions').getData(dummyId, 'day', '20150101', ['flow', 'energy']);
    $httpBackend.flush();
  });

    it('should allow fetching of readings (no granularity needed)', function() {
    var dummyId = 'id12345';
    var url = [BASE_URL, 'api/2.0', 'readings', dummyId, '20150101'].join('/');
    var urlFlow = url + '?metrics=flow';

    $httpBackend.expectGET(urlFlow).respond(200, {});
    mry('readings').getData(dummyId, null, '20150101', ['flow']);
    $httpBackend.flush();
  });
});
