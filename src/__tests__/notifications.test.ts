import http from "http";

const BASE_URL = "http://localhost:3000";

function makeRequest(path: string): Promise<{
	status: number;
	headers: http.IncomingHttpHeaders;
	body: string;
}> {
	return new Promise((resolve, reject) => {
		const url = new URL(path, BASE_URL);
		const req = http.request(
			{
				hostname: url.hostname,
				port: url.port,
				path: url.pathname + url.search,
				method: "GET",
			},
			(res) => {
				let data = "";
				res.on("data", (chunk) => (data += chunk));
				res.on("end", () =>
					resolve({
						status: res.statusCode || 0,
						headers: res.headers,
						body: data,
					})
				);
			}
		);
		req.on("error", reject);
		req.end();
	});
}

async function runNotificationTests() {
	console.log("=================================================");
	console.log("Notifications API & Security Verification");
	console.log("=================================================\n");

	let passCount = 0;
	let failCount = 0;

	const assert = (condition: boolean, testName: string) => {
		if (condition) {
			console.log(`[PASS] ${testName}`);
			passCount++;
		} else {
			console.error(`[FAIL] ${testName}`);
			failCount++;
		}
	};

	// 1. Unauthenticated access
	console.log("--- TEST 1: Unauthenticated GET /api/notifications ---");
	const unauthRes = await makeRequest("/api/notifications");
	assert(
		unauthRes.status === 401,
		"GET /api/notifications requires authentication and returns 401"
	);

	console.log("\n=================================================");
	console.log(`Summary: ${passCount} PASSED, ${failCount} FAILED`);
	console.log("=================================================");

	if (failCount > 0) {
		process.exit(1);
	}
}

runNotificationTests().catch((err) => {
	console.error("Test failed:", err);
	process.exit(1);
});
