const App = require('./dist/app');

App.initCLI()
    .then((userInput) => {
        const fileUrl = userInput.fileUrl;
        let options = {};

        if (userInput.customName) {
            options.filename = userInput.filename;
        }
        if (userInput.customSettings) {
            options.totalChunks = parseInt(userInput.totalChunks);
            options.chunkSize = parseInt(userInput.chunkSize);
            options.downloadLimit = parseInt(userInput.downloadLimit);
        }
        App.getFile(fileUrl, options)
            .then(() => {
                App.printStatusText('success', 'Successfully downloaded file to ./output folder!');
            })
    }).catch((e) => {
        App.printStatusText('error', `We could not download file. ${e.toString()}`);
    });
