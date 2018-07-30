import * as fetch from 'request-promise';
import request from 'request';
import { existsSync, createWriteStream } from 'fs';
import mkdirp from 'mkdirp';
import { parse as parseUrl } from 'url';
import { cliUtility } from './cliHelper';

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
     * Initializes download settings
     * @param {string} fileUrl
     * @param {TransportOptions} opts
     * @returns {Promise<any>}
     */
    async init(fileUrl: string, opts?: TransportOptions) {
      const fileHeaders = await this.getFileHeaders(fileUrl);
      this.settings.totalFileSize = +fileHeaders['content-length'];
      this.settings.fileUrl = fileUrl;

      if (!existsSync(this.settings.output)) {
        mkdirp(this.settings.output, (e) => {
          console.log('Could not create output folder! File Download cancelled. ', e.toString());
        });
      }

      let fileName;

      if (opts && opts.filename) {
        fileName = opts.filename;
      } else {
        fileName = (parseUrl(fileUrl).pathname || 'myDownload')
          .split('/')
          .pop();
      }

      this.settings.output += `/${fileName}`;

      if (opts) {
        this.settings = Object.assign(this.settings, opts);
      }

      if (this.settings.totalFileSize <= getByteSize(this.settings.downloadLimit)) {
        this.settings.downloadLimit = this.settings.totalFileSize / mibSizeInBytes;
      }

      if (this.settings.totalChunks * this.settings.fileChunkSize > this.settings.downloadLimit) {
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
      const totalDataToTransfer = getByteSize(this.settings.totalChunks * this.settings.fileChunkSize) < this.settings.totalFileSize
        ? getByteSize(this.settings.totalChunks * this.settings.fileChunkSize)
        : this.settings.totalFileSize;
      const downloadBar = cliUtility.initProgressBar(totalDataToTransfer);
      const contentPromises = new Array(this.settings.totalChunks)
        .fill(null)
        .reduce((chunksData: { startByte: number, endByte: number }[], nextChunk, index) => {
          let startByte = 0;
          let endByte = getByteSize(this.settings.fileChunkSize);
          const prevChunk = (index > 0) ? chunksData[index - 1] : { startByte: 0, endByte: 0 };
          const downloadLimitBytes = getByteSize(this.settings.downloadLimit);
          const fileChunkSizeBytes = getByteSize(this.settings.fileChunkSize);

          if (index > 0) {
            startByte = prevChunk.endByte + 1;
            endByte = startByte + fileChunkSizeBytes;
          }

          if (endByte > downloadLimitBytes || endByte > this.settings.totalFileSize) {
            endByte = downloadLimitBytes < this.settings.totalFileSize ? downloadLimitBytes : this.settings.totalFileSize;
          }

          chunksData.push({ startByte, endByte });

          return chunksData;
        },      [])
        .map((chunk) => {
          const opts = {
            url: this.settings.fileUrl,
            headers: { Range: `bytes=${chunk.startByte}-${chunk.endByte}` },
          };
          return new Promise((resolve, reject) => {
            request
              .get(Object.assign({ encoding: null }, opts), (err, resp, body) => {
                if (!err) {
                  resolve(body);
                } else {
                  reject(err);
                }
              })
              .on('data', (data) => {
                downloadBar.update(data.length);
              });
          });
        });

      return Promise
        .all(contentPromises)
        .then((data) => {
          const file = createWriteStream(this.settings.output);

          data
            .forEach((chunk) => {
              file.write(chunk, 'binary');
            });

          file.end();
          downloadBar.done();
        });
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
