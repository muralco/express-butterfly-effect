Feature: line impact

Scenario: assignment
  Given a file with
    """
    const a = 1;
    """
  When finding the symbols at line 1
  Then the symbol is "a"

Scenario: function
  Given a file with
    """
    function a() {
      return 1;
    };
    """
  When finding the symbols at line 2
  Then the symbol is "a"

Scenario: assignment
  Given a file with
    """
    let a;
    a = 1;
    """
  When finding the symbols at line 2
  Then the symbol is "a"

Scenario: class
  Given a file with
    """
    class A {
      f() {}
    }
    """
  When finding the symbols at line 2
  Then the symbol is "A"

Scenario: nested assignment
  Given a file with
    """
    module.exports = {
      a: 1
    };
    """
  When finding the symbols at line 2
  Then the symbol is "module.exports.a"

Scenario: nested assignment
  Given a file with
    """
    module.exports = {
      a() { },
    };
    """
  When finding the symbols at line 2
  Then the symbol is "module.exports.a"
