-- ================================================================================
-- COMPLETE SCHEMA MIGRATION - LUMIFORTE HELPDESK
-- Dit script maakt alle benodigde tabellen, types, functies en policies aan
-- Datum: 7 oktober 2025
-- ================================================================================

-- ================================================================================
-- STAP 1: Custom Types (Enums)
-- ================================================================================

CREATE TYPE public.app_role AS ENUM ('user', 'helpdesk', 'manager', 'hr', 'admin');
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- ================================================================================
-- STAP 2: Tabellen
-- ================================================================================

-- Profiles tabel
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company TEXT,
  phone_number TEXT,
  preferred_language TEXT DEFAULT 'en',
  team_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invitation_sent_at TIMESTAMP WITH TIME ZONE
);

-- User roles tabel
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Teams tabel
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tickets tabel
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  main_category TEXT NOT NULL,
  sub_category TEXT NOT NULL,
  status ticket_status DEFAULT 'open',
  priority ticket_priority DEFAULT 'medium',
  phone_number TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requires_approval BOOLEAN DEFAULT FALSE,
  approval_status TEXT,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Ticket messages tabel
CREATE TABLE public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin_reply BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ticket activities tabel
CREATE TABLE public.ticket_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FAQ articles tabel
CREATE TABLE public.faq_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs tabel
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================================
-- STAP 3: Security Definer Functions
-- ================================================================================

-- Functie om te checken of een user een specifieke rol heeft
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Functie voor audit logging
CREATE OR REPLACE FUNCTION public.log_audit_entry(
  p_user_id UUID,
  p_user_email TEXT,
  p_action TEXT,
  p_table_name TEXT,
  p_record_id TEXT,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    user_id, user_email, action, table_name, record_id, old_values, new_values
  )
  VALUES (
    p_user_id, p_user_email, p_action, p_table_name, p_record_id, p_old_values, p_new_values
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Functie om updated_at automatisch bij te werken
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Functie om resolved_at en closed_at bij te werken
CREATE OR REPLACE FUNCTION public.set_resolved_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = NOW();
  END IF;
  
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    NEW.closed_at = NOW();
  END IF;
  
  IF (OLD.status = 'resolved' OR OLD.status = 'closed') AND (NEW.status = 'open' OR NEW.status = 'in_progress') THEN
    NEW.resolved_at = NULL;
    NEW.closed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Functie om nieuwe users automatisch een profiel te geven
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Functie om ticket activiteiten te loggen
CREATE OR REPLACE FUNCTION public.log_ticket_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.ticket_activities (ticket_id, user_id, action_type, new_value)
    VALUES (NEW.id, NEW.created_by, 'created', NULL);
    RETURN NEW;
  END IF;

  IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    INSERT INTO public.ticket_activities (ticket_id, user_id, action_type, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'status_changed', OLD.status::TEXT, NEW.status::TEXT);
  END IF;

  IF (TG_OP = 'UPDATE' AND (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to)) THEN
    INSERT INTO public.ticket_activities (ticket_id, user_id, action_type, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'assigned', OLD.assigned_to::TEXT, NEW.assigned_to::TEXT);
  END IF;

  IF (TG_OP = 'UPDATE' AND OLD.priority != NEW.priority) THEN
    INSERT INTO public.ticket_activities (ticket_id, user_id, action_type, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'priority_changed', OLD.priority::TEXT, NEW.priority::TEXT);
  END IF;

  IF (TG_OP = 'UPDATE' AND OLD.category != NEW.category) THEN
    INSERT INTO public.ticket_activities (ticket_id, user_id, action_type, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'category_changed', OLD.category::TEXT, NEW.category::TEXT);
  END IF;

  RETURN NEW;
END;
$$;

-- Functie om message activiteiten te loggen
CREATE OR REPLACE FUNCTION public.log_message_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.ticket_activities (ticket_id, user_id, action_type, new_value)
    VALUES (
      NEW.ticket_id, 
      NEW.created_by, 
      CASE 
        WHEN NEW.is_admin_reply THEN 'replied_helpdesk'
        ELSE 'replied_user'
      END,
      NULL
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Functie om ticket changes te loggen in audit log
CREATE OR REPLACE FUNCTION public.log_ticket_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
  v_old_values JSONB;
  v_new_values JSONB;
BEGIN
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  
  IF (TG_OP = 'INSERT') THEN
    PERFORM log_audit_entry(
      auth.uid(),
      v_user_email,
      'ticket_created',
      'tickets',
      NEW.id::TEXT,
      NULL,
      jsonb_build_object('title', NEW.title, 'status', NEW.status, 'priority', NEW.priority, 'category', NEW.category)
    );
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    v_old_values := jsonb_build_object('status', OLD.status, 'priority', OLD.priority, 'assigned_to', OLD.assigned_to);
    v_new_values := jsonb_build_object('status', NEW.status, 'priority', NEW.priority, 'assigned_to', NEW.assigned_to);
    
    IF v_old_values IS DISTINCT FROM v_new_values THEN
      PERFORM log_audit_entry(auth.uid(), v_user_email, 'ticket_updated', 'tickets', NEW.id::TEXT, v_old_values, v_new_values);
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Functie om profile updates te loggen
CREATE OR REPLACE FUNCTION public.log_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
  v_old_values JSONB;
  v_new_values JSONB;
BEGIN
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  
  v_old_values := jsonb_build_object('full_name', OLD.full_name, 'email', OLD.email, 'company', OLD.company, 'phone_number', OLD.phone_number);
  v_new_values := jsonb_build_object('full_name', NEW.full_name, 'email', NEW.email, 'company', NEW.company, 'phone_number', NEW.phone_number);
  
  IF v_old_values IS DISTINCT FROM v_new_values THEN
    PERFORM log_audit_entry(auth.uid(), v_user_email, 'profile_updated', 'profiles', NEW.id::TEXT, v_old_values, v_new_values);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Functie om role changes te loggen
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
  v_action TEXT;
BEGIN
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  
  IF (TG_OP = 'INSERT') THEN
    v_action := 'role_added';
    PERFORM log_audit_entry(auth.uid(), v_user_email, v_action, 'user_roles', NEW.user_id::TEXT, NULL, jsonb_build_object('role', NEW.role));
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    v_action := 'role_removed';
    PERFORM log_audit_entry(auth.uid(), v_user_email, v_action, 'user_roles', OLD.user_id::TEXT, jsonb_build_object('role', OLD.role), NULL);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Auto-assign functie voor specifieke categories
CREATE OR REPLACE FUNCTION public.auto_assign_salesforce_tickets()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.category = 'salesforce' AND NEW.assigned_to IS NULL THEN
    NEW.assigned_to = '6b602d09-b90b-48f3-aebd-38772baee4b4'; -- Bas Moeskops
  END IF;
  
  IF NEW.category = 'hardware' AND NEW.assigned_to IS NULL THEN
    NEW.assigned_to = 'b9a5d7fd-1869-44cc-bcd1-89928b494989'; -- Jeroen Vee
  END IF;
  
  RETURN NEW;
END;
$$;

-- ================================================================================
-- STAP 4: Triggers
-- ================================================================================

-- Trigger voor nieuwe users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers voor tickets
CREATE TRIGGER set_resolved_at_trigger
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_resolved_at();

CREATE TRIGGER log_ticket_activity_trigger
  AFTER INSERT OR UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.log_ticket_activity();

CREATE TRIGGER log_ticket_changes_trigger
  AFTER INSERT OR UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.log_ticket_changes();

CREATE TRIGGER auto_assign_tickets_trigger
  BEFORE INSERT ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_salesforce_tickets();

-- Trigger voor ticket messages
CREATE TRIGGER log_message_activity_trigger
  AFTER INSERT ON public.ticket_messages
  FOR EACH ROW EXECUTE FUNCTION public.log_message_activity();

-- Trigger voor profiles
CREATE TRIGGER log_profile_update_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_profile_update();

-- Trigger voor user roles
CREATE TRIGGER log_role_change_trigger
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_role_change();

-- Trigger voor FAQ articles updated_at
CREATE TRIGGER update_faq_articles_updated_at
  BEFORE UPDATE ON public.faq_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger voor tickets updated_at
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ================================================================================
-- STAP 5: Row Level Security (RLS) Policies
-- ================================================================================

-- Enable RLS op alle tabellen
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile or staff can view all"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'helpdesk'));

CREATE POLICY "Users can update own profile or admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = id OR has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view all roles"
  ON public.user_roles FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can insert user roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user roles"
  ON public.user_roles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user roles"
  ON public.user_roles FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Teams policies
CREATE POLICY "Authenticated users can view teams"
  ON public.teams FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can insert teams"
  ON public.teams FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update teams"
  ON public.teams FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete teams"
  ON public.teams FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Tickets policies
CREATE POLICY "Users can view their tickets or all if admin/helpdesk"
  ON public.tickets FOR SELECT
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'helpdesk'));

CREATE POLICY "Users can create tickets"
  ON public.tickets FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins and helpdesk can update tickets"
  ON public.tickets FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'helpdesk'));

-- Ticket messages policies
CREATE POLICY "Users can view messages for their tickets"
  ON public.ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_messages.ticket_id
      AND (tickets.created_by = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'helpdesk'))
    )
  );

CREATE POLICY "Users can create messages for their tickets"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_messages.ticket_id
      AND (tickets.created_by = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'helpdesk'))
    )
  );

-- Ticket activities policies
CREATE POLICY "Users can view activities for their tickets"
  ON public.ticket_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_activities.ticket_id
      AND (tickets.created_by = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'helpdesk'))
    )
  );

-- FAQ articles policies
CREATE POLICY "Anyone can view FAQ articles"
  ON public.faq_articles FOR SELECT
  USING (TRUE);

CREATE POLICY "Only admins can create FAQ articles"
  ON public.faq_articles FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update FAQ articles"
  ON public.faq_articles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete FAQ articles"
  ON public.faq_articles FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Audit logs policies
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- ================================================================================
-- STAP 6: Storage Bucket
-- ================================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', TRUE);

-- Storage policies voor documents bucket
CREATE POLICY "Anyone can view documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own documents"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'documents' AND auth.uid()::TEXT = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND auth.uid()::TEXT = (storage.foldername(name))[1]);

-- ================================================================================
-- KLAAR!
-- ================================================================================
-- Het schema is nu compleet aangemaakt.
-- Je kunt nu de data importeren in de volgende volgorde:
-- 1. profiles
-- 2. user_roles
-- 3. teams (optioneel)
-- 4. faq_articles
-- 5. tickets
-- 6. ticket_messages
-- 7. ticket_activities
-- 8. audit_logs
-- ================================================================================
