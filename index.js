const http = require('http');
const fetch = require('request-promise');
const App = require('./dist/app');

const uri = 'http://a15cc616.bwtest-aws.pravala.com/384MB.jar';

http.createServer(httpListener).listen(8000);
let isRequestPending;
function httpListener(request, response) {

    if (request.method === 'GET' && !isRequestPending) {
        isRequestPending = true;
        App.getFile(uri).then((resp) => {
            setTimeout(() => {isRequestPending = false;}, 500);
            response.writeHead(200, {'Content-Type': 'text/html'});
            response.write(resp);
            response.end();
        }).catch((e) => {
            setTimeout(() => {isRequestPending = false;}, 500);
            response.writeHead(200, {'Content-Type': 'text/html'});
            response.write(e.toString());
            response.end();
        })
    }
}