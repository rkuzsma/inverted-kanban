var connect = require('connect'),
    http = require('http');

connect()
    .use(connect.static('public'))
    .listen(3006);
console.log("Listening on 3006");