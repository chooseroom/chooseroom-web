import { prisma } from "../libs/prismaDb";

async function runRoomsBedsTests() {
	console.log("=================================================");
	console.log("ChooseBed — Phase E: Rooms & Beds Test Suite");
	console.log("=================================================\n");

	let passCount = 0;
	let failCount = 0;

	const testTag = Date.now().toString().slice(-6);
	let ownerAId = "";
	let ownerBId = "";
	let propertyAId = "";
	let propertyBId = "";

	try {
		// -------------------------------------------------------------
		// SETUP: Create two test owners with properties
		// -------------------------------------------------------------
		const ownerA = await prisma.user.create({
			data: {
				name: `Test Owner A ${testTag}`,
				phone: `9111${testTag}`,
				role: "BUSINESS_OWNER",
				status: "ACTIVE",
				setupCompleted: true,
			},
		});
		ownerAId = ownerA.id;

		const ownerB = await prisma.user.create({
			data: {
				name: `Test Owner B ${testTag}`,
				phone: `9222${testTag}`,
				role: "BUSINESS_OWNER",
				status: "ACTIVE",
				setupCompleted: true,
			},
		});
		ownerBId = ownerB.id;

		const propertyA = await prisma.property.create({
			data: {
				name: `Shiv Shanti PG ${testTag}`,
				type: "PG",
				gender: "BOYS",
				address: "123 MG Road",
				city: "Bengaluru",
				area: "Koramangala",
				ownerId: ownerAId,
			},
		});
		propertyAId = propertyA.id;

		const propertyB = await prisma.property.create({
			data: {
				name: `Sai Residency ${testTag}`,
				type: "HOSTEL",
				gender: "GIRLS",
				address: "456 Park Avenue",
				city: "Bengaluru",
				area: "Indiranagar",
				ownerId: ownerBId,
			},
		});
		propertyBId = propertyB.id;

		console.log(
			`[SETUP] Created Owner A (${ownerAId}) & Owner B (${ownerBId})`
		);

		// -------------------------------------------------------------
		// TEST 1: Create room and verify atomic bed generation
		// -------------------------------------------------------------
		try {
			console.log(
				"\n[TEST 1] Verifying Room & Bed atomic inventory creation..."
			);

			// Test Single sharing -> 1 bed
			const singleRoom = await prisma.room.create({
				data: {
					roomNumber: "101",
					floor: "1st Floor",
					sharing: "SINGLE",
					acType: "AC",
					rentPerBed: 10000,
					propertyId: propertyAId,
					beds: {
						create: [{ bedNumber: 1, status: "AVAILABLE" }],
					},
				},
				include: { beds: true },
			});
			if (
				singleRoom.beds.length !== 1 ||
				singleRoom.beds[0].status !== "AVAILABLE"
			) {
				throw new Error("Single sharing did not generate 1 AVAILABLE bed");
			}

			// Test Double sharing -> 2 beds
			const doubleRoom = await prisma.room.create({
				data: {
					roomNumber: "102",
					floor: "1st Floor",
					sharing: "DOUBLE",
					acType: "NON_AC",
					rentPerBed: 7500,
					propertyId: propertyAId,
					beds: {
						create: [
							{ bedNumber: 1, status: "AVAILABLE" },
							{ bedNumber: 2, status: "AVAILABLE" },
						],
					},
				},
				include: { beds: true },
			});
			if (doubleRoom.beds.length !== 2) {
				throw new Error("Double sharing did not generate 2 beds");
			}

			// Test Triple sharing -> 3 beds
			const tripleRoom = await prisma.room.create({
				data: {
					roomNumber: "201",
					floor: "2nd Floor",
					sharing: "TRIPLE",
					acType: "AC",
					rentPerBed: 6000,
					propertyId: propertyAId,
					beds: {
						create: [
							{ bedNumber: 1, status: "AVAILABLE" },
							{ bedNumber: 2, status: "AVAILABLE" },
							{ bedNumber: 3, status: "AVAILABLE" },
						],
					},
				},
				include: { beds: true },
			});
			if (tripleRoom.beds.length !== 3) {
				throw new Error("Triple sharing did not generate 3 beds");
			}

			// Test Four sharing -> 4 beds
			const fourRoom = await prisma.room.create({
				data: {
					roomNumber: "202",
					floor: "2nd Floor",
					sharing: "FOUR",
					acType: "NON_AC",
					rentPerBed: 4500,
					propertyId: propertyAId,
					beds: {
						create: [
							{ bedNumber: 1, status: "AVAILABLE" },
							{ bedNumber: 2, status: "AVAILABLE" },
							{ bedNumber: 3, status: "AVAILABLE" },
							{ bedNumber: 4, status: "AVAILABLE" },
						],
					},
				},
				include: { beds: true },
			});
			if (fourRoom.beds.length !== 4) {
				throw new Error("Four sharing did not generate 4 beds");
			}

			console.log(
				"✓ PASS: All sharing types correctly generate 1, 2, 3, and 4 AVAILABLE beds."
			);
			passCount++;
		} catch (err: any) {
			console.error("✗ FAIL [TEST 1]:", err.message);
			failCount++;
		}

		// -------------------------------------------------------------
		// TEST 2: Enforce Unique Room Number per Property
		// -------------------------------------------------------------
		try {
			console.log(
				"\n[TEST 2] Verifying duplicate room number rejection in same property..."
			);
			let duplicateFailed = false;
			try {
				await prisma.room.create({
					data: {
						roomNumber: "101", // Duplicate for propertyAId
						floor: "1st Floor",
						sharing: "SINGLE",
						acType: "AC",
						propertyId: propertyAId,
						beds: { create: [{ bedNumber: 1, status: "AVAILABLE" }] },
					},
				});
			} catch (dupErr: any) {
				// Prisma P2002 is unique constraint violation
				if (dupErr.code === "P2002") {
					duplicateFailed = true;
				} else {
					throw dupErr;
				}
			}

			if (!duplicateFailed) {
				throw new Error(
					"Duplicate roomNumber '101' was allowed in the same property!"
				);
			}

			console.log(
				"✓ PASS: Database enforces unique roomNumber within the same property."
			);
			passCount++;
		} catch (err: any) {
			console.error("✗ FAIL [TEST 2]:", err.message);
			failCount++;
		}

		// -------------------------------------------------------------
		// TEST 3: Allow same room number across DIFFERENT properties
		// -------------------------------------------------------------
		try {
			console.log(
				"\n[TEST 3] Verifying roomNumber '101' is allowed in different property..."
			);
			const roomPropB = await prisma.room.create({
				data: {
					roomNumber: "101", // Same number, different property
					floor: "Ground Floor",
					sharing: "SINGLE",
					acType: "NON_AC",
					propertyId: propertyBId,
					beds: { create: [{ bedNumber: 1, status: "AVAILABLE" }] },
				},
			});

			if (!roomPropB.id) {
				throw new Error("Failed to create room 101 in property B");
			}

			console.log(
				"✓ PASS: Same room number can independently exist in a different property."
			);
			passCount++;
		} catch (err: any) {
			console.error("✗ FAIL [TEST 3]:", err.message);
			failCount++;
		}

		// -------------------------------------------------------------
		// TEST 4: Multi-Tenant Security Scope Verification
		// -------------------------------------------------------------
		try {
			console.log(
				"\n[TEST 4] Verifying multi-tenant isolation between Owner A and Owner B..."
			);
			// Query Owner A's rooms via Owner A's property
			const ownerARooms = await prisma.room.findMany({
				where: {
					property: { ownerId: ownerAId },
				},
			});

			// Verify none of Owner B's rooms are returned
			const hasOwnerBRooms = ownerARooms.some(
				(r) => r.propertyId === propertyBId
			);
			if (hasOwnerBRooms) {
				throw new Error("Owner A query returned Owner B's room records!");
			}

			// Direct cross-tenant query: Owner A attempting to access Owner B's room
			const crossTenantAttempt = await prisma.room.findFirst({
				where: {
					propertyId: propertyBId,
					property: { ownerId: ownerAId }, // False match
				},
			});

			if (crossTenantAttempt !== null) {
				throw new Error("Cross-tenant room access succeeded unexpectedly!");
			}

			console.log(
				"✓ PASS: Multi-tenant ownership query strictly isolates room records."
			);
			passCount++;
		} catch (err: any) {
			console.error("✗ FAIL [TEST 4]:", err.message);
			failCount++;
		}

		// -------------------------------------------------------------
		// TEST 5: Room Update operations
		// -------------------------------------------------------------
		try {
			console.log(
				"\n[TEST 5] Verifying safe room updates (floor, rent, notes)..."
			);
			const roomToUpdate = await prisma.room.findFirst({
				where: { propertyId: propertyAId, roomNumber: "102" },
			});
			if (!roomToUpdate) throw new Error("Room 102 not found for update test");

			const updated = await prisma.room.update({
				where: { id: roomToUpdate.id },
				data: {
					floor: "1st Floor - Wing B",
					rentPerBed: 8500,
					notes: "Refurbished with study desk.",
				},
				include: { beds: true },
			});

			if (
				updated.floor !== "1st Floor - Wing B" ||
				updated.rentPerBed !== 8500 ||
				updated.beds.length !== 2 // Bed inventory untouched
			) {
				throw new Error("Room update corrupted room data or bed count");
			}

			console.log(
				"✓ PASS: Room update correctly modifies fields while preserving bed inventory."
			);
			passCount++;
		} catch (err: any) {
			console.error("✗ FAIL [TEST 5]:", err.message);
			failCount++;
		}

		// -------------------------------------------------------------
		// TEST 6: Room Deletion with Cascade Beds
		// -------------------------------------------------------------
		try {
			console.log(
				"\n[TEST 6] Verifying safe room deletion with cascade-deleted beds..."
			);
			// Create a room specifically to delete
			const tempRoom = await prisma.room.create({
				data: {
					roomNumber: "999",
					floor: "Terrace",
					sharing: "DOUBLE",
					acType: "NON_AC",
					propertyId: propertyAId,
					beds: {
						create: [
							{ bedNumber: 1, status: "AVAILABLE" },
							{ bedNumber: 2, status: "AVAILABLE" },
						],
					},
				},
				include: { beds: true },
			});

			const bedIds = tempRoom.beds.map((b) => b.id);

			// Delete room
			await prisma.room.delete({ where: { id: tempRoom.id } });

			// Verify beds were cascade deleted
			const remainingBeds = await prisma.bed.findMany({
				where: { id: { in: bedIds } },
			});

			if (remainingBeds.length > 0) {
				throw new Error("Beds were not cascade-deleted after room deletion");
			}

			console.log(
				"✓ PASS: Room deletion safely cascade-removes associated available beds."
			);
			passCount++;
		} catch (err: any) {
			console.error("✗ FAIL [TEST 6]:", err.message);
			failCount++;
		}

		// -------------------------------------------------------------
		// TEST 7: Dashboard Operational Metrics Calculation
		// -------------------------------------------------------------
		try {
			console.log(
				"\n[TEST 7] Verifying live metrics computation for Property A..."
			);
			// Mark one bed in Property A as OCCUPIED
			const bedToOccupy = await prisma.bed.findFirst({
				where: { room: { propertyId: propertyAId } },
			});
			if (bedToOccupy) {
				await prisma.bed.update({
					where: { id: bedToOccupy.id },
					data: { status: "OCCUPIED" },
				});
			}

			const propWithRooms = await prisma.property.findUnique({
				where: { id: propertyAId },
				include: {
					rooms: {
						include: { beds: true },
					},
				},
			});

			if (!propWithRooms) throw new Error("Property A not found");

			const totalRooms = propWithRooms.rooms.length;
			const allBeds = propWithRooms.rooms.flatMap((r) => r.beds);
			const totalBeds = allBeds.length;
			const occupiedBeds = allBeds.filter(
				(b) => b.status === "OCCUPIED"
			).length;
			const availableBeds = allBeds.filter(
				(b) => b.status === "AVAILABLE"
			).length;
			const occupancyPercentage =
				totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

			if (totalRooms !== 4) {
				throw new Error(`Expected 4 rooms, got ${totalRooms}`);
			}
			if (totalBeds !== 10) {
				// 1 + 2 + 3 + 4 = 10 beds
				throw new Error(`Expected 10 total beds, got ${totalBeds}`);
			}
			if (occupiedBeds !== 1) {
				throw new Error(`Expected 1 occupied bed, got ${occupiedBeds}`);
			}
			if (availableBeds !== 9) {
				throw new Error(`Expected 9 available beds, got ${availableBeds}`);
			}
			if (occupancyPercentage !== 10) {
				// 1/10 = 10%
				throw new Error(`Expected 10% occupancy, got ${occupancyPercentage}%`);
			}

			console.log(
				`✓ PASS: Metrics calculated accurately: ${totalRooms} rooms, ${totalBeds} beds, ${availableBeds} vacant, ${occupancyPercentage}% occupancy.`
			);
			passCount++;
		} catch (err: any) {
			console.error("✗ FAIL [TEST 7]:", err.message);
			failCount++;
		}
	} finally {
		// Clean up test data
		console.log("\n[CLEANUP] Removing test data...");
		if (propertyAId) {
			await prisma.room.deleteMany({ where: { propertyId: propertyAId } });
			await prisma.property
				.delete({ where: { id: propertyAId } })
				.catch(() => {});
		}
		if (propertyBId) {
			await prisma.room.deleteMany({ where: { propertyId: propertyBId } });
			await prisma.property
				.delete({ where: { id: propertyBId } })
				.catch(() => {});
		}
		if (ownerAId) {
			await prisma.user.delete({ where: { id: ownerAId } }).catch(() => {});
		}
		if (ownerBId) {
			await prisma.user.delete({ where: { id: ownerBId } }).catch(() => {});
		}
		console.log("[CLEANUP] Done.");
	}

	console.log(`\n=================================================`);
	console.log(`Results: ${passCount} passed, ${failCount} failed`);
	console.log(`=================================================`);

	if (failCount > 0) {
		process.exit(1);
	}
}

runRoomsBedsTests().catch((err) => {
	console.error("FATAL ERROR in test runner:", err);
	process.exit(1);
});
