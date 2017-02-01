var restify = require('restify');

function getReport(req, res, next){
    var json = {report:[{"id":"JAN 1", "total": 90},{"id":"JAN 2", "total": 77}]};

    res.json(json);
}

var server = restify.createServer();

restify.CORS.ALLOW_HEADERS.push('authorization');
restify.CORS.ALLOW_HEADERS.push('Accept-Encoding');
restify.CORS.ALLOW_HEADERS.push('Accept-Language');

server.use(restify.CORS({'origins': ['http://localhost:4200']}));
server.use(restify.fullResponse());

server.use(restify.queryParser());
server.use(restify.bodyParser());

server.get('/report', getReport);

server.listen(8887, function() {
    console.log('%s listening at %s', server.name, server.url);
});
