const App = require('./dist/app');

const uri = 'http://a15cc616.bwtest-aws.pravala.com/384MB.jar';
console.log('\033[2J');
App.initCLI();

/*http.createServer(httpListener).listen(8000);
let isRequestPending;
function httpListener(request, response) {

    if (request.method === 'GET' && !isRequestPending) {
        isRequestPending = true;
        App.getFile(uri).then((resp) => {
            setTimeout(() => {isRequestPending = false;}, 1500);
/!*
            let myResp = resp;

            await myResp.forEach(async (chunk) => {
                const chunkBuffer = await Buffer.from(chunk, 'binary');

                fs.appendFileSync('./output/get.jar', chunkBuffer, 'binary', (e) => {
                    if (e) {
                        console.log(e.toString());
                    }
                });
            });*!/

            response.writeHead(200, {'Content-Type': 'text/html'});
            response.write('Successfully downloaded!');
            response.end();
        }).catch((e) => {
            setTimeout(() => {isRequestPending = false;}, 500);
            response.writeHead(200, {'Content-Type': 'text/html'});
            response.write(e.toString());
            response.end();
        })
    }
}*/