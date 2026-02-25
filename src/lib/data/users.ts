import bcrypt from "bcryptjs";
import { readJson, writeJson, generateId } from "../store";

export interface IUser {
  _id: string;
  email: string;
  password: string;
  role: "admin" | "user";
  createdAt: string;
}

const FILE = "users.json";

async function getUsers(): Promise<IUser[]> {
  return readJson<IUser[]>(FILE);
}

async function saveUsers(users: IUser[]): Promise<void> {
  await writeJson(FILE, users);
}

export async function findUserByEmail(email: string): Promise<IUser | null> {
  const users = await getUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function findUserById(id: string): Promise<IUser | null> {
  const users = await getUsers();
  return users.find((u) => u._id === id) ?? null;
}

export async function comparePassword(user: IUser, candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, user.password);
}

export async function createUser(data: {
  email: string;
  password: string;
  role?: "admin" | "user";
}): Promise<IUser> {
  const users = await getUsers();
  const exists = users.some((u) => u.email.toLowerCase() === data.email.toLowerCase());
  if (exists) throw new Error("User already exists");
  const hashed = await bcrypt.hash(data.password, 12);
  const user: IUser = {
    _id: generateId(),
    email: data.email,
    password: hashed,
    role: data.role ?? "admin",
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await saveUsers(users);
  return user;
}

export async function countUsers(): Promise<number> {
  const users = await getUsers();
  return users.length;
}
