Feature: require impact

Scenario: default import
  Given a require with
    """
    {
      "path": "./a",
      "symbols": [{
        "imported": "module.exports",
        "local": "a"
      }]
    }
    """
  When finding local symbols for "exports.prop"
  Then the symbol is "a.prop"

Scenario: symbol import
  Given a require with
    """
    {
      "path": "./a",
      "symbols": [{
        "imported": "a",
        "local": "b"
      }]
    }
    """
  When finding local symbols for "module.exports.a.prop"
  Then the symbol is "b.prop"

Scenario: symbol import (full form)
  Given a require with
    """
    {
      "path": "./a",
      "symbols": [{
        "imported": "module.exports.a",
        "local": "b"
      }]
    }
    """
  When finding local symbols for "module.exports.a.prop"
  Then the symbol is "b.prop"
