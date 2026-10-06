/**
 * VIATOR mock data.
 * Data seeds for mock-only screens; integrated flows use the backend REST API.
 * Shapes here intentionally mirror the expected API payloads.
 */

export type Place = {
  id: string;
  name: string;
  category: string;
  city: string;
  country: string;
  address?: string;
  image: string;
  gallery: string[];
  rating: number;
  reviewCount: number;
  distanceKm: number;
  etaMin: number;
  priceLevel: 1 | 2 | 3 | 4;
  hiddenGem: boolean;
  verified: boolean;
  tags: string[];
  coords: { lng: number; lat: number };
  summary: string;
  history: string;
  hours: string;
  bestTime: string;
  scores: { experience: number; community: number; scenic: number };
};

export type Post = {
  id: string;
  author: { name: string; handle: string; avatar: string; verified: boolean };
  image: string;
  caption: string;
  location: string;
  tag: "hidden-gem" | "road-alert" | "story" | "photo";
  likes: number;
  comments: number;
  postedAt: string;
};

export type Business = {
  id: string;
  name: string;
  category: string;
  image: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  offer?: string;
  openNow: boolean;
};

export type Review = {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  body: string;
  helpful: number;
};

const img = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

export const PLACES: Place[] = [
  {
    id: "kyoto-arashiyama",
    name: "Arashiyama Bamboo Grove",
    category: "Nature",
    city: "Kyoto",
    country: "Japan",
    image: img("photo-1503899036084-c55cdd92da26"),
    gallery: [
      img("photo-1503899036084-c55cdd92da26", 1400),
      img("photo-1528360983277-13d401cdc186", 1400),
      img("photo-1493976040374-85c8e12f0c0e", 1400),
      img("photo-1545569341-9eb8b30979d9", 1400),
    ],
    rating: 4.8,
    reviewCount: 12480,
    distanceKm: 8.4,
    etaMin: 22,
    priceLevel: 1,
    hiddenGem: false,
    verified: true,
    tags: ["Scenic", "Walkable", "Sunrise"],
    coords: { lng: 135.6672, lat: 35.0094 },
    summary:
      "A cathedral of green stalks that hum in the wind. Arrive before 7am to walk the main path nearly alone, then loop north to the quieter Ōkōchi Sansō gardens.",
    history:
      "The grove has been cultivated since the Heian period, when bamboo was harvested for baskets, cups and building material. The paths were formalised in the 1900s as Kyoto's western suburbs grew.",
    hours: "Open 24 hours · Best 05:30–07:30",
    bestTime: "Early morning, weekdays",
    scores: { experience: 94, community: 91, scenic: 98 },
  },
  {
    id: "lisbon-miradouro",
    name: "Miradouro da Senhora do Monte",
    category: "Viewpoint",
    city: "Lisbon",
    country: "Portugal",
    image: img("photo-1585208798174-6cedd86e019a"),
    gallery: [
      img("photo-1585208798174-6cedd86e019a", 1400),
      img("photo-1555881400-74d7acaacd8b", 1400),
      img("photo-1513735492246-483525079686", 1400),
    ],
    rating: 4.7,
    reviewCount: 5210,
    distanceKm: 2.1,
    etaMin: 11,
    priceLevel: 1,
    hiddenGem: true,
    verified: true,
    tags: ["Sunset", "Hidden Gem", "Photo Spot"],
    coords: { lng: -9.1333, lat: 38.7223 },
    summary:
      "The highest terrace in the city. Locals bring a bottle of vinho verde and wait for the light to go orange over the castle.",
    history:
      "Named for the 18th-century chapel behind it, the terrace was a lookout during the 1755 earthquake reconstruction.",
    hours: "Open 24 hours",
    bestTime: "45 minutes before sunset",
    scores: { experience: 88, community: 93, scenic: 96 },
  },
  {
    id: "oaxaca-market",
    name: "Mercado 20 de Noviembre",
    category: "Food",
    city: "Oaxaca",
    country: "Mexico",
    image: img("photo-1504674900247-0877df9cc836"),
    gallery: [
      img("photo-1504674900247-0877df9cc836", 1400),
      img("photo-1466637574441-749b8f19452f", 1400),
      img("photo-1552566626-52f8b828add9", 1400),
    ],
    rating: 4.6,
    reviewCount: 8930,
    distanceKm: 1.2,
    etaMin: 6,
    priceLevel: 2,
    hiddenGem: false,
    verified: true,
    tags: ["Street Food", "Local Favourite"],
    coords: { lng: -96.7266, lat: 17.0594 },
    summary:
      "Smoke-filled meat alley, tlayudas the size of a steering wheel, and chocolate ground to order. Go hungry, pay cash.",
    history:
      "Built in 1882 as the city's central provisions hall, it still supplies most of the historic centre's kitchens.",
    hours: "07:00 – 21:00 daily",
    bestTime: "Lunch, 13:00–15:00",
    scores: { experience: 92, community: 95, scenic: 74 },
  },
  {
    id: "dolomites-pass",
    name: "Passo Giau",
    category: "Scenic Drive",
    city: "Cortina",
    country: "Italy",
    image: img("photo-1464822759023-fed622ff2c3b"),
    gallery: [
      img("photo-1464822759023-fed622ff2c3b", 1400),
      img("photo-1506905925346-21bda4d32df4", 1400),
      img("photo-1519681393784-d120267933ba", 1400),
    ],
    rating: 4.9,
    reviewCount: 3410,
    distanceKm: 34.7,
    etaMin: 58,
    priceLevel: 1,
    hiddenGem: false,
    verified: true,
    tags: ["Scenic", "Road Trip", "Sunrise"],
    coords: { lng: 12.0546, lat: 46.4831 },
    summary:
      "Twenty-nine hairpins to a 2,236m saddle. The best pull-off is the third one after the summit, facing Ra Gusela.",
    history:
      "The pass road was completed in 1986, replacing a mule track used by Alpine regiments in the First World War.",
    hours: "Seasonal · May–October",
    bestTime: "Golden hour, clear days",
    scores: { experience: 96, community: 89, scenic: 99 },
  },
  {
    id: "cape-town-cafe",
    name: "Truth Coffee Roasting",
    category: "Cafe",
    city: "Cape Town",
    country: "South Africa",
    image: img("photo-1445116572660-236099ec97a0"),
    gallery: [
      img("photo-1445116572660-236099ec97a0", 1400),
      img("photo-1497935586351-b67a49e012bf", 1400),
    ],
    rating: 4.5,
    reviewCount: 4120,
    distanceKm: 0.8,
    etaMin: 4,
    priceLevel: 2,
    hiddenGem: false,
    verified: false,
    tags: ["Coffee", "Work Friendly"],
    coords: { lng: 18.4241, lat: -33.9249 },
    summary: "Steampunk cathedral of a roastery. Order the single-origin filter and sit upstairs.",
    history: "Opened in 2012 inside a Victorian-era warehouse on Buitenkant Street.",
    hours: "07:00 – 17:00",
    bestTime: "Weekday mornings",
    scores: { experience: 86, community: 84, scenic: 70 },
  },
  {
    id: "reykjavik-pool",
    name: "Seljavallalaug Pool",
    category: "Hidden Gem",
    city: "Southern Region",
    country: "Iceland",
    image: img("photo-1504893524553-b855bce32c67"),
    gallery: [
      img("photo-1504893524553-b855bce32c67", 1400),
      img("photo-1531168556467-80aace0d0144", 1400),
    ],
    rating: 4.4,
    reviewCount: 1870,
    distanceKm: 121.5,
    etaMin: 96,
    priceLevel: 1,
    hiddenGem: true,
    verified: false,
    tags: ["Hidden Gem", "Geothermal", "Hike"],
    coords: { lng: -19.6086, lat: 63.5658 },
    summary:
      "A 1923 geothermal pool wedged into a valley, reached by a 15-minute walk along a river. No staff, no fee, no changing rooms worth the name.",
    history: "Built to teach Icelandic children to swim; the oldest surviving pool in the country.",
    hours: "Open 24 hours · Unstaffed",
    bestTime: "Midweek, mid-morning",
    scores: { experience: 90, community: 88, scenic: 94 },
  },
];

export const TRENDING_PLACES = PLACES.slice(0, 4);
export const HIDDEN_GEMS = PLACES.filter((p) => p.hiddenGem);

export const POSTS: Post[] = [
  {
    id: "p1",
    author: {
      name: "Mira Halden",
      handle: "mirawalks",
      avatar: img("photo-1494790108377-be9c29b29330", 200),
      verified: true,
    },
    image: img("photo-1469854523086-cc02fe5d8800", 1200),
    caption:
      "Found the pool everyone told me was closed. It is not closed. Bring a towel and leave it cleaner.",
    location: "Seljavallalaug, Iceland",
    tag: "hidden-gem",
    likes: 2417,
    comments: 132,
    postedAt: "2h ago",
  },
  {
    id: "p2",
    author: {
      name: "Tomás Reis",
      handle: "treis",
      avatar: img("photo-1500648767791-00dcc994a43e", 200),
      verified: false,
    },
    image: img("photo-1502602898657-3e91760cbb34", 1200),
    caption:
      "Rockfall closed the eastern approach for at least a week. Reroute via the valley road, adds 20 min.",
    location: "Passo Giau, Italy",
    tag: "road-alert",
    likes: 891,
    comments: 74,
    postedAt: "5h ago",
  },
  {
    id: "p3",
    author: {
      name: "Aiko Tanaka",
      handle: "aikoroutes",
      avatar: img("photo-1438761681033-6461ffad8d80", 200),
      verified: true,
    },
    image: img("photo-1528360983277-13d401cdc186", 1200),
    caption:
      "Six mornings in the grove and this was the only one with fog. Worth every 4:40am alarm.",
    location: "Arashiyama, Kyoto",
    tag: "story",
    likes: 5302,
    comments: 288,
    postedAt: "1d ago",
  },
  {
    id: "p4",
    author: {
      name: "Daniel Osei",
      handle: "dosei",
      avatar: img("photo-1507003211169-0a1dd7228f2d", 200),
      verified: false,
    },
    image: img("photo-1504674900247-0877df9cc836", 1200),
    caption:
      "Third stall on the left, past the smoke. Tlayuda con tasajo. That is the whole review.",
    location: "Oaxaca, Mexico",
    tag: "photo",
    likes: 1744,
    comments: 96,
    postedAt: "2d ago",
  },
];

export const CONTRIBUTORS = [
  {
    id: "c1",
    name: "Aiko Tanaka",
    handle: "aikoroutes",
    avatar: img("photo-1438761681033-6461ffad8d80", 200),
    points: 18420,
    places: 212,
  },
  {
    id: "c2",
    name: "Mira Halden",
    handle: "mirawalks",
    avatar: img("photo-1494790108377-be9c29b29330", 200),
    points: 15980,
    places: 187,
  },
  {
    id: "c3",
    name: "Daniel Osei",
    handle: "dosei",
    avatar: img("photo-1507003211169-0a1dd7228f2d", 200),
    points: 12310,
    places: 164,
  },
  {
    id: "c4",
    name: "Tomás Reis",
    handle: "treis",
    avatar: img("photo-1500648767791-00dcc994a43e", 200),
    points: 10870,
    places: 141,
  },
  {
    id: "c5",
    name: "Sara Nowak",
    handle: "saranowak",
    avatar: img("photo-1517841905240-472988babdf9", 200),
    points: 9640,
    places: 128,
  },
];

export const BUSINESSES: Business[] = [
  {
    id: "b1",
    name: "Truth Coffee Roasting",
    category: "Cafes",
    image: img("photo-1445116572660-236099ec97a0"),
    rating: 4.5,
    reviewCount: 4120,
    distanceKm: 0.8,
    offer: "10% before 9am",
    openNow: true,
  },
  {
    id: "b2",
    name: "Casa Oaxaca",
    category: "Restaurants",
    image: img("photo-1414235077428-338989a2e8c0"),
    rating: 4.7,
    reviewCount: 2980,
    distanceKm: 1.4,
    openNow: true,
  },
  {
    id: "b3",
    name: "Hotel Bela Vista",
    category: "Hotels",
    image: img("photo-1566073771259-6a8506099945"),
    rating: 4.3,
    reviewCount: 1560,
    distanceKm: 2.2,
    offer: "2 nights for 1",
    openNow: true,
  },
  {
    id: "b4",
    name: "Nord Bike Rental",
    category: "Rentals",
    image: img("photo-1485965120184-e220f721d03e"),
    rating: 4.6,
    reviewCount: 740,
    distanceKm: 0.5,
    openNow: false,
  },
  {
    id: "b5",
    name: "Atelier Sete",
    category: "Shops",
    image: img("photo-1441986300917-64674bd600d8"),
    rating: 4.4,
    reviewCount: 512,
    distanceKm: 1.9,
    openNow: true,
  },
  {
    id: "b6",
    name: "Bar Ondas",
    category: "Nightlife",
    image: img("photo-1514933651103-005eec06c04b"),
    rating: 4.2,
    reviewCount: 2210,
    distanceKm: 3.1,
    offer: "Happy hour 18–20",
    openNow: false,
  },
  {
    id: "b7",
    name: "Mercado Central",
    category: "Markets",
    image: img("photo-1488459716781-31db52582fe9"),
    rating: 4.6,
    reviewCount: 6120,
    distanceKm: 1.1,
    openNow: true,
  },
  {
    id: "b8",
    name: "Sauna Kallio",
    category: "Wellness",
    image: img("photo-1544161515-4ab6ce6db874"),
    rating: 4.8,
    reviewCount: 890,
    distanceKm: 4.4,
    openNow: true,
  },
];

export const REVIEWS: Review[] = [
  {
    id: "rv1",
    author: "Helena Fischer",
    avatar: img("photo-1517841905240-472988babdf9", 200),
    rating: 5,
    date: "Mar 2026",
    body: "Arrived at 6am on a Tuesday and had twenty minutes entirely alone. By eight it was shoulder to shoulder. The timing advice in the app was exactly right.",
    helpful: 214,
  },
  {
    id: "rv2",
    author: "Marc Devereux",
    avatar: img("photo-1500648767791-00dcc994a43e", 200),
    rating: 4,
    date: "Feb 2026",
    body: "Beautiful but short — you walk it in fifteen minutes. Pair it with the gardens at the north end or you'll feel a little short-changed.",
    helpful: 156,
  },
  {
    id: "rv3",
    author: "Priya Raman",
    avatar: img("photo-1494790108377-be9c29b29330", 200),
    rating: 5,
    date: "Jan 2026",
    body: "The side path the community tips mention is real and almost empty. That alone made the trip.",
    helpful: 98,
  },
];

export const WEATHER = {
  city: "Lisbon",
  temperatureC: 23,
  condition: "Partly cloudy",
  high: 26,
  low: 17,
  aqi: 31,
  hourly: [
    { hour: "09", t: 19 },
    { hour: "12", t: 23 },
    { hour: "15", t: 26 },
    { hour: "18", t: 24 },
    { hour: "21", t: 20 },
  ],
};

export const USER = {
  id: "u_current",
  name: "Alex Moreau",
  handle: "alexmoreau",
  avatar: img("photo-1472099645785-5658abf4ff4e", 300),
  bio: "Slow traveller. Coastal roads, early markets, and the third-best coffee in every city.",
  location: "Lisbon, Portugal",
  joined: "Joined March 2024",
  badges: ["Trailblazer", "Gem Hunter", "Top Reviewer", "Verified Local"],
  stats: { places: 184, routes: 42, reviews: 96, followers: 3820, following: 412, countries: 27 },
};

export const SAVED_TRIPS = [
  {
    id: "t1",
    name: "Douro Valley weekend",
    stops: 6,
    distanceKm: 214,
    image: img("photo-1506905925346-21bda4d32df4", 600),
  },
  {
    id: "t2",
    name: "Kyoto temple loop",
    stops: 9,
    distanceKm: 31,
    image: img("photo-1545569341-9eb8b30979d9", 600),
  },
  {
    id: "t3",
    name: "Dolomites passes",
    stops: 4,
    distanceKm: 187,
    image: img("photo-1464822759023-fed622ff2c3b", 600),
  },
];

export const DESTINATIONS = [
  {
    id: "d1",
    name: "Kyoto",
    country: "Japan",
    image: img("photo-1493976040374-85c8e12f0c0e", 700),
    places: 1240,
  },
  {
    id: "d2",
    name: "Lisbon",
    country: "Portugal",
    image: img("photo-1555881400-74d7acaacd8b", 700),
    places: 980,
  },
  {
    id: "d3",
    name: "Oaxaca",
    country: "Mexico",
    image: img("photo-1518105779142-d975f22f1b0a", 700),
    places: 640,
  },
  {
    id: "d4",
    name: "Reykjavík",
    country: "Iceland",
    image: img("photo-1504893524553-b855bce32c67", 700),
    places: 410,
  },
  {
    id: "d5",
    name: "Cape Town",
    country: "South Africa",
    image: img("photo-1580060839134-75a5edca2e99", 700),
    places: 870,
  },
  {
    id: "d6",
    name: "Cortina",
    country: "Italy",
    image: img("photo-1464822759023-fed622ff2c3b", 700),
    places: 320,
  },
];

export const TESTIMONIALS = [
  {
    id: "ts1",
    name: "Nadia Farouk",
    role: "Photographer, Cairo",
    avatar: img("photo-1534528741775-53994a69daeb", 200),
    quote:
      "It routed me past a salt lake I'd have driven straight by. That detour is now the best photo I've ever taken.",
  },
  {
    id: "ts2",
    name: "Jonas Bergström",
    role: "Cyclist, Malmö",
    avatar: img("photo-1507003211169-0a1dd7228f2d", 200),
    quote:
      "The elevation-aware routing is the only one I've found that understands what a loaded touring bike actually wants.",
  },
  {
    id: "ts3",
    name: "Grace Whitfield",
    role: "Writer, Melbourne",
    avatar: img("photo-1544005313-94ddf0286df2", 200),
    quote:
      "Community tips beat every guidebook I packed. Two of them changed the shape of the whole trip.",
  },
];

export const ADMIN_METRICS = [
  { id: "m1", label: "Active users", value: "48,210", delta: "+12.4%", positive: true },
  { id: "m2", label: "Routes planned", value: "196,430", delta: "+8.1%", positive: true },
  { id: "m3", label: "New places", value: "1,284", delta: "+21.7%", positive: true },
  { id: "m4", label: "Open reports", value: "37", delta: "-4.3%", positive: false },
];

export const USER_GROWTH = [
  { month: "Jan", users: 21400, posts: 5200 },
  { month: "Feb", users: 24800, posts: 6100 },
  { month: "Mar", users: 27900, posts: 7400 },
  { month: "Apr", users: 32600, posts: 8100 },
  { month: "May", users: 38200, posts: 9600 },
  { month: "Jun", users: 43100, posts: 11200 },
  { month: "Jul", users: 48210, posts: 12840 },
];

export const REPORTS = [
  {
    id: "rp1",
    subject: "Fake listing: 'Secret Blue Lagoon'",
    reporter: "mirawalks",
    type: "Listing",
    status: "pending" as const,
    date: "Aug 6, 2026",
  },
  {
    id: "rp2",
    subject: "Abusive comment on route thread",
    reporter: "treis",
    type: "Comment",
    status: "reviewing" as const,
    date: "Aug 5, 2026",
  },
  {
    id: "rp3",
    subject: "Duplicate place entry",
    reporter: "aikoroutes",
    type: "Listing",
    status: "resolved" as const,
    date: "Aug 4, 2026",
  },
  {
    id: "rp4",
    subject: "Spam links in bio",
    reporter: "dosei",
    type: "Profile",
    status: "pending" as const,
    date: "Aug 3, 2026",
  },
  {
    id: "rp5",
    subject: "Outdated road closure alert",
    reporter: "saranowak",
    type: "Alert",
    status: "resolved" as const,
    date: "Aug 1, 2026",
  },
];

export const RECOMMENDATION_SECTIONS = [
  {
    id: "rs1",
    title: "Places you'll probably love",
    reason: "Based on 12 coastal viewpoints you saved",
    items: PLACES.slice(0, 4),
  },
  {
    id: "rs2",
    title: "Cafes near your route",
    reason: "You stop for coffee within 40 min of setting off",
    items: [PLACES[4], PLACES[2], PLACES[1], PLACES[0]],
  },
  {
    id: "rs3",
    title: "Hidden gems within 2 hours",
    reason: "Fewer than 200 check-ins this month",
    items: [PLACES[5], PLACES[1], PLACES[3], PLACES[0]],
  },
  {
    id: "rs4",
    title: "Weekend plans",
    reason: "Two days, under 250 km of driving",
    items: [PLACES[3], PLACES[0], PLACES[5], PLACES[2]],
  },
];
