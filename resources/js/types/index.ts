export interface Auth {
    user: User | null;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    [key: string]: unknown;
}

export interface User {
    id: number;
    steam_id: string;
    nickname: string;
    avatar: string | null;
    team_id: number | null;
    role: string;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}
