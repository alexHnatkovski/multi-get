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
      default: 'http://a15cc616.bwtest-aws.pravala.com/384MB.jar',
      validate: (input: string): boolean | string => !!isUri(input) || 'Please provide valid url',
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
      validate: (input: string): boolean | string => !!input.trim().length || 'File name cannot be empty',
      when: (answers: Answers) => answers.customName,
    },
    {
      type: 'confirm',
      name: 'customSettings',
      message: 'Would you like to override default download settings(number of chunks/chunk size/total download size)?',
    },
    {
      type: 'input',
      name: 'totalChunks',
      message: 'Please specify how many file chunks should be downloaded in total or hit enter to use default value: ',
      default: 4,
      when: (answers: Answers) => answers.customSettings,
      validate: (input: string): boolean | string => /^[1-9]\d*$/.test(input) || 'Only positive integers are allowed',
    },
    {
      type: 'input',
      name: 'chunkSize',
      message: 'Please specify size of each chunk (MiB) or hit enter to use default: ',
      default: 1,
      when: (answers: Answers) => answers.customSettings,
      validate: (input: string): boolean | string => /^[1-9]\d*$/.test(input) || 'Only positive integers are allowed',
    },
    {
      type: 'input',
      name: 'downloadLimit',
      message: 'Please specify maximum size of download(MiB) or hit enter to use default value:',
      default: 4,
      when: (answers: Answers) => answers.customSettings,
      validate: (input: string): boolean | string => /^[1-9]\d*$/.test(input) || 'Only positive integers are allowed',
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
    /**
     * Creates a string of green color to print an action success message
     * @param {string} text - text to print
     * @returns {string}
     */
    printSuccessText(text: string) {
      console.log(chalk.green(text));
    },
    /**
     * Creates a string of green color to print an action success message
     * @param {string} text - text to print
     * @returns {string}
     */
    printErrorText(text: string) {
      console.log(chalk.red(text));
    },
  };

  return {
    /**
     * Renders app logo in CLI and renders a form for user to specify app settings
     * @returns {Promise<inquirer.Answers>}
     */
    initCLI() {
      const headerText = figlet.textSync('Multi-GET', { horizontalLayout: 'full' });
      console.log(chalk.yellow(headerText));
      return utility.requestUserInput();
    },
    printStatusText(status: string, text: string) {
      if (status === 'success') {
        utility.printSuccessText(text);
      } else if (status === 'error') {
        utility.printErrorText(text);
      } else {
        console.log(text);
      }
    },
  };
})();

export { cliUtility };
