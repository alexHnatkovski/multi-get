import chalk from 'chalk';
import figlet from 'figlet';
import inquirer, { Answers } from 'inquirer';
import { isUri } from 'valid-url';
/**
 * Utility service that helps working with CLI
 */
const cliUtility = (() => {
  /**
   * Set of questions that user should be guided through to get input for file download
   */
  const prompts = [
    {
      type: 'input',
      name: 'fileUrl',
      message: 'Please provide url address of the file: ',
      validate: (input: string): boolean | string => isUri(input) || 'Please provide valid url in format',
    },
    {
      type: 'confirm',
      name: 'customName',
      message: 'Would you like to change the name of output file?',
    },
    {
      type: 'input',
      name: 'filename',
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
      validate: (input: string): boolean | string => /^[0-9]+$/.test(input) || 'Only integer number are allowed',
    },
    {
      type: 'input',
      name: 'chunkSize',
      message: 'Please specify how many file chunks should be downloaded in total(MiB): ',
      default: 1,
      validate: (input: string): boolean | string => /^[0-9]+$/.test(input) || 'Only integer number are allowed',
    },
    {
      type: 'input',
      name: 'downloadLimit',
      message: 'Please specify total size of the file to download(MiB):',
      default: 4,
      validate: (input: string): boolean | string => /^[0-9]+$/.test(input) || 'Only integer number are allowed',
    },
  ];

  const utility = {
    /**
     * Requests user input on CLI interface
     * @returns {Promise<any>}
     */
    requestUserInput() {
      return inquirer.prompt(prompts);
    },
  };

  return {
    initCLI() {
      const headerText = figlet.textSync('Multi-GET', { horizontalLayout: 'full' });
      console.log(chalk.yellow(headerText));
      return utility.requestUserInput();
    },
  };
})();

export { cliUtility };
