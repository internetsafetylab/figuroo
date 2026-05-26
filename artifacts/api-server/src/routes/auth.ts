import { Router } from "express";
import { db, adminTokensTable } from "@workspace/db";
import { eq, and, or, isNull, gt } from "drizzle-orm";

const router = Router();

router.post("/auth/verify", async (req, res) => {
  try {
    const { token } = req.body as { token?: string };

    if (!token) {
      res.status(401).json({ error: "Token required" });
      return;
    }

    // Query token from Supabase
    const adminToken = await db
      .select()
      .from(adminTokensTable)
      .where(
        and(
          eq(adminTokensTable.token, token),
          eq(adminTokensTable.isActive, true),
          or(
            isNull(adminTokensTable.expiresAt),
            gt(adminTokensTable.expiresAt, new Date()),
          ),
        ),
      )
      .limit(1);

    if (!adminToken || adminToken.length === 0) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    const foundToken = adminToken[0];

    // Update last used and increment usage count
    await db
      .update(adminTokensTable)
      .set({
        lastUsedAt: new Date(),
        usageCount: (foundToken.usageCount ?? 0) + 1,
      })
      .where(eq(adminTokensTable.id, foundToken.id));

    res.json({ ok: true, tokenId: foundToken.id, tokenName: foundToken.name });
  } catch (error) {
    console.error("Auth verification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
