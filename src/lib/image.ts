// Normalize token image URLs into something a browser <img> can actually load.
// Token metadata frequently carries ipfs:// / ar:// or protocol-relative URLs
// that a raw <img> cannot resolve; route those through public gateways.
export function resolveTokenImage(url?: string | null): string | undefined {
    if (!url) return undefined;
    const u = url.trim();
    if (!u) return undefined;

    if (u.startsWith("ipfs://")) {
        // strip ipfs:// and an optional leading "ipfs/" before the CID
        const cid = u.slice("ipfs://".length).replace(/^ipfs\//, "");
        return `https://ipfs.io/ipfs/${cid}`;
    }
    if (u.startsWith("ar://")) {
        return `https://arweave.net/${u.slice("ar://".length)}`;
    }
    if (u.startsWith("//")) {
        return `https:${u}`;
    }
    return u;
}
