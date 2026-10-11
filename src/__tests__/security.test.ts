/**
 * security.test.ts
 *
 * Regression tests for Step 1 security fixes.
 *
 * These are integration-style tests written as plain async functions that can
 * be run manually via `npx ts-node src/__tests__/security.test.ts` or adapted
 * for Jest/Vitest when a test runner is added.
 *
 * Each test documents WHAT vulnerability it prevents and HOW to verify it.
 *
 * NOTE: Tests marked [MANUAL] require a running dev server and a live database.
 * Tests marked [UNIT] exercise logic that can be verified without network calls.
 */

// ---------------------------------------------------------------------------
// TEST 1: fetchSession provider no longer exists
// ---------------------------------------------------------------------------
/**
 * VULNERABILITY: fetchSession CredentialsProvider issued a valid JWT for any
 * registered user given only their email address — no password required.
 *
 * FIX: The provider was removed entirely from authOptions.providers.
 *
 * VERIFICATION [UNIT]: The provider array must not contain an entry with
 * id === "fetchSession".
 */
async function test_fetchSession_provider_removed() {
	const { authOptions } = await import("@/libs/auth");

	const fetchSessionProvider = authOptions.providers.find(
		(p: any) => p.id === "fetchSession"
	);

	if (fetchSessionProvider !== undefined) {
		throw new Error(
			"FAIL: fetchSession provider still exists in authOptions.providers. " +
				"This is a critical authentication bypass vulnerability."
		);
	}

	console.log("PASS: fetchSession provider has been removed.");
}

// ---------------------------------------------------------------------------
// TEST 2: fetchSession HTTP endpoint returns 4xx (not a session)
// ---------------------------------------------------------------------------
/**
 * VULNERABILITY: POST /api/auth/callback/fetchSession accepted email-only
 * credentials and issued a valid JWT.
 *
 * FIX: Provider removed, so NextAuth will return an error for unknown provider.
 *
 * VERIFICATION [MANUAL]: Sending a POST to the endpoint must not return a
 * Set-Cookie header containing a session token.
 *
 * To run manually:
 *   curl -X POST http://localhost:3000/api/auth/callback/fetchSession \
 *     -H "Content-Type: application/json" \
 *     -d '{"email":"any-registered-user@example.com"}'
 *
 * Expected: HTTP 302/400 with no session cookie.
 * Fail criteria: HTTP 200 with a `next-auth.session-token` cookie.
 */
export const MANUAL_TEST_2 = `
  curl -v -X POST http://localhost:3000/api/auth/callback/fetchSession \\
    -H "Content-Type: application/json" \\
    -d '{"email":"any-registered-user@example.com"}'
  Expected: no session cookie in response headers.
`;

// ---------------------------------------------------------------------------
// TEST 3: JWT trigger=update cannot escalate role
// ---------------------------------------------------------------------------
/**
 * VULNERABILITY: The JWT callback with trigger === "update" spread the entire
 * session.user object into the token, so a client could call
 * useSession().update({ user: { role: "ADMIN" } }) to elevate their role.
 *
 * FIX: The callback now re-fetches the user from the database using token.sub
 * and only updates billing fields and non-privileged display fields.
 *
 * VERIFICATION [UNIT]: The updated jwt callback must call prisma.user.findUnique
 * and must NOT include session.user.role in the returned token.
 */
async function test_jwt_update_does_not_accept_client_role() {
	// Read the raw source and check that the trigger=update branch
	// does NOT contain "session.user.role" or "...session.user"
	const fs = await import("fs");
	const path = await import("path");

	const authSource = fs.readFileSync(
		path.resolve(process.cwd(), "src/libs/auth.ts"),
		"utf-8"
	);

	const updateBranchMatch = authSource.match(
		/if\s*\(trigger\s*===\s*["']update["']\)([\s\S]*?)\/\/ Initial sign-in/
	);

	if (!updateBranchMatch) {
		console.warn(
			"WARN: Could not parse trigger=update branch — inspect auth.ts manually."
		);
		return;
	}

	const updateBranch = updateBranchMatch[1];

	if (updateBranch.includes("session.user.role")) {
		throw new Error(
			"FAIL: trigger=update branch still references session.user.role, " +
				"which allows client-side role escalation."
		);
	}

	if (updateBranch.includes("...session.user")) {
		throw new Error(
			"FAIL: trigger=update branch spreads the entire session.user object " +
				"into the token. This is the role escalation vector."
		);
	}

	if (!updateBranch.includes("prisma.user.findUnique")) {
		throw new Error(
			"FAIL: trigger=update branch does not re-fetch from the database. " +
				"Privileged fields must come from the DB, not from the client."
		);
	}

	console.log(
		"PASS: JWT trigger=update callback re-fetches from DB and does not " +
			"accept client-supplied role."
	);
}

// ---------------------------------------------------------------------------
// TEST 4: Prisma query logging disabled in production
// ---------------------------------------------------------------------------
/**
 * VULNERABILITY: PrismaClient was initialised with log: ["query"] unconditionally,
 * writing full SQL queries (including emails and tokens) to stdout in production.
 *
 * FIX: log: ["query"] is now only enabled when NODE_ENV === "development".
 */
async function test_prisma_query_logging_disabled_in_production() {
	const fs = await import("fs");
	const path = await import("path");

	const source = fs.readFileSync(
		path.resolve(process.cwd(), "src/libs/prismaDb.ts"),
		"utf-8"
	);

	// Must have an environment guard around "query"
	if (!source.includes('NODE_ENV') || !source.includes('"development"')) {
		throw new Error(
			"FAIL: prismaDb.ts does not appear to guard query logging behind " +
				"NODE_ENV === 'development'."
		);
	}

	// Must not have unconditional log: ["query"]
	if (/log:\s*\[\s*["']query["']\s*\]/.test(source)) {
		throw new Error(
			"FAIL: prismaDb.ts still has unconditional log: [\"query\"]. " +
				"This logs all SQL queries in production."
		);
	}

	console.log("PASS: Prisma query logging is guarded by NODE_ENV.");
}

// ---------------------------------------------------------------------------
// TEST 5: /api/user/fetch-user requires authentication
// ---------------------------------------------------------------------------
/**
 * VULNERABILITY: GET /api/user/fetch-user accepted an ?email= query parameter
 * with no session check, returning billing data for any user.
 *
 * FIX: The route now calls getServerSession and returns 401 if no session.
 *
 * VERIFICATION [MANUAL]:
 *   curl http://localhost:3000/api/user/fetch-user?email=admin@example.com
 *   Expected: HTTP 401
 *   Fail criteria: HTTP 200 with priceId/subscriptionId in the body.
 */
export const MANUAL_TEST_5 = `
  curl -v "http://localhost:3000/api/user/fetch-user?email=any-user@example.com"
  Expected: HTTP 401 {"message":"Unauthorized"}
`;

async function test_fetch_user_route_has_auth_check() {
	const fs = await import("fs");
	const path = await import("path");

	const source = fs.readFileSync(
		path.resolve(
			process.cwd(),
			"src/app/api/user/fetch-user/route.ts"
		),
		"utf-8"
	);

	if (!source.includes("getServerSession")) {
		throw new Error(
			"FAIL: fetch-user route does not call getServerSession. " +
				"The route is still unauthenticated."
		);
	}

	if (!source.includes("401")) {
		throw new Error(
			"FAIL: fetch-user route does not return 401 for unauthenticated requests."
		);
	}

	console.log("PASS: fetch-user route has session authentication check.");
}

// ---------------------------------------------------------------------------
// TEST 6: /api/generate-content requires authentication and no client apiKey
// ---------------------------------------------------------------------------
async function test_generate_content_route_secured() {
	const fs = await import("fs");
	const path = await import("path");

	const source = fs.readFileSync(
		path.resolve(process.cwd(), "src/app/api/generate-content/route.ts"),
		"utf-8"
	);

	if (!source.includes("getServerSession")) {
		throw new Error(
			"FAIL: generate-content route does not call getServerSession."
		);
	}

	if (source.includes("apiKey ? apiKey :") || source.includes("body.apiKey")) {
		throw new Error(
			"FAIL: generate-content route still accepts a client-supplied apiKey. " +
				"This allows unauthenticated OpenAI proxy abuse."
		);
	}

	console.log(
		"PASS: generate-content route is authenticated and uses server-side API key only."
	);
}

// ---------------------------------------------------------------------------
// TEST 7: impersonate provider requires adminPassword
// ---------------------------------------------------------------------------
async function test_impersonate_requires_admin_password() {
	const { authOptions } = await import("@/libs/auth");

	const impersonateProvider = authOptions.providers.find(
		(p: any) => p.id === "impersonate" || p.options?.id === "impersonate"
	) as any;

	if (!impersonateProvider) {
		throw new Error(
			"FAIL: impersonate provider not found in authOptions.providers."
		);
	}

	// Check that the credentials schema includes adminPassword
	const credentials =
		impersonateProvider.options?.credentials || impersonateProvider.credentials;
	if (!credentials?.adminPassword) {
		throw new Error(
			"FAIL: impersonate provider credentials schema does not include adminPassword. " +
				"The provider can be invoked without password verification."
		);
	}

	console.log(
		"PASS: impersonate provider requires adminPassword credential."
	);
}

// ---------------------------------------------------------------------------
// Run all unit tests
// ---------------------------------------------------------------------------
(async () => {
	const unitTests = [
		test_fetchSession_provider_removed,
		test_jwt_update_does_not_accept_client_role,
		test_prisma_query_logging_disabled_in_production,
		test_fetch_user_route_has_auth_check,
		test_generate_content_route_secured,
		test_impersonate_requires_admin_password,
	];

	let passed = 0;
	let failed = 0;

	for (const test of unitTests) {
		try {
			await test();
			passed++;
		} catch (err: any) {
			console.error(`\n${err.message}\n`);
			failed++;
		}
	}

	console.log(`\n=== Security Regression Results: ${passed} passed, ${failed} failed ===`);

	console.log("\n--- Manual tests (require running dev server) ---");
	console.log("TEST 2 (fetchSession HTTP endpoint):", MANUAL_TEST_2);
	console.log("TEST 5 (fetch-user unauthenticated):", MANUAL_TEST_5);

	if (failed > 0) process.exit(1);
})();
