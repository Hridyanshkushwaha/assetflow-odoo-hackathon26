import Asset from '../models/Asset.js';

export async function generateAssetTag() {
  const count = await Asset.countDocuments();
  const next = count + 1;
  return `AF-${String(next).padStart(4, '0')}`;
}
