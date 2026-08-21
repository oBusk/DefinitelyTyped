import { Wire } from "bittorrent-protocol";
import { EventEmitter } from "events";
import { Server as HttpServer } from "http";
import { Instance as ParseTorrent } from "parse-torrent";
import { Instance as SimplePeer } from "simple-peer";

declare class WebTorrent extends EventEmitter {
    static readonly WEBRTC_SUPPORT: boolean;
    static readonly UTP_SUPPORT: boolean;
    static readonly VERSION: string;

    constructor(opts?: WebTorrent.Options);

    readonly peerId: string;
    readonly nodeId: string;
    readonly userAgent: string;
    readonly destroyed: boolean;
    readonly listening: boolean;
    readonly ready: boolean;
    readonly torrentPort: number;
    readonly dhtPort: number;
    readonly maxConns: number;
    readonly utp: boolean;
    readonly secure: 0 | 1 | 2;
    readonly enableWebSeeds: boolean;

    readonly torrents: WebTorrent.Torrent[];

    add(
        torrentId: string | Uint8Array | File | ParseTorrent,
        opts?: WebTorrent.TorrentOptions,
        ontorrent?: (torrent: WebTorrent.Torrent) => any,
    ): WebTorrent.Torrent;
    add(
        torrentId: string | Uint8Array | File | ParseTorrent,
        ontorrent?: (torrent: WebTorrent.Torrent) => any,
    ): WebTorrent.Torrent;

    seed(
        input:
            | string
            | string[]
            | File
            | File[]
            | FileList
            | Uint8Array
            | Uint8Array[]
            | NodeJS.ReadableStream
            | NodeJS.ReadableStream[],
        opts?: WebTorrent.TorrentOptions,
        onseed?: (torrent: WebTorrent.Torrent) => any,
    ): WebTorrent.Torrent;
    seed(
        input:
            | string
            | string[]
            | File
            | File[]
            | FileList
            | Uint8Array
            | Uint8Array[]
            | NodeJS.ReadableStream
            | NodeJS.ReadableStream[],
        onseed?: (torrent: WebTorrent.Torrent) => any,
    ): WebTorrent.Torrent;

    remove(
        torrentId: WebTorrent.Torrent | string | Uint8Array,
        opts?: WebTorrent.TorrentDestroyOptions,
        callback?: (err: Error | string) => void,
    ): Promise<void>;

    get(torrentId: WebTorrent.Torrent | string | Uint8Array): Promise<WebTorrent.Torrent | null>;

    address(): WebTorrent.ServerAddress | null;

    destroy(callback?: (err: Error | string) => void): void;

    createServer(
        opts?: WebTorrent.BrowserServerOptions | WebTorrent.NodeServerOptions,
        force?: "browser" | "node",
    ): WebTorrent.NodeServer | WebTorrent.BrowserServer;

    throttleDownload(rate: number): boolean | undefined;

    throttleUpload(rate: number): boolean | undefined;

    readonly downloadSpeed: number;

    readonly uploadSpeed: number;

    readonly progress: number;

    readonly ratio: number;

    on(event: "torrent" | "add" | "remove" | "seed", callback: (torrent: WebTorrent.Torrent) => void): this;

    on(event: "error", callback: (err: Error | string) => void): this;

    on(event: "ready" | "listening", callback: () => void): this;

    on(event: "download" | "upload", callback: (bytes: number) => void): this;
}

declare namespace WebTorrent {
    type Instance = WebTorrent;

    interface Options {
        maxConns?: number | undefined;
        nodeId?: string | Uint8Array | undefined;
        peerId?: string | Uint8Array | undefined;
        tracker?: boolean | Record<string, unknown> | undefined;
        dht?: boolean | Record<string, unknown> | undefined;
        lsd?: boolean | undefined;
        utPex?: boolean | undefined;
        natUpnp?: boolean | "permanent" | undefined;
        natPmp?: boolean | undefined;
        webSeeds?: boolean | undefined;
        utp?: boolean | undefined;
        seedOutgoingConnections?: boolean | undefined;
        blocklist?: (string | Array<string | { start: string; end: string }>) | undefined;
        downloadLimit?: number | undefined;
        uploadLimit?: number | undefined;
        secure?: 0 | 1 | 2 | undefined;
        userAgent?: string | undefined;
        torrentPort?: number | undefined;
        dhtPort?: number | undefined;
    }

    interface ServerAddress {
        port: number;
        family: string;
        address: string;
    }

    interface BrowserServerOptions {
        controller: ServiceWorkerRegistration;
    }

    interface NodeServerOptions {
        origin?: string;
        pathname?: string;
        hostname?: string;
    }

    interface ServerBase {
        readonly client: WebTorrent;
        readonly pathname: string;
        readonly closed: boolean;
        address(): ServerAddress | null;
        close(cb?: () => void): void;
        destroy(cb?: () => void): void;
    }

    interface NodeServer extends ServerBase {
        readonly opts: NodeServerOptions;
        readonly server: HttpServer;
        listen(...args: any[]): void;
    }

    interface BrowserServer extends ServerBase {
        readonly opts: BrowserServerOptions;
        readonly registration: ServiceWorkerRegistration;
        workerKeepAliveInterval: ReturnType<typeof setInterval> | null;
        workerPortCount: number;
    }

    interface TorrentAnnounceOpts {
        uploaded?: number | undefined;
        downloaded?: number | undefined;
        numwant?: number | undefined;
        left?: number | undefined;
    }

    interface TorrentStoreOptions {
        length: number;
        files: TorrentFile[];
        torrent: Torrent;
        path: string;
        name: string;
        addUID: boolean;
        rootDir: FileSystemDirectoryHandle | null;
        max: number;
    }

    interface TorrentOptions {
        announce?: string[] | undefined;
        announceList?: string[][] | undefined;
        getAnnounceOpts?(): TorrentAnnounceOpts | Record<string, unknown> | undefined;
        urlList?: string[] | undefined;
        maxWebConns?: number | undefined;
        path?: string | undefined;
        store?(chunkLength: number, storeOpts: TorrentStoreOptions): any;
        storeOpts?: Record<string, unknown> | undefined;
        private?: boolean | undefined;
        destroyStoreOnDestroy?: boolean | undefined;
        storeCacheSlots?: number | undefined;
        skipVerify?: boolean | undefined;
        preloadedStore?: unknown;
        strategy?: "rarest" | "sequential" | undefined;
        createdBy?: string | undefined;
        addUID?: boolean | undefined;
        rootDir?: FileSystemDirectoryHandle | undefined;
        bitfield?: Uint8Array | ArrayLike<number> | undefined;
        noPeersIntervalTime?: number | undefined;
        paused?: boolean | undefined;
        deselect?: boolean | undefined;
        alwaysChokeSeeders?: boolean | undefined;
        uploads?: number | false | undefined;
        fileModtimes?: number[] | undefined;
    }

    interface TorrentDestroyOptions {
        destroyStore?: boolean | undefined;
    }

    interface WebSeedConnection extends NodeJS.ReadWriteStream {
        readonly connId: string;
    }

    interface TorrentDiscoveryTracker extends NodeJS.EventEmitter {
        start(opts?: TorrentAnnounceOpts): void;
        stop(opts?: TorrentAnnounceOpts): void;
        complete(opts?: TorrentAnnounceOpts): void;
        update(opts?: TorrentAnnounceOpts): void;
        scrape(opts?: Record<string, unknown>): void;
        setInterval(intervalMs?: number): void;
        destroy(cb?: (err?: Error) => void): void;
    }

    interface TorrentDiscoveryDHT extends NodeJS.EventEmitter {
        lookup(infoHash: string | Uint8Array, cb?: (err: Error | null, totalNodesFound: number) => void): () => void;
        announce(infoHash: string | Uint8Array, port?: number, cb?: (err: Error | null) => void): void;
        addNode(
            node: { id?: string | Uint8Array | undefined; host?: string | undefined; port?: number | undefined },
        ): void;
        address(): ServerAddress;
        destroy(cb?: (err?: Error) => void): void;
    }

    interface TorrentDiscovery extends NodeJS.EventEmitter {
        readonly peerId: string;
        readonly infoHash: string;
        readonly destroyed: boolean;
        readonly tracker: TorrentDiscoveryTracker | null;
        readonly dht: TorrentDiscoveryDHT | null;
        readonly lsd: NodeJS.EventEmitter | null;
        updatePort(port: number): void;
        complete(opts?: TorrentAnnounceOpts): void;
        destroy(cb?: (err?: Error) => void): void;
    }

    interface Torrent extends NodeJS.EventEmitter {
        readonly infoHash: string;

        readonly magnetURI: string;

        readonly torrentFile: Uint8Array;

        readonly torrentFileBlob: Blob | null;

        readonly files: TorrentFile[];

        readonly announce: string[];

        readonly urlList: string[];

        readonly ["announce-list"]: string[][];

        readonly pieces: Array<TorrentPiece | null>;

        readonly wires: Wire[];

        readonly discovery?: TorrentDiscovery | null | undefined;

        readonly metadata: Uint8Array | null;

        readonly timeRemaining: number;

        readonly received: number;

        readonly downloaded: number;

        readonly uploaded: number;

        readonly downloadSpeed: number;

        readonly uploadSpeed: number;

        readonly progress: number;

        readonly ratio: number;

        readonly length: number;

        readonly pieceLength: number;

        readonly lastPieceLength: number;

        readonly numPeers: number;

        readonly path: string;

        readonly ready: boolean;

        readonly paused: boolean;

        readonly destroyed: boolean;

        readonly done: boolean;

        readonly name: string;

        readonly created: Date;

        readonly createdBy: string;

        readonly comment: string;

        readonly maxWebConns: number;

        destroy(opts?: TorrentDestroyOptions, cb?: (err: Error | string) => void): void;

        addPeer(peer: string | SimplePeer): boolean;

        addWebSeed(urlOrConn: string | WebSeedConnection): void;

        removePeer(peer: string | SimplePeer): void;

        select(start: number, end: number, priority?: number, notify?: () => void): void;

        deselect(start: number, end: number): void;

        critical(start: number, end: number): void;

        pause(): void;

        resume(): void;

        rescanFiles(cb?: (err: Error | null) => void): void;

        getFileModtimes(cb: (err: NodeJS.ErrnoException | null, modtimes: number[]) => void): void;

        load(
            streams: NodeJS.ReadableStream | NodeJS.ReadableStream[],
            cb?: (err?: Error) => void,
        ): Promise<Error | undefined>;

        on(event: "infoHash" | "metadata" | "ready" | "done" | "idle", callback: () => void): this;

        on(event: "warning" | "error", callback: (err: Error | string) => void): this;

        on(event: "download" | "upload", callback: (bytes: number) => void): this;

        on(event: "wire", callback: (wire: Wire, addr?: string) => void): this;

        on(event: "noPeers", callback: (announceType: "tracker" | "dht") => void): this;

        on(event: "verified", callback: (index: number) => void): this;

        on(event: "trackerAnnounce" | "dhtAnnounce", callback: () => void): this;
    }

    interface TorrentFileStreamOptions {
        start?: number | undefined;
        end?: number | undefined;
    }

    interface TorrentFile extends NodeJS.EventEmitter {
        readonly name: string;

        readonly path: string;

        readonly length: number;

        readonly size: number;

        readonly type: string;

        readonly downloaded: number;

        readonly progress: number;

        readonly done: boolean;

        get streamURL(): string;

        select(priority?: number): void;

        deselect(): void;

        createReadStream(opts?: TorrentFileStreamOptions): NodeJS.ReadableStream;

        stream(opts?: TorrentFileStreamOptions): ReadableStream<Uint8Array>;

        arrayBuffer(opts?: TorrentFileStreamOptions): Promise<ArrayBuffer>;

        blob(opts?: TorrentFileStreamOptions): Promise<Blob>;

        streamTo<T extends HTMLMediaElement>(elem: T): T;

        includes(piece: number): boolean;

        [Symbol.asyncIterator](opts?: TorrentFileStreamOptions): AsyncIterableIterator<Uint8Array>;

        on(event: "done", callback: () => void): this;

        on(event: "warning" | "error", callback: (err: Error | string) => void): this;

        on(
            event: "stream",
            callback: (
                data: { stream: NodeJS.ReadableStream; file: TorrentFile; req: unknown },
                pipeCallback: (transform: NodeJS.ReadableStream) => void,
            ) => void,
        ): this;

        on(
            event: "iterator",
            callback: (
                data: { iterator: AsyncIterableIterator<Uint8Array>; file: TorrentFile; req: unknown },
                transformCallback: (transform: AsyncIterableIterator<Uint8Array>) => void,
            ) => void,
        ): this;
    }

    interface TorrentPiece {
        readonly length: number;

        readonly missing: number;
    }
}

export default WebTorrent;
