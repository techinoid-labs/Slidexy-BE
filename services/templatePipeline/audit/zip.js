/**
 * Minimal zip reader for .pptx files. Reads the central directory and
 * inflates entries with zlib, so the audit needs no extra packages.
 * Files whose central directory is missing are read entry by entry.
 */

const zlib = require("zlib");

function wrap(entries, complete) {
  return {
    complete,
    names: () => [...entries.keys()],
    has: (name) => entries.has(name),
    size: (name) => (entries.get(name) || {}).size || 0,
    read: (name) => (entries.has(name) ? entries.get(name).data : null),
    head: (name, max) => (entries.has(name) ? entries.get(name).data.subarray(0, max) : null),
    text: (name) => (entries.has(name) ? entries.get(name).data.toString("utf8") : null),
  };
}

function scanLocalHeaders(buffer) {
  const entries = new Map();
  let offset = 0;
  while (offset + 30 <= buffer.length && buffer.readUInt32LE(offset) === 0x04034b50) {
    const flags = buffer.readUInt16LE(offset + 6);
    const method = buffer.readUInt16LE(offset + 8);
    let compressedSize = buffer.readUInt32LE(offset + 18);
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const name = buffer.toString("utf8", offset + 30, offset + 30 + nameLength);
    const start = offset + 30 + nameLength + extraLength;
    const deferred = (flags & 8) !== 0;
    let data;
    try {
      if (method === 8) {
        const result = zlib.inflateRawSync(buffer.subarray(start), { info: true });
        data = result.buffer;
        compressedSize = result.engine.bytesWritten;
      } else if (method === 0 && deferred) {
        let found = -1;
        for (let pos = buffer.indexOf(0x50, start); pos >= 0 && pos + 16 <= buffer.length; pos = buffer.indexOf(0x50, pos + 1)) {
          if (buffer.readUInt32LE(pos) === 0x08074b50 && buffer.readUInt32LE(pos + 8) === pos - start) {
            found = pos;
            break;
          }
        }
        if (found < 0) break;
        compressedSize = found - start;
        data = Buffer.from(buffer.subarray(start, found));
      } else if (method === 0) {
        if (start + compressedSize > buffer.length) break;
        data = Buffer.from(buffer.subarray(start, start + compressedSize));
      } else {
        break;
      }
    } catch (error) {
      break;
    }
    entries.set(name, { data, size: data.length });
    let next = start + compressedSize;
    if (deferred) next += next + 4 <= buffer.length && buffer.readUInt32LE(next) === 0x08074b50 ? 16 : 12;
    offset = next;
  }
  return wrap(entries, false);
}

function readZip(buffer) {
  let eocd = -1;
  const floor = Math.max(0, buffer.length - 65557);
  for (let i = buffer.length - 22; i >= floor; i -= 1) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) {
    if (buffer.length >= 4 && buffer.readUInt32LE(0) === 0x04034b50) return scanLocalHeaders(buffer);
    throw new Error("Not a zip file");
  }
  const count = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  const entries = new Map();
  for (let n = 0; n < count; n += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error("Bad zip central directory");
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const size = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString("utf8", offset + 46, offset + 46 + nameLength);
    entries.set(name, { method, compressedSize, size, localOffset });
    offset += 46 + nameLength + extraLength + commentLength;
  }

  function raw(entry) {
    const local = entry.localOffset;
    const start = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
    return buffer.subarray(start, start + entry.compressedSize);
  }

  function read(name) {
    const entry = entries.get(name);
    if (!entry) return null;
    const data = raw(entry);
    if (entry.method === 0) return Buffer.from(data);
    if (entry.method === 8) return zlib.inflateRawSync(data);
    throw new Error("Unsupported zip compression method " + entry.method);
  }

  function head(name, max) {
    const entry = entries.get(name);
    if (!entry) return null;
    const data = raw(entry);
    if (entry.method === 0) return data.subarray(0, max);
    if (entry.method === 8) {
      return zlib.inflateRawSync(data.subarray(0, Math.min(data.length, max)), { finishFlush: zlib.constants.Z_SYNC_FLUSH }).subarray(0, max);
    }
    return null;
  }

  return {
    complete: true,
    names: () => [...entries.keys()],
    has: (name) => entries.has(name),
    size: (name) => (entries.get(name) || {}).size || 0,
    read,
    head,
    text: (name) => {
      const data = read(name);
      return data ? data.toString("utf8") : null;
    },
  };
}

module.exports = { readZip };
