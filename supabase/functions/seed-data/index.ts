// Seed script: creates 20 organizers + 20 sponsors + 100 events + conversations
// Also creates pruebasponsor@gmail.com and pruebaorganizador@gmail.com test accounts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Curated real-looking avatar URLs (randomuser.me + unsplash faces)
const maleAvatars = Array.from({ length: 25 }, (_, i) => `https://randomuser.me/api/portraits/men/${i + 10}.jpg`);
const femaleAvatars = Array.from({ length: 25 }, (_, i) => `https://randomuser.me/api/portraits/women/${i + 10}.jpg`);
const allAvatars = [...maleAvatars, ...femaleAvatars];

const orgNames = [
  "Laura Martínez", "Carlos Ruiz", "Ana García", "David Fernández", "Sofía López",
  "Javier Torres", "María Sánchez", "Pablo Jiménez", "Elena Moreno", "Diego Álvarez",
  "Carmen Romero", "Alejandro Navarro", "Isabel Molina", "Roberto Delgado", "Patricia Ortiz",
  "Fernando Castro", "Lucía Herrera", "Miguel Ramos", "Cristina Vega", "Andrés Iglesias"
];

const sponsorNames = [
  "TechCorp Iberia", "InnovaMedia", "BrandUp Agency", "Global Drinks Co",
  "NexGen Mobility", "PureFit Nutrition", "EcoWave Energy", "FinTrust Bank",
  "UrbanStyle Retail", "SkyNet Telecom", "GreenLeaf Organics", "Motorola Events",
  "Visa Partners", "Heineken Experiencia", "Red Bull Lab", "Movistar Studios",
  "Santander Activa", "Mahou Cinco Estrellas", "Estrella Galicia", "Coca-Cola Journey"
];

const sectors = ["Música", "Tecnología", "Deportes", "Gastronomía", "Cultura", "Moda", "Startups", "Educación"];
const eventTypes = ["Festival", "Conferencia", "Concierto", "Feria", "Hackathon", "Workshop", "Exposición", "Torneo"];
const audiences = ["Jóvenes 18-25", "Profesionales 25-40", "Familias", "Estudiantes", "Emprendedores", "Público general"];
const cities = [
  { name: "Madrid", lat: 40.4168, lng: -3.7038 },
  { name: "Barcelona", lat: 41.3851, lng: 2.1734 },
  { name: "Valencia", lat: 39.4699, lng: -0.3763 },
  { name: "Sevilla", lat: 37.3891, lng: -5.9845 },
  { name: "Bilbao", lat: 43.2630, lng: -2.9350 },
  { name: "Málaga", lat: 36.7213, lng: -4.4214 },
  { name: "Zaragoza", lat: 41.6488, lng: -0.8891 },
];

const eventTitles = [
  "Summer Music Fest", "TechSummit", "Startup Weekend", "Urban Food Fair", "Moda en Vivo",
  "Maratón Solidario", "Gaming Arena", "Wine & Jazz", "Innovation Expo", "EcoFuture",
  "Beach Party", "Coding Bootcamp", "Art Biennale", "Craft Beer Fest", "Women in Tech",
  "Cinema Under Stars", "Pop-up Market", "FinTech Forum", "Health Expo", "Digital Nomads Meetup"
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickMany<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

async function createUser(email: string, password: string) {
  // Try create; if exists, fetch
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  if (error) {
    if (error.message.includes("already") || (error as any).code === "email_exists") {
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existing = list.users.find(u => u.email === email);
      if (existing) return existing;
    }
    throw error;
  }
  return data.user;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const log: string[] = [];

    // 1) Create test accounts
    const testOrgUser = await createUser("pruebaorganizador@gmail.com", "123123");
    const testSpUser = await createUser("pruebasponsor@gmail.com", "123123");
    log.push(`Test users: ${testOrgUser?.id}, ${testSpUser?.id}`);

    // 2) Create 20 organizer users + 20 sponsor users
    const organizers: { user_id: string; profile_id: string; name: string }[] = [];
    const sponsors: { user_id: string; profile_id: string; name: string }[] = [];

    for (let i = 0; i < 20; i++) {
      const u = await createUser(`organizador${i + 1}@ejemplo.com`, "123123");
      organizers.push({ user_id: u!.id, profile_id: "", name: orgNames[i] });
    }
    for (let i = 0; i < 20; i++) {
      const u = await createUser(`sponsor${i + 1}@ejemplo.com`, "123123");
      sponsors.push({ user_id: u!.id, profile_id: "", name: sponsorNames[i] });
    }

    // 3) Upsert profiles
    const allAvatarsShuffled = [...allAvatars].sort(() => Math.random() - 0.5);
    let avIdx = 0;

    // Test org profile
    await admin.from("profiles").upsert({
      user_id: testOrgUser!.id,
      role: "organizer",
      name: "Prueba Organizador",
      avatar_url: allAvatarsShuffled[avIdx++],
      description: "Cuenta de prueba para organizadores. Gestiono eventos de varios sectores.",
      event_types: ["Festival", "Conferencia", "Workshop"],
      total_events: 8,
      social_links: ["https://instagram.com/pruebaorg"],
      verified: true,
      rating: 4.7,
    }, { onConflict: "user_id" });

    // Test sponsor profile
    await admin.from("profiles").upsert({
      user_id: testSpUser!.id,
      role: "sponsor",
      name: "Prueba Sponsor",
      avatar_url: allAvatarsShuffled[avIdx++],
      description: "Cuenta de prueba de sponsor. Buscamos patrocinar eventos de tecnología y música.",
      industry: "Tecnología",
      tags: ["innovación", "B2B", "digital"],
      budget_min: 5000,
      budget_max: 50000,
      preferred_activations: ["Branding", "Stand", "Charlas"],
      preferred_sectors: ["Tecnología", "Startups", "Música"],
      preferred_audiences: ["Profesionales 25-40", "Emprendedores"],
      preferred_event_types: ["Conferencia", "Hackathon", "Festival"],
      verified: true,
      rating: 4.8,
    }, { onConflict: "user_id" });

    for (const o of organizers) {
      await admin.from("profiles").upsert({
        user_id: o.user_id,
        role: "organizer",
        name: o.name,
        avatar_url: allAvatarsShuffled[avIdx++ % allAvatarsShuffled.length],
        description: `Organizador especializado en ${pick(sectors).toLowerCase()} con experiencia en eventos de gran escala.`,
        event_types: pickMany(eventTypes, 3),
        total_events: 2 + Math.floor(Math.random() * 20),
        social_links: [`https://instagram.com/${o.name.split(" ")[0].toLowerCase()}`],
        verified: Math.random() > 0.5,
        rating: 3.5 + Math.random() * 1.5,
      }, { onConflict: "user_id" });
    }

    for (const s of sponsors) {
      await admin.from("profiles").upsert({
        user_id: s.user_id,
        role: "sponsor",
        name: s.name,
        avatar_url: allAvatarsShuffled[avIdx++ % allAvatarsShuffled.length],
        description: `${s.name} apuesta por experiencias memorables y patrocinios con impacto real.`,
        industry: pick(sectors),
        tags: pickMany(["premium", "lifestyle", "B2B", "B2C", "digital", "retail", "innovación"], 3),
        budget_min: 1000 * (5 + Math.floor(Math.random() * 20)),
        budget_max: 1000 * (30 + Math.floor(Math.random() * 80)),
        preferred_activations: pickMany(["Branding", "Sampling", "Stand", "Charlas", "Contenido digital"], 3),
        preferred_sectors: pickMany(sectors, 3),
        preferred_audiences: pickMany(audiences, 2),
        preferred_event_types: pickMany(eventTypes, 3),
        verified: Math.random() > 0.4,
        rating: 3.5 + Math.random() * 1.5,
      }, { onConflict: "user_id" });
    }

    // Fetch profile ids
    const allUserIds = [
      testOrgUser!.id, testSpUser!.id,
      ...organizers.map(o => o.user_id),
      ...sponsors.map(s => s.user_id),
    ];
    const { data: profilesRows } = await admin.from("profiles").select("id, user_id, role").in("user_id", allUserIds);
    const profileByUserId = new Map(profilesRows!.map(p => [p.user_id, p]));

    const testOrgProfile = profileByUserId.get(testOrgUser!.id)!;
    const testSpProfile = profileByUserId.get(testSpUser!.id)!;
    organizers.forEach(o => { o.profile_id = profileByUserId.get(o.user_id)!.id; });
    sponsors.forEach(s => { s.profile_id = profileByUserId.get(s.user_id)!.id; });

    // 4) Create 100 events. Test organizer gets 6, rest distributed among 20 organizers
    const allOrganizerProfiles = [
      { profile_id: testOrgProfile.id, count: 6 },
      ...organizers.map(o => ({ profile_id: o.profile_id, count: 0 })),
    ];
    // Distribute remaining 94 events among 20 organizers
    for (let i = 0; i < 94; i++) {
      allOrganizerProfiles[1 + (i % 20)].count++;
    }

    const events: any[] = [];
    for (const org of allOrganizerProfiles) {
      for (let k = 0; k < org.count; k++) {
        const city = pick(cities);
        const spMin = 1000 * (2 + Math.floor(Math.random() * 10));
        const spMax = spMin + 1000 * (5 + Math.floor(Math.random() * 40));
        const dateOffset = Math.floor(Math.random() * 180) - 30; // -30..150 days
        const d = new Date(); d.setDate(d.getDate() + dateOffset);
        events.push({
          organizer_id: org.profile_id,
          title: `${pick(eventTitles)} ${2026} #${Math.floor(Math.random() * 999)}`,
          description: `Un evento único de ${pick(sectors).toLowerCase()} en ${city.name}. Experiencias, networking y marcas que conectan.`,
          type: pick(eventTypes),
          date: d.toISOString(),
          location: city.name,
          latitude: city.lat + (Math.random() - 0.5) * 0.1,
          longitude: city.lng + (Math.random() - 0.5) * 0.1,
          audience: pick(audiences),
          capacity: 100 * (1 + Math.floor(Math.random() * 50)),
          sector: pick(sectors),
          sponsorship_min: spMin,
          sponsorship_max: spMax,
          published: true,
          media: [],
        });
      }
    }
    const { data: insertedEvents, error: evErr } = await admin.from("events").insert(events).select("id, organizer_id");
    if (evErr) throw evErr;
    log.push(`Events created: ${insertedEvents!.length}`);

    // 5) Conversations
    // Helper to pick an event organized by a specific organizer
    const eventsByOrg = new Map<string, string[]>();
    insertedEvents!.forEach(e => {
      if (!eventsByOrg.has(e.organizer_id)) eventsByOrg.set(e.organizer_id, []);
      eventsByOrg.get(e.organizer_id)!.push(e.id);
    });

    const convsToInsert: any[] = [];

    // 30 random conversations among non-test users
    for (let i = 0; i < 30; i++) {
      const org = pick(organizers);
      const sp = pick(sponsors);
      const evIds = eventsByOrg.get(org.profile_id);
      if (!evIds || evIds.length === 0) continue;
      convsToInsert.push({
        organizer_id: org.profile_id,
        sponsor_id: sp.profile_id,
        event_id: pick(evIds),
      });
    }

    // Test organizer with 4 different sponsors (NOT test sponsor)
    const spForOrg = pickMany(sponsors, 4);
    for (const sp of spForOrg) {
      const evIds = eventsByOrg.get(testOrgProfile.id)!;
      convsToInsert.push({
        organizer_id: testOrgProfile.id,
        sponsor_id: sp.profile_id,
        event_id: pick(evIds),
      });
    }

    // Test sponsor with 4 different organizers (NOT test organizer)
    const orgsForSp = pickMany(organizers, 4);
    for (const org of orgsForSp) {
      const evIds = eventsByOrg.get(org.profile_id);
      if (!evIds || evIds.length === 0) continue;
      convsToInsert.push({
        organizer_id: org.profile_id,
        sponsor_id: testSpProfile.id,
        event_id: pick(evIds),
      });
    }

    const { data: insertedConvs, error: cErr } = await admin.from("conversations").insert(convsToInsert).select("id, organizer_id, sponsor_id");
    if (cErr) throw cErr;
    log.push(`Conversations: ${insertedConvs!.length}`);

    // 6) Messages: each conversation gets 3-8 messages. Mark some "finalizadas" as all seen + closure msg.
    const messages: any[] = [];
    const sampleMsgs = [
      "Hola, vi tu evento y me interesa patrocinar.",
      "¡Genial! ¿Qué tipo de activación te interesa?",
      "Buscamos branding en escenario y sampling.",
      "Perfecto, tenemos varios paquetes disponibles.",
      "¿Podrías enviarme el mediakit?",
      "Claro, te paso toda la información por aquí.",
      "Nos encaja el paquete premium.",
      "Excelente, preparo el contrato.",
      "Muchas gracias, hablamos pronto.",
      "Cerramos entonces, ¡nos vemos en el evento!",
    ];

    for (let idx = 0; idx < insertedConvs!.length; idx++) {
      const c = insertedConvs![idx];
      const finalizada = idx % 3 === 0; // ~1/3 finalizadas
      const count = finalizada ? 8 : 3 + Math.floor(Math.random() * 4);
      const baseDate = new Date(); baseDate.setDate(baseDate.getDate() - (finalizada ? 30 + idx : idx));
      for (let m = 0; m < count; m++) {
        const senderIsOrg = m % 2 === 0;
        const sender_id = senderIsOrg ? c.organizer_id : c.sponsor_id;
        const msgDate = new Date(baseDate.getTime() + m * 3600_000);
        messages.push({
          conversation_id: c.id,
          sender_id,
          content: sampleMsgs[Math.min(m, sampleMsgs.length - 1)],
          seen: finalizada ? true : m < count - 1,
          created_at: msgDate.toISOString(),
        });
      }
    }

    // Insert messages in batches of 500
    for (let i = 0; i < messages.length; i += 500) {
      const batch = messages.slice(i, i + 500);
      const { error: mErr } = await admin.from("messages").insert(batch);
      if (mErr) throw mErr;
    }
    log.push(`Messages: ${messages.length}`);

    return new Response(JSON.stringify({ ok: true, log }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message, stack: (e as Error).stack }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
