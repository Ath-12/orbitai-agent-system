import axios from "axios";
import { createSupabaseClient } from "./supabase";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the logged-in user's Supabase token to every backend request.
// The backend checks this token to know who the user really is.
api.interceptors.request.use(async (config) => {
  const supabase = createSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
