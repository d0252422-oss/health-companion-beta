var __defProp = Object.defineProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/@huggingface/transformers/src/utils/generic.js
var Callable = (
  /** @type {any} */
  class {
    /**
     * Creates a new instance of the Callable class.
     */
    constructor() {
      let closure = function(...args) {
        return closure._call(...args);
      };
      return Object.setPrototypeOf(closure, new.target.prototype);
    }
    /**
     * This method should be implemented in subclasses to provide the
     * functionality of the callable object.
     *
     * @param {any[]} args
     * @throws {Error} If the subclass does not implement the `_call` method.
     */
    _call(...args) {
      throw Error("Must implement _call method in subclass");
    }
  }
);

// node_modules/@huggingface/transformers/src/utils/core.js
function dispatchCallback(progress_callback, data) {
  if (progress_callback) progress_callback(data);
}
var DefaultProgressCallback = class extends Callable {
  /**
   * @param {ProgressCallback} callback The original callback.
   * @param {FilesLoadingMap} files_loading Mutable map storing per-file progress.
   */
  constructor(callback, files_loading) {
    super();
    this.callback = callback;
    this.files_loading = files_loading;
    this.loads = /* @__PURE__ */ new Map();
  }
  /**
   * @param {ProgressInfo} info
   */
  _call(info) {
    if (info.status === "progress") {
      this.files_loading[info.file] = {
        loaded: info.loaded,
        total: info.total
      };
      const loaded = Object.values(this.files_loading).reduce((acc, curr) => acc + curr.loaded, 0);
      const total = Object.values(this.files_loading).reduce((acc, curr) => acc + curr.total, 0);
      const progress = total > 0 ? loaded / total * 100 : 0;
      this.callback({
        status: "progress_total",
        name: info.name,
        progress,
        loaded,
        total,
        files: structuredClone(this.files_loading)
      });
    }
    this.callback(info);
  }
};
function isIntegralNumber(x) {
  return Number.isInteger(x) || typeof x === "bigint";
}
function isNullishDimension(x) {
  return x === null || x === void 0 || x === -1;
}
function mergeArrays(...arrs) {
  return Array.prototype.concat.apply([], arrs);
}
function calculateReflectOffset(i, w) {
  return Math.abs((i + w) % (2 * w) - w);
}
function pick(o, props) {
  return Object.assign(
    {},
    ...props.map((prop) => {
      if (o[prop] !== void 0) {
        return { [prop]: o[prop] };
      }
    })
  );
}

// browser-unavailable:node:fs
var node_fs_default = {};

// browser-unavailable:node:path
var node_path_default = {};

// browser-unavailable:node:url
var node_url_default = {};

// node_modules/@huggingface/transformers/src/env.js
var VERSION = "4.3.2";
var HAS_SELF = typeof self !== "undefined";
var IS_FS_AVAILABLE = !isEmpty(node_fs_default);
var IS_PATH_AVAILABLE = !isEmpty(node_path_default);
var IS_WEB_CACHE_AVAILABLE = HAS_SELF && "caches" in self;
var IS_DENO_RUNTIME = typeof globalThis.Deno !== "undefined";
var IS_BUN_RUNTIME = typeof globalThis.Bun !== "undefined";
var IS_DENO_WEB_RUNTIME = IS_DENO_RUNTIME && IS_WEB_CACHE_AVAILABLE && !IS_FS_AVAILABLE;
var IS_PROCESS_AVAILABLE = typeof process !== "undefined";
var IS_NODE_ENV = IS_PROCESS_AVAILABLE && process?.release?.name === "node" && !IS_DENO_WEB_RUNTIME;
var IS_BROWSER_ENV = typeof window !== "undefined" && typeof window.document !== "undefined";
var IS_WEBWORKER_ENV = HAS_SELF && ["DedicatedWorkerGlobalScope", "ServiceWorkerGlobalScope", "SharedWorkerGlobalScope"].includes(
  self.constructor?.name
);
var IS_WEB_ENV = IS_BROWSER_ENV || IS_WEBWORKER_ENV || IS_DENO_WEB_RUNTIME;
var IS_WEBGPU_AVAILABLE = IS_NODE_ENV || typeof navigator !== "undefined" && "gpu" in navigator;
var IS_WEBNN_AVAILABLE = typeof navigator !== "undefined" && "ml" in navigator;
var IS_CRYPTO_AVAILABLE = typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function";
var IS_CHROME_AVAILABLE = (
  // @ts-ignore - chrome may not exist in all environments
  typeof chrome !== "undefined" && typeof chrome.runtime !== "undefined" && typeof chrome.runtime.id === "string"
);
var IS_SERVICE_WORKER_ENV = (
  // @ts-ignore - ServiceWorkerGlobalScope may not exist in all environments
  typeof ServiceWorkerGlobalScope !== "undefined" && HAS_SELF && self instanceof ServiceWorkerGlobalScope
);
var isSafariBelow26 = () => {
  if (typeof navigator === "undefined") {
    return false;
  }
  const userAgent = navigator.userAgent;
  const isSafari = (navigator.vendor || "").indexOf("Apple") > -1 && !userAgent.match(/CriOS|FxiOS|EdgiOS|OPiOS|mercury|brave/i) && !userAgent.includes("Chrome") && !userAgent.includes("Android");
  if (!isSafari) {
    return false;
  }
  const match = userAgent.match(/Version\/(\d+)/);
  return match ? parseInt(match[1], 10) < 26 : false;
};
var IS_SAFARI_BELOW_26 = isSafariBelow26();
var apis = Object.freeze({
  /** Whether we are running in a browser environment (and not a web worker) */
  IS_BROWSER_ENV,
  /** Whether we are running in a web worker environment */
  IS_WEBWORKER_ENV,
  /** Whether we are running in a web-like environment (browser, web worker, or Deno web runtime) */
  IS_WEB_ENV,
  /** Whether we are running in a service worker environment */
  IS_SERVICE_WORKER_ENV,
  /** Whether we are running in Deno's web runtime (CDN imports, Cache API available, no filesystem) */
  IS_DENO_WEB_RUNTIME,
  /** Whether the Cache API is available */
  IS_WEB_CACHE_AVAILABLE,
  /** Whether the WebGPU API is available */
  IS_WEBGPU_AVAILABLE,
  /** Whether the WebNN API is available */
  IS_WEBNN_AVAILABLE,
  /** Whether we are running in a Safari browser older than version 26. */
  IS_SAFARI_BELOW_26,
  /** Whether the Node.js process API is available */
  IS_PROCESS_AVAILABLE,
  /** Whether we are running in a Node.js-like environment (node, deno, bun) */
  IS_NODE_ENV,
  /** Whether the filesystem API is available */
  IS_FS_AVAILABLE,
  /** Whether the path API is available */
  IS_PATH_AVAILABLE,
  /** Whether the crypto API is available */
  IS_CRYPTO_AVAILABLE,
  /** Whether the Chrome runtime API is available */
  IS_CHROME_AVAILABLE
});
var RUNNING_LOCALLY = IS_FS_AVAILABLE && IS_PATH_AVAILABLE;
var dirname__ = "./";
if (RUNNING_LOCALLY) {
  const _import_meta_url = import.meta.url;
  if (_import_meta_url) {
    dirname__ = node_path_default.dirname(node_path_default.dirname(node_url_default.fileURLToPath(_import_meta_url)));
  } else if (typeof __dirname !== "undefined") {
    dirname__ = node_path_default.dirname(__dirname);
  }
}
var DEFAULT_CACHE_DIR = RUNNING_LOCALLY ? node_path_default.join(dirname__, "/.cache/") : null;
var DEFAULT_LOCAL_MODEL_PATH = "/models/";
var localModelPath = RUNNING_LOCALLY ? node_path_default.join(dirname__, DEFAULT_LOCAL_MODEL_PATH) : DEFAULT_LOCAL_MODEL_PATH;
var DEFAULT_FETCH = typeof globalThis.fetch === "function" ? globalThis.fetch.bind(globalThis) : void 0;
var LogLevel = Object.freeze({
  /** All messages including debug output (value: 10) */
  DEBUG: 10,
  /** Errors, warnings, and info messages (value: 20) */
  INFO: 20,
  /** Errors and warnings (value: 30) */
  WARNING: 30,
  /** Only error messages (value: 40) */
  ERROR: 40,
  /** No logging output (value: 50) */
  NONE: 50
});
var logLevel = LogLevel.WARNING;
var env = {
  version: VERSION,
  /////////////////// Backends settings ///////////////////
  // NOTE: These will be populated later by the backends themselves.
  backends: {
    // onnxruntime-web/onnxruntime-node
    onnx: {}
  },
  /////////////////// Logging settings ///////////////////
  get logLevel() {
    return logLevel;
  },
  set logLevel(level) {
    logLevel = level;
    env.backends.onnx?.setLogLevel?.(level);
  },
  /////////////////// Model settings ///////////////////
  allowRemoteModels: true,
  remoteHost: "https://huggingface.co/",
  remotePathTemplate: "{model}/resolve/{revision}/",
  allowLocalModels: !(IS_BROWSER_ENV || IS_WEBWORKER_ENV || IS_DENO_WEB_RUNTIME),
  // Default to true for non-web environments, false for web environments
  localModelPath,
  useFS: IS_FS_AVAILABLE,
  /////////////////// Cache settings ///////////////////
  useBrowserCache: IS_WEB_CACHE_AVAILABLE,
  useFSCache: IS_FS_AVAILABLE,
  cacheDir: DEFAULT_CACHE_DIR,
  useCustomCache: false,
  customCache: null,
  useWasmCache: IS_WEB_CACHE_AVAILABLE || IS_FS_AVAILABLE,
  cacheKey: "transformers-cache",
  experimental_useCrossOriginStorage: false,
  /////////////////// Custom fetch /////////////////////
  fetch: DEFAULT_FETCH
  //////////////////////////////////////////////////////
};
function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

// node_modules/@huggingface/transformers/src/utils/hub/FileResponse.js
var CONTENT_TYPE_MAP = {
  txt: "text/plain",
  html: "text/html",
  css: "text/css",
  js: "text/javascript",
  json: "application/json",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif"
};
var FileResponse = class _FileResponse {
  /**
   * Creates a new `FileResponse` object.
   * @param {string} filePath
   */
  constructor(filePath) {
    this.filePath = filePath;
    this.headers = new Headers();
    this.exists = node_fs_default.existsSync(filePath);
    if (this.exists) {
      this.status = 200;
      this.statusText = "OK";
      let stats = node_fs_default.statSync(filePath);
      this.headers.set("content-length", stats.size.toString());
      this.updateContentType();
      const stream = node_fs_default.createReadStream(filePath);
      this.body = new ReadableStream({
        start(controller) {
          stream.on("data", (chunk) => controller.enqueue(chunk));
          stream.on("end", () => controller.close());
          stream.on("error", (err) => controller.error(err));
        },
        cancel() {
          stream.destroy();
        }
      });
    } else {
      this.status = 404;
      this.statusText = "Not Found";
      this.body = null;
    }
  }
  /**
   * Updates the 'content-type' header property of the response based on the extension of
   * the file specified by the filePath property of the current object.
   * @returns {void}
   */
  updateContentType() {
    const extension = this.filePath.toString().split(".").pop().toLowerCase();
    this.headers.set("content-type", CONTENT_TYPE_MAP[extension] ?? "application/octet-stream");
  }
  /**
   * Clone the current FileResponse object.
   * @returns {FileResponse} A new FileResponse object with the same properties as the current object.
   */
  clone() {
    let response = new _FileResponse(this.filePath);
    response.exists = this.exists;
    response.status = this.status;
    response.statusText = this.statusText;
    response.headers = new Headers(this.headers);
    return response;
  }
  /**
   * Reads the contents of the file specified by the filePath property and returns a Promise that
   * resolves with an ArrayBuffer containing the file's contents.
   * @returns {Promise<ArrayBuffer>} A Promise that resolves with an ArrayBuffer containing the file's contents.
   * @throws {Error} If the file cannot be read.
   */
  async arrayBuffer() {
    const data = await node_fs_default.promises.readFile(this.filePath);
    return (
      /** @type {ArrayBuffer} */
      data.buffer
    );
  }
  /**
   * Reads the contents of the file specified by the filePath property and returns a Promise that
   * resolves with a Blob containing the file's contents.
   * @returns {Promise<Blob>} A Promise that resolves with a Blob containing the file's contents.
   * @throws {Error} If the file cannot be read.
   */
  async blob() {
    const data = await node_fs_default.promises.readFile(this.filePath);
    return new Blob([
      /** @type {any} */
      data
    ], { type: this.headers.get("content-type") });
  }
  /**
   * Reads the contents of the file specified by the filePath property and returns a Promise that
   * resolves with a string containing the file's contents.
   * @returns {Promise<string>} A Promise that resolves with a string containing the file's contents.
   * @throws {Error} If the file cannot be read.
   */
  async text() {
    return await node_fs_default.promises.readFile(this.filePath, "utf8");
  }
  /**
   * Reads the contents of the file specified by the filePath property and returns a Promise that
   * resolves with a parsed JavaScript object containing the file's contents.
   *
   * @returns {Promise<Object>} A Promise that resolves with a parsed JavaScript object containing the file's contents.
   * @throws {Error} If the file cannot be read.
   */
  async json() {
    return JSON.parse(await this.text());
  }
};

// node_modules/@huggingface/transformers/src/utils/random.js
var Random = class {
  constructor(seed) {
    this._mt = new Uint32Array(624);
    this._idx = 625;
    this._gauss_next = null;
    this._random_fn = this.random.bind(this);
    this.seed(seed);
  }
  /**
   * Seeds this instance's PRNG.
   *
   * When called with a number, initializes the state deterministically from that value.
   * When called with no arguments (or `undefined`/`null`), seeds from OS entropy
   * via `crypto.getRandomValues`, matching Python's `random.seed()` behavior.
   *
   * @param {number} [n] The seed value. Omit to seed from OS entropy.
   */
  seed(n) {
    if (n === void 0 || n === null) {
      if (apis.IS_CRYPTO_AVAILABLE) {
        const buf = new Uint32Array(1);
        crypto.getRandomValues(buf);
        n = buf[0];
      } else {
        n = Date.now() >>> 0;
      }
    }
    if (Number.isSafeInteger(n)) n = Math.abs(n);
    const mt2 = this._mt;
    const u = (a, b) => Math.imul(a, b) >>> 0, key = [];
    for (let v2 = n || 0; v2 > 0; v2 = Math.floor(v2 / 4294967296)) key.push(v2 & 4294967295);
    if (!key.length) key.push(0);
    mt2[0] = 19650218;
    for (let k = 1; k < 624; ++k) mt2[k] = u(1812433253, mt2[k - 1] ^ mt2[k - 1] >>> 30) + k >>> 0;
    let i = 1, j = 0;
    for (let k = Math.max(624, key.length); k > 0; --k, ++i, ++j) {
      if (i >= 624) {
        mt2[0] = mt2[623];
        i = 1;
      }
      if (j >= key.length) j = 0;
      mt2[i] = (mt2[i] ^ u(mt2[i - 1] ^ mt2[i - 1] >>> 30, 1664525)) + key[j] + j >>> 0;
    }
    for (let k = 623; k > 0; --k, ++i) {
      if (i >= 624) {
        mt2[0] = mt2[623];
        i = 1;
      }
      mt2[i] = (mt2[i] ^ u(mt2[i - 1] ^ mt2[i - 1] >>> 30, 1566083941)) - i >>> 0;
    }
    mt2[0] = 2147483648;
    this._idx = 624;
    this._gauss_next = null;
  }
  /**
   * Generates a random unsigned 32-bit integer.
   *
   * Performs the "twist" step when the state buffer is exhausted,
   * then applies the standard MT19937 tempering transform.
   *
   * @returns {number} A random integer in the range [0, 2^32 - 1].
   * @internal
   */
  _int32() {
    const mt2 = this._mt;
    if (this._idx >= 624) {
      for (let k = 0; k < 624; ++k) {
        const y2 = mt2[k] & 2147483648 | mt2[(k + 1) % 624] & 2147483647;
        mt2[k] = (mt2[(k + 397) % 624] ^ y2 >>> 1 ^ (y2 & 1 ? 2567483615 : 0)) >>> 0;
      }
      this._idx = 0;
    }
    let y = mt2[this._idx++];
    y ^= y >>> 11;
    y ^= y << 7 & 2636928640;
    y ^= y << 15 & 4022730752;
    y ^= y >>> 18;
    return y >>> 0;
  }
  /**
   * Generates a random floating-point number in the half-open interval [0, 1).
   *
   * Combines two 32-bit integers (using 53 bits of precision) to produce
   * a uniformly distributed double, matching Python's `random.random()`.
   *
   * @returns {number} A random float in [0, 1).
   */
  random() {
    return ((this._int32() >>> 5) * 67108864 + (this._int32() >>> 6)) / 9007199254740992;
  }
  /**
   * Generates a random number from a Gaussian (normal) distribution.
   *
   * Uses the Box-Muller transform with a cached spare value,
   * matching Python's `random.gauss()` output for the same seed.
   *
   * @param {number} [mu=0] The mean of the distribution.
   * @param {number} [sigma=1] The standard deviation of the distribution.
   * @returns {number} A normally distributed random value.
   */
  gauss(mu = 0, sigma = 1) {
    let z2 = this._gauss_next;
    this._gauss_next = null;
    if (z2 === null) {
      const x2pi = this.random() * 2 * Math.PI, g2rad = Math.sqrt(-2 * Math.log(1 - this.random()));
      z2 = Math.cos(x2pi) * g2rad;
      this._gauss_next = Math.sin(x2pi) * g2rad;
    }
    return mu + z2 * sigma;
  }
  /**
   * Shuffles an array in-place using the Fisher-Yates algorithm.
   *
   * Uses rejection sampling via `getrandbits`-style bit masking to ensure
   * a uniform distribution, matching Python's `random.shuffle()`.
   *
   * @param {any[]} arr The array to shuffle in-place.
   */
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; --i) {
      const k = 32 - Math.clz32(i + 1);
      let r = this._int32() >>> 32 - k;
      while (r > i) r = this._int32() >>> 32 - k;
      const t = arr[i];
      arr[i] = arr[r];
      arr[r] = t;
    }
  }
  /**
   * Selects a single element from a weighted population.
   *
   * Matches Python's `random.choices(population, weights=weights, k=1)[0]`
   *
   * @param {any[]} population The array of items to choose from.
   * @param {number[]} weights An array of non-negative weights, one per population element.
   * @returns {*} A single randomly selected element from the population.
   */
  choices(population, weights) {
    return population[_weightedIndexWith(this._random_fn, weights)];
  }
};
function _weightedIndexWith(randomFn, weights) {
  let sum = 0;
  for (let i = 0; i < weights.length; ++i) sum += weights[i];
  let x = randomFn() * sum;
  for (let i = 0; i < weights.length; ++i) {
    x -= weights[i];
    if (x < 0) return i;
  }
  return weights.length - 1;
}
var _default = new Random();
var random = Object.freeze({
  Random,
  seed: _default.seed.bind(_default),
  random: _default.random.bind(_default),
  gauss: _default.gauss.bind(_default),
  shuffle: _default.shuffle.bind(_default),
  choices: _default.choices.bind(_default)
});

// node_modules/@huggingface/transformers/src/utils/cache/FileCache.js
var rng = new Random();
var FileCache = class {
  /**
   * Instantiate a `FileCache` object.
   * @param {string} path
   */
  constructor(path) {
    this.path = path;
  }
  /**
   * Checks whether the given request is in the cache.
   * @param {string} request
   * @returns {Promise<FileResponse | undefined>}
   */
  async match(request) {
    let filePath = node_path_default.join(this.path, request);
    let file = new FileResponse(filePath);
    if (file.exists) {
      return file;
    } else {
      return void 0;
    }
  }
  /**
   * Adds the given response to the cache.
   * @param {string} request
   * @param {Response} response
   * @param {(data: {progress: number, loaded: number, total: number}) => void} [progress_callback] Optional.
   * The function to call with progress updates
   * @returns {Promise<void>}
   */
  async put(request, response, progress_callback = void 0) {
    const filePath = node_path_default.join(this.path, request);
    const id = apis.IS_PROCESS_AVAILABLE ? process.pid : Date.now();
    const randomSuffix = rng._int32().toString(36);
    const tmpPath = filePath + `.tmp.${id}.${randomSuffix}`;
    try {
      const contentLength = response.headers.get("Content-Length");
      const total = parseInt(contentLength ?? "0");
      let loaded = 0;
      await node_fs_default.promises.mkdir(node_path_default.dirname(filePath), { recursive: true });
      const fileStream = node_fs_default.createWriteStream(tmpPath);
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        await new Promise((resolve, reject) => {
          fileStream.write(value, (err) => {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          });
        });
        loaded += value.length;
        const progress = total ? loaded / total * 100 : 0;
        progress_callback?.({ progress, loaded, total });
      }
      await new Promise((resolve, reject) => {
        fileStream.close((err) => err ? reject(err) : resolve());
      });
      await node_fs_default.promises.rename(tmpPath, filePath);
    } catch (error) {
      try {
        await node_fs_default.promises.unlink(tmpPath);
      } catch {
      }
      throw error;
    }
  }
  /**
   * Deletes the cache entry for the given request.
   * @param {string} request
   * @returns {Promise<boolean>} A Promise that resolves to `true` if the cache entry was deleted, `false` otherwise.
   */
  async delete(request) {
    let filePath = node_path_default.join(this.path, request);
    try {
      await node_fs_default.promises.unlink(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }
  // TODO add the rest?
  // addAll(requests: RequestInfo[]): Promise<void>;
  // keys(request?: RequestInfo | URL, options?: CacheQueryOptions): Promise<ReadonlyArray<Request>>;
  // match(request: RequestInfo | URL, options?: CacheQueryOptions): Promise<Response | undefined>;
  // matchAll(request?: RequestInfo | URL, options?: CacheQueryOptions): Promise<ReadonlyArray<Response>>;
};

// node_modules/@huggingface/transformers/src/utils/hub/constants.js
var ERROR_MAPPING = {
  // 4xx errors (https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#client_error_responses)
  400: "Bad request error occurred while trying to load file",
  401: "Unauthorized access to file",
  403: "Forbidden access to file",
  404: "Could not locate file",
  408: "Request timeout error occurred while trying to load file",
  // 5xx errors (https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#server_error_responses)
  500: "Internal server error error occurred while trying to load file",
  502: "Bad gateway error occurred while trying to load file",
  503: "Service unavailable error occurred while trying to load file",
  504: "Gateway timeout error occurred while trying to load file"
};
var MAX_EXTERNAL_DATA_CHUNKS = 100;
var REPO_ID_REGEX = /^(\b[\w\-.]+\b\/)?\b[\w\-.]{1,96}\b$/;

// node_modules/@huggingface/transformers/src/utils/logger.js
var logger = {
  /**
   * Log an error message. Only suppressed when logLevel is NONE.
   * @param  {...any} args - Arguments to log
   */
  error(...args) {
    if (env.logLevel <= LogLevel.ERROR) {
      console.error(...args);
    }
  },
  /**
   * Log a warning message. Shown when logLevel <= WARNING.
   * @param  {...any} args - Arguments to log
   */
  warn(...args) {
    if (env.logLevel <= LogLevel.WARNING) {
      console.warn(...args);
    }
  },
  /**
   * Log an info message. Shown when logLevel <= INFO.
   * @param  {...any} args - Arguments to log
   */
  info(...args) {
    if (env.logLevel <= LogLevel.INFO) {
      console.log(...args);
    }
  },
  /**
   * Log a debug message. Only shown when logLevel is DEBUG.
   * @param  {...any} args - Arguments to log
   */
  debug(...args) {
    if (env.logLevel <= LogLevel.DEBUG) {
      console.log(...args);
    }
  },
  /**
   * Log a message (alias for info). Shown when logLevel <= INFO.
   * @param  {...any} args - Arguments to log
   */
  log(...args) {
    this.info(...args);
  }
};

// node_modules/@huggingface/transformers/src/utils/hub/utils.js
function pathJoin(...parts) {
  parts = parts.map((part, index) => {
    if (index) {
      part = part.replace(new RegExp("^/"), "");
    }
    if (index !== parts.length - 1) {
      part = part.replace(new RegExp("/$"), "");
    }
    return part;
  });
  return parts.join("/");
}
function isValidUrl(string, protocols = null, validHosts = null) {
  let url;
  try {
    url = new URL(string);
  } catch (_2) {
    return false;
  }
  if (protocols && !protocols.includes(url.protocol)) {
    return false;
  }
  if (validHosts && !validHosts.includes(url.hostname)) {
    return false;
  }
  return true;
}
function isValidHfModelId(string) {
  if (!REPO_ID_REGEX.test(string)) return false;
  if (string.includes("..") || string.includes("--")) return false;
  if (string.endsWith(".git") || string.endsWith(".ipynb")) return false;
  return true;
}
function makePretrainedOptionsKey(model_id, options = {}, ...parts) {
  return JSON.stringify([
    model_id,
    options.revision ?? "main",
    options.cache_dir ?? null,
    options.local_files_only ?? false,
    ...parts
  ]);
}
var ModelFileNotFoundError = class extends Error {
  /**
   * @param {string} message The error message.
   * @param {Object} [options] Additional error information.
   * @param {number|null} [options.status=null] The HTTP status code, when the failure came from a Hub response.
   */
  constructor(message, { status = null } = {}) {
    super(message);
    this.name = "ModelFileNotFoundError";
    this.status = status;
  }
};
var NOT_FOUND_STATUSES = /* @__PURE__ */ new Set([401, 403, 404]);
function handleError(status, remoteURL, fatal) {
  if (!fatal) {
    return null;
  }
  const message = ERROR_MAPPING[status] ?? `Error (${status}) occurred while trying to load file`;
  const fullMessage = `${message}: "${remoteURL}".`;
  if (NOT_FOUND_STATUSES.has(status)) {
    throw new ModelFileNotFoundError(fullMessage, { status });
  }
  throw Error(fullMessage);
}
async function readResponse(response, progress_callback, expectedSize) {
  const contentLength = response.headers.get("Content-Length");
  let total = contentLength ? parseInt(contentLength, 10) : expectedSize ?? 0;
  if (contentLength === null && !expectedSize) {
    logger.warn("Unable to determine content-length from response headers. Will expand buffer when needed.");
  }
  let buffer = new Uint8Array(total);
  let loaded = 0;
  const reader = response.body.getReader();
  async function read() {
    const { done, value } = await reader.read();
    if (done) return;
    const newLoaded = loaded + value.length;
    if (newLoaded > total) {
      total = newLoaded;
      const newBuffer = new Uint8Array(total);
      newBuffer.set(buffer);
      buffer = newBuffer;
    }
    buffer.set(value, loaded);
    loaded = newLoaded;
    const progress = loaded / total * 100;
    progress_callback({ progress, loaded, total });
    return read();
  }
  await read();
  return buffer;
}
function isBlobURL(url) {
  return isValidUrl(url, ["blob:"]);
}
function toAbsoluteURL(url, { allowUnresolved = false } = {}) {
  let baseURL;
  if (typeof location !== "undefined" && location.href) {
    baseURL = location.href;
  } else if (typeof import.meta !== "undefined" && import.meta.url) {
    baseURL = import.meta.url;
  } else {
    return url;
  }
  try {
    return new URL(url, baseURL).href;
  } catch (error) {
    if (!allowUnresolved) {
      throw error;
    }
    return url;
  }
}

// node_modules/@huggingface/transformers/src/utils/cache/CrossOriginStorageCache.js
var HASH_ALGORITHM = "SHA-256";
var HASH_CACHE_NAME = "experimental_transformers-hash-cache";
var makeHashDescriptor = (value) => ({ algorithm: HASH_ALGORITHM, value });
var CrossOriginStorage = class {
  /** @type {Promise<Cache> | null} */
  #hashCache = null;
  /**
   * Returns (and lazily opens) the hash cache, reusing the same promise across concurrent callers.
   * @returns {Promise<Cache>}
   */
  _getHashCache = () => {
    this.#hashCache ??= caches.open(HASH_CACHE_NAME);
    return this.#hashCache;
  };
  /**
   * Returns whether the `navigator.crossOriginStorage` API is available in the current environment.
   * @returns {boolean}
   */
  static isAvailable = () => typeof navigator !== "undefined" && "crossOriginStorage" in navigator;
  /**
   * Looks up a cached response for the given URL by resolving its SHA-256 hash and requesting
   * the corresponding file handle from cross-origin storage.
   *
   * Implements `CacheInterface.match`.
   *
   * @param {string} request The URL of the resource to look up.
   * @returns {Promise<Response|undefined>} The cached `Response`, or `undefined` if not found.
   */
  match = async (request) => {
    const hashValue = await this._getFileHash(request);
    if (!hashValue) {
      return void 0;
    }
    try {
      const handle = await navigator.crossOriginStorage.requestFileHandle(makeHashDescriptor(hashValue));
      const blob = await handle.getFile();
      return new Response(blob, {
        headers: {
          "Content-Length": String(blob.size)
        }
      });
    } catch {
      return void 0;
    }
  };
  /**
   * Stores a response in cross-origin storage, keyed by its SHA-256 hash.
   *
   * For LFS-backed URLs the hash is resolved cheaply via `_getFileHash` (which checks
   * `HASH_CACHE_NAME` first, then falls back to fetching the Git LFS pointer file)
   * without reading the response body a second time.
   *
   * For non-LFS resources the hash is unknown upfront.  In that case the body is consumed
   * in the background: the stream is read to compute the content hash, the file is written
   * into cross-origin storage, and the computed hash is persisted to `HASH_CACHE_NAME`
   * so that future `match` calls can resolve the file without a network round-trip.
   *
   * Implements `CacheInterface.put`.
   *
   * @param {string} request The URL of the resource (used as the hash-cache key).
   * @param {Response} response The response whose body will be written to the cache.
   * @returns {Promise<void>}
   */
  put = async (request, response) => {
    const hashValue = await this._getFileHash(request);
    if (hashValue) {
      const blob = await response.blob();
      await this._storeBlobInCOS(blob, hashValue);
    } else {
      this._processAndStore(request, response.body);
    }
  };
  /**
   * Writes a blob into cross-origin storage using the given pre-computed hex hash string.
   *
   * @param {Blob} blob
   * @param {string} hashHex Hex-encoded SHA-256 hash of `blob`.
   * @returns {Promise<void>}
   */
  _storeBlobInCOS = async (blob, hashHex) => {
    const handle = await navigator.crossOriginStorage.requestFileHandle(makeHashDescriptor(hashHex), {
      create: true,
      origins: "*"
    });
    const writableStream = await handle.createWritable();
    await writableStream.write(blob);
    await writableStream.close();
  };
  /**
   * Background task for non-LFS resources: consumes `stream`, computes the SHA-256 hash
   * of the resulting blob, stores it in cross-origin storage, and persists the computed
   * hash to `HASH_CACHE_NAME` keyed by `request` so future `match` calls can resolve the
   * file without a network round-trip.
   *
   * Called fire-and-forget from `put` — errors are swallowed so failures never surface to
   * the caller.
   *
   * @param {string} request The original resource URL.
   * @param {ReadableStream} stream The response body stream to consume.
   * @returns {Promise<void>}
   */
  _processAndStore = async (request, stream) => {
    try {
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const blob = new Blob(chunks);
      const hashHex = await this._getBlobHash(blob);
      await this._storeBlobInCOS(blob, hashHex);
      try {
        const hashCache = await this._getHashCache();
        await hashCache.put(request, new Response(hashHex));
      } catch {
      }
    } catch {
    }
  };
  /**
   * Deletes the cache entry for the given request.
   *
   * Removes the hash entry from `HASH_CACHE_NAME`. Note: cross-origin storage itself does not
   * expose a delete API, so only the local hash mapping is removed. For non-LFS URLs this
   * permanently prevents `match` from resolving the file. For LFS-backed URLs, `match` will
   * re-fetch the LFS pointer file on the next call and repopulate the hash cache automatically.
   *
   * Implements `CacheInterface.delete`.
   *
   * @param {string} request
   * @returns {Promise<boolean>} Resolves to `true` if the hash entry was deleted, `false` otherwise.
   */
  delete = async (request) => {
    try {
      const hashCache = await this._getHashCache();
      return await hashCache.delete(request);
    } catch {
      return false;
    }
  };
  /**
   * Resolves the SHA-256 hash for a given URL.
   *
   * Returns the cached hash immediately if one has been persisted to `HASH_CACHE_NAME`.
   * Otherwise falls back to `_getLfsFileHash` to retrieve the hash from the Hugging Face
   * LFS pointer file, persisting the result to `HASH_CACHE_NAME` for future lookups.
   *
   * Returns `null` if the hash cannot be determined (e.g. non-LFS URL with no cached entry).
   *
   * @param {string} url The resource URL to resolve a hash for.
   * @returns {Promise<string|null>} The hex-encoded SHA-256 hash, or `null` if unavailable.
   */
  _getFileHash = async (url) => {
    try {
      const hashCache = await this._getHashCache();
      const cached = await hashCache.match(url);
      if (cached) {
        return cached.text();
      }
      const hash = await this._getLfsFileHash(url);
      if (hash) {
        await hashCache.put(url, new Response(hash));
        return hash;
      }
      return null;
    } catch {
      return null;
    }
  };
  /**
   * Attempts to retrieve the SHA-256 hash for a Hugging Face resource URL from its raw
   * Git LFS pointer file.
   *
   * Only applicable to URLs containing `/resolve/` (i.e. Hugging Face resolved file URLs).
   * The `/resolve/` segment is rewritten to `/raw/` to fetch the LFS pointer directly.
   * Returns `null` for non-LFS URLs or when the network request fails.
   *
   * @see https://huggingface.co/docs/hub/en/storage-backends#xet
   * @param {string} url The resolved Hugging Face URL of the resource.
   * @returns {Promise<string|null>} The hex-encoded SHA-256 hash, or `null` if unavailable.
   */
  _getLfsFileHash = async (url) => {
    if (!url.includes("/resolve/")) {
      return null;
    }
    const rawUrl = url.replace("/resolve/", "/raw/");
    try {
      const text = await fetch(rawUrl).then((r) => r.text());
      const match = text.match(/^oid sha256:([0-9a-f]+)$/m);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };
  /**
   * Computes the SHA-256 hash of a `Blob`'s contents.
   *
   * @param {Blob} blob The blob to hash.
   * @returns {Promise<string>} The lowercase hex-encoded SHA-256 hash.
   */
  _getBlobHash = async (blob) => {
    const arrayBuffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest(HASH_ALGORITHM, arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
  };
};

// node_modules/@huggingface/transformers/src/utils/cache.js
async function getCache(file_cache_dir = null) {
  let cache2 = null;
  if (env.useCustomCache) {
    if (!env.customCache) {
      throw Error("`env.useCustomCache=true`, but `env.customCache` is not defined.");
    }
    if (!env.customCache.match || !env.customCache.put) {
      throw new Error(
        "`env.customCache` must be an object which implements the `match` and `put` functions of the Web Cache API. For more information, see https://developer.mozilla.org/en-US/docs/Web/API/Cache"
      );
    }
    cache2 = env.customCache;
  }
  if (!cache2 && env.experimental_useCrossOriginStorage && CrossOriginStorage.isAvailable()) {
    cache2 = new CrossOriginStorage();
  }
  if (!cache2 && env.useBrowserCache) {
    if (typeof caches === "undefined") {
      throw Error("Browser cache is not available in this environment.");
    }
    try {
      cache2 = await caches.open(env.cacheKey);
    } catch (e) {
      logger.warn("An error occurred while opening the browser cache:", e);
    }
  }
  if (!cache2 && env.useFSCache) {
    if (!apis.IS_FS_AVAILABLE) {
      throw Error("File System Cache is not available in this environment.");
    }
    cache2 = new FileCache(file_cache_dir ?? env.cacheDir);
  }
  return cache2;
}
async function tryCache(cache2, ...names) {
  for (let name of names) {
    try {
      let result = await cache2.match(name);
      if (result) return result;
    } catch (e) {
      continue;
    }
  }
  return void 0;
}

// node_modules/@huggingface/transformers/src/utils/lru_cache.js
var LRUCache = class {
  /** @type {number} */
  #capacity;
  /** @type {Map<any, any>} */
  #cache;
  /**
   * Creates an LRUCache instance.
   * @param {number} capacity The maximum number of items the cache can hold.
   */
  constructor(capacity) {
    this.#capacity = capacity;
    this.#cache = /* @__PURE__ */ new Map();
  }
  /**
   * Retrieves the value associated with the given key and marks the key as recently used.
   * @param {any} key The key to retrieve.
   * @returns {any} The value associated with the key, or undefined if the key does not exist.
   */
  get(key) {
    if (!this.#cache.has(key)) return void 0;
    const value = this.#cache.get(key);
    this.#cache.delete(key);
    this.#cache.set(key, value);
    return value;
  }
  /**
   * Inserts or updates the key-value pair in the cache.
   * If the key already exists, it is updated and marked as recently used.
   * If the cache exceeds its capacity, the least recently used item is evicted.
   * @param {any} key The key to add or update.
   * @param {any} value The value to associate with the key.
   */
  put(key, value) {
    if (this.#cache.has(key)) {
      this.#cache.delete(key);
    }
    this.#cache.set(key, value);
    if (this.#cache.size > this.#capacity) {
      this.#cache.delete(this.#cache.keys().next().value);
    }
  }
  /**
   * Removes the entry for the given key from the cache.
   * @param {any} key The key to delete.
   * @returns {boolean} `true` if the entry existed and was removed, `false` otherwise.
   */
  delete(key) {
    return this.#cache.delete(key);
  }
  /**
   * Clears the cache.
   */
  clear() {
    this.#cache.clear();
  }
};

// node_modules/@huggingface/transformers/src/utils/memoize_promise.js
var MAX_CACHE_SIZE = 100;
var cache = new LRUCache(MAX_CACHE_SIZE);
function memoizePromise(key, factory) {
  const cached = cache.get(key);
  if (cached !== void 0) {
    return cached;
  }
  const promise = factory().then(
    (value) => value,
    (err) => {
      cache.delete(key);
      return Promise.reject(err);
    }
  );
  cache.put(key, promise);
  return promise;
}

// node_modules/@huggingface/transformers/src/utils/model_registry/get_file_metadata.js
async function fetch_file_head(urlOrPath) {
  if (!isValidUrl(urlOrPath, ["http:", "https:"])) {
    return null;
  }
  const headers = getFetchHeaders(urlOrPath);
  headers.set("Range", "bytes=0-0");
  return env.fetch(urlOrPath, { method: "GET", headers, cache: "no-store" });
}
function get_file_metadata(path_or_repo_id, filename, options = {}) {
  const key = makePretrainedOptionsKey(path_or_repo_id, options, filename);
  return memoizePromise(key, () => _get_file_metadata(path_or_repo_id, filename, options));
}
async function _get_file_metadata(path_or_repo_id, filename, options) {
  const cache2 = await getCache(options?.cache_dir);
  const { localPath, remoteURL, proposedCacheKey, validModelId } = buildResourcePaths(
    path_or_repo_id,
    filename,
    options,
    cache2
  );
  const cachedResponse = await checkCachedResource(cache2, localPath, proposedCacheKey);
  if (cachedResponse !== void 0 && typeof cachedResponse !== "string") {
    const size = cachedResponse.headers.get("content-length");
    const contentType = cachedResponse.headers.get("content-type");
    return {
      exists: true,
      size: size ? parseInt(size, 10) : void 0,
      contentType: contentType || void 0,
      fromCache: true
    };
  }
  if (env.allowLocalModels) {
    const isURL = isValidUrl(localPath, ["http:", "https:"]);
    if (!isURL) {
      try {
        const response = await getFile(localPath);
        if (typeof response !== "string" && response.status !== 404) {
          const size = response.headers.get("content-length");
          const contentType = response.headers.get("content-type");
          return {
            exists: true,
            size: size ? parseInt(size, 10) : void 0,
            contentType: contentType || void 0,
            fromCache: false
          };
        }
      } catch (e) {
      }
    }
  }
  if (env.allowRemoteModels && !options.local_files_only && validModelId) {
    const rangeResponse = await fetch_file_head(remoteURL);
    if (rangeResponse && rangeResponse.status >= 200 && rangeResponse.status < 300) {
      let size;
      const contentType = rangeResponse.headers.get("content-type");
      if (rangeResponse.status === 206) {
        const contentRange = rangeResponse.headers.get("content-range");
        if (contentRange) {
          const match = contentRange.match(/bytes \d+-\d+\/(\d+)/);
          if (match) {
            size = parseInt(match[1], 10);
          }
        }
      } else if (rangeResponse.status === 200) {
        try {
          await rangeResponse.body?.cancel();
        } catch (cancelError) {
        }
      }
      if (size === void 0) {
        const contentLength = rangeResponse.headers.get("content-length");
        size = contentLength ? parseInt(contentLength, 10) : void 0;
      }
      return {
        exists: true,
        size,
        contentType: contentType || void 0,
        fromCache: false
      };
    }
    if (rangeResponse && rangeResponse.status !== 404 && rangeResponse.status !== 416) {
      handleError(rangeResponse.status, remoteURL, true);
    }
  }
  return { exists: false, fromCache: false };
}

// node_modules/@huggingface/transformers/src/utils/hub.js
async function getFile(urlOrPath) {
  if (env.useFS && !isValidUrl(urlOrPath, ["http:", "https:", "blob:"])) {
    return new FileResponse(
      urlOrPath instanceof URL ? urlOrPath.protocol === "file:" ? urlOrPath.pathname : urlOrPath.toString() : urlOrPath
    );
  } else {
    return env.fetch(urlOrPath, {
      headers: getFetchHeaders(urlOrPath)
    });
  }
}
function getFetchHeaders(urlOrPath) {
  const isNode = typeof process !== "undefined" && process?.release?.name === "node";
  const headers = new Headers();
  if (isNode) {
    const IS_CI = !!process.env?.TESTING_REMOTELY;
    const version2 = env.version;
    headers.set("User-Agent", `transformers.js/${version2}; is_ci/${IS_CI};`);
    const isHFURL = isValidUrl(urlOrPath, ["http:", "https:"], ["huggingface.co", "hf.co"]);
    if (isHFURL) {
      const token = process.env?.HF_TOKEN ?? process.env?.HF_ACCESS_TOKEN;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }
  } else {
  }
  return headers;
}
function buildResourcePaths(path_or_repo_id, filename, options = {}, cache2 = null) {
  const revision = options.revision ?? "main";
  const requestURL = pathJoin(path_or_repo_id, filename);
  const validModelId = isValidHfModelId(path_or_repo_id);
  const localPath = validModelId ? pathJoin(env.localModelPath, requestURL) : requestURL;
  const remoteURL = pathJoin(
    env.remoteHost,
    env.remotePathTemplate.replaceAll("{model}", path_or_repo_id).replaceAll("{revision}", encodeURIComponent(revision)),
    filename
  );
  const proposedCacheKey = cache2 instanceof FileCache ? (
    // Choose cache key for filesystem cache
    // When using the main revision (default), we use the request URL as the cache key.
    // If a specific revision is requested, we account for this in the cache key.
    revision === "main" ? requestURL : pathJoin(path_or_repo_id, revision, filename)
  ) : remoteURL;
  return {
    requestURL,
    localPath,
    remoteURL,
    proposedCacheKey,
    validModelId
  };
}
async function checkCachedResource(cache2, localPath, proposedCacheKey) {
  if (!cache2) {
    return void 0;
  }
  return await tryCache(cache2, localPath, proposedCacheKey);
}
async function storeCachedResource(path_or_repo_id, filename, cache2, cacheKey, response, result, options = {}) {
  if (await cache2.match(cacheKey) !== void 0) {
    return;
  }
  if (typeof Cache !== "undefined" && cache2 instanceof Cache && !isValidUrl(toAbsoluteURL(cacheKey, { allowUnresolved: true }), ["http:", "https:"])) {
    return;
  }
  if (!result) {
    const wrapped_progress = options.progress_callback ? (data) => dispatchCallback(options.progress_callback, {
      status: "progress",
      name: path_or_repo_id,
      file: filename,
      ...data
    }) : void 0;
    await cache2.put(
      cacheKey,
      /** @type {Response} */
      response,
      wrapped_progress
    );
  } else if (typeof response !== "string") {
    const headers = new Headers(response.headers);
    headers.set("content-length", result.byteLength.toString());
    await cache2.put(
      cacheKey,
      new Response(
        /** @type {any} */
        result,
        {
          headers
        }
      )
    ).catch((err) => {
      logger.warn(`Unable to add response to browser cache: ${err}.`);
    });
  }
}
async function loadResourceFile(path_or_repo_id, filename, fatal = true, options = {}, return_path = false, cache2 = null) {
  const { requestURL, localPath, remoteURL, proposedCacheKey, validModelId } = buildResourcePaths(
    path_or_repo_id,
    filename,
    options,
    cache2
  );
  let cacheKey;
  let toCacheResponse = false;
  let response;
  response = await checkCachedResource(cache2, localPath, proposedCacheKey);
  const cacheHit = response !== void 0;
  if (cacheHit) {
    cacheKey = proposedCacheKey;
  } else {
    if (env.allowLocalModels) {
      const isURL = isValidUrl(requestURL, ["http:", "https:"]);
      if (!isURL) {
        try {
          response = await getFile(localPath);
          cacheKey = localPath;
        } catch (e) {
          logger.warn(`Unable to load from local path "${localPath}": "${e}"`);
        }
      } else if (options.local_files_only) {
        throw new Error(`\`local_files_only=true\`, but attempted to load a remote file from: ${requestURL}.`);
      } else if (!env.allowRemoteModels) {
        throw new Error(
          `\`env.allowRemoteModels=false\`, but attempted to load a remote file from: ${requestURL}.`
        );
      }
    }
    if (response === void 0 || typeof response !== "string" && response.status === 404) {
      if (options.local_files_only || !env.allowRemoteModels) {
        if (fatal) {
          throw new ModelFileNotFoundError(
            `\`local_files_only=true\` or \`env.allowRemoteModels=false\` and file was not found locally at "${localPath}".`
          );
        } else {
          return null;
        }
      }
      if (!validModelId) {
        throw new ModelFileNotFoundError(
          `Local file missing at "${localPath}" and download aborted due to invalid model ID "${path_or_repo_id}".`
        );
      }
      response = await getFile(remoteURL);
      if (response.status !== 200) {
        return handleError(response.status, remoteURL, fatal);
      }
      cacheKey = proposedCacheKey;
    }
    toCacheResponse = cache2 && // 1. A caching system is available
    typeof Response !== "undefined" && // 2. `Response` is defined (i.e., we are in a browser-like environment)
    response instanceof Response && // 3. result is a `Response` object (i.e., not a `FileResponse`)
    response.status === 200;
  }
  dispatchCallback(options.progress_callback, {
    status: "download",
    name: path_or_repo_id,
    file: filename
  });
  let result;
  if (apis.IS_NODE_ENV && return_path) {
  } else {
    let buffer;
    if (typeof response !== "string") {
      if (!options.progress_callback) {
        buffer = new Uint8Array(await response.arrayBuffer());
      } else if (cacheHit && // The item is being read from the cache
      typeof navigator !== "undefined" && /firefox/i.test(navigator.userAgent)) {
        buffer = new Uint8Array(await response.arrayBuffer());
        dispatchCallback(options.progress_callback, {
          status: "progress",
          name: path_or_repo_id,
          file: filename,
          progress: 100,
          loaded: buffer.length,
          total: buffer.length
        });
      } else {
        let expectedSize;
        const contentLength = response.headers.get("content-length");
        if (contentLength) {
          expectedSize = parseInt(contentLength, 10);
        } else {
          try {
            const metadata = await get_file_metadata(path_or_repo_id, filename, options);
            if (metadata.size) {
              expectedSize = metadata.size;
            }
          } catch (e) {
          }
        }
        buffer = await readResponse(
          response,
          (data) => {
            dispatchCallback(options.progress_callback, {
              status: "progress",
              name: path_or_repo_id,
              file: filename,
              ...data
            });
          },
          expectedSize
        );
      }
    }
    result = buffer;
  }
  if (
    // Only cache web responses
    // i.e., do not cache FileResponses (prevents duplication)
    toCacheResponse && cacheKey && typeof response !== "string"
  ) {
    await storeCachedResource(path_or_repo_id, filename, cache2, cacheKey, response, result, options);
  }
  if (apis.IS_NODE_ENV && return_path && options.progress_callback && typeof response !== "string") {
    const size = parseInt(response.headers.get("content-length"), 10) || 0;
    dispatchCallback(options.progress_callback, {
      status: "progress",
      name: path_or_repo_id,
      file: filename,
      progress: 100,
      loaded: size,
      total: size
    });
  }
  dispatchCallback(options.progress_callback, {
    status: "done",
    name: path_or_repo_id,
    file: filename
  });
  if (result) {
    if (!apis.IS_NODE_ENV && return_path) {
      throw new Error("Cannot return path in a browser environment.");
    }
    return result;
  }
  if (response instanceof FileResponse) {
    return response.filePath;
  }
  const cachedResponse = await cache2?.match(cacheKey);
  if (cachedResponse instanceof FileResponse) {
    return cachedResponse.filePath;
  } else if (cachedResponse instanceof Response) {
    return new Uint8Array(await cachedResponse.arrayBuffer());
  } else if (typeof cachedResponse === "string") {
    return cachedResponse;
  }
  throw new Error("Unable to get model file path or buffer.");
}
var INFLIGHT_LOADS = /* @__PURE__ */ new Map();
async function getModelFile(path_or_repo_id, filename, fatal = true, options = {}, return_path = false) {
  if (!env.allowLocalModels) {
    if (options.local_files_only) {
      throw Error(
        "Invalid configuration detected: local models are disabled (`env.allowLocalModels=false`) but you have requested to only use local models (`local_files_only=true`)."
      );
    } else if (!env.allowRemoteModels) {
      throw Error(
        "Invalid configuration detected: both local and remote models are disabled. Fix by setting `env.allowLocalModels` or `env.allowRemoteModels` to `true`."
      );
    }
  }
  const key = makePretrainedOptionsKey(path_or_repo_id, options, filename, fatal, return_path);
  const { progress_callback } = options;
  const loads = progress_callback instanceof DefaultProgressCallback ? progress_callback.loads : INFLIGHT_LOADS;
  let pending = loads.get(key);
  if (!pending) {
    dispatchCallback(progress_callback, {
      status: "initiate",
      name: path_or_repo_id,
      file: filename
    });
    pending = getCache(options.cache_dir).then(
      (cache2) => loadResourceFile(path_or_repo_id, filename, fatal, options, return_path, cache2)
    );
    if (loads === INFLIGHT_LOADS) {
      pending = pending.finally(() => INFLIGHT_LOADS.delete(key));
    }
    loads.set(key, pending);
  }
  return await pending;
}
async function getModelText(modelPath, fileName, fatal = true, options = {}) {
  const buffer = await getModelFile(modelPath, fileName, fatal, options, false);
  if (buffer === null) {
    return null;
  }
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(
    /** @type {Uint8Array} */
    buffer
  );
}
async function getModelJSON(modelPath, fileName, fatal = true, options = {}) {
  const text = await getModelText(modelPath, fileName, fatal, options);
  if (text === null) {
    return {};
  }
  return JSON.parse(text);
}

// node_modules/@huggingface/transformers/src/configs.js
async function loadConfig(pretrained_model_name_or_path, options) {
  return await getModelJSON(pretrained_model_name_or_path, "config.json", true, options);
}
function getNormalizedConfig(config) {
  const mapping = {};
  let init_normalized_config = {};
  switch (config.model_type) {
    // Sub-configs
    case "llava":
    case "paligemma":
    case "gemma3":
    case "florence2":
    case "llava_onevision":
    case "idefics3":
    case "granite_speech":
    case "ultravox":
    case "voxtral":
    case "voxtral_realtime":
    case "smolvlm":
    case "gemma3n":
    case "gemma4":
    case "lfm2_vl":
    case "lfm3_vl":
    case "chatterbox":
    case "lighton_ocr":
    case "glm_ocr":
    case "mistral3":
    case "qwen2_5_vl":
    case "qwen3_vl":
    case "qwen3_vl_moe":
      init_normalized_config = getNormalizedConfig(config.text_config);
      break;
    case "moondream1":
      init_normalized_config = getNormalizedConfig(config.phi_config);
      break;
    case "musicgen":
      init_normalized_config = getNormalizedConfig(config.decoder);
      break;
    case "multi_modality":
      init_normalized_config = getNormalizedConfig(config.language_config);
      break;
    // Decoder-only models
    case "gpt2":
    case "gptj":
    case "jais":
    case "codegen":
    case "gpt_bigcode":
      mapping["num_heads"] = "n_head";
      mapping["num_layers"] = "n_layer";
      mapping["hidden_size"] = "n_embd";
      break;
    case "gpt_neox":
    case "stablelm":
    case "opt":
    case "falcon":
    case "modernbert-decoder":
      mapping["num_heads"] = "num_attention_heads";
      mapping["num_layers"] = "num_hidden_layers";
      mapping["hidden_size"] = "hidden_size";
      break;
    case "gpt_oss":
    case "llama":
    case "llama4_text":
    case "nanochat":
    case "apertus":
    case "arcee":
    case "afmoe":
    case "lfm2":
    case "lfm2_moe":
    case "lfm3":
    case "smollm3":
    case "olmo":
    case "olmo2":
    case "olmo3":
    case "mobilellm":
    case "granite":
    case "granitemoehybrid":
    case "cohere":
    case "cohere2":
    case "mistral":
    case "voxtral_realtime_text":
    case "voxtral_realtime_encoder":
    case "starcoder2":
    case "qwen2":
    case "qwen2_moe":
    case "qwen2_vl":
    case "qwen2_vl_text":
    case "qwen2_5_vl_text":
    case "qwen3_moe":
    case "qwen3_vl_text":
    case "qwen3_vl_moe_text":
    case "phi":
    case "phi3":
    case "phi3_v":
    case "llava_qwen2":
      mapping["num_heads"] = "num_key_value_heads";
      mapping["num_layers"] = "num_hidden_layers";
      mapping["hidden_size"] = "hidden_size";
      mapping["num_attention_heads"] = "num_attention_heads";
      mapping["dim_kv"] = "head_dim";
      break;
    case "qwen3":
    case "solar_open":
    case "glm_ocr_text":
    case "gemma":
    case "gemma2":
    case "vaultgemma":
    case "gemma3_text":
    case "gemma3n_text":
    case "gemma4_text":
    case "glm":
    case "helium":
    case "ernie4_5":
    case "hunyuan_v1_dense":
    case "falcon_h1":
    case "nemotron_h":
    case "ministral":
    case "ministral3":
      mapping["num_heads"] = "num_key_value_heads";
      mapping["num_layers"] = "num_hidden_layers";
      mapping["dim_kv"] = "head_dim";
      break;
    case "openelm":
      mapping["num_heads"] = "num_kv_heads";
      mapping["num_layers"] = "num_transformer_layers";
      mapping["dim_kv"] = "head_dim";
      break;
    case "gpt_neo":
    case "donut-swin":
      mapping["num_heads"] = "num_heads";
      mapping["num_layers"] = "num_layers";
      mapping["hidden_size"] = "hidden_size";
      break;
    case "bloom":
      mapping["num_heads"] = "n_head";
      mapping["num_layers"] = "n_layer";
      mapping["hidden_size"] = "hidden_size";
      break;
    case "mpt":
      mapping["num_heads"] = "n_heads";
      mapping["num_layers"] = "n_layers";
      mapping["hidden_size"] = "d_model";
      break;
    case "exaone":
      mapping["num_heads"] = "num_key_value_heads";
      mapping["num_layers"] = "num_layers";
      mapping["dim_kv"] = "head_dim";
      mapping["num_attention_heads"] = "num_attention_heads";
      break;
    case "youtu":
    case "deepseek_v3":
    case "deepseek_v4":
    case "glm_moe_dsa":
    case "mistral4":
      mapping["num_heads"] = "num_key_value_heads";
      mapping["num_layers"] = "num_hidden_layers";
      mapping["dim_kv"] = config.model_type === "deepseek_v4" ? "head_dim" : "qk_head_dim";
      mapping["num_attention_heads"] = "num_attention_heads";
      break;
    case "zaya":
      mapping["num_heads"] = "num_key_value_heads";
      mapping["num_layers"] = "num_hidden_layers";
      mapping["hidden_size"] = "hidden_size";
      mapping["dim_kv"] = "head_dim";
      mapping["num_attention_heads"] = "num_attention_heads";
      break;
    case "hrm_text":
      mapping["num_heads"] = "num_key_value_heads";
      mapping["num_layers"] = "num_hidden_layers";
      mapping["hidden_size"] = "hidden_size";
      mapping["dim_kv"] = "head_dim";
      mapping["num_attention_heads"] = "num_attention_heads";
      break;
    // Encoder-decoder models
    case "t5":
    case "mt5":
    case "longt5":
      mapping["num_decoder_layers"] = "num_decoder_layers";
      mapping["num_decoder_heads"] = "num_heads";
      mapping["decoder_dim_kv"] = "d_kv";
      mapping["num_encoder_layers"] = "num_layers";
      mapping["num_encoder_heads"] = "num_heads";
      mapping["encoder_dim_kv"] = "d_kv";
      break;
    case "bart":
    case "mbart":
    case "marian":
    case "whisper":
    case "lite-whisper":
    case "m2m_100":
    case "blenderbot":
    case "blenderbot-small":
    case "florence2_language":
      mapping["num_decoder_layers"] = "decoder_layers";
      mapping["num_decoder_heads"] = "decoder_attention_heads";
      mapping["decoder_hidden_size"] = "d_model";
      mapping["num_encoder_layers"] = "encoder_layers";
      mapping["num_encoder_heads"] = "encoder_attention_heads";
      mapping["encoder_hidden_size"] = "d_model";
      break;
    case "speecht5":
      mapping["num_decoder_layers"] = "decoder_layers";
      mapping["num_decoder_heads"] = "decoder_attention_heads";
      mapping["decoder_hidden_size"] = "hidden_size";
      mapping["num_encoder_layers"] = "encoder_layers";
      mapping["num_encoder_heads"] = "encoder_attention_heads";
      mapping["encoder_hidden_size"] = "hidden_size";
      break;
    case "trocr":
      mapping["num_encoder_layers"] = mapping["num_decoder_layers"] = "decoder_layers";
      mapping["num_encoder_heads"] = mapping["num_decoder_heads"] = "decoder_attention_heads";
      mapping["encoder_hidden_size"] = mapping["decoder_hidden_size"] = "d_model";
      break;
    case "musicgen_decoder":
      mapping["num_encoder_layers"] = mapping["num_decoder_layers"] = "num_hidden_layers";
      mapping["num_encoder_heads"] = mapping["num_decoder_heads"] = "num_attention_heads";
      mapping["encoder_hidden_size"] = mapping["decoder_hidden_size"] = "hidden_size";
      break;
    case "moonshine":
      mapping["num_decoder_layers"] = "decoder_num_hidden_layers";
      mapping["num_decoder_heads"] = "decoder_num_key_value_heads";
      mapping["num_encoder_layers"] = "encoder_num_hidden_layers";
      mapping["num_encoder_heads"] = "encoder_num_key_value_heads";
      mapping["encoder_hidden_size"] = mapping["decoder_hidden_size"] = "hidden_size";
      break;
    case "cohere_asr":
      mapping["num_decoder_layers"] = "num_hidden_layers";
      mapping["num_decoder_heads"] = "num_key_value_heads";
      mapping["decoder_hidden_size"] = "hidden_size";
      mapping["decoder_dim_kv"] = "head_dim";
      const {
        num_hidden_layers: num_encoder_layers,
        num_attention_heads: num_encoder_heads,
        hidden_size: encoder_hidden_size
      } = (
        /** @type {any} */
        config.encoder_config
      );
      init_normalized_config = {
        num_encoder_layers,
        num_encoder_heads,
        encoder_hidden_size,
        // @ts-expect-error TS2339
        encoder_dim_kv: config.head_dim
      };
      break;
    case "vision-encoder-decoder":
      const decoderConfig = getNormalizedConfig(config.decoder);
      const add_encoder_pkv = "num_decoder_layers" in decoderConfig;
      const result = pick(config, ["model_type", "is_encoder_decoder"]);
      if (add_encoder_pkv) {
        result.num_decoder_layers = decoderConfig.num_decoder_layers;
        result.num_decoder_heads = decoderConfig.num_decoder_heads;
        result.decoder_hidden_size = decoderConfig.decoder_hidden_size;
        result.num_encoder_layers = decoderConfig.num_encoder_layers;
        result.num_encoder_heads = decoderConfig.num_encoder_heads;
        result.encoder_hidden_size = decoderConfig.encoder_hidden_size;
      } else {
        result.num_layers = decoderConfig.num_layers;
        result.num_heads = decoderConfig.num_heads;
        result.hidden_size = decoderConfig.hidden_size;
      }
      return result;
  }
  const normalized_config = {
    ...init_normalized_config,
    ...pick(config, ["model_type", "multi_query", "is_encoder_decoder"])
  };
  for (const key in mapping) {
    normalized_config[key] = config[mapping[key]];
  }
  return normalized_config;
}
function getCacheNames(config, options) {
  if (!(config instanceof PretrainedConfig)) {
    config = new PretrainedConfig(config);
  }
  const pkv_prefix = options?.prefix ?? "past_key_values";
  const cache_prefix = pkv_prefix === "present" ? "present" : "past";
  const names = /* @__PURE__ */ new Set();
  if (["lfm2", "lfm2_moe", "lfm3"].includes(config.model_type)) {
    const { layer_types } = (
      /** @type {any} */
      config
    );
    for (let i = 0; i < layer_types.length; ++i) {
      if (layer_types[i] === "full_attention" || layer_types[i] === "sliding_attention") {
        names.add(`${pkv_prefix}.${i}.key`);
        names.add(`${pkv_prefix}.${i}.value`);
      } else if (layer_types[i] === "conv") {
        names.add(`${cache_prefix}_conv.${i}`);
      } else {
        throw new Error(`Unsupported layer type: ${layer_types[i]}`);
      }
    }
    return names;
  } else if (["granitemoehybrid", "falcon_h1", "nemotron_h"].includes(config.model_type)) {
    const c = (
      /** @type {any} */
      config
    );
    const layer_types = c.layer_types ?? c.layers_block_type;
    const num_layers = c.num_hidden_layers ?? layer_types?.length;
    for (let i = 0; i < num_layers; ++i) {
      if (!layer_types || layer_types[i] === "mamba") {
        names.add(`${cache_prefix}_conv.${i}`);
        names.add(`${cache_prefix}_ssm.${i}`);
      }
      if (!layer_types || layer_types[i] === "attention") {
        names.add(`${pkv_prefix}.${i}.key`);
        names.add(`${pkv_prefix}.${i}.value`);
      }
    }
    return names;
  } else if (["qwen3_next", "qwen3_5_text", "qwen3_5_moe_text", "olmo_hybrid"].includes(config.model_type)) {
    const { layer_types } = (
      /** @type {any} */
      config
    );
    for (let i = 0; i < layer_types.length; ++i) {
      if (layer_types[i] === "full_attention") {
        names.add(`${pkv_prefix}.${i}.key`);
        names.add(`${pkv_prefix}.${i}.value`);
      } else if (layer_types[i] === "linear_attention") {
        if (config.model_type === "olmo_hybrid") {
          names.add(`${cache_prefix}_conv.${i}.key`);
          names.add(`${cache_prefix}_conv.${i}.value`);
          names.add(`${cache_prefix}_conv.${i}.query`);
        } else {
          names.add(`${cache_prefix}_conv.${i}`);
        }
        names.add(`${cache_prefix}_recurrent.${i}`);
      } else {
        throw new Error(`Unsupported layer type: ${layer_types[i]}`);
      }
    }
    return names;
  } else if (["gemma4", "gemma4_text"].includes(config.model_type)) {
    const c = (
      /** @type {any} */
      config.model_type === "gemma4" ? (
        /** @type {any} */
        config.text_config
      ) : config
    );
    const num_hidden_layers = c.num_hidden_layers;
    const num_kv_shared_layers = c.num_kv_shared_layers ?? 0;
    const num_kv_layers = num_hidden_layers - num_kv_shared_layers;
    for (let i = 0; i < num_kv_layers; ++i) {
      names.add(`${pkv_prefix}.${i}.key`);
      names.add(`${pkv_prefix}.${i}.value`);
    }
    return names;
  } else if (config.model_type === "deepseek_v4") {
    const { layer_types, num_hidden_layers } = (
      /** @type {any} */
      config
    );
    for (let i = 0; i < num_hidden_layers; ++i) {
      names.add(`${pkv_prefix}.${i}.key`);
      names.add(`${pkv_prefix}.${i}.value`);
      const layer_type = layer_types[i];
      if (layer_type === "compressed_sparse_attention") {
        names.add(`${cache_prefix}_compressor.${i}.kv`);
        names.add(`${cache_prefix}_compressor.${i}.gate`);
        names.add(`${cache_prefix}_indexer.${i}.kv`);
        names.add(`${cache_prefix}_indexer.${i}.gate`);
      } else if (layer_type === "heavily_compressed_attention") {
        names.add(`${cache_prefix}_compressor.${i}.kv`);
        names.add(`${cache_prefix}_compressor.${i}.gate`);
      } else if (layer_type && layer_type !== "sliding_attention") {
        throw new Error(`Unsupported layer type: ${layer_type}`);
      }
    }
    return names;
  } else if (config.model_type === "zaya") {
    const { num_hidden_layers, cca_time1 } = (
      /** @type {any} */
      config
    );
    const stride = cca_time1 ?? 1;
    for (let i = 0; i < num_hidden_layers; i += stride) {
      names.add(`${pkv_prefix}.${i}.key`);
      names.add(`${pkv_prefix}.${i}.value`);
      names.add(`${pkv_prefix}.${i}.conv_state`);
      names.add(`${pkv_prefix}.${i}.shift_state`);
    }
    return names;
  } else if (["lfm2_vl", "lfm3_vl", "qwen3_5", "qwen3_5_moe", "voxtral_realtime"].includes(config.model_type)) {
    let subConfig;
    if (config.model_type === "voxtral_realtime" && options?.session_name === "audio_encoder") {
      subConfig = /** @type {any} */
      config.audio_config;
    } else {
      subConfig = /** @type {any} */
      config.text_config;
    }
    return getCacheNames(subConfig, options);
  }
  return getKeyValueNames(config, { prefix: pkv_prefix });
}
function getKeyValueNames(config, { prefix = "past_key_values" } = {}) {
  const names = /* @__PURE__ */ new Set();
  const normalized_config = config.normalized_config;
  if (normalized_config.is_encoder_decoder && "num_encoder_heads" in normalized_config && "num_decoder_heads" in normalized_config) {
    for (let i = 0; i < normalized_config.num_decoder_layers; ++i) {
      names.add(`${prefix}.${i}.encoder.key`);
      names.add(`${prefix}.${i}.encoder.value`);
      names.add(`${prefix}.${i}.decoder.key`);
      names.add(`${prefix}.${i}.decoder.value`);
    }
  } else if (normalized_config.multi_query) {
    for (let i = 0; i < normalized_config.num_layers; ++i) {
      names.add(`${prefix}.${i}.key_value`);
    }
  } else {
    for (let i = 0; i < normalized_config.num_layers; ++i) {
      names.add(`${prefix}.${i}.key`);
      names.add(`${prefix}.${i}.value`);
    }
  }
  return names;
}
var PretrainedConfig = class _PretrainedConfig {
  // NOTE: Typo in original
  /** @type {string|null} */
  model_type = null;
  /** @type {boolean} */
  is_encoder_decoder = false;
  /** @type {number} */
  max_position_embeddings;
  /** @type {TransformersJSConfig} */
  "transformers.js_config";
  /**
   * Create a new `PretrainedConfig` from a parsed `config.json` object.
   * @param {Object} configJSON The JSON of the config.
   */
  constructor(configJSON) {
    Object.assign(this, configJSON);
    this.normalized_config = getNormalizedConfig(this);
  }
  /**
   * Loads a pretrained config from the given `pretrained_model_name_or_path`.
   *
   * @param {string} pretrained_model_name_or_path The path to the pretrained config.
   * @param {PretrainedOptions} options Additional options for loading the config.
   * @throws {Error} Throws an error if the config.json is not found in the `pretrained_model_name_or_path`.
   *
   * @returns {Promise<PretrainedConfig>} A new instance of the `PretrainedConfig` class.
   */
  static async from_pretrained(pretrained_model_name_or_path, { progress_callback = null, config = null, cache_dir = null, local_files_only = false, revision = "main" } = {}) {
    if (config && !(config instanceof _PretrainedConfig)) {
      config = new _PretrainedConfig(config);
    }
    const data = config ?? await loadConfig(pretrained_model_name_or_path, {
      progress_callback,
      config,
      cache_dir,
      local_files_only,
      revision
    });
    return new this(data);
  }
};
var AutoConfig = class {
  /** @type {typeof PretrainedConfig.from_pretrained} */
  static async from_pretrained(...args) {
    return PretrainedConfig.from_pretrained(...args);
  }
};

// browser-unavailable:onnx-node
var onnx_node_default = {};

// node_modules/onnxruntime-web/dist/ort.webgpu.min.mjs
var ort_webgpu_min_exports = {};
__export(ort_webgpu_min_exports, {
  InferenceSession: () => Zr,
  TRACE: () => qt,
  TRACE_EVENT_BEGIN: () => K,
  TRACE_EVENT_END: () => Q,
  TRACE_FUNC_BEGIN: () => ae,
  TRACE_FUNC_END: () => ie,
  Tensor: () => V,
  default: () => Ls,
  env: () => v,
  registerBackend: () => oe
});
var nt = Object.defineProperty;
var Hr = Object.getOwnPropertyDescriptor;
var Jr = Object.getOwnPropertyNames;
var qr = Object.prototype.hasOwnProperty;
var ot = ((t) => typeof __require < "u" ? __require : typeof Proxy < "u" ? new Proxy(t, { get: (e, r) => (typeof __require < "u" ? __require : e)[r] }) : t)(function(t) {
  if (typeof __require < "u") return __require.apply(this, arguments);
  throw Error('Dynamic require of "' + t + '" is not supported');
});
var T = (t, e, r) => () => {
  if (r) throw r[0];
  try {
    return t && (e = t(t = 0)), e;
  } catch (o) {
    throw r = [o], o;
  }
};
var ve = (t, e) => {
  for (var r in e) nt(t, r, { get: e[r], enumerable: true });
};
var Yr = (t, e, r, o) => {
  if (e && typeof e == "object" || typeof e == "function") for (let n of Jr(e)) !qr.call(t, n) && n !== r && nt(t, n, { get: () => e[n], enumerable: !(o = Hr(e, n)) || o.enumerable });
  return t;
};
var st = (t) => Yr(nt({}, "__esModule", { value: true }), t);
var Be;
var ne;
var oe;
var Xr;
var Bt;
var at = T(() => {
  "use strict";
  Be = /* @__PURE__ */ new Map(), ne = [], oe = (t, e, r) => {
    if (e && typeof e.init == "function" && typeof e.createInferenceSessionHandler == "function") {
      let o = Be.get(t);
      if (o === void 0) Be.set(t, { backend: e, priority: r });
      else {
        if (o.priority > r) return;
        if (o.priority === r && o.backend !== e) throw new Error(`cannot register backend "${t}" using priority ${r}`);
      }
      if (r >= 0) {
        let n = ne.indexOf(t);
        n !== -1 && ne.splice(n, 1);
        for (let s = 0; s < ne.length; s++) if (Be.get(ne[s]).priority <= r) {
          ne.splice(s, 0, t);
          return;
        }
        ne.push(t);
      }
      return;
    }
    throw new TypeError("not a valid backend");
  }, Xr = async (t) => {
    let e = Be.get(t);
    if (!e) return "backend not found.";
    if (e.initialized) return e.backend;
    if (e.aborted) return e.error;
    {
      let r = !!e.initPromise;
      try {
        return r || (e.initPromise = e.backend.init(t)), await e.initPromise, e.initialized = true, e.backend;
      } catch (o) {
        return r || (e.error = `${o}`, e.aborted = true), e.error;
      } finally {
        delete e.initPromise;
      }
    }
  }, Bt = async (t) => {
    let e = t.executionProviders || [], r = e.map((u) => typeof u == "string" ? u : u.name), o = r.length === 0 ? ne : r, n, s = [], a = /* @__PURE__ */ new Set();
    for (let u of o) {
      let f = await Xr(u);
      typeof f == "string" ? s.push({ name: u, err: f }) : (n || (n = f), n === f && a.add(u));
    }
    if (!n) throw new Error(`no available backend found. ERR: ${s.map((u) => `[${u.name}] ${u.err}`).join(", ")}`);
    for (let { name: u, err: f } of s) r.includes(u) && console.warn(`removing requested execution provider "${u}" from session options because it is not available: ${f}`);
    let i = e.filter((u) => a.has(typeof u == "string" ? u : u.name));
    return [n, new Proxy(t, { get: (u, f) => f === "executionProviders" ? i : Reflect.get(u, f) })];
  };
});
var Mt = T(() => {
  "use strict";
  at();
});
var xt;
var Ot = T(() => {
  "use strict";
  xt = "1.31.0-dev.20260911-2a43ec07e";
});
var Dt;
var U;
var it = T(() => {
  "use strict";
  Ot();
  Dt = "warning", U = { wasm: {}, webgl: {}, webgpu: {}, versions: { common: xt }, set logLevel(t) {
    if (t !== void 0) {
      if (typeof t != "string" || ["verbose", "info", "warning", "error", "fatal"].indexOf(t) === -1) throw new Error(`Unsupported logging level: ${t}`);
      Dt = t;
    }
  }, get logLevel() {
    return Dt;
  } };
  Object.defineProperty(U, "logLevel", { enumerable: true });
});
var v;
var Ut = T(() => {
  "use strict";
  it();
  v = U;
});
var Ct;
var Pt;
var _t = T(() => {
  "use strict";
  Ct = (t, e) => {
    let r = typeof document < "u" ? document.createElement("canvas") : new OffscreenCanvas(1, 1);
    r.width = t.dims[3], r.height = t.dims[2];
    let o = r.getContext("2d");
    if (o != null) {
      let n, s;
      e?.tensorLayout !== void 0 && e.tensorLayout === "NHWC" ? (n = t.dims[2], s = t.dims[3]) : (n = t.dims[3], s = t.dims[2]);
      let a = e?.format !== void 0 ? e.format : "RGB", i = e?.norm, u, f;
      i === void 0 || i.mean === void 0 ? u = [255, 255, 255, 255] : typeof i.mean == "number" ? u = [i.mean, i.mean, i.mean, i.mean] : (u = [i.mean[0], i.mean[1], i.mean[2], 0], i.mean[3] !== void 0 && (u[3] = i.mean[3])), i === void 0 || i.bias === void 0 ? f = [0, 0, 0, 0] : typeof i.bias == "number" ? f = [i.bias, i.bias, i.bias, i.bias] : (f = [i.bias[0], i.bias[1], i.bias[2], 0], i.bias[3] !== void 0 && (f[3] = i.bias[3]));
      let d = s * n, p = 0, c = d, l = d * 2, h = -1;
      a === "RGBA" ? (p = 0, c = d, l = d * 2, h = d * 3) : a === "RGB" ? (p = 0, c = d, l = d * 2) : a === "RBG" && (p = 0, l = d, c = d * 2);
      for (let b = 0; b < s; b++) for (let E = 0; E < n; E++) {
        let y = (t.data[p++] - f[0]) * u[0], m = (t.data[c++] - f[1]) * u[1], A = (t.data[l++] - f[2]) * u[2], w = h === -1 ? 255 : (t.data[h++] - f[3]) * u[3];
        o.fillStyle = "rgba(" + y + "," + m + "," + A + "," + w + ")", o.fillRect(E, b, 1, 1);
      }
      if ("toDataURL" in r) return r.toDataURL();
      throw new Error("toDataURL is not supported");
    } else throw new Error("Can not access image data");
  }, Pt = (t, e) => {
    let r = typeof document < "u" ? document.createElement("canvas").getContext("2d") : new OffscreenCanvas(1, 1).getContext("2d"), o;
    if (r != null) {
      let n, s, a;
      e?.tensorLayout !== void 0 && e.tensorLayout === "NHWC" ? (n = t.dims[2], s = t.dims[1], a = t.dims[3]) : (n = t.dims[3], s = t.dims[2], a = t.dims[1]);
      let i = e !== void 0 && e.format !== void 0 ? e.format : "RGB", u = e?.norm, f, d;
      u === void 0 || u.mean === void 0 ? f = [255, 255, 255, 255] : typeof u.mean == "number" ? f = [u.mean, u.mean, u.mean, u.mean] : (f = [u.mean[0], u.mean[1], u.mean[2], 255], u.mean[3] !== void 0 && (f[3] = u.mean[3])), u === void 0 || u.bias === void 0 ? d = [0, 0, 0, 0] : typeof u.bias == "number" ? d = [u.bias, u.bias, u.bias, u.bias] : (d = [u.bias[0], u.bias[1], u.bias[2], 0], u.bias[3] !== void 0 && (d[3] = u.bias[3]));
      let p = s * n;
      if (e !== void 0 && (e.format !== void 0 && a === 4 && e.format !== "RGBA" || a === 3 && e.format !== "RGB" && e.format !== "BGR")) throw new Error("Tensor format doesn't match input tensor dims");
      let c = 4, l = 0, h = 1, b = 2, E = 3, y = 0, m = p, A = p * 2, w = -1;
      i === "RGBA" ? (y = 0, m = p, A = p * 2, w = p * 3) : i === "RGB" ? (y = 0, m = p, A = p * 2) : i === "RBG" && (y = 0, A = p, m = p * 2), o = r.createImageData(n, s);
      for (let L = 0; L < s * n; l += c, h += c, b += c, E += c, L++) o.data[l] = (t.data[y++] - d[0]) * f[0], o.data[h] = (t.data[m++] - d[1]) * f[1], o.data[b] = (t.data[A++] - d[2]) * f[2], o.data[E] = w === -1 ? 255 : (t.data[w++] - d[3]) * f[3];
    } else throw new Error("Can not access image data");
    return o;
  };
});
var ut;
var Rt;
var Nt;
var Ft;
var Wt;
var kt;
var Gt = T(() => {
  "use strict";
  Me();
  ut = (t, e) => {
    if (t === void 0) throw new Error("Image buffer must be defined");
    if (e.height === void 0 || e.width === void 0) throw new Error("Image height and width must be defined");
    if (e.tensorLayout === "NHWC") throw new Error("NHWC Tensor layout is not supported yet");
    let { height: r, width: o } = e, n = e.norm ?? { mean: 255, bias: 0 }, s, a;
    typeof n.mean == "number" ? s = [n.mean, n.mean, n.mean, n.mean] : s = [n.mean[0], n.mean[1], n.mean[2], n.mean[3] ?? 255], typeof n.bias == "number" ? a = [n.bias, n.bias, n.bias, n.bias] : a = [n.bias[0], n.bias[1], n.bias[2], n.bias[3] ?? 0];
    let i = e.format !== void 0 ? e.format : "RGBA", u = e.tensorFormat !== void 0 && e.tensorFormat !== void 0 ? e.tensorFormat : "RGB", f = r * o, d = u === "RGBA" ? new Float32Array(f * 4) : new Float32Array(f * 3), p = 4, c = 0, l = 1, h = 2, b = 3, E = 0, y = f, m = f * 2, A = -1;
    i === "RGB" && (p = 3, c = 0, l = 1, h = 2, b = -1), u === "RGBA" ? A = f * 3 : u === "RBG" ? (E = 0, m = f, y = f * 2) : u === "BGR" && (m = 0, y = f, E = f * 2);
    for (let L = 0; L < f; L++, c += p, h += p, l += p, b += p) d[E++] = (t[c] + a[0]) / s[0], d[y++] = (t[l] + a[1]) / s[1], d[m++] = (t[h] + a[2]) / s[2], A !== -1 && b !== -1 && (d[A++] = (t[b] + a[3]) / s[3]);
    return u === "RGBA" ? new _("float32", d, [1, 4, r, o]) : new _("float32", d, [1, 3, r, o]);
  }, Rt = async (t, e) => {
    let r = typeof HTMLImageElement < "u" && t instanceof HTMLImageElement, o = typeof ImageData < "u" && t instanceof ImageData, n = typeof ImageBitmap < "u" && t instanceof ImageBitmap, s = typeof t == "string", a, i = e ?? {}, u = () => {
      if (typeof document < "u") return document.createElement("canvas");
      if (typeof OffscreenCanvas < "u") return new OffscreenCanvas(1, 1);
      throw new Error("Canvas is not supported");
    }, f = (d) => typeof HTMLCanvasElement < "u" && d instanceof HTMLCanvasElement || d instanceof OffscreenCanvas ? d.getContext("2d") : null;
    if (r) {
      let d = u();
      d.width = t.width, d.height = t.height;
      let p = f(d);
      if (p != null) {
        let c = t.height, l = t.width;
        if (e !== void 0 && e.resizedHeight !== void 0 && e.resizedWidth !== void 0 && (c = e.resizedHeight, l = e.resizedWidth), e !== void 0) {
          if (i = e, e.tensorFormat !== void 0) throw new Error("Image input config format must be RGBA for HTMLImageElement");
          i.tensorFormat = "RGBA", i.height = c, i.width = l;
        } else i.tensorFormat = "RGBA", i.height = c, i.width = l;
        p.drawImage(t, 0, 0), a = p.getImageData(0, 0, l, c).data;
      } else throw new Error("Can not access image data");
    } else if (o) {
      let d, p;
      if (e !== void 0 && e.resizedWidth !== void 0 && e.resizedHeight !== void 0 ? (d = e.resizedHeight, p = e.resizedWidth) : (d = t.height, p = t.width), e !== void 0 && (i = e), i.format = "RGBA", i.height = d, i.width = p, e !== void 0) {
        let c = u();
        c.width = p, c.height = d;
        let l = f(c);
        if (l != null) l.putImageData(t, 0, 0), a = l.getImageData(0, 0, p, d).data;
        else throw new Error("Can not access image data");
      } else a = t.data;
    } else if (n) {
      if (e === void 0) throw new Error("Please provide image config with format for Imagebitmap");
      let d = u();
      d.width = t.width, d.height = t.height;
      let p = f(d);
      if (p != null) {
        let c = t.height, l = t.width;
        return p.drawImage(t, 0, 0, l, c), a = p.getImageData(0, 0, l, c).data, i.height = c, i.width = l, ut(a, i);
      } else throw new Error("Can not access image data");
    } else {
      if (s) return new Promise((d, p) => {
        let c = u(), l = f(c);
        if (!t || !l) return p();
        let h = new Image();
        h.crossOrigin = "Anonymous", h.src = t, h.onload = () => {
          c.width = h.width, c.height = h.height, l.drawImage(h, 0, 0, c.width, c.height);
          let b = l.getImageData(0, 0, c.width, c.height);
          i.height = c.height, i.width = c.width, d(ut(b.data, i));
        };
      });
      throw new Error("Input data provided is not supported - aborted tensor creation");
    }
    if (a !== void 0) return ut(a, i);
    throw new Error("Input data provided is not supported - aborted tensor creation");
  }, Nt = (t, e) => {
    let { width: r, height: o, download: n, dispose: s } = e, a = [1, o, r, 4];
    return new _({ location: "texture", type: "float32", texture: t, dims: a, download: n, dispose: s });
  }, Ft = (t, e) => {
    let { dataType: r, dims: o, download: n, dispose: s } = e;
    return new _({ location: "gpu-buffer", type: r ?? "float32", gpuBuffer: t, dims: o, download: n, dispose: s });
  }, Wt = (t, e) => {
    let { dataType: r, dims: o, download: n, dispose: s } = e;
    return new _({ location: "ml-tensor", type: r ?? "float32", mlTensor: t, dims: o, download: n, dispose: s });
  }, kt = (t, e, r) => new _({ location: "cpu-pinned", type: t, data: e, dims: r ?? [e.length] });
});
var se;
var we;
var $t;
var zt;
var Vt = T(() => {
  "use strict";
  se = /* @__PURE__ */ new Map([["float32", Float32Array], ["uint8", Uint8Array], ["int8", Int8Array], ["uint16", Uint16Array], ["int16", Int16Array], ["int32", Int32Array], ["bool", Uint8Array], ["float64", Float64Array], ["uint32", Uint32Array], ["int4", Uint8Array], ["uint4", Uint8Array]]), we = /* @__PURE__ */ new Map([[Float32Array, "float32"], [Uint8Array, "uint8"], [Int8Array, "int8"], [Uint16Array, "uint16"], [Int16Array, "int16"], [Int32Array, "int32"], [Float64Array, "float64"], [Uint32Array, "uint32"]]), $t = false, zt = () => {
    if (!$t) {
      $t = true;
      let t = typeof BigInt64Array < "u" && BigInt64Array.from, e = typeof BigUint64Array < "u" && BigUint64Array.from, r = globalThis.Float16Array, o = typeof r < "u" && r.from;
      t && (se.set("int64", BigInt64Array), we.set(BigInt64Array, "int64")), e && (se.set("uint64", BigUint64Array), we.set(BigUint64Array, "uint64")), o ? (se.set("float16", r), we.set(r, "float16")) : se.set("float16", Uint16Array);
    }
  };
});
var jt;
var Ht;
var Jt = T(() => {
  "use strict";
  Me();
  jt = (t) => {
    let e = 1;
    for (let r = 0; r < t.length; r++) {
      let o = t[r];
      if (typeof o != "number" || !Number.isSafeInteger(o)) throw new TypeError(`dims[${r}] must be an integer, got: ${o}`);
      if (o < 0) throw new RangeError(`dims[${r}] must be a non-negative integer, got: ${o}`);
      e *= o;
    }
    return e;
  }, Ht = (t, e) => {
    switch (t.location) {
      case "cpu":
        return new _(t.type, t.data, e);
      case "cpu-pinned":
        return new _({ location: "cpu-pinned", data: t.data, type: t.type, dims: e });
      case "texture":
        return new _({ location: "texture", texture: t.texture, type: t.type, dims: e });
      case "gpu-buffer":
        return new _({ location: "gpu-buffer", gpuBuffer: t.gpuBuffer, type: t.type, dims: e });
      case "ml-tensor":
        return new _({ location: "ml-tensor", mlTensor: t.mlTensor, type: t.type, dims: e });
      default:
        throw new Error(`tensorReshape: tensor location ${t.location} is not supported`);
    }
  };
});
var _;
var Me = T(() => {
  "use strict";
  _t();
  Gt();
  Vt();
  Jt();
  _ = class {
    constructor(e, r, o) {
      zt();
      let n, s;
      if (typeof e == "object" && "location" in e) switch (this.dataLocation = e.location, n = e.type, s = e.dims, e.location) {
        case "cpu-pinned": {
          let i = se.get(n);
          if (!i) throw new TypeError(`unsupported type "${n}" to create tensor from pinned buffer`);
          if (!(e.data instanceof i)) throw new TypeError(`buffer should be of type ${i.name}`);
          this.cpuData = e.data;
          break;
        }
        case "texture": {
          if (n !== "float32") throw new TypeError(`unsupported type "${n}" to create tensor from texture`);
          this.gpuTextureData = e.texture, this.downloader = e.download, this.disposer = e.dispose;
          break;
        }
        case "gpu-buffer": {
          if (n !== "float32" && n !== "float16" && n !== "int32" && n !== "int64" && n !== "uint32" && n !== "uint8" && n !== "bool" && n !== "uint4" && n !== "int4") throw new TypeError(`unsupported type "${n}" to create tensor from gpu buffer`);
          this.gpuBufferData = e.gpuBuffer, this.downloader = e.download, this.disposer = e.dispose;
          break;
        }
        case "ml-tensor": {
          if (n !== "float32" && n !== "float16" && n !== "int32" && n !== "int64" && n !== "uint32" && n !== "uint64" && n !== "int8" && n !== "uint8" && n !== "bool" && n !== "uint4" && n !== "int4") throw new TypeError(`unsupported type "${n}" to create tensor from MLTensor`);
          this.mlTensorData = e.mlTensor, this.downloader = e.download, this.disposer = e.dispose;
          break;
        }
        default:
          throw new Error(`Tensor constructor: unsupported location '${this.dataLocation}'`);
      }
      else {
        let i, u;
        if (typeof e == "string") if (n = e, u = o, e === "string") {
          if (!Array.isArray(r)) throw new TypeError("A string tensor's data must be a string array.");
          i = r;
        } else {
          let f = se.get(e);
          if (f === void 0) throw new TypeError(`Unsupported tensor type: ${e}.`);
          if (Array.isArray(r)) {
            if (e === "float16" && f === Uint16Array || e === "uint4" || e === "int4") throw new TypeError(`Creating a ${e} tensor from number array is not supported. Please use ${f.name} as data.`);
            e === "uint64" || e === "int64" ? i = f.from(r, BigInt) : i = f.from(r);
          } else if (r instanceof f) i = r;
          else if (r instanceof Uint8ClampedArray) if (e === "uint8") i = Uint8Array.from(r);
          else throw new TypeError("A Uint8ClampedArray tensor's data must be type of uint8");
          else if (e === "float16" && r instanceof Uint16Array && f !== Uint16Array) i = new globalThis.Float16Array(r.buffer, r.byteOffset, r.length);
          else throw new TypeError(`A ${n} tensor's data must be type of ${f}`);
        }
        else if (u = r, Array.isArray(e)) {
          if (e.length === 0) throw new TypeError("Tensor type cannot be inferred from an empty array.");
          let f = typeof e[0];
          if (f === "string") n = "string", i = e;
          else if (f === "boolean") n = "bool", i = Uint8Array.from(e);
          else throw new TypeError(`Invalid element type of data array: ${f}.`);
        } else if (e instanceof Uint8ClampedArray) n = "uint8", i = Uint8Array.from(e);
        else {
          let f = we.get(e.constructor);
          if (f === void 0) throw new TypeError(`Unsupported type for tensor data: ${e.constructor}.`);
          n = f, i = e;
        }
        if (u === void 0) u = [i.length];
        else if (!Array.isArray(u)) throw new TypeError("A tensor's dims must be a number array");
        s = u, this.cpuData = i, this.dataLocation = "cpu";
      }
      let a = jt(s);
      if (this.cpuData && a !== this.cpuData.length && !((n === "uint4" || n === "int4") && Math.ceil(a / 2) === this.cpuData.length)) throw new Error(`Tensor's size(${a}) does not match data length(${this.cpuData.length}).`);
      this.type = n, this.dims = s, this.size = a;
    }
    static async fromImage(e, r) {
      return Rt(e, r);
    }
    static fromTexture(e, r) {
      return Nt(e, r);
    }
    static fromGpuBuffer(e, r) {
      return Ft(e, r);
    }
    static fromMLTensor(e, r) {
      return Wt(e, r);
    }
    static fromPinnedBuffer(e, r, o) {
      return kt(e, r, o);
    }
    toDataURL(e) {
      return Ct(this, e);
    }
    toImageData(e) {
      return Pt(this, e);
    }
    get data() {
      if (this.ensureValid(), !this.cpuData) throw new Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");
      return this.cpuData;
    }
    get location() {
      return this.dataLocation;
    }
    get texture() {
      if (this.ensureValid(), !this.gpuTextureData) throw new Error("The data is not stored as a WebGL texture.");
      return this.gpuTextureData;
    }
    get gpuBuffer() {
      if (this.ensureValid(), !this.gpuBufferData) throw new Error("The data is not stored as a WebGPU buffer.");
      return this.gpuBufferData;
    }
    get mlTensor() {
      if (this.ensureValid(), !this.mlTensorData) throw new Error("The data is not stored as a WebNN MLTensor.");
      return this.mlTensorData;
    }
    async getData(e) {
      switch (this.ensureValid(), this.dataLocation) {
        case "cpu":
        case "cpu-pinned":
          return this.data;
        case "texture":
        case "gpu-buffer":
        case "ml-tensor": {
          if (!this.downloader) throw new Error("The current tensor is not created with a specified data downloader.");
          if (this.isDownloading) throw new Error("The current tensor is being downloaded.");
          try {
            this.isDownloading = true;
            let r = await this.downloader();
            return this.downloader = void 0, this.dataLocation = "cpu", this.cpuData = r, e && this.disposer && (this.disposer(), this.disposer = void 0), r;
          } finally {
            this.isDownloading = false;
          }
        }
        default:
          throw new Error(`cannot get data from location: ${this.dataLocation}`);
      }
    }
    dispose() {
      if (this.isDownloading) throw new Error("The current tensor is being downloaded.");
      this.disposer && (this.disposer(), this.disposer = void 0), this.cpuData = void 0, this.gpuTextureData = void 0, this.gpuBufferData = void 0, this.mlTensorData = void 0, this.downloader = void 0, this.isDownloading = void 0, this.dataLocation = "none";
    }
    ensureValid() {
      if (this.dataLocation === "none") throw new Error("The tensor is disposed.");
    }
    reshape(e) {
      if (this.ensureValid(), this.downloader || this.disposer) throw new Error("Cannot reshape a tensor that owns GPU resource.");
      return Ht(this, e);
    }
  };
});
var V;
var ft = T(() => {
  "use strict";
  Me();
  V = _;
});
var qt;
var Yt;
var ae;
var ie;
var K;
var Q;
var ct = T(() => {
  "use strict";
  it();
  qt = (t, e) => {
    (typeof U.trace > "u" ? !U.wasm.trace : !U.trace) || console.timeStamp(`${t}::ORT::${e}`);
  }, Yt = (t, e) => {
    let r = new Error().stack?.split(/\r\n|\r|\n/g) || [], o = false;
    for (let n = 0; n < r.length; n++) {
      if (o && !r[n].includes("TRACE_FUNC")) {
        let s = `FUNC_${t}::${r[n].trim().split(" ")[1]}`;
        e && (s += `::${e}`), qt("CPU", s);
        return;
      }
      r[n].includes("TRACE_FUNC") && (o = true);
    }
  }, ae = (t) => {
    (typeof U.trace > "u" ? !U.wasm.trace : !U.trace) || Yt("BEGIN", t);
  }, ie = (t) => {
    (typeof U.trace > "u" ? !U.wasm.trace : !U.trace) || Yt("END", t);
  }, K = (t) => {
    (typeof U.trace > "u" ? !U.wasm.trace : !U.trace) || console.time(`ORT::${t}`);
  }, Q = (t) => {
    (typeof U.trace > "u" ? !U.wasm.trace : !U.trace) || console.timeEnd(`ORT::${t}`);
  };
});
var xe;
var Xt = T(() => {
  "use strict";
  at();
  ft();
  ct();
  xe = class t {
    constructor(e) {
      this.handler = e;
    }
    async run(e, r, o) {
      ae(), K("InferenceSession.run");
      let n = {}, s = {};
      if (typeof e != "object" || e === null || e instanceof V || Array.isArray(e)) throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");
      let a = true;
      if (typeof r == "object") {
        if (r === null) throw new TypeError("Unexpected argument[1]: cannot be null.");
        if (r instanceof V) throw new TypeError("'fetches' cannot be a Tensor");
        if (Array.isArray(r)) {
          if (r.length === 0) throw new TypeError("'fetches' cannot be an empty array.");
          a = false;
          for (let f of r) {
            if (typeof f != "string") throw new TypeError("'fetches' must be a string array or an object.");
            if (this.outputNames.indexOf(f) === -1) throw new RangeError(`'fetches' contains invalid output name: ${f}.`);
            n[f] = null;
          }
          if (typeof o == "object" && o !== null) s = o;
          else if (typeof o < "u") throw new TypeError("'options' must be an object.");
        } else {
          let f = false, d = Object.getOwnPropertyNames(r);
          for (let p of this.outputNames) if (d.indexOf(p) !== -1) {
            let c = r[p];
            (c === null || c instanceof V) && (f = true, a = false, n[p] = c);
          }
          if (f) {
            if (typeof o == "object" && o !== null) s = o;
            else if (typeof o < "u") throw new TypeError("'options' must be an object.");
          } else s = r;
        }
      } else if (typeof r < "u") throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");
      for (let f of this.inputNames) if (typeof e[f] > "u") throw new Error(`input '${f}' is missing in 'feeds'.`);
      if (a) for (let f of this.outputNames) n[f] = null;
      let i = await this.handler.run(e, n, s), u = {};
      for (let f in i) if (Object.hasOwnProperty.call(i, f)) {
        let d = i[f];
        d instanceof V ? u[f] = d : u[f] = new V(d.type, d.data, d.dims);
      }
      return Q("InferenceSession.run"), ie(), u;
    }
    async release() {
      return this.handler.dispose();
    }
    static async create(e, r, o, n) {
      ae(), K("InferenceSession.create");
      let s, a = {};
      if (typeof e == "string") {
        if (s = e, typeof r == "object" && r !== null) a = r;
        else if (typeof r < "u") throw new TypeError("'options' must be an object.");
      } else if (e instanceof Uint8Array) {
        if (s = e, typeof r == "object" && r !== null) a = r;
        else if (typeof r < "u") throw new TypeError("'options' must be an object.");
      } else if (e instanceof ArrayBuffer || typeof SharedArrayBuffer < "u" && e instanceof SharedArrayBuffer) {
        let d = e, p = 0, c = e.byteLength;
        if (typeof r == "object" && r !== null) a = r;
        else if (typeof r == "number") {
          if (p = r, !Number.isSafeInteger(p)) throw new RangeError("'byteOffset' must be an integer.");
          if (p < 0 || p >= d.byteLength) throw new RangeError(`'byteOffset' is out of range [0, ${d.byteLength}).`);
          if (c = e.byteLength - p, typeof o == "number") {
            if (c = o, !Number.isSafeInteger(c)) throw new RangeError("'byteLength' must be an integer.");
            if (c <= 0 || p + c > d.byteLength) throw new RangeError(`'byteLength' is out of range (0, ${d.byteLength - p}].`);
            if (typeof n == "object" && n !== null) a = n;
            else if (typeof n < "u") throw new TypeError("'options' must be an object.");
          } else if (typeof o < "u") throw new TypeError("'byteLength' must be a number.");
        } else if (typeof r < "u") throw new TypeError("'options' must be an object.");
        s = new Uint8Array(d, p, c);
      } else throw new TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");
      let [i, u] = await Bt(a), f = await i.createInferenceSessionHandler(s, u);
      return Q("InferenceSession.create"), ie(), new t(f);
    }
    startProfiling() {
      this.handler.startProfiling();
    }
    endProfiling() {
      this.handler.endProfiling();
    }
    get inputNames() {
      return this.handler.inputNames;
    }
    get outputNames() {
      return this.handler.outputNames;
    }
    get inputMetadata() {
      return this.handler.inputMetadata;
    }
    get outputMetadata() {
      return this.handler.outputMetadata;
    }
  };
});
var Zr;
var Zt = T(() => {
  "use strict";
  Xt();
  Zr = xe;
});
var Kt = T(() => {
  "use strict";
});
var Qt = T(() => {
  "use strict";
});
var er = T(() => {
  "use strict";
});
var tr = T(() => {
  "use strict";
});
var dt = {};
ve(dt, { InferenceSession: () => Zr, TRACE: () => qt, TRACE_EVENT_BEGIN: () => K, TRACE_EVENT_END: () => Q, TRACE_FUNC_BEGIN: () => ae, TRACE_FUNC_END: () => ie, Tensor: () => V, env: () => v, registerBackend: () => oe });
var ee = T(() => {
  "use strict";
  Mt();
  Ut();
  Zt();
  ft();
  Kt();
  Qt();
  ct();
  er();
  tr();
});
var Oe = T(() => {
  "use strict";
});
var sr = {};
ve(sr, { default: () => Kr });
var nr;
var or;
var Kr;
var ar = T(() => {
  "use strict";
  pt();
  te();
  De();
  nr = "ort-wasm-proxy-worker", or = globalThis.self?.name === nr;
  or && (self.onmessage = (t) => {
    let { type: e, in: r } = t.data;
    try {
      switch (e) {
        case "init-wasm":
          Ue(r.wasm).then(() => {
            Ce(r).then(() => {
              postMessage({ type: e });
            }, (o) => {
              postMessage({ type: e, err: o });
            });
          }, (o) => {
            postMessage({ type: e, err: o });
          });
          break;
        case "init-ep": {
          let { epName: o, env: n } = r;
          Pe(n, o).then(() => {
            postMessage({ type: e });
          }, (s) => {
            postMessage({ type: e, err: s });
          });
          break;
        }
        case "copy-from": {
          let { buffer: o } = r, n = ge(o);
          postMessage({ type: e, out: n });
          break;
        }
        case "create": {
          let { model: o, options: n } = r;
          _e(o, n).then((s) => {
            postMessage({ type: e, out: s });
          }, (s) => {
            postMessage({ type: e, err: s });
          });
          break;
        }
        case "release":
          Re(r), postMessage({ type: e });
          break;
        case "run": {
          let { sessionId: o, inputIndices: n, inputs: s, outputIndices: a, options: i } = r;
          Ne(o, n, s, a, new Array(a.length).fill(null), i).then((u) => {
            u.some((f) => f[3] !== "cpu") ? postMessage({ type: e, err: "Proxy does not support non-cpu tensor location." }) : postMessage({ type: e, out: u }, We([...s, ...u]));
          }, (u) => {
            postMessage({ type: e, err: u });
          });
          break;
        }
        case "end-profiling":
          Fe(r), postMessage({ type: e });
          break;
        default:
      }
    } catch (o) {
      postMessage({ type: e, err: o });
    }
  });
  Kr = or ? null : (t) => new Worker(t ?? G, { type: "module", name: nr });
});
var fr;
var Qr;
var en;
var G;
var ke;
var lt;
var tn;
var rn;
var cr;
var nn;
var ir;
var dr;
var ur;
var pr;
var De = T(() => {
  "use strict";
  Oe();
  fr = typeof location > "u" ? void 0 : location.origin, Qr = import.meta.url > "file:" && import.meta.url < "file;", en = () => {
    if (true) {
      if (Qr) {
        let t = URL;
        return new URL(new t("ort.webgpu.min.mjs", import.meta.url).href, fr).href;
      }
      return import.meta.url;
    }
  }, G = en(), ke = () => {
    if (G && !G.startsWith("blob:")) return G.substring(0, G.lastIndexOf("/") + 1);
  }, lt = (t, e) => {
    try {
      let r = e ?? G;
      return (r ? new URL(t, r) : new URL(t)).origin === fr;
    } catch {
      return false;
    }
  }, tn = (t, e) => {
    let r = e ?? G;
    try {
      return (r ? new URL(t, r) : new URL(t)).href;
    } catch {
      return;
    }
  }, rn = (t, e) => `${e ?? "./"}${t}`, cr = async (t) => {
    let r = await (await fetch(t, { credentials: "same-origin" })).blob();
    return URL.createObjectURL(r);
  }, nn = async (t) => (await import(
    /*webpackIgnore:true*/
    /*@vite-ignore*/
    t
  )).default, ir = (ar(), st(sr)).default, dr = async () => {
    if (!G) throw new Error("Failed to load proxy worker: cannot determine the script source URL.");
    if (lt(G)) return [void 0, ir()];
    let t = await cr(G);
    return [t, ir(t)];
  }, ur = void 0, pr = async (t, e, r, o) => {
    let n = ur && !(t || e);
    if (n) if (G) n = lt(G) || o && !r;
    else if (o && !r) n = true;
    else throw new Error("cannot determine the script source URL.");
    if (n) return [void 0, ur];
    {
      let s = "ort-wasm-simd-threaded.asyncify.mjs", a = t ?? tn(s, e), i = r && a && !lt(a, e), u = i ? await cr(a) : a ?? rn(s, e);
      return [i ? u : void 0, await nn(u)];
    }
  };
});
var mt;
var ht;
var Ge;
var lr;
var on;
var sn;
var an;
var Ue;
var I;
var te = T(() => {
  "use strict";
  De();
  ht = false, Ge = false, lr = false, on = () => {
    if (typeof SharedArrayBuffer > "u") return false;
    try {
      return typeof MessageChannel < "u" && new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)), WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 5, 4, 1, 3, 1, 1, 10, 11, 1, 9, 0, 65, 0, 254, 16, 2, 0, 26, 11]));
    } catch {
      return false;
    }
  }, sn = () => {
    try {
      return WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 10, 30, 1, 28, 0, 65, 0, 253, 15, 253, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 253, 186, 1, 26, 11]));
    } catch {
      return false;
    }
  }, an = () => {
    try {
      return WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 19, 1, 17, 0, 65, 1, 253, 15, 65, 2, 253, 15, 65, 3, 253, 15, 253, 147, 2, 11]));
    } catch {
      return false;
    }
  }, Ue = async (t) => {
    if (ht) return Promise.resolve();
    if (Ge) throw new Error("multiple calls to 'initializeWebAssembly()' detected.");
    if (lr) throw new Error("previous call to 'initializeWebAssembly()' failed.");
    Ge = true;
    let e = t.initTimeout, r = t.numThreads;
    if (t.simd !== false) {
      if (t.simd === "relaxed") {
        if (!an()) throw new Error("Relaxed WebAssembly SIMD is not supported in the current environment.");
      } else if (!sn()) throw new Error("WebAssembly SIMD is not supported in the current environment.");
    }
    let o = on();
    r > 1 && !o && (typeof self < "u" && !self.crossOriginIsolated && console.warn("env.wasm.numThreads is set to " + r + ", but this will not work unless you enable crossOriginIsolated mode. See https://web.dev/cross-origin-isolation-guide/ for more info."), console.warn("WebAssembly multi-threading is not supported in the current environment. Falling back to single-threading."), t.numThreads = r = 1);
    let n = t.wasmPaths, s = typeof n == "string" ? n : void 0, a = n?.mjs, i = a?.href ?? a, u = n?.wasm, f = u?.href ?? u, d = t.wasmBinary, [p, c] = await pr(i, s, r > 1, !!d || !!f), l = false, h = [];
    if (e > 0 && h.push(new Promise((b) => {
      setTimeout(() => {
        l = true, b();
      }, e);
    })), h.push(new Promise((b, E) => {
      let y = { numThreads: r };
      if (d) y.wasmBinary = d, y.locateFile = (m) => m;
      else if (f || s) y.locateFile = (m) => f ?? s + m;
      else if (i && i.indexOf("blob:") !== 0) y.locateFile = (m) => new URL(m, i).href;
      else if (p) {
        let m = ke();
        m && (y.locateFile = (A) => m + A);
      }
      c(y).then((m) => {
        Ge = false, ht = true, mt = m, b(), p && URL.revokeObjectURL(p);
      }, (m) => {
        Ge = false, lr = true, E(m);
      });
    })), await Promise.race(h), l) throw new Error(`WebAssembly backend initializing failed due to timeout: ${e}ms`);
  }, I = () => {
    if (ht && mt) return mt;
    throw new Error("WebAssembly is not initialized yet.");
  };
});
var F;
var Te;
var S;
var $e = T(() => {
  "use strict";
  te();
  F = (t, e) => {
    let r = I(), o = r.lengthBytesUTF8(t) + 1, n = r._malloc(o);
    return r.stringToUTF8(t, n, o), e.push(n), n;
  }, Te = (t, e, r, o) => {
    if (typeof t == "object" && t !== null) {
      if (r.has(t)) throw new Error("Circular reference in options");
      r.add(t);
    }
    Object.entries(t).forEach(([n, s]) => {
      let a = e ? e + n : n;
      if (typeof s == "object") Te(s, a + ".", r, o);
      else if (typeof s == "string" || typeof s == "number") o(a, s.toString());
      else if (typeof s == "boolean") o(a, s ? "1" : "0");
      else throw new Error(`Can't handle extra config type: ${typeof s}`);
    });
  }, S = (t) => {
    let e = I(), r = e.stackSave();
    try {
      let o = e.PTR_SIZE, n = e.stackAlloc(2 * o);
      e._OrtGetLastError(n, n + o);
      let s = Number(e.getValue(n, o === 4 ? "i32" : "i64")), a = e.getValue(n + o, "*"), i = a ? e.UTF8ToString(a) : "";
      throw new Error(`${t} ERROR_CODE: ${s}, ERROR_MESSAGE: ${i}`);
    } finally {
      e.stackRestore(r);
    }
  };
});
var mr;
var hr = T(() => {
  "use strict";
  te();
  $e();
  mr = (t) => {
    let e = I(), r = 0, o = [], n = t || {};
    try {
      if (t?.logSeverityLevel === void 0) n.logSeverityLevel = 2;
      else if (typeof t.logSeverityLevel != "number" || !Number.isInteger(t.logSeverityLevel) || t.logSeverityLevel < 0 || t.logSeverityLevel > 4) throw new Error(`log severity level is not valid: ${t.logSeverityLevel}`);
      if (t?.logVerbosityLevel === void 0) n.logVerbosityLevel = 0;
      else if (typeof t.logVerbosityLevel != "number" || !Number.isInteger(t.logVerbosityLevel)) throw new Error(`log verbosity level is not valid: ${t.logVerbosityLevel}`);
      t?.terminate === void 0 && (n.terminate = false);
      let s = 0;
      return t?.tag !== void 0 && (s = F(t.tag, o)), r = e._OrtCreateRunOptions(n.logSeverityLevel, n.logVerbosityLevel, !!n.terminate, s), r === 0 && S("Can't create run options."), t?.extra !== void 0 && Te(t.extra, "", /* @__PURE__ */ new WeakSet(), (a, i) => {
        let u = F(a, o), f = F(i, o);
        e._OrtAddRunConfigEntry(r, u, f) !== 0 && S(`Can't set a run config entry: ${a} - ${i}.`);
      }), [r, o];
    } catch (s) {
      throw r !== 0 && e._OrtReleaseRunOptions(r), o.forEach((a) => e._free(a)), s;
    }
  };
});
var un;
var fn;
var cn;
var Ee;
var q;
var dn;
var yr;
var br = T(() => {
  "use strict";
  te();
  $e();
  un = (t) => {
    switch (t) {
      case "disabled":
        return 0;
      case "basic":
        return 1;
      case "extended":
        return 2;
      case "layout":
        return 3;
      case "all":
        return 99;
      default:
        throw new Error(`unsupported graph optimization level: ${t}`);
    }
  }, fn = (t) => {
    switch (t) {
      case "sequential":
        return 0;
      case "parallel":
        return 1;
      default:
        throw new Error(`unsupported execution mode: ${t}`);
    }
  }, cn = (t) => {
    t.extra || (t.extra = {}), t.extra.session || (t.extra.session = {});
    let e = t.extra.session;
    e.use_ort_model_bytes_directly || (e.use_ort_model_bytes_directly = "1"), t.executionProviders && t.executionProviders.some((r) => (typeof r == "string" ? r : r.name) === "webgpu") && (t.enableMemPattern = false);
  }, Ee = (t, e, r, o) => {
    let n = F(e, o), s = F(r, o);
    I()._OrtAddSessionConfigEntry(t, n, s) !== 0 && S(`Can't set a session config entry: ${e} - ${r}.`);
  }, q = (t, e, r, o) => {
    let n = F(e, o), s = F(r, o);
    t.push([n, s]);
  }, dn = async (t, e, r) => {
    let o = e.executionProviders;
    for (let n of o) {
      let s = typeof n == "string" ? n : n.name, a = [];
      switch (s) {
        case "webnn":
          if (s = "WEBNN", Ee(t, "session.disable_quant_qdq", "1", r), Ee(t, "session.disable_qdq_constant_folding", "1", r), typeof n != "string") {
            let c = n?.deviceType;
            c && Ee(t, "deviceType", c, r);
          }
          break;
        case "webgpu":
          {
            s = "WebGPU";
            let p;
            if (typeof n != "string") {
              let l = n;
              if (l.device) if (typeof GPUDevice < "u" && l.device instanceof GPUDevice) p = l.device;
              else throw new Error("Invalid GPU device set in WebGPU EP options.");
              let { enableGraphCapture: h } = e;
              if (typeof h == "boolean" && h && q(a, "enableGraphCapture", "1", r), typeof l.preferredLayout == "string" && q(a, "preferredLayout", l.preferredLayout, r), l.forceCpuNodeNames) {
                let b = Array.isArray(l.forceCpuNodeNames) ? l.forceCpuNodeNames : [l.forceCpuNodeNames];
                q(a, "forceCpuNodeNames", b.join(`
`), r);
              }
              l.validationMode && q(a, "validationMode", l.validationMode, r), typeof l.enableMatmulFp32Accumulation == "boolean" && q(a, "enableMatmulFp32Accumulation", l.enableMatmulFp32Accumulation ? "1" : "0", r);
              for (let b of ["storageBufferCacheMode", "uniformBufferCacheMode", "queryResolveBufferCacheMode", "defaultBufferCacheMode"]) {
                let E = l[b];
                if (E) {
                  if (E !== "disabled" && E !== "lazyRelease" && E !== "simple" && E !== "bucket") throw new Error(`${b} must be one of 'disabled', 'lazyRelease', 'simple' or 'bucket': ${E}`);
                  q(a, b, E, r);
                }
              }
            }
            let c = I().webgpuRegisterDevice(p);
            if (c) {
              let [l, h, b] = c;
              q(a, "deviceId", l.toString(), r), q(a, "webgpuInstance", h.toString(), r), q(a, "webgpuDevice", b.toString(), r);
            }
          }
          break;
        case "wasm":
        case "cpu":
          continue;
        default:
          throw new Error(`not supported execution provider: ${s}`);
      }
      let i = F(s, r), u = a.length, f = 0, d = 0;
      if (u > 0) {
        f = I()._malloc(u * I().PTR_SIZE), r.push(f), d = I()._malloc(u * I().PTR_SIZE), r.push(d);
        for (let p = 0; p < u; p++) I().setValue(f + p * I().PTR_SIZE, a[p][0], "*"), I().setValue(d + p * I().PTR_SIZE, a[p][1], "*");
      }
      await I()._OrtAppendExecutionProvider(t, i, f, d, u) !== 0 && S(`Can't append execution provider: ${s}.`);
    }
  }, yr = async (t) => {
    let e = I(), r = 0, o = [], n = t || {};
    cn(n);
    try {
      let s = un(n.graphOptimizationLevel ?? "all"), a = fn(n.executionMode ?? "sequential"), i = typeof n.logId == "string" ? F(n.logId, o) : 0, u = n.logSeverityLevel ?? 2;
      if (!Number.isInteger(u) || u < 0 || u > 4) throw new Error(`log severity level is not valid: ${u}`);
      let f = n.logVerbosityLevel ?? 0;
      if (!Number.isInteger(f) || f < 0 || f > 4) throw new Error(`log verbosity level is not valid: ${f}`);
      let d = typeof n.optimizedModelFilePath == "string" ? F(n.optimizedModelFilePath, o) : 0;
      if (r = e._OrtCreateSessionOptions(s, !!n.enableCpuMemArena, !!n.enableMemPattern, a, !!n.enableProfiling, 0, i, u, f, d), r === 0 && S("Can't create session options."), n.executionProviders && await dn(r, n, o), n.enableGraphCapture !== void 0) {
        if (typeof n.enableGraphCapture != "boolean") throw new Error(`enableGraphCapture must be a boolean value: ${n.enableGraphCapture}`);
        Ee(r, "enableGraphCapture", n.enableGraphCapture.toString(), o);
      }
      if (n.freeDimensionOverrides) for (let [p, c] of Object.entries(n.freeDimensionOverrides)) {
        if (typeof p != "string") throw new Error(`free dimension override name must be a string: ${p}`);
        if (typeof c != "number" || !Number.isInteger(c) || c < 0) throw new Error(`free dimension override value must be a non-negative integer: ${c}`);
        let l = F(p, o);
        e._OrtAddFreeDimensionOverride(r, l, c) !== 0 && S(`Can't set a free dimension override: ${p} - ${c}.`);
      }
      return n.extra !== void 0 && Te(n.extra, "", /* @__PURE__ */ new WeakSet(), (p, c) => {
        Ee(r, p, c, o);
      }), [r, o];
    } catch (s) {
      throw r !== 0 && e._OrtReleaseSessionOptions(r) !== 0 && S("Can't release session options."), o.forEach((a) => e._free(a)), s;
    }
  };
});
var re;
var ze;
var le;
var fe;
var Se;
var Ve;
var je;
var yt;
var ce = T(() => {
  "use strict";
  re = (t) => {
    switch (t) {
      case "int8":
        return 3;
      case "uint8":
        return 2;
      case "bool":
        return 9;
      case "int16":
        return 5;
      case "uint16":
        return 4;
      case "int32":
        return 6;
      case "uint32":
        return 12;
      case "float16":
        return 10;
      case "float32":
        return 1;
      case "float64":
        return 11;
      case "string":
        return 8;
      case "int64":
        return 7;
      case "uint64":
        return 13;
      case "int4":
        return 22;
      case "uint4":
        return 21;
      default:
        throw new Error(`unsupported data type: ${t}`);
    }
  }, ze = (t) => {
    switch (t) {
      case 3:
        return "int8";
      case 2:
        return "uint8";
      case 9:
        return "bool";
      case 5:
        return "int16";
      case 4:
        return "uint16";
      case 6:
        return "int32";
      case 12:
        return "uint32";
      case 10:
        return "float16";
      case 1:
        return "float32";
      case 11:
        return "float64";
      case 8:
        return "string";
      case 7:
        return "int64";
      case 13:
        return "uint64";
      case 22:
        return "int4";
      case 21:
        return "uint4";
      default:
        throw new Error(`unsupported data type: ${t}`);
    }
  }, le = (t, e) => {
    let r = [-1, 4, 1, 1, 2, 2, 4, 8, -1, 1, 2, 8, 4, 8, -1, -1, -1, -1, -1, -1, -1, 0.5, 0.5][t], o = typeof e == "number" ? e : e.reduce((n, s) => n * s, 1);
    return r > 0 ? Math.ceil(o * r) : void 0;
  }, fe = (t) => {
    switch (t) {
      case "float16":
        return typeof Float16Array < "u" ? Float16Array : Uint16Array;
      case "float32":
        return Float32Array;
      case "uint8":
        return Uint8Array;
      case "int8":
        return Int8Array;
      case "uint16":
        return Uint16Array;
      case "int16":
        return Int16Array;
      case "int32":
        return Int32Array;
      case "bool":
        return Uint8Array;
      case "float64":
        return Float64Array;
      case "uint32":
        return Uint32Array;
      case "int64":
        return BigInt64Array;
      case "uint64":
        return BigUint64Array;
      default:
        throw new Error(`unsupported type: ${t}`);
    }
  }, Se = (t) => {
    switch (t) {
      case "verbose":
        return 0;
      case "info":
        return 1;
      case "warning":
        return 2;
      case "error":
        return 3;
      case "fatal":
        return 4;
      default:
        throw new Error(`unsupported logging level: ${t}`);
    }
  }, Ve = (t) => t === "float32" || t === "float16" || t === "int32" || t === "int64" || t === "uint32" || t === "uint8" || t === "bool" || t === "uint4" || t === "int4", je = (t) => t === "float32" || t === "float16" || t === "int32" || t === "int64" || t === "uint32" || t === "uint64" || t === "int8" || t === "uint8" || t === "bool" || t === "uint4" || t === "int4", yt = (t) => {
    switch (t) {
      case "none":
        return 0;
      case "cpu":
        return 1;
      case "cpu-pinned":
        return 2;
      case "texture":
        return 3;
      case "gpu-buffer":
        return 4;
      case "ml-tensor":
        return 5;
      default:
        throw new Error(`unsupported data location: ${t}`);
    }
  };
});
var Ie;
var bt = T(() => {
  "use strict";
  Oe();
  Ie = async (t) => {
    if (typeof t == "string") if (false) try {
      let { readFile: e } = ot("node:fs/promises");
      return new Uint8Array(await e(t));
    } catch (e) {
      if (e.code === "ERR_FS_FILE_TOO_LARGE") {
        let { createReadStream: r } = ot("node:fs"), o = r(t), n = [];
        for await (let s of o) n.push(s);
        return new Uint8Array(Buffer.concat(n));
      }
      throw e;
    }
    else {
      let e = await fetch(t);
      if (!e.ok) throw new Error(`failed to load external data file: ${t}`);
      let r = e.headers.get("Content-Length"), o = r ? parseInt(r, 10) : 0;
      if (o < 1073741824) return new Uint8Array(await e.arrayBuffer());
      {
        if (!e.body) throw new Error(`failed to load external data file: ${t}, no response body.`);
        let n = e.body.getReader(), s;
        try {
          s = new ArrayBuffer(o);
        } catch (i) {
          if (i instanceof RangeError) {
            let u = Math.ceil(o / 65536);
            s = new WebAssembly.Memory({ initial: u, maximum: u }).buffer;
          } else throw i;
        }
        let a = 0;
        for (; ; ) {
          let { done: i, value: u } = await n.read();
          if (i) break;
          let f = u.byteLength;
          new Uint8Array(s, a, f).set(u), a += f;
        }
        return new Uint8Array(s, 0, o);
      }
    }
    else return t instanceof Blob ? new Uint8Array(await t.arrayBuffer()) : t instanceof Uint8Array ? t : new Uint8Array(t);
  };
});
var wr;
var gr = T(() => {
  "use strict";
  ce();
  wr = (t, e) => new (fe(e))(t);
});
var pn;
var ln;
var Tr;
var Er;
var Sr;
var mn;
var N;
var wt = T(() => {
  "use strict";
  ce();
  pn = ["V", "I", "W", "E", "F"], ln = (t, e) => {
    console.log(`[${pn[t]},${(/* @__PURE__ */ new Date()).toISOString()}]${e}`);
  }, Sr = (t, e) => {
    Tr = t, Er = e;
  }, mn = (t, e) => {
    let r = Se(t), o = Se(Tr);
    r >= o && ln(r, typeof e == "function" ? e() : e);
  }, N = (...t) => {
    Er && mn(...t);
  };
});
var Lr;
var hn;
var Ar;
var yn;
var Ir;
var bn;
var vr;
var He;
var Je;
var gt;
var Br;
var Mr = T(() => {
  "use strict";
  ce();
  wt();
  Lr = /* @__PURE__ */ new Map([["float32", 32], ["float16", 16], ["int32", 32], ["uint32", 32], ["int64", 64], ["uint64", 64], ["int8", 8], ["uint8", 8], ["int4", 4], ["uint4", 4]]), hn = (t, e) => {
    if (e === "int32") return t;
    let r = Lr.get(e);
    if (!r) throw new Error(`WebNN backend does not support data type: ${e}`);
    let o = r / 8;
    if (t.byteLength % o !== 0) throw new Error(`Invalid Uint8Array length - must be a multiple of ${o}.`);
    let n = t.byteLength / o, s = new (fe(e))(t.buffer, t.byteOffset, n);
    switch (e) {
      case "int64":
      case "uint64": {
        let a = new Int32Array(n);
        for (let i = 0; i < n; i++) {
          let u = s[i];
          if (u > 2147483647n || u < -2147483648n) throw new Error("Can not convert int64 data to int32 - value out of range.");
          a[i] = Number(u);
        }
        return new Uint8Array(a.buffer);
      }
      case "int8":
      case "uint8":
      case "uint32": {
        if (e === "uint32" && s.some((i) => i > 2147483647)) throw new Error("Can not convert uint32 data to int32 - value out of range.");
        let a = Int32Array.from(s, Number);
        return new Uint8Array(a.buffer);
      }
      default:
        throw new Error(`Unsupported data conversion from ${e} to 'int32'`);
    }
  }, Ar = (t, e) => {
    if (e === "int32") return t;
    if (t.byteLength % 4 !== 0) throw new Error("Invalid Uint8Array length - must be a multiple of 4 (int32).");
    let r = t.byteLength / 4, o = new Int32Array(t.buffer, t.byteOffset, r);
    switch (e) {
      case "int64": {
        let n = BigInt64Array.from(o, BigInt);
        return new Uint8Array(n.buffer);
      }
      case "uint64": {
        if (o.some((s) => s < 0)) throw new Error("Can not convert int32 data to uin64 - negative value found.");
        let n = BigUint64Array.from(o, BigInt);
        return new Uint8Array(n.buffer);
      }
      case "int8": {
        if (o.some((s) => s < -128 || s > 127)) throw new Error("Can not convert int32 data to int8 - value out of range.");
        let n = Int8Array.from(o, Number);
        return new Uint8Array(n.buffer);
      }
      case "uint8": {
        if (o.some((n) => n < 0 || n > 255)) throw new Error("Can not convert int32 data to uint8 - value out of range.");
        return Uint8Array.from(o, Number);
      }
      case "uint32": {
        if (o.some((s) => s < 0)) throw new Error("Can not convert int32 data to uint32 - negative value found.");
        let n = Uint32Array.from(o, Number);
        return new Uint8Array(n.buffer);
      }
      default:
        throw new Error(`Unsupported data conversion from 'int32' to ${e}`);
    }
  }, yn = 1, Ir = () => yn++, bn = /* @__PURE__ */ new Map([["int8", "int32"], ["uint8", "int32"], ["uint32", "int32"], ["int64", "int32"]]), vr = (t, e) => {
    let r = Lr.get(t);
    if (!r) throw new Error(`WebNN backend does not support data type: ${t}`);
    return e.length > 0 ? Math.ceil(e.reduce((o, n) => o * n) * r / 8) : 0;
  }, He = class {
    constructor(e) {
      this.isDataConverted = false;
      let { sessionId: r, context: o, tensor: n, dataType: s, shape: a, fallbackDataType: i } = e;
      this.sessionId = r, this.mlContext = o, this.mlTensor = n, this.dataType = s, this.tensorShape = a, this.fallbackDataType = i;
    }
    get tensor() {
      return this.mlTensor;
    }
    get type() {
      return this.dataType;
    }
    get fallbackType() {
      return this.fallbackDataType;
    }
    get shape() {
      return this.tensorShape;
    }
    get byteLength() {
      return vr(this.dataType, this.tensorShape);
    }
    destroy() {
      N("verbose", () => "[WebNN] TensorWrapper.destroy"), this.mlTensor.destroy();
    }
    write(e) {
      this.mlContext.writeTensor(this.mlTensor, e);
    }
    async read(e) {
      if (this.fallbackDataType) {
        let r = await this.mlContext.readTensor(this.mlTensor), o = Ar(new Uint8Array(r), this.dataType);
        if (e) {
          (e instanceof ArrayBuffer ? new Uint8Array(e) : new Uint8Array(e.buffer, e.byteOffset, e.byteLength)).set(o);
          return;
        } else return new Uint8Array(o).buffer;
      } else return e ? this.mlContext.readTensor(this.mlTensor, e) : this.mlContext.readTensor(this.mlTensor);
    }
    canReuseTensor(e, r, o) {
      return this.mlContext === e && this.dataType === r && this.tensorShape.length === o.length && this.tensorShape.every((n, s) => n === o[s]);
    }
    setIsDataConverted(e) {
      this.isDataConverted = e;
    }
  }, Je = class {
    constructor(e, r) {
      this.tensorManager = e;
      this.wrapper = r;
    }
    get tensorWrapper() {
      return this.wrapper;
    }
    releaseTensor() {
      this.tensorWrapper && (this.tensorManager.releaseTensor(this.tensorWrapper), this.wrapper = void 0);
    }
    async ensureTensor(e, r, o, n) {
      let s = this.tensorManager.getMLContext(e), a = this.tensorManager.getMLOpSupportLimits(e), i;
      if (!a?.input.dataTypes.includes(r)) {
        if (i = bn.get(r), !i || !a?.input.dataTypes.includes(i)) throw new Error(`WebNN backend does not support data type: ${r}`);
        N("verbose", () => `[WebNN] TensorIdTracker.ensureTensor: fallback dataType from ${r} to ${i}`);
      }
      if (this.wrapper) {
        if (this.wrapper.canReuseTensor(s, r, o)) return this.wrapper.tensor;
        if (n) {
          if (this.wrapper.byteLength !== vr(r, o)) throw new Error("Unable to copy data to tensor with different size.");
          this.activeUpload = new Uint8Array(await this.wrapper.read());
        }
        this.tensorManager.releaseTensor(this.wrapper);
      }
      let u = typeof MLTensorUsage > "u" ? void 0 : MLTensorUsage.READ | MLTensorUsage.WRITE;
      return this.wrapper = await this.tensorManager.getCachedTensor(e, r, o, u, true, true, i), n && this.activeUpload && (this.wrapper.write(this.activeUpload), this.activeUpload = void 0), this.wrapper.tensor;
    }
    upload(e) {
      let r = e;
      if (this.wrapper) {
        if (this.wrapper.fallbackType) if (this.wrapper.fallbackType === "int32") r = hn(e, this.wrapper.type), this.wrapper.setIsDataConverted(true);
        else throw new Error(`Unsupported fallback data type: ${this.wrapper.fallbackType}`);
        if (e.byteLength === this.wrapper.byteLength) {
          this.wrapper.write(r);
          return;
        } else N("verbose", () => "Data size does not match tensor size. Releasing tensor."), this.releaseTensor();
      }
      this.activeUpload ? this.activeUpload.set(r) : this.activeUpload = new Uint8Array(r);
    }
    async download(e) {
      if (this.activeUpload) {
        let r = this.wrapper?.isDataConverted ? Ar(this.activeUpload, this.wrapper?.type) : this.activeUpload;
        if (e) {
          e instanceof ArrayBuffer ? new Uint8Array(e).set(r) : new Uint8Array(e.buffer, e.byteOffset, e.byteLength).set(r);
          return;
        } else return r.buffer;
      }
      if (!this.wrapper) throw new Error("Tensor has not been created.");
      return e ? this.wrapper.read(e) : this.wrapper.read();
    }
  }, gt = class {
    constructor(e) {
      this.backend = e;
      this.tensorTrackersById = /* @__PURE__ */ new Map();
      this.freeTensors = [];
      this.externalTensors = /* @__PURE__ */ new Set();
    }
    getMLContext(e) {
      let r = this.backend.getMLContext(e);
      if (!r) throw new Error("MLContext not found for session.");
      return r;
    }
    getMLOpSupportLimits(e) {
      return this.backend.getMLOpSupportLimits(e);
    }
    reserveTensorId() {
      let e = Ir();
      return this.tensorTrackersById.set(e, new Je(this)), e;
    }
    releaseTensorId(e) {
      let r = this.tensorTrackersById.get(e);
      r && (this.tensorTrackersById.delete(e), r.tensorWrapper && this.releaseTensor(r.tensorWrapper));
    }
    async ensureTensor(e, r, o, n, s) {
      N("verbose", () => `[WebNN] TensorManager.ensureTensor {tensorId: ${r}, dataType: ${o}, shape: ${n}, copyOld: ${s}}`);
      let a = this.tensorTrackersById.get(r);
      if (!a) throw new Error("Tensor not found.");
      return a.ensureTensor(e, o, n, s);
    }
    upload(e, r) {
      let o = this.tensorTrackersById.get(e);
      if (!o) throw new Error("Tensor not found.");
      o.upload(r);
    }
    async download(e, r) {
      N("verbose", () => `[WebNN] TensorManager.download {tensorId: ${e}, dstBuffer: ${r?.byteLength}}`);
      let o = this.tensorTrackersById.get(e);
      if (!o) throw new Error("Tensor not found.");
      return o.download(r);
    }
    releaseTensorsForSession(e) {
      for (let r of this.freeTensors) r.sessionId === e && r.destroy();
      this.freeTensors = this.freeTensors.filter((r) => r.sessionId !== e);
    }
    registerTensor(e, r, o, n) {
      let s = this.getMLContext(e), a = Ir(), i = new He({ sessionId: e, context: s, tensor: r, dataType: o, shape: n });
      return this.tensorTrackersById.set(a, new Je(this, i)), this.externalTensors.add(i), a;
    }
    async getCachedTensor(e, r, o, n, s, a, i) {
      let u = this.getMLContext(e);
      for (let [d, p] of this.freeTensors.entries()) if (p.canReuseTensor(u, r, o)) {
        N("verbose", () => `[WebNN] Reusing tensor {dataType: ${r}, ${i ? `fallbackDataType: ${i},` : ""} shape: ${o}`);
        let c = this.freeTensors.splice(d, 1)[0];
        return c.sessionId = e, c;
      }
      N("verbose", () => `[WebNN] MLContext.createTensor {dataType: ${r}, ${i ? `fallbackDataType: ${i},` : ""} shape: ${o}}`);
      let f = await u.createTensor({ dataType: i ?? r, shape: o, dimensions: o, usage: n, writable: s, readable: a });
      return new He({ sessionId: e, context: u, tensor: f, dataType: r, shape: o, fallbackDataType: i });
    }
    releaseTensor(e) {
      this.externalTensors.has(e) && this.externalTensors.delete(e), this.freeTensors.push(e);
    }
  }, Br = (...t) => new gt(...t);
});
var xr = {};
ve(xr, { WebNNBackend: () => Tt });
var qe;
var wn;
var Tt;
var Or = T(() => {
  "use strict";
  ce();
  te();
  gr();
  Mr();
  wt();
  qe = /* @__PURE__ */ new Map([[1, "float32"], [10, "float16"], [6, "int32"], [12, "uint32"], [7, "int64"], [13, "uint64"], [22, "int4"], [21, "uint4"], [3, "int8"], [2, "uint8"], [9, "uint8"]]), wn = (t, e) => {
    if (t === e) return true;
    if (t === void 0 || e === void 0) return false;
    let r = Object.keys(t).sort(), o = Object.keys(e).sort();
    return r.length === o.length && r.every((n, s) => n === o[s] && t[n] === e[n]);
  }, Tt = class {
    constructor(e) {
      this.tensorManager = Br(this);
      this.mlContextBySessionId = /* @__PURE__ */ new Map();
      this.sessionIdsByMLContext = /* @__PURE__ */ new Map();
      this.mlContextCache = [];
      this.sessionGraphInputs = /* @__PURE__ */ new Map();
      this.sessionGraphOutputs = /* @__PURE__ */ new Map();
      this.temporaryGraphInputs = [];
      this.temporaryGraphOutputs = [];
      this.temporarySessionTensorIds = /* @__PURE__ */ new Map();
      this.mlOpSupportLimitsBySessionId = /* @__PURE__ */ new Map();
      Sr(e.logLevel, !!e.debug);
    }
    get currentSessionId() {
      if (this.activeSessionId === void 0) throw new Error("No active session");
      return this.activeSessionId;
    }
    onRunStart(e) {
      N("verbose", () => `[WebNN] onRunStart {sessionId: ${e}}`), this.activeSessionId = e;
    }
    onRunEnd(e) {
      N("verbose", () => `[WebNN] onRunEnd {sessionId: ${e}}`);
      let r = this.temporarySessionTensorIds.get(e);
      if (r) {
        for (let o of r) N("verbose", () => `[WebNN] releasing temporary tensor {tensorId: ${o}}`), this.tensorManager.releaseTensorId(o);
        this.temporarySessionTensorIds.delete(e), this.activeSessionId = void 0;
      }
    }
    async createMLContext(e) {
      if (e instanceof GPUDevice) {
        let o = this.mlContextCache.findIndex((n) => n.gpuDevice === e);
        if (o !== -1) return this.mlContextCache[o].mlContext;
        {
          let n = await navigator.ml.createContext(e);
          return this.mlContextCache.push({ gpuDevice: e, mlContext: n }), n;
        }
      } else if (e === void 0) {
        let o = this.mlContextCache.findIndex((n) => n.options === void 0 && n.gpuDevice === void 0);
        if (o !== -1) return this.mlContextCache[o].mlContext;
        {
          let n = await navigator.ml.createContext();
          return this.mlContextCache.push({ mlContext: n }), n;
        }
      }
      let r = this.mlContextCache.findIndex((o) => wn(o.options, e));
      if (r !== -1) return this.mlContextCache[r].mlContext;
      {
        let o = await navigator.ml.createContext(e);
        return this.mlContextCache.push({ options: e, mlContext: o }), o;
      }
    }
    registerMLContext(e, r) {
      this.mlContextBySessionId.set(e, r);
      let o = this.sessionIdsByMLContext.get(r);
      o || (o = /* @__PURE__ */ new Set(), this.sessionIdsByMLContext.set(r, o)), o.add(e), this.mlOpSupportLimitsBySessionId.has(e) || this.mlOpSupportLimitsBySessionId.set(e, r.opSupportLimits()), this.temporaryGraphInputs.length > 0 && (this.sessionGraphInputs.set(e, this.temporaryGraphInputs), this.temporaryGraphInputs = []), this.temporaryGraphOutputs.length > 0 && (this.sessionGraphOutputs.set(e, this.temporaryGraphOutputs), this.temporaryGraphOutputs = []);
    }
    onReleaseSession(e) {
      this.sessionGraphInputs.delete(e), this.sessionGraphOutputs.delete(e);
      let r = this.mlContextBySessionId.get(e);
      if (!r) return;
      this.tensorManager.releaseTensorsForSession(e), this.mlContextBySessionId.delete(e), this.mlOpSupportLimitsBySessionId.delete(e);
      let o = this.sessionIdsByMLContext.get(r);
      if (o.delete(e), o.size === 0) {
        this.sessionIdsByMLContext.delete(r);
        let n = this.mlContextCache.findIndex((s) => s.mlContext === r);
        n !== -1 && this.mlContextCache.splice(n, 1);
      }
    }
    getMLContext(e) {
      return this.mlContextBySessionId.get(e);
    }
    getMLOpSupportLimits(e) {
      return this.mlOpSupportLimitsBySessionId.get(e);
    }
    reserveTensorId() {
      return this.tensorManager.reserveTensorId();
    }
    releaseTensorId(e) {
      N("verbose", () => `[WebNN] releaseTensorId {tensorId: ${e}}`), this.tensorManager.releaseTensorId(e);
    }
    async ensureTensor(e, r, o, n, s) {
      let a = qe.get(o);
      if (!a) throw new Error(`Unsupported ONNX data type: ${o}`);
      return this.tensorManager.ensureTensor(e ?? this.currentSessionId, r, a, n, s);
    }
    async createTemporaryTensor(e, r, o) {
      N("verbose", () => `[WebNN] createTemporaryTensor {onnxDataType: ${r}, shape: ${o}}`);
      let n = qe.get(r);
      if (!n) throw new Error(`Unsupported ONNX data type: ${r}`);
      let s = this.tensorManager.reserveTensorId();
      await this.tensorManager.ensureTensor(e, s, n, o, false);
      let a = this.temporarySessionTensorIds.get(e);
      return a ? a.push(s) : this.temporarySessionTensorIds.set(e, [s]), s;
    }
    uploadTensor(e, r) {
      if (!I().shouldTransferToMLTensor) throw new Error("Trying to upload to a MLTensor while shouldTransferToMLTensor is false");
      N("verbose", () => `[WebNN] uploadTensor {tensorId: ${e}, data: ${r.byteLength}}`), this.tensorManager.upload(e, r);
    }
    async downloadTensor(e, r) {
      return this.tensorManager.download(e, r);
    }
    createMLTensorDownloader(e, r) {
      return async () => {
        let o = await this.tensorManager.download(e);
        return wr(o, r);
      };
    }
    registerMLTensor(e, r, o, n) {
      let s = qe.get(o);
      if (!s) throw new Error(`Unsupported ONNX data type: ${o}`);
      let a = this.tensorManager.registerTensor(e, r, s, n);
      return N("verbose", () => `[WebNN] registerMLTensor {tensor: ${r}, dataType: ${s}, dimensions: ${n}} -> {tensorId: ${a}}`), a;
    }
    registerGraphInput(e) {
      this.temporaryGraphInputs.push(e);
    }
    registerGraphOutput(e) {
      this.temporaryGraphOutputs.push(e);
    }
    isGraphInput(e, r) {
      let o = this.sessionGraphInputs.get(e);
      return o ? o.includes(r) : false;
    }
    isGraphOutput(e, r) {
      let o = this.sessionGraphOutputs.get(e);
      return o ? o.includes(r) : false;
    }
    isGraphInputOutputTypeSupported(e, r, o = true) {
      let n = qe.get(re(r)), s = this.mlOpSupportLimitsBySessionId.get(e);
      return typeof n > "u" ? false : o ? !!s?.input.dataTypes.includes(n) : !!s?.output.dataTypes.includes(n);
    }
    flush() {
    }
  };
});
var gn;
var Ce;
var Pe;
var de;
var Tn;
var Dr;
var ge;
var _e;
var Re;
var Ur;
var Ne;
var Fe;
var We;
var pt = T(() => {
  "use strict";
  ee();
  hr();
  br();
  ce();
  te();
  $e();
  bt();
  gn = (t, e) => {
    I()._OrtInit(t, e) !== 0 && S("Can't initialize onnxruntime.");
  }, Ce = async (t) => {
    gn(t.wasm.numThreads, Se(t.logLevel));
  }, Pe = async (t, e) => {
    I().asyncInit?.();
    let r = t.webgpu.adapter;
    if (e === "webgpu") {
      if (typeof navigator > "u" || !navigator.gpu) throw new Error("WebGPU is not supported in current environment");
      if (r) {
        if (typeof r.limits != "object" || typeof r.features != "object" || typeof r.requestDevice != "function") throw new Error("Invalid GPU adapter set in `env.webgpu.adapter`. It must be a GPUAdapter object.");
      } else {
        let o = t.webgpu.powerPreference;
        if (o !== void 0 && o !== "low-power" && o !== "high-performance") throw new Error(`Invalid powerPreference setting: "${o}"`);
        let n = t.webgpu.forceFallbackAdapter;
        if (n !== void 0 && typeof n != "boolean") throw new Error(`Invalid forceFallbackAdapter setting: "${n}"`);
        if (r = await navigator.gpu.requestAdapter({ powerPreference: o, forceFallbackAdapter: n }), !r) throw new Error('Failed to get GPU adapter. You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.');
      }
    }
    if (e === "webnn" && (typeof navigator > "u" || !navigator.ml)) throw new Error("WebNN is not supported in current environment");
    if (e === "webgpu" && I().webgpuInit((o) => {
      t.webgpu.device = o;
    }), e === "webnn") {
      let o = new (Or(), st(xr)).WebNNBackend(t);
      I().webnnInit([o, () => o.reserveTensorId(), (n) => o.releaseTensorId(n), async (n, s, a, i, u) => o.ensureTensor(n, s, a, i, u), (n, s) => {
        o.uploadTensor(n, s);
      }, async (n, s) => o.downloadTensor(n, s), (n, s) => o.registerMLContext(n, s), !!t.trace]);
    }
  }, de = /* @__PURE__ */ new Map(), Tn = (t) => {
    let e = I(), r = e.stackSave();
    try {
      let o = e.PTR_SIZE, n = e.stackAlloc(2 * o);
      e._OrtGetInputOutputCount(t, n, n + o) !== 0 && S("Can't get session input/output count.");
      let a = o === 4 ? "i32" : "i64";
      return [Number(e.getValue(n, a)), Number(e.getValue(n + o, a))];
    } finally {
      e.stackRestore(r);
    }
  }, Dr = (t, e) => {
    let r = I(), o = r.stackSave(), n = 0;
    try {
      let s = r.PTR_SIZE, a = r.stackAlloc(2 * s);
      r._OrtGetInputOutputMetadata(t, e, a, a + s) !== 0 && S("Can't get session input/output metadata.");
      let u = Number(r.getValue(a, "*"));
      n = Number(r.getValue(a + s, "*"));
      let f = r.HEAP32[n / 4];
      if (f === 0) return [u, 0];
      let d = r.HEAPU32[n / 4 + 1], p = [];
      for (let c = 0; c < d; c++) {
        let l = Number(r.getValue(n + 8 + c * s, "*"));
        p.push(l !== 0 ? r.UTF8ToString(l) : Number(r.getValue(n + 8 + (c + d) * s, "*")));
      }
      return [u, f, p];
    } finally {
      r.stackRestore(o), n !== 0 && r._OrtFree(n);
    }
  }, ge = (t) => {
    let e = I(), r = e._malloc(t.byteLength);
    if (r === 0) throw new Error(`Can't create a session. failed to allocate a buffer of size ${t.byteLength}.`);
    return e.HEAPU8.set(t, r), [r, t.byteLength];
  }, _e = async (t, e) => {
    let r, o, n = I();
    Array.isArray(t) ? [r, o] = t : t.buffer === n.HEAPU8.buffer ? [r, o] = [t.byteOffset, t.byteLength] : [r, o] = ge(t);
    let s = 0, a = 0, i = 0, u = [], f = [], d = [];
    try {
      if ([a, u] = await yr(e), e?.externalData && n.mountExternalData) {
        let w = [];
        for (let L of e.externalData) {
          let C = typeof L == "string" ? L : L.path, k = typeof L == "string" ? L : L.data;
          w.push(Ie(k).then((x) => {
            n.mountExternalData(C, x);
          }));
        }
        await Promise.all(w);
      }
      for (let w of e?.executionProviders ?? []) if ((typeof w == "string" ? w : w.name) === "webnn") {
        if (n.shouldTransferToMLTensor = false, typeof w != "string") {
          let C = w, k = C?.context, x = C?.gpuDevice, W = C?.deviceType, H = C?.powerPreference;
          k ? n.currentContext = k : x ? n.currentContext = await n.webnnCreateMLContext(x) : n.currentContext = await n.webnnCreateMLContext({ deviceType: W, powerPreference: H });
        } else n.currentContext = await n.webnnCreateMLContext();
        break;
      }
      s = await n._OrtCreateSession(r, o, a), n.webgpuOnCreateSession?.(s), s === 0 && S("Can't create a session."), n.jsepOnCreateSession?.(), n.currentContext && (n.webnnRegisterMLContext(s, n.currentContext), n.currentContext = void 0, n.shouldTransferToMLTensor = true);
      let [p, c] = Tn(s), l = !!e?.enableGraphCapture, h = [], b = [], E = [], y = [], m = [];
      for (let w = 0; w < p; w++) {
        let [L, C, k] = Dr(s, w);
        L === 0 && S("Can't get an input name."), f.push(L);
        let x = n.UTF8ToString(L);
        h.push(x), E.push(C === 0 ? { name: x, isTensor: false } : { name: x, isTensor: true, type: ze(C), shape: k });
      }
      for (let w = 0; w < c; w++) {
        let [L, C, k] = Dr(s, w + p);
        L === 0 && S("Can't get an output name."), d.push(L);
        let x = n.UTF8ToString(L);
        b.push(x), y.push(C === 0 ? { name: x, isTensor: false } : { name: x, isTensor: true, type: ze(C), shape: k });
        {
          if (l && e?.preferredOutputLocation === void 0) {
            m.push("gpu-buffer");
            continue;
          }
          let W = typeof e?.preferredOutputLocation == "string" ? e.preferredOutputLocation : e?.preferredOutputLocation?.[x] ?? "cpu", H = n.webnnIsGraphOutput;
          if (W === "cpu" && H && H(s, x)) {
            m.push("ml-tensor-cpu-output");
            continue;
          }
          if (W !== "cpu" && W !== "cpu-pinned" && W !== "gpu-buffer" && W !== "ml-tensor") throw new Error(`Not supported preferred output location: ${W}.`);
          if (l && W !== "gpu-buffer") throw new Error(`Not supported preferred output location: ${W}. Only 'gpu-buffer' location is supported when enableGraphCapture is true.`);
          m.push(W);
        }
      }
      let A = null;
      return m.some((w) => w === "gpu-buffer" || w === "ml-tensor" || w === "ml-tensor-cpu-output") && (i = n._OrtCreateBinding(s), i === 0 && S("Can't create IO binding."), A = { handle: i, outputPreferredLocations: m, outputPreferredLocationsEncoded: m.map((w) => w === "ml-tensor-cpu-output" ? "ml-tensor" : w).map((w) => yt(w)) }), de.set(s, [s, f, d, A, l, false]), [s, h, b, E, y];
    } catch (p) {
      throw f.forEach((c) => n._OrtFree(c)), d.forEach((c) => n._OrtFree(c)), i !== 0 && n._OrtReleaseBinding(i) !== 0 && S("Can't release IO binding."), s !== 0 && n._OrtReleaseSession(s) !== 0 && S("Can't release session."), p;
    } finally {
      n._free(r), a !== 0 && n._OrtReleaseSessionOptions(a) !== 0 && S("Can't release session options."), u.forEach((p) => n._free(p)), n.unmountExternalData?.();
    }
  }, Re = (t) => {
    let e = I(), r = de.get(t);
    if (!r) throw new Error(`cannot release session. invalid session id: ${t}`);
    let [o, n, s, a, i] = r;
    a && (i && e._OrtClearBoundOutputs(a.handle) !== 0 && S("Can't clear bound outputs."), e._OrtReleaseBinding(a.handle) !== 0 && S("Can't release IO binding.")), e.jsepOnReleaseSession?.(t), e.webnnOnReleaseSession?.(t), e.webgpuOnReleaseSession?.(t), n.forEach((u) => e._OrtFree(u)), s.forEach((u) => e._OrtFree(u)), e._OrtReleaseSession(o) !== 0 && S("Can't release session."), de.delete(t);
  }, Ur = async (t, e, r, o, n, s, a = false) => {
    if (!t) {
      e.push(0);
      return;
    }
    let i = I(), u = i.PTR_SIZE, f = t[0], d = t[1], p = t[3], c = p, l, h;
    if (f === "string" && (p === "gpu-buffer" || p === "ml-tensor")) throw new Error("String tensor is not supported on GPU.");
    if (a && p !== "gpu-buffer") throw new Error(`External buffer must be provided for input/output index ${s} when enableGraphCapture is true.`);
    if (p === "gpu-buffer") {
      let y = t[2].gpuBuffer;
      h = le(re(f), d);
      {
        let m = i.webgpuRegisterBuffer;
        if (!m) throw new Error('Tensor location "gpu-buffer" is not supported without using WebGPU.');
        l = m(y, o);
      }
    } else if (p === "ml-tensor") {
      let y = t[2].mlTensor;
      h = le(re(f), d);
      let m = i.webnnRegisterMLTensor;
      if (!m) throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');
      l = m(o, y, re(f), d);
    } else {
      let y = t[2];
      if (Array.isArray(y)) {
        h = u * y.length, l = i._malloc(h), r.push(l);
        for (let m = 0; m < y.length; m++) {
          if (typeof y[m] != "string") throw new TypeError(`tensor data at index ${m} is not a string`);
          i.setValue(l + m * u, F(y[m], r), "*");
        }
      } else {
        let m = i.webnnIsGraphInput, A = i.webnnIsGraphOutput;
        if (f !== "string" && m && A) {
          let w = i.UTF8ToString(n);
          if (m(o, w) || A(o, w)) {
            let L = re(f);
            h = le(L, d), c = "ml-tensor";
            let C = i.webnnCreateTemporaryTensor, k = i.webnnUploadTensor;
            if (!C || !k) throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');
            let x = await C(o, L, d);
            k(x, new Uint8Array(y.buffer, y.byteOffset, y.byteLength)), l = x;
          } else h = y.byteLength, l = i._malloc(h), r.push(l), i.HEAPU8.set(new Uint8Array(y.buffer, y.byteOffset, h), l);
        } else h = y.byteLength, l = i._malloc(h), r.push(l), i.HEAPU8.set(new Uint8Array(y.buffer, y.byteOffset, h), l);
      }
    }
    let b = i.stackSave(), E = i.stackAlloc(4 * d.length);
    try {
      d.forEach((m, A) => i.setValue(E + A * u, m, u === 4 ? "i32" : "i64"));
      let y = i._OrtCreateTensor(re(f), l, h, E, d.length, yt(c));
      y === 0 && S(`Can't create tensor for input/output. session=${o}, index=${s}.`), e.push(y);
    } finally {
      i.stackRestore(b);
    }
  }, Ne = async (t, e, r, o, n, s) => {
    let a = I(), i = a.PTR_SIZE, u = de.get(t);
    if (!u) throw new Error(`cannot run inference. invalid session id: ${t}`);
    let f = u[0], d = u[1], p = u[2], c = u[3], l = u[4], h = u[5], b = e.length, E = o.length, y = 0, m = [], A = [], w = [], L = [], C = [], k = a.stackSave(), x = a.stackAlloc(b * i), W = a.stackAlloc(b * i), H = a.stackAlloc(E * i), Lt = a.stackAlloc(E * i);
    try {
      [y, m] = mr(s), K("wasm prepareInputOutputTensor");
      for (let g = 0; g < b; g++) await Ur(r[g], A, L, t, d[e[g]], e[g], l);
      for (let g = 0; g < E; g++) await Ur(n[g], w, L, t, p[o[g]], b + o[g], l);
      Q("wasm prepareInputOutputTensor");
      for (let g = 0; g < b; g++) a.setValue(x + g * i, A[g], "*"), a.setValue(W + g * i, d[e[g]], "*");
      for (let g = 0; g < E; g++) a.setValue(H + g * i, w[g], "*"), a.setValue(Lt + g * i, p[o[g]], "*");
      if (c && !h) {
        let { handle: g, outputPreferredLocations: $, outputPreferredLocationsEncoded: et } = c;
        if (d.length !== b) throw new Error(`input count from feeds (${b}) is expected to be always equal to model's input count (${d.length}).`);
        K("wasm bindInputsOutputs");
        for (let B = 0; B < b; B++) {
          let j = e[B];
          await a._OrtBindInput(g, d[j], A[B]) !== 0 && S(`Can't bind input[${B}] for session=${t}.`);
        }
        for (let B = 0; B < E; B++) {
          let j = o[B];
          n[B]?.[3] ? (C.push(w[B]), a._OrtBindOutput(g, p[j], w[B], 0) !== 0 && S(`Can't bind pre-allocated output[${B}] for session=${t}.`)) : a._OrtBindOutput(g, p[j], 0, et[j]) !== 0 && S(`Can't bind output[${B}] to ${$[B]} for session=${t}.`);
        }
        Q("wasm bindInputsOutputs"), de.set(t, [f, d, p, c, l, true]);
      }
      a.jsepOnRunStart?.(f), a.webnnOnRunStart?.(f);
      let D;
      c ? D = await a._OrtRunWithBinding(f, c.handle, E, H, y) : D = await a._OrtRun(f, W, x, b, Lt, E, H, y), D !== 0 && S("failed to call OrtRun().");
      let J = [], At = [];
      K("wasm ProcessOutputTensor");
      for (let g = 0; g < E; g++) {
        let $ = Number(a.getValue(H + g * i, "*"));
        if ($ === w[g] || C.includes(w[g])) {
          J.push(n[g]), $ !== w[g] && a._OrtReleaseTensor($) !== 0 && S("Can't release tensor.");
          continue;
        }
        let et = a.stackSave(), B = a.stackAlloc(4 * i), j = false, O, R = 0;
        try {
          a._OrtGetTensorData($, B, B + i, B + 2 * i, B + 3 * i) !== 0 && S(`Can't access output tensor data on index ${g}.`);
          let tt = i === 4 ? "i32" : "i64", Ae = Number(a.getValue(B, tt));
          R = a.getValue(B + i, "*");
          let vt = a.getValue(B + i * 2, "*"), jr = Number(a.getValue(B + i * 3, tt)), Y = [];
          for (let P = 0; P < jr; P++) Y.push(Number(a.getValue(vt + P * i, tt)));
          a._OrtFree(vt) !== 0 && S("Can't free memory for tensor dims.");
          let X = Y.reduce((P, M) => P * M, 1);
          O = ze(Ae);
          let ye = c?.outputPreferredLocations[o[g]];
          if (O === "string") {
            if (ye === "gpu-buffer" || ye === "ml-tensor") throw new Error("String tensor is not supported on GPU.");
            let P = [];
            for (let M = 0; M < X; M++) {
              let Z = a.getValue(R + M * i, "*"), be = a.getValue(R + (M + 1) * i, "*"), rt = M === X - 1 ? void 0 : be - Z;
              P.push(a.UTF8ToString(Z, rt));
            }
            J.push([O, Y, P, "cpu"]);
          } else if (ye === "gpu-buffer" && X > 0) {
            let P = a.webgpuGetBuffer;
            if (!P) throw new Error('preferredLocation "gpu-buffer" is not supported without using WebGPU.');
            let M = P(R), Z = le(Ae, X);
            if (Z === void 0 || !Ve(O)) throw new Error(`Unsupported data type: ${O}`);
            j = true;
            {
              a.webgpuRegisterBuffer(M, t, R);
              let be = a.webgpuCreateDownloader(M, Z, t);
              J.push([O, Y, { gpuBuffer: M, download: async () => {
                let rt = await be();
                return new (fe(O))(rt);
              }, dispose: () => {
                a._OrtReleaseTensor($) !== 0 && S("Can't release tensor.");
              } }, "gpu-buffer"]);
            }
          } else if (ye === "ml-tensor" && X > 0) {
            let P = a.webnnEnsureTensor, M = a.webnnIsGraphInputOutputTypeSupported;
            if (!P || !M) throw new Error('preferredLocation "ml-tensor" is not supported without using WebNN.');
            if (le(Ae, X) === void 0 || !je(O)) throw new Error(`Unsupported data type: ${O}`);
            if (!M(t, O, false)) throw new Error(`preferredLocation "ml-tensor" for ${O} output is not supported by current WebNN Context.`);
            let be = await P(t, R, Ae, Y, false);
            j = true, J.push([O, Y, { mlTensor: be, download: a.webnnCreateMLTensorDownloader(R, O), dispose: () => {
              a.webnnReleaseTensorId(R), a._OrtReleaseTensor($);
            } }, "ml-tensor"]);
          } else if (ye === "ml-tensor-cpu-output" && X > 0) {
            let P = a.webnnCreateMLTensorDownloader(R, O)(), M = J.length;
            j = true, At.push((async () => {
              let Z = [M, await P];
              return a.webnnReleaseTensorId(R), a._OrtReleaseTensor($), Z;
            })()), J.push([O, Y, [], "cpu"]);
          } else {
            let P = fe(O), M = new P(X);
            new Uint8Array(M.buffer, M.byteOffset, M.byteLength).set(a.HEAPU8.subarray(R, R + M.byteLength)), J.push([O, Y, M, "cpu"]);
          }
        } finally {
          a.stackRestore(et), O === "string" && R && a._free(R), j || a._OrtReleaseTensor($);
        }
      }
      c && !l && (a._OrtClearBoundOutputs(c.handle) !== 0 && S("Can't clear bound outputs."), de.set(t, [f, d, p, c, l, false]));
      for (let [g, $] of await Promise.all(At)) J[g][2] = $;
      return Q("wasm ProcessOutputTensor"), J;
    } finally {
      a.webnnOnRunEnd?.(f), a.stackRestore(k), r.forEach((D) => {
        D && D[3] === "gpu-buffer" && a.webgpuUnregisterBuffer(D[2].gpuBuffer);
      }), n.forEach((D) => {
        D && D[3] === "gpu-buffer" && a.webgpuUnregisterBuffer(D[2].gpuBuffer);
      }), A.forEach((D) => a._OrtReleaseTensor(D)), w.forEach((D) => a._OrtReleaseTensor(D)), L.forEach((D) => a._free(D)), y !== 0 && a._OrtReleaseRunOptions(y), m.forEach((D) => a._free(D));
    }
  }, Fe = (t) => {
    let e = I(), r = de.get(t);
    if (!r) throw new Error("invalid session id");
    let o = r[0], n = e._OrtEndProfiling(o);
    n === 0 && S("Can't get an profile file name."), e._OrtFree(n);
  }, We = (t) => {
    let e = [];
    for (let r of t) {
      let o = r[2];
      !Array.isArray(o) && "buffer" in o && e.push(o.buffer);
    }
    return e;
  };
});
var pe;
var z;
var Le;
var Xe;
var Ze;
var Ye;
var Et;
var St;
var me;
var he;
var Sn;
var Cr;
var Pr;
var _r;
var Rr;
var Nr;
var Fr;
var Wr;
var It = T(() => {
  "use strict";
  ee();
  pt();
  te();
  De();
  pe = () => !!v.wasm.proxy && typeof document < "u", Le = false, Xe = false, Ze = false, St = /* @__PURE__ */ new Map(), me = (t, e) => {
    let r = St.get(t);
    r ? r.push(e) : St.set(t, [e]);
  }, he = () => {
    if (Le || !Xe || Ze || !z) throw new Error("worker not ready");
  }, Sn = (t) => {
    switch (t.data.type) {
      case "init-wasm":
        Le = false, t.data.err ? (Ze = true, Et[1](t.data.err)) : (Xe = true, Et[0]()), Ye && (URL.revokeObjectURL(Ye), Ye = void 0);
        break;
      case "init-ep":
      case "copy-from":
      case "create":
      case "release":
      case "run":
      case "end-profiling": {
        let e = St.get(t.data.type);
        t.data.err ? e.shift()[1](t.data.err) : e.shift()[0](t.data.out);
        break;
      }
      default:
    }
  }, Cr = async () => {
    if (!Xe) {
      if (Le) throw new Error("multiple calls to 'initWasm()' detected.");
      if (Ze) throw new Error("previous call to 'initWasm()' failed.");
      if (Le = true, pe()) return new Promise((t, e) => {
        z?.terminate(), dr().then(([r, o]) => {
          try {
            z = o, z.onerror = (s) => e(s), z.onmessage = Sn, Et = [t, e];
            let n = { type: "init-wasm", in: v };
            if (!n.in.wasm.wasmPaths && r) {
              let s = ke();
              s && (n.in.wasm.wasmPaths = s);
            }
            z.postMessage(n), Ye = r;
          } catch (n) {
            e(n);
          }
        }, e);
      });
      try {
        await Ue(v.wasm), await Ce(v), Xe = true;
      } catch (t) {
        throw Ze = true, t;
      } finally {
        Le = false;
      }
    }
  }, Pr = async (t) => {
    if (pe()) return he(), new Promise((e, r) => {
      me("init-ep", [e, r]);
      let o = { type: "init-ep", in: { epName: t, env: v } };
      z.postMessage(o);
    });
    await Pe(v, t);
  }, _r = async (t) => pe() ? (he(), new Promise((e, r) => {
    me("copy-from", [e, r]);
    let o = { type: "copy-from", in: { buffer: t } };
    z.postMessage(o, [t.buffer]);
  })) : ge(t), Rr = async (t, e) => {
    if (pe()) {
      if (e?.preferredOutputLocation) throw new Error('session option "preferredOutputLocation" is not supported for proxy.');
      return he(), new Promise((r, o) => {
        me("create", [r, o]);
        let n = { type: "create", in: { model: t, options: { ...e } } }, s = [];
        t instanceof Uint8Array && s.push(t.buffer), z.postMessage(n, s);
      });
    } else return _e(t, e);
  }, Nr = async (t) => {
    if (pe()) return he(), new Promise((e, r) => {
      me("release", [e, r]);
      let o = { type: "release", in: t };
      z.postMessage(o);
    });
    Re(t);
  }, Fr = async (t, e, r, o, n, s) => {
    if (pe()) {
      if (r.some((a) => a[3] !== "cpu")) throw new Error("input tensor on GPU is not supported for proxy.");
      if (n.some((a) => a)) throw new Error("pre-allocated output tensor is not supported for proxy.");
      return he(), new Promise((a, i) => {
        me("run", [a, i]);
        let u = r, f = { type: "run", in: { sessionId: t, inputIndices: e, inputs: u, outputIndices: o, options: s } };
        z.postMessage(f, We(u));
      });
    } else return Ne(t, e, r, o, n, s);
  }, Wr = async (t) => {
    if (pe()) return he(), new Promise((e, r) => {
      me("end-profiling", [e, r]);
      let o = { type: "end-profiling", in: t };
      z.postMessage(o);
    });
    Fe(t);
  };
});
var kr;
var In;
var Ke;
var Gr = T(() => {
  "use strict";
  ee();
  It();
  ce();
  Oe();
  bt();
  kr = (t, e) => {
    switch (t.location) {
      case "cpu":
        return [t.type, t.dims, t.data, "cpu"];
      case "gpu-buffer":
        return [t.type, t.dims, { gpuBuffer: t.gpuBuffer }, "gpu-buffer"];
      case "ml-tensor":
        return [t.type, t.dims, { mlTensor: t.mlTensor }, "ml-tensor"];
      default:
        throw new Error(`invalid data location: ${t.location} for ${e()}`);
    }
  }, In = (t) => {
    switch (t[3]) {
      case "cpu":
        return new V(t[0], t[2], t[1]);
      case "gpu-buffer": {
        let e = t[0];
        if (!Ve(e)) throw new Error(`not supported data type: ${e} for deserializing GPU tensor`);
        let { gpuBuffer: r, download: o, dispose: n } = t[2];
        return V.fromGpuBuffer(r, { dataType: e, dims: t[1], download: o, dispose: n });
      }
      case "ml-tensor": {
        let e = t[0];
        if (!je(e)) throw new Error(`not supported data type: ${e} for deserializing MLTensor tensor`);
        let { mlTensor: r, download: o, dispose: n } = t[2];
        return V.fromMLTensor(r, { dataType: e, dims: t[1], download: o, dispose: n });
      }
      default:
        throw new Error(`invalid data location: ${t[3]}`);
    }
  }, Ke = class {
    async fetchModelAndCopyToWasmMemory(e) {
      return _r(await Ie(e));
    }
    async loadModel(e, r) {
      ae();
      let o;
      typeof e == "string" ? o = await this.fetchModelAndCopyToWasmMemory(e) : o = e, [this.sessionId, this.inputNames, this.outputNames, this.inputMetadata, this.outputMetadata] = await Rr(o, r), ie();
    }
    async dispose() {
      return Nr(this.sessionId);
    }
    async run(e, r, o) {
      ae();
      let n = [], s = [];
      Object.entries(e).forEach((c) => {
        let l = c[0], h = c[1], b = this.inputNames.indexOf(l);
        if (b === -1) throw new Error(`invalid input '${l}'`);
        n.push(h), s.push(b);
      });
      let a = [], i = [];
      Object.entries(r).forEach((c) => {
        let l = c[0], h = c[1], b = this.outputNames.indexOf(l);
        if (b === -1) throw new Error(`invalid output '${l}'`);
        a.push(h), i.push(b);
      });
      let u = n.map((c, l) => kr(c, () => `input "${this.inputNames[s[l]]}"`)), f = a.map((c, l) => c ? kr(c, () => `output "${this.outputNames[i[l]]}"`) : null), d = await Fr(this.sessionId, s, u, i, f, o), p = {};
      for (let c = 0; c < d.length; c++) p[this.outputNames[i[c]]] = a[c] ?? In(d[c]);
      return ie(), p;
    }
    startProfiling() {
    }
    endProfiling() {
      Wr(this.sessionId);
    }
  };
});
var zr = {};
ve(zr, { OnnxruntimeWebAssemblyBackend: () => Qe, initializeFlags: () => $r, wasmBackend: () => Ln });
var $r;
var Qe;
var Ln;
var Vr = T(() => {
  "use strict";
  ee();
  It();
  Gr();
  $r = () => {
    (typeof v.wasm.initTimeout != "number" || v.wasm.initTimeout < 0) && (v.wasm.initTimeout = 0);
    let t = v.wasm.simd;
    if (typeof t != "boolean" && t !== void 0 && t !== "fixed" && t !== "relaxed" && (console.warn(`Property "env.wasm.simd" is set to unknown value "${t}". Reset it to \`false\` and ignore SIMD feature checking.`), v.wasm.simd = false), typeof v.wasm.proxy != "boolean" && (v.wasm.proxy = false), typeof v.wasm.trace != "boolean" && (v.wasm.trace = false), typeof v.wasm.numThreads != "number" || !Number.isInteger(v.wasm.numThreads) || v.wasm.numThreads <= 0) if (typeof self < "u" && !self.crossOriginIsolated) v.wasm.numThreads = 1;
    else {
      let e = typeof navigator > "u" ? ot("node:os").cpus().length : navigator.hardwareConcurrency;
      v.wasm.numThreads = Math.min(4, Math.ceil((e || 1) / 2));
    }
  }, Qe = class {
    async init(e) {
      $r(), await Cr(), await Pr(e);
    }
    async createInferenceSessionHandler(e, r) {
      let o = new Ke();
      return await o.loadModel(e, r), o;
    }
  }, Ln = new Qe();
});
ee();
ee();
ee();
var rr = "1.31.0-dev.20260914-8d85527a0";
var Ls = dt;
{
  let t = (Vr(), st(zr)).wasmBackend;
  oe("webgpu", t, 5), oe("webnn", t, 5), oe("cpu", t, 10), oe("wasm", t, 10);
}
Object.defineProperty(v.versions, "web", { value: rr, enumerable: true });

// node_modules/@huggingface/transformers/src/backends/utils/cacheWasm.js
async function loadAndCacheFile(url) {
  const fileName = url.split("/").pop();
  let cache2;
  try {
    cache2 = await getCache();
    if (cache2) {
      const result = await cache2.match(url);
      if (result) {
        return result;
      }
    }
  } catch (error) {
    logger.warn(`Failed to load ${fileName} from cache:`, error);
  }
  const response = await env.fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${fileName}: ${response.status} ${response.statusText}`);
  }
  if (cache2) {
    try {
      await cache2.put(url, response.clone());
    } catch (e) {
      logger.warn(`Failed to cache ${fileName}:`, e);
    }
  }
  return response;
}
async function loadWasmBinary(wasmURL) {
  const response = await loadAndCacheFile(wasmURL);
  if (!response || typeof response === "string") return null;
  try {
    return await response.arrayBuffer();
  } catch (error) {
    logger.warn("Failed to read WASM binary:", error);
    return null;
  }
}
async function loadWasmFactory(libURL) {
  if (apis.IS_SERVICE_WORKER_ENV || apis.IS_CHROME_AVAILABLE) {
    return libURL;
  }
  const response = await loadAndCacheFile(libURL);
  if (!response || typeof response === "string") return null;
  try {
    let code = await response.text();
    code = code.replaceAll("globalThis.process?.versions?.node", "false");
    const blob = new Blob([code], { type: "text/javascript" });
    return URL.createObjectURL(blob);
  } catch (error) {
    logger.warn("Failed to read WASM factory:", error);
    return null;
  }
}

// node_modules/onnxruntime-common/dist/esm/version.js
var version = "1.30.0";

// node_modules/onnxruntime-common/dist/esm/env-impl.js
var logLevelValue = "warning";
var env2 = {
  wasm: {},
  webgl: {},
  webgpu: {},
  versions: { common: version },
  set logLevel(value) {
    if (value === void 0) {
      return;
    }
    if (typeof value !== "string" || ["verbose", "info", "warning", "error", "fatal"].indexOf(value) === -1) {
      throw new Error(`Unsupported logging level: ${value}`);
    }
    logLevelValue = value;
  },
  get logLevel() {
    return logLevelValue;
  }
};
Object.defineProperty(env2, "logLevel", { enumerable: true });

// node_modules/onnxruntime-common/dist/esm/tensor-conversion-impl.js
var tensorToDataURL = (tensor, options) => {
  const canvas = typeof document !== "undefined" ? document.createElement("canvas") : new OffscreenCanvas(1, 1);
  canvas.width = tensor.dims[3];
  canvas.height = tensor.dims[2];
  const pixels2DContext = canvas.getContext("2d");
  if (pixels2DContext != null) {
    let width;
    let height;
    if (options?.tensorLayout !== void 0 && options.tensorLayout === "NHWC") {
      width = tensor.dims[2];
      height = tensor.dims[3];
    } else {
      width = tensor.dims[3];
      height = tensor.dims[2];
    }
    const inputformat = options?.format !== void 0 ? options.format : "RGB";
    const norm = options?.norm;
    let normMean;
    let normBias;
    if (norm === void 0 || norm.mean === void 0) {
      normMean = [255, 255, 255, 255];
    } else {
      if (typeof norm.mean === "number") {
        normMean = [norm.mean, norm.mean, norm.mean, norm.mean];
      } else {
        normMean = [norm.mean[0], norm.mean[1], norm.mean[2], 0];
        if (norm.mean[3] !== void 0) {
          normMean[3] = norm.mean[3];
        }
      }
    }
    if (norm === void 0 || norm.bias === void 0) {
      normBias = [0, 0, 0, 0];
    } else {
      if (typeof norm.bias === "number") {
        normBias = [norm.bias, norm.bias, norm.bias, norm.bias];
      } else {
        normBias = [norm.bias[0], norm.bias[1], norm.bias[2], 0];
        if (norm.bias[3] !== void 0) {
          normBias[3] = norm.bias[3];
        }
      }
    }
    const stride = height * width;
    let rTensorPointer = 0, gTensorPointer = stride, bTensorPointer = stride * 2, aTensorPointer = -1;
    if (inputformat === "RGBA") {
      rTensorPointer = 0;
      gTensorPointer = stride;
      bTensorPointer = stride * 2;
      aTensorPointer = stride * 3;
    } else if (inputformat === "RGB") {
      rTensorPointer = 0;
      gTensorPointer = stride;
      bTensorPointer = stride * 2;
    } else if (inputformat === "RBG") {
      rTensorPointer = 0;
      bTensorPointer = stride;
      gTensorPointer = stride * 2;
    }
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const R = (tensor.data[rTensorPointer++] - normBias[0]) * normMean[0];
        const G2 = (tensor.data[gTensorPointer++] - normBias[1]) * normMean[1];
        const B = (tensor.data[bTensorPointer++] - normBias[2]) * normMean[2];
        const A = aTensorPointer === -1 ? 255 : (tensor.data[aTensorPointer++] - normBias[3]) * normMean[3];
        pixels2DContext.fillStyle = "rgba(" + R + "," + G2 + "," + B + "," + A + ")";
        pixels2DContext.fillRect(j, i, 1, 1);
      }
    }
    if ("toDataURL" in canvas) {
      return canvas.toDataURL();
    } else {
      throw new Error("toDataURL is not supported");
    }
  } else {
    throw new Error("Can not access image data");
  }
};
var tensorToImageData = (tensor, options) => {
  const pixels2DContext = typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : new OffscreenCanvas(1, 1).getContext("2d");
  let image;
  if (pixels2DContext != null) {
    let width;
    let height;
    let channels;
    if (options?.tensorLayout !== void 0 && options.tensorLayout === "NHWC") {
      width = tensor.dims[2];
      height = tensor.dims[1];
      channels = tensor.dims[3];
    } else {
      width = tensor.dims[3];
      height = tensor.dims[2];
      channels = tensor.dims[1];
    }
    const inputformat = options !== void 0 ? options.format !== void 0 ? options.format : "RGB" : "RGB";
    const norm = options?.norm;
    let normMean;
    let normBias;
    if (norm === void 0 || norm.mean === void 0) {
      normMean = [255, 255, 255, 255];
    } else {
      if (typeof norm.mean === "number") {
        normMean = [norm.mean, norm.mean, norm.mean, norm.mean];
      } else {
        normMean = [norm.mean[0], norm.mean[1], norm.mean[2], 255];
        if (norm.mean[3] !== void 0) {
          normMean[3] = norm.mean[3];
        }
      }
    }
    if (norm === void 0 || norm.bias === void 0) {
      normBias = [0, 0, 0, 0];
    } else {
      if (typeof norm.bias === "number") {
        normBias = [norm.bias, norm.bias, norm.bias, norm.bias];
      } else {
        normBias = [norm.bias[0], norm.bias[1], norm.bias[2], 0];
        if (norm.bias[3] !== void 0) {
          normBias[3] = norm.bias[3];
        }
      }
    }
    const stride = height * width;
    if (options !== void 0) {
      if (options.format !== void 0 && channels === 4 && options.format !== "RGBA" || channels === 3 && options.format !== "RGB" && options.format !== "BGR") {
        throw new Error("Tensor format doesn't match input tensor dims");
      }
    }
    const step = 4;
    let rImagePointer = 0, gImagePointer = 1, bImagePointer = 2, aImagePointer = 3;
    let rTensorPointer = 0, gTensorPointer = stride, bTensorPointer = stride * 2, aTensorPointer = -1;
    if (inputformat === "RGBA") {
      rTensorPointer = 0;
      gTensorPointer = stride;
      bTensorPointer = stride * 2;
      aTensorPointer = stride * 3;
    } else if (inputformat === "RGB") {
      rTensorPointer = 0;
      gTensorPointer = stride;
      bTensorPointer = stride * 2;
    } else if (inputformat === "RBG") {
      rTensorPointer = 0;
      bTensorPointer = stride;
      gTensorPointer = stride * 2;
    }
    image = pixels2DContext.createImageData(width, height);
    for (let i = 0; i < height * width; rImagePointer += step, gImagePointer += step, bImagePointer += step, aImagePointer += step, i++) {
      image.data[rImagePointer] = (tensor.data[rTensorPointer++] - normBias[0]) * normMean[0];
      image.data[gImagePointer] = (tensor.data[gTensorPointer++] - normBias[1]) * normMean[1];
      image.data[bImagePointer] = (tensor.data[bTensorPointer++] - normBias[2]) * normMean[2];
      image.data[aImagePointer] = aTensorPointer === -1 ? 255 : (tensor.data[aTensorPointer++] - normBias[3]) * normMean[3];
    }
  } else {
    throw new Error("Can not access image data");
  }
  return image;
};

// node_modules/onnxruntime-common/dist/esm/tensor-factory-impl.js
var bufferToTensor = (buffer, options) => {
  if (buffer === void 0) {
    throw new Error("Image buffer must be defined");
  }
  if (options.height === void 0 || options.width === void 0) {
    throw new Error("Image height and width must be defined");
  }
  if (options.tensorLayout === "NHWC") {
    throw new Error("NHWC Tensor layout is not supported yet");
  }
  const { height, width } = options;
  const norm = options.norm ?? { mean: 255, bias: 0 };
  let normMean;
  let normBias;
  if (typeof norm.mean === "number") {
    normMean = [norm.mean, norm.mean, norm.mean, norm.mean];
  } else {
    normMean = [norm.mean[0], norm.mean[1], norm.mean[2], norm.mean[3] ?? 255];
  }
  if (typeof norm.bias === "number") {
    normBias = [norm.bias, norm.bias, norm.bias, norm.bias];
  } else {
    normBias = [norm.bias[0], norm.bias[1], norm.bias[2], norm.bias[3] ?? 0];
  }
  const inputformat = options.format !== void 0 ? options.format : "RGBA";
  const outputformat = options.tensorFormat !== void 0 ? options.tensorFormat !== void 0 ? options.tensorFormat : "RGB" : "RGB";
  const stride = height * width;
  const float32Data = outputformat === "RGBA" ? new Float32Array(stride * 4) : new Float32Array(stride * 3);
  let step = 4, rImagePointer = 0, gImagePointer = 1, bImagePointer = 2, aImagePointer = 3;
  let rTensorPointer = 0, gTensorPointer = stride, bTensorPointer = stride * 2, aTensorPointer = -1;
  if (inputformat === "RGB") {
    step = 3;
    rImagePointer = 0;
    gImagePointer = 1;
    bImagePointer = 2;
    aImagePointer = -1;
  }
  if (outputformat === "RGBA") {
    aTensorPointer = stride * 3;
  } else if (outputformat === "RBG") {
    rTensorPointer = 0;
    bTensorPointer = stride;
    gTensorPointer = stride * 2;
  } else if (outputformat === "BGR") {
    bTensorPointer = 0;
    gTensorPointer = stride;
    rTensorPointer = stride * 2;
  }
  for (let i = 0; i < stride; i++, rImagePointer += step, bImagePointer += step, gImagePointer += step, aImagePointer += step) {
    float32Data[rTensorPointer++] = (buffer[rImagePointer] + normBias[0]) / normMean[0];
    float32Data[gTensorPointer++] = (buffer[gImagePointer] + normBias[1]) / normMean[1];
    float32Data[bTensorPointer++] = (buffer[bImagePointer] + normBias[2]) / normMean[2];
    if (aTensorPointer !== -1 && aImagePointer !== -1) {
      float32Data[aTensorPointer++] = (buffer[aImagePointer] + normBias[3]) / normMean[3];
    }
  }
  const outputTensor = outputformat === "RGBA" ? new Tensor("float32", float32Data, [1, 4, height, width]) : new Tensor("float32", float32Data, [1, 3, height, width]);
  return outputTensor;
};
var tensorFromImage = async (image, options) => {
  const isHTMLImageEle = typeof HTMLImageElement !== "undefined" && image instanceof HTMLImageElement;
  const isImageDataEle = typeof ImageData !== "undefined" && image instanceof ImageData;
  const isImageBitmap = typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap;
  const isString = typeof image === "string";
  let data;
  let bufferToTensorOptions = options ?? {};
  const createCanvas = () => {
    if (typeof document !== "undefined") {
      return document.createElement("canvas");
    } else if (typeof OffscreenCanvas !== "undefined") {
      return new OffscreenCanvas(1, 1);
    } else {
      throw new Error("Canvas is not supported");
    }
  };
  const createCanvasContext = (canvas) => {
    if (typeof HTMLCanvasElement !== "undefined" && canvas instanceof HTMLCanvasElement) {
      return canvas.getContext("2d");
    } else if (canvas instanceof OffscreenCanvas) {
      return canvas.getContext("2d");
    } else {
      return null;
    }
  };
  if (isHTMLImageEle) {
    const canvas = createCanvas();
    canvas.width = image.width;
    canvas.height = image.height;
    const pixels2DContext = createCanvasContext(canvas);
    if (pixels2DContext != null) {
      let height = image.height;
      let width = image.width;
      if (options !== void 0 && options.resizedHeight !== void 0 && options.resizedWidth !== void 0) {
        height = options.resizedHeight;
        width = options.resizedWidth;
      }
      if (options !== void 0) {
        bufferToTensorOptions = options;
        if (options.tensorFormat !== void 0) {
          throw new Error("Image input config format must be RGBA for HTMLImageElement");
        } else {
          bufferToTensorOptions.tensorFormat = "RGBA";
        }
        bufferToTensorOptions.height = height;
        bufferToTensorOptions.width = width;
      } else {
        bufferToTensorOptions.tensorFormat = "RGBA";
        bufferToTensorOptions.height = height;
        bufferToTensorOptions.width = width;
      }
      pixels2DContext.drawImage(image, 0, 0);
      data = pixels2DContext.getImageData(0, 0, width, height).data;
    } else {
      throw new Error("Can not access image data");
    }
  } else if (isImageDataEle) {
    let height;
    let width;
    if (options !== void 0 && options.resizedWidth !== void 0 && options.resizedHeight !== void 0) {
      height = options.resizedHeight;
      width = options.resizedWidth;
    } else {
      height = image.height;
      width = image.width;
    }
    if (options !== void 0) {
      bufferToTensorOptions = options;
    }
    bufferToTensorOptions.format = "RGBA";
    bufferToTensorOptions.height = height;
    bufferToTensorOptions.width = width;
    if (options !== void 0) {
      const tempCanvas = createCanvas();
      tempCanvas.width = width;
      tempCanvas.height = height;
      const pixels2DContext = createCanvasContext(tempCanvas);
      if (pixels2DContext != null) {
        pixels2DContext.putImageData(image, 0, 0);
        data = pixels2DContext.getImageData(0, 0, width, height).data;
      } else {
        throw new Error("Can not access image data");
      }
    } else {
      data = image.data;
    }
  } else if (isImageBitmap) {
    if (options === void 0) {
      throw new Error("Please provide image config with format for Imagebitmap");
    }
    const canvas = createCanvas();
    canvas.width = image.width;
    canvas.height = image.height;
    const pixels2DContext = createCanvasContext(canvas);
    if (pixels2DContext != null) {
      const height = image.height;
      const width = image.width;
      pixels2DContext.drawImage(image, 0, 0, width, height);
      data = pixels2DContext.getImageData(0, 0, width, height).data;
      bufferToTensorOptions.height = height;
      bufferToTensorOptions.width = width;
      return bufferToTensor(data, bufferToTensorOptions);
    } else {
      throw new Error("Can not access image data");
    }
  } else if (isString) {
    return new Promise((resolve, reject) => {
      const canvas = createCanvas();
      const context = createCanvasContext(canvas);
      if (!image || !context) {
        return reject();
      }
      const newImage = new Image();
      newImage.crossOrigin = "Anonymous";
      newImage.src = image;
      newImage.onload = () => {
        canvas.width = newImage.width;
        canvas.height = newImage.height;
        context.drawImage(newImage, 0, 0, canvas.width, canvas.height);
        const img = context.getImageData(0, 0, canvas.width, canvas.height);
        bufferToTensorOptions.height = canvas.height;
        bufferToTensorOptions.width = canvas.width;
        resolve(bufferToTensor(img.data, bufferToTensorOptions));
      };
    });
  } else {
    throw new Error("Input data provided is not supported - aborted tensor creation");
  }
  if (data !== void 0) {
    return bufferToTensor(data, bufferToTensorOptions);
  } else {
    throw new Error("Input data provided is not supported - aborted tensor creation");
  }
};
var tensorFromTexture = (texture, options) => {
  const { width, height, download, dispose } = options;
  const dims = [1, height, width, 4];
  return new Tensor({ location: "texture", type: "float32", texture, dims, download, dispose });
};
var tensorFromGpuBuffer = (gpuBuffer, options) => {
  const { dataType, dims, download, dispose } = options;
  return new Tensor({ location: "gpu-buffer", type: dataType ?? "float32", gpuBuffer, dims, download, dispose });
};
var tensorFromMLTensor = (mlTensor, options) => {
  const { dataType, dims, download, dispose } = options;
  return new Tensor({ location: "ml-tensor", type: dataType ?? "float32", mlTensor, dims, download, dispose });
};
var tensorFromPinnedBuffer = (type, buffer, dims) => new Tensor({ location: "cpu-pinned", type, data: buffer, dims: dims ?? [buffer.length] });

// node_modules/onnxruntime-common/dist/esm/tensor-impl-type-mapping.js
var NUMERIC_TENSOR_TYPE_TO_TYPEDARRAY_MAP = /* @__PURE__ */ new Map([
  ["float32", Float32Array],
  ["uint8", Uint8Array],
  ["int8", Int8Array],
  ["uint16", Uint16Array],
  ["int16", Int16Array],
  ["int32", Int32Array],
  ["bool", Uint8Array],
  ["float64", Float64Array],
  ["uint32", Uint32Array],
  ["int4", Uint8Array],
  ["uint4", Uint8Array]
]);
var NUMERIC_TENSOR_TYPEDARRAY_TO_TYPE_MAP = /* @__PURE__ */ new Map([
  [Float32Array, "float32"],
  [Uint8Array, "uint8"],
  [Int8Array, "int8"],
  [Uint16Array, "uint16"],
  [Int16Array, "int16"],
  [Int32Array, "int32"],
  [Float64Array, "float64"],
  [Uint32Array, "uint32"]
]);
var isTypedArrayChecked = false;
var checkTypedArray = () => {
  if (!isTypedArrayChecked) {
    isTypedArrayChecked = true;
    const isBigInt64ArrayAvailable = typeof BigInt64Array !== "undefined" && BigInt64Array.from;
    const isBigUint64ArrayAvailable = typeof BigUint64Array !== "undefined" && BigUint64Array.from;
    const Float16Array2 = globalThis.Float16Array;
    const isFloat16ArrayAvailable = typeof Float16Array2 !== "undefined" && Float16Array2.from;
    if (isBigInt64ArrayAvailable) {
      NUMERIC_TENSOR_TYPE_TO_TYPEDARRAY_MAP.set("int64", BigInt64Array);
      NUMERIC_TENSOR_TYPEDARRAY_TO_TYPE_MAP.set(BigInt64Array, "int64");
    }
    if (isBigUint64ArrayAvailable) {
      NUMERIC_TENSOR_TYPE_TO_TYPEDARRAY_MAP.set("uint64", BigUint64Array);
      NUMERIC_TENSOR_TYPEDARRAY_TO_TYPE_MAP.set(BigUint64Array, "uint64");
    }
    if (isFloat16ArrayAvailable) {
      NUMERIC_TENSOR_TYPE_TO_TYPEDARRAY_MAP.set("float16", Float16Array2);
      NUMERIC_TENSOR_TYPEDARRAY_TO_TYPE_MAP.set(Float16Array2, "float16");
    } else {
      NUMERIC_TENSOR_TYPE_TO_TYPEDARRAY_MAP.set("float16", Uint16Array);
    }
  }
};

// node_modules/onnxruntime-common/dist/esm/tensor-utils-impl.js
var calculateSize = (dims) => {
  let size = 1;
  for (let i = 0; i < dims.length; i++) {
    const dim = dims[i];
    if (typeof dim !== "number" || !Number.isSafeInteger(dim)) {
      throw new TypeError(`dims[${i}] must be an integer, got: ${dim}`);
    }
    if (dim < 0) {
      throw new RangeError(`dims[${i}] must be a non-negative integer, got: ${dim}`);
    }
    size *= dim;
  }
  return size;
};
var tensorReshape = (tensor, dims) => {
  switch (tensor.location) {
    case "cpu":
      return new Tensor(tensor.type, tensor.data, dims);
    case "cpu-pinned":
      return new Tensor({
        location: "cpu-pinned",
        data: tensor.data,
        type: tensor.type,
        dims
      });
    case "texture":
      return new Tensor({
        location: "texture",
        texture: tensor.texture,
        type: tensor.type,
        dims
      });
    case "gpu-buffer":
      return new Tensor({
        location: "gpu-buffer",
        gpuBuffer: tensor.gpuBuffer,
        type: tensor.type,
        dims
      });
    case "ml-tensor":
      return new Tensor({
        location: "ml-tensor",
        mlTensor: tensor.mlTensor,
        type: tensor.type,
        dims
      });
    default:
      throw new Error(`tensorReshape: tensor location ${tensor.location} is not supported`);
  }
};

// node_modules/onnxruntime-common/dist/esm/tensor-impl.js
var Tensor = class {
  /**
   * implementation.
   */
  constructor(arg0, arg1, arg2) {
    checkTypedArray();
    let type;
    let dims;
    if (typeof arg0 === "object" && "location" in arg0) {
      this.dataLocation = arg0.location;
      type = arg0.type;
      dims = arg0.dims;
      switch (arg0.location) {
        case "cpu-pinned": {
          const expectedTypedArrayConstructor = NUMERIC_TENSOR_TYPE_TO_TYPEDARRAY_MAP.get(type);
          if (!expectedTypedArrayConstructor) {
            throw new TypeError(`unsupported type "${type}" to create tensor from pinned buffer`);
          }
          if (!(arg0.data instanceof expectedTypedArrayConstructor)) {
            throw new TypeError(`buffer should be of type ${expectedTypedArrayConstructor.name}`);
          }
          this.cpuData = arg0.data;
          break;
        }
        case "texture": {
          if (type !== "float32") {
            throw new TypeError(`unsupported type "${type}" to create tensor from texture`);
          }
          this.gpuTextureData = arg0.texture;
          this.downloader = arg0.download;
          this.disposer = arg0.dispose;
          break;
        }
        case "gpu-buffer": {
          if (type !== "float32" && type !== "float16" && type !== "int32" && type !== "int64" && type !== "uint32" && type !== "uint8" && type !== "bool" && type !== "uint4" && type !== "int4") {
            throw new TypeError(`unsupported type "${type}" to create tensor from gpu buffer`);
          }
          this.gpuBufferData = arg0.gpuBuffer;
          this.downloader = arg0.download;
          this.disposer = arg0.dispose;
          break;
        }
        case "ml-tensor": {
          if (type !== "float32" && type !== "float16" && type !== "int32" && type !== "int64" && type !== "uint32" && type !== "uint64" && type !== "int8" && type !== "uint8" && type !== "bool" && type !== "uint4" && type !== "int4") {
            throw new TypeError(`unsupported type "${type}" to create tensor from MLTensor`);
          }
          this.mlTensorData = arg0.mlTensor;
          this.downloader = arg0.download;
          this.disposer = arg0.dispose;
          break;
        }
        default:
          throw new Error(`Tensor constructor: unsupported location '${this.dataLocation}'`);
      }
    } else {
      let data;
      let maybeDims;
      if (typeof arg0 === "string") {
        type = arg0;
        maybeDims = arg2;
        if (arg0 === "string") {
          if (!Array.isArray(arg1)) {
            throw new TypeError("A string tensor's data must be a string array.");
          }
          data = arg1;
        } else {
          const typedArrayConstructor = NUMERIC_TENSOR_TYPE_TO_TYPEDARRAY_MAP.get(arg0);
          if (typedArrayConstructor === void 0) {
            throw new TypeError(`Unsupported tensor type: ${arg0}.`);
          }
          if (Array.isArray(arg1)) {
            if (arg0 === "float16" && typedArrayConstructor === Uint16Array || arg0 === "uint4" || arg0 === "int4") {
              throw new TypeError(`Creating a ${arg0} tensor from number array is not supported. Please use ${typedArrayConstructor.name} as data.`);
            } else if (arg0 === "uint64" || arg0 === "int64") {
              data = typedArrayConstructor.from(arg1, BigInt);
            } else {
              data = typedArrayConstructor.from(arg1);
            }
          } else if (arg1 instanceof typedArrayConstructor) {
            data = arg1;
          } else if (arg1 instanceof Uint8ClampedArray) {
            if (arg0 === "uint8") {
              data = Uint8Array.from(arg1);
            } else {
              throw new TypeError(`A Uint8ClampedArray tensor's data must be type of uint8`);
            }
          } else if (arg0 === "float16" && arg1 instanceof Uint16Array && typedArrayConstructor !== Uint16Array) {
            data = new globalThis.Float16Array(arg1.buffer, arg1.byteOffset, arg1.length);
          } else {
            throw new TypeError(`A ${type} tensor's data must be type of ${typedArrayConstructor}`);
          }
        }
      } else {
        maybeDims = arg1;
        if (Array.isArray(arg0)) {
          if (arg0.length === 0) {
            throw new TypeError("Tensor type cannot be inferred from an empty array.");
          }
          const firstElementType = typeof arg0[0];
          if (firstElementType === "string") {
            type = "string";
            data = arg0;
          } else if (firstElementType === "boolean") {
            type = "bool";
            data = Uint8Array.from(arg0);
          } else {
            throw new TypeError(`Invalid element type of data array: ${firstElementType}.`);
          }
        } else if (arg0 instanceof Uint8ClampedArray) {
          type = "uint8";
          data = Uint8Array.from(arg0);
        } else {
          const mappedType = NUMERIC_TENSOR_TYPEDARRAY_TO_TYPE_MAP.get(arg0.constructor);
          if (mappedType === void 0) {
            throw new TypeError(`Unsupported type for tensor data: ${arg0.constructor}.`);
          }
          type = mappedType;
          data = arg0;
        }
      }
      if (maybeDims === void 0) {
        maybeDims = [data.length];
      } else if (!Array.isArray(maybeDims)) {
        throw new TypeError("A tensor's dims must be a number array");
      }
      dims = maybeDims;
      this.cpuData = data;
      this.dataLocation = "cpu";
    }
    const size = calculateSize(dims);
    if (this.cpuData && size !== this.cpuData.length) {
      if ((type === "uint4" || type === "int4") && Math.ceil(size / 2) === this.cpuData.length) {
      } else {
        throw new Error(`Tensor's size(${size}) does not match data length(${this.cpuData.length}).`);
      }
    }
    this.type = type;
    this.dims = dims;
    this.size = size;
  }
  // #endregion
  // #region factory
  static async fromImage(image, options) {
    return tensorFromImage(image, options);
  }
  static fromTexture(texture, options) {
    return tensorFromTexture(texture, options);
  }
  static fromGpuBuffer(gpuBuffer, options) {
    return tensorFromGpuBuffer(gpuBuffer, options);
  }
  static fromMLTensor(mlTensor, options) {
    return tensorFromMLTensor(mlTensor, options);
  }
  static fromPinnedBuffer(type, buffer, dims) {
    return tensorFromPinnedBuffer(type, buffer, dims);
  }
  // #endregion
  // #region conversions
  toDataURL(options) {
    return tensorToDataURL(this, options);
  }
  toImageData(options) {
    return tensorToImageData(this, options);
  }
  // #endregion
  // #region properties
  get data() {
    this.ensureValid();
    if (!this.cpuData) {
      throw new Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");
    }
    return this.cpuData;
  }
  get location() {
    return this.dataLocation;
  }
  get texture() {
    this.ensureValid();
    if (!this.gpuTextureData) {
      throw new Error("The data is not stored as a WebGL texture.");
    }
    return this.gpuTextureData;
  }
  get gpuBuffer() {
    this.ensureValid();
    if (!this.gpuBufferData) {
      throw new Error("The data is not stored as a WebGPU buffer.");
    }
    return this.gpuBufferData;
  }
  get mlTensor() {
    this.ensureValid();
    if (!this.mlTensorData) {
      throw new Error("The data is not stored as a WebNN MLTensor.");
    }
    return this.mlTensorData;
  }
  // #endregion
  // #region methods
  async getData(releaseData) {
    this.ensureValid();
    switch (this.dataLocation) {
      case "cpu":
      case "cpu-pinned":
        return this.data;
      case "texture":
      case "gpu-buffer":
      case "ml-tensor": {
        if (!this.downloader) {
          throw new Error("The current tensor is not created with a specified data downloader.");
        }
        if (this.isDownloading) {
          throw new Error("The current tensor is being downloaded.");
        }
        try {
          this.isDownloading = true;
          const data = await this.downloader();
          this.downloader = void 0;
          this.dataLocation = "cpu";
          this.cpuData = data;
          if (releaseData && this.disposer) {
            this.disposer();
            this.disposer = void 0;
          }
          return data;
        } finally {
          this.isDownloading = false;
        }
      }
      default:
        throw new Error(`cannot get data from location: ${this.dataLocation}`);
    }
  }
  dispose() {
    if (this.isDownloading) {
      throw new Error("The current tensor is being downloaded.");
    }
    if (this.disposer) {
      this.disposer();
      this.disposer = void 0;
    }
    this.cpuData = void 0;
    this.gpuTextureData = void 0;
    this.gpuBufferData = void 0;
    this.mlTensorData = void 0;
    this.downloader = void 0;
    this.isDownloading = void 0;
    this.dataLocation = "none";
  }
  // #endregion
  // #region tensor utilities
  ensureValid() {
    if (this.dataLocation === "none") {
      throw new Error("The tensor is disposed.");
    }
  }
  reshape(dims) {
    this.ensureValid();
    if (this.downloader || this.disposer) {
      throw new Error("Cannot reshape a tensor that owns GPU resource.");
    }
    return tensorReshape(this, dims);
  }
};

// node_modules/onnxruntime-common/dist/esm/tensor.js
var Tensor2 = Tensor;

// node_modules/@huggingface/transformers/src/backends/onnx.js
var DEVICE_TO_EXECUTION_PROVIDER_MAPPING = Object.freeze({
  auto: null,
  // Auto-detect based on device and environment
  gpu: null,
  // Auto-detect GPU
  cpu: "cpu",
  // CPU
  wasm: "wasm",
  // WebAssembly
  webgpu: "webgpu",
  // WebGPU
  cuda: "cuda",
  // CUDA
  dml: "dml",
  // DirectML
  coreml: "coreml",
  // CoreML
  webnn: { name: "webnn", deviceType: "cpu" },
  // WebNN (default)
  "webnn-npu": { name: "webnn", deviceType: "npu" },
  // WebNN NPU
  "webnn-gpu": { name: "webnn", deviceType: "gpu" },
  // WebNN GPU
  "webnn-cpu": { name: "webnn", deviceType: "cpu" }
  // WebNN CPU
});
function getOnnxLogSeverityLevel(logLevel2) {
  if (logLevel2 <= LogLevel.DEBUG) {
    return 0;
  } else if (logLevel2 <= LogLevel.INFO) {
    return 2;
  } else if (logLevel2 <= LogLevel.WARNING) {
    return 3;
  } else if (logLevel2 <= LogLevel.ERROR) {
    return 3;
  } else {
    return 4;
  }
}
var ONNX_LOG_LEVEL_NAMES = {
  0: "verbose",
  1: "info",
  2: "warning",
  3: "error",
  4: "fatal"
};
var supportedDevices = [];
var defaultDevices;
var ONNX;
var ORT_SYMBOL = /* @__PURE__ */ Symbol.for("onnxruntime");
if (ORT_SYMBOL in globalThis) {
  ONNX = globalThis[ORT_SYMBOL];
} else if (apis.IS_NODE_ENV) {
  ONNX = onnx_node_default;
  switch (process.platform) {
    case "win32":
      supportedDevices.push("dml");
      break;
    case "linux":
      if (process.arch === "x64") {
        supportedDevices.push("cuda");
      }
      break;
    case "darwin":
      supportedDevices.push("coreml");
      break;
  }
  supportedDevices.push("webgpu");
  supportedDevices.push("cpu");
  defaultDevices = ["cpu"];
} else {
  ONNX = ort_webgpu_min_exports;
  if (apis.IS_WEBNN_AVAILABLE) {
    supportedDevices.push("webnn-npu", "webnn-gpu", "webnn-cpu", "webnn");
  }
  if (apis.IS_WEBGPU_AVAILABLE) {
    supportedDevices.push("webgpu");
  }
  supportedDevices.push("wasm");
  defaultDevices = ["wasm"];
}
function getSupportedDevices() {
  return [...supportedDevices];
}
var InferenceSession2 = ONNX.InferenceSession;
function deviceToExecutionProviders(device = null) {
  if (!device) return defaultDevices;
  switch (device) {
    case "auto":
      return supportedDevices;
    case "gpu":
      return supportedDevices.filter((x) => ["webgpu", "cuda", "dml", "webnn-gpu"].includes(x));
  }
  if (supportedDevices.includes(device)) {
    return [DEVICE_TO_EXECUTION_PROVIDER_MAPPING[device] ?? device];
  }
  throw new Error(`Unsupported device: "${device}". Should be one of: ${supportedDevices.join(", ")}.`);
}
var webInitChain = Promise.resolve();
var wasmLoadPromise = null;
async function ensureWasmLoaded() {
  if (wasmLoadPromise) {
    return wasmLoadPromise;
  }
  const shouldUseWasmCache = env.useWasmCache && typeof ONNX_ENV?.wasm?.wasmPaths === "object" && ONNX_ENV?.wasm?.wasmPaths?.wasm && ONNX_ENV?.wasm?.wasmPaths?.mjs;
  if (!shouldUseWasmCache) {
    if (apis.IS_DENO_WEB_RUNTIME) {
      throw new Error(
        "env.useWasmCache=false is not supported in Deno's web runtime. Remove the useWasmCache override."
      );
    }
    wasmLoadPromise = Promise.resolve();
    return wasmLoadPromise;
  }
  wasmLoadPromise = (async () => {
    const urls = (
      /** @type {{ wasm: string, mjs: string }} */
      ONNX_ENV.wasm.wasmPaths
    );
    let wasmBinaryLoaded = false;
    await Promise.all([
      // Load and cache the WASM binary
      urls.wasm && !isBlobURL(urls.wasm) ? (async () => {
        try {
          const wasmBinary = await loadWasmBinary(toAbsoluteURL(urls.wasm));
          if (wasmBinary) {
            ONNX_ENV.wasm.wasmBinary = wasmBinary;
            wasmBinaryLoaded = true;
          }
        } catch (err) {
          logger.warn("Failed to pre-load WASM binary:", err);
        }
      })() : Promise.resolve(),
      // Load and cache the WASM factory as a blob URL
      urls.mjs && !isBlobURL(urls.mjs) ? (async () => {
        try {
          const wasmFactoryBlob = await loadWasmFactory(toAbsoluteURL(urls.mjs));
          if (wasmFactoryBlob) {
            ONNX_ENV.wasm.wasmPaths.mjs = wasmFactoryBlob;
          }
        } catch (err) {
          logger.warn("Failed to pre-load WASM factory:", err);
        }
      })() : Promise.resolve()
    ]);
    if (!wasmBinaryLoaded) {
      ONNX_ENV.wasm.wasmPaths.mjs = urls.mjs;
    }
  })();
  return wasmLoadPromise;
}
async function createInferenceSession(buffer_or_path, session_options, session_config) {
  await ensureWasmLoaded();
  const logSeverityLevel = getOnnxLogSeverityLevel(env.logLevel ?? LogLevel.WARNING);
  const load = () => InferenceSession2.create(buffer_or_path, {
    // Set default log severity level, but allow overriding through session options
    logSeverityLevel,
    ...session_options
  });
  const session = await (apis.IS_WEB_ENV ? webInitChain = webInitChain.then(load) : load());
  session.config = session_config;
  return session;
}
var webInferenceChain = Promise.resolve();
async function runInferenceSession(session, ortFeed) {
  const run = () => session.run(ortFeed);
  return apis.IS_WEB_ENV ? webInferenceChain = webInferenceChain.then(run) : run();
}
function isONNXTensor(x) {
  return x instanceof ONNX.Tensor;
}
var ONNX_ENV = ONNX?.env;
function isONNXProxy() {
  return ONNX_ENV?.wasm?.proxy;
}
if (ONNX_ENV) {
  let setLogLevel = function(logLevel2) {
    const severityLevel = getOnnxLogSeverityLevel(logLevel2);
    ONNX_ENV.logLevel = ONNX_LOG_LEVEL_NAMES[severityLevel];
  };
  if (ONNX_ENV.wasm) {
    if (
      // @ts-ignore Cannot find name 'ServiceWorkerGlobalScope'.ts(2304)
      !(typeof ServiceWorkerGlobalScope !== "undefined" && self instanceof ServiceWorkerGlobalScope) && ONNX_ENV.versions?.web && !ONNX_ENV.wasm.wasmPaths
    ) {
      const wasmPathPrefix = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ONNX_ENV.versions.web}/dist/`;
      let wasmPathSuffix = ".asyncify";
      if (apis.IS_SAFARI_BELOW_26 && !apis.IS_WEBGPU_AVAILABLE) {
        wasmPathSuffix = "";
      }
      ONNX_ENV.wasm.wasmPaths = {
        mjs: `${wasmPathPrefix}ort-wasm-simd-threaded${wasmPathSuffix}.mjs`,
        wasm: `${wasmPathPrefix}ort-wasm-simd-threaded${wasmPathSuffix}.wasm`
      };
    }
    ONNX_ENV.wasm.proxy = false;
  }
  if (ONNX_ENV.webgpu) {
    ONNX_ENV.webgpu.powerPreference = "high-performance";
  }
  setLogLevel(env.logLevel ?? LogLevel.WARNING);
  env.backends.onnx = {
    ...ONNX_ENV,
    setLogLevel,
    getSupportedDevices
  };
}

// node_modules/@huggingface/transformers/src/utils/devices.js
var DEVICE_TYPES = Object.freeze({
  auto: "auto",
  // Auto-detect based on device and environment
  gpu: "gpu",
  // Auto-detect GPU
  cpu: "cpu",
  // CPU
  wasm: "wasm",
  // WebAssembly
  webgpu: "webgpu",
  // WebGPU
  cuda: "cuda",
  // CUDA
  dml: "dml",
  // DirectML
  coreml: "coreml",
  // CoreML
  webnn: "webnn",
  // WebNN (default)
  "webnn-npu": "webnn-npu",
  // WebNN NPU
  "webnn-gpu": "webnn-gpu",
  // WebNN GPU
  "webnn-cpu": "webnn-cpu"
  // WebNN CPU
});
var DEFAULT_DEVICE = apis.IS_NODE_ENV ? "cpu" : "wasm";
function selectDevice(deviceConfig, fileName, { warn } = {}) {
  if (!deviceConfig) return DEFAULT_DEVICE;
  if (typeof deviceConfig === "string") return deviceConfig;
  if (deviceConfig.hasOwnProperty(fileName)) return deviceConfig[fileName];
  if (warn) {
    warn(`device not specified for "${fileName}". Using the default device (${DEFAULT_DEVICE}).`);
  }
  return DEFAULT_DEVICE;
}

// node_modules/@huggingface/transformers/src/utils/dtypes.js
var isWebGpuFp16Supported = /* @__PURE__ */ (function() {
  let cachedResult;
  return async function() {
    if (cachedResult === void 0) {
      if (!apis.IS_WEBGPU_AVAILABLE) {
        cachedResult = false;
      } else {
        try {
          const adapter = await navigator.gpu.requestAdapter();
          cachedResult = adapter.features.has("shader-f16");
        } catch (e) {
          cachedResult = false;
        }
      }
    }
    return cachedResult;
  };
})();
var DATA_TYPES = Object.freeze({
  auto: "auto",
  // Auto-detect based on environment
  fp32: "fp32",
  fp16: "fp16",
  q8: "q8",
  int8: "int8",
  uint8: "uint8",
  q4: "q4",
  bnb4: "bnb4",
  q4f16: "q4f16",
  // fp16 model with 4-bit block weight quantization
  q2: "q2",
  q2f16: "q2f16",
  // fp16 model with 2-bit block weight quantization
  q1: "q1",
  q1f16: "q1f16"
  // fp16 model with 1-bit block weight quantization
});
var DEFAULT_DEVICE_DTYPE = DATA_TYPES.fp32;
var DEFAULT_DEVICE_DTYPE_MAPPING = Object.freeze({
  // NOTE: If not specified, will default to fp32
  [DEVICE_TYPES.wasm]: DATA_TYPES.q8
});
var DEFAULT_DTYPE_SUFFIX_MAPPING = Object.freeze({
  [DATA_TYPES.fp32]: "",
  [DATA_TYPES.fp16]: "_fp16",
  [DATA_TYPES.int8]: "_int8",
  [DATA_TYPES.uint8]: "_uint8",
  [DATA_TYPES.q8]: "_quantized",
  [DATA_TYPES.q4]: "_q4",
  [DATA_TYPES.q2]: "_q2",
  [DATA_TYPES.q1]: "_q1",
  [DATA_TYPES.q4f16]: "_q4f16",
  [DATA_TYPES.q2f16]: "_q2f16",
  [DATA_TYPES.q1f16]: "_q1f16",
  [DATA_TYPES.bnb4]: "_bnb4"
});
function selectDtype(dtype, fileName, selectedDevice, { configDtype = null, warn } = {}) {
  let resolved;
  let needsWarn = false;
  if (dtype && typeof dtype !== "string") {
    if (dtype.hasOwnProperty(fileName)) {
      resolved = dtype[fileName];
    } else {
      resolved = null;
      needsWarn = true;
    }
  } else {
    resolved = /** @type {string|null|undefined} */
    dtype;
  }
  let result;
  if (resolved === DATA_TYPES.auto) {
    if (configDtype) {
      const fallback = typeof configDtype === "string" ? configDtype : configDtype?.[fileName];
      if (fallback && fallback !== DATA_TYPES.auto && DATA_TYPES.hasOwnProperty(fallback)) {
        return (
          /** @type {DataType} */
          fallback
        );
      }
    }
    result = DEFAULT_DEVICE_DTYPE_MAPPING[selectedDevice] ?? DEFAULT_DEVICE_DTYPE;
  } else if (resolved && DATA_TYPES.hasOwnProperty(resolved)) {
    result = /** @type {DataType} */
    resolved;
  } else {
    result = DEFAULT_DEVICE_DTYPE_MAPPING[selectedDevice] ?? DEFAULT_DEVICE_DTYPE;
  }
  if (needsWarn && warn) {
    warn(
      `dtype not specified for "${fileName}". Using the default dtype (${result}) for this device (${selectedDevice}).`
    );
  }
  return result;
}
var DataTypeMap = Object.freeze({
  float32: Float32Array,
  // @ts-ignore ts(2552) Limited availability of Float16Array across browsers:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float16Array
  float16: typeof Float16Array !== "undefined" ? Float16Array : Uint16Array,
  float64: Float64Array,
  string: Array,
  // string[]
  int8: Int8Array,
  uint8: Uint8Array,
  int16: Int16Array,
  uint16: Uint16Array,
  int32: Int32Array,
  uint32: Uint32Array,
  int64: BigInt64Array,
  uint64: BigUint64Array,
  bool: Uint8Array,
  uint4: Uint8Array,
  int4: Int8Array
});

// node_modules/@huggingface/transformers/src/utils/model-loader.js
function resolveExternalDataFormat(config, fullName, fileName) {
  if (!config) return 0;
  if (typeof config === "object" && config !== null) {
    if (config.hasOwnProperty(fullName)) return +config[fullName];
    if (config.hasOwnProperty(fileName)) return +config[fileName];
    return 0;
  }
  return +config;
}
function getExternalDataChunkNames(fullName, numChunks) {
  const names = [];
  for (let i = 0; i < numChunks; ++i) {
    names.push(`${fullName}_data${i === 0 ? "" : "_" + i}`);
  }
  return names;
}
async function getCoreModelFile(pretrained_model_name_or_path, fileName, options, suffix) {
  const baseName = `${fileName}${suffix}.onnx`;
  const fullPath = `${options.subfolder ?? ""}/${baseName}`;
  return await getModelFile(pretrained_model_name_or_path, fullPath, true, options, apis.IS_NODE_ENV);
}
async function getModelDataFiles(pretrained_model_name_or_path, fileName, suffix, options, use_external_data_format, session_options = {}) {
  const baseName = `${fileName}${suffix}.onnx`;
  const return_path = apis.IS_NODE_ENV;
  let externalDataPromises = [];
  const num_chunks = resolveExternalDataFormat(use_external_data_format, baseName, fileName);
  if (num_chunks > 0) {
    if (num_chunks > MAX_EXTERNAL_DATA_CHUNKS) {
      throw new Error(
        `The number of external data chunks (${num_chunks}) exceeds the maximum allowed value (${MAX_EXTERNAL_DATA_CHUNKS}).`
      );
    }
    const chunkNames = getExternalDataChunkNames(baseName, num_chunks);
    for (const path of chunkNames) {
      const fullPath = `${options.subfolder ?? ""}/${path}`;
      externalDataPromises.push(
        getModelFile(pretrained_model_name_or_path, fullPath, true, options, return_path).then(
          (data) => data instanceof Uint8Array ? { path, data } : path
        )
      );
    }
  } else if (session_options.externalData !== void 0) {
    externalDataPromises = session_options.externalData.map(async (ext) => {
      if (typeof ext.data === "string") {
        const ext_buffer = await getModelFile(pretrained_model_name_or_path, ext.data, true, options);
        return { ...ext, data: ext_buffer };
      }
      return ext;
    });
  }
  return Promise.all(externalDataPromises);
}

// node_modules/@huggingface/transformers/src/utils/maths.js
function permute_data(array, dims, axes) {
  const shape = new Array(axes.length);
  const stride = new Array(axes.length);
  for (let i = axes.length - 1, s = 1; i >= 0; --i) {
    stride[i] = s;
    shape[i] = dims[axes[i]];
    s *= shape[i];
  }
  const invStride = axes.map((_2, i) => stride[axes.indexOf(i)]);
  const permutedData = new array.constructor(array.length);
  for (let i = 0; i < array.length; ++i) {
    let newIndex = 0;
    for (let j = dims.length - 1, k = i; j >= 0; --j) {
      newIndex += k % dims[j] * invStride[j];
      k = Math.floor(k / dims[j]);
    }
    permutedData[newIndex] = array[i];
  }
  return [permutedData, shape];
}
function softmax(arr) {
  const maxVal = max(arr)[0];
  const exps = arr.map((x) => Math.exp(x - maxVal));
  const sumExps = exps.reduce((acc, val) => acc + val, 0);
  const softmaxArr = exps.map((x) => x / sumExps);
  return (
    /** @type {T} */
    softmaxArr
  );
}
function min(arr) {
  if (arr.length === 0) throw Error("Array must not be empty");
  let min3 = arr[0];
  let indexOfMin = 0;
  for (let i = 1; i < arr.length; ++i) {
    if (arr[i] < min3) {
      min3 = arr[i];
      indexOfMin = i;
    }
  }
  return (
    /** @type {T extends bigint[]|BigTypedArray ? [bigint, number] : [number, number]} */
    [min3, indexOfMin]
  );
}
function max(arr) {
  if (arr.length === 0) throw Error("Array must not be empty");
  let max2 = arr[0];
  let indexOfMax = 0;
  for (let i = 1; i < arr.length; ++i) {
    if (arr[i] > max2) {
      max2 = arr[i];
      indexOfMax = i;
    }
  }
  return (
    /** @type {T extends bigint[]|BigTypedArray ? [bigint, number] : [number, number]} */
    [max2, indexOfMax]
  );
}
function bankers_round(x) {
  const r = Math.round(x);
  const br2 = Math.abs(x) % 1 === 0.5 ? r % 2 === 0 ? r : r - 1 : r;
  return br2;
}
var uint16_to_float32 = /* @__PURE__ */ (function() {
  let float16LUT = null;
  return function(u16Array) {
    if (!float16LUT) {
      float16LUT = new Float32Array(65536);
      const buffer = new ArrayBuffer(4);
      const u32 = new Uint32Array(buffer);
      const f32 = new Float32Array(buffer);
      for (let i = 0; i < float16LUT.length; ++i) {
        let outBits = 0;
        const sign = (i & 32768) << 16;
        const exp = (i & 31744) >> 10;
        let mantissa = i & 1023;
        if (exp === 31) {
          outBits = sign | 2139095040 | mantissa << 13;
        } else if (exp === 0) {
          if (mantissa === 0) {
            outBits = sign;
          } else {
            let renormExp = 113;
            while ((mantissa & 1024) === 0) {
              mantissa <<= 1;
              --renormExp;
            }
            mantissa &= ~1024;
            outBits = sign | renormExp << 23 | mantissa << 13;
          }
        } else {
          outBits = sign | exp + 112 << 23 | mantissa << 13;
        }
        u32[0] = outBits;
        float16LUT[i] = f32[0];
      }
    }
    const length = u16Array.length;
    const lut = float16LUT;
    const out = new Float32Array(length);
    for (let i = 0; i < length; ++i) {
      out[i] = lut[u16Array[i]];
    }
    return out;
  };
})();

// node_modules/@huggingface/transformers/src/utils/tensor.js
var Tensor3 = class _Tensor {
  /**
   * Dimensions of the tensor.
   * @type {number[]}
   */
  get dims() {
    return this.ort_tensor.dims;
  }
  set dims(value) {
    this.ort_tensor.dims = value;
  }
  /**
   * Type of the tensor.
   * @type {DataType}
   */
  get type() {
    return this.ort_tensor.type;
  }
  /**
   * The data stored in the tensor.
   * @type {DataArray}
   */
  get data() {
    return this.ort_tensor.data;
  }
  /**
   * The number of elements in the tensor.
   * @type {number}
   */
  get size() {
    return this.ort_tensor.size;
  }
  /**
   * The location of the tensor data.
   * @type {string}
   */
  get location() {
    return this.ort_tensor.location;
  }
  ort_tensor;
  /**
   * Create a new Tensor, either from raw data or by wrapping an `onnxruntime` tensor:
   * - `new Tensor(dataType, data, dims)`, e.g. `new Tensor('float32', new Float32Array([1, 2, 3]), [3])`.
   * - `new Tensor(ortTensor)`.
   *
   * @param {[DataType, DataArray, number[]]|[ONNXTensor]} args
   */
  constructor(...args) {
    if (isONNXTensor(args[0])) {
      this.ort_tensor = /** @type {ONNXTensor} */
      args[0];
    } else {
      this.ort_tensor = new Tensor2(
        /** @type {DataType} */
        args[0],
        // @ts-expect-error ts(2769) Type 'number' is not assignable to type 'bigint'.
        /** @type {Exclude<import('./maths.js').AnyTypedArray, Uint8ClampedArray>} */
        args[1],
        args[2]
      );
    }
    return new Proxy(this, {
      get: (obj, key) => {
        if (typeof key === "string") {
          let index = Number(key);
          if (Number.isInteger(index)) {
            return obj._getitem(index);
          }
        }
        return obj[key];
      },
      set: (obj, key, value) => {
        return obj[key] = value;
      }
    });
  }
  /**
   * Releases the underlying ONNX Runtime tensor (e.g., GPU buffers). Do not use the tensor afterwards.
   */
  dispose() {
    this.ort_tensor.dispose();
  }
  /**
   * Returns an iterator object for iterating over the tensor data in row-major order.
   * If the tensor has more than one dimension, the iterator will yield subarrays.
   * @returns {Iterator<any>} An iterator object for iterating over the tensor data in row-major order.
   */
  *[Symbol.iterator]() {
    const [iterLength, ...iterDims] = this.dims;
    if (iterDims.length > 0) {
      const iterSize = iterDims.reduce((a, b) => a * b);
      for (let i = 0; i < iterLength; ++i) {
        yield this._subarray(i, iterSize, iterDims);
      }
    } else {
      yield* this.data;
    }
  }
  /**
   * Index into a Tensor object.
   * @param {number} index The index to access.
   * @returns {Tensor} The data at the specified index.
   * @private
   */
  _getitem(index) {
    const [iterLength, ...iterDims] = this.dims;
    index = safeIndex(index, iterLength);
    if (iterDims.length > 0) {
      const iterSize = iterDims.reduce((a, b) => a * b);
      return this._subarray(index, iterSize, iterDims);
    } else {
      return new _Tensor(this.type, [this.data[index]], iterDims);
    }
  }
  /**
   * @param {number} index
   * @param {number} iterSize
   * @param {any} iterDims
   * @returns {Tensor}
   */
  _subarray(index, iterSize, iterDims) {
    const o1 = index * iterSize;
    const o2 = (index + 1) * iterSize;
    const data = "subarray" in this.data ? this.data.subarray(o1, o2) : this.data.slice(o1, o2);
    return new _Tensor(this.type, data, iterDims);
  }
  /**
   * Returns the value of this tensor as a standard JavaScript Number. This only works
   * for tensors with one element. For other cases, see `Tensor.tolist()`.
   * @returns {number|bigint} The value of this tensor as a standard JavaScript Number.
   * @throws {Error} If the tensor has more than one element.
   */
  item() {
    const this_data = this.data;
    if (this_data.length !== 1) {
      throw new Error(`a Tensor with ${this_data.length} elements cannot be converted to Scalar`);
    }
    return this_data[0];
  }
  /**
   * Convert tensor data to a n-dimensional JS list
   * @returns {any[]}
   */
  tolist() {
    return reshape(this.data, this.dims);
  }
  /**
   * Return a new Tensor with the sigmoid function applied to each element.
   * @returns {Tensor} The tensor with the sigmoid function applied.
   */
  sigmoid() {
    return this.clone().sigmoid_();
  }
  /**
   * Applies the sigmoid function to the tensor in place.
   * @returns {Tensor} Returns `this`.
   */
  sigmoid_() {
    const this_data = this.data;
    for (let i = 0; i < this_data.length; ++i) {
      this_data[i] = 1 / (1 + Math.exp(-this_data[i]));
    }
    return this;
  }
  /**
   * Return a new Tensor with a callback function applied to each element.
   * @param {Function} callback - The function to apply to each element. It should take three arguments:
   *                              the current element, its index, and the tensor's data array.
   * @returns {Tensor} A new Tensor with the callback function applied to each element.
   */
  map(callback) {
    return this.clone().map_(callback);
  }
  /**
   * Apply a callback function to each element of the tensor in place.
   * @param {Function} callback - The function to apply to each element. It should take three arguments:
   *                              the current element, its index, and the tensor's data array.
   * @returns {Tensor} Returns `this`.
   */
  map_(callback) {
    const this_data = this.data;
    for (let i = 0; i < this_data.length; ++i) {
      this_data[i] = callback(this_data[i], i, this_data);
    }
    return this;
  }
  /**
   * Return a new Tensor with every element multiplied by a constant.
   * @param {number} val The value to multiply by.
   * @returns {Tensor} The new tensor.
   */
  mul(val) {
    return this.clone().mul_(val);
  }
  /**
   * Multiply the tensor by a constant in place.
   * @param {number} val The value to multiply by.
   * @returns {Tensor} Returns `this`.
   */
  mul_(val) {
    const this_data = this.data;
    for (let i = 0; i < this_data.length; ++i) {
      this_data[i] *= val;
    }
    return this;
  }
  /**
   * Return a new Tensor with every element divided by a constant.
   * @param {number} val The value to divide by.
   * @returns {Tensor} The new tensor.
   */
  div(val) {
    return this.clone().div_(val);
  }
  /**
   * Divide the tensor by a constant in place.
   * @param {number} val The value to divide by.
   * @returns {Tensor} Returns `this`.
   */
  div_(val) {
    const this_data = this.data;
    for (let i = 0; i < this_data.length; ++i) {
      this_data[i] /= val;
    }
    return this;
  }
  /**
   * Return a new Tensor with every element added by a constant.
   * @param {number} val The value to add by.
   * @returns {Tensor} The new tensor.
   */
  add(val) {
    return this.clone().add_(val);
  }
  /**
   * Add the tensor by a constant in place.
   * @param {number} val The value to add by.
   * @returns {Tensor} Returns `this`.
   */
  add_(val) {
    const this_data = this.data;
    for (let i = 0; i < this_data.length; ++i) {
      this_data[i] += val;
    }
    return this;
  }
  /**
   * Return a new Tensor with every element subtracted by a constant.
   * @param {number} val The value to subtract by.
   * @returns {Tensor} The new tensor.
   */
  sub(val) {
    return this.clone().sub_(val);
  }
  /**
   * Subtract the tensor by a constant in place.
   * @param {number} val The value to subtract by.
   * @returns {Tensor} Returns `this`.
   */
  sub_(val) {
    const this_data = this.data;
    for (let i = 0; i < this_data.length; ++i) {
      this_data[i] -= val;
    }
    return this;
  }
  /**
   * Return a new Tensor with the element-wise remainder of division by a constant.
   * Uses Python-style modulo signs (e.g. `-1 mod 2 = 1`) while preserving the tensor's dtype.
   * Negative divisors are unsupported for unsigned and boolean tensors.
   * This operation does not implement PyTorch's dtype promotion or scalar casting rules.
   * @param {number|bigint} val The divisor.
   * @returns {Tensor} The new tensor.
   */
  remainder(val) {
    return this.clone().remainder_(val);
  }
  /**
   * In-place version of @see {@link Tensor.remainder}
   * @param {number|bigint} val The divisor.
   * @returns {Tensor} Returns `this`.
   */
  remainder_(val) {
    const this_data = this.data;
    const is_bigint = this_data instanceof BigInt64Array || this_data instanceof BigUint64Array;
    const divisor = (
      /** @type {any} */
      is_bigint ? BigInt(val) : Number(val)
    );
    if ((divisor === 0 || divisor === 0n) && (this.type.includes("int") || this.type === "bool")) {
      throw new RangeError("Division by zero");
    }
    if (divisor < 0 && (this.type.startsWith("uint") || this.type === "bool")) {
      throw new RangeError("Negative divisors are not supported for unsigned or boolean tensors");
    }
    for (let i = 0; i < this_data.length; ++i) {
      const remainder = this_data[i] % divisor;
      const needs_shift = remainder < 0 && divisor > 0 || remainder > 0 && divisor < 0;
      this_data[i] = needs_shift ? remainder + divisor : remainder;
    }
    return this;
  }
  /**
   * Creates a deep copy of the current Tensor.
   * @returns {Tensor} A new Tensor with the same type, data, and dimensions as the original.
   */
  clone() {
    return new _Tensor(this.type, this.data.slice(), this.dims.slice());
  }
  /**
   * Performs a slice operation on the Tensor along specified dimensions.
   *
   * Consider a Tensor that has a dimension of [4, 7]:
   * ```
   * [ 1,  2,  3,  4,  5,  6,  7]
   * [ 8,  9, 10, 11, 12, 13, 14]
   * [15, 16, 17, 18, 19, 20, 21]
   * [22, 23, 24, 25, 26, 27, 28]
   * ```
   * We can slice against the two dims of row and column, for instance in this
   * case we can start at the second element, and return to the second last,
   * like this:
   * ```
   * tensor.slice([1, -1], [1, -1]);
   * ```
   * which would return:
   * ```
   * [  9, 10, 11, 12, 13 ]
   * [ 16, 17, 18, 19, 20 ]
   * ```
   *
   * @param {...(number|number[]|null)} slices The slice specifications for each dimension.
   * - If a number is given, then a single element is selected.
   * - If an array of two numbers is given, then a range of elements [start, end (exclusive)] is selected.
   * - If null is given, then the entire dimension is selected.
   * @returns {Tensor} A new Tensor containing the selected elements.
   * @throws {Error} If the slice input is invalid.
   */
  slice(...slices) {
    const newTensorDims = [];
    const newOffsets = [];
    for (let sliceIndex = 0; sliceIndex < this.dims.length; ++sliceIndex) {
      let slice2 = slices[sliceIndex];
      if (slice2 === null || slice2 === void 0) {
        newOffsets.push([0, this.dims[sliceIndex]]);
        newTensorDims.push(this.dims[sliceIndex]);
      } else if (typeof slice2 === "number") {
        slice2 = safeIndex(slice2, this.dims[sliceIndex], sliceIndex);
        newOffsets.push([slice2, slice2 + 1]);
      } else if (Array.isArray(slice2) && slice2.length === 2) {
        let [start, end] = slice2;
        start = start === null ? 0 : safeIndex(start, this.dims[sliceIndex], sliceIndex, false);
        end = end === null ? this.dims[sliceIndex] : safeIndex(end, this.dims[sliceIndex], sliceIndex, false);
        if (start > end) {
          throw new Error(`Invalid slice: ${slice2}`);
        }
        const offsets = [Math.max(start, 0), Math.min(end, this.dims[sliceIndex])];
        newOffsets.push(offsets);
        newTensorDims.push(offsets[1] - offsets[0]);
      } else {
        throw new Error(`Invalid slice: ${slice2}`);
      }
    }
    const newDims = newOffsets.map(([start, end]) => end - start);
    const newBufferSize = newDims.reduce((a, b) => a * b);
    const this_data = this.data;
    const data = new this_data.constructor(newBufferSize);
    const stride = this.stride();
    let isContiguous = true;
    for (let i = 1; i < newDims.length; ++i) {
      if (newOffsets[i][0] !== 0 || newOffsets[i][1] !== this.dims[i]) {
        isContiguous = false;
        break;
      }
    }
    if (isContiguous) {
      const start = newOffsets[0][0] * stride[0];
      const end = newOffsets[0][1] * stride[0];
      if (ArrayBuffer.isView(this_data)) {
        data.set(this_data.subarray(start, end));
      } else if (Array.isArray(this_data)) {
        const slicedData = this_data.slice(start, end);
        for (let i = 0; i < slicedData.length; ++i) {
          data[i] = slicedData[i];
        }
      } else {
        throw new Error("Unsupported data type for slicing");
      }
    } else {
      for (let i = 0; i < newBufferSize; ++i) {
        let originalIndex = 0;
        for (let j = newDims.length - 1, num = i; j >= 0; --j) {
          const size = newDims[j];
          originalIndex += (num % size + newOffsets[j][0]) * stride[j];
          num = Math.floor(num / size);
        }
        data[i] = this_data[originalIndex];
      }
    }
    return new _Tensor(this.type, data, newTensorDims);
  }
  /**
   * Return a permuted version of this Tensor, according to the provided dimensions.
   * @param  {...number} dims Dimensions to permute.
   * @returns {Tensor} The permuted tensor.
   */
  permute(...dims) {
    return permute(this, dims);
  }
  // TODO: implement transpose. For now (backwards compatibility), it's just an alias for permute()
  /** @type {Tensor['permute']} */
  transpose(...dims) {
    return this.permute(...dims);
  }
  /**
   * Returns the sum of each row of the input tensor in the given dimension dim.
   *
   * @param {number|null} [dim=null] The dimension or dimensions to reduce. If `null`, all dimensions are reduced.
   * @param {boolean} keepdim Whether the output tensor has `dim` retained or not.
   * @returns The summed tensor
   */
  sum(dim = null, keepdim = false) {
    return this.norm(1, dim, keepdim);
  }
  /**
   * Returns the matrix norm or vector norm of a given tensor.
   * @param {number|string} [p='fro'] The order of norm
   * @param {number|null} [dim=null] Specifies which dimension of the tensor to calculate the norm across.
   * If dim is None, the norm will be calculated across all dimensions of input.
   * @param {boolean} [keepdim=false] Whether the output tensors have dim retained or not.
   * @returns {Tensor} The norm of the tensor.
   */
  norm(p = "fro", dim = null, keepdim = false) {
    if (p === "fro") {
      p = 2;
    } else if (typeof p === "string") {
      throw Error(`Unsupported norm: ${p}`);
    }
    const this_data = this.data;
    const is_bigint = this_data instanceof BigInt64Array || this_data instanceof BigUint64Array;
    if (is_bigint && p !== 1) {
      throw Error(`Expected a floating point tensor as input. Got ${this.type}`);
    }
    let fn2, zero;
    if (is_bigint) {
      fn2 = (a, b) => a + b;
      zero = 0n;
    } else {
      fn2 = (a, b) => a + b ** p;
      zero = 0;
    }
    if (dim === null) {
      let val = this_data.reduce(fn2, zero);
      if (p !== 1) {
        val = val ** (1 / p);
      }
      return new _Tensor(this.type, [val], []);
    }
    const [type, result, resultDims] = reduce_helper(fn2, this, dim, keepdim);
    if (p !== 1) {
      for (let i = 0; i < result.length; ++i) {
        result[i] = result[i] ** (1 / p);
      }
    }
    return new _Tensor(type, result, resultDims);
  }
  /**
   * Performs `L_p` normalization of inputs over specified dimension. Operates in place.
   * @param {number} [p=2] The exponent value in the norm formulation
   * @param {number} [dim=1] The dimension to reduce
   * @returns {Tensor} `this` for operation chaining.
   */
  normalize_(p = 2, dim = 1) {
    dim = safeIndex(dim, this.dims.length);
    const norm = this.norm(p, dim, true);
    const this_data = this.data;
    const norm_data = norm.data;
    for (let i = 0; i < this_data.length; ++i) {
      let resultIndex = 0;
      for (let j = this.dims.length - 1, num = i, resultMultiplier = 1; j >= 0; --j) {
        const size = this.dims[j];
        if (j !== dim) {
          const index = num % size;
          resultIndex += index * resultMultiplier;
          resultMultiplier *= this.dims[j];
        }
        num = Math.floor(num / size);
      }
      this_data[i] /= norm_data[resultIndex];
    }
    return this;
  }
  /**
   * Performs `L_p` normalization of inputs over specified dimension.
   * @param {number} [p=2] The exponent value in the norm formulation
   * @param {number} [dim=1] The dimension to reduce
   * @returns {Tensor} The normalized tensor.
   */
  normalize(p = 2, dim = 1) {
    return this.clone().normalize_(p, dim);
  }
  /**
   * Compute and return the stride of this tensor.
   * Stride is the jump necessary to go from one element to the next one in the specified dimension dim.
   * @returns {number[]} The stride of this tensor.
   */
  stride() {
    return dimsToStride(this.dims);
  }
  /**
   * Returns a tensor with all specified dimensions of input of size 1 removed.
   *
   * NOTE: The returned tensor shares the storage with the input tensor, so changing the contents of one will change the contents of the other.
   * If you would like a copy, use `tensor.clone()` before squeezing.
   *
   * @param {number|number[]|null} [dim=null] If given, the input will be squeezed only in the specified dimensions.
   * @returns {Tensor} The squeezed tensor
   */
  squeeze(dim = null) {
    return new _Tensor(this.type, this.data, calc_squeeze_dims(this.dims, dim));
  }
  /**
   * In-place version of @see {@link Tensor.squeeze}
   * @param {number|number[]|null} [dim=null] If given, the input will be squeezed only in the specified dimensions.
   * @returns {Tensor} `this`, with the specified dimensions of size 1 removed.
   */
  squeeze_(dim = null) {
    this.dims = calc_squeeze_dims(this.dims, dim);
    return this;
  }
  /**
   * Returns a new tensor with a dimension of size one inserted at the specified position.
   *
   * NOTE: The returned tensor shares the same underlying data with this tensor.
   *
   * @param {number} dim The index at which to insert the singleton dimension
   * @returns {Tensor} The unsqueezed tensor
   */
  unsqueeze(dim) {
    return new _Tensor(this.type, this.data, calc_unsqueeze_dims(this.dims, dim));
  }
  /**
   * In-place version of @see {@link Tensor.unsqueeze}
   * @type {Tensor['unsqueeze']}
   */
  unsqueeze_(dim) {
    this.dims = calc_unsqueeze_dims(this.dims, dim);
    return this;
  }
  /**
   * In-place version of @see {@link Tensor.flatten}
   * @param {number} [start_dim=0] the first dim to flatten
   * @param {number} [end_dim=-1] the last dim to flatten
   * @returns {Tensor} `this`, flattened along the specified dimensions.
   */
  flatten_(start_dim = 0, end_dim = -1) {
    end_dim = (end_dim + this.dims.length) % this.dims.length;
    let dimsToKeepBefore = this.dims.slice(0, start_dim);
    let dimsToFlatten = this.dims.slice(start_dim, end_dim + 1);
    let dimsToKeepAfter = this.dims.slice(end_dim + 1);
    this.dims = [...dimsToKeepBefore, dimsToFlatten.reduce((a, b) => a * b, 1), ...dimsToKeepAfter];
    return this;
  }
  /**
   * Flattens input by reshaping it into a one-dimensional tensor.
   * If `start_dim` or `end_dim` are passed, only dimensions starting with `start_dim`
   * and ending with `end_dim` are flattened. The order of elements in input is unchanged.
   * @param {number} start_dim the first dim to flatten
   * @param {number} end_dim the last dim to flatten
   * @returns {Tensor} The flattened tensor.
   */
  flatten(start_dim = 0, end_dim = -1) {
    return this.clone().flatten_(start_dim, end_dim);
  }
  /**
   * Returns a new tensor with the same data as the `self` tensor but of a different `shape`.
   * @param  {...number} dims the desired size
   * @returns {Tensor} The tensor with the same data but different shape
   */
  view(...dims) {
    let inferredIndex = -1;
    for (let i = 0; i < dims.length; ++i) {
      if (dims[i] === -1) {
        if (inferredIndex !== -1) {
          throw new Error("Only one dimension can be inferred");
        }
        inferredIndex = i;
      }
    }
    const this_data = this.data;
    if (inferredIndex !== -1) {
      const productOther = dims.reduce((product, curr, index) => {
        return index !== inferredIndex ? product * curr : product;
      }, 1);
      dims[inferredIndex] = this_data.length / productOther;
    }
    return new _Tensor(this.type, this_data, dims);
  }
  /**
   * In-place version of @see {@link Tensor.neg}
   * @returns {Tensor} `this`, with every element negated.
   */
  neg_() {
    const this_data = this.data;
    for (let i = 0; i < this_data.length; ++i) {
      this_data[i] = -this_data[i];
    }
    return this;
  }
  /**
   * Returns a new tensor with the negative of the elements of this tensor.
   * @returns {Tensor} the output tensor.
   */
  neg() {
    return this.clone().neg_();
  }
  /**
   * Computes input > val element-wise.
   * @param {number} val The value to compare with.
   * @returns {Tensor} A boolean tensor that is `true` where input is greater than other and `false` elsewhere.
   */
  gt(val) {
    const mask = new Uint8Array(this.data.length);
    const this_data = this.data;
    for (let i = 0; i < this_data.length; ++i) {
      mask[i] = this_data[i] > val ? 1 : 0;
    }
    return new _Tensor("bool", mask, this.dims);
  }
  /**
   * Computes input < val element-wise.
   * @param {number} val The value to compare with.
   * @returns {Tensor} A boolean tensor that is `true` where input is less than other and `false` elsewhere.
   */
  lt(val) {
    const mask = new Uint8Array(this.data.length);
    const this_data = this.data;
    for (let i = 0; i < this_data.length; ++i) {
      mask[i] = this_data[i] < val ? 1 : 0;
    }
    return new _Tensor("bool", mask, this.dims);
  }
  /**
   * In-place version of @see {@link Tensor.clamp}
   * @type {Tensor['clamp']}
   */
  clamp_(min3, max2) {
    const this_data = this.data;
    for (let i = 0; i < this_data.length; ++i) {
      this_data[i] = Math.min(Math.max(this_data[i], min3), max2);
    }
    return this;
  }
  /**
   * Clamps all elements in input into the range [ min, max ]
   * @param {number} min lower-bound of the range to be clamped to
   * @param {number} max upper-bound of the range to be clamped to
   * @returns {Tensor} the output tensor.
   */
  clamp(min3, max2) {
    return this.clone().clamp_(min3, max2);
  }
  /**
   * In-place version of @see {@link Tensor.round}
   */
  round_() {
    const this_data = this.data;
    for (let i = 0; i < this_data.length; ++i) {
      this_data[i] = Math.round(this_data[i]);
    }
    return this;
  }
  /**
   * Rounds elements of input to the nearest integer.
   * @returns {Tensor} the output tensor.
   */
  round() {
    return this.clone().round_();
  }
  /**
   * Returns the mean value of each row of this tensor in the given dimension `dim`.
   * @param {number|null} [dim=null] the dimension to reduce. If `null`, the mean of all elements is computed.
   * @param {boolean} [keepdim=false] whether the output tensor has `dim` retained or not.
   * @returns {Tensor} A new tensor with means taken along the specified dimension.
   */
  mean(dim = null, keepdim = false) {
    return mean(this, dim, keepdim);
  }
  /**
   * Returns the minimum value of each row of this tensor in the given dimension `dim`.
   * @param {number|null} [dim=null] the dimension to reduce. If `null`, the minimum of all elements is computed.
   * @param {boolean} [keepdim=false] whether the output tensor has `dim` retained or not.
   * @returns {Tensor} A new tensor with minimum values taken along the specified dimension.
   */
  min(dim = null, keepdim = false) {
    if (dim === null) {
      const val = min(this.data)[0];
      return new _Tensor(
        this.type,
        [val],
        [
          /* scalar */
        ]
      );
    }
    const [type, result, resultDims] = reduce_helper((a, b) => Math.min(a, b), this, dim, keepdim, Infinity);
    return new _Tensor(type, result, resultDims);
  }
  /**
   * Returns the maximum value of each row of this tensor in the given dimension `dim`.
   * @param {number|null} [dim=null] the dimension to reduce. If `null`, the maximum of all elements is computed.
   * @param {boolean} [keepdim=false] whether the output tensor has `dim` retained or not.
   * @returns {Tensor} A new tensor with maximum values taken along the specified dimension.
   */
  max(dim = null, keepdim = false) {
    if (dim === null) {
      const val = max(this.data)[0];
      return new _Tensor(
        this.type,
        [val],
        [
          /* scalar */
        ]
      );
    }
    const [type, result, resultDims] = reduce_helper((a, b) => Math.max(a, b), this, dim, keepdim, -Infinity);
    return new _Tensor(type, result, resultDims);
  }
  /**
   * Returns the index of the minimum value of all elements in this tensor.
   * @param {number|null} [dim=null] the dimension to reduce. Only `null` (reduce over all elements) is currently supported.
   * @param {boolean} [keepdim=false] whether the output tensor has `dim` retained or not.
   * @returns {Tensor} An `int64` scalar tensor containing the index of the minimum value.
   * @throws {Error} If `dim` is not `null`.
   */
  argmin(dim = null, keepdim = false) {
    if (dim !== null) {
      throw new Error("`dim !== null` not yet implemented.");
    }
    const index = min(this.data)[1];
    return new _Tensor("int64", [BigInt(index)], []);
  }
  /**
   * Returns the index of the maximum value of all elements in this tensor.
   * @param {number|null} [dim=null] the dimension to reduce. Only `null` (reduce over all elements) is currently supported.
   * @param {boolean} [keepdim=false] whether the output tensor has `dim` retained or not.
   * @returns {Tensor} An `int64` scalar tensor containing the index of the maximum value.
   * @throws {Error} If `dim` is not `null`.
   */
  argmax(dim = null, keepdim = false) {
    if (dim !== null) {
      throw new Error("`dim !== null` not yet implemented.");
    }
    const index = max(this.data)[1];
    return new _Tensor("int64", [BigInt(index)], []);
  }
  /**
   * Repeats this tensor along the specified dimensions.
   * @param {...number} repeats The number of times to repeat this tensor along each dimension.
   * @returns {Tensor} The repeated tensor.
   * @throws {Error} If the number of repeats is less than the number of dimensions.
   */
  repeat(...repeats) {
    if (repeats.length < this.dims.length) {
      throw new Error(
        `Number of dimensions of repeat dims (${repeats.length}) cannot be smaller than number of dimensions of tensor (${this.dims.length})`
      );
    }
    if (repeats.every((r) => r === 1)) {
      if (repeats.length === this.dims.length) {
        return this.clone();
      }
      const numPrependedDims2 = repeats.length - this.dims.length;
      const newDims = Array(numPrependedDims2).fill(1).concat(this.dims);
      return new _Tensor(this.type, this.data.slice(), newDims);
    }
    const numPrependedDims = repeats.length - this.dims.length;
    const expandedDims = Array(numPrependedDims).fill(1).concat(this.dims);
    const outputDims = expandedDims.map((dim, i) => dim * repeats[i]);
    const outputSize = outputDims.reduce((a, b) => a * b, 1);
    const this_data = this.data;
    const data = new this_data.constructor(outputSize);
    const inputStrides = dimsToStride(expandedDims);
    const outputStrides = dimsToStride(outputDims);
    for (let i = 0; i < outputSize; ++i) {
      let remaining = i;
      let inputIndex = 0;
      for (let d = 0; d < outputDims.length; ++d) {
        const outputCoord = Math.floor(remaining / outputStrides[d]);
        remaining = remaining % outputStrides[d];
        const inputCoord = outputCoord % expandedDims[d];
        inputIndex += inputCoord * inputStrides[d];
      }
      data[i] = this_data[inputIndex];
    }
    return new _Tensor(this.type, data, outputDims);
  }
  /**
   * Constructs a tensor by repeating the elements of input. The dims argument specifies the number of repetitions in each dimension.
   * @param  {...number} dims The number of repetitions per dimension.
   * @returns {Tensor} The tiled tensor.
   */
  tile(...dims) {
    if (dims.length < this.dims.length) {
      const numPrependedRepeats = this.dims.length - dims.length;
      dims = Array(numPrependedRepeats).fill(1).concat(dims);
    }
    return this.repeat(...dims);
  }
  /**
   * Performs Tensor dtype conversion.
   * @param {DataType} type The desired data type.
   * @returns {Tensor} The converted tensor.
   */
  to(type) {
    if (this.type === type) return this;
    if (!DataTypeMap.hasOwnProperty(type)) {
      throw new Error(`Unsupported type: ${type}`);
    }
    let map_fn;
    const is_source_bigint = ["int64", "uint64"].includes(this.type);
    const is_dest_bigint = ["int64", "uint64"].includes(type);
    if (is_source_bigint && !is_dest_bigint) {
      map_fn = Number;
    } else if (!is_source_bigint && is_dest_bigint) {
      if (["float16", "float32", "float64"].includes(this.type)) {
        map_fn = (x) => BigInt(Math.floor(x));
      } else {
        map_fn = BigInt;
      }
    } else if (this.type === "float16" && type == "float32" && this.data instanceof Uint16Array) {
      return new _Tensor(type, uint16_to_float32(this.data), this.dims);
    }
    return new _Tensor(
      type,
      // @ts-ignore - TypeScript can't verify .from() across union of TypedArray constructors
      DataTypeMap[type].from(this.data, map_fn),
      this.dims
    );
  }
};
function reshape(data, dimensions) {
  const totalElements = data.length;
  const dimensionSize = dimensions.length === 0 ? 1 : dimensions.reduce((a, b) => a * b);
  if (totalElements !== dimensionSize) {
    throw Error(`cannot reshape array of size ${totalElements} into shape (${dimensions})`);
  }
  let reshapedArray = data;
  for (let i = dimensions.length - 1; i >= 0; i--) {
    reshapedArray = reshapedArray.reduce(
      (acc, val) => {
        let lastArray = acc[acc.length - 1];
        if (lastArray.length < dimensions[i]) {
          lastArray.push(val);
        } else {
          acc.push([val]);
        }
        return acc;
      },
      [[]]
    );
  }
  return reshapedArray[0];
}
function permute(tensor, axes) {
  const [permutedData, shape] = permute_data(tensor.data, tensor.dims, axes);
  return new Tensor3(tensor.type, permutedData, shape);
}
function calc_squeeze_dims(dims, dim) {
  dims = dims.slice();
  if (dim === null) {
    dims = dims.filter((d) => d !== 1);
  } else if (typeof dim === "number") {
    if (dims[dim] === 1) {
      dims.splice(dim, 1);
    }
  } else if (Array.isArray(dim)) {
    dims = dims.filter((x, i) => {
      return x !== 1 || !dim.includes(i);
    });
  }
  return dims;
}
function calc_unsqueeze_dims(dims, dim) {
  dim = safeIndex(dim, dims.length + 1);
  dims = dims.slice();
  dims.splice(dim, 0, 1);
  return dims;
}
function safeIndex(index, size, dimension = null, boundsCheck = true) {
  if (index < -size || index >= size) {
    if (boundsCheck) {
      throw new Error(
        `IndexError: index ${index} is out of bounds for dimension${dimension === null ? "" : " " + dimension} with size ${size}`
      );
    } else {
      return index < -size ? 0 : size;
    }
  }
  if (index < 0) {
    index = (index % size + size) % size;
  }
  return index;
}
function cat(tensors, dim = 0) {
  dim = safeIndex(dim, tensors[0].dims.length);
  const resultDims = tensors[0].dims.slice();
  resultDims[dim] = tensors.reduce((a, b) => a + b.dims[dim], 0);
  const resultSize = resultDims.reduce((a, b) => a * b, 1);
  const result = new tensors[0].data.constructor(resultSize);
  const resultType = tensors[0].type;
  if (dim === 0) {
    let offset = 0;
    for (const tensor of tensors) {
      const tensorData = tensor.data;
      result.set(tensorData, offset);
      offset += tensorData.length;
    }
  } else {
    let currentDim = 0;
    for (let t = 0; t < tensors.length; ++t) {
      const { data, dims } = tensors[t];
      for (let i = 0; i < data.length; ++i) {
        let resultIndex = 0;
        for (let j = dims.length - 1, num = i, resultMultiplier = 1; j >= 0; --j) {
          const size = dims[j];
          let index = num % size;
          if (j === dim) {
            index += currentDim;
          }
          resultIndex += index * resultMultiplier;
          resultMultiplier *= resultDims[j];
          num = Math.floor(num / size);
        }
        result[resultIndex] = data[i];
      }
      currentDim += dims[dim];
    }
  }
  return new Tensor3(resultType, result, resultDims);
}
function stack(tensors, dim = 0) {
  return cat(
    tensors.map((t) => t.unsqueeze(dim)),
    dim
  );
}
function reduce_helper(callbackfn, input, dim, keepdim = false, initialValue = null) {
  const inputData = input.data;
  const inputDims = input.dims;
  dim = safeIndex(dim, inputDims.length);
  const resultDims = inputDims.slice();
  resultDims[dim] = 1;
  const result = new inputData.constructor(inputData.length / inputDims[dim]);
  if (initialValue !== null) {
    result.fill(initialValue);
  }
  for (let i = 0; i < inputData.length; ++i) {
    let resultIndex = 0;
    for (let j = inputDims.length - 1, num = i, resultMultiplier = 1; j >= 0; --j) {
      const size = inputDims[j];
      if (j !== dim) {
        const index = num % size;
        resultIndex += index * resultMultiplier;
        resultMultiplier *= resultDims[j];
      }
      num = Math.floor(num / size);
    }
    result[resultIndex] = callbackfn(result[resultIndex], inputData[i], i, resultIndex);
  }
  if (!keepdim) resultDims.splice(dim, 1);
  return [input.type, result, resultDims];
}
function mean(input, dim = null, keepdim = false) {
  const inputDims = input.dims;
  const inputData = (
    /** @type {Float32Array} */
    input.data
  );
  if (dim === null) {
    const val = inputData.reduce((a, b) => a + b, 0);
    return new Tensor3(
      input.type,
      [val / inputData.length],
      [
        /* scalar */
      ]
    );
  }
  dim = safeIndex(dim, inputDims.length);
  const [type, result, resultDims] = reduce_helper((a, b) => a + b, input, dim, keepdim);
  if (inputDims[dim] !== 1) {
    for (let i = 0; i < result.length; ++i) {
      result[i] /= inputDims[dim];
    }
  }
  return new Tensor3(type, result, resultDims);
}
function dimsToStride(dims) {
  const stride = new Array(dims.length);
  for (let i = dims.length - 1, s2 = 1; i >= 0; --i) {
    stride[i] = s2;
    s2 *= dims[i];
  }
  return stride;
}

// node_modules/@huggingface/transformers/src/models/session.js
async function getSession(pretrained_model_name_or_path, fileName, options, cache_config = false, session_name = void 0) {
  let custom_config = options.config?.["transformers.js_config"] ?? {};
  const selectedDevice = (
    /** @type {import("../utils/devices.js").DeviceType} */
    selectDevice(options.device ?? custom_config.device, fileName, {
      warn: (msg) => logger.info(msg)
    })
  );
  const executionProviders = deviceToExecutionProviders(selectedDevice);
  const device_config = custom_config.device_config ?? {};
  if (device_config.hasOwnProperty(selectedDevice)) {
    custom_config = {
      ...custom_config,
      ...device_config[selectedDevice]
    };
  }
  const selectedDtype = (
    /** @type {import("../utils/dtypes.js").DataType} */
    selectDtype(options.dtype ?? custom_config.dtype, fileName, selectedDevice, {
      configDtype: custom_config.dtype,
      warn: (msg) => logger.info(msg)
    })
  );
  if (!DEFAULT_DTYPE_SUFFIX_MAPPING.hasOwnProperty(selectedDtype)) {
    throw new Error(`Invalid dtype: ${selectedDtype}. Should be one of: ${Object.keys(DATA_TYPES).join(", ")}`);
  } else if (selectedDevice === "webgpu" && // NOTE: Currently, we assume that the Native WebGPU EP always supports fp16. In future, we will add a check for this.
  !apis.IS_NODE_ENV && selectedDtype === DATA_TYPES.fp16 && !await isWebGpuFp16Supported()) {
    throw new Error(`The device (${selectedDevice}) does not support fp16.`);
  }
  const suffix = DEFAULT_DTYPE_SUFFIX_MAPPING[selectedDtype];
  const session_options = { ...options.session_options };
  session_options.executionProviders ??= executionProviders;
  const free_dimension_overrides = custom_config.free_dimension_overrides;
  if (free_dimension_overrides) {
    session_options.freeDimensionOverrides ??= free_dimension_overrides;
  } else if (selectedDevice.startsWith("webnn") && !session_options.freeDimensionOverrides) {
    logger.warn(
      `WebNN does not currently support dynamic shapes and requires 'free_dimension_overrides' to be set in config.json, preferably as a field within config["transformers.js_config"]["device_config"]["${selectedDevice}"]. When 'free_dimension_overrides' is not set, you may experience significant performance degradation.`
    );
  }
  const bufferOrPathPromise = getCoreModelFile(pretrained_model_name_or_path, fileName, options, suffix);
  const use_external_data_format = options.use_external_data_format ?? custom_config.use_external_data_format;
  const externalData = await getModelDataFiles(
    pretrained_model_name_or_path,
    fileName,
    suffix,
    options,
    use_external_data_format,
    session_options
  );
  if (externalData.length > 0 && (!apis.IS_NODE_ENV || externalData.some((data) => typeof data !== "string"))) {
    session_options.externalData = externalData;
  }
  if (cache_config && selectedDevice === "webgpu") {
    const names = getCacheNames(options.config, {
      prefix: "present",
      session_name
    });
    if (names.size > 0 && !isONNXProxy()) {
      const preferredOutputLocation = {};
      for (const key of names) {
        preferredOutputLocation[key] = "gpu-buffer";
      }
      session_options.preferredOutputLocation = preferredOutputLocation;
    }
  }
  const buffer_or_path = await bufferOrPathPromise;
  const session_config = {
    dtype: selectedDtype,
    device: selectedDevice
  };
  return { buffer_or_path, session_options, session_config };
}
async function constructSessions(pretrained_model_name_or_path, names, options, cache_sessions = void 0) {
  return Object.fromEntries(
    await Promise.all(
      Object.keys(names).map(async (name) => {
        const cache_config = cache_sessions?.[name] ?? false;
        const { buffer_or_path, session_options, session_config } = await getSession(
          pretrained_model_name_or_path,
          names[name],
          options,
          cache_config,
          name
        );
        const session = await createInferenceSession(buffer_or_path, session_options, session_config);
        return [name, session];
      })
    )
  );
}
function replaceTensors(obj) {
  for (let prop in obj) {
    if (isONNXTensor(obj[prop])) {
      obj[prop] = new Tensor3(obj[prop]);
    } else if (typeof obj[prop] === "object") {
      replaceTensors(obj[prop]);
    }
  }
  return obj;
}
async function sessionRun(session, inputs) {
  const checkedInputs = validateInputs(session, inputs);
  try {
    const ortFeed = Object.fromEntries(
      Object.entries(checkedInputs).map(([k, v2]) => {
        const tensor = (
          /** @type {any} */
          v2.ort_tensor
        );
        if (apis.IS_NODE_ENV) {
          if (typeof Float16Array !== "undefined" && tensor.cpuData instanceof Float16Array) {
            tensor.cpuData = new Uint16Array(tensor.cpuData.buffer);
          }
        }
        return [k, tensor];
      })
    );
    const output = await runInferenceSession(session, ortFeed);
    return replaceTensors(output);
  } catch (e) {
    const formatted = Object.fromEntries(
      Object.entries(checkedInputs).map(([k, tensor]) => {
        const unpacked = {
          type: tensor.type,
          dims: tensor.dims,
          location: tensor.location
        };
        if (unpacked.location !== "gpu-buffer") {
          unpacked.data = tensor.data;
        }
        return [k, unpacked];
      })
    );
    logger.error(`An error occurred during model execution: "${e}".`);
    logger.error("Inputs given to model:", formatted);
    throw e;
  }
}
function validateInputs(session, inputs) {
  const checkedInputs = /* @__PURE__ */ Object.create(null);
  const missingInputs = [];
  for (const inputName of session.inputNames) {
    const tensor = inputs[inputName];
    if (!(tensor instanceof Tensor3)) {
      missingInputs.push(inputName);
      continue;
    }
    checkedInputs[inputName] = isONNXProxy() ? tensor.clone() : tensor;
  }
  if (missingInputs.length > 0) {
    throw new Error(
      `An error occurred during model execution: "Missing the following inputs: ${missingInputs.join(", ")}.`
    );
  }
  const numInputsProvided = Object.keys(inputs).length;
  const numInputsNeeded = session.inputNames.length;
  if (numInputsProvided > numInputsNeeded) {
    let ignored = Object.keys(inputs).filter((inputName) => !session.inputNames.includes(inputName));
    logger.warn(
      `WARNING: Too many inputs were provided (${numInputsProvided} > ${numInputsNeeded}). The following inputs will be ignored: "${ignored.join(", ")}".`
    );
  }
  return checkedInputs;
}

// node_modules/@huggingface/tokenizers/dist/tokenizers.mjs
var DictionarySplitter = class {
  /**
   * @param dictionary The dictionary of words to use for splitting.
   */
  constructor(dictionary) {
    this.trie = this._build_trie(dictionary);
  }
  /**
   * Builds a trie from the given dictionary.
   * @param dictionary The dictionary of words to build the trie from.
   * @returns The root node of the trie.
   * @private
   */
  _build_trie(dictionary) {
    const trie = /* @__PURE__ */ Object.create(null);
    for (const word of dictionary) {
      let node = trie;
      for (let i = 0; i < word.length; ++i) {
        const char = word[i];
        node = node[char] ??= /* @__PURE__ */ Object.create(null);
      }
      node.end = word;
    }
    return trie;
  }
  /**
   * Splits the input text into tokens based on the dictionary.
   * @param text The input text to split.
   * @returns An array of tokens.
   */
  split(text) {
    const result = [];
    const n = text.length;
    let start = 0;
    let i = 0;
    while (i < n) {
      let node = this.trie;
      let match = null;
      let j = i;
      while (j < n && (node = node[text[j]])) {
        if (node.end) {
          match = node.end;
        }
        ++j;
      }
      if (match) {
        if (i > start) {
          result.push(text.slice(start, i));
        }
        result.push(match);
        i += match.length;
        start = i;
      } else {
        ++i;
      }
    }
    if (start < n) {
      result.push(text.slice(start));
    }
    return result;
  }
};
var DictionarySplitter_default = DictionarySplitter;
var AddedToken = class {
  /**
   * Creates a new instance of AddedToken.
   * @param config Added token configuration object.
   */
  constructor(config) {
    this.content = config.content;
    this.id = config.id;
    this.single_word = config.single_word ?? false;
    this.lstrip = config.lstrip ?? false;
    this.rstrip = config.rstrip ?? false;
    this.special = config.special ?? false;
    this.normalized = config.normalized ?? !this.special;
  }
};
var AddedToken_default = AddedToken;
var compile_unicode_regexp = (source, flags) => {
  try {
    return new RegExp(source, flags);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    const property_names = /* @__PURE__ */ new Map();
    const rewritten = source.replace(
      /(\\[pP])\{([^}=]+)\}/g,
      (text, p, n, offset) => {
        let preceding_backslashes = 0;
        for (let i = offset - 1; i >= 0 && source[i] === "\\"; --i) {
          ++preceding_backslashes;
        }
        if (preceding_backslashes % 2 === 1) return text;
        let property_name = property_names.get(n);
        if (property_name === void 0) {
          try {
            new RegExp(`\\p{${n}}`, "u");
            property_name = n;
          } catch {
            property_name = `Script=${n}`;
          }
          property_names.set(n, property_name);
        }
        return `${p}{${property_name}}`;
      }
    );
    if (rewritten === source) throw error;
    try {
      return new RegExp(rewritten, flags);
    } catch {
      throw error;
    }
  }
};
var clean_up_tokenization = (text) => text.replace(/ \./g, ".").replace(/ \?/g, "?").replace(/ \!/g, "!").replace(/ ,/g, ",").replace(/ \' /g, "'").replace(/ n't/g, "n't").replace(/ 'm/g, "'m").replace(/ 's/g, "'s").replace(/ 've/g, "'ve").replace(/ 're/g, "'re");
var create_pattern = (pattern, invert = true) => {
  if (pattern.Regex !== void 0) {
    const regex = rewrite_oniguruma_to_js(
      normalize_bloom_split_char_class(pattern.Regex)
    );
    return compile_unicode_regexp(regex, "gu");
  } else if (pattern.String !== void 0) {
    const escaped = escape_reg_exp(pattern.String);
    return new RegExp(invert ? escaped : `(${escaped})`, "gu");
  } else {
    console.warn("Unknown pattern type:", pattern);
    return null;
  }
};
var UNICODE_WORD_CHARS_IN_CLASS = "\\p{Alphabetic}\\p{M}\\p{Nd}\\p{Pc}";
var UNICODE_WORD_CHARS = `${UNICODE_WORD_CHARS_IN_CLASS}\\u00B2\\u00B3\\u00B9\\u00BC-\\u00BE`;
var UNICODE_WORD_CLASS = `[${UNICODE_WORD_CHARS}]`;
var UNICODE_NON_WORD_CLASS = `[^${UNICODE_WORD_CHARS}]`;
var UNICODE_WORD_BOUNDARY = `(?:(?<!${UNICODE_WORD_CLASS})(?=${UNICODE_WORD_CLASS})|(?<=${UNICODE_WORD_CLASS})(?!${UNICODE_WORD_CLASS}))`;
var UNICODE_NON_WORD_BOUNDARY = `(?:(?<!${UNICODE_WORD_CLASS})(?!${UNICODE_WORD_CLASS})|(?<=${UNICODE_WORD_CLASS})(?=${UNICODE_WORD_CLASS}))`;
var LINE_START_ANCHOR = "(?:(?<![\\s\\S])|(?<=\\n))";
var LINE_END_ANCHOR = "(?:(?=\\n)|(?![\\s\\S]))";
var HEX_DIGIT_CHARS = "0-9A-Fa-f";
var ESCAPE_REWRITES = /* @__PURE__ */ new Map([
  ["A", "(?<![\\s\\S])"],
  ["z", "(?![\\s\\S])"],
  ["Z", "(?=\\n?(?![\\s\\S]))"],
  // \Z permits a single optional final \n (not \r\n)
  ["h", `[${HEX_DIGIT_CHARS}]`],
  ["H", `[^${HEX_DIGIT_CHARS}]`],
  ["w", UNICODE_WORD_CLASS],
  ["W", UNICODE_NON_WORD_CLASS],
  ["d", "\\p{Nd}"],
  ["D", "\\P{Nd}"],
  ["s", "\\p{White_Space}"],
  // JS \s wrongly adds U+FEFF and misses \x85
  ["S", "\\P{White_Space}"],
  ["b", UNICODE_WORD_BOUNDARY],
  ["B", UNICODE_NON_WORD_BOUNDARY],
  ["a", "\\x07"],
  ["e", "\\x1B"]
]);
var CLASS_ESCAPE_REWRITES = /* @__PURE__ */ new Map([
  ["h", HEX_DIGIT_CHARS],
  ["w", UNICODE_WORD_CHARS_IN_CLASS],
  ["d", "\\p{Nd}"],
  ["D", "\\P{Nd}"],
  ["s", "\\p{White_Space}"],
  ["S", "\\P{White_Space}"],
  ["a", "\\x07"],
  ["e", "\\x1B"]
]);
var CLASS_COMPLEMENT_ALTERNATIVES = /* @__PURE__ */ new Map([
  ["W", `[^${UNICODE_WORD_CHARS_IN_CLASS}]`],
  ["H", `[^${HEX_DIGIT_CHARS}]`]
]);
var RAW_WHITESPACE_ESCAPES = /* @__PURE__ */ new Map([
  ["\n", "\\n"],
  ["\r", "\\r"],
  ["	", "\\t"],
  ["\f", "\\f"],
  ["\v", "\\v"]
]);
var POSIX_CLASS_FRAGMENTS = /* @__PURE__ */ new Map([
  ["alpha", "\\p{Alphabetic}"],
  ["alnum", "\\p{Alphabetic}\\p{Nd}"],
  ["digit", "\\p{Nd}"],
  ["lower", "\\p{Lowercase}"],
  ["upper", "\\p{Uppercase}"],
  ["space", "\\p{White_Space}"],
  ["blank", "\\t\\p{Zs}"],
  ["punct", "\\p{P}\\p{S}"],
  ["cntrl", "\\p{Cc}"],
  ["word", UNICODE_WORD_CHARS_IN_CLASS],
  ["xdigit", HEX_DIGIT_CHARS]
]);
var JS_SYNTAX_CHARS = "^$\\.*+?()[]{}|/";
var GROUP_PREFIX_RE = /^\(\?(?:<[=!]|<[A-Za-z_][A-Za-z0-9_]*>|[:=!>])/;
var BRACED_ESCAPE_RE = /^\\([pPxu])\{([^}]*)\}/;
var QUANTIFIER_BRACE_RE = /^\{(\d+(?:,\d*)?|,\d+)\}/;
var POSIX_BRACKET_RE = /^\[:(\^?)(\p{Alphabetic}+):\]/u;
var EMPTY_NEGATED_POSIX_BRACKET_RE = /^\[:\^:\]/;
var UNSUPPORTED_POSIX_BRACKET_RE = /^\[(?:\.[^\]]*\.\]|=[^\]]*=\])/;
var FIXED_WIDTH_ESCAPE_RE = /^(?:\\x[0-9A-Fa-f]{2}|\\u[0-9A-Fa-f]{4}|\\c[A-Za-z])/;
var is_ascii_letter = (char) => char >= "A" && char <= "Z" || char >= "a" && char <= "z";
var character_at = (text, index) => String.fromCodePoint(text.codePointAt(index));
var get_ascii_folded_hex_atom = (hex) => {
  if (!/^[0-9A-Fa-f]{1,8}$/.test(hex)) return null;
  const code_point = Number.parseInt(hex, 16);
  if (code_point > 127) return null;
  const letter = String.fromCharCode(code_point);
  return is_ascii_letter(letter) ? `[${letter.toLowerCase()}${letter.toUpperCase()}]` : null;
};
var normalize_bloom_split_char_class = (regex) => regex.replace(/\[\^\(\\s\|\[([^\]]+)\]\)\]/g, "[^()|\\s$1]");
var ANY_CODE_POINT = "[\\s\\S]";
var MAX_CHARACTER_CLASS_NESTING_DEPTH = 256;
var create_character_class_operand = () => ({
  fragment: "",
  alternatives: [],
  tail: null,
  contains_complex_set: false
});
var throw_character_class_range_error = (index) => {
  throw new SyntaxError(
    `Unsupported range with a set-valued character-class operand at index ${index}`
  );
};
var add_character_class_atom = (operand, atom, index, contains_complex_set = true) => {
  if (operand.tail === "range") throw_character_class_range_error(index);
  operand.alternatives.push(atom);
  operand.tail = "set";
  operand.contains_complex_set = operand.contains_complex_set || contains_complex_set;
};
var append_character_class_fragment = (operand, fragment, set_valued = false, index = -1) => {
  if (set_valued && operand.tail === "range") {
    throw_character_class_range_error(index);
  }
  if (operand.tail === "range") {
    operand.fragment += fragment;
    operand.tail = "complete_range";
    return;
  }
  operand.fragment += fragment;
  operand.tail = set_valued ? "set" : "scalar";
  operand.contains_complex_set = operand.contains_complex_set || set_valued;
};
var rewrite_character_class_escape = (regex, index, operand) => {
  const braced = BRACED_ESCAPE_RE.exec(regex.slice(index));
  if (braced) {
    const [text, kind, body] = braced;
    if (kind === "P" && body === "Word") {
      add_character_class_atom(
        operand,
        `[^${UNICODE_WORD_CHARS_IN_CLASS}]`,
        index
      );
    } else {
      const replacement2 = kind === "x" ? `\\u{${body}}` : kind === "p" && body === "Word" ? UNICODE_WORD_CHARS_IN_CLASS : text;
      append_character_class_fragment(
        operand,
        replacement2,
        kind === "p" || kind === "P",
        index
      );
    }
    return index + text.length;
  }
  const fixed_width = FIXED_WIDTH_ESCAPE_RE.exec(regex.slice(index));
  if (fixed_width) {
    append_character_class_fragment(operand, fixed_width[0]);
    return index + fixed_width[0].length;
  }
  if (index + 1 >= regex.length) {
    throw new SyntaxError(
      `Unterminated escape in character class at index ${index}`
    );
  }
  const next = character_at(regex, index + 1);
  const next_end = index + 1 + next.length;
  const raw_whitespace = RAW_WHITESPACE_ESCAPES.get(next);
  if (raw_whitespace !== void 0) {
    append_character_class_fragment(operand, raw_whitespace);
    return next_end;
  }
  const complement = CLASS_COMPLEMENT_ALTERNATIVES.get(next);
  if (complement !== void 0) {
    add_character_class_atom(operand, complement, index);
    return next_end;
  }
  const rewrite = CLASS_ESCAPE_REWRITES.get(next);
  let replacement;
  let set_valued = false;
  if (rewrite !== void 0) {
    replacement = rewrite;
    set_valued = next !== "a" && next !== "e";
  } else if (/[A-Za-z0-9]/.test(next)) {
    replacement = `\\${next}`;
  } else if (JS_SYNTAX_CHARS.includes(next) || next === "-") {
    replacement = `\\${next}`;
  } else {
    replacement = next;
  }
  append_character_class_fragment(operand, replacement, set_valued, index);
  return next_end;
};
var compile_character_set_union = (pieces) => {
  if (pieces.length === 1) return pieces[0];
  return `(?:(?=(?:${pieces.join("|")}))${ANY_CODE_POINT})`;
};
var compile_character_class_operand = (operand) => {
  const pieces = operand.fragment.length === 0 ? operand.alternatives : [`[${operand.fragment}]`, ...operand.alternatives];
  return compile_character_set_union(pieces);
};
var get_ascii_fold_additions = (positive_atom) => {
  const membership = compile_unicode_regexp(`^(?:${positive_atom})$`, "u");
  let additions = "";
  for (let offset = 0; offset < 26; ++offset) {
    const upper = String.fromCharCode(65 + offset);
    const lower = String.fromCharCode(97 + offset);
    const has_upper = membership.test(upper);
    const has_lower = membership.test(lower);
    if (has_upper !== has_lower) additions += has_upper ? lower : upper;
  }
  return additions;
};
var parse_character_class = (regex, start, ascii_fold, apply_ascii_fold = true, nesting_depth = 1) => {
  if (nesting_depth > MAX_CHARACTER_CLASS_NESTING_DEPTH) {
    throw new SyntaxError(
      `Maximum character-class nesting depth of ${MAX_CHARACTER_CLASS_NESTING_DEPTH} exceeded at index ${start}`
    );
  }
  let i = start + 1;
  const negated = regex[i] === "^";
  if (negated) ++i;
  const first_content_index = i;
  const operands = [create_character_class_operand()];
  let operand = operands[0];
  let contains_nested_negated_complex_set = false;
  while (i < regex.length) {
    const char = character_at(regex, i);
    if (char === "\\") {
      i = rewrite_character_class_escape(regex, i, operand);
      continue;
    }
    if (char === "]") {
      if (i === first_content_index) {
        append_character_class_fragment(operand, "\\]");
        ++i;
        continue;
      }
      if (operand.tail === null) {
        if (operands.length > 1) {
          throw new SyntaxError(
            `Malformed character-class intersection with an empty operand at index ${i}`
          );
        }
        throw new SyntaxError(`Empty character class at index ${start}`);
      }
      const contains_complex_set = operands.some(
        (candidate) => candidate.contains_complex_set
      );
      if (negated && operands.length > 1 && contains_nested_negated_complex_set) {
        throw new SyntaxError(
          `Unsupported outer-negated character-class intersection with a nested negated class containing a Unicode property, POSIX class, or shorthand at index ${start}`
        );
      }
      const first_atom = compile_character_class_operand(operands[0]);
      let positive_atom = first_atom;
      if (operands.length > 1) {
        let lookaheads = "";
        for (let j = 1; j < operands.length; ++j) {
          lookaheads += `(?=${compile_character_class_operand(operands[j])})`;
        }
        positive_atom = `(?:${lookaheads}${first_atom})`;
      }
      const is_direct_class = operands.length === 1 && operand.alternatives.length === 0;
      let direct_fragment = operand.fragment;
      if (ascii_fold && apply_ascii_fold) {
        const additions = get_ascii_fold_additions(positive_atom);
        if (additions.length > 0) {
          if (is_direct_class) {
            direct_fragment += additions;
            positive_atom = `[${direct_fragment}]`;
          } else {
            positive_atom = compile_character_set_union([
              positive_atom,
              `[${additions}]`
            ]);
          }
        }
      }
      const atom = negated ? is_direct_class ? `[^${direct_fragment}]` : `(?:(?!${positive_atom})${ANY_CODE_POINT})` : positive_atom;
      return {
        atom,
        end: i + 1,
        negated,
        contains_complex_set,
        contains_nested_negated_complex_set
      };
    }
    if (regex.startsWith("&&", i)) {
      if (operand.tail === null) {
        throw new SyntaxError(
          `Malformed character-class intersection with an empty operand at index ${i}`
        );
      }
      operand = create_character_class_operand();
      operands.push(operand);
      i += 2;
      continue;
    }
    if (char === "[") {
      const suffix = regex.slice(i);
      if (EMPTY_NEGATED_POSIX_BRACKET_RE.test(suffix)) {
        throw new SyntaxError(
          `Malformed empty negated POSIX character class at index ${i}`
        );
      }
      const posix = POSIX_BRACKET_RE.exec(suffix);
      if (posix) {
        const [, posix_negated, name] = posix;
        const fragment = POSIX_CLASS_FRAGMENTS.get(name);
        if (fragment === void 0) {
          throw new SyntaxError(
            `Unsupported POSIX character class "${name}" at index ${i}`
          );
        }
        if (ascii_fold && posix_negated && (name === "lower" || name === "upper")) {
          throw new SyntaxError(
            `Unsupported negated POSIX ${name} class inside an inline case-insensitive group`
          );
        }
        if (posix_negated) {
          add_character_class_atom(operand, `[^${fragment}]`, i);
        } else {
          append_character_class_fragment(operand, fragment, true, i);
        }
        i += posix[0].length;
        continue;
      }
      if (UNSUPPORTED_POSIX_BRACKET_RE.test(suffix)) {
        throw new SyntaxError(
          `Unsupported POSIX collating or equivalence bracket expression at index ${i}`
        );
      }
      const nested = parse_character_class(
        regex,
        i,
        ascii_fold,
        false,
        nesting_depth + 1
      );
      add_character_class_atom(
        operand,
        nested.atom,
        i,
        nested.contains_complex_set
      );
      contains_nested_negated_complex_set ||= nested.contains_nested_negated_complex_set || nested.negated && nested.contains_complex_set;
      i = nested.end;
      continue;
    }
    if (char === "-") {
      const is_terminal_literal = regex[i + 1] === "]" || regex.startsWith("&&", i + 1);
      if (operand.tail === "set" && !is_terminal_literal) {
        throw_character_class_range_error(i);
      }
      if (operand.tail === null || operand.tail === "range" || operand.tail === "complete_range" || is_terminal_literal) {
        append_character_class_fragment(operand, "\\-");
      } else {
        operand.fragment += "-";
        operand.tail = "range";
      }
      ++i;
      continue;
    }
    append_character_class_fragment(
      operand,
      char === "^" && operand.fragment.length === 0 ? "\\^" : char
    );
    i += char.length;
  }
  throw new SyntaxError(
    `${operands.length > 1 ? "Unterminated character-class intersection" : "Unterminated character class"} at index ${start}`
  );
};
var rewrite_oniguruma_to_js = (regex) => {
  let out = "";
  let atom_start = -1;
  let last_was_quantifier = false;
  let ascii_fold = false;
  const group_states = [];
  const emit_atom = (text) => {
    atom_start = out.length;
    out += text;
    last_was_quantifier = false;
  };
  for (let i = 0; i < regex.length; ) {
    const char = character_at(regex, i);
    if (char === "\\") {
      const braced = BRACED_ESCAPE_RE.exec(regex.slice(i));
      if (braced) {
        const [text, kind, body] = braced;
        let replacement2 = text;
        if (kind === "x") {
          const code_point_escape = `\\u{${body}}`;
          replacement2 = ascii_fold ? get_ascii_folded_hex_atom(body) ?? code_point_escape : code_point_escape;
        } else if (body === "Word") {
          replacement2 = kind === "p" ? UNICODE_WORD_CLASS : UNICODE_NON_WORD_CLASS;
        }
        emit_atom(replacement2);
        i += text.length;
        continue;
      }
      const fixed_width = FIXED_WIDTH_ESCAPE_RE.exec(regex.slice(i));
      if (fixed_width) {
        const text = fixed_width[0];
        const replacement2 = ascii_fold && text[1] !== "c" ? get_ascii_folded_hex_atom(text.slice(2)) ?? text : text;
        emit_atom(replacement2);
        i += text.length;
        continue;
      }
      if (i + 1 >= regex.length) {
        out += char;
        break;
      }
      const next = character_at(regex, i + 1);
      i += 1 + next.length;
      if (next === "G") {
        continue;
      }
      const raw_whitespace = RAW_WHITESPACE_ESCAPES.get(next);
      if (raw_whitespace !== void 0) {
        emit_atom(raw_whitespace);
        continue;
      }
      const rewrite = ESCAPE_REWRITES.get(next);
      let replacement;
      if (rewrite !== void 0) {
        replacement = rewrite;
      } else if (/[A-Za-z0-9]/.test(next)) {
        replacement = `\\${next}`;
      } else if (JS_SYNTAX_CHARS.includes(next)) {
        replacement = `\\${next}`;
      } else {
        replacement = next;
      }
      emit_atom(replacement);
      continue;
    }
    switch (char) {
      case "[": {
        const parsed = parse_character_class(regex, i, ascii_fold);
        emit_atom(parsed.atom);
        i = parsed.end;
        continue;
      }
      case "]":
        emit_atom("\\]");
        ++i;
        continue;
      case ".":
        emit_atom("[^\\n]");
        ++i;
        continue;
      case "^":
        emit_atom(LINE_START_ANCHOR);
        ++i;
        continue;
      case "$":
        emit_atom(LINE_END_ANCHOR);
        ++i;
        continue;
      case "(": {
        const inline_case_insensitive = regex.startsWith("(?i:", i);
        const source_prefix = inline_case_insensitive ? "(?i:" : GROUP_PREFIX_RE.exec(regex.slice(i))?.[0] ?? "(";
        const output_prefix = inline_case_insensitive ? "(?:" : source_prefix === "(?>" ? "(?:" : source_prefix;
        group_states.push([out.length, ascii_fold]);
        if (inline_case_insensitive) ascii_fold = true;
        out += output_prefix;
        last_was_quantifier = false;
        i += source_prefix.length;
        continue;
      }
      case ")":
        out += char;
        [atom_start, ascii_fold] = group_states.pop() ?? [-1, false];
        last_was_quantifier = false;
        ++i;
        continue;
      case "|":
        out += char;
        atom_start = -1;
        last_was_quantifier = false;
        ++i;
        continue;
      case "{": {
        const quant = QUANTIFIER_BRACE_RE.exec(regex.slice(i));
        if (!quant || atom_start < 0) {
          emit_atom("\\{");
          ++i;
          continue;
        }
        const body = quant[1].startsWith(",") ? `0${quant[1]}` : quant[1];
        i += quant[0].length;
        const following = regex[i];
        if (following === "+" || following === "*") {
          out = `${out.slice(0, atom_start)}(?:${out.slice(atom_start)}{${body}})${following}`;
          ++i;
        } else {
          out += `{${body}}`;
        }
        last_was_quantifier = true;
        continue;
      }
      case "}":
        emit_atom("\\}");
        ++i;
        continue;
      case "+":
        if (last_was_quantifier) {
          ++i;
          continue;
        }
        out += char;
        last_was_quantifier = true;
        ++i;
        continue;
      case "*":
      case "?":
        out += char;
        last_was_quantifier = true;
        ++i;
        continue;
      default:
        emit_atom(
          ascii_fold && is_ascii_letter(char) ? `[${char.toLowerCase()}${char.toUpperCase()}]` : char
        );
        i += char.length;
        continue;
    }
  }
  return out;
};
var escape_reg_exp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
var fuse_unk = (arr, tokens_to_ids, unk_token_id) => {
  const fused = [];
  let i = 0;
  while (i < arr.length) {
    fused.push(arr[i]);
    const token_id = tokens_to_ids.get(arr[i]) ?? unk_token_id;
    if (token_id !== unk_token_id) {
      ++i;
      continue;
    }
    while (++i < arr.length && (tokens_to_ids.get(arr[i]) ?? unk_token_id) === unk_token_id) {
      if (tokens_to_ids.get(fused.at(-1)) !== unk_token_id) {
        fused[fused.length - 1] += arr[i];
      }
    }
  }
  return fused;
};
var is_chinese_char = (cp) => cp >= 19968 && cp <= 40959 || cp >= 13312 && cp <= 19903 || cp >= 131072 && cp <= 173791 || cp >= 173824 && cp <= 177983 || cp >= 177984 && cp <= 178207 || cp >= 178208 && cp <= 183983 || cp >= 63744 && cp <= 64255 || cp >= 194560 && cp <= 195103;
var is_integral_number = (x) => Number.isInteger(x) || typeof x === "bigint";
var len = (s) => {
  let length = 0;
  for (const c of s) ++length;
  return length;
};
var lowercase_and_remove_accents = (text) => remove_accents(text.toLowerCase());
var merge_arrays = (...arrs) => Array.prototype.concat.apply([], arrs);
var object_to_map = (obj) => new Map(Object.entries(obj));
var regex_split = (text, regex) => {
  const result = [];
  let prev = 0;
  for (const match of text.matchAll(regex)) {
    const full_match = match[0];
    if (prev < match.index) {
      result.push(text.slice(prev, match.index));
    }
    if (full_match.length > 0) {
      result.push(full_match);
    }
    prev = match.index + full_match.length;
  }
  if (prev < text.length) {
    result.push(text.slice(prev));
  }
  return result;
};
var remove_accents = (text) => text.replace(/\p{M}/gu, "");
var validate_object = (obj, name, required_keys = []) => {
  if (!obj || Array.isArray(obj) || typeof obj !== "object") {
    return `${name} must be a valid object`;
  }
  for (const key of required_keys) {
    if (!(key in obj)) {
      return `${name} must contain a "${key}" property`;
    }
  }
  return null;
};
var whitespace_split = (text) => text.match(/\S+/g) || [];
var Callable2 = class {
  /**
   * Creates a new instance of the Callable class.
   */
  constructor() {
    const closure = function(...args) {
      return closure._call(...args);
    };
    return Object.setPrototypeOf(closure, new.target.prototype);
  }
};
var Callable_default = Callable2;
var Normalizer = class extends Callable_default {
  /**
   * @param config The configuration object for the normalizer.
   */
  constructor(config) {
    super();
    this.config = config;
  }
  /**
   * Alias for {@link Normalizer#normalize}.
   * @param text The text to normalize.
   * @returns The normalized text.
   */
  _call(text) {
    return this.normalize(text);
  }
};
var Normalizer_default = Normalizer;
var BertNormalizer = class extends Normalizer_default {
  /**
   * Adds whitespace around any CJK (Chinese, Japanese, or Korean) character in the input text.
   *
   * @param text The input text to tokenize.
   * @returns The tokenized text with whitespace added around CJK characters.
   */
  tokenize_chinese_chars(text) {
    const output = [];
    for (let i = 0; i < text.length; ++i) {
      const char = text[i];
      const cp = char.charCodeAt(0);
      if (is_chinese_char(cp)) {
        output.push(" ");
        output.push(char);
        output.push(" ");
      } else {
        output.push(char);
      }
    }
    return output.join("");
  }
  /**
   * Strips accents from the given text.
   * @param text The text to strip accents from.
   * @returns The text with accents removed.
   */
  strip_accents(text) {
    return text.normalize("NFD").replace(/\p{Mn}/gu, "");
  }
  /**
   * Checks whether `char` is a control character.
   * @param char The character to check.
   * @returns Whether `char` is a control character.
   */
  is_control(char) {
    switch (char) {
      case "	":
      case "\n":
      case "\r":
        return false;
      default:
        return /^\p{Cc}|\p{Cf}|\p{Co}|\p{Cs}$/u.test(char);
    }
  }
  /**
   * Performs invalid character removal and whitespace cleanup on text.
   * @param text The text to clean.
   * @returns The cleaned text.
   */
  clean_text(text) {
    const output = [];
    for (const char of text) {
      const cp = char.charCodeAt(0);
      if (cp === 0 || cp === 65533 || this.is_control(char)) {
        continue;
      }
      if (/^\s$/.test(char)) {
        output.push(" ");
      } else {
        output.push(char);
      }
    }
    return output.join("");
  }
  /**
   * Normalizes the given text based on the configuration.
   * @param text The text to normalize.
   * @returns The normalized text.
   */
  normalize(text) {
    if (this.config.clean_text) {
      text = this.clean_text(text);
    }
    if (this.config.handle_chinese_chars) {
      text = this.tokenize_chinese_chars(text);
    }
    if (this.config.lowercase) {
      text = text.toLowerCase();
      if (this.config.strip_accents !== false) {
        text = this.strip_accents(text);
      }
    } else if (this.config.strip_accents) {
      text = this.strip_accents(text);
    }
    return text;
  }
};
var BertNormalizer_default = BertNormalizer;
var Precompiled = class extends Normalizer_default {
  /**
   * Create a new instance of Precompiled normalizer.
   * @param config The configuration object.
   */
  constructor(config) {
    super(config);
    this.charsmap = config.precompiled_charsmap ?? null;
  }
  /**
   * Normalizes the given text by applying the precompiled charsmap.
   * @param text The text to normalize.
   * @returns The normalized text.
   */
  normalize(text) {
    text = text.replace(
      /[\u0001-\u0008\u000B\u000E-\u001F\u007F\u008F\u009F]/gm,
      ""
    );
    text = text.replace(
      /[\u0009\u000A\u000C\u000D\u00A0\u1680\u2000-\u200F\u2028\u2029\u202F\u205F\u2581\u3000\uFEFF\uFFFD]/gm,
      " "
    );
    if (text.includes("\uFF5E")) {
      const parts = text.split("\uFF5E");
      text = parts.map((part) => part.normalize("NFKC")).join("\uFF5E");
    } else {
      text = text.normalize("NFKC");
    }
    return text;
  }
};
var Precompiled_default = Precompiled;
var Sequence = class extends Normalizer_default {
  /**
   * Create a new instance of NormalizerSequence.
   * @param config The configuration object.
   */
  constructor(config) {
    super(config);
    this.normalizers = (config.normalizers ?? []).map(
      (x) => create_normalizer_default(x)
    );
  }
  /**
   * Apply a sequence of Normalizers to the input text.
   * @param text The text to normalize.
   * @returns The normalized text.
   */
  normalize(text) {
    return this.normalizers.reduce((t, normalizer) => {
      return normalizer ? normalizer.normalize(t) : t;
    }, text);
  }
};
var Sequence_default = Sequence;
var Replace = class extends Normalizer_default {
  /**
   * @param config The configuration object for the normalizer.
   */
  constructor(config) {
    super(config);
    this.pattern = create_pattern(this.config.pattern ?? {});
  }
  /**
   * Normalize the input text by replacing the pattern with the content.
   * @param text The input text to be normalized.
   * @returns The normalized text after replacing the pattern with the content.
   */
  normalize(text) {
    return this.pattern === null ? text : text.replaceAll(this.pattern, this.config.content ?? "");
  }
};
var Replace_default = Replace;
var UnicodeNormalizer = class extends Normalizer_default {
  constructor() {
    super(...arguments);
    this.form = "NFC";
  }
  /**
   * Normalize the input text by applying Unicode normalization.
   * @param text The input text to be normalized.
   * @returns The normalized text.
   */
  normalize(text) {
    text = text.normalize(this.form);
    return text;
  }
};
var UnicodeNormalizer_default = UnicodeNormalizer;
var NFC = class extends UnicodeNormalizer_default {
  constructor() {
    super(...arguments);
    this.form = "NFC";
  }
};
var NFC_default = NFC;
var NFD = class extends UnicodeNormalizer_default {
  constructor() {
    super(...arguments);
    this.form = "NFD";
  }
};
var NFD_default = NFD;
var NFKC = class extends UnicodeNormalizer_default {
  constructor() {
    super(...arguments);
    this.form = "NFKC";
  }
};
var NFKC_default = NFKC;
var NFKD = class extends UnicodeNormalizer_default {
  constructor() {
    super(...arguments);
    this.form = "NFKD";
  }
};
var NFKD_default = NFKD;
var Strip = class extends Normalizer_default {
  /**
   * Strip leading and/or trailing whitespace from the input text.
   * @param text The input text.
   * @returns The normalized text.
   */
  normalize(text) {
    if (this.config.strip_left && this.config.strip_right) {
      text = text.trim();
    } else {
      if (this.config.strip_left) {
        text = text.trimStart();
      }
      if (this.config.strip_right) {
        text = text.trimEnd();
      }
    }
    return text;
  }
};
var Strip_default = Strip;
var StripAccents = class extends Normalizer_default {
  /**
   * Remove all accents from the text.
   * @param text The input text.
   * @returns The normalized text without accents.
   */
  normalize(text) {
    return remove_accents(text);
  }
};
var StripAccents_default = StripAccents;
var Lowercase = class extends Normalizer_default {
  /**
   * Lowercases the input string.
   * @param {string} text The text to normalize.
   * @returns {string} The normalized text.
   */
  normalize(text) {
    return text.toLowerCase();
  }
};
var Lowercase_default = Lowercase;
var Prepend = class extends Normalizer_default {
  /**
   * Prepends the input string.
   * @param text The text to normalize.
   * @returns The normalized text.
   */
  normalize(text) {
    text = this.config.prepend + text;
    return text;
  }
};
var Prepend_default = Prepend;
function create_normalizer(config) {
  if (config === null) return null;
  switch (config.type) {
    case "BertNormalizer":
      return new BertNormalizer_default(config);
    case "Precompiled":
      return new Precompiled_default(config);
    case "Sequence":
      return new Sequence_default(config);
    case "Replace":
      return new Replace_default(config);
    case "NFC":
      return new NFC_default(config);
    case "NFD":
      return new NFD_default(config);
    case "NFKC":
      return new NFKC_default(config);
    case "NFKD":
      return new NFKD_default(config);
    case "Strip":
      return new Strip_default(config);
    case "StripAccents":
      return new StripAccents_default(config);
    case "Lowercase":
      return new Lowercase_default(config);
    case "Prepend":
      return new Prepend_default(config);
    default:
      throw new Error(`Unknown Normalizer type: ${config.type}`);
  }
}
var create_normalizer_default = create_normalizer;
var PreTokenizer = class extends Callable_default {
  /**
   * Tokenizes the given text into pre-tokens.
   * @param text The text or array of texts to pre-tokenize.
   * @param options Additional options for the pre-tokenization logic.
   * @returns An array of pre-tokens.
   */
  pre_tokenize(text, options) {
    return (Array.isArray(text) ? text.map((x) => this.pre_tokenize_text(x, options)) : this.pre_tokenize_text(text, options)).flat();
  }
  /**
   * Alias for {@link PreTokenizer#pre_tokenize}.
   * @param text The text or array of texts to pre-tokenize.
   * @param options Additional options for the pre-tokenization logic.
   * @returns An array of pre-tokens.
   */
  _call(text, options) {
    return this.pre_tokenize(text, options);
  }
};
var PreTokenizer_default = PreTokenizer;
var BYTES_TO_UNICODE = (() => {
  const bs = [
    ...Array.from(
      { length: "~".charCodeAt(0) - "!".charCodeAt(0) + 1 },
      (_2, i) => i + "!".charCodeAt(0)
    ),
    ...Array.from(
      { length: "\xAC".charCodeAt(0) - "\xA1".charCodeAt(0) + 1 },
      (_2, i) => i + "\xA1".charCodeAt(0)
    ),
    ...Array.from(
      { length: "\xFF".charCodeAt(0) - "\xAE".charCodeAt(0) + 1 },
      (_2, i) => i + "\xAE".charCodeAt(0)
    )
  ];
  const cs = bs.slice();
  let n = 0;
  for (let b = 0; b < 256; ++b) {
    if (!bs.includes(b)) {
      bs.push(b);
      cs.push(256 + n);
      n += 1;
    }
  }
  const ccs = cs.map((n2) => String.fromCharCode(n2));
  return Object.fromEntries(bs.map((b, i) => [b, ccs[i]]));
})();
var reverse_dictionary = (data) => Object.fromEntries(Object.entries(data).map(([key, value]) => [value, key]));
var UNICODE_TO_BYTES = reverse_dictionary(BYTES_TO_UNICODE);
var PUNCTUATION_REGEX = "\\p{P}\\u0021-\\u002F\\u003A-\\u0040\\u005B-\\u0060\\u007B-\\u007E";
var ByteLevel = class extends PreTokenizer_default {
  /**
   * Creates a new instance of the `ByteLevelPreTokenizer` class.
   * @param config The configuration object.
   */
  constructor(config) {
    super();
    this.config = config;
    this.add_prefix_space = this.config.add_prefix_space ?? false;
    this.trim_offsets = this.config.trim_offsets ?? false;
    this.use_regex = this.config.use_regex ?? true;
    this.pattern = /'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu;
    this.byte_encoder = BYTES_TO_UNICODE;
    this.text_encoder = new TextEncoder();
  }
  /**
   * Tokenizes a single piece of text using byte-level tokenization.
   * @param text The text to tokenize.
   * @param options Additional options for the pre-tokenization logic.
   * @returns An array of tokens.
   */
  pre_tokenize_text(text, options) {
    if (this.add_prefix_space && !text.startsWith(" ")) {
      text = " " + text;
    }
    const tokens = this.use_regex ? text.match(this.pattern) || [] : [text];
    return tokens.map(
      (token) => Array.from(
        this.text_encoder.encode(token),
        (byte) => this.byte_encoder[byte]
      ).join("")
    );
  }
};
var ByteLevel_default = ByteLevel;
var Whitespace = class extends PreTokenizer_default {
  /**
   * Pre-tokenizes the input text by splitting it on word boundaries.
   * @param text The text to be pre-tokenized.
   * @param options Additional options for the pre-tokenization logic.
   * @returns An array of tokens produced by splitting the input text on whitespace.
   */
  pre_tokenize_text(text, options) {
    return text.match(/\w+|[^\w\s]+/g) || [];
  }
};
var Whitespace_default = Whitespace;
var Metaspace = class extends PreTokenizer_default {
  /**
   * @param config The configuration object for the MetaspacePreTokenizer.
   */
  constructor(config) {
    super();
    this.replacement = config.replacement ?? "\u2581";
    this.str_rep = config.str_rep || this.replacement;
    this.prepend_scheme = config.prepend_scheme ?? "always";
  }
  /**
   * This method takes a string, replaces spaces with the replacement character,
   * adds a prefix space if requested, and returns a new list of tokens.
   * @param text The text to pre-tokenize.
   * @param options The options for the pre-tokenization.
   * @returns A new list of pre-tokenized tokens.
   */
  pre_tokenize_text(text, options) {
    const { section_index = void 0 } = options ?? {};
    let normalized = text.replaceAll(" ", this.str_rep);
    if (
      // We add a prefix space if:
      //  (1) The normalized token does not already start with the replacement character.
      !normalized.startsWith(this.replacement) && // and (2) either:
      //  (a) prepend_scheme is 'always'
      //  (b) prepend_scheme is 'first' and this is the first section
      (this.prepend_scheme === "always" || this.prepend_scheme === "first" && section_index === 0)
    ) {
      normalized = this.str_rep + normalized;
    }
    return [normalized];
  }
};
var Metaspace_default = Metaspace;
var Split = class extends PreTokenizer_default {
  /**
   * @param config The configuration options for the pre-tokenizer.
   */
  constructor(config) {
    super();
    this.config = config;
    this.pattern = create_pattern(
      this.config.pattern ?? {},
      this.config.invert ?? true
    );
  }
  /**
   * Tokenizes text by splitting it using the given pattern.
   * @param text The text to tokenize.
   * @returns An array of tokens.
   */
  pre_tokenize_text(text) {
    if (this.pattern === null) {
      return [];
    }
    if (this.config.invert) {
      return (text.match(this.pattern) || []).filter((x) => x);
    } else if (this.config.behavior?.toLowerCase() === "removed") {
      return text.split(this.pattern).filter((x) => x);
    } else {
      return regex_split(text, this.pattern);
    }
  }
};
var Split_default = Split;
var Punctuation = class extends PreTokenizer_default {
  /**
   * @param config The configuration options for the pre-tokenizer.
   */
  constructor(config) {
    super();
    this.config = config;
    this.pattern = new RegExp(
      `[^${PUNCTUATION_REGEX}]+|[${PUNCTUATION_REGEX}]+`,
      "gu"
    );
  }
  /**
   * Tokenizes text by splitting it using the given pattern.
   * @param text The text to tokenize.
   * @returns An array of tokens.
   */
  pre_tokenize_text(text) {
    return text.match(this.pattern) || [];
  }
};
var Punctuation_default = Punctuation;
var Digits = class extends PreTokenizer_default {
  /**
   * @param config The configuration options for the pre-tokenizer.
   */
  constructor(config) {
    super();
    this.config = config;
    const digit_pattern = `[^\\d]+|\\d${this.config.individual_digits ? "" : "+"}`;
    this.pattern = new RegExp(digit_pattern, "gu");
  }
  /**
   * Tokenizes text by splitting it using the given pattern.
   * @param text The text to tokenize.
   * @returns An array of tokens.
   */
  pre_tokenize_text(text) {
    return text.match(this.pattern) || [];
  }
};
var Digits_default = Digits;
var BertPreTokenizer = class extends PreTokenizer_default {
  /**
   * A PreTokenizer that splits text into wordpieces using a basic tokenization scheme
   * similar to that used in the original implementation of BERT.
   */
  constructor() {
    super();
    this.pattern = new RegExp(
      `[^\\s${PUNCTUATION_REGEX}]+|[${PUNCTUATION_REGEX}]`,
      "gu"
    );
  }
  /**
   * Tokenizes a single text using the BERT pre-tokenization scheme.
   *
   * @param text The text to tokenize.
   * @param options Additional options for the pre-tokenization logic.
   * @returns An array of tokens.
   */
  pre_tokenize_text(text, options) {
    return text.trim().match(this.pattern) || [];
  }
};
var BertPreTokenizer_default = BertPreTokenizer;
var Replace2 = class extends PreTokenizer_default {
  /**
   * @param config The configuration options for the pre-tokenizer.
   */
  constructor(config) {
    super();
    this.config = config;
    this.pattern = create_pattern(this.config.pattern ?? {});
    this.content = this.config.content ?? "";
  }
  /**
   * Pre-tokenizes the input text by replacing certain characters.
   * @param text The text to be pre-tokenized.
   * @returns An array of tokens produced by replacing certain characters.
   */
  pre_tokenize_text(text) {
    if (this.pattern === null) {
      return [text];
    }
    return [text.replaceAll(this.pattern, this.config.content ?? "")];
  }
};
var Replace_default2 = Replace2;
var Sequence2 = class extends PreTokenizer_default {
  /**
   * Creates an instance of PreTokenizerSequence.
   * @param config The configuration object for the pre-tokenizer sequence.
   */
  constructor(config) {
    super();
    this.tokenizers = (config.pretokenizers ?? []).map(
      (x) => create_pre_tokenizer_default(x)
    );
  }
  /**
   * Applies each pre-tokenizer in the sequence to the input text in turn.
   * @param text The text to pre-tokenize.
   * @param options Additional options for the pre-tokenization logic.
   * @returns The pre-tokenized text.
   */
  pre_tokenize_text(text, options) {
    return this.tokenizers.reduce(
      (pre_tokenized_text, tokenizer) => {
        return tokenizer ? tokenizer.pre_tokenize(pre_tokenized_text, options) : pre_tokenized_text;
      },
      [text]
    );
  }
};
var Sequence_default2 = Sequence2;
var WhitespaceSplit = class extends PreTokenizer_default {
  /**
   * Pre-tokenizes the input text by splitting it on whitespace characters.
   * @param text The text to be pre-tokenized.
   * @returns An array of tokens produced by splitting the input text on whitespace.
   */
  pre_tokenize_text(text) {
    return whitespace_split(text);
  }
};
var WhitespaceSplit_default = WhitespaceSplit;
var FixedLength = class extends PreTokenizer_default {
  /**
   * @param config The configuration options for the pre-tokenizer.
   */
  constructor(config) {
    super();
    this.config = config;
    this._length = config.length;
  }
  /**
   * Pre-tokenizes the input text by splitting it into fixed-length tokens.
   * @param text The text to be pre-tokenized.
   * @returns An array of tokens produced by splitting the input text into fixed-length tokens.
   */
  pre_tokenize_text(text) {
    const tokens = [];
    for (let i = 0; i < text.length; i += this._length) {
      tokens.push(text.slice(i, i + this._length));
    }
    return tokens;
  }
};
var FixedLength_default = FixedLength;
function create_pre_tokenizer(config) {
  if (config === null) return null;
  switch (config.type) {
    case "BertPreTokenizer":
      return new BertPreTokenizer_default();
    case "Sequence":
      return new Sequence_default2(config);
    case "Whitespace":
      return new Whitespace_default();
    case "WhitespaceSplit":
      return new WhitespaceSplit_default();
    case "Metaspace":
      return new Metaspace_default(config);
    case "ByteLevel":
      return new ByteLevel_default(config);
    case "Split":
      return new Split_default(config);
    case "Punctuation":
      return new Punctuation_default(config);
    case "Digits":
      return new Digits_default(config);
    case "Replace":
      return new Replace_default2(config);
    case "FixedLength":
      return new FixedLength_default(config);
    default:
      throw new Error(`Unknown PreTokenizer type: ${config.type}`);
  }
}
var create_pre_tokenizer_default = create_pre_tokenizer;
var TokenizerModel = class extends Callable_default {
  /**
   * Creates a new instance of TokenizerModel.
   * @param config The configuration object for the TokenizerModel.
   */
  constructor(config) {
    super();
    this.config = config;
    this.vocab = [];
    this.tokens_to_ids = /* @__PURE__ */ new Map();
    this.unk_token_id = void 0;
    this.unk_token = void 0;
    this.end_of_word_suffix = void 0;
    this.fuse_unk = this.config.fuse_unk ?? false;
  }
  /**
   * Internal function to call the TokenizerModel instance.
   * @param tokens The tokens to encode.
   * @returns The encoded tokens.
   */
  _call(tokens) {
    let result = this.encode(tokens);
    if (this.fuse_unk) {
      result = fuse_unk(result, this.tokens_to_ids, this.unk_token_id);
    }
    return result;
  }
};
var TokenizerModel_default = TokenizerModel;
var WordPieceTokenizer = class extends TokenizerModel_default {
  /**
   * @param config The configuration object.
   */
  constructor(config) {
    super(config);
    this.max_input_chars_per_word = 100;
    this.tokens_to_ids = object_to_map(config.vocab);
    this.unk_token_id = this.tokens_to_ids.get(config.unk_token);
    this.unk_token = config.unk_token;
    this.max_input_chars_per_word = config.max_input_chars_per_word ?? 100;
    this.vocab = new Array(this.tokens_to_ids.size);
    for (const [key, value] of this.tokens_to_ids) {
      this.vocab[value] = key;
    }
  }
  /**
   * Encodes an array of tokens using WordPiece encoding.
   * @param tokens The tokens to encode.
   * @returns An array of encoded tokens.
   */
  encode(tokens) {
    const output_tokens = [];
    for (const token of tokens) {
      const chars = [...token];
      if (chars.length > this.max_input_chars_per_word) {
        output_tokens.push(this.unk_token);
        continue;
      }
      let is_unknown = false;
      let start = 0;
      const sub_tokens = [];
      while (start < chars.length) {
        let end = chars.length;
        let current_substring = null;
        while (start < end) {
          let substr = chars.slice(start, end).join("");
          if (start > 0) {
            substr = this.config.continuing_subword_prefix + substr;
          }
          if (this.tokens_to_ids.has(substr)) {
            current_substring = substr;
            break;
          }
          --end;
        }
        if (current_substring === null) {
          is_unknown = true;
          break;
        }
        sub_tokens.push(current_substring);
        start = end;
      }
      if (is_unknown) {
        output_tokens.push(this.unk_token);
      } else {
        output_tokens.push(...sub_tokens);
      }
    }
    return output_tokens;
  }
};
var WordPiece_default = WordPieceTokenizer;
var CharTrieNode = class _CharTrieNode {
  /**
   * Create a new CharTrieNode.
   * @param is_leaf Whether the node is a leaf node or not.
   * @param children A map containing the node's children, where the key is a character and the value is a `CharTrieNode`.
   */
  constructor(is_leaf, children) {
    this.is_leaf = is_leaf;
    this.children = children;
  }
  /**
   * Returns a new `CharTrieNode` instance with default values.
   * @returns A new `CharTrieNode` instance with `is_leaf` set to `false` and an empty `children` map.
   */
  static default() {
    return new _CharTrieNode(false, /* @__PURE__ */ new Map());
  }
};
var CharTrie = class {
  constructor() {
    this.root = CharTrieNode.default();
  }
  /**
   * Adds one or more `texts` to the trie.
   * @param texts The strings to add to the trie.
   */
  extend(texts) {
    for (const text of texts) {
      this.push(text);
    }
  }
  /**
   * Adds text to the trie.
   * @param text The string to add to the trie.
   */
  push(text) {
    let node = this.root;
    for (const ch of text) {
      let child = node.children.get(ch);
      if (child === void 0) {
        child = CharTrieNode.default();
        node.children.set(ch, child);
      }
      node = child;
    }
    node.is_leaf = true;
  }
  /**
   * Searches the trie for stored strings that match `chars` starting at `start`.
   * @param chars The input characters to search.
   * @param start The index to start searching from.
   * @yields Each stored string that is a prefix of `chars` starting at `start`.
   */
  *common_prefix_search(chars, start = 0) {
    let node = this.root;
    if (node === void 0) return;
    let prefix = "";
    for (let i = start; i < chars.length; ++i) {
      const ch = chars[i];
      prefix += ch;
      node = node.children.get(ch);
      if (node === void 0) return;
      if (node.is_leaf) {
        yield prefix;
      }
    }
  }
};
var CharTrie_default = CharTrie;
var TokenLatticeNode = class _TokenLatticeNode {
  /**
   * Represents a node in a token lattice for a given sentence.
   * @param token_id The ID of the token associated with this node.
   * @param node_id The ID of this node.
   * @param pos The starting position of the token in the sentence.
   * @param length The length of the token.
   * @param score The score associated with the token.
   */
  constructor(token_id, node_id, pos, length, score) {
    this.token_id = token_id;
    this.node_id = node_id;
    this.pos = pos;
    this.length = length;
    this.score = score;
    this.prev = null;
    this.backtrace_score = 0;
  }
  /**
   * Returns a clone of this node.
   * @returns A clone of this node.
   */
  clone() {
    const n = new _TokenLatticeNode(
      this.token_id,
      this.node_id,
      this.pos,
      this.length,
      this.score
    );
    n.prev = this.prev;
    n.backtrace_score = this.backtrace_score;
    return n;
  }
};
var TokenLattice = class {
  /**
   * Creates a new TokenLattice instance.
   *
   * @param sentence The input sentence to be tokenized.
   * @param bos_token_id The beginning-of-sequence token ID.
   * @param eos_token_id The end-of-sequence token ID.
   */
  constructor(sentence, bos_token_id, eos_token_id) {
    this.chars = Array.from(sentence);
    this.len = this.chars.length;
    this.bos_token_id = bos_token_id;
    this.eos_token_id = eos_token_id;
    this.nodes = [];
    this.begin_nodes = Array.from(
      { length: this.len + 1 },
      () => []
    );
    this.end_nodes = Array.from({ length: this.len + 1 }, () => []);
    const bos = new TokenLatticeNode(this.bos_token_id ?? 0, 0, 0, 0, 0);
    const eos = new TokenLatticeNode(
      this.eos_token_id ?? 0,
      1,
      this.len,
      0,
      0
    );
    this.nodes.push(bos.clone());
    this.nodes.push(eos.clone());
    this.begin_nodes[this.len].push(eos);
    this.end_nodes[0].push(bos);
  }
  /**
   * Inserts a new token node into the token lattice.
   *
   * @param pos The starting position of the token.
   * @param length The length of the token.
   * @param score The score of the token.
   * @param token_id The token ID of the token.
   */
  insert(pos, length, score, token_id) {
    const node_id = this.nodes.length;
    const node = new TokenLatticeNode(token_id, node_id, pos, length, score);
    this.begin_nodes[pos].push(node);
    this.end_nodes[pos + length].push(node);
    this.nodes.push(node);
  }
  /**
   * Implements the Viterbi algorithm to compute the most likely sequence of tokens.
   *
   * @returns The most likely sequence of tokens.
   */
  viterbi() {
    const len2 = this.len;
    let pos = 0;
    while (pos <= len2) {
      if (this.begin_nodes[pos].length == 0) {
        return [];
      }
      for (let rnode of this.begin_nodes[pos]) {
        rnode.prev = null;
        let best_score = 0;
        let best_node = null;
        for (let lnode of this.end_nodes[pos]) {
          const score = lnode.backtrace_score + rnode.score;
          if (best_node === null || score > best_score) {
            best_node = lnode.clone();
            best_score = score;
          }
        }
        if (best_node !== null) {
          rnode.prev = best_node;
          rnode.backtrace_score = best_score;
        } else {
          return [];
        }
      }
      ++pos;
    }
    const results = [];
    const root = this.begin_nodes[len2][0];
    const prev = root.prev;
    if (prev === null) {
      return [];
    }
    let node = prev.clone();
    while (node.prev !== null) {
      results.push(node.clone());
      const n = node.clone();
      node = n.prev.clone();
    }
    results.reverse();
    return results;
  }
  /**
   * Get the text piece for a given node.
   * @param node The node to get the piece for.
   * @returns The array of nodes representing the most likely sequence of tokens.
   */
  piece(node) {
    return this.chars.slice(node.pos, node.pos + node.length).join("");
  }
  /**
   * @returns The most likely sequence of tokens.
   */
  tokens() {
    const nodes = this.viterbi();
    return nodes.map((x) => this.piece(x));
  }
  /**
   * @returns The most likely sequence of token ids.
   */
  token_ids() {
    const nodes = this.viterbi();
    return nodes.map((x) => x.token_id);
  }
};
var TokenLattice_default = TokenLattice;
function min2(arr) {
  if (arr.length === 0) throw new Error("Array must not be empty");
  let min_value = arr[0];
  let index_of_min = 0;
  for (let i = 1; i < arr.length; ++i) {
    if (arr[i] < min_value) {
      min_value = arr[i];
      index_of_min = i;
    }
  }
  return [min_value, index_of_min];
}
var Unigram = class extends TokenizerModel_default {
  /**
   * Create a new Unigram tokenizer model.
   * @param config The configuration object for the Unigram model.
   * @param eos_token
   */
  constructor(config, eos_token) {
    super(config);
    const vocab_size = config.vocab.length;
    this.vocab = new Array(vocab_size);
    this.scores = new Array(vocab_size);
    for (let i = 0; i < vocab_size; ++i) {
      [this.vocab[i], this.scores[i]] = config.vocab[i];
    }
    this.unk_token_id = config.unk_id;
    this.unk_token = this.vocab[config.unk_id];
    this.tokens_to_ids = new Map(this.vocab.map((x, i) => [x, i]));
    this.bos_token = " ";
    this.bos_token_id = this.tokens_to_ids.get(this.bos_token);
    this.eos_token = eos_token;
    this.eos_token_id = this.tokens_to_ids.get(this.eos_token);
    this.unk_token = this.vocab[this.unk_token_id];
    this.min_score = min2(this.scores)[0];
    this.unk_score = this.min_score - 10;
    this.scores[this.unk_token_id] = this.unk_score;
    this.trie = new CharTrie_default();
    this.trie.extend(this.vocab);
    this.fuse_unk = true;
  }
  /**
   * Populates lattice nodes.
   * @param lattice The token lattice to populate with nodes.
   */
  populate_nodes(lattice) {
    const chars = lattice.chars;
    const mblen = 1;
    let begin_pos = 0;
    while (begin_pos < chars.length) {
      let has_single_node = false;
      const prefixed_tokens = this.trie.common_prefix_search(chars, begin_pos);
      for (const token of prefixed_tokens) {
        const token_id = this.tokens_to_ids.get(token);
        const token_score = this.scores[token_id];
        const n = len(token);
        lattice.insert(begin_pos, n, token_score, token_id);
        if (!has_single_node && n === mblen) {
          has_single_node = true;
        }
      }
      if (!has_single_node) {
        lattice.insert(begin_pos, mblen, this.unk_score, this.unk_token_id);
      }
      begin_pos += mblen;
    }
  }
  /**
   * Encodes an array of tokens into an array of subtokens using the unigram model.
   *
   * @param normalized The normalized string.
   * @returns An array of subtokens obtained by encoding the input tokens using the unigram model.
   */
  tokenize(normalized) {
    const lattice = new TokenLattice_default(
      normalized,
      this.bos_token_id,
      this.eos_token_id
    );
    this.populate_nodes(lattice);
    return lattice.tokens();
  }
  /**
   * Encodes an array of tokens using Unigram encoding.
   * @param tokens The tokens to encode.
   * @returns An array of encoded tokens.
   */
  encode(tokens) {
    const to_return = [];
    for (const token of tokens) {
      const tokenized = this.tokenize(token);
      to_return.push(...tokenized);
    }
    return to_return;
  }
};
var Unigram_default = Unigram;
var PriorityQueue = class {
  /**
   * Create a new PriorityQueue.
   * @param comparator Comparator function to determine priority. Defaults to a MaxHeap.
   * @param max_size Maximum size of the queue. Defaults to Infinity.
   */
  constructor(comparator = (a, b) => a > b, max_size = Infinity) {
    this._heap = [];
    this._comparator = comparator;
    this._max_size = max_size;
  }
  /**
   * The size of the queue
   */
  get size() {
    return this._heap.length;
  }
  /**
   * Check if the queue is empty.
   * @returns `true` if the queue is empty, `false` otherwise.
   */
  is_empty() {
    return this.size === 0;
  }
  /**
   * Return the element with the highest priority in the queue.
   * @returns The highest priority element in the queue.
   */
  peek() {
    return this._heap[0];
  }
  /**
   * Add one or more elements to the queue.
   * @param values The values to push into the queue.
   * @returns The new size of the queue.
   */
  push(...values) {
    return this.extend(values);
  }
  /**
   * Add multiple elements to the queue.
   * @param values The values to push into the queue.
   * @returns The new size of the queue.
   */
  extend(values) {
    for (const value of values) {
      if (this.size < this._max_size) {
        this._heap.push(value);
        this._sift_up();
      } else {
        const smallest = this._smallest();
        if (this._comparator(value, this._heap[smallest])) {
          this._heap[smallest] = value;
          this._sift_up_from(smallest);
        }
      }
    }
    return this.size;
  }
  /**
   * Remove and return the element with the highest priority in the queue.
   * @returns The element with the highest priority in the queue.
   */
  pop() {
    const popped_value = this.peek();
    const bottom = this.size - 1;
    if (bottom > 0) {
      this._swap(0, bottom);
    }
    this._heap.pop();
    this._sift_down();
    return popped_value;
  }
  /**
   * Replace the element with the highest priority in the queue with a new value.
   * @param value The new value.
   * @returns The replaced value.
   */
  replace(value) {
    const replaced_value = this.peek();
    this._heap[0] = value;
    this._sift_down();
    return replaced_value;
  }
  /**
   * Compute the index for the parent of the node at index `i`.
   * @param i The index of the node to get the parent of.
   * @returns The index of the parent node.
   * @private
   */
  _parent(i) {
    return (i + 1 >>> 1) - 1;
  }
  /**
   * Compute the index for the left child of the node at index `i`.
   * @param i The index of the node to get the left child of.
   * @returns The index of the left child.
   * @private
   */
  _left(i) {
    return (i << 1) + 1;
  }
  /**
   * Compute the index for the right child of the node at index `i`.
   * @param i The index of the node to get the right child of.
   * @returns The index of the right child.
   * @private
   */
  _right(i) {
    return i + 1 << 1;
  }
  /**
   * Check if the element at index `i` is greater than the element at index `j`.
   * @param i The index of the first element to compare.
   * @param j The index of the second element to compare.
   * @returns `true` if the element at index `i` is greater than the element at index `j`, `false` otherwise.
   * @private
   */
  _greater(i, j) {
    return this._comparator(this._heap[i], this._heap[j]);
  }
  /**
   * Swap the elements at indices `i` and `j`.
   * @param i The index of the first element to swap.
   * @param j The index of the second element to swap.
   * @private
   */
  _swap(i, j) {
    const temp = this._heap[i];
    this._heap[i] = this._heap[j];
    this._heap[j] = temp;
  }
  /**
   * Maintain the heap property by updating positions in the heap,
   * starting at the last element and moving up the heap.
   * @private
   */
  _sift_up() {
    this._sift_up_from(this.size - 1);
  }
  /**
   * Helper function to sift up from a given node.
   * @param node The index of the node to start sifting up from.
   */
  _sift_up_from(node) {
    while (node > 0 && this._greater(node, this._parent(node))) {
      this._swap(node, this._parent(node));
      node = this._parent(node);
    }
  }
  /**
   * Maintain the heap property by updating positions in the heap,
   * starting at the first element and moving down the heap.
   * @private
   */
  _sift_down() {
    let node = 0;
    while (this._left(node) < this.size && this._greater(this._left(node), node) || this._right(node) < this.size && this._greater(this._right(node), node)) {
      const max_child = this._right(node) < this.size && this._greater(this._right(node), this._left(node)) ? this._right(node) : this._left(node);
      this._swap(node, max_child);
      node = max_child;
    }
  }
  /**
   * Get the index of the smallest element in the heap. Since we use an array-based heap,
   * the index can be computed without needing to traverse the heap.
   * @private
   */
  _smallest() {
    return 2 ** Math.floor(Math.log2(this.size)) - 1;
  }
};
var PriorityQueue_default = PriorityQueue;
var LRUCache2 = class {
  /**
   * Creates an LRUCache instance.
   * @param capacity The maximum number of items the cache can hold.
   */
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = /* @__PURE__ */ new Map();
  }
  /**
   * Retrieves the value associated with the given key and marks the key as recently used.
   * @param key The key to retrieve.
   * @returns The value associated with the key, or undefined if the key does not exist.
   */
  get(key) {
    if (!this.cache.has(key)) return void 0;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }
  /**
   * Inserts or updates the key-value pair in the cache.
   * If the key already exists, it is updated and marked as recently used.
   * If the cache exceeds its capacity, the least recently used item is evicted.
   * @param key The key to add or update.
   * @param value The value to associate with the key.
   */
  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    this.cache.set(key, value);
    if (this.cache.size > this.capacity) {
      this.cache.delete(this.cache.keys().next().value);
    }
  }
  /**
   * Clears the cache.
   */
  clear() {
    this.cache.clear();
  }
};
var LRUCache_default = LRUCache2;
var BPE = class extends TokenizerModel_default {
  /**
   * Create a BPE instance.
   * @param config The configuration object for BPE.
   */
  constructor(config) {
    super(config);
    this.tokens_to_ids = object_to_map(config.vocab);
    this.unk_token_id = this.tokens_to_ids.get(config.unk_token);
    this.unk_token = config.unk_token;
    this.vocab = new Array(this.tokens_to_ids.size);
    for (const [key, value] of this.tokens_to_ids) {
      this.vocab[value] = key;
    }
    const use_new_merge_format = Array.isArray(config.merges[0]);
    this.merges = use_new_merge_format ? config.merges : config.merges.map(
      (x) => x.split(" ", 2)
    );
    this.bpe_ranks = new Map(this.merges.map((x, i) => [JSON.stringify(x), i]));
    this.end_of_word_suffix = config.end_of_word_suffix;
    this.continuing_subword_suffix = config.continuing_subword_suffix ?? null;
    this.byte_fallback = this.config.byte_fallback ?? false;
    if (this.byte_fallback) {
      this.text_encoder = new TextEncoder();
    }
    this.ignore_merges = this.config.ignore_merges ?? false;
    this.max_length_to_cache = 256;
    this.cache_capacity = 1e4;
    this.cache = new LRUCache_default(this.cache_capacity);
  }
  /**
   * Clears the cache.
   */
  clear_cache() {
    this.cache.clear();
  }
  /**
   * Apply Byte-Pair-Encoding (BPE) to a given token. Efficient heap-based priority
   * queue implementation adapted from https://github.com/belladoreai/llama-tokenizer-js.
   * @param token The token to encode.
   * @returns The BPE encoded tokens.
   */
  bpe(token) {
    if (token.length === 0) {
      return [];
    }
    const cached = this.cache.get(token);
    if (cached !== void 0) {
      return cached;
    }
    const word = Array.from(token);
    if (this.end_of_word_suffix) {
      word[word.length - 1] += this.end_of_word_suffix;
    }
    let result = [];
    if (word.length > 1) {
      const queue = new PriorityQueue_default((a, b) => a.score < b.score);
      let starting_node = {
        token: word[0],
        bias: 0,
        prev: null,
        next: null
      };
      let previous_node = starting_node;
      for (let i = 1; i < word.length; ++i) {
        const current_node = {
          bias: i / word.length,
          // Add fractional component to break ties
          token: word[i],
          prev: previous_node,
          next: null
        };
        previous_node.next = current_node;
        this.add_node(queue, previous_node);
        previous_node = current_node;
      }
      while (!queue.is_empty()) {
        const node = queue.pop();
        if (node.deleted || !node.next || node.next.deleted) continue;
        node.deleted = true;
        node.next.deleted = true;
        if (node.prev) {
          const new_previous_node = { ...node.prev };
          node.prev.deleted = true;
          node.prev = new_previous_node;
          if (new_previous_node.prev) {
            new_previous_node.prev.next = new_previous_node;
          } else {
            starting_node = new_previous_node;
          }
        }
        const merged = {
          token: node.token + node.next.token,
          bias: node.bias,
          prev: node.prev,
          next: node.next.next
        };
        if (merged.prev) {
          merged.prev.next = merged;
          this.add_node(queue, merged.prev);
        } else {
          starting_node = merged;
        }
        if (merged.next) {
          merged.next.prev = merged;
          this.add_node(queue, merged);
        }
      }
      for (let current_node = starting_node; current_node !== null; current_node = current_node.next) {
        result.push(current_node.token);
      }
    } else {
      result = word;
    }
    if (this.continuing_subword_suffix) {
      for (let i = 0; i < result.length - 1; ++i) {
        result[i] += this.continuing_subword_suffix;
      }
    }
    if (token.length < this.max_length_to_cache) {
      this.cache.put(token, result);
    }
    return result;
  }
  /**
   * Helper function to add a node to the priority queue.
   * @param queue
   * @param node
   */
  add_node(queue, node) {
    const rank = this.bpe_ranks.get(
      JSON.stringify([node.token, node.next.token])
    );
    if (rank !== void 0) {
      node.score = rank + node.bias;
      queue.push(node);
    }
  }
  /**
   * Encodes the input sequence of tokens using the BPE algorithm and returns the resulting subword tokens.
   * @param tokens The input sequence of tokens to encode.
   * @returns The resulting subword tokens after applying the BPE algorithm to the input sequence of tokens.
   */
  encode(tokens) {
    const output_tokens = [];
    for (const token of tokens) {
      if (this.ignore_merges && this.tokens_to_ids.has(token)) {
        output_tokens.push(token);
        continue;
      }
      const bpe_token_list = this.bpe(token);
      for (const t of bpe_token_list) {
        if (this.tokens_to_ids.has(t)) {
          output_tokens.push(t);
        } else if (this.byte_fallback) {
          const byte_tokens = Array.from(this.text_encoder.encode(t)).map(
            (x) => `<0x${x.toString(16).toUpperCase().padStart(2, "0")}>`
          );
          if (byte_tokens.every((x) => this.tokens_to_ids.has(x))) {
            output_tokens.push(...byte_tokens);
          } else if (this.unk_token != null) {
            output_tokens.push(this.unk_token);
          }
        } else if (this.unk_token != null) {
          output_tokens.push(this.unk_token);
        }
      }
    }
    return output_tokens;
  }
};
var BPE_default = BPE;
var Legacy = class extends TokenizerModel_default {
  /**
   * Create a Legacy tokenizer model instance.
   * @param config The configuration object for Legacy tokenizer model.
   * @param more_config Additional configuration object for the Legacy tokenizer model.
   */
  constructor(config, more_config) {
    super(config);
    const vocab = config.vocab;
    this.tokens_to_ids = object_to_map(
      more_config.target_lang ? vocab[more_config.target_lang] : vocab
    );
    this.bos_token = more_config.bos_token;
    this.bos_token_id = this.tokens_to_ids.get(this.bos_token);
    this.eos_token = more_config.eos_token;
    this.eos_token_id = this.tokens_to_ids.get(this.eos_token);
    this.pad_token = more_config.pad_token;
    this.pad_token_id = this.tokens_to_ids.get(this.pad_token);
    this.unk_token = more_config.unk_token;
    this.unk_token_id = this.tokens_to_ids.get(this.unk_token);
    this.vocab = new Array(this.tokens_to_ids.size);
    for (const [key, value] of this.tokens_to_ids) {
      this.vocab[value] = key;
    }
  }
  encode(tokens) {
    return tokens;
  }
};
var Legacy_default = Legacy;
function create_tokenizer_model(model_config, config) {
  switch (model_config.type) {
    case "WordPiece":
      return new WordPiece_default(model_config);
    case "Unigram":
      return new Unigram_default(model_config, config.eos_token);
    case "BPE":
      return new BPE_default(model_config);
    default:
      if (model_config.vocab) {
        if (Array.isArray(model_config.vocab)) {
          return new Unigram_default(model_config, config.eos_token);
        } else if (Object.hasOwn(model_config, "continuing_subword_prefix") && Object.hasOwn(model_config, "unk_token")) {
          if (Object.hasOwn(model_config, "merges")) {
            return new BPE_default(model_config);
          } else {
            return new WordPiece_default(model_config);
          }
        } else {
          return new Legacy_default(model_config, {
            target_lang: config.target_lang,
            bos_token: config.bos_token,
            eos_token: config.eos_token,
            pad_token: config.pad_token,
            unk_token: config.unk_token
          });
        }
      }
      throw new Error(
        `Unknown TokenizerModel type: ${model_config?.type}`
      );
  }
}
var create_tokenizer_model_default = create_tokenizer_model;
var PostProcessor = class extends Callable_default {
  /**
   * @param config The configuration for the post-processor.
   */
  constructor(config) {
    super();
    this.config = config;
  }
  /**
   * Alias for {@link PostProcessor#post_process}.
   * @param tokens The text or array of texts to post-process.
   * @param args Additional arguments required by the post-processing logic.
   * @returns The post-processed tokens.
   */
  _call(tokens, ...args) {
    return this.post_process(tokens, ...args);
  }
};
var PostProcessor_default = PostProcessor;
var TemplateProcessing = class extends PostProcessor_default {
  /**
   * Replaces special tokens in the template with actual tokens.
   * @param tokens The list of tokens for the first sequence.
   * @param tokens_pair The list of tokens for the second sequence (optional).
   * @param add_special_tokens Whether to add the special tokens to the beginning and end of the input.
   * @returns An object containing the list of tokens with the special tokens replaced with actual tokens.
   */
  post_process(tokens, tokens_pair = null, add_special_tokens = true) {
    const type = tokens_pair === null ? this.config.single : this.config.pair;
    let processed_tokens = [];
    let types = [];
    for (const item of type) {
      if ("SpecialToken" in item) {
        if (add_special_tokens) {
          processed_tokens.push(item.SpecialToken.id);
          types.push(item.SpecialToken.type_id);
        }
      } else if ("Sequence" in item) {
        if (item.Sequence.id === "A") {
          processed_tokens = merge_arrays(processed_tokens, tokens);
          types = merge_arrays(
            types,
            new Array(tokens.length).fill(item.Sequence.type_id)
          );
        } else if (item.Sequence.id === "B") {
          processed_tokens = merge_arrays(processed_tokens, tokens_pair);
          types = merge_arrays(
            types,
            new Array(tokens_pair.length).fill(item.Sequence.type_id)
          );
        }
      }
    }
    return { tokens: processed_tokens, token_type_ids: types };
  }
};
var TemplateProcessing_default = TemplateProcessing;
var ByteLevel2 = class extends PostProcessor_default {
  /**
   * Post process the given tokens.
   * @param tokens The list of tokens for the first sequence.
   * @param tokens_pair The list of tokens for the second sequence (optional).
   * @returns An object containing the post-processed tokens.
   */
  post_process(tokens, tokens_pair = null) {
    return { tokens, tokens_pair };
  }
};
var ByteLevel_default2 = ByteLevel2;
var BertProcessing = class extends PostProcessor_default {
  /**
   * @param config The configuration for the post-processor.
   * @param config.cls The special tokens to add to the beginning of the input.
   * @param config.sep The special tokens to add to the end of the input.
   */
  constructor(config) {
    super(config);
    this.sep = config.sep;
    this.cls = config.cls;
  }
  /**
   * Adds the special tokens to the beginning and end of the input.
   * @param tokens The input tokens.
   * @param tokens_pair An optional second set of input tokens.
   * @param add_special_tokens Whether to add the special tokens to the beginning and end of the input.
   * @returns The post-processed tokens with the special tokens added to the beginning and end.
   */
  post_process(tokens, tokens_pair = null, add_special_tokens = true) {
    if (add_special_tokens) {
      tokens = merge_arrays([this.cls[0]], tokens, [this.sep[0]]);
    }
    let token_type_ids = new Array(tokens.length).fill(0);
    if (tokens_pair) {
      const middle = [];
      const after = add_special_tokens ? [this.sep[0]] : [];
      tokens = merge_arrays(tokens, middle, tokens_pair, after);
      token_type_ids = merge_arrays(
        token_type_ids,
        new Array(tokens_pair.length + middle.length + after.length).fill(1)
      );
    }
    return { tokens, token_type_ids };
  }
};
var BertProcessing_default = BertProcessing;
var RobertaProcessing = class extends PostProcessor_default {
  /**
   * @param config The configuration for the post-processor.
   * @param config.cls The special tokens to add to the beginning of the input.
   * @param config.sep The special tokens to add to the end of the input.
   */
  constructor(config) {
    super(config);
    this.sep = config.sep;
    this.cls = config.cls;
  }
  /**
   * Adds the special tokens to the beginning and end of the input.
   * @param tokens The input tokens.
   * @param tokens_pair An optional second set of input tokens.
   * @param add_special_tokens Whether to add the special tokens to the beginning and end of the input.
   * @returns The post-processed tokens with the special tokens added to the beginning and end.
   */
  post_process(tokens, tokens_pair, add_special_tokens = true) {
    if (add_special_tokens) {
      tokens = merge_arrays([this.cls[0]], tokens, [this.sep[0]]);
    }
    let token_type_ids = new Array(tokens.length).fill(0);
    if (tokens_pair) {
      const middle = add_special_tokens ? [this.sep[0]] : [];
      const after = add_special_tokens ? [this.sep[0]] : [];
      tokens = merge_arrays(tokens, middle, tokens_pair, after);
      token_type_ids = merge_arrays(
        token_type_ids,
        new Array(tokens_pair.length + middle.length + after.length).fill(1)
      );
    }
    return { tokens, token_type_ids };
  }
};
var RobertaProcessing_default = RobertaProcessing;
var Sequence3 = class extends PostProcessor_default {
  /**
   * Creates a new instance of Sequence post-processor.
   * @param config The configuration object.
   */
  constructor(config) {
    super(config);
    this.processors = (config.processors ?? []).map((x) => create_post_processor_default(x));
  }
  /**
   * Post process the given tokens.
   * @param tokens The list of tokens for the first sequence.
   * @param tokens_pair The list of tokens for the second sequence (optional).
   * @param add_special_tokens Whether to add the special tokens to the beginning and end of the input.
   * @returns An object containing the post-processed tokens.
   */
  post_process(tokens, tokens_pair = null, add_special_tokens = true) {
    let processed_tokens = { tokens, tokens_pair };
    for (const processor of this.processors) {
      processed_tokens = processor.post_process(
        processed_tokens.tokens,
        processed_tokens.tokens_pair,
        add_special_tokens
      );
    }
    return processed_tokens;
  }
};
var Sequence_default3 = Sequence3;
function create_post_processor(config) {
  if (config === null) return null;
  switch (config.type) {
    case "TemplateProcessing":
      return new TemplateProcessing_default(config);
    case "ByteLevel":
      return new ByteLevel_default2(config);
    case "BertProcessing":
      return new BertProcessing_default(config);
    case "RobertaProcessing":
      return new RobertaProcessing_default(config);
    case "Sequence":
      return new Sequence_default3(config);
    default:
      throw new Error(`Unknown PostProcessor type: ${config.type}`);
  }
}
var create_post_processor_default = create_post_processor;
var Decoder = class extends Callable_default {
  /**
   * Creates an instance of `Decoder`.
   * @param config The configuration object.
   **/
  constructor(config) {
    super();
    this.config = config;
    this.added_tokens = [];
    this.end_of_word_suffix = null;
    this.trim_offsets = "trim_offsets" in config ? config.trim_offsets : false;
  }
  /**
   * Calls the `decode` method.
   *
   * @param tokens The list of tokens.
   * @returns The decoded string.
   */
  _call(tokens) {
    return this.decode(tokens);
  }
  /**
   * Decodes a list of tokens.
   * @param tokens The list of tokens.
   * @returns The decoded string.
   */
  decode(tokens) {
    return this.decode_chain(tokens).join("");
  }
};
var Decoder_default = Decoder;
var ByteLevel3 = class extends Decoder_default {
  /**
   * Create a `ByteLevelDecoder` object.
   */
  constructor(config) {
    super(config);
    this.byte_decoder = UNICODE_TO_BYTES;
    this.text_decoder = new TextDecoder("utf-8", {
      fatal: false,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      ignoreBOM: true
    });
    this.end_of_word_suffix = null;
  }
  /**
   * Convert an array of tokens to string by decoding each byte.
   * @param tokens Array of tokens to be decoded.
   * @returns The decoded string.
   */
  convert_tokens_to_string(tokens) {
    const text = tokens.join("");
    const byte_array = new Uint8Array(
      [...text].map((c) => this.byte_decoder[c])
    );
    return this.text_decoder.decode(byte_array);
  }
  decode_chain(tokens) {
    const sub_texts = [];
    let current_sub_text = [];
    for (const token of tokens) {
      if (this.added_tokens.find((x) => x.content === token) !== void 0) {
        if (current_sub_text.length > 0) {
          sub_texts.push(this.convert_tokens_to_string(current_sub_text));
          current_sub_text = [];
        }
        sub_texts.push(token);
      } else {
        current_sub_text.push(token);
      }
    }
    if (current_sub_text.length > 0) {
      sub_texts.push(this.convert_tokens_to_string(current_sub_text));
    }
    return sub_texts;
  }
};
var ByteLevel_default3 = ByteLevel3;
var WordPiece = class extends Decoder_default {
  /**
   * Creates a new instance of WordPieceDecoder.
   * @param config The configuration object.
   */
  constructor(config) {
    super(config);
    this.cleanup = config.cleanup;
  }
  decode_chain(tokens) {
    return tokens.map((token, i) => {
      if (i !== 0) {
        const prefix = this.config.prefix;
        if (prefix && token.startsWith(prefix)) {
          token = token.replace(prefix, "");
        } else {
          token = " " + token;
        }
      }
      if (this.cleanup) {
        token = clean_up_tokenization(token);
      }
      return token;
    });
  }
};
var WordPiece_default2 = WordPiece;
var Metaspace2 = class extends Decoder_default {
  /**
   * Constructs a new MetaspaceDecoder object.
   * @param config The configuration object for the MetaspaceDecoder.
   */
  constructor(config) {
    super(config);
    this.replacement = config.replacement ?? "\u2581";
  }
  decode_chain(tokens) {
    const result = [];
    for (let i = 0; i < tokens.length; ++i) {
      let normalized = tokens[i].replaceAll(this.replacement, " ");
      if (i == 0 && normalized.startsWith(" ")) {
        normalized = normalized.substring(1);
      }
      result.push(normalized);
    }
    return result;
  }
};
var Metaspace_default2 = Metaspace2;
var BPE2 = class extends Decoder_default {
  constructor(config) {
    super(config);
    this.suffix = config.suffix ?? "";
  }
  decode_chain(tokens) {
    return tokens.map((token, i) => {
      return token.replaceAll(this.suffix, i === tokens.length - 1 ? "" : " ");
    });
  }
};
var BPE_default2 = BPE2;
var CTC = class extends Decoder_default {
  constructor(config) {
    super(config);
    this.pad_token = config.pad_token ?? "";
    this.word_delimiter_token = config.word_delimiter_token ?? "";
    this.cleanup = config.cleanup;
  }
  /**
   * Converts a connectionist-temporal-classification (CTC) output tokens into a single string.
   * @param tokens Array of tokens to be decoded.
   * @returns The decoded string.
   */
  convert_tokens_to_string(tokens) {
    if (tokens.length === 0) return "";
    const grouped_tokens = [tokens[0]];
    for (let i = 1; i < tokens.length; ++i) {
      if (tokens[i] !== grouped_tokens.at(-1)) {
        grouped_tokens.push(tokens[i]);
      }
    }
    const filtered_tokens = grouped_tokens.filter(
      (token) => token !== this.pad_token
    );
    let text = filtered_tokens.join("");
    if (this.cleanup) {
      text = clean_up_tokenization(text).replaceAll(this.word_delimiter_token, " ").trim();
    }
    return text;
  }
  decode_chain(tokens) {
    return [this.convert_tokens_to_string(tokens)];
  }
};
var CTC_default = CTC;
var Sequence4 = class extends Decoder_default {
  /**
   * Creates a new instance of DecoderSequence.
   * @param config The configuration object.
   */
  constructor(config) {
    super(config);
    this.decoders = (config.decoders ?? []).map((x) => create_decoder_default(x));
  }
  decode_chain(tokens) {
    return this.decoders.reduce((toks, decoder) => {
      return decoder.decode_chain(toks);
    }, tokens);
  }
};
var Sequence_default4 = Sequence4;
var Replace3 = class extends Decoder_default {
  /**
   * @param config The configuration object for the decoder.
   */
  constructor(config) {
    super(config);
    this.pattern = create_pattern(this.config.pattern);
  }
  decode_chain(tokens) {
    const content = this.config.content ?? "";
    const pattern = this.pattern;
    return pattern === null ? tokens : tokens.map((token) => token.replaceAll(pattern, content));
  }
};
var Replace_default3 = Replace3;
var Fuse = class extends Decoder_default {
  decode_chain(tokens) {
    return [tokens.join("")];
  }
};
var Fuse_default = Fuse;
var Strip2 = class extends Decoder_default {
  constructor(config) {
    super(config);
    this.content = config.content ?? "";
    this.start = config.start ?? 0;
    this.stop = config.stop ?? 0;
  }
  decode_chain(tokens) {
    return tokens.map((token) => {
      let start_cut = 0;
      for (let i = 0; i < this.start; ++i) {
        if (token[i] === this.content) {
          start_cut = i + 1;
          continue;
        } else {
          break;
        }
      }
      let stop_cut = token.length;
      for (let i = 0; i < this.stop; ++i) {
        const index = token.length - i - 1;
        if (token[index] === this.content) {
          stop_cut = index;
          continue;
        } else {
          break;
        }
      }
      return token.slice(start_cut, stop_cut);
    });
  }
};
var Strip_default2 = Strip2;
var ByteFallback = class extends Decoder_default {
  constructor(config) {
    super(config);
    this.text_decoder = new TextDecoder();
  }
  decode_chain(tokens) {
    const new_tokens = [];
    let previous_byte_tokens = [];
    for (const token of tokens) {
      let bytes = null;
      if (token.length === 6 && token.startsWith("<0x") && token.endsWith(">")) {
        const byte = parseInt(token.slice(3, 5), 16);
        if (!isNaN(byte)) {
          bytes = byte;
        }
      }
      if (bytes !== null) {
        previous_byte_tokens.push(bytes);
      } else {
        if (previous_byte_tokens.length > 0) {
          const string = this.text_decoder.decode(
            Uint8Array.from(previous_byte_tokens)
          );
          new_tokens.push(string);
          previous_byte_tokens = [];
        }
        new_tokens.push(token);
      }
    }
    if (previous_byte_tokens.length > 0) {
      const string = this.text_decoder.decode(
        Uint8Array.from(previous_byte_tokens)
      );
      new_tokens.push(string);
      previous_byte_tokens = [];
    }
    return new_tokens;
  }
};
var ByteFallback_default = ByteFallback;
function create_decoder(config) {
  if (config === null) return null;
  switch (config.type) {
    case "ByteLevel":
      return new ByteLevel_default3(config);
    case "WordPiece":
      return new WordPiece_default2(config);
    case "Metaspace":
      return new Metaspace_default2(config);
    case "BPEDecoder":
      return new BPE_default2(config);
    case "CTC":
      return new CTC_default(config);
    case "Sequence":
      return new Sequence_default4(config);
    case "Replace":
      return new Replace_default3(config);
    case "Fuse":
      return new Fuse_default(config);
    case "Strip":
      return new Strip_default2(config);
    case "ByteFallback":
      return new ByteFallback_default(config);
    default:
      throw new Error(`Unknown Decoder type: ${config.type}`);
  }
}
var create_decoder_default = create_decoder;
var Tokenizer = class {
  constructor(tokenizer, config) {
    const tokenizer_error = validate_object(tokenizer, "Tokenizer", [
      "model",
      "decoder",
      "post_processor",
      "pre_tokenizer",
      "normalizer"
    ]);
    if (tokenizer_error) {
      throw new Error(tokenizer_error);
    }
    const config_error = validate_object(config, "Config");
    if (config_error) {
      throw new Error(config_error);
    }
    this.tokenizer = tokenizer;
    this.config = config;
    this.normalizer = create_normalizer_default(this.tokenizer.normalizer);
    this.pre_tokenizer = create_pre_tokenizer_default(this.tokenizer.pre_tokenizer);
    this.model = create_tokenizer_model_default(this.tokenizer.model, this.config);
    this.post_processor = create_post_processor_default(this.tokenizer.post_processor);
    this.decoder = create_decoder_default(this.tokenizer.decoder);
    this.special_tokens = [];
    this.all_special_ids = [];
    this.added_tokens = [];
    const unnormalized_contents = [];
    const normalized_contents = [];
    this.added_tokens_map = /* @__PURE__ */ new Map();
    for (const added_token of this.tokenizer.added_tokens) {
      const token = new AddedToken_default(added_token);
      this.added_tokens.push(token);
      this.model.tokens_to_ids.set(token.content, token.id);
      this.model.vocab[token.id] = token.content;
      if (token.special) {
        this.special_tokens.push(token.content);
        this.all_special_ids.push(token.id);
      }
      this.added_tokens_map.set(token.content, token);
      if (token.normalized && this.normalizer !== null) {
        const normalized_content = this.normalizer(token.content);
        normalized_contents.push(normalized_content);
        this.added_tokens_map.set(normalized_content, token);
      } else {
        unnormalized_contents.push(token.content);
      }
    }
    (this.config.additional_special_tokens ?? []).forEach((token) => {
      if (!this.special_tokens.includes(token)) this.special_tokens.push(token);
    });
    if (this.decoder) {
      this.decoder.added_tokens = this.added_tokens;
      this.decoder.end_of_word_suffix = this.model.end_of_word_suffix;
    }
    this.splitter_unnormalized = new DictionarySplitter_default(unnormalized_contents);
    this.splitter_normalized = new DictionarySplitter_default(normalized_contents);
    this.remove_space = this.config.remove_space;
    this.clean_up_tokenization_spaces = this.config.clean_up_tokenization_spaces ?? true;
    this.do_lowercase_and_remove_accent = this.config.do_lowercase_and_remove_accent ?? false;
  }
  // Implementation
  encode(text, {
    text_pair = null,
    add_special_tokens = true,
    return_token_type_ids = null
  } = {}) {
    const { tokens, token_type_ids } = this.tokenize_helper(text, {
      text_pair,
      add_special_tokens
    });
    const input_ids = tokens.map(
      (t) => this.added_tokens_map.get(t)?.id ?? this.model.tokens_to_ids.get(t) ?? this.model.unk_token_id
    );
    const result = {
      ids: input_ids,
      tokens,
      attention_mask: new Array(input_ids.length).fill(1)
    };
    if (return_token_type_ids && token_type_ids) {
      result.token_type_ids = token_type_ids;
    }
    return result;
  }
  decode(token_ids, options = {}) {
    if (!Array.isArray(token_ids) || token_ids.length === 0 || !is_integral_number(token_ids[0])) {
      throw Error("token_ids must be a non-empty array of integers.");
    }
    let tokens = token_ids.map(
      (i) => this.model.vocab[Number(i)] ?? this.model.unk_token
    );
    if (options.skip_special_tokens) {
      tokens = tokens.filter((x) => !this.special_tokens.includes(x));
    }
    let decoded = this.decoder ? this.decoder(tokens) : tokens.join(" ");
    if (this.decoder && this.decoder.end_of_word_suffix) {
      decoded = decoded.replaceAll(this.decoder.end_of_word_suffix, " ");
      if (options.skip_special_tokens) {
        decoded = decoded.trim();
      }
    }
    if (options.clean_up_tokenization_spaces ?? this.clean_up_tokenization_spaces) {
      decoded = clean_up_tokenization(decoded);
    }
    return decoded;
  }
  /**
   * Converts a string into a sequence of tokens.
   * @param text The sequence to be encoded.
   * @param options An optional object containing the following properties:
   * @returns The list of tokens.
   */
  tokenize(text, { text_pair = null, add_special_tokens = false } = {}) {
    return this.tokenize_helper(text, { text_pair, add_special_tokens }).tokens;
  }
  encode_text(text) {
    if (text === null) {
      return null;
    }
    const sections = this.splitter_unnormalized.split(text);
    sections.forEach((section, i) => {
      const added_token = this.added_tokens_map.get(section);
      if (added_token) {
        if (added_token.lstrip && i > 0) {
          sections[i - 1] = sections[i - 1].trimEnd();
        }
        if (added_token.rstrip && i < sections.length - 1) {
          sections[i + 1] = sections[i + 1].trimStart();
        }
      }
    });
    return sections.flatMap((processed_text, section_index) => {
      if (processed_text.length === 0) {
        return [];
      }
      if (this.added_tokens_map.has(processed_text)) {
        return [processed_text];
      }
      if (this.remove_space === true) {
        processed_text = processed_text.trim().split(/\s+/).join(" ");
      }
      if (this.do_lowercase_and_remove_accent) {
        processed_text = lowercase_and_remove_accents(processed_text);
      }
      if (this.normalizer !== null) {
        processed_text = this.normalizer(processed_text);
      }
      if (processed_text.length === 0) {
        return [];
      }
      const subsections = this.splitter_normalized.split(processed_text);
      subsections.forEach((subsection, j) => {
        const added_token = this.added_tokens_map.get(subsection);
        if (added_token) {
          if (added_token.lstrip && j > 0) {
            subsections[j - 1] = subsections[j - 1].trimEnd();
          }
          if (added_token.rstrip && j < subsections.length - 1) {
            subsections[j + 1] = subsections[j + 1].trimStart();
          }
        }
      });
      return subsections.flatMap((subsection) => {
        if (subsection.length === 0) {
          return [];
        }
        if (this.added_tokens_map.has(subsection)) {
          return [subsection];
        }
        const section_tokens = this.pre_tokenizer !== null ? this.pre_tokenizer(subsection, {
          section_index
        }) : [subsection];
        return this.model(section_tokens);
      });
    });
  }
  tokenize_helper(text, { text_pair = null, add_special_tokens = true }) {
    const tokens1 = this.encode_text(text);
    const tokens2 = this.encode_text(text_pair || null);
    return this.post_processor ? this.post_processor(tokens1, tokens2, add_special_tokens) : { tokens: merge_arrays(tokens1 ?? [], tokens2 ?? []) };
  }
  /**
   * Converts a token string to its corresponding token ID.
   * @param token The token string to convert.
   * @returns The token ID, or undefined if the token is not in the vocabulary.
   */
  token_to_id(token) {
    return this.model.tokens_to_ids.get(token);
  }
  /**
   * Converts a token ID to its corresponding token string.
   * @param id The token ID to convert.
   * @returns The token string, or undefined if the ID is not in the vocabulary.
   */
  id_to_token(id) {
    return this.model.vocab[id];
  }
  /**
   * Returns a mapping of token IDs to AddedToken objects for all added tokens.
   * @returns A Map where keys are token IDs and values are AddedToken objects.
   */
  get_added_tokens_decoder() {
    const decoder = /* @__PURE__ */ new Map();
    for (const token of this.added_tokens) {
      decoder.set(token.id, token);
    }
    return decoder;
  }
  /**
   * Get the underlying vocabulary
   * @param with_added_tokens Whether to include the added tokens
   * @returns The vocabulary
   */
  get_vocab(with_added_tokens = true) {
    const vocab = /* @__PURE__ */ new Map();
    for (let i = 0; i < this.model.vocab.length; ++i) {
      const token = this.model.vocab[i];
      if (with_added_tokens || !this.added_tokens_map.has(token)) {
        vocab.set(token, i);
      }
    }
    return vocab;
  }
};
var Tokenizer_default = Tokenizer;

// node_modules/@huggingface/jinja/dist/index.js
var __defProp2 = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var TOKEN_TYPES = Object.freeze({
  Text: "Text",
  // The text between Jinja statements or expressions
  NumericLiteral: "NumericLiteral",
  // e.g., 123, 1.0
  StringLiteral: "StringLiteral",
  // 'string'
  Identifier: "Identifier",
  // Variables, functions, statements, booleans, etc.
  Equals: "Equals",
  // =
  OpenParen: "OpenParen",
  // (
  CloseParen: "CloseParen",
  // )
  OpenStatement: "OpenStatement",
  // {%
  CloseStatement: "CloseStatement",
  // %}
  OpenExpression: "OpenExpression",
  // {{
  CloseExpression: "CloseExpression",
  // }}
  OpenSquareBracket: "OpenSquareBracket",
  // [
  CloseSquareBracket: "CloseSquareBracket",
  // ]
  OpenCurlyBracket: "OpenCurlyBracket",
  // {
  CloseCurlyBracket: "CloseCurlyBracket",
  // }
  Comma: "Comma",
  // ,
  Dot: "Dot",
  // .
  Colon: "Colon",
  // :
  Pipe: "Pipe",
  // |
  CallOperator: "CallOperator",
  // ()
  AdditiveBinaryOperator: "AdditiveBinaryOperator",
  // + - ~
  MultiplicativeBinaryOperator: "MultiplicativeBinaryOperator",
  // * / // %
  ExponentiationBinaryOperator: "ExponentiationBinaryOperator",
  // **
  ComparisonBinaryOperator: "ComparisonBinaryOperator",
  // < > <= >= == !=
  UnaryOperator: "UnaryOperator",
  // ! - +
  Comment: "Comment"
  // {# ... #}
});
var Token = class {
  /**
   * Constructs a new Token.
   * @param {string} value The raw value as seen inside the source code.
   * @param {TokenType} type The type of token.
   */
  constructor(value, type) {
    this.value = value;
    this.type = type;
  }
};
function isWord(char) {
  return /\w/.test(char);
}
function isInteger(char) {
  return /[0-9]/.test(char);
}
function isWhitespace(char) {
  return /\s/.test(char);
}
var ORDERED_MAPPING_TABLE = [
  // Control sequences
  ["{%", TOKEN_TYPES.OpenStatement],
  ["%}", TOKEN_TYPES.CloseStatement],
  ["{{", TOKEN_TYPES.OpenExpression],
  ["}}", TOKEN_TYPES.CloseExpression],
  // Single character tokens
  ["(", TOKEN_TYPES.OpenParen],
  [")", TOKEN_TYPES.CloseParen],
  ["{", TOKEN_TYPES.OpenCurlyBracket],
  ["}", TOKEN_TYPES.CloseCurlyBracket],
  ["[", TOKEN_TYPES.OpenSquareBracket],
  ["]", TOKEN_TYPES.CloseSquareBracket],
  [",", TOKEN_TYPES.Comma],
  [".", TOKEN_TYPES.Dot],
  [":", TOKEN_TYPES.Colon],
  ["|", TOKEN_TYPES.Pipe],
  // Comparison operators
  ["<=", TOKEN_TYPES.ComparisonBinaryOperator],
  [">=", TOKEN_TYPES.ComparisonBinaryOperator],
  ["==", TOKEN_TYPES.ComparisonBinaryOperator],
  ["!=", TOKEN_TYPES.ComparisonBinaryOperator],
  ["<", TOKEN_TYPES.ComparisonBinaryOperator],
  [">", TOKEN_TYPES.ComparisonBinaryOperator],
  // Arithmetic operators
  ["+", TOKEN_TYPES.AdditiveBinaryOperator],
  ["-", TOKEN_TYPES.AdditiveBinaryOperator],
  ["~", TOKEN_TYPES.AdditiveBinaryOperator],
  ["**", TOKEN_TYPES.ExponentiationBinaryOperator],
  // NOTE: must come before "*" so that "**" is matched first
  ["*", TOKEN_TYPES.MultiplicativeBinaryOperator],
  ["//", TOKEN_TYPES.MultiplicativeBinaryOperator],
  // NOTE: must come before "/" so that "//" is matched first
  ["/", TOKEN_TYPES.MultiplicativeBinaryOperator],
  ["%", TOKEN_TYPES.MultiplicativeBinaryOperator],
  // Assignment operator
  ["=", TOKEN_TYPES.Equals]
];
var ESCAPE_CHARACTERS = /* @__PURE__ */ new Map([
  ["n", "\n"],
  // New line
  ["t", "	"],
  // Horizontal tab
  ["r", "\r"],
  // Carriage return
  ["b", "\b"],
  // Backspace
  ["f", "\f"],
  // Form feed
  ["v", "\v"],
  // Vertical tab
  ["'", "'"],
  // Single quote
  ['"', '"'],
  // Double quote
  ["\\", "\\"]
  // Backslash
]);
function preprocess(template, options = {}) {
  if (template.endsWith("\n")) {
    template = template.slice(0, -1);
  }
  if (options.lstrip_blocks) {
    template = template.replace(/^[ \t]*({[#%-])/gm, "$1");
  }
  if (options.trim_blocks) {
    template = template.replace(/([#%-]})\n/g, "$1");
  }
  return template.replace(
    /(\s*){%(-?)\s*(?:end)?generation\s*(-?)%}(\s*)/gs,
    (_2, before, lstrip, rstrip, after) => (lstrip ? "" : before) + (rstrip ? "" : after)
  );
}
function tokenize(source, options = {}) {
  const tokens = [];
  const src = preprocess(source, options);
  let cursorPosition = 0;
  let curlyBracketDepth = 0;
  const consumeWhile = (predicate) => {
    let str = "";
    while (predicate(src[cursorPosition])) {
      if (src[cursorPosition] === "\\") {
        ++cursorPosition;
        if (cursorPosition >= src.length) {
          throw new SyntaxError("Unexpected end of input");
        }
        const escaped = src[cursorPosition++];
        if (escaped === "x" || escaped === "u") {
          const length = escaped === "x" ? 2 : 4;
          const hex = src.slice(cursorPosition, cursorPosition + length);
          if (hex.length !== length || /[^0-9a-f]/i.test(hex)) {
            throw new SyntaxError(`Invalid hexadecimal escape sequence: \\${escaped}${hex}`);
          }
          str += String.fromCharCode(parseInt(hex, 16));
          cursorPosition += length;
          continue;
        }
        const unescaped = ESCAPE_CHARACTERS.get(escaped);
        if (unescaped === void 0) {
          throw new SyntaxError(`Unexpected escaped character: ${escaped}`);
        }
        str += unescaped;
        continue;
      }
      str += src[cursorPosition++];
      if (cursorPosition >= src.length) {
        throw new SyntaxError("Unexpected end of input");
      }
    }
    return str;
  };
  const stripTrailingWhitespace = () => {
    const lastToken = tokens.at(-1);
    if (lastToken && lastToken.type === TOKEN_TYPES.Text) {
      lastToken.value = lastToken.value.trimEnd();
      if (lastToken.value === "") {
        tokens.pop();
      }
    }
  };
  const skipLeadingWhitespace = () => {
    while (cursorPosition < src.length && isWhitespace(src[cursorPosition])) {
      ++cursorPosition;
    }
  };
  main:
    while (cursorPosition < src.length) {
      const lastTokenType = tokens.at(-1)?.type;
      if (lastTokenType === void 0 || lastTokenType === TOKEN_TYPES.CloseStatement || lastTokenType === TOKEN_TYPES.CloseExpression || lastTokenType === TOKEN_TYPES.Comment) {
        let text = "";
        while (cursorPosition < src.length && // Keep going until we hit the next Jinja statement or expression
        !(src[cursorPosition] === "{" && (src[cursorPosition + 1] === "%" || src[cursorPosition + 1] === "{" || src[cursorPosition + 1] === "#"))) {
          text += src[cursorPosition++];
        }
        if (text.length > 0) {
          tokens.push(new Token(text, TOKEN_TYPES.Text));
          continue;
        }
      }
      if (src[cursorPosition] === "{" && src[cursorPosition + 1] === "#") {
        cursorPosition += 2;
        const stripBefore = src[cursorPosition] === "-";
        if (stripBefore) {
          ++cursorPosition;
        }
        let comment = "";
        while (src[cursorPosition] !== "#" || src[cursorPosition + 1] !== "}") {
          if (cursorPosition + 2 >= src.length) {
            throw new SyntaxError("Missing end of comment tag");
          }
          comment += src[cursorPosition++];
        }
        const stripAfter = comment.endsWith("-");
        if (stripAfter) {
          comment = comment.slice(0, -1);
        }
        if (stripBefore) {
          stripTrailingWhitespace();
        }
        tokens.push(new Token(comment, TOKEN_TYPES.Comment));
        cursorPosition += 2;
        if (stripAfter) {
          skipLeadingWhitespace();
        }
        continue;
      }
      if (src.slice(cursorPosition, cursorPosition + 3) === "{%-") {
        stripTrailingWhitespace();
        tokens.push(new Token("{%", TOKEN_TYPES.OpenStatement));
        cursorPosition += 3;
        continue;
      }
      if (src.slice(cursorPosition, cursorPosition + 3) === "{{-") {
        stripTrailingWhitespace();
        tokens.push(new Token("{{", TOKEN_TYPES.OpenExpression));
        curlyBracketDepth = 0;
        cursorPosition += 3;
        continue;
      }
      consumeWhile(isWhitespace);
      if (src.slice(cursorPosition, cursorPosition + 3) === "-%}") {
        tokens.push(new Token("%}", TOKEN_TYPES.CloseStatement));
        cursorPosition += 3;
        skipLeadingWhitespace();
        continue;
      }
      if (src.slice(cursorPosition, cursorPosition + 3) === "-}}") {
        tokens.push(new Token("}}", TOKEN_TYPES.CloseExpression));
        cursorPosition += 3;
        skipLeadingWhitespace();
        continue;
      }
      const char = src[cursorPosition];
      if (char === "-" || char === "+") {
        const lastTokenType2 = tokens.at(-1)?.type;
        if (lastTokenType2 === TOKEN_TYPES.Text || lastTokenType2 === void 0) {
          throw new SyntaxError(`Unexpected character: ${char}`);
        }
        switch (lastTokenType2) {
          case TOKEN_TYPES.Identifier:
          case TOKEN_TYPES.NumericLiteral:
          case TOKEN_TYPES.StringLiteral:
          case TOKEN_TYPES.CloseParen:
          case TOKEN_TYPES.CloseSquareBracket:
            break;
          default: {
            ++cursorPosition;
            let num = consumeWhile(isInteger);
            if (num.length > 0 && src[cursorPosition] === "." && isInteger(src[cursorPosition + 1])) {
              ++cursorPosition;
              const frac = consumeWhile(isInteger);
              num = `${num}.${frac}`;
            }
            tokens.push(
              new Token(`${char}${num}`, num.length > 0 ? TOKEN_TYPES.NumericLiteral : TOKEN_TYPES.UnaryOperator)
            );
            continue;
          }
        }
      }
      for (const [seq, type] of ORDERED_MAPPING_TABLE) {
        if (seq === "}}" && curlyBracketDepth > 0) {
          continue;
        }
        const slice2 = src.slice(cursorPosition, cursorPosition + seq.length);
        if (slice2 === seq) {
          tokens.push(new Token(seq, type));
          if (type === TOKEN_TYPES.OpenExpression) {
            curlyBracketDepth = 0;
          } else if (type === TOKEN_TYPES.OpenCurlyBracket) {
            ++curlyBracketDepth;
          } else if (type === TOKEN_TYPES.CloseCurlyBracket) {
            --curlyBracketDepth;
          }
          cursorPosition += seq.length;
          continue main;
        }
      }
      if (char === "'" || char === '"') {
        ++cursorPosition;
        const str = consumeWhile((c) => c !== char);
        tokens.push(new Token(str, TOKEN_TYPES.StringLiteral));
        ++cursorPosition;
        continue;
      }
      if (isInteger(char)) {
        let num = consumeWhile(isInteger);
        if (tokens.at(-1)?.type !== TOKEN_TYPES.Dot && src[cursorPosition] === "." && isInteger(src[cursorPosition + 1])) {
          ++cursorPosition;
          const frac = consumeWhile(isInteger);
          num = `${num}.${frac}`;
        }
        tokens.push(new Token(num, TOKEN_TYPES.NumericLiteral));
        continue;
      }
      if (isWord(char)) {
        const word = consumeWhile(isWord);
        tokens.push(new Token(word, TOKEN_TYPES.Identifier));
        continue;
      }
      throw new SyntaxError(`Unexpected character: ${char}`);
    }
  return tokens;
}
var Statement = class {
  type = "Statement";
};
var Program = class extends Statement {
  constructor(body) {
    super();
    this.body = body;
  }
  type = "Program";
};
var If = class extends Statement {
  constructor(test, body, alternate) {
    super();
    this.test = test;
    this.body = body;
    this.alternate = alternate;
  }
  type = "If";
};
var For = class extends Statement {
  constructor(loopvar, iterable, body, defaultBlock) {
    super();
    this.loopvar = loopvar;
    this.iterable = iterable;
    this.body = body;
    this.defaultBlock = defaultBlock;
  }
  type = "For";
};
var Break = class extends Statement {
  type = "Break";
};
var Continue = class extends Statement {
  type = "Continue";
};
var SetStatement = class extends Statement {
  constructor(assignee, value, body) {
    super();
    this.assignee = assignee;
    this.value = value;
    this.body = body;
  }
  type = "Set";
};
var Macro = class extends Statement {
  constructor(name, args, body) {
    super();
    this.name = name;
    this.args = args;
    this.body = body;
  }
  type = "Macro";
};
var Comment = class extends Statement {
  constructor(value) {
    super();
    this.value = value;
  }
  type = "Comment";
};
var Expression = class extends Statement {
  type = "Expression";
};
var MemberExpression = class extends Expression {
  constructor(object, property, computed) {
    super();
    this.object = object;
    this.property = property;
    this.computed = computed;
  }
  type = "MemberExpression";
};
var CallExpression = class extends Expression {
  constructor(callee, args) {
    super();
    this.callee = callee;
    this.args = args;
  }
  type = "CallExpression";
};
var Identifier = class extends Expression {
  /**
   * @param {string} value The name of the identifier
   */
  constructor(value) {
    super();
    this.value = value;
  }
  type = "Identifier";
};
var Literal = class extends Expression {
  constructor(value) {
    super();
    this.value = value;
  }
  type = "Literal";
};
var IntegerLiteral = class extends Literal {
  type = "IntegerLiteral";
};
var FloatLiteral = class extends Literal {
  type = "FloatLiteral";
};
var StringLiteral = class extends Literal {
  type = "StringLiteral";
};
var ArrayLiteral = class extends Literal {
  type = "ArrayLiteral";
};
var TupleLiteral = class extends Literal {
  type = "TupleLiteral";
};
var ObjectLiteral = class extends Literal {
  type = "ObjectLiteral";
};
var BinaryExpression = class extends Expression {
  constructor(operator, left, right) {
    super();
    this.operator = operator;
    this.left = left;
    this.right = right;
  }
  type = "BinaryExpression";
};
var FilterExpression = class extends Expression {
  constructor(operand, filter) {
    super();
    this.operand = operand;
    this.filter = filter;
  }
  type = "FilterExpression";
};
var FilterStatement = class extends Statement {
  constructor(filter, body) {
    super();
    this.filter = filter;
    this.body = body;
  }
  type = "FilterStatement";
};
var SelectExpression = class extends Expression {
  constructor(lhs, test) {
    super();
    this.lhs = lhs;
    this.test = test;
  }
  type = "SelectExpression";
};
var TestExpression = class extends Expression {
  constructor(operand, negate, test) {
    super();
    this.operand = operand;
    this.negate = negate;
    this.test = test;
  }
  type = "TestExpression";
};
var UnaryExpression = class extends Expression {
  constructor(operator, argument) {
    super();
    this.operator = operator;
    this.argument = argument;
  }
  type = "UnaryExpression";
};
var SliceExpression = class extends Expression {
  constructor(start = void 0, stop = void 0, step = void 0) {
    super();
    this.start = start;
    this.stop = stop;
    this.step = step;
  }
  type = "SliceExpression";
};
var KeywordArgumentExpression = class extends Expression {
  constructor(key, value) {
    super();
    this.key = key;
    this.value = value;
  }
  type = "KeywordArgumentExpression";
};
var SpreadExpression = class extends Expression {
  constructor(argument) {
    super();
    this.argument = argument;
  }
  type = "SpreadExpression";
};
var KeywordSpreadExpression = class extends Expression {
  constructor(argument) {
    super();
    this.argument = argument;
  }
  type = "KeywordSpreadExpression";
};
var CallStatement = class extends Statement {
  constructor(call, callerArgs, body) {
    super();
    this.call = call;
    this.callerArgs = callerArgs;
    this.body = body;
  }
  type = "CallStatement";
};
var Ternary = class extends Expression {
  constructor(condition, trueExpr, falseExpr) {
    super();
    this.condition = condition;
    this.trueExpr = trueExpr;
    this.falseExpr = falseExpr;
  }
  type = "Ternary";
};
function parse(tokens) {
  const program = new Program([]);
  let current = 0;
  function expect(type, error) {
    const prev = tokens[current++];
    if (!prev || prev.type !== type) {
      throw new Error(`Parser Error: ${error}. ${prev.type} !== ${type}.`);
    }
    return prev;
  }
  function expectIdentifier(name) {
    if (!isIdentifier(name)) {
      throw new SyntaxError(`Expected ${name}`);
    }
    ++current;
  }
  function parseAny() {
    switch (tokens[current].type) {
      case TOKEN_TYPES.Comment:
        return new Comment(tokens[current++].value);
      case TOKEN_TYPES.Text:
        return parseText();
      case TOKEN_TYPES.OpenStatement:
        return parseJinjaStatement();
      case TOKEN_TYPES.OpenExpression:
        return parseJinjaExpression();
      default:
        throw new SyntaxError(`Unexpected token type: ${tokens[current].type}`);
    }
  }
  function is(...types) {
    return current + types.length <= tokens.length && types.every((type, i) => type === tokens[current + i].type);
  }
  function isStatement(...names) {
    return tokens[current]?.type === TOKEN_TYPES.OpenStatement && tokens[current + 1]?.type === TOKEN_TYPES.Identifier && names.includes(tokens[current + 1]?.value);
  }
  function isIdentifier(...names) {
    return current + names.length <= tokens.length && names.every((name, i) => tokens[current + i].type === "Identifier" && name === tokens[current + i].value);
  }
  function parseText() {
    return new StringLiteral(expect(TOKEN_TYPES.Text, "Expected text token").value);
  }
  function parseJinjaStatement() {
    expect(TOKEN_TYPES.OpenStatement, "Expected opening statement token");
    if (tokens[current].type !== TOKEN_TYPES.Identifier) {
      throw new SyntaxError(`Unknown statement, got ${tokens[current].type}`);
    }
    const name = tokens[current].value;
    let result;
    switch (name) {
      case "set":
        ++current;
        result = parseSetStatement();
        break;
      case "if":
        ++current;
        result = parseIfStatement();
        expect(TOKEN_TYPES.OpenStatement, "Expected {% token");
        expectIdentifier("endif");
        expect(TOKEN_TYPES.CloseStatement, "Expected %} token");
        break;
      case "macro":
        ++current;
        result = parseMacroStatement();
        expect(TOKEN_TYPES.OpenStatement, "Expected {% token");
        expectIdentifier("endmacro");
        expect(TOKEN_TYPES.CloseStatement, "Expected %} token");
        break;
      case "for":
        ++current;
        result = parseForStatement();
        expect(TOKEN_TYPES.OpenStatement, "Expected {% token");
        expectIdentifier("endfor");
        expect(TOKEN_TYPES.CloseStatement, "Expected %} token");
        break;
      case "call": {
        ++current;
        let callerArgs = null;
        if (is(TOKEN_TYPES.OpenParen)) {
          callerArgs = parseArgs("parameters");
        }
        const callee = parsePrimaryExpression();
        if (callee.type !== "Identifier") {
          throw new SyntaxError(`Expected identifier following call statement`);
        }
        const callArgs = parseArgs("call");
        expect(TOKEN_TYPES.CloseStatement, "Expected closing statement token");
        const body = [];
        while (!isStatement("endcall")) {
          body.push(parseAny());
        }
        expect(TOKEN_TYPES.OpenStatement, "Expected '{%'");
        expectIdentifier("endcall");
        expect(TOKEN_TYPES.CloseStatement, "Expected closing statement token");
        const callExpr = new CallExpression(callee, callArgs);
        result = new CallStatement(callExpr, callerArgs, body);
        break;
      }
      case "break":
        ++current;
        expect(TOKEN_TYPES.CloseStatement, "Expected closing statement token");
        result = new Break();
        break;
      case "continue":
        ++current;
        expect(TOKEN_TYPES.CloseStatement, "Expected closing statement token");
        result = new Continue();
        break;
      case "filter": {
        ++current;
        let filterNode = parsePrimaryExpression();
        if (filterNode instanceof Identifier && is(TOKEN_TYPES.OpenParen)) {
          filterNode = parseCallExpression(filterNode);
        }
        expect(TOKEN_TYPES.CloseStatement, "Expected closing statement token");
        const filterBody = [];
        while (!isStatement("endfilter")) {
          filterBody.push(parseAny());
        }
        expect(TOKEN_TYPES.OpenStatement, "Expected '{%'");
        expectIdentifier("endfilter");
        expect(TOKEN_TYPES.CloseStatement, "Expected '%}'");
        result = new FilterStatement(filterNode, filterBody);
        break;
      }
      default:
        throw new SyntaxError(`Unknown statement type: ${name}`);
    }
    return result;
  }
  function parseJinjaExpression() {
    expect(TOKEN_TYPES.OpenExpression, "Expected opening expression token");
    const result = parseExpression();
    expect(TOKEN_TYPES.CloseExpression, "Expected closing expression token");
    return result;
  }
  function parseSetStatement() {
    const left = parseExpressionSequence();
    let value = null;
    const body = [];
    if (is(TOKEN_TYPES.Equals)) {
      ++current;
      value = parseExpressionSequence();
    } else {
      expect(TOKEN_TYPES.CloseStatement, "Expected %} token");
      while (!isStatement("endset")) {
        body.push(parseAny());
      }
      expect(TOKEN_TYPES.OpenStatement, "Expected {% token");
      expectIdentifier("endset");
    }
    expect(TOKEN_TYPES.CloseStatement, "Expected closing statement token");
    return new SetStatement(left, value, body);
  }
  function parseIfStatement() {
    const test = parseExpression();
    expect(TOKEN_TYPES.CloseStatement, "Expected closing statement token");
    const body = [];
    const alternate = [];
    while (!isStatement("elif", "else", "endif")) {
      body.push(parseAny());
    }
    if (isStatement("elif")) {
      ++current;
      ++current;
      const result = parseIfStatement();
      alternate.push(result);
    } else if (isStatement("else")) {
      ++current;
      ++current;
      expect(TOKEN_TYPES.CloseStatement, "Expected closing statement token");
      while (!isStatement("endif")) {
        alternate.push(parseAny());
      }
    }
    return new If(test, body, alternate);
  }
  function parseMacroStatement() {
    const name = parsePrimaryExpression();
    if (name.type !== "Identifier") {
      throw new SyntaxError(`Expected identifier following macro statement`);
    }
    const args = parseArgs("parameters");
    expect(TOKEN_TYPES.CloseStatement, "Expected closing statement token");
    const body = [];
    while (!isStatement("endmacro")) {
      body.push(parseAny());
    }
    return new Macro(name, args, body);
  }
  function parseExpressionSequence(primary = false) {
    const fn2 = primary ? parsePrimaryExpression : parseExpression;
    const expressions = [fn2()];
    const isTuple = is(TOKEN_TYPES.Comma);
    while (isTuple) {
      ++current;
      expressions.push(fn2());
      if (!is(TOKEN_TYPES.Comma)) {
        break;
      }
    }
    return isTuple ? new TupleLiteral(expressions) : expressions[0];
  }
  function parseForStatement() {
    const loopVariable = parseExpressionSequence(true);
    if (!(loopVariable instanceof Identifier || loopVariable instanceof TupleLiteral)) {
      throw new SyntaxError(`Expected identifier/tuple for the loop variable, got ${loopVariable.type} instead`);
    }
    if (!isIdentifier("in")) {
      throw new SyntaxError("Expected `in` keyword following loop variable");
    }
    ++current;
    const iterable = parseExpression();
    expect(TOKEN_TYPES.CloseStatement, "Expected closing statement token");
    const body = [];
    while (!isStatement("endfor", "else")) {
      body.push(parseAny());
    }
    const alternative = [];
    if (isStatement("else")) {
      ++current;
      ++current;
      expect(TOKEN_TYPES.CloseStatement, "Expected closing statement token");
      while (!isStatement("endfor")) {
        alternative.push(parseAny());
      }
    }
    return new For(loopVariable, iterable, body, alternative);
  }
  function parseExpression() {
    return parseIfExpression();
  }
  function parseIfExpression() {
    const a = parseLogicalOrExpression();
    if (isIdentifier("if")) {
      ++current;
      const test = parseLogicalOrExpression();
      if (isIdentifier("else")) {
        ++current;
        const falseExpr = parseIfExpression();
        return new Ternary(test, a, falseExpr);
      } else {
        return new SelectExpression(a, test);
      }
    }
    return a;
  }
  function parseLogicalOrExpression() {
    let left = parseLogicalAndExpression();
    while (isIdentifier("or")) {
      const operator = tokens[current];
      ++current;
      const right = parseLogicalAndExpression();
      left = new BinaryExpression(operator, left, right);
    }
    return left;
  }
  function parseLogicalAndExpression() {
    let left = parseLogicalNegationExpression();
    while (isIdentifier("and")) {
      const operator = tokens[current];
      ++current;
      const right = parseLogicalNegationExpression();
      left = new BinaryExpression(operator, left, right);
    }
    return left;
  }
  function parseLogicalNegationExpression() {
    let right;
    while (isIdentifier("not")) {
      const operator = tokens[current];
      ++current;
      const arg = parseLogicalNegationExpression();
      right = new UnaryExpression(operator, arg);
    }
    return right ?? parseComparisonExpression();
  }
  function parseComparisonExpression() {
    let left = parseAdditiveExpression();
    while (true) {
      let operator;
      if (isIdentifier("not", "in")) {
        operator = new Token("not in", TOKEN_TYPES.Identifier);
        current += 2;
      } else if (isIdentifier("in")) {
        operator = tokens[current++];
      } else if (is(TOKEN_TYPES.ComparisonBinaryOperator)) {
        operator = tokens[current++];
      } else {
        break;
      }
      const right = parseAdditiveExpression();
      left = new BinaryExpression(operator, left, right);
    }
    return left;
  }
  function parseAdditiveExpression() {
    let left = parseMultiplicativeExpression();
    while (is(TOKEN_TYPES.AdditiveBinaryOperator)) {
      const operator = tokens[current];
      ++current;
      const right = parseMultiplicativeExpression();
      left = new BinaryExpression(operator, left, right);
    }
    return left;
  }
  function parseCallMemberExpression() {
    const member = parseMemberExpression(parsePrimaryExpression());
    if (is(TOKEN_TYPES.OpenParen)) {
      return parseCallExpression(member);
    }
    return member;
  }
  function parseCallExpression(callee) {
    let expression = new CallExpression(callee, parseArgs("call"));
    expression = parseMemberExpression(expression);
    if (is(TOKEN_TYPES.OpenParen)) {
      expression = parseCallExpression(expression);
    }
    return expression;
  }
  function parseArgs(mode) {
    expect(TOKEN_TYPES.OpenParen, "Expected opening parenthesis for arguments list");
    const args = parseArgumentsList(mode);
    expect(TOKEN_TYPES.CloseParen, "Expected closing parenthesis for arguments list");
    return args;
  }
  function parseArgumentsList(mode) {
    const args = [];
    const parameterNames = /* @__PURE__ */ new Set();
    let sawKeywordOrDefault = false;
    let sawSpreadArgument = false;
    while (!is(TOKEN_TYPES.CloseParen)) {
      const isKeywordSpread = is(TOKEN_TYPES.ExponentiationBinaryOperator);
      const isPositionalSpread = is(TOKEN_TYPES.MultiplicativeBinaryOperator) && tokens[current].value === "*";
      if (mode === "parameters" && (isKeywordSpread || isPositionalSpread)) {
        throw new SyntaxError("Argument unpacking is not allowed in parameter declarations");
      }
      if (isKeywordSpread) {
        ++current;
        args.push(new KeywordSpreadExpression(parseExpression()));
        if (is(TOKEN_TYPES.Comma)) {
          ++current;
        }
        if (!is(TOKEN_TYPES.CloseParen)) {
          throw new SyntaxError("Expected closing parenthesis: `**` must be applied to the final argument");
        }
        break;
      }
      let argument;
      if (isPositionalSpread) {
        if (sawSpreadArgument) {
          throw new SyntaxError("Only one `*` argument unpacking is allowed");
        }
        sawSpreadArgument = true;
        ++current;
        const expr = parseExpression();
        argument = new SpreadExpression(expr);
      } else {
        argument = parseExpression();
        if (is(TOKEN_TYPES.Equals)) {
          ++current;
          if (!(argument instanceof Identifier)) {
            throw new SyntaxError(
              mode === "parameters" ? "Expected identifier for parameter declaration" : "Expected identifier for keyword argument"
            );
          }
          const value = parseExpression();
          argument = new KeywordArgumentExpression(argument, value);
        }
        if (mode === "parameters") {
          if (!(argument instanceof Identifier || argument instanceof KeywordArgumentExpression)) {
            throw new SyntaxError("Expected identifier for parameter declaration");
          }
          const parameterName = argument instanceof Identifier ? argument.value : argument.key.value;
          if (parameterNames.has(parameterName)) {
            throw new SyntaxError(`Duplicate parameter name: ${parameterName}`);
          }
          parameterNames.add(parameterName);
        }
        if (argument instanceof KeywordArgumentExpression) {
          sawKeywordOrDefault = true;
        } else if (sawKeywordOrDefault) {
          throw new SyntaxError(
            mode === "call" ? "Positional arguments must come before keyword arguments" : "Non-default argument follows default argument"
          );
        } else if (sawSpreadArgument) {
          throw new SyntaxError("Positional arguments must not follow `*` argument unpacking");
        }
      }
      args.push(argument);
      if (is(TOKEN_TYPES.Comma)) {
        ++current;
      }
    }
    return args;
  }
  function parseMemberExpressionArgumentsList() {
    const slices = [];
    let isSlice = false;
    while (!is(TOKEN_TYPES.CloseSquareBracket)) {
      if (is(TOKEN_TYPES.Colon)) {
        slices.push(void 0);
        ++current;
        isSlice = true;
      } else {
        slices.push(parseExpression());
        if (is(TOKEN_TYPES.Colon)) {
          ++current;
          isSlice = true;
        }
      }
    }
    if (slices.length === 0) {
      throw new SyntaxError(`Expected at least one argument for member/slice expression`);
    }
    if (isSlice) {
      if (slices.length > 3) {
        throw new SyntaxError(`Expected 0-3 arguments for slice expression`);
      }
      return new SliceExpression(...slices);
    }
    return slices[0];
  }
  function parseMemberExpression(object) {
    while (is(TOKEN_TYPES.Dot) || is(TOKEN_TYPES.OpenSquareBracket)) {
      const operator = tokens[current];
      ++current;
      let property;
      const computed = operator.type === TOKEN_TYPES.OpenSquareBracket;
      if (computed) {
        property = parseMemberExpressionArgumentsList();
        expect(TOKEN_TYPES.CloseSquareBracket, "Expected closing square bracket");
      } else {
        property = parsePrimaryExpression();
        if (property.type !== "Identifier" && property.type !== "IntegerLiteral") {
          throw new SyntaxError(`Expected identifier or integer following dot operator`);
        }
      }
      object = new MemberExpression(object, property, computed);
    }
    return object;
  }
  function parseMultiplicativeExpression() {
    let left = parsePowerExpression();
    while (is(TOKEN_TYPES.MultiplicativeBinaryOperator)) {
      const operator = tokens[current++];
      const right = parsePowerExpression();
      left = new BinaryExpression(operator, left, right);
    }
    return left;
  }
  function parsePowerExpression() {
    let left = parseTestExpression();
    while (is(TOKEN_TYPES.ExponentiationBinaryOperator)) {
      const operator = tokens[current++];
      const right = parseTestExpression();
      left = new BinaryExpression(operator, left, right);
    }
    return left;
  }
  function parseTestExpression() {
    let operand = parseFilterExpression();
    while (isIdentifier("is")) {
      ++current;
      const negate = isIdentifier("not");
      if (negate) {
        ++current;
      }
      const filter = parsePrimaryExpression();
      if (!(filter instanceof Identifier)) {
        throw new SyntaxError(`Expected identifier for the test`);
      }
      operand = new TestExpression(operand, negate, filter);
    }
    return operand;
  }
  function parseFilterExpression() {
    let operand = parseUnarySignExpression();
    while (is(TOKEN_TYPES.Pipe)) {
      ++current;
      let filter = parsePrimaryExpression();
      if (!(filter instanceof Identifier)) {
        throw new SyntaxError(`Expected identifier for the filter`);
      }
      if (is(TOKEN_TYPES.OpenParen)) {
        filter = parseCallExpression(filter);
      }
      operand = new FilterExpression(operand, filter);
    }
    return operand;
  }
  function parseUnarySignExpression() {
    const token = tokens[current];
    if (token && (token.type === TOKEN_TYPES.UnaryOperator || token.type === TOKEN_TYPES.AdditiveBinaryOperator) && (token.value === "-" || token.value === "+")) {
      const operator = tokens[current++];
      const argument = parseUnarySignExpression();
      return new UnaryExpression(operator, argument);
    }
    return parseCallMemberExpression();
  }
  function parsePrimaryExpression() {
    const token = tokens[current++];
    switch (token.type) {
      case TOKEN_TYPES.NumericLiteral: {
        const num = token.value;
        return num.includes(".") ? new FloatLiteral(Number(num)) : new IntegerLiteral(Number(num));
      }
      case TOKEN_TYPES.StringLiteral: {
        let value = token.value;
        while (is(TOKEN_TYPES.StringLiteral)) {
          value += tokens[current++].value;
        }
        return new StringLiteral(value);
      }
      case TOKEN_TYPES.Identifier:
        return new Identifier(token.value);
      case TOKEN_TYPES.OpenParen: {
        const expression = parseExpressionSequence();
        expect(TOKEN_TYPES.CloseParen, "Expected closing parenthesis, got ${tokens[current].type} instead.");
        return expression;
      }
      case TOKEN_TYPES.OpenSquareBracket: {
        const values = [];
        while (!is(TOKEN_TYPES.CloseSquareBracket)) {
          values.push(parseExpression());
          if (is(TOKEN_TYPES.Comma)) {
            ++current;
          }
        }
        ++current;
        return new ArrayLiteral(values);
      }
      case TOKEN_TYPES.OpenCurlyBracket: {
        const values = /* @__PURE__ */ new Map();
        while (!is(TOKEN_TYPES.CloseCurlyBracket)) {
          const key = parseExpression();
          expect(TOKEN_TYPES.Colon, "Expected colon between key and value in object literal");
          const value = parseExpression();
          values.set(key, value);
          if (is(TOKEN_TYPES.Comma)) {
            ++current;
          }
        }
        ++current;
        return new ObjectLiteral(values);
      }
      default:
        throw new SyntaxError(`Unexpected token: ${token.type}`);
    }
  }
  while (current < tokens.length) {
    program.body.push(parseAny());
  }
  return program;
}
function range(start, stop, step = 1) {
  if (stop === void 0) {
    stop = start;
    start = 0;
  }
  if (step === 0) {
    throw new Error("range() step must not be zero");
  }
  const result = [];
  if (step > 0) {
    for (let i = start; i < stop; i += step) {
      result.push(i);
    }
  } else {
    for (let i = start; i > stop; i += step) {
      result.push(i);
    }
  }
  return result;
}
function slice(array, start, stop, step = 1) {
  const direction = Math.sign(step);
  if (direction >= 0) {
    start = (start ??= 0) < 0 ? Math.max(array.length + start, 0) : Math.min(start, array.length);
    stop = (stop ??= array.length) < 0 ? Math.max(array.length + stop, 0) : Math.min(stop, array.length);
  } else {
    start = (start ??= array.length - 1) < 0 ? Math.max(array.length + start, -1) : Math.min(start, array.length - 1);
    stop = (stop ??= -1) < -1 ? Math.max(array.length + stop, -1) : Math.min(stop, array.length - 1);
  }
  const result = [];
  for (let i = start; direction * i < direction * stop; i += step) {
    result.push(array[i]);
  }
  return result;
}
function titleCase(value) {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}
function strftime_now(format2) {
  return strftime(/* @__PURE__ */ new Date(), format2);
}
function strftime(date, format2) {
  const monthFormatterLong = new Intl.DateTimeFormat(void 0, { month: "long" });
  const monthFormatterShort = new Intl.DateTimeFormat(void 0, { month: "short" });
  const pad2 = (n) => n < 10 ? "0" + n : n.toString();
  return format2.replace(/%[YmdbBHM%]/g, (token) => {
    switch (token) {
      case "%Y":
        return date.getFullYear().toString();
      case "%m":
        return pad2(date.getMonth() + 1);
      case "%d":
        return pad2(date.getDate());
      case "%b":
        return monthFormatterShort.format(date);
      case "%B":
        return monthFormatterLong.format(date);
      case "%H":
        return pad2(date.getHours());
      case "%M":
        return pad2(date.getMinutes());
      case "%%":
        return "%";
      default:
        return token;
    }
  });
}
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function replace(str, oldvalue, newvalue, count) {
  if (count === 0) {
    return str;
  }
  let remaining = count == null || count < 0 ? Infinity : count;
  const pattern = oldvalue.length === 0 ? new RegExp("(?=)", "gu") : new RegExp(escapeRegExp(oldvalue), "gu");
  return str.replaceAll(pattern, (match) => {
    if (remaining > 0) {
      --remaining;
      return newvalue;
    }
    return match;
  });
}
var BreakControl = class extends Error {
};
var ContinueControl = class extends Error {
};
var EMPTY_BUILTINS = /* @__PURE__ */ new Map();
var RuntimeValue = class {
  type = "RuntimeValue";
  value;
  /**
   * A collection of built-in functions for this type.
   */
  get builtins() {
    return EMPTY_BUILTINS;
  }
  /**
   * Creates a new RuntimeValue.
   */
  constructor(value = void 0) {
    this.value = value;
  }
  /**
   * Determines truthiness or falsiness of the runtime value.
   * This function should be overridden by subclasses if it has custom truthiness criteria.
   * @returns {BooleanValue} BooleanValue(true) if the value is truthy, BooleanValue(false) otherwise.
   */
  __bool__() {
    return new BooleanValue(!!this.value);
  }
  toString() {
    return String(this.value);
  }
};
var IntegerValue = class extends RuntimeValue {
  type = "IntegerValue";
};
var FloatValue = class extends RuntimeValue {
  type = "FloatValue";
  toString() {
    if (Object.is(this.value, -0)) {
      return "-0.0";
    }
    return this.value % 1 === 0 ? this.value.toFixed(1) : this.value.toString();
  }
};
var StringValue = class extends RuntimeValue {
  type = "StringValue";
  _builtins;
  get builtins() {
    return this._builtins ??= /* @__PURE__ */ new Map([
      [
        "upper",
        new FunctionValue(() => {
          return new StringValue(this.value.toUpperCase());
        })
      ],
      [
        "lower",
        new FunctionValue(() => {
          return new StringValue(this.value.toLowerCase());
        })
      ],
      [
        "strip",
        new FunctionValue(() => {
          return new StringValue(this.value.trim());
        })
      ],
      [
        "title",
        new FunctionValue(() => {
          return new StringValue(titleCase(this.value));
        })
      ],
      [
        "capitalize",
        new FunctionValue(() => {
          return new StringValue(this.value.charAt(0).toUpperCase() + this.value.slice(1));
        })
      ],
      ["length", new IntegerValue(this.value.length)],
      [
        "rstrip",
        new FunctionValue(() => {
          return new StringValue(this.value.trimEnd());
        })
      ],
      [
        "lstrip",
        new FunctionValue(() => {
          return new StringValue(this.value.trimStart());
        })
      ],
      [
        "startswith",
        new FunctionValue((args) => {
          if (args.length === 0) {
            throw new Error("startswith() requires at least one argument");
          }
          const pattern = args[0];
          if (pattern instanceof StringValue) {
            return new BooleanValue(this.value.startsWith(pattern.value));
          } else if (pattern instanceof ArrayValue) {
            for (const item of pattern.value) {
              if (!(item instanceof StringValue)) {
                throw new Error("startswith() tuple elements must be strings");
              }
              if (this.value.startsWith(item.value)) {
                return new BooleanValue(true);
              }
            }
            return new BooleanValue(false);
          }
          throw new Error("startswith() argument must be a string or tuple of strings");
        })
      ],
      [
        "endswith",
        new FunctionValue((args) => {
          if (args.length === 0) {
            throw new Error("endswith() requires at least one argument");
          }
          const pattern = args[0];
          if (pattern instanceof StringValue) {
            return new BooleanValue(this.value.endsWith(pattern.value));
          } else if (pattern instanceof ArrayValue) {
            for (const item of pattern.value) {
              if (!(item instanceof StringValue)) {
                throw new Error("endswith() tuple elements must be strings");
              }
              if (this.value.endsWith(item.value)) {
                return new BooleanValue(true);
              }
            }
            return new BooleanValue(false);
          }
          throw new Error("endswith() argument must be a string or tuple of strings");
        })
      ],
      [
        "split",
        // follows Python's `str.split(sep=None, maxsplit=-1)` function behavior
        // https://docs.python.org/3.13/library/stdtypes.html#str.split
        new FunctionValue((args) => {
          const sep = args[0] ?? new NullValue();
          if (!(sep instanceof StringValue || sep instanceof NullValue)) {
            throw new Error("sep argument must be a string or null");
          }
          const maxsplit = args[1] ?? new IntegerValue(-1);
          if (!(maxsplit instanceof IntegerValue)) {
            throw new Error("maxsplit argument must be a number");
          }
          let result = [];
          if (sep instanceof NullValue) {
            const text = this.value.trimStart();
            for (const { 0: match, index } of text.matchAll(/\S+/g)) {
              if (maxsplit.value !== -1 && result.length >= maxsplit.value && index !== void 0) {
                result.push(match + text.slice(index + match.length));
                break;
              }
              result.push(match);
            }
          } else {
            if (sep.value === "") {
              throw new Error("empty separator");
            }
            result = this.value.split(sep.value);
            if (maxsplit.value !== -1 && result.length > maxsplit.value) {
              result.push(result.splice(maxsplit.value).join(sep.value));
            }
          }
          return new ArrayValue(result.map((part) => new StringValue(part)));
        })
      ],
      [
        "replace",
        new FunctionValue((args) => {
          if (args.length < 2) {
            throw new Error("replace() requires at least two arguments");
          }
          const oldValue = args[0];
          const newValue = args[1];
          if (!(oldValue instanceof StringValue && newValue instanceof StringValue)) {
            throw new Error("replace() arguments must be strings");
          }
          let count;
          if (args.length > 2) {
            if (args[2].type === "KeywordArgumentsValue") {
              count = args[2].value.get("count") ?? new NullValue();
            } else {
              count = args[2];
            }
          } else {
            count = new NullValue();
          }
          if (!(count instanceof IntegerValue || count instanceof NullValue)) {
            throw new Error("replace() count argument must be a number or null");
          }
          return new StringValue(replace(this.value, oldValue.value, newValue.value, count.value));
        })
      ]
    ]);
  }
};
var BooleanValue = class extends RuntimeValue {
  type = "BooleanValue";
};
var NON_ASCII_CHARS = /[\x7f-\uffff]/g;
function makeAsciiSafe(str) {
  return str.replace(NON_ASCII_CHARS, (char) => "\\u" + char.charCodeAt(0).toString(16).padStart(4, "0"));
}
function toJSON(input, options = {}, depth = 0, convertUndefinedToNull = true) {
  const { indent = null, ensureAscii = false, separators = null, sortKeys = false } = options;
  let itemSeparator;
  let keySeparator;
  if (separators) {
    [itemSeparator, keySeparator] = separators;
  } else if (indent) {
    itemSeparator = ",";
    keySeparator = ": ";
  } else {
    itemSeparator = ", ";
    keySeparator = ": ";
  }
  switch (input.type) {
    case "NullValue":
      return "null";
    case "UndefinedValue":
      return convertUndefinedToNull ? "null" : "undefined";
    case "IntegerValue":
    case "FloatValue":
    case "BooleanValue":
      return JSON.stringify(input.value);
    case "StringValue": {
      let result = JSON.stringify(input.value);
      if (ensureAscii) {
        result = makeAsciiSafe(result);
      }
      return result;
    }
    case "ArrayValue":
    case "NamespaceValue":
    case "ObjectValue": {
      const indentValue = indent ? " ".repeat(indent) : "";
      const basePadding = "\n" + indentValue.repeat(depth);
      const childrenPadding = basePadding + indentValue;
      if (input.type === "ArrayValue") {
        const core = input.value.map((x) => toJSON(x, options, depth + 1, convertUndefinedToNull));
        return indent && core.length > 0 ? `[${childrenPadding}${core.join(`${itemSeparator}${childrenPadding}`)}${basePadding}]` : `[${core.join(itemSeparator)}]`;
      } else {
        let entries = Array.from(input.value.entries());
        if (sortKeys) {
          entries = entries.sort(([a], [b]) => a.localeCompare(b));
        }
        const core = entries.map(([key, value]) => {
          let keyStr = JSON.stringify(key);
          if (ensureAscii) {
            keyStr = makeAsciiSafe(keyStr);
          }
          const v2 = `${keyStr}${keySeparator}${toJSON(value, options, depth + 1, convertUndefinedToNull)}`;
          return indent ? `${childrenPadding}${v2}` : v2;
        });
        return indent && core.length > 0 ? `{${core.join(itemSeparator)}${basePadding}}` : `{${core.join(itemSeparator)}}`;
      }
    }
    default:
      throw new Error(`Cannot convert to JSON: ${input.type}`);
  }
}
var ObjectValue = class extends RuntimeValue {
  type = "ObjectValue";
  _builtins;
  /**
   * NOTE: necessary to override since all JavaScript arrays are considered truthy,
   * while only non-empty Python arrays are consider truthy.
   *
   * e.g.,
   *  - JavaScript:  {} && 5 -> 5
   *  - Python:      {} and 5 -> {}
   */
  __bool__() {
    return new BooleanValue(this.value.size > 0);
  }
  get builtins() {
    return this._builtins ??= /* @__PURE__ */ new Map([
      [
        "get",
        new FunctionValue(([key, defaultValue]) => {
          if (!(key instanceof StringValue)) {
            throw new Error(`Object key must be a string: got ${key.type}`);
          }
          return this.value.get(key.value) ?? defaultValue ?? new NullValue();
        })
      ],
      ["items", new FunctionValue(() => this.items())],
      ["keys", new FunctionValue(() => this.keys())],
      ["values", new FunctionValue(() => this.values())],
      [
        "dictsort",
        new FunctionValue((args) => {
          let kwargs = /* @__PURE__ */ new Map();
          const positionalArgs = args.filter((arg) => {
            if (arg instanceof KeywordArgumentsValue) {
              kwargs = arg.value;
              return false;
            }
            return true;
          });
          const caseSensitive = positionalArgs.at(0) ?? kwargs.get("case_sensitive") ?? new BooleanValue(false);
          if (!(caseSensitive instanceof BooleanValue)) {
            throw new Error("case_sensitive must be a boolean");
          }
          const by = positionalArgs.at(1) ?? kwargs.get("by") ?? new StringValue("key");
          if (!(by instanceof StringValue)) {
            throw new Error("by must be a string");
          }
          if (!["key", "value"].includes(by.value)) {
            throw new Error("by must be either 'key' or 'value'");
          }
          const reverse = positionalArgs.at(2) ?? kwargs.get("reverse") ?? new BooleanValue(false);
          if (!(reverse instanceof BooleanValue)) {
            throw new Error("reverse must be a boolean");
          }
          const items = Array.from(this.value.entries()).map(([key, value]) => new ArrayValue([new StringValue(key), value])).sort((a, b) => {
            const index = by.value === "key" ? 0 : 1;
            const aVal = a.value[index];
            const bVal = b.value[index];
            const result = compareRuntimeValues(aVal, bVal, caseSensitive.value);
            return reverse.value ? -result : result;
          });
          return new ArrayValue(items);
        })
      ]
    ]);
  }
  items() {
    return new ArrayValue(
      Array.from(this.value.entries()).map(([key, value]) => new ArrayValue([new StringValue(key), value]))
    );
  }
  keys() {
    return new ArrayValue(Array.from(this.value.keys()).map((key) => new StringValue(key)));
  }
  values() {
    return new ArrayValue(Array.from(this.value.values()));
  }
  toString() {
    return toJSON(this, {}, 0, false);
  }
};
var KeywordArgumentsValue = class extends ObjectValue {
  type = "KeywordArgumentsValue";
};
var NamespaceValue = class extends RuntimeValue {
  type = "NamespaceValue";
  toString() {
    return toJSON(this, {}, 0, false);
  }
};
var ArrayValue = class extends RuntimeValue {
  type = "ArrayValue";
  _builtins;
  get builtins() {
    return this._builtins ??= /* @__PURE__ */ new Map([["length", new IntegerValue(this.value.length)]]);
  }
  /**
   * NOTE: necessary to override since all JavaScript arrays are considered truthy,
   * while only non-empty Python arrays are consider truthy.
   *
   * e.g.,
   *  - JavaScript:  [] && 5 -> 5
   *  - Python:      [] and 5 -> []
   */
  __bool__() {
    return new BooleanValue(this.value.length > 0);
  }
  toString() {
    return toJSON(this, {}, 0, false);
  }
};
var TupleValue = class extends ArrayValue {
  type = "TupleValue";
};
var FunctionValue = class extends RuntimeValue {
  type = "FunctionValue";
};
var NullValue = class extends RuntimeValue {
  type = "NullValue";
};
var UndefinedValue = class extends RuntimeValue {
  type = "UndefinedValue";
};
function normalizeNamespaceEntry(pair) {
  let values;
  if (pair instanceof ArrayValue) {
    values = pair.value;
  } else if (pair instanceof StringValue) {
    values = Array.from(pair.value, (char) => new StringValue(char));
  }
  if (!values || values.length !== 2) {
    throw new Error("namespace expected an object or an iterable of [key, value] pairs");
  }
  const [key, value] = values;
  if (!(key instanceof StringValue)) {
    throw new Error("namespace keys must be strings");
  }
  return [key, value];
}
var _Environment = class {
  constructor(parent) {
    this.parent = parent;
  }
  /**
   * The variables declared in this environment.
   */
  variables = /* @__PURE__ */ new Map([
    [
      "namespace",
      new FunctionValue((args) => {
        const positional = args.slice();
        let kwargs;
        if (positional.at(-1) instanceof KeywordArgumentsValue) {
          kwargs = positional.pop();
        }
        if (positional.length > 1) {
          throw new Error(`namespace expected at most 1 argument, got ${positional.length}`);
        }
        const entries = /* @__PURE__ */ new Map();
        if (positional.length === 1) {
          const source = positional[0];
          if (source instanceof ObjectValue) {
            for (const [key, value] of source.value) {
              entries.set(key, value);
            }
          } else if (source instanceof ArrayValue) {
            for (const pair of source.value) {
              const [key, value] = normalizeNamespaceEntry(pair);
              entries.set(key.value, value);
            }
          } else {
            throw new Error(`'${source.type}' object is not iterable`);
          }
        }
        if (kwargs) {
          for (const [key, value] of kwargs.value) {
            entries.set(key, value);
          }
        }
        return new NamespaceValue(entries);
      })
    ]
  ]);
  tests = _Environment.TESTS;
  /**
   * Set the value of a variable in the current environment.
   */
  set(name, value) {
    return this.declareVariable(name, convertToRuntimeValues(value));
  }
  declareVariable(name, value) {
    if (this.variables.has(name)) {
      throw new SyntaxError(`Variable already declared: ${name}`);
    }
    this.variables.set(name, value);
    return value;
  }
  // private assignVariable(name: string, value: AnyRuntimeValue): AnyRuntimeValue {
  // 	const env = this.resolve(name);
  // 	env.variables.set(name, value);
  // 	return value;
  // }
  /**
   * Set variable in the current scope.
   * See https://jinja.palletsprojects.com/en/3.0.x/templates/#assignments for more information.
   */
  setVariable(name, value) {
    this.variables.set(name, value);
    return value;
  }
  /**
   * Resolve the environment in which the variable is declared.
   * @param {string} name The name of the variable.
   * @returns {Environment} The environment in which the variable is declared.
   */
  resolve(name) {
    if (this.variables.has(name)) {
      return this;
    }
    if (this.parent) {
      return this.parent.resolve(name);
    }
    throw new Error(`Unknown variable: ${name}`);
  }
  lookupVariable(name) {
    try {
      return this.resolve(name).variables.get(name) ?? new UndefinedValue();
    } catch {
      return new UndefinedValue();
    }
  }
};
var Environment = _Environment;
__publicField(Environment, "TESTS", /* @__PURE__ */ new Map([
  ["boolean", (operand) => operand.type === "BooleanValue"],
  ["callable", (operand) => operand instanceof FunctionValue],
  [
    "odd",
    (operand) => {
      if (!(operand instanceof IntegerValue)) {
        throw new Error(`cannot odd on ${operand.type}`);
      }
      return operand.value % 2 !== 0;
    }
  ],
  [
    "even",
    (operand) => {
      if (!(operand instanceof IntegerValue)) {
        throw new Error(`cannot even on ${operand.type}`);
      }
      return operand.value % 2 === 0;
    }
  ],
  ["false", (operand) => operand.type === "BooleanValue" && !operand.value],
  ["true", (operand) => operand.type === "BooleanValue" && operand.value],
  ["none", (operand) => operand.type === "NullValue"],
  ["string", (operand) => operand.type === "StringValue"],
  ["number", (operand) => operand instanceof IntegerValue || operand instanceof FloatValue],
  ["integer", (operand) => operand instanceof IntegerValue],
  ["iterable", (operand) => operand.type === "ArrayValue" || operand.type === "StringValue"],
  ["mapping", (operand) => operand instanceof ObjectValue],
  [
    "sequence",
    (operand) => operand instanceof ArrayValue || operand instanceof ObjectValue || operand instanceof StringValue
  ],
  [
    "lower",
    (operand) => {
      const str = operand.value;
      return operand.type === "StringValue" && str === str.toLowerCase();
    }
  ],
  [
    "upper",
    (operand) => {
      const str = operand.value;
      return operand.type === "StringValue" && str === str.toUpperCase();
    }
  ],
  ["none", (operand) => operand.type === "NullValue"],
  ["defined", (operand) => operand.type !== "UndefinedValue"],
  ["undefined", (operand) => operand.type === "UndefinedValue"],
  ["equalto", (a, b) => a.value === b.value],
  ["eq", (a, b) => a.value === b.value]
]));
function setupGlobals(env3) {
  env3.set("false", false);
  env3.set("true", true);
  env3.set("none", null);
  env3.set("raise_exception", (args) => {
    throw new Error(args);
  });
  env3.set("range", range);
  env3.set("strftime_now", strftime_now);
  env3.set("True", true);
  env3.set("False", false);
  env3.set("None", null);
}
function isAttributeContainer(value) {
  return value instanceof ObjectValue || value instanceof NamespaceValue;
}
function isNumericLikeValue(value) {
  return value instanceof IntegerValue || value instanceof FloatValue || value instanceof BooleanValue;
}
function getNumericValue(value) {
  return value instanceof BooleanValue ? Number(value.value) : value.value;
}
function getAttributeValue(item, attributePath) {
  const parts = attributePath.split(".");
  let value = item;
  for (const part of parts) {
    if (isAttributeContainer(value)) {
      value = value.value.get(part) ?? new UndefinedValue();
    } else if (value instanceof ArrayValue) {
      const index = parseInt(part, 10);
      if (!isNaN(index) && index >= 0 && index < value.value.length) {
        value = value.value[index];
      } else {
        return new UndefinedValue();
      }
    } else {
      return new UndefinedValue();
    }
  }
  return value;
}
function compareRuntimeValues(a, b, caseSensitive = false) {
  if (a instanceof NullValue && b instanceof NullValue) {
    return 0;
  }
  if (a instanceof NullValue || b instanceof NullValue) {
    throw new Error(`Cannot compare ${a.type} with ${b.type}`);
  }
  if (a instanceof UndefinedValue && b instanceof UndefinedValue) {
    return 0;
  }
  if (a instanceof UndefinedValue || b instanceof UndefinedValue) {
    throw new Error(`Cannot compare ${a.type} with ${b.type}`);
  }
  if (isNumericLikeValue(a) && isNumericLikeValue(b)) {
    const aNum = getNumericValue(a);
    const bNum = getNumericValue(b);
    return aNum < bNum ? -1 : aNum > bNum ? 1 : 0;
  }
  if (a.type !== b.type) {
    throw new Error(`Cannot compare different types: ${a.type} and ${b.type}`);
  }
  switch (a.type) {
    case "StringValue": {
      let aStr = a.value;
      let bStr = b.value;
      if (!caseSensitive) {
        aStr = aStr.toLowerCase();
        bStr = bStr.toLowerCase();
      }
      return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
    }
    default:
      throw new Error(`Cannot compare type: ${a.type}`);
  }
}
function getParameterDescriptor(argument) {
  if (argument.type === "Identifier") {
    return { name: argument.value };
  }
  const keywordArgument = argument;
  return { name: keywordArgument.key.value, defaultValue: keywordArgument.value };
}
function isSpecialMacroArgument(name) {
  return name === "kwargs" || name === "varargs";
}
function findAccessedSpecialMacroArguments(parameters, body) {
  const declared = /* @__PURE__ */ new Set();
  const accessed = /* @__PURE__ */ new Set();
  const declareName = (name) => {
    if (isSpecialMacroArgument(name)) {
      declared.add(name);
    }
  };
  const declareTarget = (target) => {
    if (target.type === "Identifier") {
      declareName(target.value);
    } else if (target.type === "TupleLiteral") {
      for (const item of target.value) {
        declareTarget(item);
      }
    }
  };
  const declareArgument = (argument) => {
    declareName(getParameterDescriptor(argument).name);
  };
  const visitArgumentDefaults = (args) => {
    for (const argument of args) {
      const parameter = getParameterDescriptor(argument);
      if (parameter.defaultValue) {
        visit(parameter.defaultValue);
      }
    }
  };
  const visitFilter = (filter) => {
    if (filter.type === "CallExpression") {
      visit(filter.args);
    }
  };
  const visit = (node) => {
    if (Array.isArray(node)) {
      for (const item of node) {
        visit(item);
      }
      return;
    }
    if (node instanceof Map) {
      for (const [key, value] of node) {
        visit(key);
        visit(value);
      }
      return;
    }
    if (!(node instanceof Statement)) {
      return;
    }
    switch (node.type) {
      case "For": {
        const statement = node;
        declareTarget(statement.loopvar);
        if (statement.iterable.type === "SelectExpression") {
          const iterable = statement.iterable;
          visit(iterable.lhs);
          visit(statement.body);
          visit(statement.defaultBlock);
          visit(iterable.test);
          return;
        }
        visit(statement.iterable);
        visit(statement.body);
        visit(statement.defaultBlock);
        return;
      }
      case "Set": {
        const statement = node;
        declareTarget(statement.assignee);
        visit(statement.value);
        visit(statement.body);
        return;
      }
      case "Macro": {
        const statement = node;
        for (const argument of statement.args) {
          declareArgument(argument);
        }
        visitArgumentDefaults(statement.args);
        visit(statement.body);
        return;
      }
      case "CallStatement": {
        const statement = node;
        visit(statement.call);
        for (const argument of statement.callerArgs ?? []) {
          declareArgument(argument);
        }
        visitArgumentDefaults(statement.callerArgs ?? []);
        visit(statement.body);
        return;
      }
      case "FilterStatement": {
        const statement = node;
        visit(statement.body);
        visitFilter(statement.filter);
        return;
      }
      case "Identifier": {
        const name = node.value;
        if (isSpecialMacroArgument(name) && !declared.has(name)) {
          accessed.add(name);
        }
        return;
      }
      case "MemberExpression": {
        const expression = node;
        visit(expression.object);
        if (expression.computed) {
          visit(expression.property);
        }
        return;
      }
      case "FilterExpression": {
        const expression = node;
        visit(expression.operand);
        visitFilter(expression.filter);
        return;
      }
      case "TestExpression":
        visit(node.operand);
        return;
      case "SelectExpression": {
        const expression = node;
        visit(expression.test);
        visit(expression.lhs);
        return;
      }
      case "KeywordArgumentExpression":
        visit(node.value);
        return;
      default:
        for (const child of Object.values(node)) {
          visit(child);
        }
    }
  };
  for (const parameter of parameters) {
    declareArgument(parameter);
  }
  visit(body);
  return accessed;
}
var Interpreter = class {
  global;
  constructor(env3) {
    this.global = env3 ?? new Environment();
  }
  /**
   * Run the program.
   */
  run(program) {
    return this.evaluate(program, this.global);
  }
  /**
   * Evaluates expressions following the binary operation type.
   */
  evaluateBinaryExpression(node, environment) {
    const left = this.evaluate(node.left, environment);
    switch (node.operator.value) {
      case "and":
        return left.__bool__().value ? this.evaluate(node.right, environment) : left;
      case "or":
        return left.__bool__().value ? left : this.evaluate(node.right, environment);
    }
    const right = this.evaluate(node.right, environment);
    switch (node.operator.value) {
      case "==":
        return new BooleanValue(left.value == right.value);
      case "!=":
        return new BooleanValue(left.value != right.value);
    }
    if (left instanceof UndefinedValue || right instanceof UndefinedValue) {
      if (right instanceof UndefinedValue && ["in", "not in"].includes(node.operator.value)) {
        return new BooleanValue(node.operator.value === "not in");
      }
      throw new Error(`Cannot perform operation ${node.operator.value} on undefined values`);
    } else if (left instanceof NullValue || right instanceof NullValue) {
      throw new Error("Cannot perform operation on null values");
    } else if (node.operator.value === "~") {
      return new StringValue(left.value.toString() + right.value.toString());
    } else if (node.operator.value === "**" && isNumericLikeValue(left) && isNumericLikeValue(right)) {
      const a = getNumericValue(left);
      const b = getNumericValue(right);
      if (a === 0 && b < 0) {
        throw new Error("0.0 cannot be raised to a negative power");
      }
      const result = a ** b;
      if (!Number.isFinite(result)) {
        throw new Error("Exponentiation result is not a finite real number");
      }
      const isFloat = left instanceof FloatValue || right instanceof FloatValue || b < 0;
      return isFloat ? new FloatValue(result) : new IntegerValue(result);
    } else if ((left instanceof IntegerValue || left instanceof FloatValue) && (right instanceof IntegerValue || right instanceof FloatValue)) {
      const a = left.value, b = right.value;
      switch (node.operator.value) {
        case "+":
        case "-":
        case "*": {
          const res = node.operator.value === "+" ? a + b : node.operator.value === "-" ? a - b : a * b;
          const isFloat = left instanceof FloatValue || right instanceof FloatValue;
          return isFloat ? new FloatValue(res) : new IntegerValue(res);
        }
        case "/":
          return new FloatValue(a / b);
        case "//": {
          const res = Math.floor(a / b);
          const isFloat = left instanceof FloatValue || right instanceof FloatValue;
          return isFloat ? new FloatValue(res) : new IntegerValue(res);
        }
        case "%": {
          const rem = a % b;
          const isFloat = left instanceof FloatValue || right instanceof FloatValue;
          return isFloat ? new FloatValue(rem) : new IntegerValue(rem);
        }
        case "<":
          return new BooleanValue(a < b);
        case ">":
          return new BooleanValue(a > b);
        case ">=":
          return new BooleanValue(a >= b);
        case "<=":
          return new BooleanValue(a <= b);
      }
    } else if (left instanceof ArrayValue && right instanceof ArrayValue) {
      switch (node.operator.value) {
        case "+":
          return new ArrayValue(left.value.concat(right.value));
      }
    } else if (right instanceof ArrayValue) {
      const member = right.value.find((x) => x.value === left.value) !== void 0;
      switch (node.operator.value) {
        case "in":
          return new BooleanValue(member);
        case "not in":
          return new BooleanValue(!member);
      }
    }
    if (left instanceof StringValue || right instanceof StringValue) {
      switch (node.operator.value) {
        case "+":
          return new StringValue(left.value.toString() + right.value.toString());
      }
    }
    if (left instanceof StringValue && right instanceof StringValue) {
      switch (node.operator.value) {
        case "in":
          return new BooleanValue(right.value.includes(left.value));
        case "not in":
          return new BooleanValue(!right.value.includes(left.value));
      }
    }
    if (left instanceof StringValue && right instanceof ObjectValue) {
      switch (node.operator.value) {
        case "in":
          return new BooleanValue(right.value.has(left.value));
        case "not in":
          return new BooleanValue(!right.value.has(left.value));
      }
    }
    throw new SyntaxError(`Unknown operator "${node.operator.value}" between ${left.type} and ${right.type}`);
  }
  evaluateArguments(args, environment) {
    const positionalArguments = [];
    const keywordArguments = /* @__PURE__ */ new Map();
    const addKeywordArgument = (key, value) => {
      if (keywordArguments.has(key)) {
        throw new Error(`Got multiple values for keyword argument '${key}'`);
      }
      keywordArguments.set(key, value);
    };
    for (const argument of args) {
      if (argument.type === "SpreadExpression") {
        const spreadNode = argument;
        const val = this.evaluate(spreadNode.argument, environment);
        if (!(val instanceof ArrayValue)) {
          throw new Error(`Cannot unpack non-iterable type: ${val.type}`);
        }
        for (const item of val.value) {
          positionalArguments.push(item);
        }
      } else if (argument.type !== "KeywordArgumentExpression" && argument.type !== "KeywordSpreadExpression") {
        positionalArguments.push(this.evaluate(argument, environment));
      }
    }
    for (const argument of args) {
      if (argument.type === "KeywordArgumentExpression") {
        const kwarg = argument;
        addKeywordArgument(kwarg.key.value, this.evaluate(kwarg.value, environment));
      } else if (argument.type === "KeywordSpreadExpression") {
        const spreadNode = argument;
        const val = this.evaluate(spreadNode.argument, environment);
        if (!(val instanceof ObjectValue)) {
          throw new Error(`Argument after ** must be a mapping, not ${val.type}`);
        }
        for (const [key, value] of val.value) {
          addKeywordArgument(key, value);
        }
      }
    }
    return [positionalArguments, keywordArguments];
  }
  applyFilter(operand, filterNode, environment) {
    if (filterNode.type === "Identifier") {
      const filter = filterNode;
      if (filter.value === "safe") {
        return operand;
      }
      if (filter.value === "tojson") {
        return new StringValue(toJSON(operand, {}));
      }
      if (operand instanceof ArrayValue) {
        switch (filter.value) {
          case "list":
            return operand;
          case "first":
            return operand.value[0];
          case "last":
            return operand.value[operand.value.length - 1];
          case "length":
            return new IntegerValue(operand.value.length);
          case "reverse":
            return new ArrayValue(operand.value.slice().reverse());
          case "sort": {
            return new ArrayValue(operand.value.slice().sort((a, b) => compareRuntimeValues(a, b, false)));
          }
          case "join":
            return new StringValue(operand.value.map((x) => x.value).join(""));
          case "string":
            return new StringValue(toJSON(operand, {}, 0, false));
          case "unique": {
            const seen = /* @__PURE__ */ new Set();
            const output = [];
            for (const item of operand.value) {
              if (!seen.has(item.value)) {
                seen.add(item.value);
                output.push(item);
              }
            }
            return new ArrayValue(output);
          }
          default:
            throw new Error(`Unknown ArrayValue filter: ${filter.value}`);
        }
      } else if (operand instanceof StringValue) {
        switch (filter.value) {
          case "length":
          case "upper":
          case "lower":
          case "title":
          case "capitalize": {
            const builtin = operand.builtins.get(filter.value);
            if (builtin instanceof FunctionValue) {
              return builtin.value(
                /* no arguments */
                [],
                environment
              );
            } else if (builtin instanceof IntegerValue) {
              return builtin;
            } else {
              throw new Error(`Unknown StringValue filter: ${filter.value}`);
            }
          }
          case "trim":
            return new StringValue(operand.value.trim());
          case "indent":
            return new StringValue(
              operand.value.split("\n").map(
                (x, i) => (
                  // By default, don't indent the first line or empty lines
                  i === 0 || x.length === 0 ? x : "    " + x
                )
              ).join("\n")
            );
          case "join":
          case "string":
            return operand;
          case "int": {
            const val = parseInt(operand.value, 10);
            return new IntegerValue(isNaN(val) ? 0 : val);
          }
          case "float": {
            const val = parseFloat(operand.value);
            return new FloatValue(isNaN(val) ? 0 : val);
          }
          default:
            throw new Error(`Unknown StringValue filter: ${filter.value}`);
        }
      } else if (operand instanceof IntegerValue || operand instanceof FloatValue) {
        switch (filter.value) {
          case "abs":
            return operand instanceof IntegerValue ? new IntegerValue(Math.abs(operand.value)) : new FloatValue(Math.abs(operand.value));
          case "int":
            return new IntegerValue(Math.floor(operand.value));
          case "float":
            return new FloatValue(operand.value);
          case "string":
            return new StringValue(operand.toString());
          default:
            throw new Error(`Unknown NumericValue filter: ${filter.value}`);
        }
      } else if (operand instanceof ObjectValue) {
        switch (filter.value) {
          case "items":
            return new ArrayValue(
              Array.from(operand.value.entries()).map(([key, value]) => new ArrayValue([new StringValue(key), value]))
            );
          case "length":
            return new IntegerValue(operand.value.size);
          default: {
            const builtin = operand.builtins.get(filter.value);
            if (builtin) {
              if (builtin instanceof FunctionValue) {
                return builtin.value([], environment);
              }
              return builtin;
            }
            throw new Error(`Unknown ObjectValue filter: ${filter.value}`);
          }
        }
      } else if (operand instanceof BooleanValue) {
        switch (filter.value) {
          case "bool":
            return new BooleanValue(operand.value);
          case "int":
            return new IntegerValue(operand.value ? 1 : 0);
          case "float":
            return new FloatValue(operand.value ? 1 : 0);
          case "string":
            return new StringValue(operand.value ? "true" : "false");
          default:
            throw new Error(`Unknown BooleanValue filter: ${filter.value}`);
        }
      }
      throw new Error(`Cannot apply filter "${filter.value}" to type: ${operand.type}`);
    } else if (filterNode.type === "CallExpression") {
      const filter = filterNode;
      if (filter.callee.type !== "Identifier") {
        throw new Error(`Unknown filter: ${filter.callee.type}`);
      }
      const filterName = filter.callee.value;
      if (filterName === "tojson") {
        const [, kwargs] = this.evaluateArguments(filter.args, environment);
        const indent = kwargs.get("indent") ?? new NullValue();
        if (!(indent instanceof IntegerValue || indent instanceof NullValue)) {
          throw new Error("If set, indent must be a number");
        }
        const ensureAscii = kwargs.get("ensure_ascii") ?? new BooleanValue(false);
        if (!(ensureAscii instanceof BooleanValue)) {
          throw new Error("If set, ensure_ascii must be a boolean");
        }
        const sortKeys = kwargs.get("sort_keys") ?? new BooleanValue(false);
        if (!(sortKeys instanceof BooleanValue)) {
          throw new Error("If set, sort_keys must be a boolean");
        }
        const separatorsArg = kwargs.get("separators") ?? new NullValue();
        let separators = null;
        if (separatorsArg instanceof ArrayValue || separatorsArg instanceof TupleValue) {
          if (separatorsArg.value.length !== 2) {
            throw new Error("separators must be a tuple of two strings");
          }
          const [itemSep, keySep] = separatorsArg.value;
          if (!(itemSep instanceof StringValue) || !(keySep instanceof StringValue)) {
            throw new Error("separators must be a tuple of two strings");
          }
          separators = [itemSep.value, keySep.value];
        } else if (!(separatorsArg instanceof NullValue)) {
          throw new Error("If set, separators must be a tuple of two strings");
        }
        return new StringValue(
          toJSON(operand, {
            indent: indent.value,
            ensureAscii: ensureAscii.value,
            sortKeys: sortKeys.value,
            separators
          })
        );
      } else if (filterName === "join") {
        let value;
        if (operand instanceof StringValue) {
          value = Array.from(operand.value);
        } else if (operand instanceof ArrayValue) {
          value = operand.value.map((x) => x.value);
        } else {
          throw new Error(`Cannot apply filter "${filterName}" to type: ${operand.type}`);
        }
        const [args, kwargs] = this.evaluateArguments(filter.args, environment);
        const separator = args.at(0) ?? kwargs.get("separator") ?? new StringValue("");
        if (!(separator instanceof StringValue)) {
          throw new Error("separator must be a string");
        }
        return new StringValue(value.join(separator.value));
      } else if (filterName === "int" || filterName === "float") {
        const [args, kwargs] = this.evaluateArguments(filter.args, environment);
        const defaultValue = args.at(0) ?? kwargs.get("default") ?? (filterName === "int" ? new IntegerValue(0) : new FloatValue(0));
        if (operand instanceof StringValue) {
          const val = filterName === "int" ? parseInt(operand.value, 10) : parseFloat(operand.value);
          return isNaN(val) ? defaultValue : filterName === "int" ? new IntegerValue(val) : new FloatValue(val);
        } else if (operand instanceof IntegerValue || operand instanceof FloatValue) {
          return operand;
        } else if (operand instanceof BooleanValue) {
          return filterName === "int" ? new IntegerValue(operand.value ? 1 : 0) : new FloatValue(operand.value ? 1 : 0);
        } else {
          throw new Error(`Cannot apply filter "${filterName}" to type: ${operand.type}`);
        }
      } else if (filterName === "default") {
        const [args, kwargs] = this.evaluateArguments(filter.args, environment);
        const defaultValue = args[0] ?? new StringValue("");
        const booleanValue = args[1] ?? kwargs.get("boolean") ?? new BooleanValue(false);
        if (!(booleanValue instanceof BooleanValue)) {
          throw new Error("`default` filter flag must be a boolean");
        }
        if (operand instanceof UndefinedValue || booleanValue.value && !operand.__bool__().value) {
          return defaultValue;
        }
        return operand;
      }
      if (operand instanceof ArrayValue) {
        switch (filterName) {
          case "sort": {
            const [args, kwargs] = this.evaluateArguments(filter.args, environment);
            const reverse = args.at(0) ?? kwargs.get("reverse") ?? new BooleanValue(false);
            if (!(reverse instanceof BooleanValue)) {
              throw new Error("reverse must be a boolean");
            }
            const caseSensitive = args.at(1) ?? kwargs.get("case_sensitive") ?? new BooleanValue(false);
            if (!(caseSensitive instanceof BooleanValue)) {
              throw new Error("case_sensitive must be a boolean");
            }
            const attribute = args.at(2) ?? kwargs.get("attribute") ?? new NullValue();
            if (!(attribute instanceof StringValue || attribute instanceof IntegerValue || attribute instanceof NullValue)) {
              throw new Error("attribute must be a string, integer, or null");
            }
            const getSortValue = (item) => {
              if (attribute instanceof NullValue) {
                return item;
              }
              const attrPath = attribute instanceof IntegerValue ? String(attribute.value) : attribute.value;
              return getAttributeValue(item, attrPath);
            };
            return new ArrayValue(
              operand.value.slice().sort((a, b) => {
                const aVal = getSortValue(a);
                const bVal = getSortValue(b);
                const result = compareRuntimeValues(aVal, bVal, caseSensitive.value);
                return reverse.value ? -result : result;
              })
            );
          }
          case "selectattr":
          case "rejectattr": {
            const select = filterName === "selectattr";
            if (operand.value.some((item) => !isAttributeContainer(item))) {
              throw new Error(`\`${filterName}\` can only be applied to array of objects`);
            }
            if (filter.args.some((x) => x.type !== "StringLiteral")) {
              throw new Error(`arguments of \`${filterName}\` must be strings`);
            }
            const [attr, testName, value] = filter.args.map((x) => this.evaluate(x, environment));
            let testFunction;
            if (testName) {
              const test = environment.tests.get(testName.value);
              if (!test) {
                throw new Error(`Unknown test: ${testName.value}`);
              }
              testFunction = test;
            } else {
              testFunction = (...x) => x[0].__bool__().value;
            }
            const filtered = operand.value.filter((item) => {
              const a = item.value.get(attr.value);
              const result = a ? testFunction(a, value) : false;
              return select ? result : !result;
            });
            return new ArrayValue(filtered);
          }
          case "map": {
            const [, kwargs] = this.evaluateArguments(filter.args, environment);
            if (kwargs.has("attribute")) {
              const attr = kwargs.get("attribute");
              if (!(attr instanceof StringValue)) {
                throw new Error("attribute must be a string");
              }
              const defaultValue = kwargs.get("default");
              const mapped = operand.value.map((item) => {
                if (!isAttributeContainer(item)) {
                  throw new Error("items in map must be an object");
                }
                const value = getAttributeValue(item, attr.value);
                return value instanceof UndefinedValue ? defaultValue ?? new UndefinedValue() : value;
              });
              return new ArrayValue(mapped);
            } else {
              throw new Error("`map` expressions without `attribute` set are not currently supported.");
            }
          }
        }
        throw new Error(`Unknown ArrayValue filter: ${filterName}`);
      } else if (operand instanceof StringValue) {
        switch (filterName) {
          case "indent": {
            const [args, kwargs] = this.evaluateArguments(filter.args, environment);
            const width = args.at(0) ?? kwargs.get("width") ?? new IntegerValue(4);
            if (!(width instanceof IntegerValue)) {
              throw new Error("width must be a number");
            }
            const first = args.at(1) ?? kwargs.get("first") ?? new BooleanValue(false);
            const blank = args.at(2) ?? kwargs.get("blank") ?? new BooleanValue(false);
            const lines = operand.value.split("\n");
            const indent = " ".repeat(width.value);
            const indented = lines.map(
              (x, i) => !first.value && i === 0 || !blank.value && x.length === 0 ? x : indent + x
            );
            return new StringValue(indented.join("\n"));
          }
          case "replace": {
            const replaceFn = operand.builtins.get("replace");
            if (!(replaceFn instanceof FunctionValue)) {
              throw new Error("replace filter not available");
            }
            const [args, kwargs] = this.evaluateArguments(filter.args, environment);
            return replaceFn.value([...args, new KeywordArgumentsValue(kwargs)], environment);
          }
        }
        throw new Error(`Unknown StringValue filter: ${filterName}`);
      } else if (operand instanceof ObjectValue) {
        const builtin = operand.builtins.get(filterName);
        if (builtin && builtin instanceof FunctionValue) {
          const [args, kwargs] = this.evaluateArguments(filter.args, environment);
          if (kwargs.size > 0) {
            args.push(new KeywordArgumentsValue(kwargs));
          }
          return builtin.value(args, environment);
        }
        throw new Error(`Unknown ObjectValue filter: ${filterName}`);
      } else {
        throw new Error(`Cannot apply filter "${filterName}" to type: ${operand.type}`);
      }
    }
    throw new Error(`Unknown filter: ${filterNode.type}`);
  }
  /**
   * Evaluates expressions following the filter operation type.
   */
  evaluateFilterExpression(node, environment) {
    const operand = this.evaluate(node.operand, environment);
    return this.applyFilter(operand, node.filter, environment);
  }
  /**
   * Evaluates expressions following the test operation type.
   */
  evaluateTestExpression(node, environment) {
    const operand = this.evaluate(node.operand, environment);
    const test = environment.tests.get(node.test.value);
    if (!test) {
      throw new Error(`Unknown test: ${node.test.value}`);
    }
    const result = test(operand);
    return new BooleanValue(node.negate ? !result : result);
  }
  /**
   * Evaluates expressions following the select operation type.
   */
  evaluateSelectExpression(node, environment) {
    const predicate = this.evaluate(node.test, environment);
    if (!predicate.__bool__().value) {
      return new UndefinedValue();
    }
    return this.evaluate(node.lhs, environment);
  }
  /**
   * Evaluates expressions following the unary operation type.
   */
  evaluateUnaryExpression(node, environment) {
    const argument = this.evaluate(node.argument, environment);
    switch (node.operator.value) {
      case "not":
        return new BooleanValue(!argument.__bool__().value);
      case "+":
      case "-": {
        const sign = node.operator.value === "-" ? -1 : 1;
        if (argument instanceof IntegerValue || argument instanceof FloatValue || argument instanceof BooleanValue) {
          const value = argument instanceof BooleanValue ? argument.value ? 1 : 0 : argument.value;
          const result = sign * value;
          return argument instanceof FloatValue ? new FloatValue(result) : new IntegerValue(result);
        }
        throw new SyntaxError(`Unknown operator "${node.operator.value}" for ${argument.type}`);
      }
      default:
        throw new SyntaxError(`Unknown operator: ${node.operator.value}`);
    }
  }
  evaluateTernaryExpression(node, environment) {
    const cond = this.evaluate(node.condition, environment);
    return cond.__bool__().value ? this.evaluate(node.trueExpr, environment) : this.evaluate(node.falseExpr, environment);
  }
  evalProgram(program, environment) {
    return this.evaluateBlock(program.body, environment);
  }
  evaluateBlock(statements, environment) {
    let result = "";
    for (const statement of statements) {
      const lastEvaluated = this.evaluate(statement, environment);
      if (lastEvaluated.type !== "NullValue" && lastEvaluated.type !== "UndefinedValue") {
        result += lastEvaluated.toString();
      }
    }
    return new StringValue(result);
  }
  evaluateIdentifier(node, environment) {
    return environment.lookupVariable(node.value);
  }
  evaluateCallExpression(expr, environment) {
    const [args, kwargs] = this.evaluateArguments(expr.args, environment);
    if (kwargs.size > 0) {
      args.push(new KeywordArgumentsValue(kwargs));
    }
    const fn2 = this.evaluate(expr.callee, environment);
    if (fn2.type !== "FunctionValue") {
      throw new Error(`Cannot call something that is not a function: got ${fn2.type}`);
    }
    return fn2.value(args, environment);
  }
  evaluateSliceExpression(object, expr, environment) {
    if (!(object instanceof ArrayValue || object instanceof StringValue)) {
      throw new Error("Slice object must be an array or string");
    }
    const start = this.evaluate(expr.start, environment);
    const stop = this.evaluate(expr.stop, environment);
    const step = this.evaluate(expr.step, environment);
    if (!(start instanceof IntegerValue || start instanceof UndefinedValue)) {
      throw new Error("Slice start must be numeric or undefined");
    }
    if (!(stop instanceof IntegerValue || stop instanceof UndefinedValue)) {
      throw new Error("Slice stop must be numeric or undefined");
    }
    if (!(step instanceof IntegerValue || step instanceof UndefinedValue)) {
      throw new Error("Slice step must be numeric or undefined");
    }
    if (object instanceof ArrayValue) {
      return new ArrayValue(slice(object.value, start.value, stop.value, step.value));
    } else {
      return new StringValue(slice(Array.from(object.value), start.value, stop.value, step.value).join(""));
    }
  }
  evaluateMemberExpression(expr, environment) {
    const object = this.evaluate(expr.object, environment);
    let property;
    if (expr.computed) {
      if (expr.property.type === "SliceExpression") {
        return this.evaluateSliceExpression(object, expr.property, environment);
      } else {
        property = this.evaluate(expr.property, environment);
      }
    } else if (expr.property.type === "IntegerLiteral") {
      property = new IntegerValue(expr.property.value);
    } else {
      property = new StringValue(expr.property.value);
    }
    let value;
    if (isAttributeContainer(object)) {
      if (!(property instanceof StringValue)) {
        throw new Error(`Cannot access property with non-string: got ${property.type}`);
      }
      value = object.value.get(property.value) ?? (object instanceof ObjectValue ? object.builtins.get(property.value) : void 0);
    } else if (object instanceof ArrayValue || object instanceof StringValue) {
      if (property instanceof IntegerValue) {
        if (object instanceof StringValue) {
          const character = object.value.at(property.value);
          value = character === void 0 ? void 0 : new StringValue(character);
        } else {
          value = object.value.at(property.value);
        }
      } else if (property instanceof StringValue) {
        value = object.builtins.get(property.value);
      } else {
        throw new Error(`Cannot access property with non-string/non-number: got ${property.type}`);
      }
    } else {
      if (!(property instanceof StringValue)) {
        throw new Error(`Cannot access property with non-string: got ${property.type}`);
      }
      value = object.builtins.get(property.value);
    }
    return value instanceof RuntimeValue ? value : new UndefinedValue();
  }
  evaluateSet(node, environment) {
    const rhs = node.value ? this.evaluate(node.value, environment) : this.evaluateBlock(node.body, environment);
    if (node.assignee.type === "Identifier") {
      const variableName = node.assignee.value;
      environment.setVariable(variableName, rhs);
    } else if (node.assignee.type === "TupleLiteral") {
      const tuple = node.assignee;
      if (!(rhs instanceof ArrayValue)) {
        throw new Error(`Cannot unpack non-iterable type in set: ${rhs.type}`);
      }
      const arr = rhs.value;
      if (arr.length !== tuple.value.length) {
        throw new Error(`Too ${tuple.value.length > arr.length ? "few" : "many"} items to unpack in set`);
      }
      for (let i = 0; i < tuple.value.length; ++i) {
        const elem = tuple.value[i];
        if (elem.type !== "Identifier") {
          throw new Error(`Cannot unpack to non-identifier in set: ${elem.type}`);
        }
        environment.setVariable(elem.value, arr[i]);
      }
    } else if (node.assignee.type === "MemberExpression") {
      const member = node.assignee;
      const object = this.evaluate(member.object, environment);
      if (!(object instanceof NamespaceValue)) {
        throw new Error("cannot assign attribute on non-namespace object");
      }
      if (member.property.type !== "Identifier") {
        throw new Error("Cannot assign to member with non-identifier property");
      }
      object.value.set(member.property.value, rhs);
    } else {
      throw new Error(`Invalid LHS inside assignment expression: ${JSON.stringify(node.assignee)}`);
    }
    return new NullValue();
  }
  evaluateIf(node, environment) {
    const test = this.evaluate(node.test, environment);
    return this.evaluateBlock(test.__bool__().value ? node.body : node.alternate, environment);
  }
  evaluateFor(node, environment) {
    const scope = new Environment(environment);
    let test, iterable;
    if (node.iterable.type === "SelectExpression") {
      const select = node.iterable;
      iterable = this.evaluate(select.lhs, scope);
      test = select.test;
    } else {
      iterable = this.evaluate(node.iterable, scope);
    }
    if (!(iterable instanceof ArrayValue || iterable instanceof ObjectValue)) {
      throw new Error(`Expected iterable or object type in for loop: got ${iterable.type}`);
    }
    if (iterable instanceof ObjectValue) {
      iterable = iterable.keys();
    }
    const items = [];
    const scopeUpdateFunctions = [];
    for (let i = 0; i < iterable.value.length; ++i) {
      const loopScope = new Environment(scope);
      const current = iterable.value[i];
      let scopeUpdateFunction;
      if (node.loopvar.type === "Identifier") {
        scopeUpdateFunction = (scope2) => scope2.setVariable(node.loopvar.value, current);
      } else if (node.loopvar.type === "TupleLiteral") {
        const loopvar = node.loopvar;
        if (current.type !== "ArrayValue") {
          throw new Error(`Cannot unpack non-iterable type: ${current.type}`);
        }
        const c = current;
        if (loopvar.value.length !== c.value.length) {
          throw new Error(`Too ${loopvar.value.length > c.value.length ? "few" : "many"} items to unpack`);
        }
        scopeUpdateFunction = (scope2) => {
          for (let j = 0; j < loopvar.value.length; ++j) {
            if (loopvar.value[j].type !== "Identifier") {
              throw new Error(`Cannot unpack non-identifier type: ${loopvar.value[j].type}`);
            }
            scope2.setVariable(loopvar.value[j].value, c.value[j]);
          }
        };
      } else {
        throw new Error(`Invalid loop variable(s): ${node.loopvar.type}`);
      }
      if (test) {
        scopeUpdateFunction(loopScope);
        const testValue = this.evaluate(test, loopScope);
        if (!testValue.__bool__().value) {
          continue;
        }
      }
      items.push(current);
      scopeUpdateFunctions.push(scopeUpdateFunction);
    }
    let result = "";
    let noIteration = true;
    for (let i = 0; i < items.length; ++i) {
      const loop = /* @__PURE__ */ new Map([
        ["index", new IntegerValue(i + 1)],
        ["index0", new IntegerValue(i)],
        ["revindex", new IntegerValue(items.length - i)],
        ["revindex0", new IntegerValue(items.length - i - 1)],
        ["first", new BooleanValue(i === 0)],
        ["last", new BooleanValue(i === items.length - 1)],
        ["length", new IntegerValue(items.length)],
        ["previtem", i > 0 ? items[i - 1] : new UndefinedValue()],
        ["nextitem", i < items.length - 1 ? items[i + 1] : new UndefinedValue()]
      ]);
      scope.setVariable("loop", new ObjectValue(loop));
      scopeUpdateFunctions[i](scope);
      try {
        const evaluated = this.evaluateBlock(node.body, scope);
        result += evaluated.value;
      } catch (err) {
        if (err instanceof ContinueControl) {
          continue;
        }
        if (err instanceof BreakControl) {
          break;
        }
        throw err;
      }
      noIteration = false;
    }
    if (noIteration) {
      const defaultEvaluated = this.evaluateBlock(node.defaultBlock, scope);
      result += defaultEvaluated.value;
    }
    return new StringValue(result);
  }
  /**
   * Bind every parameter name and special argument before evaluating defaults,
   * preventing unbound parameters from resolving in an outer scope.
   */
  bindMacroArguments(displayName, parameters, specialArguments, args, scope) {
    const positionalArguments = args.slice();
    let keywordArguments = /* @__PURE__ */ new Map();
    if (positionalArguments.at(-1) instanceof KeywordArgumentsValue) {
      keywordArguments = new Map(positionalArguments.pop().value);
    }
    const pendingDefaults = [];
    for (let i = 0; i < parameters.length; ++i) {
      const { name, defaultValue } = getParameterDescriptor(parameters[i]);
      let value = positionalArguments[i];
      if (value === void 0 && keywordArguments.has(name)) {
        value = keywordArguments.get(name);
        keywordArguments.delete(name);
      }
      if (value === void 0 && defaultValue !== void 0) {
        pendingDefaults.push([name, defaultValue]);
      }
      scope.setVariable(name, value ?? new UndefinedValue());
    }
    if (specialArguments.has("kwargs")) {
      scope.setVariable("kwargs", new ObjectValue(keywordArguments));
    } else if (keywordArguments.size > 0) {
      throw new Error(`macro ${displayName} takes no keyword argument '${keywordArguments.keys().next().value}'`);
    }
    if (specialArguments.has("varargs")) {
      scope.setVariable("varargs", new ArrayValue(positionalArguments.slice(parameters.length)));
    } else if (positionalArguments.length > parameters.length) {
      throw new Error(`macro ${displayName} takes not more than ${parameters.length} argument(s)`);
    }
    for (const [name, defaultValue] of pendingDefaults) {
      scope.setVariable(name, this.evaluate(defaultValue, scope));
    }
  }
  /**
   * See https://jinja.palletsprojects.com/en/3.1.x/templates/#macros for more information.
   */
  evaluateMacro(node, environment) {
    const specialArguments = findAccessedSpecialMacroArguments(node.args, node.body);
    environment.setVariable(
      node.name.value,
      new FunctionValue((args, scope) => {
        const macroScope = new Environment(scope);
        this.bindMacroArguments(`'${node.name.value}'`, node.args, specialArguments, args, macroScope);
        return this.evaluateBlock(node.body, macroScope);
      })
    );
    return new NullValue();
  }
  evaluateCallStatement(node, environment) {
    const parameters = node.callerArgs ?? [];
    const specialArguments = findAccessedSpecialMacroArguments(parameters, node.body);
    const callerFn = new FunctionValue((callerArguments) => {
      const callBlockEnv = new Environment(environment);
      this.bindMacroArguments("None", parameters, specialArguments, callerArguments, callBlockEnv);
      return this.evaluateBlock(node.body, callBlockEnv);
    });
    const [macroArgs, macroKwargs] = this.evaluateArguments(node.call.args, environment);
    macroArgs.push(new KeywordArgumentsValue(macroKwargs));
    const fn2 = this.evaluate(node.call.callee, environment);
    if (fn2.type !== "FunctionValue") {
      throw new Error(`Cannot call something that is not a function: got ${fn2.type}`);
    }
    const newEnv = new Environment(environment);
    newEnv.setVariable("caller", callerFn);
    return fn2.value(macroArgs, newEnv);
  }
  evaluateFilterStatement(node, environment) {
    const rendered = this.evaluateBlock(node.body, environment);
    return this.applyFilter(rendered, node.filter, environment);
  }
  evaluate(statement, environment) {
    if (!statement) {
      return new UndefinedValue();
    }
    switch (statement.type) {
      case "Program":
        return this.evalProgram(statement, environment);
      case "Set":
        return this.evaluateSet(statement, environment);
      case "If":
        return this.evaluateIf(statement, environment);
      case "For":
        return this.evaluateFor(statement, environment);
      case "Macro":
        return this.evaluateMacro(statement, environment);
      case "CallStatement":
        return this.evaluateCallStatement(statement, environment);
      case "Break":
        throw new BreakControl();
      case "Continue":
        throw new ContinueControl();
      case "IntegerLiteral":
        return new IntegerValue(statement.value);
      case "FloatLiteral":
        return new FloatValue(statement.value);
      case "StringLiteral":
        return new StringValue(statement.value);
      case "ArrayLiteral":
        return new ArrayValue(statement.value.map((x) => this.evaluate(x, environment)));
      case "TupleLiteral":
        return new TupleValue(statement.value.map((x) => this.evaluate(x, environment)));
      case "ObjectLiteral": {
        const mapping = /* @__PURE__ */ new Map();
        for (const [key, value] of statement.value) {
          const evaluatedKey = this.evaluate(key, environment);
          if (!(evaluatedKey instanceof StringValue)) {
            throw new Error(`Object keys must be strings: got ${evaluatedKey.type}`);
          }
          mapping.set(evaluatedKey.value, this.evaluate(value, environment));
        }
        return new ObjectValue(mapping);
      }
      case "Identifier":
        return this.evaluateIdentifier(statement, environment);
      case "CallExpression":
        return this.evaluateCallExpression(statement, environment);
      case "MemberExpression":
        return this.evaluateMemberExpression(statement, environment);
      case "UnaryExpression":
        return this.evaluateUnaryExpression(statement, environment);
      case "BinaryExpression":
        return this.evaluateBinaryExpression(statement, environment);
      case "FilterExpression":
        return this.evaluateFilterExpression(statement, environment);
      case "FilterStatement":
        return this.evaluateFilterStatement(statement, environment);
      case "TestExpression":
        return this.evaluateTestExpression(statement, environment);
      case "SelectExpression":
        return this.evaluateSelectExpression(statement, environment);
      case "Ternary":
        return this.evaluateTernaryExpression(statement, environment);
      case "Comment":
        return new NullValue();
      default:
        throw new SyntaxError(`Unknown node type: ${statement.type}`);
    }
  }
};
function convertToRuntimeValues(input) {
  switch (typeof input) {
    case "number":
      return Number.isInteger(input) ? new IntegerValue(input) : new FloatValue(input);
    case "string":
      return new StringValue(input);
    case "boolean":
      return new BooleanValue(input);
    case "undefined":
      return new UndefinedValue();
    case "object":
      if (input === null) {
        return new NullValue();
      } else if (Array.isArray(input)) {
        return new ArrayValue(input.map(convertToRuntimeValues));
      } else {
        return new ObjectValue(
          new Map(Object.entries(input).map(([key, value]) => [key, convertToRuntimeValues(value)]))
        );
      }
    case "function":
      return new FunctionValue((args, _scope) => {
        const result = input(...args.map((x) => x.value)) ?? null;
        return convertToRuntimeValues(result);
      });
    default:
      throw new Error(`Cannot convert to runtime value: ${input}`);
  }
}
var NEWLINE = "\n";
var OPEN_STATEMENT = "{%- ";
var CLOSE_STATEMENT = " -%}";
var PRECEDENCE = Object.freeze({
  CONDITIONAL: 0,
  // a if b else c
  LOGICAL_OR: 1,
  // or
  LOGICAL_AND: 2,
  // and
  LOGICAL_NOT: 3,
  // not a
  COMPARISON: 4,
  // == != < <= > >= in, not in
  ADDITIVE: 5,
  // + -
  MULTIPLICATIVE: 6,
  // * / // %
  EXPONENTIATION: 7,
  // **
  TEST: 8,
  // is
  FILTER: 9,
  // |
  UNARY_SIGN: 10,
  // -a +a
  ATOM: 11
  // literals, identifiers, calls, member accesses
});
function getBinaryOperatorPrecedence(expr) {
  switch (expr.operator.type) {
    case "ExponentiationBinaryOperator":
      return PRECEDENCE.EXPONENTIATION;
    case "MultiplicativeBinaryOperator":
      return PRECEDENCE.MULTIPLICATIVE;
    case "AdditiveBinaryOperator":
      return PRECEDENCE.ADDITIVE;
    case "ComparisonBinaryOperator":
      return PRECEDENCE.COMPARISON;
    case "Identifier":
      if (expr.operator.value === "and") {
        return PRECEDENCE.LOGICAL_AND;
      }
      if (expr.operator.value === "in" || expr.operator.value === "not in") {
        return PRECEDENCE.COMPARISON;
      }
      return PRECEDENCE.LOGICAL_OR;
  }
  return PRECEDENCE.LOGICAL_OR;
}
function getPrecedence(node) {
  switch (node.type) {
    case "SelectExpression":
    case "Ternary":
      return PRECEDENCE.CONDITIONAL;
    case "BinaryExpression":
      return getBinaryOperatorPrecedence(node);
    case "UnaryExpression":
      return node.operator.value === "not" ? PRECEDENCE.LOGICAL_NOT : PRECEDENCE.UNARY_SIGN;
    case "TestExpression":
      return PRECEDENCE.TEST;
    case "FilterExpression":
      return PRECEDENCE.FILTER;
    default:
      return PRECEDENCE.ATOM;
  }
}
function formatOperand(node, minPrecedence) {
  const expr = formatExpression(node);
  return getPrecedence(node) < minPrecedence ? `(${expr})` : expr;
}
function format(program, indent = "	") {
  const indentStr = typeof indent === "number" ? " ".repeat(indent) : indent;
  const body = formatStatements(program.body, 0, indentStr);
  return body.replace(/\n$/, "");
}
function createStatement(...text) {
  return OPEN_STATEMENT + text.join(" ") + CLOSE_STATEMENT;
}
function formatStatements(stmts, depth, indentStr) {
  return stmts.map((stmt) => formatStatement(stmt, depth, indentStr)).join(NEWLINE);
}
function formatExpressionList(expressions) {
  return expressions.map((expression) => formatExpression(expression)).join(", ");
}
function formatStatement(node, depth, indentStr) {
  const pad = indentStr.repeat(depth);
  switch (node.type) {
    case "Program":
      return formatStatements(node.body, depth, indentStr);
    case "If":
      return formatIf(node, depth, indentStr);
    case "For":
      return formatFor(node, depth, indentStr);
    case "Set":
      return formatSet(node, depth, indentStr);
    case "Macro":
      return formatMacro(node, depth, indentStr);
    case "Break":
      return pad + createStatement("break");
    case "Continue":
      return pad + createStatement("continue");
    case "CallStatement":
      return formatCallStatement(node, depth, indentStr);
    case "FilterStatement":
      return formatFilterStatement(node, depth, indentStr);
    case "Comment":
      return pad + "{# " + node.value + " #}";
    default:
      return pad + "{{- " + formatExpression(node) + " -}}";
  }
}
function formatIf(node, depth, indentStr) {
  const pad = indentStr.repeat(depth);
  const clauses = [];
  let current = node;
  while (current) {
    clauses.push({ test: current.test, body: current.body });
    if (current.alternate.length === 1 && current.alternate[0].type === "If") {
      current = current.alternate[0];
    } else {
      break;
    }
  }
  let out = pad + createStatement("if", formatExpression(clauses[0].test)) + NEWLINE + formatStatements(clauses[0].body, depth + 1, indentStr);
  for (let i = 1; i < clauses.length; ++i) {
    out += NEWLINE + pad + createStatement("elif", formatExpression(clauses[i].test)) + NEWLINE + formatStatements(clauses[i].body, depth + 1, indentStr);
  }
  if (current && current.alternate.length > 0) {
    out += NEWLINE + pad + createStatement("else") + NEWLINE + formatStatements(current.alternate, depth + 1, indentStr);
  }
  out += NEWLINE + pad + createStatement("endif");
  return out;
}
function formatFor(node, depth, indentStr) {
  const pad = indentStr.repeat(depth);
  let formattedIterable = "";
  if (node.iterable.type === "SelectExpression") {
    const n = node.iterable;
    formattedIterable = `${formatExpression(n.lhs)} if ${formatExpression(n.test)}`;
  } else {
    formattedIterable = formatExpression(node.iterable);
  }
  let out = pad + createStatement("for", formatExpression(node.loopvar), "in", formattedIterable) + NEWLINE + formatStatements(node.body, depth + 1, indentStr);
  if (node.defaultBlock.length > 0) {
    out += NEWLINE + pad + createStatement("else") + NEWLINE + formatStatements(node.defaultBlock, depth + 1, indentStr);
  }
  out += NEWLINE + pad + createStatement("endfor");
  return out;
}
function formatSet(node, depth, indentStr) {
  const pad = indentStr.repeat(depth);
  const left = formatExpression(node.assignee);
  const right = node.value ? formatExpression(node.value) : "";
  const value = pad + createStatement("set", `${left}${node.value ? " = " + right : ""}`);
  if (node.body.length === 0) {
    return value;
  }
  return value + NEWLINE + formatStatements(node.body, depth + 1, indentStr) + NEWLINE + pad + createStatement("endset");
}
function formatMacro(node, depth, indentStr) {
  const pad = indentStr.repeat(depth);
  const args = formatExpressionList(node.args);
  return pad + createStatement("macro", `${node.name.value}(${args})`) + NEWLINE + formatStatements(node.body, depth + 1, indentStr) + NEWLINE + pad + createStatement("endmacro");
}
function formatCallStatement(node, depth, indentStr) {
  const pad = indentStr.repeat(depth);
  const params = node.callerArgs && node.callerArgs.length > 0 ? `(${formatExpressionList(node.callerArgs)})` : "";
  const callExpr = formatExpression(node.call);
  let out = pad + createStatement(`call${params}`, callExpr) + NEWLINE;
  out += formatStatements(node.body, depth + 1, indentStr) + NEWLINE;
  out += pad + createStatement("endcall");
  return out;
}
function formatFilterStatement(node, depth, indentStr) {
  const pad = indentStr.repeat(depth);
  const spec = node.filter.type === "Identifier" ? node.filter.value : formatExpression(node.filter);
  let out = pad + createStatement("filter", spec) + NEWLINE;
  out += formatStatements(node.body, depth + 1, indentStr) + NEWLINE;
  out += pad + createStatement("endfilter");
  return out;
}
function formatExpression(node) {
  switch (node.type) {
    case "SpreadExpression": {
      const n = node;
      return `*${formatExpression(n.argument)}`;
    }
    case "KeywordSpreadExpression": {
      const n = node;
      return `**${formatExpression(n.argument)}`;
    }
    case "Identifier":
      return node.value;
    case "IntegerLiteral":
      return `${node.value}`;
    case "FloatLiteral": {
      const value = node.value;
      if (Object.is(value, -0)) {
        return "-0.0";
      }
      return value % 1 === 0 ? value.toFixed(1) : value.toString();
    }
    case "StringLiteral":
      return JSON.stringify(node.value);
    case "BinaryExpression": {
      const n = node;
      const thisPrecedence = getBinaryOperatorPrecedence(n);
      const left = formatOperand(n.left, thisPrecedence);
      const right = formatOperand(n.right, thisPrecedence + 1);
      return `${left} ${n.operator.value} ${right}`;
    }
    case "UnaryExpression": {
      const n = node;
      const operandPrecedence = n.argument.type === "UnaryExpression" ? getPrecedence(n) : PRECEDENCE.ATOM;
      return n.operator.value + (n.operator.value === "not" ? " " : "") + formatOperand(n.argument, operandPrecedence);
    }
    case "CallExpression": {
      const n = node;
      const args = formatExpressionList(n.args);
      return `${formatExpression(n.callee)}(${args})`;
    }
    case "MemberExpression": {
      const n = node;
      const obj = formatOperand(n.object, PRECEDENCE.ATOM);
      let prop = formatExpression(n.property);
      if (!n.computed && n.property.type !== "Identifier" && n.property.type !== "IntegerLiteral") {
        prop = `(${prop})`;
      }
      return n.computed ? `${obj}[${prop}]` : `${obj}.${prop}`;
    }
    case "FilterExpression": {
      const n = node;
      const operand = formatOperand(n.operand, PRECEDENCE.FILTER);
      if (n.filter.type === "CallExpression") {
        return `${operand} | ${formatExpression(n.filter)}`;
      }
      return `${operand} | ${n.filter.value}`;
    }
    case "SelectExpression": {
      const n = node;
      return `${formatOperand(n.lhs, PRECEDENCE.LOGICAL_OR)} if ${formatOperand(n.test, PRECEDENCE.LOGICAL_OR)}`;
    }
    case "TestExpression": {
      const n = node;
      return `${formatOperand(n.operand, PRECEDENCE.TEST)} is${n.negate ? " not" : ""} ${n.test.value}`;
    }
    case "ArrayLiteral":
    case "TupleLiteral": {
      const elems = formatExpressionList(node.value);
      const brackets = node.type === "ArrayLiteral" ? "[]" : "()";
      return `${brackets[0]}${elems}${brackets[1]}`;
    }
    case "ObjectLiteral": {
      const entries = Array.from(node.value.entries()).map(
        ([k, v2]) => `${formatExpression(k)}: ${formatExpression(v2)}`
      );
      return `{${entries.join(", ")}}`;
    }
    case "SliceExpression": {
      const n = node;
      const s = n.start ? formatExpression(n.start) : "";
      const t = n.stop ? formatExpression(n.stop) : "";
      const st2 = n.step ? `:${formatExpression(n.step)}` : "";
      return `${s}:${t}${st2}`;
    }
    case "KeywordArgumentExpression": {
      const n = node;
      return `${n.key.value}=${formatExpression(n.value)}`;
    }
    case "Ternary": {
      const n = node;
      return `${formatOperand(n.trueExpr, PRECEDENCE.LOGICAL_OR)} if ${formatOperand(
        n.condition,
        PRECEDENCE.LOGICAL_OR
      )} else ${formatOperand(n.falseExpr, PRECEDENCE.CONDITIONAL)}`;
    }
    default:
      throw new Error(`Unknown expression type: ${node.type}`);
  }
}
var Template = class {
  parsed;
  /**
   * @param {string} template The template string
   */
  constructor(template) {
    const tokens = tokenize(template, {
      lstrip_blocks: true,
      trim_blocks: true
    });
    this.parsed = parse(tokens);
  }
  render(items) {
    const env3 = new Environment();
    setupGlobals(env3);
    if (items) {
      for (const [key, value] of Object.entries(items)) {
        env3.set(key, value);
      }
    }
    const interpreter = new Interpreter(env3);
    const result = interpreter.run(this.parsed);
    return result.value;
  }
  format(options) {
    return format(this.parsed, options?.indent || "	");
  }
};

// node_modules/@huggingface/transformers/src/utils/model_registry/get_tokenizer_files.js
async function get_tokenizer_files(modelId) {
  if (!modelId) {
    throw new Error("modelId is required for get_tokenizer_files");
  }
  const metadata = await get_file_metadata(modelId, "tokenizer_config.json", {});
  if (metadata.exists) {
    return ["tokenizer.json", "tokenizer_config.json"];
  }
  return [];
}

// node_modules/@huggingface/transformers/src/tokenization_utils.js
async function loadTokenizer(pretrained_model_name_or_path, options) {
  const tokenizerFiles = await get_tokenizer_files(pretrained_model_name_or_path);
  return await Promise.all(
    tokenizerFiles.map((file) => getModelJSON(pretrained_model_name_or_path, file, true, options))
  );
}
function prepareTensorForDecode(tensor) {
  const dims = tensor.dims;
  switch (dims.length) {
    case 1:
      return tensor.tolist();
    case 2:
      if (dims[0] !== 1) {
        throw new Error(
          "Unable to decode tensor with `batch size !== 1`. Use `tokenizer.batch_decode(...)` for batched inputs."
        );
      }
      return tensor.tolist()[0];
    default:
      throw new Error(`Expected tensor to have 1-2 dimensions, got ${dims.length}.`);
  }
}
var SPECIAL_TOKEN_ATTRIBUTES = [
  "bos_token",
  "eos_token",
  "unk_token",
  "sep_token",
  "pad_token",
  "cls_token",
  "mask_token"
  // additional_special_tokens (TODO)
];
function padHelper(item, length, value_fn, side) {
  for (const key of Object.keys(item)) {
    const diff = length - item[key].length;
    const value = value_fn(key);
    const padData = new Array(diff).fill(value);
    item[key] = side === "right" ? mergeArrays(item[key], padData) : mergeArrays(padData, item[key]);
  }
}
function truncateHelper(item, length) {
  for (const key of Object.keys(item)) {
    item[key].length = length;
  }
}
function getTokenFromConfig(config, ...keys) {
  for (const key of keys) {
    if (!Object.hasOwn(config, key)) continue;
    const item = config[key];
    if (!item) continue;
    if (typeof item === "object") {
      if (item.__type === "AddedToken") {
        return item.content;
      } else {
        throw Error(`Unknown token: ${item}`);
      }
    } else {
      return item;
    }
  }
  return null;
}
function getSpecialTokens(tokenizer) {
  const special = [];
  for (const value of tokenizer.get_added_tokens_decoder().values()) {
    if (value.special) special.push(value);
  }
  return special;
}
var PreTrainedTokenizer = class extends /** @type {new (tokenizerJSON: Object, tokenizerConfig: Object) => PreTrainedTokenizerCallback} */
Callable {
  return_token_type_ids = false;
  padding_side = "right";
  /**
   * Create a new PreTrainedTokenizer instance.
   * @param {Object} tokenizerJSON The JSON of the tokenizer.
   * @param {Object} tokenizerConfig The config of the tokenizer.
   */
  constructor(tokenizerJSON, tokenizerConfig) {
    super();
    this._tokenizerJSON = tokenizerJSON;
    this._tokenizerConfig = tokenizerConfig;
    this._tokenizer = new Tokenizer_default(tokenizerJSON, tokenizerConfig);
    this.config = tokenizerConfig;
    this.padding_side = tokenizerConfig.padding_side ?? this.padding_side;
    this.mask_token = getTokenFromConfig(tokenizerConfig, "mask_token");
    this.mask_token_id = this._tokenizer.token_to_id(this.mask_token);
    this.pad_token = getTokenFromConfig(tokenizerConfig, "pad_token", "eos_token");
    this.pad_token_id = this._tokenizer.token_to_id(this.pad_token);
    this.sep_token = getTokenFromConfig(tokenizerConfig, "sep_token");
    this.sep_token_id = this._tokenizer.token_to_id(this.sep_token);
    this.unk_token = getTokenFromConfig(tokenizerConfig, "unk_token");
    this.unk_token_id = this._tokenizer.token_to_id(this.unk_token);
    this.bos_token = getTokenFromConfig(tokenizerConfig, "bos_token");
    this.bos_token_id = this._tokenizer.token_to_id(this.bos_token);
    this.eos_token = getTokenFromConfig(tokenizerConfig, "eos_token");
    this.eos_token_id = this._tokenizer.token_to_id(this.eos_token);
    this.chat_template = tokenizerConfig.chat_template ?? null;
    if (Array.isArray(this.chat_template)) {
      const chat_template = /* @__PURE__ */ Object.create(null);
      for (const { name, template } of this.chat_template) {
        if (typeof name !== "string" || typeof template !== "string") {
          throw new Error('Chat template must be a list of objects with "name" and "template" properties');
        }
        chat_template[name] = template;
      }
      this.chat_template = chat_template;
    }
    this._compiled_template_cache = /* @__PURE__ */ new Map();
    const special_tokens = getSpecialTokens(this._tokenizer);
    this.all_special_ids = special_tokens.map((t) => t.id);
    this.all_special_tokens = special_tokens.map((t) => t.content);
  }
  /**
   * Loads a pretrained tokenizer from the given `pretrained_model_name_or_path`.
   *
   * @param {string} pretrained_model_name_or_path The path to the pretrained tokenizer.
   * @param {PretrainedTokenizerOptions} options Additional options for loading the tokenizer.
   *
   * @throws {Error} Throws an error if the tokenizer.json or tokenizer_config.json files are not found in the `pretrained_model_name_or_path`.
   * @returns {Promise<PreTrainedTokenizer>} A new instance of the `PreTrainedTokenizer` class.
   */
  static async from_pretrained(pretrained_model_name_or_path, { progress_callback = null, config = null, cache_dir = null, local_files_only = false, revision = "main" } = {}) {
    const info = await loadTokenizer(pretrained_model_name_or_path, {
      progress_callback,
      config,
      cache_dir,
      local_files_only,
      revision
    });
    return new this(...info);
  }
  get_vocab() {
    return this._tokenizer.get_vocab();
  }
  get model_max_length() {
    return this._tokenizerConfig.model_max_length ?? Infinity;
  }
  get add_eos_token() {
    return this._tokenizerConfig.add_eos_token;
  }
  get add_bos_token() {
    return this._tokenizerConfig.add_bos_token;
  }
  /**
   * Converts a token string (or a sequence of tokens) into a single integer id (or a sequence of ids), using the vocabulary.
   *
   * @template {string|string[]} T
   * @param {T} tokens One or several token(s) to convert to token id(s).
   * @returns {T extends string ? number : number[]} The token id or list of token ids.
   */
  convert_tokens_to_ids(tokens) {
    if (typeof tokens === "string") {
      return (
        /** @type {any} */
        this._tokenizer.token_to_id(tokens)
      );
    } else {
      return (
        /** @type {any} */
        tokens.map((token) => this._tokenizer.token_to_id(token))
      );
    }
  }
  /**
   * Encode/tokenize the given text(s).
   * @template {string|string[]} TText
   * @template {boolean} [TReturnTensor=true]
   * @param {TText} text The text to tokenize.
   * @param {TokenizerCallOptions<TText, TReturnTensor>} [options] Additional tokenization options.
   * @returns {BatchEncoding<BatchEncodingItem<TText, TReturnTensor>>} Object to be passed to the model.
   */
  _call(text, options = {}) {
    const { text_pair = null, add_special_tokens = true, padding = false, return_token_type_ids = null } = options;
    let { truncation = null, max_length = null } = options;
    const return_tensor = (
      /** @type {TReturnTensor} */
      options.return_tensor ?? true
    );
    const isBatched = Array.isArray(text);
    let encodedTokens;
    if (isBatched) {
      if (text.length === 0) {
        throw Error("text array must be non-empty");
      }
      if (text_pair !== null) {
        if (!Array.isArray(text_pair)) {
          throw Error("text_pair must also be an array");
        } else if (text.length !== text_pair.length) {
          throw Error("text and text_pair must have the same length");
        }
        encodedTokens = text.map(
          (t, i) => this._encode_plus(t, { text_pair: text_pair[i], add_special_tokens, return_token_type_ids })
        );
      } else {
        encodedTokens = text.map((x) => this._encode_plus(x, { add_special_tokens, return_token_type_ids }));
      }
    } else {
      if (text === null || text === void 0) {
        throw Error("text may not be null or undefined");
      }
      if (Array.isArray(text_pair)) {
        throw Error(
          "When specifying `text_pair`, since `text` is a string, `text_pair` must also be a string (i.e., not an array)."
        );
      }
      encodedTokens = [this._encode_plus(text, { text_pair, add_special_tokens, return_token_type_ids })];
    }
    if (max_length === null) {
      max_length = this.model_max_length;
    } else if (truncation === null) {
      if (padding === true) {
        logger.warn(
          "`max_length` is ignored when `padding: true` and there is no truncation strategy. To pad to max length, use `padding: 'max_length'`."
        );
        max_length = this.model_max_length;
      } else if (padding === false) {
        logger.warn(
          "Truncation was not explicitly activated but `max_length` is provided a specific value, please use `truncation: true` to explicitly truncate examples to max length."
        );
        truncation = true;
      }
    }
    if (padding === true) {
      max_length = Math.min(max(encodedTokens.map((x) => x.input_ids.length))[0], max_length ?? Infinity);
    }
    max_length = Math.min(max_length, this.model_max_length ?? Infinity);
    if (padding || truncation) {
      for (let i = 0; i < encodedTokens.length; ++i) {
        if (encodedTokens[i].input_ids.length === max_length) {
          continue;
        } else if (encodedTokens[i].input_ids.length > max_length) {
          if (truncation) {
            truncateHelper(encodedTokens[i], max_length);
          }
        } else {
          if (padding) {
            padHelper(
              encodedTokens[i],
              max_length,
              (key) => key === "input_ids" ? this.pad_token_id : 0,
              this.padding_side
            );
          }
        }
      }
    }
    const result = {};
    if (return_tensor) {
      if (!(padding && truncation)) {
        if (encodedTokens.some((x) => {
          for (const key of Object.keys(x)) {
            if (x[key].length !== encodedTokens[0][key]?.length) {
              return true;
            }
          }
          return false;
        })) {
          throw Error(
            "Unable to create tensor, you should probably activate truncation and/or padding with 'padding=true' and 'truncation=true' to have batched tensors with the same length."
          );
        }
      }
      const dims = [encodedTokens.length, encodedTokens[0].input_ids.length];
      for (const key of Object.keys(encodedTokens[0])) {
        result[key] = new Tensor3(
          "int64",
          BigInt64Array.from(encodedTokens.flatMap((x) => x[key]).map(BigInt)),
          dims
        );
      }
    } else {
      for (const key of Object.keys(encodedTokens[0])) {
        result[key] = encodedTokens.map((x) => x[key]);
      }
      if (!isBatched) {
        for (const key of Object.keys(result)) {
          result[key] = result[key][0];
        }
      }
    }
    return (
      /** @type {BatchEncoding<BatchEncodingItem<TText, TReturnTensor>>} */
      result
    );
  }
  /**
   * Encodes a single text using the preprocessor pipeline of the tokenizer.
   *
   * @param {string|null} text The text to encode.
   * @returns {string[]|null} The encoded tokens.
   */
  _encode_text(text) {
    if (text === null) return null;
    return this._tokenizer.encode(text).tokens;
  }
  /**
   * Encodes a single text or a pair of texts using the model's tokenizer.
   *
   * @param {string} text The text to encode.
   * @param {Object} options An optional object containing the following properties:
   * @param {string|null} [options.text_pair=null] The optional second text to encode.
   * @param {boolean} [options.add_special_tokens=true] Whether or not to add the special tokens associated with the corresponding model.
   * @param {boolean|null} [options.return_token_type_ids=null] Whether to return token_type_ids.
   * @returns {{input_ids: number[], attention_mask: number[], token_type_ids?: number[]}} An object containing the encoded text.
   * @private
   */
  _encode_plus(text, { text_pair = null, add_special_tokens = true, return_token_type_ids = null } = {}) {
    const { ids, attention_mask, token_type_ids } = this._tokenizer.encode(text, {
      text_pair,
      add_special_tokens,
      return_token_type_ids: return_token_type_ids ?? this.return_token_type_ids
    });
    return {
      input_ids: ids,
      attention_mask,
      ...token_type_ids ? { token_type_ids } : {}
    };
  }
  /**
   * Converts a string into a sequence of tokens.
   * @param {string} text The sequence to be encoded.
   * @param {Object} options An optional object containing the following properties:
   * @param {string|null} [options.pair] A second sequence to be encoded with the first.
   * @param {boolean} [options.add_special_tokens=false] Whether or not to add the special tokens associated with the corresponding model.
   * @returns {string[]} The list of tokens.
   */
  tokenize(text, { pair = null, add_special_tokens = false } = {}) {
    return this._tokenizer.tokenize(text, { text_pair: pair, add_special_tokens });
  }
  /**
   * Encodes a single text or a pair of texts using the model's tokenizer.
   *
   * @param {string} text The text to encode.
   * @param {Object} options An optional object containing the following properties:
   * @param {string|null} [options.text_pair=null] The optional second text to encode.
   * @param {boolean} [options.add_special_tokens=true] Whether or not to add the special tokens associated with the corresponding model.
   * @param {boolean|null} [options.return_token_type_ids=null] Whether to return token_type_ids.
   * @returns {number[]} An array of token IDs representing the encoded text(s).
   */
  encode(text, { text_pair = null, add_special_tokens = true, return_token_type_ids = null } = {}) {
    return this._tokenizer.encode(text, {
      text_pair,
      add_special_tokens,
      return_token_type_ids
    }).ids;
  }
  /**
   * Decode a batch of tokenized sequences.
   * @param {number[][]|Tensor} batch List/Tensor of tokenized input sequences.
   * @param {Object} decode_args (Optional) Object with decoding arguments.
   * @returns {string[]} List of decoded sequences.
   */
  batch_decode(batch, decode_args = {}) {
    if (batch instanceof Tensor3) {
      batch = batch.tolist();
    }
    return batch.map((x) => this.decode(x, decode_args));
  }
  /**
   * Decodes a sequence of token IDs back to a string.
   *
   * @param {number[]|bigint[]|Tensor} token_ids List/Tensor of token IDs to decode.
   * @param {Object} [decode_args={}]
   * @param {boolean} [decode_args.skip_special_tokens=false] If true, special tokens are removed from the output string.
   * @param {boolean} [decode_args.clean_up_tokenization_spaces=true] If true, spaces before punctuation and abbreviated forms are removed.
   *
   * @returns {string} The decoded string.
   * @throws {Error} If `token_ids` is not a non-empty array of integers.
   */
  decode(token_ids, decode_args = {}) {
    if (token_ids instanceof Tensor3) {
      token_ids = prepareTensorForDecode(token_ids);
    }
    if (!Array.isArray(token_ids) || token_ids.length === 0 || !isIntegralNumber(token_ids[0])) {
      throw Error("token_ids must be a non-empty array of integers.");
    }
    return this.decode_single(token_ids, decode_args);
  }
  /**
   * Decode a single list of token ids to a string.
   * @param {number[]|bigint[]} token_ids List of token ids to decode
   * @param {Object} decode_args Optional arguments for decoding
   * @param {boolean} [decode_args.skip_special_tokens=false] Whether to skip special tokens during decoding
   * @param {boolean|null} [decode_args.clean_up_tokenization_spaces=null] Whether to clean up tokenization spaces during decoding.
   * If null, the value is set to `this.decoder.cleanup` if it exists, falling back to `this.clean_up_tokenization_spaces` if it exists, falling back to `true`.
   * @returns {string} The decoded string
   */
  decode_single(token_ids, { skip_special_tokens = false, clean_up_tokenization_spaces = null }) {
    return this._tokenizer.decode(token_ids, {
      skip_special_tokens,
      clean_up_tokenization_spaces
    });
  }
  /**
   * Retrieve the chat template string used for tokenizing chat messages. This template is used
   * internally by the `apply_chat_template` method and can also be used externally to retrieve the model's chat
   * template for better generation tracking.
   *
   * @param {Object} options An optional object containing the following properties:
   * @param {string|null} [options.chat_template=null]
   * A Jinja template or the name of a template to use for this conversion.
   * It is usually not necessary to pass anything to this argument,
   * as the model's template will be used by default.
   * @param {Object[]} [options.tools=null]
   * A list of tools (callable functions) that will be accessible to the model. If the template does not
   * support function calling, this argument will have no effect. Each tool should be passed as a JSON Schema,
   * giving the name, description and argument types for the tool. See our
   * [chat templating guide](https://huggingface.co/docs/transformers/main/en/chat_templating#automated-function-conversion-for-tool-use)
   * for more information.
   * @returns {string} The chat template string.
   */
  get_chat_template({ chat_template = null, tools = null } = {}) {
    if (this.chat_template && typeof this.chat_template === "object") {
      const template_dict = this.chat_template;
      if (chat_template !== null && Object.hasOwn(template_dict, chat_template)) {
        chat_template = template_dict[chat_template];
      } else if (chat_template === null) {
        if (tools !== null && "tool_use" in template_dict) {
          chat_template = template_dict["tool_use"];
        } else if ("default" in template_dict) {
          chat_template = template_dict["default"];
        } else {
          throw Error(
            `This model has multiple chat templates with no default specified! Please either pass a chat template or the name of the template you wish to use to the 'chat_template' argument. Available template names are ${Object.keys(template_dict).sort()}.`
          );
        }
      }
    } else if (chat_template === null) {
      if (this.chat_template) {
        chat_template = this.chat_template;
      } else {
        throw Error(
          "Cannot use apply_chat_template() because tokenizer.chat_template is not set and no template argument was passed! For information about writing templates and setting the tokenizer.chat_template attribute, please see the documentation at https://huggingface.co/docs/transformers/main/en/chat_templating"
        );
      }
    }
    return chat_template;
  }
  /**
   * Converts a list of message objects with `"role"` and `"content"` keys to a list of token
   * ids. This method is intended for use with chat models, and will read the tokenizer's chat_template attribute to
   * determine the format and control tokens to use when converting.
   *
   * See the [chat templating guide](https://huggingface.co/docs/transformers/chat_templating) for more information.
   *
   * **Example:** Applying a chat template to a conversation.
   *
   * ```javascript
   * import { AutoTokenizer } from "@huggingface/transformers";
   *
   * const tokenizer = await AutoTokenizer.from_pretrained("Xenova/mistral-tokenizer-v1");
   *
   * const chat = [
   *   { "role": "user", "content": "Hello, how are you?" },
   *   { "role": "assistant", "content": "I'm doing great. How can I help you today?" },
   *   { "role": "user", "content": "I'd like to show off how chat templating works!" },
   * ]
   *
   * const text = tokenizer.apply_chat_template(chat, { tokenize: false });
   * // "<s>[INST] Hello, how are you? [/INST]I'm doing great. How can I help you today?</s> [INST] I'd like to show off how chat templating works! [/INST]"
   *
   * const input_ids = tokenizer.apply_chat_template(chat, { tokenize: true, return_tensor: false });
   * // [1, 733, 16289, 28793, 22557, 28725, 910, 460, 368, 28804, 733, 28748, 16289, 28793, 28737, 28742, 28719, 2548, 1598, 28723, 1602, 541, 315, 1316, 368, 3154, 28804, 2, 28705, 733, 16289, 28793, 315, 28742, 28715, 737, 298, 1347, 805, 910, 10706, 5752, 1077, 3791, 28808, 733, 28748, 16289, 28793]
   * ```
   *
   * @param {Message[]} conversation A list of message objects with `"role"` and `"content"` keys,
   * representing the chat history so far.
   * @template {boolean} [TTokenize=true]
   * @template {boolean} [TReturnTensor=true]
   * @template {boolean} [TReturnDict=true]
   * @param {ApplyChatTemplateOptions<TTokenize, TReturnTensor, TReturnDict>} [options] Options controlling
   * template rendering and tokenization.
   * @returns {ApplyChatTemplateReturn<TTokenize, TReturnTensor, TReturnDict>} The tokenized output.
   */
  apply_chat_template(conversation, options = (
    /** @type {ApplyChatTemplateOptions<TTokenize, TReturnTensor, TReturnDict>} */
    {}
  )) {
    let {
      tools = null,
      documents = null,
      chat_template = null,
      add_generation_prompt = false,
      tokenize: tokenize2 = (
        /** @type {TTokenize} */
        true
      ),
      padding = false,
      truncation = false,
      max_length = null,
      return_tensor = (
        /** @type {TReturnTensor} */
        true
      ),
      return_dict = (
        /** @type {TReturnDict} */
        true
      ),
      tokenizer_kwargs = {},
      ...kwargs
    } = options;
    chat_template = this.get_chat_template({ chat_template, tools });
    if (typeof chat_template !== "string") {
      throw Error(`chat_template must be a string, but got ${typeof chat_template}`);
    }
    let compiledTemplate = this._compiled_template_cache.get(chat_template);
    if (compiledTemplate === void 0) {
      compiledTemplate = new Template(chat_template);
      this._compiled_template_cache.set(chat_template, compiledTemplate);
    }
    const special_tokens_map = /* @__PURE__ */ Object.create(null);
    for (const key of SPECIAL_TOKEN_ATTRIBUTES) {
      const value = getTokenFromConfig(this.config, key);
      if (value) {
        special_tokens_map[key] = value;
      }
    }
    const rendered = compiledTemplate.render({
      messages: conversation,
      add_generation_prompt,
      tools,
      documents,
      ...special_tokens_map,
      ...kwargs
    });
    if (tokenize2) {
      const out = this._call(rendered, {
        add_special_tokens: false,
        padding,
        truncation,
        max_length,
        return_tensor,
        ...tokenizer_kwargs
      });
      return (
        /** @type {ApplyChatTemplateReturn<TTokenize, TReturnTensor, TReturnDict>} */
        return_dict ? out : out.input_ids
      );
    }
    return (
      /** @type {ApplyChatTemplateReturn<TTokenize, TReturnTensor, TReturnDict>} */
      rendered
    );
  }
};

// node_modules/@huggingface/transformers/src/models/clip/tokenization_clip.js
var CLIPTokenizer = class extends PreTrainedTokenizer {
};

// browser-unavailable:node:stream
var Readable = void 0;

// browser-unavailable:node:stream/promises
var pipeline = void 0;

// node_modules/@huggingface/transformers/src/utils/io.js
async function saveBlob(path, blob) {
  if (apis.IS_BROWSER_ENV) {
    if (apis.IS_WEBWORKER_ENV) {
      throw new Error("Unable to save a file from a Web Worker.");
    }
    const dataURL = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = dataURL;
    downloadLink.download = path;
    downloadLink.click();
    downloadLink.remove();
    URL.revokeObjectURL(dataURL);
  } else if (apis.IS_FS_AVAILABLE) {
    const webStream = blob.stream();
    const nodeStream = Readable.fromWeb(webStream);
    const fileStream = node_fs_default.createWriteStream(path);
    await pipeline(nodeStream, fileStream);
  } else {
    throw new Error("Unable to save because filesystem is disabled in this environment.");
  }
}

// browser-unavailable:sharp
var sharp_default = {};

// node_modules/@huggingface/transformers/src/utils/image.js
var createCanvasFunction;
var ImageDataClass;
var loadImageFunction;
if (apis.IS_WEB_ENV) {
  createCanvasFunction = (width, height) => {
    if (!self.OffscreenCanvas) {
      throw new Error("OffscreenCanvas not supported by this environment.");
    }
    return new self.OffscreenCanvas(width, height);
  };
  loadImageFunction = self.createImageBitmap;
  ImageDataClass = self.ImageData;
} else if (sharp_default) {
  loadImageFunction = async (img) => {
    const metadata = await img.metadata();
    const rawChannels = metadata.channels;
    const { data, info } = await img.rotate().raw().toBuffer({ resolveWithObject: true });
    const newImage = new RawImage(new Uint8ClampedArray(data), info.width, info.height, info.channels);
    if (rawChannels !== void 0 && rawChannels !== info.channels) {
      newImage.convert(rawChannels);
    }
    return newImage;
  };
} else {
  throw new Error("Unable to load image processing library.");
}
var RESAMPLING_MAPPING = {
  0: "nearest",
  1: "lanczos",
  2: "bilinear",
  3: "bicubic",
  4: "box",
  5: "hamming"
};
var CONTENT_TYPE_MAP2 = /* @__PURE__ */ new Map([
  ["png", "image/png"],
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["gif", "image/gif"]
]);
var RawImage = class _RawImage {
  /**
   * Create a new `RawImage` object.
   * @param {Uint8ClampedArray|Uint8Array} data The pixel data.
   * @param {number} width The width of the image.
   * @param {number} height The height of the image.
   * @param {1|2|3|4} channels The number of channels.
   */
  constructor(data, width, height, channels) {
    this.data = data;
    this.width = width;
    this.height = height;
    this.channels = channels;
  }
  /**
   * Returns the size of the image (width, height).
   * @returns {[number, number]} The size of the image (width, height).
   */
  get size() {
    return [this.width, this.height];
  }
  /**
   * Helper method for reading an image from a variety of input types.
   * @param {RawImage|string|URL|Blob|HTMLCanvasElement|OffscreenCanvas} input
   * @returns {Promise<RawImage>} The image object.
   *
   * **Example:** Read image from a URL.
   * ```javascript
   * let image = await RawImage.read('https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/football-match.jpg');
   * // RawImage {
   * //   "data": Uint8ClampedArray [ 25, 25, 25, 19, 19, 19, ... ],
   * //   "width": 800,
   * //   "height": 533,
   * //   "channels": 3
   * // }
   * ```
   */
  static async read(input) {
    if (input instanceof _RawImage) {
      return input;
    } else if (typeof input === "string" || input instanceof URL) {
      return await this.fromURL(input);
    } else if (input instanceof Blob) {
      return await this.fromBlob(input);
    } else if (typeof HTMLCanvasElement !== "undefined" && input instanceof HTMLCanvasElement || typeof OffscreenCanvas !== "undefined" && input instanceof OffscreenCanvas) {
      return this.fromCanvas(input);
    } else {
      throw new Error(`Unsupported input type: ${typeof input}`);
    }
  }
  /**
   * Read an image from a canvas.
   * @param {HTMLCanvasElement|OffscreenCanvas} canvas The canvas to read the image from.
   * @returns {RawImage} The image object.
   */
  static fromCanvas(canvas) {
    if (!apis.IS_WEB_ENV) {
      throw new Error("fromCanvas() is only supported in browser environments.");
    }
    const ctx = (
      /** @type {CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D} */
      canvas.getContext("2d")
    );
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    return new _RawImage(data, canvas.width, canvas.height, 4);
  }
  /**
   * Read an image from a URL or file path.
   * @param {string|URL} url The URL or file path to read the image from.
   * @returns {Promise<RawImage>} The image object.
   */
  static async fromURL(url) {
    const response = await getFile(url);
    if (response.status !== 200) {
      throw new Error(`Unable to read image from "${url}" (${response.status} ${response.statusText})`);
    }
    const blob = await response.blob();
    return this.fromBlob(blob);
  }
  /**
   * Helper method to create a new Image from a blob.
   * @param {Blob} blob The blob to read the image from.
   * @returns {Promise<RawImage>} The image object.
   */
  static async fromBlob(blob) {
    if (apis.IS_WEB_ENV) {
      const img = await loadImageFunction(blob);
      const ctx = createCanvasFunction(img.width, img.height).getContext("2d");
      ctx.drawImage(img, 0, 0);
      return new this(ctx.getImageData(0, 0, img.width, img.height).data, img.width, img.height, 4);
    } else {
      const img = sharp_default(await blob.arrayBuffer());
      return await loadImageFunction(img);
    }
  }
  /**
   * Helper method to create a new Image from a tensor
   * @param {Tensor} tensor The 3D tensor containing the image data. Must be of type `uint8`.
   * @param {'CHW'|'HWC'} [channel_format='CHW'] The dimension ordering of the tensor.
   * @returns {RawImage} The image created from the tensor.
   * @throws {Error} If the tensor does not have 3 dimensions, or the channel format,
   * tensor type, or number of channels is unsupported.
   */
  static fromTensor(tensor, channel_format = "CHW") {
    if (tensor.dims.length !== 3) {
      throw new Error(`Tensor should have 3 dimensions, but has ${tensor.dims.length} dimensions.`);
    }
    if (channel_format === "CHW") {
      tensor = tensor.permute(1, 2, 0);
    } else if (channel_format === "HWC") {
    } else {
      throw new Error(`Unsupported channel format: ${channel_format}`);
    }
    if (!(tensor.data instanceof Uint8ClampedArray || tensor.data instanceof Uint8Array)) {
      throw new Error(`Unsupported tensor type: ${tensor.type}`);
    }
    switch (tensor.dims[2]) {
      case 1:
      case 2:
      case 3:
      case 4:
        return new _RawImage(tensor.data, tensor.dims[1], tensor.dims[0], tensor.dims[2]);
      default:
        throw new Error(`Unsupported number of channels: ${tensor.dims[2]}`);
    }
  }
  /**
   * Convert the image to grayscale format.
   * @returns {RawImage} `this` to support chaining.
   */
  grayscale() {
    if (this.channels === 1) {
      return this;
    }
    const newData = new Uint8ClampedArray(this.width * this.height * 1);
    switch (this.channels) {
      case 3:
      // rgb to grayscale
      case 4:
        for (let i = 0, offset = 0; i < this.data.length; i += this.channels) {
          const red = this.data[i];
          const green = this.data[i + 1];
          const blue = this.data[i + 2];
          newData[offset++] = Math.round(0.2989 * red + 0.587 * green + 0.114 * blue);
        }
        break;
      default:
        throw new Error(`Conversion failed due to unsupported number of channels: ${this.channels}`);
    }
    return this._update(newData, this.width, this.height, 1);
  }
  /**
   * Convert the image to RGB format.
   * @returns {RawImage} `this` to support chaining.
   */
  rgb() {
    if (this.channels === 3) {
      return this;
    }
    const newData = new Uint8ClampedArray(this.width * this.height * 3);
    switch (this.channels) {
      case 1:
        for (let i = 0, offset = 0; i < this.data.length; ++i) {
          newData[offset++] = this.data[i];
          newData[offset++] = this.data[i];
          newData[offset++] = this.data[i];
        }
        break;
      case 4:
        for (let i = 0, offset = 0; i < this.data.length; i += 4) {
          newData[offset++] = this.data[i];
          newData[offset++] = this.data[i + 1];
          newData[offset++] = this.data[i + 2];
        }
        break;
      default:
        throw new Error(`Conversion failed due to unsupported number of channels: ${this.channels}`);
    }
    return this._update(newData, this.width, this.height, 3);
  }
  /**
   * Convert the image to RGBA format.
   * @returns {RawImage} `this` to support chaining.
   */
  rgba() {
    if (this.channels === 4) {
      return this;
    }
    const newData = new Uint8ClampedArray(this.width * this.height * 4);
    switch (this.channels) {
      case 1:
        for (let i = 0, offset = 0; i < this.data.length; ++i) {
          newData[offset++] = this.data[i];
          newData[offset++] = this.data[i];
          newData[offset++] = this.data[i];
          newData[offset++] = 255;
        }
        break;
      case 3:
        for (let i = 0, offset = 0; i < this.data.length; i += 3) {
          newData[offset++] = this.data[i];
          newData[offset++] = this.data[i + 1];
          newData[offset++] = this.data[i + 2];
          newData[offset++] = 255;
        }
        break;
      default:
        throw new Error(`Conversion failed due to unsupported number of channels: ${this.channels}`);
    }
    return this._update(newData, this.width, this.height, 4);
  }
  /**
   * Apply an alpha mask to the image. Operates in place.
   * @param {RawImage} mask The mask to apply. It should have a single channel.
   * @returns {RawImage} The masked image.
   * @throws {Error} If the mask is not the same size as the image.
   * @throws {Error} If the image does not have 4 channels.
   * @throws {Error} If the mask is not a single channel.
   */
  putAlpha(mask) {
    if (mask.width !== this.width || mask.height !== this.height) {
      throw new Error(
        `Expected mask size to be ${this.width}x${this.height}, but got ${mask.width}x${mask.height}`
      );
    }
    if (mask.channels !== 1) {
      throw new Error(`Expected mask to have 1 channel, but got ${mask.channels}`);
    }
    const this_data = this.data;
    const mask_data = mask.data;
    const num_pixels = this.width * this.height;
    if (this.channels === 3) {
      const newData = new Uint8ClampedArray(num_pixels * 4);
      for (let i = 0, in_offset = 0, out_offset = 0; i < num_pixels; ++i) {
        newData[out_offset++] = this_data[in_offset++];
        newData[out_offset++] = this_data[in_offset++];
        newData[out_offset++] = this_data[in_offset++];
        newData[out_offset++] = mask_data[i];
      }
      return this._update(newData, this.width, this.height, 4);
    } else if (this.channels === 4) {
      for (let i = 0; i < num_pixels; ++i) {
        this_data[4 * i + 3] = mask_data[i];
      }
      return this;
    }
    throw new Error(`Expected image to have 3 or 4 channels, but got ${this.channels}`);
  }
  /**
   * Resize the image to the given dimensions. This method uses the canvas API to perform the resizing.
   * @param {number} width The width of the new image. `null` or `-1` will preserve the aspect ratio.
   * @param {number} height The height of the new image. `null` or `-1` will preserve the aspect ratio.
   * @param {Object} options Additional options for resizing.
   * @param {0|1|2|3|4|5|string} [options.resample] The resampling method to use.
   * @returns {Promise<RawImage>} `this` to support chaining.
   */
  async resize(width, height, { resample = 2 } = {}) {
    if (this.width === width && this.height === height) {
      return this;
    }
    let resampleMethod = RESAMPLING_MAPPING[resample] ?? resample;
    const nullish_width = isNullishDimension(width);
    const nullish_height = isNullishDimension(height);
    if (nullish_width && nullish_height) {
      return this;
    } else if (nullish_width) {
      width = height / this.height * this.width;
    } else if (nullish_height) {
      height = width / this.width * this.height;
    }
    if (apis.IS_WEB_ENV) {
      const numChannels = this.channels;
      const canvas = this.toCanvas();
      const ctx = createCanvasFunction(width, height).getContext("2d");
      ctx.drawImage(canvas, 0, 0, width, height);
      const resizedImage = new _RawImage(ctx.getImageData(0, 0, width, height).data, width, height, 4);
      return resizedImage.convert(numChannels);
    } else {
      let img = this.toSharp();
      switch (resampleMethod) {
        case "box":
        case "hamming":
          if (resampleMethod === "box" || resampleMethod === "hamming") {
            logger.warn(
              `Resampling method ${resampleMethod} is not yet supported. Using bilinear instead.`
            );
            resampleMethod = "bilinear";
          }
        case "nearest":
        case "bilinear":
        case "bicubic":
          img = img.affine([width / this.width, 0, 0, height / this.height], {
            interpolator: resampleMethod
          });
          break;
        case "lanczos":
          img = img.resize({
            width,
            height,
            fit: "fill",
            kernel: "lanczos3"
            // PIL Lanczos uses a kernel size of 3
          });
          break;
        default:
          throw new Error(`Resampling method ${resampleMethod} is not supported.`);
      }
      return await loadImageFunction(img);
    }
  }
  async pad([left, right, top, bottom]) {
    left = Math.max(left, 0);
    right = Math.max(right, 0);
    top = Math.max(top, 0);
    bottom = Math.max(bottom, 0);
    if (left === 0 && right === 0 && top === 0 && bottom === 0) {
      return this;
    }
    if (apis.IS_WEB_ENV) {
      const numChannels = this.channels;
      const canvas = this.toCanvas();
      const newWidth = this.width + left + right;
      const newHeight = this.height + top + bottom;
      const ctx = createCanvasFunction(newWidth, newHeight).getContext("2d");
      ctx.drawImage(canvas, 0, 0, this.width, this.height, left, top, this.width, this.height);
      const paddedImage = new _RawImage(ctx.getImageData(0, 0, newWidth, newHeight).data, newWidth, newHeight, 4);
      return paddedImage.convert(numChannels);
    } else {
      const img = this.toSharp().extend({ left, right, top, bottom });
      return await loadImageFunction(img);
    }
  }
  async crop([x_min, y_min, x_max, y_max]) {
    x_min = Math.max(x_min, 0);
    y_min = Math.max(y_min, 0);
    x_max = Math.min(x_max, this.width - 1);
    y_max = Math.min(y_max, this.height - 1);
    if (x_min === 0 && y_min === 0 && x_max === this.width - 1 && y_max === this.height - 1) {
      return this;
    }
    const crop_width = x_max - x_min + 1;
    const crop_height = y_max - y_min + 1;
    if (apis.IS_WEB_ENV) {
      const numChannels = this.channels;
      const canvas = this.toCanvas();
      const ctx = createCanvasFunction(crop_width, crop_height).getContext("2d");
      ctx.drawImage(canvas, x_min, y_min, crop_width, crop_height, 0, 0, crop_width, crop_height);
      const resizedImage = new _RawImage(
        ctx.getImageData(0, 0, crop_width, crop_height).data,
        crop_width,
        crop_height,
        4
      );
      return resizedImage.convert(numChannels);
    } else {
      const img = this.toSharp().extract({
        left: x_min,
        top: y_min,
        width: crop_width,
        height: crop_height
      });
      return await loadImageFunction(img);
    }
  }
  async center_crop(crop_width, crop_height) {
    if (this.width === crop_width && this.height === crop_height) {
      return this;
    }
    const width_offset = (this.width - crop_width) / 2;
    const height_offset = (this.height - crop_height) / 2;
    if (apis.IS_WEB_ENV) {
      const numChannels = this.channels;
      const canvas = this.toCanvas();
      const ctx = createCanvasFunction(crop_width, crop_height).getContext("2d");
      let sourceX = 0;
      let sourceY = 0;
      let destX = 0;
      let destY = 0;
      if (width_offset >= 0) {
        sourceX = width_offset;
      } else {
        destX = -width_offset;
      }
      if (height_offset >= 0) {
        sourceY = height_offset;
      } else {
        destY = -height_offset;
      }
      ctx.drawImage(canvas, sourceX, sourceY, crop_width, crop_height, destX, destY, crop_width, crop_height);
      const resizedImage = new _RawImage(
        ctx.getImageData(0, 0, crop_width, crop_height).data,
        crop_width,
        crop_height,
        4
      );
      return resizedImage.convert(numChannels);
    } else {
      let img = this.toSharp();
      if (width_offset >= 0 && height_offset >= 0) {
        img = img.extract({
          left: Math.floor(width_offset),
          top: Math.floor(height_offset),
          width: crop_width,
          height: crop_height
        });
      } else if (width_offset <= 0 && height_offset <= 0) {
        const top = Math.floor(-height_offset);
        const left = Math.floor(-width_offset);
        img = img.extend({
          top,
          left,
          // Ensures the resulting image has the desired dimensions
          right: crop_width - this.width - left,
          bottom: crop_height - this.height - top
        });
      } else {
        let y_padding = [0, 0];
        let y_extract = 0;
        if (height_offset < 0) {
          y_padding[0] = Math.floor(-height_offset);
          y_padding[1] = crop_height - this.height - y_padding[0];
        } else {
          y_extract = Math.floor(height_offset);
        }
        let x_padding = [0, 0];
        let x_extract = 0;
        if (width_offset < 0) {
          x_padding[0] = Math.floor(-width_offset);
          x_padding[1] = crop_width - this.width - x_padding[0];
        } else {
          x_extract = Math.floor(width_offset);
        }
        img = img.extend({
          top: y_padding[0],
          bottom: y_padding[1],
          left: x_padding[0],
          right: x_padding[1]
        }).extract({
          left: x_extract,
          top: y_extract,
          width: crop_width,
          height: crop_height
        });
      }
      return await loadImageFunction(img);
    }
  }
  async toBlob(type = "image/png", quality = 1) {
    if (!apis.IS_WEB_ENV) {
      throw new Error("toBlob() is only supported in browser environments.");
    }
    const canvas = this.toCanvas();
    return await canvas.convertToBlob({ type, quality });
  }
  toTensor(channel_format = "CHW") {
    let tensor = new Tensor3("uint8", new Uint8Array(this.data), [this.height, this.width, this.channels]);
    if (channel_format === "HWC") {
    } else if (channel_format === "CHW") {
      tensor = tensor.permute(2, 0, 1);
    } else {
      throw new Error(`Unsupported channel format: ${channel_format}`);
    }
    return tensor;
  }
  toCanvas() {
    if (!apis.IS_WEB_ENV) {
      throw new Error("toCanvas() is only supported in browser environments.");
    }
    const cloned = this.clone().rgba();
    const clonedCanvas = createCanvasFunction(cloned.width, cloned.height);
    const data = new ImageDataClass(cloned.data, cloned.width, cloned.height);
    clonedCanvas.getContext("2d").putImageData(data, 0, 0);
    return clonedCanvas;
  }
  /**
   * Split this image into individual bands. This method returns an array of individual image bands from an image.
   * For example, splitting an "RGB" image creates three new images each containing a copy of one of the original bands (red, green, blue).
   *
   * Inspired by PIL's `Image.split()` [function](https://pillow.readthedocs.io/en/latest/reference/Image.html#PIL.Image.Image.split).
   * @returns {RawImage[]} An array containing bands.
   */
  split() {
    const { data, width, height, channels } = this;
    const data_type = (
      /** @type {any} */
      data.constructor
    );
    const per_channel_length = data.length / channels;
    const split_data = Array.from({ length: channels }, () => new data_type(per_channel_length));
    for (let i = 0; i < per_channel_length; ++i) {
      const data_offset = channels * i;
      for (let j = 0; j < channels; ++j) {
        split_data[j][i] = data[data_offset + j];
      }
    }
    return split_data.map((data2) => new _RawImage(data2, width, height, 1));
  }
  /**
   * Helper method to update the image data.
   * @param {Uint8ClampedArray} data The new image data.
   * @param {number} width The new width of the image.
   * @param {number} height The new height of the image.
   * @param {1|2|3|4|null} [channels] The new number of channels of the image.
   * @private
   */
  _update(data, width, height, channels = null) {
    this.data = data;
    this.width = width;
    this.height = height;
    if (channels !== null) {
      this.channels = channels;
    }
    return this;
  }
  /**
   * Clone the image
   * @returns {RawImage} The cloned image
   */
  clone() {
    return new _RawImage(this.data.slice(), this.width, this.height, this.channels);
  }
  /**
   * Helper method for converting image to have a certain number of channels
   * @param {number} numChannels The number of channels. Must be 1, 3, or 4.
   * @returns {RawImage} `this` to support chaining.
   */
  convert(numChannels) {
    if (this.channels === numChannels) return this;
    switch (numChannels) {
      case 1:
        this.grayscale();
        break;
      case 3:
        this.rgb();
        break;
      case 4:
        this.rgba();
        break;
      default:
        throw new Error(`Conversion failed due to unsupported number of channels: ${this.channels}`);
    }
    return this;
  }
  /**
   * Save the image to the given path.
   * @param {string} path The path to save the image to.
   * @returns {Promise<void>}
   */
  async save(path) {
    if (apis.IS_WEB_ENV) {
      if (apis.IS_WEBWORKER_ENV) {
        throw new Error("Unable to save an image from a Web Worker.");
      }
      const extension = path.split(".").pop().toLowerCase();
      const mime = CONTENT_TYPE_MAP2.get(extension) ?? "image/png";
      const blob = await this.toBlob(mime);
      return saveBlob(path, blob);
    } else if (apis.IS_FS_AVAILABLE) {
      const img = this.toSharp();
      await img.toFile(path);
    } else {
      throw new Error("Unable to save the image because filesystem is disabled in this environment.");
    }
  }
  /**
   * Convert the image to a Sharp instance.
   * @returns {import('sharp').Sharp} The Sharp instance.
   */
  toSharp() {
    if (apis.IS_WEB_ENV) {
      throw new Error("toSharp() is only supported in server-side environments.");
    }
    return sharp_default(this.data, {
      raw: {
        width: this.width,
        height: this.height,
        channels: this.channels
      }
    });
  }
};
var load_image = RawImage.read.bind(RawImage);

// node_modules/@huggingface/transformers/src/utils/constants.js
var IMAGE_PROCESSOR_NAME = "preprocessor_config.json";

// node_modules/@huggingface/transformers/src/image_processors_utils.js
function constraint_to_multiple_of(val, multiple, minVal = 0, maxVal = null) {
  const a = val / multiple;
  let x = bankers_round(a) * multiple;
  if (maxVal !== null && x > maxVal) {
    x = Math.floor(a) * multiple;
  }
  if (x < minVal) {
    x = Math.ceil(a) * multiple;
  }
  return x;
}
function enforce_size_divisibility([width, height], divisor) {
  return [Math.max(Math.floor(width / divisor), 1) * divisor, Math.max(Math.floor(height / divisor), 1) * divisor];
}
var ImageProcessor = class extends Callable {
  /**
   * Create an image processor from a parsed `preprocessor_config.json`.
   * @param {ImageProcessorConfig} config The configuration object.
   */
  constructor(config) {
    super();
    this.image_mean = config.image_mean ?? config.mean;
    this.image_std = config.image_std ?? config.std;
    this.resample = config.resample ?? 2;
    this.do_rescale = config.do_rescale ?? true;
    this.rescale_factor = config.rescale_factor ?? 1 / 255;
    this.do_normalize = config.do_normalize;
    this.do_thumbnail = config.do_thumbnail;
    this.size = config.size ?? config.image_size;
    this.do_resize = config.do_resize ?? this.size !== void 0;
    this.size_divisibility = config.size_divisibility ?? config.size_divisor;
    this.do_center_crop = config.do_center_crop;
    this.crop_size = config.crop_size;
    this.do_convert_rgb = config.do_convert_rgb ?? true;
    this.do_crop_margin = config.do_crop_margin;
    this.pad_size = config.pad_size;
    this.do_pad = config.do_pad;
    this.min_pixels = config.min_pixels;
    this.max_pixels = config.max_pixels;
    if (this.do_pad && !this.pad_size && !this.size_divisibility && this.size && this.size.width !== void 0 && this.size.height !== void 0) {
      this.pad_size = this.size;
    }
    this.do_flip_channel_order = config.do_flip_channel_order ?? false;
    this.config = config;
  }
  /**
   * Resize the image to make a thumbnail. The image is resized so that no dimension is larger than any
   * corresponding dimension of the specified size.
   * @param {RawImage} image The image to be resized.
   * @param {{height:number, width:number}} size The size `{"height": h, "width": w}` to resize the image to.
   * @param {string | 0 | 1 | 2 | 3 | 4 | 5} [resample=2] The resampling filter to use.
   * @returns {Promise<RawImage>} The resized image.
   */
  async thumbnail(image, size, resample = 2) {
    const input_height = image.height;
    const input_width = image.width;
    const output_height = size.height;
    const output_width = size.width;
    let height = Math.min(input_height, output_height);
    let width = Math.min(input_width, output_width);
    if (height === input_height && width === input_width) {
      return image;
    }
    if (input_height > input_width) {
      width = Math.floor(input_width * height / input_height);
    } else if (input_width > input_height) {
      height = Math.floor(input_height * width / input_width);
    }
    return await image.resize(width, height, { resample });
  }
  /**
   * Crops the margin of the image. Gray pixels are considered margin (i.e., pixels with a value below the threshold).
   * @param {RawImage} image The image to be cropped.
   * @param {number} gray_threshold Value below which pixels are considered to be gray.
   * @returns {Promise<RawImage>} The cropped image.
   */
  async crop_margin(image, gray_threshold = 200) {
    const gray_image = image.clone().grayscale();
    const minValue = min(gray_image.data)[0];
    const maxValue = max(gray_image.data)[0];
    const diff = maxValue - minValue;
    if (diff === 0) {
      return image;
    }
    const threshold = gray_threshold / 255;
    let x_min = gray_image.width, y_min = gray_image.height, x_max = 0, y_max = 0;
    const gray_image_data = gray_image.data;
    for (let j = 0; j < gray_image.height; ++j) {
      const row = j * gray_image.width;
      for (let i = 0; i < gray_image.width; ++i) {
        if ((gray_image_data[row + i] - minValue) / diff < threshold) {
          x_min = Math.min(x_min, i);
          y_min = Math.min(y_min, j);
          x_max = Math.max(x_max, i);
          y_max = Math.max(y_max, j);
        }
      }
    }
    image = await image.crop([x_min, y_min, x_max, y_max]);
    return image;
  }
  /**
   * Pad the image by a certain amount.
   * @param {Float32Array} pixelData The pixel data to pad.
   * @param {number[]} imgDims The dimensions of the image (height, width, channels).
   * @param {{width:number; height:number}|number|'square'} padSize The dimensions of the padded image.
   * @param {Object} options The options for padding.
   * @param {'constant'|'symmetric'} [options.mode='constant'] The type of padding to add.
   * @param {boolean} [options.center=false] Whether to center the image.
   * @param {number|number[]} [options.constant_values=0] The constant value to use for padding.
   * @returns {[Float32Array, number[]]} The padded pixel data and image dimensions.
   */
  pad_image(pixelData, imgDims, padSize, { mode = "constant", center = false, constant_values = 0 } = {}) {
    const [imageHeight, imageWidth, imageChannels] = imgDims;
    let paddedImageWidth, paddedImageHeight;
    if (typeof padSize === "number") {
      paddedImageWidth = padSize;
      paddedImageHeight = padSize;
    } else if (padSize === "square") {
      paddedImageWidth = paddedImageHeight = Math.max(imageHeight, imageWidth);
    } else {
      paddedImageWidth = padSize.width;
      paddedImageHeight = padSize.height;
    }
    if (paddedImageWidth !== imageWidth || paddedImageHeight !== imageHeight) {
      const paddedPixelData = new Float32Array(paddedImageWidth * paddedImageHeight * imageChannels);
      if (Array.isArray(constant_values)) {
        for (let i = 0; i < paddedPixelData.length; ++i) {
          paddedPixelData[i] = constant_values[i % imageChannels];
        }
      } else if (constant_values !== 0) {
        paddedPixelData.fill(constant_values);
      }
      const [left, top] = center ? [Math.floor((paddedImageWidth - imageWidth) / 2), Math.floor((paddedImageHeight - imageHeight) / 2)] : [0, 0];
      for (let i = 0; i < imageHeight; ++i) {
        const a = (i + top) * paddedImageWidth;
        const b = i * imageWidth;
        for (let j = 0; j < imageWidth; ++j) {
          const c = (a + j + left) * imageChannels;
          const d = (b + j) * imageChannels;
          for (let k = 0; k < imageChannels; ++k) {
            paddedPixelData[c + k] = pixelData[d + k];
          }
        }
      }
      if (mode === "symmetric") {
        if (center) {
          throw new Error("`center` padding is not supported when `mode` is set to `symmetric`.");
        }
        const h1 = imageHeight - 1;
        const w1 = imageWidth - 1;
        for (let i = 0; i < paddedImageHeight; ++i) {
          const a = i * paddedImageWidth;
          const b = calculateReflectOffset(i, h1) * imageWidth;
          for (let j = 0; j < paddedImageWidth; ++j) {
            if (i < imageHeight && j < imageWidth) continue;
            const c = (a + j) * imageChannels;
            const d = (b + calculateReflectOffset(j, w1)) * imageChannels;
            for (let k = 0; k < imageChannels; ++k) {
              paddedPixelData[c + k] = pixelData[d + k];
            }
          }
        }
      }
      pixelData = paddedPixelData;
      imgDims = [paddedImageHeight, paddedImageWidth, imageChannels];
    }
    return [pixelData, imgDims];
  }
  /**
   * Rescale the image pixel values by `this.rescale_factor`.
   * @param {Float32Array} pixelData The pixel data to rescale.
   * @returns {void}
   */
  rescale(pixelData) {
    for (let i = 0; i < pixelData.length; ++i) {
      pixelData[i] = this.rescale_factor * pixelData[i];
    }
  }
  /**
   * Find the target (width, height) dimension of the output image after
   * resizing given the input image and the desired size.
   * @param {RawImage} image The image to resize.
   * @param {any} size The size to use for resizing the image.
   * @returns {[number, number]} The target (width, height) dimension of the output image after resizing.
   */
  get_resize_output_image_size(image, size) {
    const [srcWidth, srcHeight] = image.size;
    let shortest_edge;
    let longest_edge;
    if (this.do_thumbnail) {
      const { height, width } = size;
      shortest_edge = Math.min(height, width);
    } else if (Number.isInteger(size)) {
      shortest_edge = size;
      longest_edge = this.config.max_size ?? shortest_edge;
    } else if (size !== void 0) {
      shortest_edge = size.shortest_edge;
      longest_edge = size.longest_edge;
    }
    if (shortest_edge !== void 0 || longest_edge !== void 0) {
      const shortResizeFactor = shortest_edge === void 0 ? 1 : Math.max(shortest_edge / srcWidth, shortest_edge / srcHeight);
      const newWidth = srcWidth * shortResizeFactor;
      const newHeight = srcHeight * shortResizeFactor;
      const longResizeFactor = longest_edge === void 0 ? 1 : Math.min(longest_edge / newWidth, longest_edge / newHeight);
      let finalWidth = Math.floor(Number((newWidth * longResizeFactor).toFixed(2)));
      let finalHeight = Math.floor(Number((newHeight * longResizeFactor).toFixed(2)));
      if (this.size_divisibility !== void 0) {
        [finalWidth, finalHeight] = enforce_size_divisibility(
          [finalWidth, finalHeight],
          this.size_divisibility
        );
      }
      return [finalWidth, finalHeight];
    } else if (size !== void 0 && size.width !== void 0 && size.height !== void 0) {
      let newWidth = size.width;
      let newHeight = size.height;
      if (this.config.keep_aspect_ratio && this.config.ensure_multiple_of) {
        let scale_height = newHeight / srcHeight;
        let scale_width = newWidth / srcWidth;
        if (Math.abs(1 - scale_width) < Math.abs(1 - scale_height)) {
          scale_height = scale_width;
        } else {
          scale_width = scale_height;
        }
        newHeight = constraint_to_multiple_of(scale_height * srcHeight, this.config.ensure_multiple_of);
        newWidth = constraint_to_multiple_of(scale_width * srcWidth, this.config.ensure_multiple_of);
      }
      return [newWidth, newHeight];
    } else if (this.size_divisibility !== void 0) {
      return enforce_size_divisibility([srcWidth, srcHeight], this.size_divisibility);
    } else {
      throw new Error(
        `Could not resize image due to unsupported \`this.size\` option in config: ${JSON.stringify(size)}`
      );
    }
  }
  /**
   * Resizes the image.
   * @param {RawImage} image The image to resize.
   * @returns {Promise<RawImage>} The resized image.
   */
  async resize(image) {
    const [newWidth, newHeight] = this.get_resize_output_image_size(image, this.size);
    return await image.resize(newWidth, newHeight, {
      // @ts-expect-error TS2322
      resample: this.resample
    });
  }
  /**
   * @typedef {Object} PreprocessedImage
   * @property {HeightWidth} original_size The original size of the image.
   * @property {HeightWidth} reshaped_input_size The reshaped input size of the image.
   * @property {Tensor} pixel_values The pixel values of the preprocessed image.
   */
  /**
   * Preprocesses the given image.
   *
   * @param {RawImage} image The image to preprocess.
   * @param {Object} overrides The overrides for the preprocessing options.
   * @returns {Promise<PreprocessedImage>} The preprocessed image.
   */
  async preprocess(image, {
    do_normalize = null,
    do_pad = null,
    do_convert_rgb = null,
    do_convert_grayscale = null,
    do_flip_channel_order = null
  } = {}) {
    if (this.do_crop_margin) {
      image = await this.crop_margin(image);
    }
    const [srcWidth, srcHeight] = image.size;
    if (do_convert_rgb ?? this.do_convert_rgb) {
      image = image.rgb();
    } else if (do_convert_grayscale) {
      image = image.grayscale();
    }
    if (this.do_resize) {
      image = await this.resize(image);
    }
    if (this.do_thumbnail) {
      image = await this.thumbnail(image, this.size, this.resample);
    }
    if (this.do_center_crop) {
      let crop_width;
      let crop_height;
      if (Number.isInteger(this.crop_size)) {
        crop_width = this.crop_size;
        crop_height = this.crop_size;
      } else {
        crop_width = this.crop_size.width;
        crop_height = this.crop_size.height;
      }
      image = await image.center_crop(crop_width, crop_height);
    }
    const reshaped_input_size = [image.height, image.width];
    let pixelData = Float32Array.from(image.data);
    let imgDims = [image.height, image.width, image.channels];
    if (this.do_rescale) {
      this.rescale(pixelData);
    }
    if (do_normalize ?? this.do_normalize) {
      let image_mean = this.image_mean;
      if (!Array.isArray(this.image_mean)) {
        image_mean = new Array(image.channels).fill(image_mean);
      }
      let image_std = this.image_std;
      if (!Array.isArray(this.image_std)) {
        image_std = new Array(image.channels).fill(image_std);
      }
      if (image_mean.length !== image.channels || image_std.length !== image.channels) {
        throw new Error(
          `When set to arrays, the length of \`image_mean\` (${image_mean.length}) and \`image_std\` (${image_std.length}) must match the number of channels in the image (${image.channels}).`
        );
      }
      for (let i = 0; i < pixelData.length; i += image.channels) {
        for (let j = 0; j < image.channels; ++j) {
          pixelData[i + j] = (pixelData[i + j] - image_mean[j]) / image_std[j];
        }
      }
    }
    if (do_pad ?? this.do_pad) {
      if (this.pad_size) {
        const padded = this.pad_image(pixelData, [image.height, image.width, image.channels], this.pad_size);
        [pixelData, imgDims] = padded;
      } else if (this.size_divisibility) {
        const paddedWidth = Math.ceil(imgDims[1] / this.size_divisibility) * this.size_divisibility;
        const paddedHeight = Math.ceil(imgDims[0] / this.size_divisibility) * this.size_divisibility;
        [pixelData, imgDims] = this.pad_image(pixelData, imgDims, { width: paddedWidth, height: paddedHeight });
      }
    }
    if (do_flip_channel_order ?? this.do_flip_channel_order) {
      if (imgDims[2] !== 3) {
        throw new Error("Flipping channel order is only supported for RGB images.");
      }
      for (let i = 0; i < pixelData.length; i += 3) {
        const temp = pixelData[i];
        pixelData[i] = pixelData[i + 2];
        pixelData[i + 2] = temp;
      }
    }
    const pixel_values = new Tensor3("float32", pixelData, imgDims).permute(2, 0, 1);
    return {
      original_size: [srcHeight, srcWidth],
      reshaped_input_size,
      pixel_values
    };
  }
  /**
   * Preprocess one or more images and batch the result into `pixel_values`.
   * @param {RawImage|RawImage[]} images The image or images to preprocess.
   * @param {...any} args Additional arguments.
   * @returns {Promise<ImageProcessorResult>} An object containing the concatenated pixel values (and other metadata) of the preprocessed images.
   */
  async _call(images, ...args) {
    if (!Array.isArray(images)) {
      images = [images];
    }
    const imageData = await Promise.all(images.map((x) => this.preprocess(x)));
    const pixel_values = stack(
      imageData.map((x) => x.pixel_values),
      0
    );
    return {
      pixel_values,
      // Original sizes of images
      original_sizes: imageData.map((x) => x.original_size),
      // Reshaped sizes of images, before padding or cropping
      reshaped_input_sizes: imageData.map((x) => x.reshaped_input_size)
    };
  }
  /**
   * Instantiate one of the processor classes of the library from a pretrained model.
   *
   * The processor class to instantiate is selected based on the `image_processor_type` (or `feature_extractor_type`; legacy)
   * property of the config object (either passed as an argument or loaded from `pretrained_model_name_or_path` if possible)
   *
   * @param {string} pretrained_model_name_or_path The name or path of the pretrained model. Can be either:
   * - A string, the *model id* of a pretrained processor hosted inside a model repo on huggingface.co.
   *   Valid model ids can be located at the root-level, like `bert-base-uncased`, or namespaced under a
   *   user or organization name, like `dbmdz/bert-base-german-cased`.
   * - A path to a *directory* containing processor files, e.g., `./my_model_directory/`.
   * @param {import('./utils/hub.js').PretrainedOptions} options Additional options for loading the processor.
   *
   * @returns {Promise<ImageProcessor>} A new image processor instance.
   */
  static async from_pretrained(pretrained_model_name_or_path, options = {}) {
    const preprocessorConfig = await getModelJSON(
      pretrained_model_name_or_path,
      IMAGE_PROCESSOR_NAME,
      true,
      options
    );
    return new this(preprocessorConfig);
  }
};

// node_modules/@huggingface/transformers/src/models/clip/image_processing_clip.js
var CLIPImageProcessor = class extends ImageProcessor {
};

// clip-session-entry.mjs
var MODEL = "Xenova/clip-vit-base-patch32";
var REVISION = "6b7c523703ae26e39be4b03774966f8571c7f523";
async function createCLIPSession(options) {
  const config = await AutoConfig.from_pretrained(MODEL, options);
  if (config.model_type !== "clip" || config.architectures?.length !== 1 || config.architectures[0] !== "CLIPModel") {
    throw Error("UNSUPPORTED_MODEL_CONFIG");
  }
  const { model: session } = await constructSessions(MODEL, { model: "model" }, {
    ...options,
    config,
    subfolder: "onnx",
    session_options: {}
  });
  const allowed = /* @__PURE__ */ new Set(["input_ids", "attention_mask", "pixel_values"]);
  if (!session.inputNames.includes("input_ids") || !session.inputNames.includes("pixel_values") || session.inputNames.some((name) => !allowed.has(name))) {
    await session.release?.();
    throw Error("UNSUPPORTED_CLIP_INPUTS");
  }
  return session;
}
async function createCLIPClassifier({ progress_callback } = {}) {
  const options = { revision: REVISION, dtype: "q8", device: "wasm", progress_callback };
  const [session, tokenizer, processor] = await Promise.all([
    createCLIPSession(options),
    CLIPTokenizer.from_pretrained(MODEL, options),
    CLIPImageProcessor.from_pretrained(MODEL, options)
  ]);
  const classify = async (image, candidate_labels) => {
    const texts = candidate_labels.map((label) => `This is a photo of ${label}`);
    const text_inputs = tokenizer(texts, { padding: true, truncation: true });
    const { pixel_values } = await processor([image]);
    const inputs = pick({ ...text_inputs, pixel_values }, session.inputNames);
    const output = await sessionRun(session, inputs);
    const probs = softmax(output.logits_per_image[0].data);
    return Array.from(probs, (score, i) => ({ score, label: candidate_labels[i] })).sort((a, b) => b.score - a.score);
  };
  classify.dispose = () => session.release?.();
  return classify;
}
export {
  RawImage,
  createCLIPClassifier,
  env
};
/*! Bundled license information:

onnxruntime-web/dist/ort.webgpu.min.mjs:
  (*!
   * ONNX Runtime Web v1.31.0-dev.20260914-8d85527a0
   * Copyright (c) Microsoft Corporation. All rights reserved.
   * Licensed under the MIT License.
   *)
*/
