import type { UserProfile, Match, Chisme } from "@/lib/types";

export const MOCK_PROFILES: UserProfile[] = [
  {
    user_id: "1",
    display_name: "María",
    date_of_birth: "2002-03-15",
    gender: "mujer",
    show_me: "hombres",
    bio: "Amo el café cubano y los atardeceres en el Malecón. Busco alguien para aventuras y buena conversa.",
    work_study: "CUJAE",
    role: "user",
    status: "active",
    last_active: new Date().toISOString(),
    photos: [
      { id: "p1", url: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=900&fit=crop", position: 1 },
      { id: "p2", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=900&fit=crop", position: 2 },
      { id: "p3", url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=900&fit=crop", position: 3 },
      { id: "p4", url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=900&fit=crop", position: 4 },
    ],
    prompts: [
      { id: "pr1", prompt_text: "Mi comida cubana favorita es...", answer_text: "Ropa vieja con arroz congrí", position: 1 },
      { id: "pr2", prompt_text: "Plan ideal de sábado...", answer_text: "Playa, música y buena compañía", position: 2 },
      { id: "pr3", prompt_text: "Mensaje si...", answer_text: "Te gusta el café sin azúcar", position: 3 },
    ],
    interests: ["Café", "Playa", "Salsa", "Leer", "Viajar"],
    location: { city: "Vedado, La Habana", latitude: 23.1365, longitude: -82.3816 },
  },
  {
    user_id: "2",
    display_name: "Carlos",
    date_of_birth: "1998-07-22",
    gender: "hombre",
    show_me: "mujeres",
    bio: "Músico de día, chef de noche. Hago la mejor pizza de La Habana (o eso dicen mis amigos).",
    work_study: "Músico",
    role: "user",
    status: "active",
    last_active: new Date().toISOString(),
    photos: [
      { id: "p5", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=900&fit=crop", position: 1 },
      { id: "p6", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=900&fit=crop", position: 2 },
      { id: "p7", url: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&h=900&fit=crop", position: 3 },
    ],
    prompts: [
      { id: "pr4", prompt_text: "Mi talento oculto es...", answer_text: "Toco tres instrumentos", position: 1 },
      { id: "pr5", prompt_text: "No puedo vivir sin...", answer_text: "Música y café con leche", position: 2 },
    ],
    interests: ["Música", "Cocinar", "Gym", "Reggaeton", "Playa"],
    location: { city: "Centro Habana, La Habana", latitude: 23.1330, longitude: -82.3890 },
    phone: "+5352001234",
  },
  {
    user_id: "3",
    display_name: "Laura",
    date_of_birth: "2000-11-08",
    gender: "mujer",
    show_me: "hombres",
    bio: "Fotógrafa amateur. Me encuentras en cualquier azotea de La Habana buscando el ángulo perfecto.",
    work_study: "Universidad de La Habana",
    role: "user",
    status: "active",
    last_active: new Date().toISOString(),
    photos: [
      { id: "p8", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=900&fit=crop", position: 1 },
      { id: "p9", url: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=900&fit=crop", position: 2 },
    ],
    prompts: [
      { id: "pr6", prompt_text: "Algo que me vuelve loca es...", answer_text: "Un buen sentido del humor", position: 1 },
      { id: "pr7", prompt_text: "Juntos podríamos...", answer_text: "Perdernos por La Habana Vieja", position: 2 },
    ],
    interests: ["Fotografía", "Arte", "Cine", "Atardeceres", "Café"],
    location: { city: "Habana Vieja, La Habana", latitude: 23.1350, longitude: -82.3580 },
  },
  {
    user_id: "4",
    display_name: "Daniel",
    date_of_birth: "1997-04-30",
    gender: "hombre",
    show_me: "mujeres",
    bio: "Ingeniero de software. Cuando no estoy codeando, estoy en el gym o haciendo snorkel en Varadero.",
    work_study: "Freelancer IT",
    role: "user",
    status: "active",
    last_active: new Date().toISOString(),
    photos: [
      { id: "p10", url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=900&fit=crop", position: 1 },
      { id: "p11", url: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&h=900&fit=crop", position: 2 },
      { id: "p12", url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=900&fit=crop", position: 3 },
      { id: "p13", url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=900&fit=crop", position: 4 },
    ],
    prompts: [
      { id: "pr8", prompt_text: "Aventura que quiero vivir...", answer_text: "Recorrer Cuba de punta a punta en moto", position: 1 },
      { id: "pr9", prompt_text: "Playa o campo?", answer_text: "Playa siempre, soy cubano", position: 2 },
      { id: "pr10", prompt_text: "Café o cerveza?", answer_text: "¿Por qué no los dos?", position: 3 },
    ],
    interests: ["Gym", "Deporte", "Gaming", "Playa", "Cocinar", "Viajar"],
    location: { city: "Playa, La Habana", latitude: 23.1200, longitude: -82.4100 },
    phone: "+5352009876",
  },
  {
    user_id: "5",
    display_name: "Ana",
    date_of_birth: "2001-01-20",
    gender: "mujer",
    show_me: "ambos",
    bio: "Bailarina de salsa casino. Si no puedes seguirme el paso en la pista, al menos intenta en la conversación.",
    work_study: "Escuela de Artes",
    role: "user",
    status: "active",
    last_active: new Date().toISOString(),
    photos: [
      { id: "p14", url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=900&fit=crop", position: 1 },
      { id: "p15", url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=900&fit=crop", position: 2 },
      { id: "p16", url: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&h=900&fit=crop", position: 3 },
    ],
    prompts: [
      { id: "pr11", prompt_text: "La mejor forma de conquistarme es...", answer_text: "Invítame a bailar sin miedo", position: 1 },
      { id: "pr12", prompt_text: "Mi lugar favorito en Cuba es...", answer_text: "Trinidad, ese pueblo es mágico", position: 2 },
    ],
    interests: ["Bailar", "Salsa", "Fiesta", "Yoga", "Mascotas", "Atardeceres"],
    location: { city: "Cerro, La Habana", latitude: 23.1100, longitude: -82.3900 },
  },
];

export const MOCK_MATCHES: Match[] = [
  {
    id: "m1",
    user: MOCK_PROFILES[1],
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    last_message_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "m2",
    user: MOCK_PROFILES[3],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    last_message_at: null,
  },
  {
    id: "m3",
    user: MOCK_PROFILES[4],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    last_message_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

export const MOCK_CHISMES: Chisme[] = [
  {
    id: "c1",
    content: {
      text: "Sabías que el 68% de los matches en Empatando comienzan hablando de comida? La ropa vieja conecta corazones.",
      type: "stat",
    },
    image_url: null,
    views: 1247,
    likes: 234,
    clicks: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "c2",
    content: {
      text: "Consejo del día: Empieza conversaciones con algo del perfil, no solo 'Hola'. Los matches que empiezan con preguntas personalizadas duran 3x más.",
      type: "tip",
    },
    image_url: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&h=400&fit=crop",
    views: 856,
    likes: 89,
    clicks: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "c3",
    content: {
      text: "Ya somos +5,000 cubanos buscando amor en Empatando! Gracias por ser parte de esta comunidad.",
      type: "milestone",
    },
    image_url: null,
    views: 3420,
    likes: 567,
    clicks: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "c4",
    content: {
      text: "Dato curioso: La hora con más matches es las 9pm los viernes. Así que ya sabes, abre Empatando esta noche!",
      type: "stat",
    },
    image_url: null,
    views: 2100,
    likes: 345,
    clicks: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: "c5",
    content: {
      text: "Pareja se conoció en Empatando hace 2 meses. Hoy nos comparten que todo va de maravilla. El amor cubano es fuerte!",
      type: "success",
    },
    image_url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop",
    views: 4500,
    likes: 890,
    clicks: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
];

export const SUGGESTED_PROMPTS = [
  "Mi lugar favorito en Cuba es...",
  "No puedo vivir sin...",
  "Un día perfecto para mí incluye...",
  "Mi comida cubana favorita es...",
  "La mejor forma de conquistarme es...",
  "Algo que me vuelve loco/a es...",
  "Mi talento oculto es...",
  "Plan ideal de sábado...",
  "Serie/película que puedo ver mil veces...",
  "Playa o campo?",
  "Café o cerveza?",
  "Aventura que quiero vivir...",
  "Mensaje si...",
  "Juntos podríamos...",
];

export const SUGGESTED_INTERESTS = [
  "Café", "Playa", "Reggaeton", "Salsa", "Fútbol", "Béisbol",
  "Leer", "Cocinar", "Cine", "Series", "Gym", "Deporte",
  "Arte", "Viajar", "Karaoke", "Gaming", "Fotografía", "Fiesta",
  "Atardeceres", "Mascotas", "Música", "Bailar", "Yoga", "Escribir",
];

export function getAge(dateOfBirth: string): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function formatDistance(km: number): string {
  if (km < 1) return "< 1 km";
  return `${Math.round(km)} km`;
}

export function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes}m`;
  if (hours < 24) return `hace ${hours}h`;
  if (days < 7) return `hace ${days}d`;
  return new Date(dateStr).toLocaleDateString("es-CU", { day: "numeric", month: "short" });
}
