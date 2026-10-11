import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

/**
 * SECURITY: Query logging is restricted to development only.
 * In production, logging SQL queries can expose emails, tokens, and
 * hashed passwords in log aggregators and STDOUT.
 */
export const prisma =
	globalForPrisma.prisma ||
	new PrismaClient({
		log:
			process.env.NODE_ENV === "development"
				? ["query", "error", "warn"]
				: ["error"],
	});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
