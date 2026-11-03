import sharp, { type Sharp } from "sharp";

// React Native for Vega (Amazon Fire TV) draws 1 dp as 2 px on a 1920x1080 TV
export const VEGA_PIXEL_RATIO = 2;
const SCREEN = { width: 1920, height: 1080, fps: 30 };

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;

  for (let bit = 0; bit < 8; bit++) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }

  return value >>> 0;
});

export const crc32 = (data: Buffer) => {
  let crc = 0xffffffff;

  for (const byte of data) {
    crc = (CRC_TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
};

const DOS_DATE = (1 << 5) | 1; // 1980-01-01, the first valid zip date

// A zip with stored (uncompressed) files: PNG frames are compressed already
export const createZip = (files: { name: string; data: Buffer }[]) => {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const { name, data } of files) {
    const fileName = Buffer.from(name, "utf8");
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); // local file header signature
    local.writeUInt16LE(10, 4); // version needed to extract (1.0)
    local.writeUInt16LE(0x0800, 6); // UTF-8 file names
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18); // compressed size
    local.writeUInt32LE(data.length, 22); // uncompressed size
    local.writeUInt16LE(fileName.length, 26);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); // central directory header signature
    central.writeUInt16LE(0x031e, 4); // made by Unix, zip 3.0
    central.writeUInt16LE(10, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(fileName.length, 28);
    central.writeUInt32LE((0o100644 << 16) >>> 0, 38); // -rw-r--r--
    central.writeUInt32LE(offset, 42);

    locals.push(local, fileName, data);
    centrals.push(central, fileName);
    offset += local.length + fileName.length + data.length;
  }

  const directory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); // end of central directory signature
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);

  return Buffer.concat([...locals, directory, end]);
};

// The SplashScreenImages.zip that Vega shows at launch, from assets/raw:
// https://developer.amazon.com/docs/react-native-vega/0.83/splashscreenmanager.html
export const createVegaSplashZip = async ({
  background,
  logo,
  logoWidth,
}: {
  background: string;
  logo: Sharp;
  logoWidth: number;
}) => {
  const logoBuffer = await logo
    .clone()
    .resize(Math.round(logoWidth * VEGA_PIXEL_RATIO))
    .png({ quality: 100 })
    .toBuffer();

  const frame = await sharp({
    create: {
      width: SCREEN.width,
      height: SCREEN.height,
      channels: 3,
      background,
    },
  })
    .composite([{ input: logoBuffer, gravity: "center" }])
    .png({ quality: 100 })
    .toBuffer();

  return createZip([
    { name: "_loop/loop00000.png", data: frame },
    {
      name: "desc.txt",
      data: Buffer.from(
        `${SCREEN.width} ${SCREEN.height} ${SCREEN.fps}\nc 0 0 _loop\n`,
      ),
    },
  ]);
};
