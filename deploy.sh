#!/bin/bash

set -e

cd build

git init

git config user.name "Travis CI"
git config user.email "admin@cyderize.org"

git add .
git commit -m "Deploy to GitHub Pages"

echo Deployed.
