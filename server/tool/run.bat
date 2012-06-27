cd ..
start "database" mongod.exe --dbpath data
ping localhost -n 2
start "server" node main.js
ping localhost -n 1
cd ..
cd client
start "client" node app.js
