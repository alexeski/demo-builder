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

docker push alexswedocker/emb-demo-builder-eski

# this is to create the windows and mac apps (locally)
npm run dist #this creates an installer on windows and on mac (a propper mac app inside a zip, and also a mac installer)
electron-builder --windows nsis:x64 #this creates a windows exe (folder), if we don't want to use the installer
