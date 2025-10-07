# DATA IMPORT INSTRUCTIES - LUMIFORTE HELPDESK
**Datum:** 7 oktober 2025, 15:17

## ✅ STAP 1: Schema is al aangemaakt
Je hebt het schema al succesvol geïmporteerd! Alle tabellen, functies en policies bestaan al.

## 📋 STAP 2: Data Importeren

**BELANGRIJKE VOLGORDE** - Importeer de CSV files in deze exacte volgorde:

### 1️⃣ Profiles (11 gebruikers)
- Bestand: `profiles_export.csv`
- Tabel: `profiles`
- **Let op:** Dit moet eerst, want andere tabellen verwijzen naar profiles

### 2️⃣ User Roles (16 rollen)
- Bestand: `user_roles_export.csv`
- Tabel: `user_roles`

### 3️⃣ FAQ Articles (17 artikelen)
- Bestand: `faq_articles_export.csv`
- Tabel: `faq_articles`

### 4️⃣ Tickets (14 tickets)
- Bestand: `tickets_export.csv`
- Tabel: `tickets`

### 5️⃣ Ticket Messages (10 berichten)
- Bestand: `ticket_messages_export.csv`
- Tabel: `ticket_messages`

### 6️⃣ Ticket Activities (97 activiteiten)
- Bestand: `ticket_activities_export.csv`
- Tabel: `ticket_activities`

### 7️⃣ Audit Logs (39 logs)
- Bestand: `audit_logs_export.csv`
- Tabel: `audit_logs`

---

## 🔧 HOE IMPORTEER JE EEN CSV FILE?

Voor **elke file** volg je deze stappen:

1. **Open de Table Editor in Supabase**
   - Klik links op "Table Editor"
   - Selecteer de juiste tabel (bijv. `profiles`)

2. **Start de import**
   - Klik rechtsboven op **"Insert"** → **"Import data from CSV"**

3. **Upload het CSV bestand**
   - Klik "Browse" en selecteer het CSV bestand
   - Zorg dat **"First row is header"** is aangevinkt ✅
   - Klik **"Import data"**

4. **Verifieer de import**
   - Bekijk de tabel om te controleren of de data er staat
   - Check het aantal rijen (moet kloppen met het aantal in deze gids)

---

## ⚠️ VEELVOORKOMENDE PROBLEMEN

### Probleem: "Duplicate key value violates unique constraint"
**Oplossing:** De tabel bevat al data. Verwijder eerst alle bestaande rijen:
```sql
DELETE FROM profiles;
DELETE FROM user_roles;
-- etc.
```

### Probleem: "Foreign key constraint violation"
**Oplossing:** Importeer in de juiste volgorde! Profiles moet altijd eerst.

### Probleem: "Permission denied"
**Oplossing:** Je bent niet ingelogd als admin. Check je credentials.

---

## 🎯 NA DE IMPORT

### Laatste Stap: Auth Users Exporteren

De `auth.users` tabel moet je **handmatig** exporteren uit je **huidige** (oude) Supabase:

1. Ga naar je **oude** Supabase project
2. Open de SQL Editor
3. Voer deze query uit:

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

4. Download het resultaat als CSV
5. Importeer in je **nieuwe** Supabase project (auth.users tabel)

---

## ✅ CHECKLIST

- [ ] profiles_export.csv geïmporteerd (11 rijen)
- [ ] user_roles_export.csv geïmporteerd (16 rijen)
- [ ] faq_articles_export.csv geïmporteerd (17 rijen)
- [ ] tickets_export.csv geïmporteerd (14 rijen)
- [ ] ticket_messages_export.csv geïmporteerd (10 rijen)
- [ ] ticket_activities_export.csv geïmporteerd (97 rijen)
- [ ] audit_logs_export.csv geïmporteerd (39 logs)
- [ ] auth.users handmatig geëxporteerd en geïmporteerd

---

## 🚀 NA SUCCESVOLLE IMPORT

Je kunt nu:
1. Je applicatie verbinden met de nieuwe Supabase
2. Azure AD SSO configureren
3. Testen of alle data correct is overgenomen

Bij vragen, laat het me weten!
