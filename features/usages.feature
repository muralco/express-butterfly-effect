Feature: usages

Scenario: assignment
  Given a file with
    """
    const b = a;
    """
  When finding the usages of "a"
  Then the symbol is "b"

Scenario: function
  Given a file with
    """
    function b() {
      return a;
    }
    """
  When finding the usages of "a"
  Then the symbol is "b"

Scenario: class
  Given a file with
    """
    class B {
      f() { return a; }
    }
    """
  When finding the usages of "a"
  Then the symbol is "B"

Scenario: nested assignment
  Given a file with
    """
    module.exports = {
      b: a
    };
    """
  When finding the usages of "a"
  Then the symbol is "module.exports.b"

Scenario: method assignment
  Given a file with
    """
    module.exports = {
      b() { return a; },
    };
    """
  When finding the usages of "a"
  Then the symbol is "module.exports.b"

Scenario: nested assignment (implicit)
  Given a file with
    """
    module.exports = {
      a,
    };
    """
  When finding the usages of "a"
  Then the symbol is "module.exports.a"

Scenario: function call
  Given a file with
    """
    module.exports = fn(a);
    """
  When finding the usages of "a"
  Then the symbol is "module.exports"

Scenario: prop usage
  Given a file with
    """
    const b = a.prop;
    const c = a.other;
    """
  When finding the usages of "a.prop"
  Then the symbol is "b"

Scenario: call chain
  Given a file with
    """
    const b = a().then(x => x);
    """
  When finding the usages of "a"
  Then the symbol is "b"

# App

Scenario: app
  Given a file with
    """
    app.post('/path', a);
    """
  When finding the usages of "a"
  Then the symbol maps to app.post('/path')

Scenario: app property
  Given a file with
    """
    app.post('/path', a);
    """
  When finding the usages of "a.prop"
  Then the symbol maps to app.post('/path')

Scenario: app use
  Given a file with
    """
    app.use(a);
    """
  When finding the usages of "a"
  Then the symbol maps to app.use()

Scenario: app unused
  Given a file with
    """
    app.post('/path', a.other);
    """
  When finding the usages of "a.prop"
  Then the symbols are empty

# Usages of "a.prop" when "a" is being used

Scenario: assignment (a.prop)
  Given a file with
    """
    const b = a;
    """
  When finding the usages of "a.prop"
  Then the symbol is "b.prop"

Scenario: function (a.prop)
  Given a file with
    """
    function b() {
      return a;
    };
    """
  When finding the usages of "a.prop"
  Then the symbol is "b"

Scenario: class (a.prop)
  Given a file with
    """
    class B {
      f() { return a; }
    }
    """
  When finding the usages of "a.prop"
  Then the symbol is "B"

Scenario: nested assignment (a.prop)
  Given a file with
    """
    module.exports = {
      b: a
    };
    """
  When finding the usages of "a.prop"
  Then the symbol is "module.exports.b.prop"

Scenario: method assignment (a.prop)
  Given a file with
    """
    module.exports = {
      b() { return a; },
    };
    """
  When finding the usages of "a.prop"
  Then the symbol is "module.exports.b"

Scenario: nested assignment (implicit) (a.prop)
  Given a file with
    """
    module.exports = {
      a,
    };
    """
  When finding the usages of "a.prop"
  Then the symbol is "module.exports.a.prop"

# Usages of "a" when "a" is being used "b" and "b" by "c"

Scenario: assignment transitive
  Given a file with
    """
    const b = a;
    const c = b;
    """
  When finding the usages of "a"
  Then the symbols are "b" and "c"

Scenario: function transitive
  Given a file with
    """
    function b() {
      return a;
    }
    function c() {
      return b();
    }
    """
  When finding the usages of "a"
  Then the symbols are "b" and "c"

Scenario: class transitive
  Given a file with
    """
    class B {
      f() { return a; }
    }
    class C {
      f() { return new B(); }
    }
    """
  When finding the usages of "a"
  Then the symbols are "B" and "C"

Scenario: nested assignment transitive
  Given a file with
    """
    module.exports = {
      b: a
    };
    global = {
      c: module.exports.b
    };
    """
  When finding the usages of "a"
  Then the symbols are "module.exports.b" and "global.c"

Scenario: method assignment transitive
  Given a file with
    """
    module.exports = {
      b() { return a; },
    };
    global = {
      c() { return module.exports.b(); }
    }
    """
  When finding the usages of "a"
  Then the symbols are "module.exports.b" and "global.c"

Scenario: nested assignment (implicit) transitive
  Given a file with
    """
    module.exports = {
      a,
    };
    global.c = module.exports.a;
    """
  When finding the usages of "a"
  Then the symbols are "module.exports.a" and "global.c"
