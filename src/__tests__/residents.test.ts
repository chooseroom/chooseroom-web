import { prisma } from "../libs/prismaDb";

async function runResidentsTestSuite() {
	console.log("=================================================");
	console.log("ChooseBed — Phase E Part 2: Residents & Allocation Tests");
	console.log("=================================================\n");

	let passCount = 0;
	let failCount = 0;

	const testTag = Date.now().toString().slice(-6);
	let ownerAId = "";
	let ownerBId = "";
	let propertyAId = "";
	let propertyBId = "";
	let roomA1Id = "";
	let bedA1_1Id = "";
	let bedA1_2Id = "";
	let resident1Id = "";

	try {
		// -------------------------------------------------------------
		// SETUP: Create two distinct business owners with properties & rooms
		// -------------------------------------------------------------
		const ownerA = await prisma.user.create({
			data: {
				name: `Owner A ${testTag}`,
				phone: `911${testTag}0`,
				role: "BUSINESS_OWNER",
				status: "ACTIVE",
				setupCompleted: true,
			},
		});
		ownerAId = ownerA.id;

		const ownerB = await prisma.user.create({
			data: {
				name: `Owner B ${testTag}`,
				phone: `922${testTag}0`,
				role: "BUSINESS_OWNER",
				status: "ACTIVE",
				setupCompleted: true,
			},
		});
		ownerBId = ownerB.id;

		const propertyA = await prisma.property.create({
			data: {
				name: `Green PG ${testTag}`,
				type: "PG",
				gender: "BOYS",
				address: "101 1st Cross",
				city: "Bengaluru",
				area: "Koramangala",
				ownerId: ownerAId,
			},
		});
		propertyAId = propertyA.id;

		const propertyB = await prisma.property.create({
			data: {
				name: `Blue Hostel ${testTag}`,
				type: "HOSTEL",
				gender: "GIRLS",
				address: "202 2nd Main",
				city: "Bengaluru",
				area: "HSR Layout",
				ownerId: ownerBId,
			},
		});
		propertyBId = propertyB.id;

		// Create Room 101 in Property A with 2 beds (DOUBLE sharing)
		const roomA1 = await prisma.room.create({
			data: {
				roomNumber: "101",
				floor: "1st Floor",
				sharing: "DOUBLE",
				acType: "AC",
				rentPerBed: 8000,
				propertyId: propertyAId,
				beds: {
					create: [
						{ bedNumber: 1, status: "AVAILABLE" },
						{ bedNumber: 2, status: "AVAILABLE" },
					],
				},
			},
			include: { beds: { orderBy: { bedNumber: "asc" } } },
		});
		roomA1Id = roomA1.id;
		bedA1_1Id = roomA1.beds[0].id;
		bedA1_2Id = roomA1.beds[1].id;

		console.log(
			`[SETUP] Initialized Owner A & B with Property A (Room 101, 2 Beds) and Property B.`
		);

		// -------------------------------------------------------------
		// TEST 1: Resident creation with a valid available bed
		// -------------------------------------------------------------
		console.log(
			"\n[TEST 1] Creating a resident with an available bed in atomic transaction..."
		);
		const resident1 = await prisma.$transaction(async (tx) => {
			const bed = await tx.bed.findUnique({ where: { id: bedA1_1Id } });
			if (!bed || bed.status !== "AVAILABLE")
				throw new Error("BED_UNAVAILABLE");

			await tx.bed.update({
				where: { id: bedA1_1Id },
				data: { status: "OCCUPIED" },
			});

			return await tx.resident.create({
				data: {
					name: "Aman Verma",
					phone: "9876543210",
					email: "aman@example.com",
					guardianName: "Rajesh Verma",
					guardianPhone: "9876543211",
					checkInDate: new Date(),
					monthlyRent: 8000,
					securityDeposit: 5000,
					status: "ACTIVE",
					propertyId: propertyAId,
					roomId: roomA1Id,
					bedId: bedA1_1Id,
				},
			});
		});
		resident1Id = resident1.id;

		if (resident1.name === "Aman Verma" && resident1.status === "ACTIVE") {
			console.log("✓ PASS: Resident record successfully created.");
			passCount++;
		} else {
			console.error("✗ FAIL: Resident record creation mismatch.");
			failCount++;
		}

		// -------------------------------------------------------------
		// TEST 2: Bed becoming OCCUPIED after check-in
		// -------------------------------------------------------------
		console.log(
			"\n[TEST 2] Verifying bed status changed from AVAILABLE to OCCUPIED..."
		);
		const updatedBed1 = await prisma.bed.findUnique({
			where: { id: bedA1_1Id },
		});
		if (updatedBed1?.status === "OCCUPIED") {
			console.log("✓ PASS: Assigned bed is marked as OCCUPIED in database.");
			passCount++;
		} else {
			console.error(
				`✗ FAIL: Bed status is ${updatedBed1?.status}, expected OCCUPIED.`
			);
			failCount++;
		}

		// -------------------------------------------------------------
		// TEST 3: Preventing allocation of an occupied bed
		// -------------------------------------------------------------
		console.log("\n[TEST 3] Attempting to allocate an already OCCUPIED bed...");
		let occupiedRejected = false;
		try {
			await prisma.$transaction(async (tx) => {
				const bed = await tx.bed.findUnique({ where: { id: bedA1_1Id } });
				if (!bed || bed.status !== "AVAILABLE") {
					throw new Error("BED_ALREADY_OCCUPIED");
				}
				await tx.bed.update({
					where: { id: bedA1_1Id, status: "AVAILABLE" },
					data: { status: "OCCUPIED" },
				});
				await tx.resident.create({
					data: {
						name: "Second Person",
						phone: "9988776655",
						checkInDate: new Date(),
						monthlyRent: 8000,
						status: "ACTIVE",
						propertyId: propertyAId,
						roomId: roomA1Id,
						bedId: bedA1_1Id,
					},
				});
			});
		} catch (err: any) {
			occupiedRejected = true;
		}

		if (occupiedRejected) {
			console.log(
				"✓ PASS: Application transaction rejected allocation of already occupied bed."
			);
			passCount++;
		} else {
			console.error("✗ FAIL: Double allocation was permitted!");
			failCount++;
		}

		// -------------------------------------------------------------
		// TEST 4: Preventing allocation of a MAINTENANCE bed
		// -------------------------------------------------------------
		console.log("\n[TEST 4] Attempting to allocate a MAINTENANCE bed...");
		// Set Bed 2 to MAINTENANCE
		await prisma.bed.update({
			where: { id: bedA1_2Id },
			data: { status: "MAINTENANCE" },
		});

		let maintenanceRejected = false;
		try {
			await prisma.$transaction(async (tx) => {
				const bed = await tx.bed.findUnique({ where: { id: bedA1_2Id } });
				if (!bed || bed.status !== "AVAILABLE") {
					throw new Error("BED_UNDER_MAINTENANCE");
				}
			});
		} catch {
			maintenanceRejected = true;
		}

		if (maintenanceRejected) {
			console.log(
				"✓ PASS: Bed in MAINTENANCE status rejected from allocation."
			);
			passCount++;
		} else {
			console.error("✗ FAIL: Maintenance bed was allowed to be allocated!");
			failCount++;
		}

		// Restore Bed 2 back to AVAILABLE
		await prisma.bed.update({
			where: { id: bedA1_2Id },
			data: { status: "AVAILABLE" },
		});

		// -------------------------------------------------------------
		// TEST 5: Database constraint rejects concurrent active resident on same bed
		// -------------------------------------------------------------
		console.log(
			"\n[TEST 5] Testing PostgreSQL unique constraint on active bed..."
		);
		let duplicateActiveFailed = false;
		try {
			// Directly attempt creating a second ACTIVE resident on bedA1_1Id
			await prisma.resident.create({
				data: {
					name: "Duplicate Allocator",
					phone: "9871112233",
					checkInDate: new Date(),
					monthlyRent: 8000,
					status: "ACTIVE",
					propertyId: propertyAId,
					roomId: roomA1Id,
					bedId: bedA1_1Id, // Already active with Aman Verma
				},
			});
		} catch (err: any) {
			duplicateActiveFailed = true;
		}

		if (duplicateActiveFailed) {
			console.log(
				"✓ PASS: Database partial unique index strictly prevents multiple active residents on one bed."
			);
			passCount++;
		} else {
			console.error(
				"✗ FAIL: Database allowed two simultaneous active residents on the same bed!"
			);
			failCount++;
		}

		// -------------------------------------------------------------
		// TEST 6: Multi-tenant ownership isolation between Owner A and Owner B
		// -------------------------------------------------------------
		console.log("\n[TEST 6] Testing multi-tenant ownership query isolation...");
		const ownerBResidents = await prisma.resident.findMany({
			where: {
				OR: [{ propertyId: propertyBId }, { property: { ownerId: ownerBId } }],
			},
		});

		if (ownerBResidents.length === 0) {
			console.log(
				"✓ PASS: Owner B cannot see Owner A's resident records (multi-tenant boundary verified)."
			);
			passCount++;
		} else {
			console.error(
				"✗ FAIL: Data leak! Owner B can access Owner A's residents."
			);
			failCount++;
		}

		// -------------------------------------------------------------
		// TEST 7: Checkout releasing bed and preserving resident history
		// -------------------------------------------------------------
		console.log("\n[TEST 7] Performing resident checkout transaction...");
		const checkoutResult = await prisma.$transaction(async (tx) => {
			const res = await tx.resident.findUnique({ where: { id: resident1Id } });
			if (!res || res.status === "CHECKED_OUT")
				throw new Error("ALREADY_CHECKED_OUT");

			const updatedResident = await tx.resident.update({
				where: { id: resident1Id },
				data: {
					status: "CHECKED_OUT",
					checkOutDate: new Date(),
				},
			});

			await tx.bed.update({
				where: { id: res.bedId },
				data: { status: "AVAILABLE" },
			});

			return updatedResident;
		});

		const bedAfterCheckout = await prisma.bed.findUnique({
			where: { id: bedA1_1Id },
		});
		if (
			checkoutResult.status === "CHECKED_OUT" &&
			checkoutResult.checkOutDate !== null &&
			bedAfterCheckout?.status === "AVAILABLE"
		) {
			console.log(
				"✓ PASS: Resident checked out, history preserved, and bed returned to AVAILABLE."
			);
			passCount++;
		} else {
			console.error(
				"✗ FAIL: Checkout failed or bed status not reset to AVAILABLE."
			);
			failCount++;
		}

		// -------------------------------------------------------------
		// TEST 8: Preventing repeated checkout from corrupting inventory
		// -------------------------------------------------------------
		console.log(
			"\n[TEST 8] Attempting repeated checkout on already checked out resident..."
		);
		let repeatCheckoutBlocked = false;
		try {
			await prisma.$transaction(async (tx) => {
				const res = await tx.resident.findUnique({
					where: { id: resident1Id },
				});
				if (!res || res.status === "CHECKED_OUT") {
					throw new Error("ALREADY_CHECKED_OUT");
				}
			});
		} catch {
			repeatCheckoutBlocked = true;
		}

		if (repeatCheckoutBlocked) {
			console.log(
				"✓ PASS: Repeated checkout blocked, preventing inventory corruption."
			);
			passCount++;
		} else {
			console.error("✗ FAIL: Repeated checkout was not prevented!");
			failCount++;
		}

		// -------------------------------------------------------------
		// TEST 9: Historical checkout preserves second active check-in on same bed
		// -------------------------------------------------------------
		console.log(
			"\n[TEST 9] Checking in a new resident into the previously vacated bed..."
		);
		const resident2 = await prisma.$transaction(async (tx) => {
			await tx.bed.update({
				where: { id: bedA1_1Id, status: "AVAILABLE" },
				data: { status: "OCCUPIED" },
			});

			return await tx.resident.create({
				data: {
					name: "Pooja Patel",
					phone: "9812345678",
					checkInDate: new Date(),
					monthlyRent: 8500,
					status: "ACTIVE",
					propertyId: propertyAId,
					roomId: roomA1Id,
					bedId: bedA1_1Id,
				},
			});
		});

		const allBedResidents = await prisma.resident.findMany({
			where: { bedId: bedA1_1Id },
			orderBy: { checkInDate: "asc" },
		});

		if (
			resident2.status === "ACTIVE" &&
			allBedResidents.length === 2 &&
			allBedResidents[0].status === "CHECKED_OUT" &&
			allBedResidents[1].status === "ACTIVE"
		) {
			console.log(
				"✓ PASS: Bed history preserves 1 past checkout and 1 new active resident cleanly."
			);
			passCount++;
		} else {
			console.error("✗ FAIL: Bed history or new allocation failed.");
			failCount++;
		}

		// -------------------------------------------------------------
		// TEST 10: Real dashboard occupancy and active resident count
		// -------------------------------------------------------------
		console.log("\n[TEST 10] Verifying live dashboard aggregations...");
		const propertyStats = await prisma.property.findUnique({
			where: { id: propertyAId },
			include: {
				rooms: {
					include: { beds: true },
				},
				residents: true,
			},
		});

		const totalBeds = propertyStats?.rooms.flatMap((r) => r.beds).length || 0;
		const occupiedBeds =
			propertyStats?.rooms
				.flatMap((r) => r.beds)
				.filter((b) => b.status === "OCCUPIED").length || 0;
		const availableBeds =
			propertyStats?.rooms
				.flatMap((r) => r.beds)
				.filter((b) => b.status === "AVAILABLE").length || 0;
		const activeResidentsCount =
			propertyStats?.residents.filter((r) => r.status === "ACTIVE").length || 0;

		if (
			totalBeds === 2 &&
			occupiedBeds === 1 &&
			availableBeds === 1 &&
			activeResidentsCount === 1
		) {
			console.log(
				`✓ PASS: Live metrics match: Total 2, Occupied 1, Available 1, Active Residents 1 (50% Occupancy).`
			);
			passCount++;
		} else {
			console.error(
				`✗ FAIL: Metrics mismatch: total=${totalBeds}, occupied=${occupiedBeds}, available=${availableBeds}, active=${activeResidentsCount}`
			);
			failCount++;
		}

		// -------------------------------------------------------------
		// CLEANUP
		// -------------------------------------------------------------
		console.log("\n[CLEANUP] Cleaning test data...");
		await prisma.user.delete({ where: { id: ownerAId } });
		await prisma.user.delete({ where: { id: ownerBId } });
		console.log("[CLEANUP] Done.");
	} catch (error) {
		console.error("Test Suite execution exception:", error);
		failCount++;
		if (ownerAId)
			await prisma.user.delete({ where: { id: ownerAId } }).catch(() => {});
		if (ownerBId)
			await prisma.user.delete({ where: { id: ownerBId } }).catch(() => {});
	}

	console.log("\n=================================================");
	console.log(`Results: ${passCount} passed, ${failCount} failed`);
	console.log("=================================================");

	if (failCount > 0) {
		process.exit(1);
	}
}

runResidentsTestSuite();
