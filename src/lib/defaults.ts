import type {
  AboutConfig,
  AnimConfig,
  Coupon,
  HeroConfig,
  MenuItem,
  RestaurantSettings,
  Section,
  SectionType,
  SiteConfig,
  ThemeConfig,
  Testimonial,
} from "./types";
import { uid } from "./types";

export const THEME_PRESETS: { name: string; t: Partial<ThemeConfig> }[] = [
  { name: "Noir & Gold", t: { accent: "#C9A24B", bg: "#0B0A08", surface: "#14110C", text: "#F3ECDD", muted: "#968B78" } },
  { name: "Ivory & Charcoal", t: { accent: "#9A7B2D", bg: "#F4EFE4", surface: "#E9E2D2", text: "#1C1710", muted: "#6E6455" } },
  { name: "Crimson Velvet", t: { accent: "#C14953", bg: "#100A0B", surface: "#1A1113", text: "#F4E9E7", muted: "#93787A" } },
  { name: "Emerald Salon", t: { accent: "#5FAF82", bg: "#0A110D", surface: "#121B15", text: "#ECF2EA", muted: "#7E8E80" } },
  { name: "Royal Violet", t: { accent: "#9D7BEA", bg: "#0D0A14", surface: "#161022", text: "#F0EAF6", muted: "#8B8098" } },
  { name: "Copper & Cream", t: { accent: "#B4652A", bg: "#F2EADD", surface: "#E8DECC", text: "#251A10", muted: "#7A6A55" } },
];

export const DISPLAY_FONTS = [
  "Playfair Display",
  "Cormorant Garamond",
  "Marcellus",
  "Cinzel",
  "Bodoni Moda",
  "DM Serif Display",
  "Italiana",
];

export const BODY_FONTS = ["Jost", "Manrope", "Lato", "Nunito Sans", "Montserrat", "Spectral"];

/* ---------- factory helpers ---------- */

export const defaultHero = (): HeroConfig => ({
  mode: "video",
  videoUrl: "https://videos.pexels.com/video-files/8902153/8902153-hd_1920_1080_25fps.mp4",
  posterUrl:
    "https://images.pexels.com/photos/8112966/pexels-photo-8112966.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  imageUrl:
    "https://images.pexels.com/photos/8112966/pexels-photo-8112966.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  overlay: 62,
  kicker: "Est. 2016 — A Fine Dining Atelier",
  titleA: "Where every plate",
  titleB: "becomes a story",
  sub: "An eight-course cinematic journey through fire, smoke and gold — served in the heart of Gulshan, Dhaka.",
  cta: "Reserve a Table",
  ctaHref: "#reserve",
  cta2: "View Menu",
  cta2Href: "#menu",
});

export const sectionFactory: Record<SectionType, () => Section> = {
  hero: () => ({ id: uid(), type: "hero", enabled: true, title: "Hero", data: defaultHero() }),
  about: () => ({
    id: uid(),
    type: "about",
    enabled: true,
    title: "Our Story",
    data: {
      kicker: "Our Story",
      title: "A theatre of taste",
      text: "Lumière began as a single candle-lit table and a stubborn idea: that dinner in Dhaka should feel like a film. A decade later, our kitchen still stages every service in acts — smoke, ember, glaze, gold — and the room dims exactly when the first course arrives.",
      image:
        "https://images.pexels.com/photos/28059306/pexels-photo-28059306.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
      image2:
        "https://images.pexels.com/photos/8856562/pexels-photo-8856562.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
      badge: "Est.",
      stats: [
        { id: uid(), value: "12", label: "Years of craft" },
        { id: uid(), value: "08", label: "Courses each evening" },
        { id: uid(), value: "40+", label: "Single-origin wines" },
      ],
    } as AboutConfig,
  }),
  menu: () => ({
    id: uid(),
    type: "menu",
    enabled: true,
    title: "The Menu",
    data: {
      kicker: "The Menu",
      title: "Composed in seven acts",
      ordering: false,
      note: "",
    },
  }),
  offers: () => ({
    id: uid(),
    type: "offers",
    enabled: true,
    title: "Offers",
    data: {
      kicker: "Private Offers",
      title: "Coupons & privileges",
      sub: "Present any active code at the host stand — or enter it when you reserve a table.",
      ctaLabel: "Reserve & apply a code",
      ctaHref: "#reserve",
      emptyText: "No active offers right now — check back soon.",
    },
  }),
  chef: () => ({
    id: uid(),
    type: "chef",
    enabled: true,
    title: "The Chef",
    data: {
      kicker: "The Hands Behind the Flame",
      title: "Meet the chef",
      name: "Chef Rina Karim",
      role: "Executive Chef & Founder",
      text: "Trained in Copenhagen and Tokyo, Rina builds menus the way a director writes a screenplay — every plate a scene, every season a new film. She still torches, glazes and plates the signature course herself, every single service.",
      image:
        "https://images.pexels.com/photos/24186393/pexels-photo-24186393.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    },
  }),
  break: () => ({
    id: uid(),
    type: "break",
    enabled: true,
    title: "Cinematic Break",
    data: {
      kicker: "A pause in the film",
      line: "We don't serve meals — we edit evenings.",
      image:
        "https://images.pexels.com/photos/8856502/pexels-photo-8856502.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    },
  }),
  gallery: () => ({
    id: uid(),
    type: "gallery",
    enabled: true,
    title: "Gallery",
    data: {
      kicker: "Inside Lumière",
      title: "Moments in low light",
      items: [
        { id: uid(), url: "https://images.pexels.com/photos/8856555/pexels-photo-8856555.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", caption: "The long table" },
        { id: uid(), url: "https://images.pexels.com/photos/12181763/pexels-photo-12181763.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", caption: "Poured & paired" },
        { id: uid(), url: "https://images.pexels.com/photos/24289213/pexels-photo-24289213.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", caption: "Ocean foam, act II" },
        { id: uid(), url: "https://images.pexels.com/photos/8245686/pexels-photo-8245686.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", caption: "Before the candles" },
        { id: uid(), url: "https://images.pexels.com/photos/8856502/pexels-photo-8856502.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", caption: "Candlelight hour" },
        { id: uid(), url: "https://images.pexels.com/photos/24246212/pexels-photo-24246212.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", caption: "Torched quail" },
      ],
    },
  }),
  testimonials: () => ({
    id: uid(),
    type: "testimonials",
    enabled: true,
    title: "Guest Words",
    data: {
      kicker: "Guest Words",
      title: "After the last course",
      items: [
        { id: uid(), name: "Nusrat Jahan", role: "Food Critic, The Daily Dish", text: "Lumière doesn't serve dinner, it edits it. The room, the pacing, the fire — I have watched the same meal twice and it still played like a premiere." },
        { id: uid(), name: "Daniel Okafor", role: "Private Member since 2019", text: "The torched quail alone is worth the reservation. It is the closest thing to cinema I have eaten in Asia." },
        { id: uid(), name: "Meher & Ayaan", role: "Anniversary Dinner", text: "They dimmed the lights, brought the dessert under a glass dome and asked if we wanted to hold hands. We cried into the gold cream. Ten out of ten." },
      ] as Testimonial[],
    },
  }),
  reservation: () => ({
    id: uid(),
    type: "reservation",
    enabled: true,
    title: "Reservation",
    data: {
      kicker: "Reservations",
      title: "Claim your evening",
      sub: "Tables are released 21 days ahead. For occasions, tell us — the room adapts.",
      image:
        "https://images.pexels.com/photos/8856555/pexels-photo-8856555.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
      note: "Parties above 8 guests — call us directly and we will open the long table.",
      caption: "The room, before the candles",
      submitLabel: "Confirm reservation",
      successTitle: "Table reserved",
      required: { name: true, phone: true, email: false, date: true, time: true, guests: true, coupon: false, requests: false },
    },
  }),
  location: () => ({
    id: uid(),
    type: "location",
    enabled: true,
    title: "Find Us",
    data: {
      kicker: "Find Us",
      title: "Gulshan 2, Dhaka",
      // empty = use the address / phone / map link from Restaurant Settings
      address: "",
      phone: "",
      mapsUrl: "",
      hoursTitle: "Hours of service",
      mapsLabel: "Open in Google Maps",
    },
  }),
  custom: () => ({
    id: uid(),
    type: "custom",
    enabled: true,
    title: "Custom Section",
    data: {
      kicker: "New Section",
      title: "A line worth keeping",
      text: "Write anything — a chef's note, a private dining pitch, a wine week announcement. Add an image or link it where you like.",
      image:
        "https://images.pexels.com/photos/8856502/pexels-photo-8856502.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
      cta: "Learn more",
      ctaUrl: "#reserve",
      flip: false,
    },
  }),
};

/* ---------- full default database ---------- */

export const defaultMenu = (): MenuItem[] => {
  const img = (id: number) =>
    `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200`;
  const rows: [string, string, string, string, number, MenuItem["tag"]][] = [
    ["Charred Citrus Tartare", "Yellowfin, smoked yolk, ember oil, black citrus pearls", "1,450", "Starters", 24186303, "chef"],
    ["Golden Egg & Herb Velouté", "Slow egg, saffron velouté, charred leek, chive ash", "1,200", "Starters", 24186308, "veg"],
    ["Ocean Foam & Sea Greens", "Dive-bomb scallop, sea foam, microgreens, green apple ice", "1,850", "Starters", 24289213, "new"],
    ["Wagyu, Ink & Salt", "A5 short rib in squid ink, bone-marrow glaze, smoked salt crust", "3,900", "Mains", 8112966, "chef"],
    ["Steak & Mushroom Cream", "Dry-aged sirloin, cep cream, charred allium, black garlic", "3,400", "Mains", 1639559, "none"],
    ["Torched Quail", "Wood-fire quail, burnt honey, juniper, charred lemon", "2,200", "Mains", 24246212, "spicy"],
    ["Garden Grilled Salmon", "Line-caught salmon, cherry tomato, basil, cold smoke", "2,600", "Mains", 29168406, "veg"],
    ["Ember-Roasted Poulard", "Whole poulard, roast bones jus, wild rice, foraged greens", "2,950", "Mains", 24186393, "none"],
    ["Salted Caramel Ember", "Burnt cream, gold leaf, smoked caramel soil, vanilla ice", "950", "Desserts", 27612513, "chef"],
    ["Gilded Berry & Garden Cream", "Seasonal berries, garden cream, rye crumb, honey gold", "850", "Desserts", 24186308, "veg"],
    ["The Gold Reserve Flight", "Three single-origin pours chosen by the cellar", "1,600", "Drinks", 8856555, "none"],
    ["Smoked Negroni", "Barrel negroni, applewood smoke, orange char", "900", "Drinks", 12181763, "new"],
  ];
  return rows.map(([name, desc, price, category, im, tag]) => ({
    id: uid(),
    name,
    desc,
    price,
    category,
    image: img(im),
    tag,
    enabled: true,
  }));
};

export const defaultCoupons = (): Coupon[] => [
  { id: uid(), code: "CINE20", type: "percent", value: 20, minSpend: 2000, desc: "Cinematic launch — 20% off all tasting menus", active: true, expires: "2026-12-31" },
  { id: uid(), code: "GOLD500", type: "flat", value: 500, minSpend: 1500, desc: "First-visit privilege, ₹500 off your bill", active: true, expires: "" },
  { id: uid(), code: "ANNIV15", type: "percent", value: 15, minSpend: 0, desc: "Anniversary & engagement dinner treat", active: true, expires: "2027-06-30" },
  { id: uid(), code: "WINE10", type: "percent", value: 10, minSpend: 3000, desc: "Cellar week — 10% off wine flights", active: false, expires: "" },
];

const theme: ThemeConfig = {
  preset: "Noir & Gold",
  accent: "#C9A24B",
  bg: "#0B0A08",
  surface: "#14110C",
  text: "#F3ECDD",
  muted: "#968B78",
  fontDisplay: "Playfair Display",
  fontBody: "Jost",
  radius: 2,
  cartFontSize: 15,
};

const animations: AnimConfig = {
  preloader: "cinematic",
  reveal: "fade-up",
  hero: "kenburns",
  text: "mask",
  hover: "lift",
  cursor: "ring",
  marquee: true,
  marqueeSpeed: 30,
  parallax: true,
  duration: 0.9,
};

export const marqueeItems = [
  "Fire",
  "Smoke",
  "Glaze",
  "Gold",
  "Candlelight",
  "Eight Courses",
  "Reservations Open",
  "Gulshan 2 — Dhaka",
];

export const defaultSettings = (): RestaurantSettings => ({
  seo: { title: "", description: "Explore the menu, offers and reserve your table.", favicon: "", ogImage: "" },
  contact: {
    phone: "+880 1712 345 678",
    whatsapp: "",
    email: "reserve@lumiere.dhaka",
    address: "House 14, Road 117, Gulshan 2, Dhaka 1212",
    mapsUrl: "https://maps.google.com/?q=Gulshan+2+Dhaka",
    mapEmbed: "",
  },
  hours: [
    { id: uid(), d: "Thursday — Sunday", t: "18:00 — 23:30" },
    { id: uid(), d: "Monday — Wednesday", t: "19:00 — 23:00" },
    { id: uid(), d: "Kitchen closes", t: "23:00" },
  ],
  socials: [
    { id: uid(), label: "Instagram", url: "https://instagram.com", icon: "instagram" },
    { id: uid(), label: "Facebook", url: "https://facebook.com", icon: "facebook" },
    { id: uid(), label: "YouTube", url: "https://youtube.com", icon: "youtube" },
  ],
  booking: {
    enabled: true,
    timeSlots: ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30"],
    maxGuests: 8,
    leadDays: 0,
    closedDays: [],
  },
  labels: {
    navigateTitle: "Navigate",
    hoursTitle: "Hours",
    contactTitle: "Contact",
    footerTagline: "Fire · Smoke · Glaze · Gold",
    scrollCue: "Scroll",
    preloaderText: "preparing the table",
    showAdminLink: true,
    marquee: [...marqueeItems],
    addLabel: "+ Add",
    addToCartLabel: "+ Add to cart",
    boardButton: "Board",
    boardTitle: "The Tasting Board",
    boardEmptyTitle: "The board is bare",
    boardBrowse: "Browse the menu",
    boardEmptyText: "Choose a few plates from the menu — your board keeps them, scene by scene.",
    boardNote: "Your board stays with your table. Present any coupon code to the house — no checkout needed.",
  },
  announcement: { enabled: false, text: "", linkLabel: "", linkUrl: "", dismissible: true },
  floating: { whatsapp: false, call: false },
});

export const defaultConfig = (): SiteConfig => {
  const menu = sectionFactory.menu();
  const offers = sectionFactory.offers();
  const reservation = sectionFactory.reservation();
  return {
    siteName: "LUMIÈRE",
    tagline: "Cinematic Fine Dining · Dhaka",
    settings: defaultSettings(),
    theme,
    animations,
    currency: { symbol: "₹", position: "before", locale: "en-IN" },
    header: {
      logoText: "LUMIÈRE",
      logoSub: "Fine Dining · Dhaka",
      logoImage: "",
      links: [
        { id: uid(), label: "Menu", href: "#menu" },
        { id: uid(), label: "Our Story", href: "#about" },
        { id: uid(), label: "Gallery", href: "#gallery" },
        { id: uid(), label: "Offers", href: "#offers" },
        { id: uid(), label: "Visit", href: "#location" },
      ],
      bookLabel: "Book a Table",
      sticky: true,
    },
    footer: {
      about:
        "A candle-lit, eight-course fine dining atelier in Dhaka. Every service is staged like a film — smoke, ember, glaze, gold.",
      links: [
        { id: uid(), label: "The Menu", href: "#menu" },
        { id: uid(), label: "Reservations", href: "#reserve" },
        { id: uid(), label: "Private Dining", href: "#about" },
        { id: uid(), label: "Gift Cards", href: "#offers" },
      ],
      copyright: "© 2026 Lumière. All rights reserved.",
    },
    sections: [
      sectionFactory.hero(),
      sectionFactory.about(),
      menu,
      offers,
      sectionFactory.chef(),
      sectionFactory.break(),
      sectionFactory.gallery(),
      sectionFactory.testimonials(),
      reservation,
      sectionFactory.location(),
    ],
  };
};
