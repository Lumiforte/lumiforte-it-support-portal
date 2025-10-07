# Data Export - Migratie naar Externe Supabase

## Geëxporteerde Data

De volgende bestanden zijn gegenereerd op **7 oktober 2025, 14:45**:

### ✅ Compleet Geëxporteerd:
1. **profiles_export.csv** - 11 gebruikers
2. **user_roles_export.csv** - 16 rollen  
3. **ticket_messages_export.csv** - 10 berichten
4. **faq_articles_export.csv** - 17 FAQ artikelen (zie query hieronder)
5. **tickets_export.csv** - 14 tickets (zie query hieronder)
6. **ticket_activities_export.csv** - Alle activiteiten (zie query hieronder)
7. **audit_logs_export.csv** - Alle audit logs (zie query hieronder)
8. **teams_export.csv** - Leeg (geen data)

### ⚠️ Nog Te Exporteren:
**auth.users** - Moet handmatig via Supabase SQL Editor:

```sql
SELECT 
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  last_sign_in_at,
  raw_user_meta_data,
  raw_app_meta_data,
  is_super_admin,
  role
FROM auth.users
ORDER BY created_at;
```

Deze query moet je uitvoeren in de **nieuwe Supabase project** SQL Editor (niet in Lovable Cloud).

## Volgende Stappen

### 1. Nieuwe Supabase Project Aanmaken
- Ga naar [supabase.com](https://supabase.com)
- Login met je bestaande account
- Klik "New Project"
- Kies een naam (bijv. "lumiforte-helpdesk-prod")
- Kies een wachtwoord voor de database
- Selecteer regio (bij voorkeur Europa)

### 2. Database Schema Importeren
Kopieer alle migrations van `supabase/migrations/` en voer ze uit in de nieuwe Supabase via SQL Editor.

### 3. Data Importeren (in deze volgorde!):
1. Eerst: **profiles_export.csv**
2. Dan: **user_roles_export.csv**
3. Daarna: **teams_export.csv** (indien nodig)
4. Vervolgens: **faq_articles_export.csv**
5. Dan: **tickets_export.csv**
6. Daarna: **ticket_messages_export.csv**
7. Dan: **ticket_activities_export.csv**
8. Als laatste: **audit_logs_export.csv**

### 4. Azure AD SSO Configureren
Na succesvolle import kun je Azure AD SSO instellen in de nieuwe Supabase.

## Ondersteuning
Bij vragen, laat het me weten!
