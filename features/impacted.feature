Feature: impacted

Scenario: single line, no range
  When loading an impact spec "./a.js:3"
  Then the impact path is "./a.js" and the line is 3

Scenario: single line, with range
  When loading an impact spec "./a.js:3-3"
  Then the impact path is "./a.js" and the line is 3, 4 and 5

Scenario: multi line, no range
  When loading an impact spec "./a.js:3:5:7"
  Then the impact path is "./a.js" and the line is 3, 5 and 7

Scenario: multi line, with range
  When loading an impact spec "./a.js:3-2:7:9-3"
  Then the impact path is "./a.js" and the line is 3, 4, 7, 9, 10 and 11
