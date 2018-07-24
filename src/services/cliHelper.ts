import { basename } from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import figlet from 'figlet';
import inquirer, { Answers } from 'inquirer';
import { parse } from 'url';

const prompts = [
  {
    type: 'input',
    name: 'sourceUrl',
    message: 'Please provide url address of the file: ',
    validate: (input: string): boolean | string => {
      let urlObj;
      let isValid = true;
      const errorString = 'Please provide valid url in format';

      try {
        urlObj = parse(input);
      } catch (e) {
        isValid = false;
      }

      return isValid || errorString;
    },
  },
  {
    type: 'confirm',
    name: 'customName',
    message: 'Would you like to change the name of output file?',
  },
  {
    type: 'input',
    name: 'fileName',
    message: 'Please provide the name to use for output file:',
    when: (answers: Answers) => {
      return answers.customName;
    },
  },
  {
    type: 'confirm',
    name: 'customSettings',
    message: 'Would you like to override default download settings(number of chunks/chunk size/total download size)?',
  },
  {
    type: 'input',
    name: 'totalChunks',
    message: 'Please specify how many file chunks should be downloaded in total: ',
    default: 4,
    when: (answers: Answers) => {
      return answers.customSettings;
    },
    validate: (input: string): boolean | string => {
      const isValid = /^[0-9]+$/.test(input);
      const errorText = 'Only integer number are allowed';

      return isValid || errorText;
    },
  },
  {
    type: 'input',
    name: 'chunkSize',
    message: 'Please specify how many file chunks should be downloaded in total(MiB): ',
    default: 1,
    validate: (input: string): boolean | string => {
      const isValid = /^[0-9]+$/.test(input);
      const errorText = 'Only integer number are allowed';

      return isValid || errorText;
    },
  },
  {
    type: 'input',
    name: 'totalSize',
    message: 'Please specify total size of the file to download(MiB):',
    default: 4,
    validate: (input: string): boolean | string => {
      const isValid = /^[0-9]+$/.test(input);
      const errorText = 'Only integer number are allowed';

      return isValid || errorText;
    },
  },
];
const cliUtility = (() => {
  const utility = {
    /**
     * Provides current working directory path
     * @returns {string}
     */
    getCurrentDirectoryBase: (): string => {
      return basename(process.cwd());
    },
    /**
     * Checks if directory exists
     * @param {string} filePath
     * @returns {boolean}
     */
    directoryExists: (filePath: string): boolean => {
      try {
        return fs.statSync(filePath).isDirectory();
      } catch (err) {
        return false;
      }
    },
    /**
     * Requests user input on CLI interface
     * @returns {Promise<any>}
     */
    requestUserInput() {
      return inquirer.prompt(prompts);
    },
  };

  return {
    async initCLI() {
      const headerText = figlet.textSync('Multi-GET', { horizontalLayout: 'full' });
      console.log(chalk.yellow(headerText));

      return utility.requestUserInput();
    },
  };
})();

export { cliUtility };
