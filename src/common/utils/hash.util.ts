import * as bycrpt from 'bcrypt'

const SALT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bycrpt.hash(plain, SALT_ROUNDS);
}

export async function compareHashedPassword(plain: string, hashed: string): Promise<boolean> {
  return bycrpt.compare(plain, hashed);
}