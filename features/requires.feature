Feature: requires

Scenario: assignment
  Given a file with
    """
    const b = require('./a');
    """
  When finding requires
  Then the require for "./a" imports "module.exports" as "b"

Scenario: assignment destruct
  Given a file with
    """
    const { f } = require('./a');
    """
  When finding requires
  Then the require for "./a" imports "f"

Scenario: call
  Given a file with
    """
    app.use('/path', require('./a'));
    """
  When finding requires
  Then the require for "./a" imports "module.exports" as anonymous
  And the require for "./a" maps to app.use('/path')
