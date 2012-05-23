@echo off
echo **************************************************
echo set NODE_ENV
wmic ENVIRONMENT create name="NODE_ENV",username="<system>",VariableValue="production"
rem "NODE_ENV = development"
echo **************************************************
