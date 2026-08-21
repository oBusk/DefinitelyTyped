import WebTorrent from "webtorrent";

console.log(WebTorrent.WEBRTC_SUPPORT, WebTorrent.UTP_SUPPORT, WebTorrent.VERSION);

const client = new WebTorrent({
    utp: false,
    utPex: true,
    natUpnp: "permanent",
    natPmp: true,
    seedOutgoingConnections: false,
    secure: 1,
    userAgent: "nullTorrent/1.0.0",
    torrentPort: 6881,
    dhtPort: 6882,
    nodeId: new Uint8Array(20),
    peerId: new Uint8Array(20),
});

console.log(
    client.peerId,
    client.nodeId,
    client.userAgent,
    client.destroyed,
    client.listening,
    client.ready,
    client.torrentPort,
    client.dhtPort,
    client.maxConns,
    client.utp,
    client.secure,
    client.enableWebSeeds,
);

const magnetURI = "...";
const torrentOpts: WebTorrent.TorrentOptions = {
    private: false,
    paused: true,
    deselect: false,
    addUID: true,
    bitfield: new Uint8Array(4),
    noPeersIntervalTime: 45,
    alwaysChokeSeeders: false,
    uploads: 10,
    fileModtimes: [Date.now()],
    strategy: "rarest",
    storeOpts: { customFlag: true },
    getAnnounceOpts() {
        return { uploaded: 0, downloaded: 0 };
    },
    store(chunkLength, storeOpts) {
        console.log(chunkLength, storeOpts.length, storeOpts.files.length, storeOpts.torrent.infoHash, storeOpts.max);
        return null;
    },
};

client.add(magnetURI, torrentOpts, torrent => {
    // Got torrent metadata!
    console.log("Client is downloading:", torrent.infoHash);

    console.log(
        torrent.maxWebConns,
        torrent.ready,
        torrent.paused,
        torrent.destroyed,
        torrent.done,
        torrent.created,
        torrent.createdBy,
        torrent.comment,
    );

    console.log(torrent.torrentFileBlob, torrent.urlList, torrent.wires.length);

    // $ExpectType Uint8Array || Uint8Array<ArrayBufferLike>
    torrent.torrentFile;
    const base64 = Buffer.from(torrent.torrentFile).toString("base64");
    console.log(base64);

    // $ExpectType Uint8Array | null || Uint8Array<ArrayBufferLike> | null
    torrent.metadata;
    if (torrent.metadata !== null) {
        console.log("metadata resolved:", torrent.metadata.byteLength);
    }

    if (torrent.discovery) {
        torrent.discovery.tracker?.update({ uploaded: torrent.uploaded, downloaded: torrent.downloaded });
        torrent.discovery.dht?.lookup(torrent.infoHash, (err, totalNodesFound) => {
            if (err) throw err;
            console.log("nodes found:", totalNodesFound);
        });
    }

    torrent.announce.forEach(announce => console.log(announce));
    torrent["announce-list"].forEach(
        (tracker, trackerIndex) => tracker.forEach(url => console.log(`tracker #${trackerIndex}: ${url}`)),
    );

    console.log(torrent.length, torrent.pieceLength, torrent.lastPieceLength);
    console.log(
        torrent.pieces.reduce(
            (acc, piece) => acc + (piece ? piece.length : 0),
            0,
        ),
    );
    console.log(
        torrent.pieces.reduce(
            (acc, piece) => acc + (piece ? piece.missing : 0),
            0,
        ),
    );

    torrent.wires.forEach(wire => console.log(wire.peerId));

    torrent.select(0, torrent.pieces.length - 1, 1, () => console.log("selection updated"));
    torrent.deselect(0, torrent.pieces.length - 1);
    torrent.critical(0, 0);
    torrent.pause();
    torrent.resume();

    torrent.rescanFiles(err => {
        if (err) throw err;
    });

    torrent.getFileModtimes((err, modtimes) => {
        if (err) throw err;
        console.log(modtimes.length);
    });

    torrent.addPeer("12.34.56.78:4444");
    torrent.removePeer("12.34.56.78:4444");
    torrent.addWebSeed("https://example.com/file.dat");

    torrent.files.forEach(async file => {
        console.log(file.type, file.size, file.done);

        // Display the file by appending it to the DOM. Supports video, audio, images, and
        // more. Specify a container element (CSS selector or reference to DOM node).
        const video = document.querySelector("video");
        if (video) file.streamTo(video);

        console.log("Torrent file streamURL", file.streamURL);
        console.log("includes piece 0:", file.includes(0));

        file.select();
        file.select(1);
        file.deselect();

        const buf = await file.arrayBuffer({ start: 0, end: file.length - 1 });
        console.log(buf.byteLength);

        const blob = await file.blob();
        console.log(blob.size);

        for await (const chunk of file) {
            console.log(chunk.byteLength);
        }

        const stream = file.stream();
        const reader = stream.getReader();
        const { value, done } = await reader.read();
        console.log(value?.byteLength, done);

        const nodeStream = file.createReadStream({ start: 0, end: file.length - 1 });
        nodeStream.on("data", (chunk: Buffer) => console.log(chunk.length));
    });

    torrent.on("done", () => {
        console.log("torrent finished downloading");
        torrent.files.forEach(file => {
            console.log("done:", file.name);
        });
    });

    torrent.on("idle", () => console.log("no more pieces to select"));
    torrent.on("verified", index => console.log("verified piece", index));
    torrent.on("trackerAnnounce", () => console.log("tracker announce"));
    torrent.on("dhtAnnounce", () => console.log("dht announce"));

    torrent.on("download", chunkSize => {
        console.log("chunk size: " + chunkSize);
        console.log("total downloaded: " + torrent.downloaded);
        console.log("download speed: " + torrent.downloadSpeed);
        console.log("progress: " + torrent.progress);
        console.log("======");
    });

    torrent.on("wire", (wire, addr) => {
        console.log("connected to peer with address " + addr, wire.peerId);
    });

    torrent.on("noPeers", announceType => console.log("no peers via", announceType));
    torrent.on("warning", err => console.log("warning:", err));
    torrent.on("error", err => console.log("error:", err));

    torrent.load(nodeStreamOf(torrent), err => {
        if (err) throw err;
    });
});

client.on("torrent", torrent => console.log("torrent event", torrent.infoHash));
client.on("add", torrent => console.log("add event", torrent.infoHash));
client.on("remove", torrent => console.log("remove event", torrent.infoHash));
client.on("seed", torrent => console.log("seed event", torrent.infoHash));
client.on("error", err => console.log("client error", err));
client.on("ready", () => console.log("client ready"));
client.on("listening", () => console.log("client listening"));
client.on("download", bytes => console.log("client download", bytes));
client.on("upload", bytes => console.log("client upload", bytes));

client.seed(new Uint8Array([1, 2, 3]), {}, torrent => {
    console.log("Client is seeding:", torrent.infoHash);
});

client.add(new Uint8Array([1, 2, 3]), torrent => {
    console.log("added from Uint8Array id", torrent.infoHash);
});

async function removeAndFetch() {
    await client.remove(magnetURI, { destroyStore: true });
    const found = await client.get(magnetURI);
    if (found) console.log("found torrent", found.infoHash);

    console.log(client.address());
}
void removeAndFetch();

client.add(magnetURI, () => {
    // create HTTP server for this torrent
    const server = client.createServer();
    if ("server" in server) {
        server.server.listen(1234); // start the server listening to a port
    }
    console.log(server.closed);

    // visit http://localhost:<port>/ to see a list of files

    // access individual files at http://localhost:<port>/<index> where index is the index
    // in the torrent.files array

    // later, cleanup...
    server.close();
    client.destroy();
});

client.throttleDownload(1024);
client.throttleUpload(1024);
console.log(client.downloadSpeed, client.uploadSpeed, client.progress, client.ratio, client.torrents.length);

function nodeStreamOf(torrent: WebTorrent.Torrent): NodeJS.ReadableStream {
    return torrent.files[0].createReadStream();
}
