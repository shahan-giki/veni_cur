export type UserRole = "CUSTOMER" | "ADMIN";

export type PublicUser = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};
