var restify = require('restify');

function getReport(req, res, next){
    res.json([
        ['Date','Created', 'Completed', { role: 'annotation' } ],
        ['JAN 1', 10, 3, ''],
        ['JAN 2', 16, 1, ''],
        ['JAN 3', 2, 19, ''],
        ['JAN 4', 5, 0, ''],
        ['JAN 5', 8, 1, ''],
        ['JAN 6', 2, 7, ''],
        ['JAN 7', 1, 4, '']
    ]);
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

server.listen(8889, function() {
    console.log('%s listening at %s', server.name, server.url);
});
