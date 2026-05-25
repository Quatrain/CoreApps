#!/bin/bash

GIT=`which git`
NODE=`which node`

CURRENTDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PARENTDIR=`dirname $CURRENTDIR`

# Go to parent directory (monorepo root) to ensure package.json is local
cd "$PARENTDIR"

# Change version using npm for yarn berry compatibility
npm --no-git-tag-version version patch

VERSION=`$NODE -p "require('./package.json').version"`
COMPONENT=`$NODE -p "require('./package.json').name"`

# Create tag
$GIT tag v$VERSION

echo "Publishing v${VERSION} of ${COMPONENT}"

# Commit and push changes
$GIT add package.json
$GIT commit -m "Published v$VERSION"

# Push tag to trigger build & deployment
$GIT push --tags origin v$VERSION
