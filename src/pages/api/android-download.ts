import type { APIRoute } from "astro";

// This endpoint streams the private APK from Vercel Blob using a read-only token
export const GET: APIRoute = async () => {
	const blobUrl = process.env.ANDROID_BLOB_URL;
	const readToken = process.env.BLOB_READ_ONLY_TOKEN;

	if (!blobUrl || !readToken) {
		return new Response("Server not configured", { status: 500 });
	}

	const upstream = await fetch(blobUrl, {
		headers: { Authorization: `Bearer ${readToken}` },
	});

	if (!upstream.ok || !upstream.body) {
		return new Response("File not found", { status: upstream.status || 404 });
	}

	const headers = new Headers();
	const contentType =
		upstream.headers.get("content-type") ||
		"application/vnd.android.package-archive";
	const contentLength = upstream.headers.get("content-length");

	headers.set("Content-Type", contentType);
	if (contentLength) headers.set("Content-Length", contentLength);
	headers.set("Content-Disposition", "attachment; filename=app-android.apk");
	headers.set("Cache-Control", "no-store");

	return new Response(upstream.body, { status: 200, headers });
};
