# Manuella steg för BRIEF-UI-001

Supabase Dashboard kräver manuell konfig för magic link:

1. Gå till https://supabase.com/dashboard/project/yhlaacpvucjvnczyauze/auth/url-configuration
2. Under **Redirect URLs**, lägg till:
   - `sportmeet://auth-callback`
   - `exp://192.168.*.*:*/--/auth-callback` (Expo dev)
3. Under **Site URL**, sätt:
   - `sportmeet://`
4. Spara

Utan detta: magic-linken skickas men klick → felsida.
