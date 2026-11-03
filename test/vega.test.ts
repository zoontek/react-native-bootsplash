import assert from "node:assert/strict";
import { describe, test } from "node:test";
import zlib from "node:zlib";
import sharp from "sharp";
import { crc32, createVegaSplashZip, createZip } from "../src/extras/vega.ts";

type Entry = { name: string; data: Buffer };

// Reads a stored (not compressed) zip through its central directory
const readZip = (zip: Buffer): Entry[] => {
  const end = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  assert.ok(end >= 0, "end of central directory");

  const count = zip.readUInt16LE(end + 10);
  let offset = zip.readUInt32LE(end + 16);
  const entries: Entry[] = [];

  for (let index = 0; index < count; index++) {
    assert.equal(zip.readUInt32LE(offset), 0x02014b50, "central header");

    const method = zip.readUInt16LE(offset + 10);
    const crc = zip.readUInt32LE(offset + 16);
    const size = zip.readUInt32LE(offset + 20);
    const nameLength = zip.readUInt16LE(offset + 28);
    const extraLength = zip.readUInt16LE(offset + 30);
    const commentLength = zip.readUInt16LE(offset + 32);
    const localOffset = zip.readUInt32LE(offset + 42);
    const name = zip.toString("utf8", offset + 46, offset + 46 + nameLength);

    assert.equal(method, 0, "stored");
    // DOS date 1980-01-01: a month of 0 is invalid for some unzip tools
    assert.equal(zip.readUInt16LE(offset + 14), 0x21, "central date");
    assert.equal(zip.readUInt16LE(localOffset + 12), 0x21, "local date");
    assert.equal(zip.readUInt32LE(localOffset), 0x04034b50, "local header");
    // unzip tools that stream the file read the local header, not the directory
    assert.equal(zip.readUInt32LE(localOffset + 14), crc, "local crc");
    assert.equal(zip.readUInt32LE(localOffset + 18), size, "local size");
    assert.equal(zip.readUInt32LE(localOffset + 22), size, "local raw size");

    const start =
      localOffset +
      30 +
      zip.readUInt16LE(localOffset + 26) +
      zip.readUInt16LE(localOffset + 28);

    const data = zip.subarray(start, start + size);
    assert.equal(crc32(data), crc, `crc of ${name}`);

    entries.push({ name, data });
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
};

const pixel = async (png: Buffer, x: number, y: number) => {
  const { data, info } = await sharp(png)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const index = (y * info.width + x) * info.channels;
  return [data[index], data[index + 1], data[index + 2]];
};

describe("crc32", () => {
  test("matches zlib", () => {
    const data = Buffer.from("SplashScreenImages");
    assert.equal(crc32(data), zlib.crc32(data));
    assert.equal(crc32(Buffer.alloc(0)), 0);
  });
});

describe("createZip", () => {
  test("stores each file under its name, readable through the central directory", () => {
    const zip = createZip([
      { name: "_loop/loop00000.png", data: Buffer.from([1, 2, 3]) },
      { name: "desc.txt", data: Buffer.from("text") },
    ]);

    assert.deepEqual(
      readZip(zip).map(({ name, data }) => [name, [...data]]),
      [
        ["_loop/loop00000.png", [1, 2, 3]],
        ["desc.txt", [...Buffer.from("text")]],
      ],
    );
  });
});

describe("createVegaSplashZip", () => {
  test("writes one 1920x1080 frame and the descriptor Vega reads", async () => {
    const logo = sharp({
      create: { width: 50, height: 50, channels: 3, background: "#ff0000" },
    }).png();

    const zip = await createVegaSplashZip({
      background: "#123456",
      logo,
      logoWidth: 100,
    });

    const entries = readZip(zip);
    assert.deepEqual(
      entries.map(({ name }) => name),
      ["_loop/loop00000.png", "desc.txt"],
    );

    const [frame, desc] = entries;
    assert.equal(desc?.data.toString(), "1920 1080 30\nc 0 0 _loop\n");

    const png = frame?.data ?? Buffer.alloc(0);
    const { width, height, format } = await sharp(png).metadata();
    assert.deepEqual([format, width, height], ["png", 1920, 1080]);

    assert.deepEqual(await pixel(png, 0, 0), [0x12, 0x34, 0x56]);
    assert.deepEqual(await pixel(png, 960, 540), [0xff, 0, 0]);
  });

  test("scales the logo by the Vega pixel ratio", async () => {
    const logo = sharp({
      create: { width: 50, height: 50, channels: 3, background: "#ff0000" },
    }).png();

    const png =
      readZip(
        await createVegaSplashZip({ background: "#fff", logo, logoWidth: 100 }),
      )[0]?.data ?? Buffer.alloc(0);

    // 100 dp at the TV pixel ratio of 2 is 200 px, centered: from x 860 to 1059
    assert.deepEqual(await pixel(png, 861, 540), [0xff, 0, 0]);
    assert.deepEqual(await pixel(png, 1058, 540), [0xff, 0, 0]);
    assert.deepEqual(await pixel(png, 858, 540), [0xff, 0xff, 0xff]);
    assert.deepEqual(await pixel(png, 1061, 540), [0xff, 0xff, 0xff]);
  });
});
