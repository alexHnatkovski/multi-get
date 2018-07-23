import { fileTransport } from './services/fileTransport';

const App = {
  getFile: fileTransport.getFile,
};

export = App;
