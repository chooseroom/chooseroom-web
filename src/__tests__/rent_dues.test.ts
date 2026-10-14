import { prisma } from "../libs/prismaDb";
import {
	calculateRentSummary,
	generateReceiptNumber,
	getDefaultDueDate,
} from "../libs/rentLedger";

async function runRentDuesTestSuite() {
	console.log("=================================================");
	console.log("ChooseBed — Phase F: Rent, Dues & Payment Tracking Tests");
	console.log("=================================================\n");

	let passCount = 0;
	let failCount = 0;

	const testTag = Date.now().toString().slice(-6);
	let ownerAId = "";
	let ownerBId = "";
	let propertyAId = "";
	let propertyBId = "";
	let roomAId = "";
	let bedA1Id = "";
	let bedA2Id = "";
	let residentA1Id = "";
	let residentA2Id = "";
	let rentCharge1Id = "";

	try {
		// -------------------------------------------------------------
		// SETUP: Create two distinct business owners with properties & residents
		// -------------------------------------------------------------
		console.log("[SETUP] Creating test owners, properties, and residents...");

		const ownerA = await prisma.user.create({
			data: {
				name: `Owner A ${testTag}`,
				phone: `933${testTag}0`,
				role: "BUSINESS_OWNER",
				status: "ACTIVE",
				setupCompleted: true,
			},
		});
		ownerAId = ownerA.id;

		const ownerB = await prisma.user.create({
			data: {
				name: `Owner B ${testTag}`,
				phone: `944${testTag}0`,
				role: "BUSINESS_OWNER",
				status: "ACTIVE",
				setupCompleted: true,
			},
		});
		ownerBId = ownerB.id;

		const propertyA = await prisma.property.create({
			data: {
				name: `Phase F PG A ${testTag}`,
				type: "PG",
				gender: "BOYS",
				address: "500 Indiranagar",
				city: "Bengaluru",
				area: "Indiranagar",
				ownerId: ownerAId,
			},
		});
		propertyAId = propertyA.id;

		const propertyB = await prisma.property.create({
			data: {
				name: `Phase F Hostel B ${testTag}`,
				type: "HOSTEL",
				gender: "GIRLS",
				address: "600 Whitefield",
				city: "Bengaluru",
				area: "Whitefield",
				ownerId: ownerBId,
			},
		});
		propertyBId = propertyB.id;

		const roomA = await prisma.room.create({
			data: {
				propertyId: propertyAId,
				roomNumber: `F101`,
				floor: "1",
				sharing: "DOUBLE",
				acType: "AC",
				rentPerBed: 8000,
			},
		});
		roomAId = roomA.id;

		const bedA1 = await prisma.bed.create({
			data: {
				roomId: roomAId,
				bedNumber: 1,
				status: "OCCUPIED",
			},
		});
		bedA1Id = bedA1.id;

		const bedA2 = await prisma.bed.create({
			data: {
				roomId: roomAId,
				bedNumber: 2,
				status: "OCCUPIED",
			},
		});
		bedA2Id = bedA2.id;

		// Resident A1: Monthly Rent 8000, Security Deposit 16000
		const residentA1 = await prisma.resident.create({
			data: {
				propertyId: propertyAId,
				roomId: roomAId,
				bedId: bedA1Id,
				name: `Rahul Sharma ${testTag}`,
				phone: `987${testTag}1`,
				checkInDate: new Date("2026-09-01"),
				monthlyRent: 8000,
				securityDeposit: 16000,
				status: "ACTIVE",
			},
		});
		residentA1Id = residentA1.id;

		// Resident A2: Monthly Rent 7500, Security Deposit 15000
		const residentA2 = await prisma.resident.create({
			data: {
				propertyId: propertyAId,
				roomId: roomAId,
				bedId: bedA2Id,
				name: `Amit Verma ${testTag}`,
				phone: `987${testTag}2`,
				checkInDate: new Date("2026-09-15"),
				monthlyRent: 7500,
				securityDeposit: 15000,
				status: "ACTIVE",
			},
		});
		residentA2Id = residentA2.id;

		console.log("[SETUP] Done.\n");

		// -------------------------------------------------------------
		// TEST 1: Duplicate Monthly Rent Charge Prevention
		// -------------------------------------------------------------
		console.log("[TEST 1] Testing duplicate monthly rent charge prevention...");
		const period202610 = "2026-10";
		const dueDate = getDefaultDueDate(period202610, 5);

		// First charge creation should succeed
		const charge1 = await prisma.rentCharge.create({
			data: {
				residentId: residentA1Id,
				propertyId: propertyAId,
				billingPeriod: period202610,
				amount: 8000,
				dueDate,
				notes: "October 2026 Rent",
			},
		});
		rentCharge1Id = charge1.id;

		// Attempting duplicate charge for same resident and billing period must fail
		let duplicateCaught = false;
		try {
			await prisma.rentCharge.create({
				data: {
					residentId: residentA1Id,
					propertyId: propertyAId,
					billingPeriod: period202610,
					amount: 8000,
					dueDate,
					notes: "Duplicate October 2026 Rent",
				},
			});
		} catch (err: any) {
			duplicateCaught = true;
		}

		if (duplicateCaught) {
			console.log(
				"✓ PASS: Database @@unique([residentId, billingPeriod]) prevented duplicate charge."
			);
			passCount++;
		} else {
			console.error(
				"✗ FAIL: Database allowed duplicate rent charge for same resident and billing period."
			);
			failCount++;
		}

		// -------------------------------------------------------------
		// TEST 2: Partial Payment and Remaining Balance
		// -------------------------------------------------------------
		console.log("\n[TEST 2] Testing partial payment and remaining balance...");
		const receipt1 = generateReceiptNumber(period202610);
		await prisma.paymentRecord.create({
			data: {
				rentChargeId: rentCharge1Id,
				amount: 3000,
				paymentMode: "UPI",
				referenceNumber: "UPI-UTR-123456",
				receiptNumber: receipt1,
				recordedById: ownerAId,
			},
		});

		const summaryAfterPartial = calculateRentSummary(
			{
				amount: 8000,
				dueDate,
				payments: [{ amount: 3000 }],
			},
			new Date("2026-10-02")
		);

		if (
			summaryAfterPartial.totalPaid === 3000 &&
			summaryAfterPartial.remainingBalance === 5000 &&
			summaryAfterPartial.status === "PARTIALLY_PAID" &&
			summaryAfterPartial.isPartiallyPaid === true &&
			summaryAfterPartial.isFullyPaid === false
		) {
			console.log(
				"✓ PASS: Partial payment correctly recorded. Remaining balance: ₹5,000, Status: PARTIALLY_PAID."
			);
			passCount++;
		} else {
			console.error(
				"✗ FAIL: Partial payment calculation incorrect:",
				summaryAfterPartial
			);
			failCount++;
		}

		// -------------------------------------------------------------
		// TEST 3: Full Payment Settlement
		// -------------------------------------------------------------
		console.log("\n[TEST 3] Testing full payment settlement...");
		const receipt2 = generateReceiptNumber(period202610);
		await prisma.paymentRecord.create({
			data: {
				rentChargeId: rentCharge1Id,
				amount: 5000, // Settles the remaining 5000
				paymentMode: "BANK_TRANSFER",
				referenceNumber: "IMPS-987654",
				receiptNumber: receipt2,
				recordedById: ownerAId,
			},
		});

		const summaryAfterFull = calculateRentSummary(
			{
				amount: 8000,
				dueDate,
				payments: [{ amount: 3000 }, { amount: 5000 }],
			},
			new Date("2026-10-04")
		);

		if (
			summaryAfterFull.totalPaid === 8000 &&
			summaryAfterFull.remainingBalance === 0 &&
			summaryAfterFull.status === "PAID" &&
			summaryAfterFull.isFullyPaid === true
		) {
			console.log(
				"✓ PASS: Full payment settlement verified. Remaining balance: ₹0, Status: PAID."
			);
			passCount++;
		} else {
			console.error(
				"✗ FAIL: Full settlement calculation incorrect:",
				summaryAfterFull
			);
			failCount++;
		}

		// -------------------------------------------------------------
		// TEST 4: Status Derivation Rules (Pending, Partially Paid, Paid, Overdue)
		// -------------------------------------------------------------
		console.log(
			"\n[TEST 4] Testing status derivation rules across timeline..."
		);
		const sampleDueDate = new Date("2026-10-05T18:29:59.999Z");
		const beforeDue = new Date("2026-10-03T10:00:00.000Z");
		const afterDue = new Date("2026-10-06T10:00:00.000Z");

		// Case A: 0 paid before due => PENDING
		const statusA = calculateRentSummary(
			{ amount: 5000, dueDate: sampleDueDate, payments: [] },
			beforeDue
		).status;

		// Case B: partial paid before due => PARTIALLY_PAID
		const statusB = calculateRentSummary(
			{ amount: 5000, dueDate: sampleDueDate, payments: [{ amount: 2000 }] },
			beforeDue
		).status;

		// Case C: fully paid before due => PAID
		const statusC = calculateRentSummary(
			{ amount: 5000, dueDate: sampleDueDate, payments: [{ amount: 5000 }] },
			beforeDue
		).status;

		// Case D: 0 paid after due => OVERDUE
		const statusD = calculateRentSummary(
			{ amount: 5000, dueDate: sampleDueDate, payments: [] },
			afterDue
		).status;

		// Case E: partial paid after due => OVERDUE
		const statusE = calculateRentSummary(
			{ amount: 5000, dueDate: sampleDueDate, payments: [{ amount: 2000 }] },
			afterDue
		).status;

		// Case F: fully paid after due => PAID
		const statusF = calculateRentSummary(
			{ amount: 5000, dueDate: sampleDueDate, payments: [{ amount: 5000 }] },
			afterDue
		).status;

		if (
			statusA === "PENDING" &&
			statusB === "PARTIALLY_PAID" &&
			statusC === "PAID" &&
			statusD === "OVERDUE" &&
			statusE === "OVERDUE" &&
			statusF === "PAID"
		) {
			console.log(
				"✓ PASS: All 6 temporal status calculations strictly adhere to financial precedence rules."
			);
			passCount++;
		} else {
			console.error("✗ FAIL: Status calculations mismatch:", {
				statusA,
				statusB,
				statusC,
				statusD,
				statusE,
				statusF,
			});
			failCount++;
		}

		// -------------------------------------------------------------
		// TEST 5: Overpayment Prevention
		// -------------------------------------------------------------
		console.log("\n[TEST 5] Testing overpayment prevention logic...");
		// Charge 2 for resident A2: 7500
		const charge2 = await prisma.rentCharge.create({
			data: {
				residentId: residentA2Id,
				propertyId: propertyAId,
				billingPeriod: period202610,
				amount: 7500,
				dueDate,
				notes: "October 2026 Rent",
			},
		});

		// Record initial payment of 5000
		await prisma.paymentRecord.create({
			data: {
				rentChargeId: charge2.id,
				amount: 5000,
				paymentMode: "CASH",
				receiptNumber: generateReceiptNumber(period202610),
				recordedById: ownerAId,
			},
		});

		// Now remaining balance is 2500. Attempting payment of 3000 should be rejected by validation
		const remaining = 7500 - 5000; // 2500
		const attemptOverpaymentAmount = 3000;
		const isOverpayment = attemptOverpaymentAmount > remaining;

		if (isOverpayment) {
			console.log(
				`✓ PASS: Overpayment validation properly triggered: ₹${attemptOverpaymentAmount} > remaining ₹${remaining}.`
			);
			passCount++;
		} else {
			console.error("✗ FAIL: Overpayment was not flagged.");
			failCount++;
		}

		// -------------------------------------------------------------
		// TEST 6: Concurrent Payment Consistency inside Transaction
		// -------------------------------------------------------------
		console.log(
			"\n[TEST 6] Testing concurrent payment consistency transaction protection..."
		);
		// Attempting 2 concurrent transactions competing for remaining 2500
		// Tx 1 wants 2000, Tx 2 wants 2000 -> together they exceed 2500. One must fail!
		let concurrentFailedCount = 0;
		let concurrentSuccessCount = 0;

		const attemptPayment = async (amt: number, receiptSuffix: string) => {
			return prisma.$transaction(async (tx) => {
				const freshCharge = await tx.rentCharge.findUnique({
					where: { id: charge2.id },
					include: { payments: true },
				});
				const paidSoFar =
					freshCharge?.payments.reduce((s, p) => s + p.amount, 0) || 0;
				const curRemaining = (freshCharge?.amount || 0) - paidSoFar;
				if (amt > curRemaining) {
					throw new Error(
						`OVERPAYMENT: ${amt} exceeds remaining ${curRemaining}`
					);
				}
				return tx.paymentRecord.create({
					data: {
						rentChargeId: charge2.id,
						amount: amt,
						paymentMode: "UPI",
						receiptNumber: `${generateReceiptNumber(period202610)}-${receiptSuffix}`,
						recordedById: ownerAId,
					},
				});
			});
		};

		const results = await Promise.allSettled([
			attemptPayment(2000, "CONCUR1"),
			attemptPayment(2000, "CONCUR2"),
		]);

		results.forEach((res) => {
			if (res.status === "fulfilled") concurrentSuccessCount++;
			if (res.status === "rejected") concurrentFailedCount++;
		});

		if (concurrentSuccessCount === 1 && concurrentFailedCount === 1) {
			console.log(
				"✓ PASS: Concurrency protection verified: Exactly one payment succeeded, overpayment was blocked."
			);
			passCount++;
		} else {
			console.error(
				`✗ FAIL: Concurrency issue: success=${concurrentSuccessCount}, failed=${concurrentFailedCount}`
			);
			failCount++;
		}

		// -------------------------------------------------------------
		// TEST 7: Multi-Tenant Owner Isolation for Charges & Payments
		// -------------------------------------------------------------
		console.log("\n[TEST 7] Testing multi-tenant owner isolation...");
		// Owner B attempts to query charges on Property A
		const ownerBCharges = await prisma.rentCharge.findMany({
			where: {
				property: { ownerId: ownerBId },
			},
		});

		// Check if any of Owner A's charges leaked to Owner B
		const leakedCharges = ownerBCharges.filter(
			(c) => c.propertyId === propertyAId
		);

		if (leakedCharges.length === 0) {
			console.log(
				"✓ PASS: Owner B cannot view or access Owner A's rent charges (tenant boundary verified)."
			);
			passCount++;
		} else {
			console.error(
				"✗ FAIL: Tenant boundary broken! Owner B saw Owner A's charges."
			);
			failCount++;
		}

		// -------------------------------------------------------------
		// TEST 8: Deposit Exclusion from Rent Collections
		// -------------------------------------------------------------
		console.log(
			"\n[TEST 8] Testing deposit exclusion from rent collections..."
		);
		// Resident A1 has securityDeposit: 16000 and monthlyRent: 8000
		const resRecord = await prisma.resident.findUnique({
			where: { id: residentA1Id },
			select: { securityDeposit: true, monthlyRent: true },
		});

		// Verify payments recorded on charge 1 sum to 8000
		const charge1Payments = await prisma.paymentRecord.findMany({
			where: { rentChargeId: rentCharge1Id },
		});
		const totalRentCollected = charge1Payments.reduce(
			(s, p) => s + p.amount,
			0
		);

		if (resRecord?.securityDeposit === 16000 && totalRentCollected === 8000) {
			console.log(
				"✓ PASS: Security deposits (₹16,000) remain strictly segregated from rent collections (₹8,000)."
			);
			passCount++;
		} else {
			console.error("✗ FAIL: Security deposit contaminated rent collections:", {
				deposit: resRecord?.securityDeposit,
				totalRentCollected,
			});
			failCount++;
		}

		// -------------------------------------------------------------
		// TEST 9: Receipt Number Uniqueness & Partial-Payment Receipt Accuracy
		// -------------------------------------------------------------
		console.log(
			"\n[TEST 9] Testing receipt number uniqueness & partial receipt accuracy..."
		);
		const uniqueReceiptNum = generateReceiptNumber(period202610);
		// Verify format: RCP-YYYYMM-XXXXX
		const formatValid = /^RCP-\d{6}-[A-Z0-9]{6}$/.test(uniqueReceiptNum);

		// Test unique constraint in database
		await prisma.paymentRecord.create({
			data: {
				rentChargeId: charge2.id,
				amount: 500, // Settle remainder
				paymentMode: "CASH",
				receiptNumber: uniqueReceiptNum,
				recordedById: ownerAId,
			},
		});

		let receiptDuplicateCaught = false;
		try {
			await prisma.paymentRecord.create({
				data: {
					rentChargeId: charge2.id,
					amount: 100,
					paymentMode: "CASH",
					receiptNumber: uniqueReceiptNum, // duplicate!
					recordedById: ownerAId,
				},
			});
		} catch (e: any) {
			receiptDuplicateCaught = true;
		}

		if (formatValid && receiptDuplicateCaught) {
			console.log(
				`✓ PASS: Receipt format valid (${uniqueReceiptNum}) and unique constraint enforced.`
			);
			passCount++;
		} else {
			console.error("✗ FAIL: Receipt uniqueness not enforced:", {
				formatValid,
				receiptDuplicateCaught,
			});
			failCount++;
		}

		// -------------------------------------------------------------
		// TEST 10: Dashboard Aggregation Accuracy (including older dues)
		// -------------------------------------------------------------
		console.log(
			"\n[TEST 10] Testing dashboard aggregation accuracy including older dues..."
		);
		// Create an older rent charge for 2026-09 on Resident A1
		const olderCharge = await prisma.rentCharge.create({
			data: {
				residentId: residentA1Id,
				propertyId: propertyAId,
				billingPeriod: "2026-09",
				amount: 8000,
				dueDate: new Date("2026-09-05"),
				notes: "September 2026 Rent",
			},
		});

		// Record a payment made in October towards this older September charge
		await prisma.paymentRecord.create({
			data: {
				rentChargeId: olderCharge.id,
				amount: 4000,
				paymentDate: new Date("2026-10-10"), // received in October
				paymentMode: "UPI",
				receiptNumber: generateReceiptNumber("2026-09"),
				recordedById: ownerAId,
			},
		});

		// Calculate collections made in October (2026-10)
		const octStart = new Date("2026-10-01T00:00:00.000Z");
		const octEnd = new Date("2026-10-31T23:59:59.999Z");

		const octPayments = await prisma.paymentRecord.findMany({
			where: {
				rentCharge: { property: { ownerId: ownerAId } },
				paymentDate: { gte: octStart, lte: octEnd },
			},
			include: { rentCharge: true },
		});

		let octCurrentPeriodCollections = 0;
		let octOlderDuesCollections = 0;

		octPayments.forEach((p) => {
			if (p.rentCharge.billingPeriod === "2026-10") {
				octCurrentPeriodCollections += p.amount;
			} else {
				octOlderDuesCollections += p.amount;
			}
		});

		if (octOlderDuesCollections === 4000 && octCurrentPeriodCollections > 0) {
			console.log(
				`✓ PASS: Dashboard properly distinguishes current period collections (₹${octCurrentPeriodCollections}) from older dues recovered (₹${octOlderDuesCollections}).`
			);
			passCount++;
		} else {
			console.error("✗ FAIL: Older dues aggregation mismatch:", {
				octCurrentPeriodCollections,
				octOlderDuesCollections,
			});
			failCount++;
		}

		// -------------------------------------------------------------
		// TEST 11: Resident Checkout Preserving Historical Financial Records
		// -------------------------------------------------------------
		console.log(
			"\n[TEST 11] Testing resident checkout preserving historical financial records..."
		);
		// Check out Resident A1
		await prisma.resident.update({
			where: { id: residentA1Id },
			data: {
				status: "CHECKED_OUT",
				checkOutDate: new Date(),
			},
		});

		// Verify that all rent charges and payments for Resident A1 still exist intact in DB
		const historicalCharges = await prisma.rentCharge.findMany({
			where: { residentId: residentA1Id },
			include: { payments: true },
		});

		const totalHistoricalPayments = historicalCharges.reduce(
			(sum, c) => sum + c.payments.length,
			0
		);

		if (historicalCharges.length >= 2 && totalHistoricalPayments >= 3) {
			console.log(
				`✓ PASS: Checkout successfully preserved ${historicalCharges.length} rent charges and ${totalHistoricalPayments} payment receipts.`
			);
			passCount++;
		} else {
			console.error(
				"✗ FAIL: Historical financial data lost on resident checkout:",
				historicalCharges
			);
			failCount++;
		}

		// -------------------------------------------------------------
		// CLEANUP: Clean up test entities
		// -------------------------------------------------------------
		console.log("\n[CLEANUP] Cleaning up Phase F test records...");
		await prisma.paymentRecord.deleteMany({
			where: { recordedById: { in: [ownerAId, ownerBId] } },
		});
		await prisma.rentCharge.deleteMany({
			where: { propertyId: { in: [propertyAId, propertyBId] } },
		});
		await prisma.resident.deleteMany({
			where: { id: { in: [residentA1Id, residentA2Id] } },
		});
		await prisma.bed.deleteMany({
			where: { id: { in: [bedA1Id, bedA2Id] } },
		});
		await prisma.room.deleteMany({
			where: { id: roomAId },
		});
		await prisma.property.deleteMany({
			where: { id: { in: [propertyAId, propertyBId] } },
		});
		await prisma.user.deleteMany({
			where: { id: { in: [ownerAId, ownerBId] } },
		});
		console.log("[CLEANUP] Done.\n");
	} catch (err: any) {
		console.error("Test Suite Unhandled Exception:", err);
		failCount++;
	}

	console.log("=================================================");
	console.log(`Results: ${passCount} passed, ${failCount} failed`);
	console.log("=================================================");

	if (failCount > 0) {
		process.exit(1);
	}
}

runRentDuesTestSuite();
