import { z } from "zod";
import { db } from "@/lib/db";
import { authenticateApiKey } from "@/lib/api-auth";
import {
  generateInviteToken,
  getCounterpartyRole,
  buildShareUrl,
} from "@/lib/transaction/helpers";

const InviteSchema = z.object({
  role: z.enum(["BUYER", "SELLER"]),
  prefill: z.object({
    name: z.string().trim().optional(),
    email: z.email().trim().toLowerCase().optional(),
    phone: z.string().optional(),
  }).optional(),
});

// POST /api/v1/transactions/:id/invite
// Generates a signed invite token for the counterparty.
// Returns the token + pre-built widget URL + public share URL.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiKey(req);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const transaction = await db.transaction.findUnique({
    where: { id },
    include: { parties: { select: { role: true, userId: true, isInitiator: true } } },
  });

  if (!transaction) return Response.json({ error: "Not found" }, { status: 404 });

  const isParty = transaction.parties.some(
    (p: { userId: string }) => p.userId === auth.userId
  );
  if (!isParty) return Response.json({ error: "Not found" }, { status: 404 });

  if (transaction.status !== "CREATED") {
    return Response.json(
      { error: "Invite tokens can only be generated for transactions in CREATED status" },
      { status: 409 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validated = InviteSchema.safeParse(body);
  if (!validated.success) {
    return Response.json(
      { error: "Validation failed", details: z.flattenError(validated.error).fieldErrors },
      { status: 422 }
    );
  }

  // Verify the caller's party role matches the requested counterparty
  const myParty = transaction.parties.find(
    (p: { userId: string; role: string }) => p.userId === auth.userId
  );
  const counterpartyRole = myParty
    ? getCounterpartyRole(myParty.role as "BUYER" | "SELLER")
    : validated.data.role;

  if (validated.data.role !== counterpartyRole) {
    return Response.json(
      { error: `You are the ${myParty?.role}. The counterparty must be the ${counterpartyRole}.` },
      { status: 422 }
    );
  }

  // Check if this slot is already taken
  const slotTaken = transaction.parties.some(
    (p: { role: string }) => p.role === counterpartyRole
  );
  if (slotTaken) {
    return Response.json({ error: "The counterparty slot is already filled" }, { status: 409 });
  }

  const token = await generateInviteToken(id, counterpartyRole, validated.data.prefill);
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return Response.json({
    data: {
      token,
      role: counterpartyRole,
      widgetUrl: `${base}/widget/${id}?token=${token}`,
      shareUrl: buildShareUrl(id, token),
      expiresIn: "7 days",
    },
  });
}
