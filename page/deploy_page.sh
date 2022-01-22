# exit when any command fails
set -e
yarn
yarn build
cd build
mv index.html 404.html
rm -rf .git
git init --initial-branch=page
git config user.name yetanother-archivebot[bot]
git config user.email 90119549+yetanother-archivebot[bot]@users.noreply.github.com
git remote add origin https://yetanothercheer:${MY_GITHUB_TOKEN}@github.com/yetanothercheer/Archive.git
git add .
git commit --allow-empty-message --no-edit
git push origin page --force
