"use server";

import { getIp } from "./get-ip";

const trackers: Record<string, { count: number; expiresAt: number }> = {};

export async function rateLimitByIp(limit = 1, windowMs = 10000) {
	const ip = await getIp();

	console.log(trackers);

	if (!ip) {
		throw new Error("IP address not found");
	}

	const tracker = trackers[ip] || { count: 0, expiresAt: 0 };

	if (!trackers[ip]) {
		trackers[ip] = tracker;
	}

	if (tracker.expiresAt < Date.now()) {
		tracker.count = 0;
		tracker.expiresAt = Date.now() + windowMs;
	}

	tracker.count++;

	if (tracker.count > limit) {
		throw new Error("Rate limit exceeded");
	}
}
