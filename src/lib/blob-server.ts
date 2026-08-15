import { put } from "@vercel/blob";

/**
 * Server-only blob helpers. Kept out of lib/blob.ts because that module is
 * imported by client components, and the SDK must not reach the browser.
 */

/**
 * A Blob store's access level is fixed when the store is created, so private
 * uploads are only possible on a store that was created private.
 */
export function isPublicStoreError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /private access on a public store/i.test(message);
}

export const PUBLIC_STORE_HINT =
  "This project's Blob store was created with public access, and a store's access level cannot be changed afterwards. To store photos privately, create a new Blob store with private access in Vercel → Storage, connect it to the project and redeploy.";

/**
 * Upload privately where the store allows it, falling back to public.
 *
 * Photos are only ever delivered through the owner-checked image route, so a
 * public store still keeps URLs out of the app — but the object itself stays
 * fetchable by anyone who obtains its address.
 */
export async function putPreferPrivate(
  pathname: string,
  body: Parameters<typeof put>[1]
) {
  try {
    return await put(pathname, body, {
      access: "private",
      addRandomSuffix: false,
    });
  } catch (err) {
    if (!isPublicStoreError(err)) throw err;
    return await put(pathname, body, {
      access: "public",
      addRandomSuffix: false,
    });
  }
}
