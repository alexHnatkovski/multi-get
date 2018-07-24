import * as fetch from 'request-promise';
import { Buffer } from 'buffer';
import { appendFileSync, existsSync, mkdirSync, openSync, closeSync } from 'fs';
import { parse as parseUrl } from 'url';

interface TransportOptions {
  fileChunkSize: number;
  totalChunks: number;
  downloadLimit: number;
  totalFileSize: number;
  fileUrl: string;
  output: string;
  filename?: string;
}

const mibSizeInBytes = (1024 * 1024);
const fileTransport = (() => {
  /**
   * Default download settings
   */
  const defaults = Object.freeze({
    fileChunkSize: 1,
    totalChunks: 4,
    downloadLimit: 4,
    output: './output',
  });

  /**
   * Converts mebibytes to bytes. Using Math.ceil in case if MiB param is not integer
   * @param {number} MiB - integer or float number of mebibytes to convert to bytes
   * @returns {number}
   */
  const getByteSize = (MiB: number): number => Math.ceil(mibSizeInBytes * MiB);

  /**
   * File transport handler
   */
  const fileChunksTransport = {
    settings: <TransportOptions>Object.assign({}, defaults),
    /**
     * Initialzes download settings
     * @param {string} fileUrl
     * @param {TransportOptions} opts
     * @returns {Promise<any>}
     */
    async init(fileUrl: string, opts?: TransportOptions) {
      const fileHeaders = await this.getFileHeaders(fileUrl);
      this.settings.totalFileSize = +fileHeaders['content-length'];
      this.settings.fileUrl = fileUrl;

      if (!existsSync(this.settings.output)) {
        mkdirSync(this.settings.output);
      }

      if (!opts || !opts.filename) {
        this.settings.output += parseUrl(fileUrl).pathname;
      } else if (opts.filename) {
        this.settings.output += `/${opts.filename}`;
      }

      // Create and empty file
      closeSync(openSync(this.settings.output, 'w'));

      if (opts) {
        this.settings = Object.assign(this.settings, opts);
      }

      if (this.settings.totalFileSize <= getByteSize(this.settings.downloadLimit)) {
        this.settings.downloadLimit = this.settings.totalFileSize / mibSizeInBytes;
        this.settings.fileChunkSize = this.settings.downloadLimit / this.settings.totalChunks;
      }
    },
    /**
     * Retrieves file information before starting download
     * @param {string} uri
     * @returns {Promise<void>}
     */
    getFileHeaders(uri: string) {
      return fetch.head(uri, (err, response) => {
        if (!err) {
          return response.headers;
        }
      });
    },

    /**
     * Handles file chunks download and merges chunks into file
     * @returns {Promise<void>}
     */
    partialFileDownload() {
      const contentPromises = new Array(this.settings.totalChunks)
        .fill(null)
        .map((item, index) => {
          let startByte = 0;
          let endByte = getByteSize(this.settings.fileChunkSize);
          const downloadLimitBytes = getByteSize(this.settings.downloadLimit);
          const fileChunkSizeBytes = getByteSize(this.settings.fileChunkSize);

          if (index !== 0) {
            startByte += index * fileChunkSizeBytes;
            endByte = startByte + fileChunkSizeBytes;
          }

          if (endByte > downloadLimitBytes || endByte > this.settings.totalFileSize) {
            endByte = downloadLimitBytes < this.settings.totalFileSize ? downloadLimitBytes : this.settings.totalFileSize;
          }

          const opts = {
            url: this.settings.fileUrl,
            headers: { Range: `bytes=${startByte}-${endByte}` },
          };
          console.log(`Downloading Chunk #${index + 1}: `, opts.headers);
          return fetch.get(opts);
        });

      return Promise
        .all(contentPromises)
        .then(responses => Promise.all(responses.map(this.mergeFileChunksIntoFile.bind(this))));
    },

    /**
     * Converts file chunks into Buffers and appends them into file
     * @param {string} chunk
     * @returns {Buffer}
     */
    mergeFileChunksIntoFile(chunk: string) {
      const chunkBuffer = Buffer.from(chunk, 'binary');

      appendFileSync(this.settings.output, chunkBuffer, { encoding: 'binary' });

      return chunkBuffer;
    },
  };

  return {
    /**
     * Handles all the transportation, chunk merge and save operations
     * @param {string} url - url address of the file to download
     * @param {TransportOptions} userOpts - optional set of user download preferences
     * @param {Number} userOpts.fileChunkSize - size of one file chunk in MiB
     * @param {Number} userOpts.totalChunks - total number of chunks to split downloads into
     * @param {Number} userOpts.downloadLimit - total size of data to download from file in MiB
     * @param {String} userOpts.filename - name of the file to use for saving on local drive
     * @returns {Promise<[any]>}
     */
    async getFile(url: string, userOpts?: TransportOptions) {
      await fileChunksTransport.init(url, userOpts);
      return await fileChunksTransport.partialFileDownload();
    },
  };
})();

export { fileTransport };
