import { fileTransport } from './services/fileTransport';
import { cliUtility } from './services/cliHelper';

const App = {
  getFile: fileTransport.getFile,
  initCLI: cliUtility.initCLI,
};

export = App;
