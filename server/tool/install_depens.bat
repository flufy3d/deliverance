@echo off
echo install depends and set environment variables


echo **************************************************
echo set NODE_PATH
wmic ENVIRONMENT create name="NODE_PATH",username="<system>",VariableValue="%APPDATA%\npm\node_modules"
echo **************************************************

echo **************************************************
echo set NODE_ENV
wmic ENVIRONMENT create name="NODE_ENV",username="<system>",VariableValue="production"
rem "NODE_ENV = development"
echo **************************************************



call npm config set registry http://registry.npmjs.vitecho.com

call npm install socket.io -g

pause
