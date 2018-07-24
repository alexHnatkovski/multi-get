import * as fetch from 'request-promise';
import { Buffer } from 'buffer';
import { appendFileSync } from 'fs';
import { parse as parseUrl } from 'url';

interface TransportOptions {
  fileChunkSize: number;
  totalChunks?: number;
  downloadLimit: number;
  totalFileSize?: number;
  fileUrl: string;
  output: string;
  filename?: string;
}

const mibSize = 1048576;
const fileTransport = (() => {
  /**
   * Default download settings
   */
  const defaults = Object.freeze({
    fileChunkSize: mibSize,
    totalChunks: 4,
    downloadLimit: mibSize * 4,
    output: './output',
  });

  /**
   * File transport handler
   */
  const fileChunksTransport = {
    settings: <TransportOptions>Object.assign({}, defaults),
    fileChunksByteArray: null,
    /**
     * Initialzes download settings
     * @param {string} fileUrl
     * @param {TransportOptions} opts
     * @returns {Promise<any>}
     */
    async init(fileUrl: string, opts?: TransportOptions) {
      const fileHeaders = await this.getFileHeaders(fileUrl);
      this.settings.totalFileSize = fileHeaders['content-length'];
      this.settings.fileUrl = fileUrl;

      if (!opts || !opts.filename) {
        this.settings.output += parseUrl(fileUrl).pathname;
      } else if (opts.filename) {
        this.settings.output += `/${opts.filename}`;
      }

      if (opts && opts.fileChunkSize) {
        opts.fileChunkSize *= mibSize;
      }

      if (opts && opts.downloadLimit) {
        opts.downloadLimit *= mibSize;
      }

      if (opts) {
        this.settings = Object.assign(this.settings, opts);
      }

      if ((this.settings.totalFileSize && this.settings.downloadLimit) && this.settings.totalFileSize <= this.settings.downloadLimit) {
        this.settings.downloadLimit = this.settings.totalFileSize;
      }
    },
    /**
     * Retrieves file information before starting download
     * @param {string} uri
     * @returns {Promise<void>}
     */
    async getFileHeaders(uri: string) {
      return await fetch.head(uri, (err, response, body) => {
        if (!err) {
          return response.headers;
        }
      });
    },

    /**
     * Handles file chunks download and merges chunks into file
     * @returns {Promise<void>}
     */
    async partialFileDownload() {
      const contentPromises = new Array(this.settings.totalChunks)
        .fill(null)
        .map((item, index) => {
          let startByte = 0;
          let endByte = this.settings.fileChunkSize;

          if (index !== 0) {
            startByte += index * (this.settings.fileChunkSize || 0);
            endByte = startByte + this.settings.fileChunkSize;
          }

          if (endByte > this.settings.downloadLimit) {
            endByte = this.settings.downloadLimit;
          }

          const opts = {
            url: this.settings.fileUrl,
            headers: { Range: `bytes=${startByte}-${endByte}` },
          };
          console.log('Get', opts);
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
