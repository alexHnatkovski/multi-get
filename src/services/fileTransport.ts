import * as fetch from 'request-promise';
// import * as Buffer from 'buffer';

interface ChunkOptions {
  fileChunkSize: number;
  totalChunks?: number;
  downloadLimit: number;
  totalFileSize?: number;
  fileUrl: string;
}

/*class FileChunksTransport {
  constructor(options) {
    this.getFileHeaders(options.uri);
  },

  private async getFileHeaders(uri: string) {
    return await fetch.head(uri, (err, response, body) => {
      if (!err) {
        return response.headers;
      }
    });
  }

  private calculateChunkSettings() {

  }

  public start() {

  }

}*/

// const fileTransport =

const fileTransport = (() => {
  /**
   * Default download settings
   */
  const defaults = Object.freeze({
    fileChunkSize: 1048576,
    totalChunks: 4,
    downloadLimit: 1048576 * 4,
  });

  /**
   * File transport handler
   */
  const fileChunksTransport = {
    settings: <ChunkOptions>Object.assign({}, defaults),
    fileChunksByteArray: null,
    /**
     * Initialzes download settings
     * @param {string} fileUrl
     * @param {ChunkOptions} opts
     * @returns {Promise<any>}
     */
    async init(fileUrl: string, opts?: ChunkOptions) {
      const fileHeaders = await this.getFileHeaders(fileUrl);
      this.settings.totalFileSize = fileHeaders['content-length'];
      this.settings.fileUrl = fileUrl;

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
     * Handles files download
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

      return await Promise
        .all(contentPromises)
        // .then(responses => Promise.all(responses.map(res => res.arrayBuffer())))
        .then(buffers => Buffer.from(buffers));
    },
    /*/!**
     * Concat two ArrayBuffers
     * @param {ArrayBuffer} ab1
     * @param {ArrayBuffer} ab2
     * @returns {ArrayBuffer} Returns new ArrayBuffer
     * @private
     *!/
    concatArrayBuffer(ab1: ArrayBuffer, ab2: ArrayBuffer) {
      const tmp = new Uint8Array(ab1.byteLength + ab2.byteLength);
      tmp.set(new Uint8Array(ab1), 0);
      tmp.set(new Uint8Array(ab2), ab1.byteLength);
      return tmp.buffer;
    },*/
  };

  return {
    async getFile(url: string, userOpts?: ChunkOptions) {
      await fileChunksTransport.init(url, userOpts);
      return await fileChunksTransport.partialFileDownload();
    },
  };
})();

export { fileTransport };
