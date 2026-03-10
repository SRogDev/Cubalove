// ---------------------------------------------------------------------------
// Intereses predefinidos para el onboarding
// Agrupados por categoría, con emojis para fácil reconocimiento visual
// ---------------------------------------------------------------------------

export interface InterestOption {
    label: string;
    emoji: string;
}

export interface InterestCategory {
    name: string;
    interests: InterestOption[];
}

export const ONBOARDING_INTERESTS: InterestCategory[] = [
    {
        name: "Música",
        interests: [
            { label: "Reggaetón", emoji: "🎵" },
            { label: "Salsa", emoji: "💃" },
            { label: "Timba", emoji: "🎺" },
            { label: "Reguetón cubano", emoji: "🔥" },
            { label: "Trap", emoji: "🎤" },
            { label: "Bachata", emoji: "🌹" },
            { label: "Rock", emoji: "🎸" },
            { label: "Jazz", emoji: "🎷" },
            { label: "Hip hop", emoji: "🎧" },
            { label: "Trova", emoji: "🎶" },
        ],
    },
    {
        name: "Actividades",
        interests: [
            { label: "Playa", emoji: "🏖️" },
            { label: "Malecón", emoji: "🌊" },
            { label: "Fiestas", emoji: "🎉" },
            { label: "Cocinar", emoji: "🍳" },
            { label: "Gym", emoji: "💪" },
            { label: "Correr", emoji: "🏃" },
            { label: "Bailar", emoji: "🕺" },
            { label: "Viajar", emoji: "✈️" },
            { label: "Dominó", emoji: "🁡" },
            { label: "Fútbol", emoji: "⚽" },
            { label: "Béisbol", emoji: "⚾" },
            { label: "Nadar", emoji: "🏊" },
        ],
    },
    {
        name: "Estilo de vida",
        interests: [
            { label: "Perritos", emoji: "🐶" },
            { label: "Gaticos", emoji: "🐱" },
            { label: "Café", emoji: "☕" },
            { label: "Cerveza", emoji: "🍺" },
            { label: "Ron", emoji: "🥃" },
            { label: "Vegetariano", emoji: "🥬" },
            { label: "Fitness", emoji: "🏋️" },
            { label: "Gaming", emoji: "🎮" },
            { label: "Series", emoji: "📺" },
            { label: "Películas", emoji: "🎬" },
            { label: "Lectura", emoji: "📚" },
            { label: "Fotografía", emoji: "📸" },
        ],
    },
    {
        name: "Personalidad",
        interests: [
            { label: "Aventurero", emoji: "🧗" },
            { label: "Romántico", emoji: "💕" },
            { label: "Chistoso", emoji: "😂" },
            { label: "Tranquilo", emoji: "😌" },
            { label: "Fiestero", emoji: "🪩" },
            { label: "Emprendedor", emoji: "💼" },
            { label: "Creativo", emoji: "🎨" },
            { label: "Familiar", emoji: "👨‍👩‍👧" },
            { label: "Espiritual", emoji: "🧘" },
            { label: "Noctámbulo", emoji: "🦉" },
        ],
    },
];

/** Todos los intereses como array plano de strings */
export const ALL_INTERESTS = ONBOARDING_INTERESTS.flatMap((cat) =>
    cat.interests.map((i) => i.label),
);
