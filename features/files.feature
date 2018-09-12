Feature: files

Background:
  Given a file "./fn.js" with
    """
    module.exports = () => {
      return 1;
    };
    """
  Given a file "./obj.js" with
    """
    module.exports = {
      a: 1,
      b: 2,
    };
    """

Scenario: fn
  Given a file "./app.js" with
    """
    const a = require('./fn');
    
    function b() { return a(); }
    """
  When processing the impact for "./fn.js" at line 3
  Then the impact for "./app.js" has usage "b" and no exports

Scenario: obj (default)
  Given a file "./app.js" with
    """
    const o = require('./obj');
    
    function c() { return o.a(); }
    """
  When processing the impact for "./obj.js" at line 2
  Then the impact for "./app.js" has usage "c" and no exports

Scenario: obj (default no match)
  Given a file "./app.js" with
    """
    const o = require('./obj');
    
    function c() { return o.a(); }
    """
  When processing the impact for "./obj.js" at line 3
  Then the impact for "./app.js" has no usage and no exports

Scenario: indirect app usage
  Given a file "./a.js" with
    """
    const a = require('./fn');

    app.get('/path', a);

    module.exports = app;
    """
  And a file "./app.js" with
    """
    app.use('/prefix', require('./a'));
    """
  When processing the impact for "./fn.js" at line 2
  Then the impacted endpoint is "get /prefix/path"

Scenario: impact in app method
  Given a file "./app.js" with
    """
    app.use('/prefix', require('./dir'));
    """
  And a file "./dir/index.js" with
    """
    app.post(
      '/path',
      doStuff,
    );
    module.exports = app;
    """
  When processing the impact for "./dir/index.js" at line 3
  Then the impacted endpoint is "post /prefix/path"

Scenario: app method require
  Given a file "./app.js" with
    """
    app.use('/prefix', require('./a'));
    """
  And a file "./a.js" with
    """
    app.post(
      '/path',
      require('./fn'),
    );
    module.exports = app;
    """
  When processing the impact for "./fn.js" at line 2
  Then the impacted endpoint is "post /prefix/path"

Scenario: multi-assign
  Given a file "./app.js" with
    """
    app.use('/prefix', require('./a'));
    """
  And a file "./a.js" with
    """
    const app = module.exports = require('express')();
    app.post(
      '/path',
      doStuff,
    );
    """
  When processing the impact for "./a.js" at line 3
  Then the impacted endpoint is "post /prefix/path"
