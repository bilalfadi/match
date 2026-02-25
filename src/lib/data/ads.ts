import { readJson, writeJson, generateId } from "../store";

export type AdPosition =
  | "hero"
  | "home-between-sections"
  | "post-content"
  | "above-iframe"
  | "below-iframe"
  | "sidebar";

export interface IAd {
  _id: string;
  position: AdPosition;
  code: string;
  name?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const FILE = "ads.json";

async function getAds(): Promise<IAd[]> {
  return readJson<IAd[]>(FILE);
}

async function saveAds(ads: IAd[]): Promise<void> {
  await writeJson(FILE, ads);
}

export async function findAds(options: { position?: string; activeOnly?: boolean }): Promise<IAd[]> {
  let ads = await getAds();
  if (options.position) ads = ads.filter((a) => a.position === options.position);
  if (options.activeOnly !== false) ads = ads.filter((a) => a.active);
  return ads;
}

export async function findAdById(id: string): Promise<IAd | null> {
  const ads = await getAds();
  return ads.find((a) => a._id === id) ?? null;
}

export async function createAd(data: {
  position: AdPosition;
  code: string;
  name?: string;
  active?: boolean;
}): Promise<IAd> {
  const ads = await getAds();
  const now = new Date().toISOString();
  const ad: IAd = {
    _id: generateId(),
    position: data.position,
    code: data.code,
    name: data.name ?? "",
    active: data.active !== false,
    createdAt: now,
    updatedAt: now,
  };
  ads.push(ad);
  await saveAds(ads);
  return ad;
}

export async function updateAd(id: string, data: Partial<Omit<IAd, "_id" | "createdAt">>): Promise<IAd | null> {
  const ads = await getAds();
  const idx = ads.findIndex((a) => a._id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  ads[idx] = { ...ads[idx], ...data, _id: id, createdAt: ads[idx].createdAt, updatedAt: now };
  await saveAds(ads);
  return ads[idx];
}

export async function deleteAd(id: string): Promise<boolean> {
  const ads = await getAds();
  const filtered = ads.filter((a) => a._id !== id);
  if (filtered.length === ads.length) return false;
  await saveAds(filtered);
  return true;
}
