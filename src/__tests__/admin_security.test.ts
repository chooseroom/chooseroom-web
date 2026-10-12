import http from "http";
import { prisma } from "../libs/prismaDb";

function checkUrl(
	url: string,
	options: any = {}
): Promise<{ status: number; headers: any; body: string }> {
	return new Promise((resolve, reject) => {
		const req = http.request(url, options, (res) => {
			let data = "";
			res.on("data", (chunk) => (data += chunk));
			res.on("end", () =>
				resolve({
					status: res.statusCode || 0,
					headers: res.headers,
					body: data,
				})
			);
		});
		req.on("error", reject);
		if (options.body) {
			req.write(options.body);
		}
		req.end();
	});
}

async function runTests() {
	console.log("\n--- TEST 1: Unauthenticated GET /admin ---");
	const adminGet = await checkUrl("http://localhost:3000/admin");
	console.log(
		`Status: ${adminGet.status}, Location: ${adminGet.headers.location}`
	);
	const test1Pass = adminGet.status === 307 || adminGet.status === 302;
	console.log(`Result: ${test1Pass ? "PASS (Denied & Redirected)" : "FAIL"}`);

	console.log("\n--- TEST 2: Unauthenticated GET /admin/owners ---");
	const ownersGet = await checkUrl("http://localhost:3000/admin/owners");
	console.log(
		`Status: ${ownersGet.status}, Location: ${ownersGet.headers.location}`
	);
	const test2Pass = ownersGet.status === 307 || ownersGet.status === 302;
	console.log(`Result: ${test2Pass ? "PASS (Denied & Redirected)" : "FAIL"}`);

	console.log(
		"\n--- TEST 3: Unauthenticated POST /api/admin/owners/status ---"
	);
	const statusApi = await checkUrl(
		"http://localhost:3000/api/admin/owners/status",
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId: "fake-id", status: "SUSPENDED" }),
		}
	);
	console.log(`Status: ${statusApi.status}, Body: ${statusApi.body}`);
	const test3Pass = statusApi.status === 401;
	console.log(`Result: ${test3Pass ? "PASS (HTTP 401 Unauthorized)" : "FAIL"}`);

	console.log(
		"\n--- TEST 4: Unauthenticated POST /api/admin/change-password ---"
	);
	const pwApi = await checkUrl(
		"http://localhost:3000/api/admin/change-password",
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				currentPassword: "test",
				newPassword: "new",
				confirmPassword: "new",
			}),
		}
	);
	console.log(`Status: ${pwApi.status}, Body: ${pwApi.body}`);
	const test4Pass = pwApi.status === 401;
	console.log(`Result: ${test4Pass ? "PASS (HTTP 401 Unauthorized)" : "FAIL"}`);

	console.log(
		"\n--- TEST 5: Public Registration Tampering Attempt (role: 'ADMIN') ---"
	);
	const testEmail = `tamper-test-${Date.now()}@example.com`;
	const regAttempt = await checkUrl("http://localhost:3000/api/user/register", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			name: "Hacker Admin",
			email: testEmail,
			phone: `9830${Date.now().toString().slice(-6)}`,
			password: "HackerPassword123!",
			role: "ADMIN",
			status: "ACTIVE",
		}),
	});
	console.log(`Registration Status: ${regAttempt.status}`);
	let parsedBody: any = {};
	try {
		parsedBody = JSON.parse(regAttempt.body);
	} catch (e) {
		parsedBody = {};
	}
	const returnedRole = parsedBody.data?.role;
	console.log(`API response role: ${returnedRole}`);

	// Also verify directly against live database
	const dbUser = await prisma.user.findUnique({ where: { email: testEmail } });
	console.log(
		`Database record role: ${dbUser?.role}, status: ${dbUser?.status}`
	);

	const test5Pass =
		returnedRole === "BUSINESS_OWNER" && dbUser?.role === "BUSINESS_OWNER";
	console.log(
		`Result: ${test5Pass ? "PASS (Role ADMIN was stripped; BUSINESS_OWNER enforced in DB)" : "FAIL"}`
	);

	// Cleanup test users
	await prisma.user.deleteMany({
		where: { email: { startsWith: "tamper-test-" } },
	});
	console.log("Cleaned up tamper test records from database.");

	console.log("\n=== SUMMARY ===");
	if (test1Pass && test2Pass && test3Pass && test4Pass && test5Pass) {
		console.log("ALL 5 LIVE VERIFICATION TESTS PASSED!");
	} else {
		console.log("SOME LIVE TESTS FAILED!");
		process.exit(1);
	}

	await prisma.$disconnect();
}

runTests().catch(async (e) => {
	console.error(e);
	await prisma.$disconnect();
	process.exit(1);
});
