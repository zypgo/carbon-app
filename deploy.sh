#!/usr/bin/env sh

# abort on errors
set -e

# build
npm run build

# navigate into the build output directory
cd dist

# create a 404.html file that redirects to index.html (for GitHub Pages SPA support)
cp index.html 404.html

# create .nojekyll file to prevent Jekyll processing
touch .nojekyll

# if you are deploying to a custom domain
# echo 'www.example.com' > CNAME

git init
git add -A
git commit -m 'Deploy to GitHub Pages'

# if you are deploying to https://<USERNAME>.github.io/<REPO>
git push -f https://github.com/zypgo/carbon-app.git main:gh-pages

cd - 