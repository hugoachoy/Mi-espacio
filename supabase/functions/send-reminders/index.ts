import { createClient } from "npm:@supabase/supabase-js@2";
import * as webpush from "jsr:@negrel/webpush@0.5.0";

const TZ = "America/Argentina/Buenos_Aires";
const encoder = new TextEncoder();

function decodeBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}
function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function vapidJwk(privateRaw: Uint8Array, publicRaw: Uint8Array) {
  if (privateRaw.length !== 32 || publicRaw.length !== 65 || publicRaw[0] !== 4) {
    throw new Error("Las claves VAPID no tienen el formato P-256 esperado.");
  }
  const x = encodeBase64Url(publicRaw.slice(1, 33));
  const y = encodeBase64Url(publicRaw.slice(33, 65));
  const d = encodeBase64Url(privateRaw);
  return {
    privateKey: { kty: "EC", crv: "P-256", x, y, d, ext: true, key_ops: ["sign"] },
    publicKey: { kty: "EC", crv: "P-256", x, y, ext: true, key_ops: ["verify"] },
  };
}
function localDateTimeToUtc(date: string, time: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || "");
  const tm = /^(\d{2}):(\d{2})/.exec(time || "");
  if (!match || !tm) return null;
  const [, ys, ms, ds] = match;
  const [, hs, mins] = tm;
  const target = Date.UTC(Number(ys), Number(ms) - 1, Number(ds), Number(hs), Number(mins));
  let guess = target;
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(fmt.formatToParts(new Date(guess)).map((p) => [p.type, p.value]));
    const represented = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
    guess += target - represented;
  }
  const result = new Date(guess);
  return Number.isNaN(result.getTime()) ? null : result;
}
function parseAdvance(value: unknown): number[] | null {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return [0];
  const regex = /(\d+)\s*(minutos?|mins?|m|horas?|hs?|h|d[ií]as?|d|semanas?|sem)\b/gi;
  const offsets: number[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    const factor = /^(m|min)/.test(unit) ? 60_000
      : /^(h|hs)/.test(unit) ? 3_600_000
      : /^(sem)/.test(unit) ? 7 * 86_400_000 : 86_400_000;
    if (amount > 0 && amount <= 365) offsets.push(amount * factor);
  }
  if (offsets.length === 0) return null;
  return [...new Set(offsets)];
}
async function hash(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return Response.json({ error: "Método no permitido" }, { status: 405 });
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const auth = req.headers.get("authorization") ?? "";
  if (!serviceKey || auth !== `Bearer ${serviceKey}`) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const publicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const privateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    if (!url || !publicKey || !privateKey) throw new Error("Faltan secretos de Supabase o claves VAPID.");

    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dry_run === true;
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const rawPublic = decodeBase64Url(publicKey);
    const rawPrivate = decodeBase64Url(privateKey);
    const keys = await webpush.importVapidKeys(vapidJwk(rawPrivate, rawPublic));
    const appServer = await webpush.ApplicationServer.new({
      contactInformation: "mailto:admin@mi-espacio.app",
      vapidKeys: keys,
    });

    const [{ data: rows, error: rowsError }, { data: subscriptions, error: subsError }] = await Promise.all([
      admin.from("mi_espacio").select("user_id,datos"),
      admin.from("mi_espacio_push_subscriptions").select("id,user_id,endpoint,subscription"),
    ]);
    if (rowsError) throw rowsError;
    if (subsError) throw subsError;

    const subsByUser = new Map<string, any[]>();
    for (const sub of subscriptions ?? []) {
      const list = subsByUser.get(sub.user_id) ?? [];
      list.push(sub);
      subsByUser.set(sub.user_id, list);
    }

    const now = Date.now();
    const windowMs = 2 * 60_000;
    let examined = 0, due = 0, sent = 0, skipped = 0, failed = 0;
    const preview: Array<{ title: string; scheduled_at: string; user_id: string }> = [];

    for (const row of rows ?? []) {
      const reminders = Array.isArray(row.datos?.reminders) ? row.datos.reminders : [];
      for (const reminder of reminders) {
        examined++;
        if (!reminder || reminder.done === true) continue;
        const eventAt = localDateTimeToUtc(String(reminder.date ?? ""), String(reminder.time ?? ""));
        if (!eventAt) { skipped++; continue; }
        const offsets = parseAdvance(reminder.advance);
        if (!offsets) { skipped++; continue; }
        const base = JSON.stringify({
          title: String(reminder.title ?? ""),
          date: String(reminder.date ?? ""),
          time: String(reminder.time ?? ""),
          advance: String(reminder.advance ?? ""),
          note: String(reminder.note ?? ""),
        });
        const fingerprint = await hash(base);
        for (const offset of offsets) {
          const sendAt = eventAt.getTime() - offset;
          if (sendAt > now || now - sendAt > windowMs) continue;
          due++;
          preview.push({
            title: String(reminder.title ?? "Recordatorio"),
            scheduled_at: new Date(sendAt).toISOString(),
            user_id: row.user_id,
          });
          if (dryRun) continue;

          const reminderId = `${fingerprint}:${offset}`;
          const occurrenceAt = eventAt.toISOString();
          const { data: inserted, error: logError } = await admin
            .from("mi_espacio_push_log")
            .upsert(
              { user_id: row.user_id, reminder_id: reminderId, occurrence_at: occurrenceAt },
              { onConflict: "user_id,reminder_id,occurrence_at", ignoreDuplicates: true },
            )
            .select("id");
          if (logError) throw logError;
          if (!inserted?.length) continue;

          const userSubs = subsByUser.get(row.user_id) ?? [];
          if (userSubs.length === 0) {
            await admin.from("mi_espacio_push_log").delete()
              .eq("user_id", row.user_id).eq("reminder_id", reminderId).eq("occurrence_at", occurrenceAt);
            continue;
          }

          const payload = JSON.stringify({
            title: "MI ESPACIO · Recordatorio",
            body: String(reminder.title ?? "Tenés un recordatorio pendiente"),
            url: "/Mi-espacio/",
            tag: `mi-espacio-${fingerprint.slice(0, 20)}-${offset}`,
          });
          let delivered = 0;
          for (const subRow of userSubs) {
            try {
              const subscriber = appServer.subscribe(subRow.subscription);
              await subscriber.pushTextMessage(payload, { urgency: webpush.Urgency.High, ttl: 3600 });
              delivered++;
            } catch (err) {
              failed++;
              if (err instanceof webpush.PushMessageError && err.isGone()) {
                await admin.from("mi_espacio_push_subscriptions").delete().eq("id", subRow.id);
              }
            }
          }
          if (delivered > 0) sent += delivered;
          else {
            await admin.from("mi_espacio_push_log").delete()
              .eq("user_id", row.user_id).eq("reminder_id", reminderId).eq("occurrence_at", occurrenceAt);
          }
        }
      }
    }

    return Response.json({
      ok: true, dry_run: dryRun, timezone: TZ, examined, due,
      sent_to_devices: sent, failed_deliveries: failed, skipped,
      preview: dryRun ? preview.slice(0, 50) : undefined,
    });
  } catch (error) {
    console.error("send-reminders error:", error);
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
});
