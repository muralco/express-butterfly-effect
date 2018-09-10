#!/bin/sh
BASE="$1"
if [ -z "$BASE" ]; then BASE=master; fi

git diff --ignore-blank-lines --ignore-all-space \
  --ignore-cr-at-eol --no-color --unified=0 "$BASE" |\
grep '^\(+++\|@@\)' |\
grep -v '^\(+++ /dev/null\)' |\
sed -e 's/@@ .* +\(.*\) @@.*/@@\1@@/' |\
sed -e 's/\(@@.*\),\(.*@@\)/\1-\2/' |\
sed -e 's/\(@@[^-]*\)@@/\1-1@@/' |\
sed -e '/@@.*-0@@/d' |\
sed -e 's/@@\(.*\)@@/:\1/' |\
tr -d '\n' |\
sed -e 's/+++ b\//\
/g' |\
sed -ne '/\.js:/p' |\
tr '\n' ' '
