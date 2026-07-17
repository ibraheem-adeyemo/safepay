// app/api/waitlist/route.ts
// Submits to Google Apps Script (not Google Forms directly).
// Apps Script writes to the Sheet without any CSRF/session issues.

interface WaitlistPayload {
  name:              string;
  email:             string;
  role:              string;
  phoneNumber:       string;
  itemName:          string;
  transactionAmount: string;
}

const REQUIRED: (keyof WaitlistPayload)[] = [
  "name", "email", "role", "phoneNumber", "itemName",
];

export async function POST(req: Request) {
  // 1. Parse
  let body: Partial<WaitlistPayload>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }

  // 2. Validate
  const missing = REQUIRED.filter((k) => !body[k]?.trim());
  if (missing.length > 0) {
    return Response.json(
      { success: false, message: `Missing: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  // 3. Check env
  const scriptUrl = process.env.APPS_SCRIPT_URL;
  if (!scriptUrl) {
    console.error("[waitlist] APPS_SCRIPT_URL not set in .env.local");
    return Response.json(
      { success: false, message: "APPS_SCRIPT_URL not configured" },
      { status: 500 }
    );
  }

  // 4. POST JSON directly to Apps Script — no CSRF, no sessions, no entry IDs
  try {
    const res = await fetch(scriptUrl, {
      method:   "POST",
      headers:  { "Content-Type": "application/json" },
      body:     JSON.stringify({
        name:              body.name!.trim(),
        email:             body.email!.trim(),
        role:              body.role,
        scammed:           "",
        itemName:          body.itemName!.trim(),
        transactionAmount: body.transactionAmount ?? "",
        phoneNumber:       body.phoneNumber,
      }),
      redirect: "follow",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      return Response.json(
        { success: false, message: data.error ?? "Apps Script returned an error" },
        { status: 502 }
      );
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error("[waitlist] fetch threw:", error);
    return Response.json(
      { success: false, message: String(error) },
      { status: 500 }
    );
  }
}