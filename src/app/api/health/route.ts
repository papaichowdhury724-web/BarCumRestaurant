export const dynamic = "force-dynamic";

// This project runs on Firebase. The Postgres check is optional and loaded lazily,
// so a missing DATABASE_URL can never break `next build` or the website.
export async function GET() {
  try {
    if (!process.env.DATABASE_URL) return Response.json({ ok: true, db: "not configured" });
    const [{ db }, { sql }] = await Promise.all([import("@/db"), import("drizzle-orm")]);
    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
