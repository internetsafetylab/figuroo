import { Router } from "express";
import { db, adminTokensTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

// Generate a new secure token
function generateToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

// GET /api/tokens - List all tokens
router.get("/tokens", async (req, res) => {
  try {
    const tokens = await db
      .select({
        id: adminTokensTable.id,
        name: adminTokensTable.name,
        isActive: adminTokensTable.isActive,
        createdAt: adminTokensTable.createdAt,
        lastUsedAt: adminTokensTable.lastUsedAt,
        expiresAt: adminTokensTable.expiresAt,
        usageCount: adminTokensTable.usageCount,
        // Don't return the full token
      })
      .from(adminTokensTable)
      .orderBy(adminTokensTable.createdAt);

    res.json(tokens);
  } catch (error) {
    console.error("Error fetching tokens:", error);
    res.status(500).json({ error: "Failed to fetch tokens" });
  }
});

// POST /api/tokens - Create a new token
router.post("/tokens", async (req, res) => {
  try {
    const { name, expiresAt } = req.body as {
      name?: string;
      expiresAt?: string;
    };

    if (!name) {
      res.status(400).json({ error: "Name is required" });
      return;
    }

    const token = generateToken();
    const newToken = await db
      .insert(adminTokensTable)
      .values({
        token,
        name,
        isActive: true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      })
      .returning();

    if (!newToken || newToken.length === 0) {
      res.status(500).json({ error: "Failed to create token" });
      return;
    }

    // Return full token only on creation
    res.status(201).json({
      id: newToken[0].id,
      token, // Only shown once
      name: newToken[0].name,
      isActive: newToken[0].isActive,
      createdAt: newToken[0].createdAt,
      expiresAt: newToken[0].expiresAt,
    });
  } catch (error) {
    console.error("Error creating token:", error);
    res.status(500).json({ error: "Failed to create token" });
  }
});

// PATCH /api/tokens/:id - Update token
router.patch("/tokens/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive, expiresAt } = req.body as {
      name?: string;
      isActive?: boolean;
      expiresAt?: string;
    };

    const tokenId = parseInt(id);
    if (isNaN(tokenId)) {
      res.status(400).json({ error: "Invalid token ID" });
      return;
    }

    const updated = await db
      .update(adminTokensTable)
      .set({
        ...(name && { name }),
        ...(isActive !== undefined && { isActive }),
        ...(expiresAt && { expiresAt: new Date(expiresAt) }),
      })
      .where(eq(adminTokensTable.id, tokenId))
      .returning({
        id: adminTokensTable.id,
        name: adminTokensTable.name,
        isActive: adminTokensTable.isActive,
        createdAt: adminTokensTable.createdAt,
        lastUsedAt: adminTokensTable.lastUsedAt,
        expiresAt: adminTokensTable.expiresAt,
        usageCount: adminTokensTable.usageCount,
      });

    if (!updated || updated.length === 0) {
      res.status(404).json({ error: "Token not found" });
      return;
    }

    res.json(updated[0]);
  } catch (error) {
    console.error("Error updating token:", error);
    res.status(500).json({ error: "Failed to update token" });
  }
});

// DELETE /api/tokens/:id - Delete token
router.delete("/tokens/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const tokenId = parseInt(id);

    if (isNaN(tokenId)) {
      res.status(400).json({ error: "Invalid token ID" });
      return;
    }

    const deleted = await db
      .delete(adminTokensTable)
      .where(eq(adminTokensTable.id, tokenId))
      .returning({ id: adminTokensTable.id });

    if (!deleted || deleted.length === 0) {
      res.status(404).json({ error: "Token not found" });
      return;
    }

    res.json({ success: true, deletedId: deleted[0].id });
  } catch (error) {
    console.error("Error deleting token:", error);
    res.status(500).json({ error: "Failed to delete token" });
  }
});

export default router;
