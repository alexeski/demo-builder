#! /bin/bash

#this is used to minify main.js to main.min.js
node prepdeploy.js

# this is used to commit the code to main branch in github
# important! the best practice is to commit to a dev branch instead
git add .
git commit -m "v1.6.0, issues with images"
git push

# this is used 
docker stop testemb 
docker rm testemb 
docker image rm alexswedocker/emb-demo-builder-eski
docker build . -t alexswedocker/emb-demo-builder-eski
docker run -p 80:3000 -d --name testemb alexswedocker/emb-demo-builder-eski

docker push alexswedocker/emd-demo-builder-eski

# this is to create the windows and mac apps (locally)
npm run dist
electron-builder --windows nsis:x64
