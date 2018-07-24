const App = require('./dist/app');
const uri = 'http://a15cc616.bwtest-aws.pravala.com/384MB.jar';

App.initCLI()
    .then((userInput) => {
        const fileUrl = userInput.fileUrl;
        let options = {};

        if (userInput.customName) {
            options.filename = userInput.filename;
        }
        if (userInput.customSettings) {
            options.totalChunks = userInput.totalChunks;
            options.chunkSize = userInput.chunkSize;
            options.downloadLimit = userInput.downloadLimit;
        }
        App.getFile(fileUrl, options).then(() => {
            console.log('Succesfully downloaded!');
        })
    });