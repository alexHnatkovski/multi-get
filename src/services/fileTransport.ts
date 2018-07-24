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
}

const fileTransport = (() => {
  /**
   * Default download settings
   */
  const defaults = Object.freeze({
    fileChunkSize: 1048576,
    totalChunks: 4,
    downloadLimit: 1048576 * 4,
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

      if (!opts || !opts.output) {
        this.settings.output += parseUrl(fileUrl).pathname;
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
    mergeFileChunksIntoFile(chunk: string) {
      const chunkBuffer = Buffer.from(chunk, 'binary');

      appendFileSync(this.settings.output, chunkBuffer, { encoding: 'binary' });

      return chunkBuffer;
    },
  };

  return {
    async getFile(url: string, userOpts?: TransportOptions) {
      await fileChunksTransport.init(url, userOpts);
      return await fileChunksTransport.partialFileDownload();
    },
  };
})();

export { fileTransport };
