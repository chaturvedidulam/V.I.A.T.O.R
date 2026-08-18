import { randomBytes } from "crypto";

export function generateId(prefix: string): string {
  const randomPart = randomBytes(8).toString("base64url");

  return `${prefix}_${randomPart}`;
}
