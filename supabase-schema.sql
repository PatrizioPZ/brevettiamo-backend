-- ============================================================
-- BREVETTIAMO - Schema Database Supabase
-- 9 tabelle per gestire utenti, servizi AI, pagamenti
-- ============================================================

-- Abilita RLS (Row Level Security) su tutte le tabelle
-- Ogni utente vede solo i propri dati

-- ============================================================
-- TABELLA 1: users (gestita da Supabase Auth, estesa)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABELLA 2: practices (pratiche brevettuali)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  invention_field TEXT, -- campo tecnologico
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_practices_updated_at
  BEFORE UPDATE ON public.practices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABELLA 3: service_requests (richieste servizi AI)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL CHECK (service_id BETWEEN 1 AND 19),
  practice_id UUID REFERENCES public.practices(id) ON DELETE SET NULL,
  input_text TEXT NOT NULL,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- TABELLA 4: ai_responses (risposte generate dall'AI)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  content TEXT,
  tokens_used INTEGER DEFAULT 0,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELLA 5: subscriptions (abbonamenti utenti)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY, -- ID LemonSqueezy
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('starter', 'pro', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  lemonsqueezy_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABELLA 6: payments (storico pagamenti)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY, -- ID transazione LemonSqueezy
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_id TEXT REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status TEXT NOT NULL CHECK (status IN ('completed', 'failed', 'refunded', 'pending')),
  payment_method TEXT DEFAULT 'lemonsqueezy',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELLA 7: usage_logs (log utilizzo servizi)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL CHECK (service_id BETWEEN 1 AND 19),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELLA 8: cad_files (file CAD generati)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cad_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  practice_id UUID REFERENCES public.practices(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('dxf', 'dwg', 'step', 'stl', 'pdf')),
  file_size INTEGER, -- bytes
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELLA 9: services (catalogo servizi - dati statici)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.services (
  id INTEGER PRIMARY KEY CHECK (id BETWEEN 1 AND 19),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  package TEXT NOT NULL CHECK (package IN ('starter', 'pro', 'enterprise')),
  estimated_time TEXT,
  output_format TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserisci i 19 servizi
INSERT INTO public.services (id, slug, name, description, price, package, estimated_time, output_format) VALUES
(1, 'prior-art-base', 'Ricerca Prior Art Base', 'Ricerca base di brevetti simili nel database globale', 11, 'starter', '2-3 minuti', 'Markdown tabellare'),
(2, 'brevettabilita', 'Analisi Brevettabilita', 'Analisi completa della brevettabilita secondo criteri legali', 18, 'starter', '3-4 minuti', 'Report strutturato'),
(3, 'claims-base', 'Redazione Claims Base', 'Redazione claims indipendenti e dipendenti base', 23, 'starter', '2-3 minuti', 'Testo formattato'),
(4, 'prior-art-avanzata', 'Ricerca Prior Art Avanzata', 'Ricerca avanzata multi-database con classificazione IPC/CPC', 23, 'pro', '4-6 minuti', 'Report esecutivo'),
(5, 'claims-pro', 'Redazione Claims Pro', 'Redazione claims professionali multi-jurisdizione', 47, 'pro', '4-5 minuti', 'Documento claims'),
(6, 'traduzione-claims', 'Traduzione Claims', 'Traduzione certificata claims in 6 lingue', 14, 'pro', '2-3 minuti', 'Claims tradotti'),
(7, 'monitoraggio-concorrenza', 'Monitoraggio Concorrenza', 'Monitoraggio mensile competitor e trend brevettuali', 35, 'pro', '5-7 minuti', 'Dashboard mensile'),
(8, 'consulenza-ai', 'Consulenza 1:1 AI', 'Consulenza personalizzata con AI specializzata', 59, 'pro', '1-2 minuti', 'Risposta testuale'),
(9, 'analisi-portfolio', 'Analisi Portfolio Brevettuale', 'Analisi qualitativa e strategica di portfolio', 0, 'pro', '5-8 minuti', 'Report esecutivo'),
(10, 'fto', 'Freedom to Operate', 'Analisi Freedom to Operate per prodotti/servizi', 0, 'pro', '6-10 minuti', 'Report legale'),
(11, 'descrizione-completa', 'Redazione Descrizione Completa', 'Descrizione brevettuale completa pronta per deposito', 0, 'enterprise', '8-12 minuti', 'Documento Word-ready'),
(12, 'disegni-tecnici', 'Disegni Tecnici Brevetto', 'Specifiche disegni tecnici per brevetto', 0, 'enterprise', '3-4 minuti', 'Specifiche tecniche'),
(13, 'strategia-deposito', 'Strategia Deposito Internazionale', 'Pianificazione strategia deposito PCT', 0, 'enterprise', '5-7 minuti', 'Roadmap con budget'),
(14, 'valutazione-economica', 'Valutazione Economica Brevetto', 'Valutazione DCF/costo/mercato di brevetti', 0, 'enterprise', '6-10 minuti', 'Report valutazione'),
(15, 'due-diligence', 'Due Diligence IP', 'Due diligence completa per M&A', 0, 'enterprise', '8-15 minuti', 'Report completo'),
(16, 'contratti-licenza', 'Redazione Contratti Licenza', 'Contratti licenza brevettuale pronti all uso', 0, 'enterprise', '5-8 minuti', 'Template contratto'),
(17, 'analisi-invalidita', 'Analisi Invalidita Brevetto', 'Analisi invalidita e strategia opposizione', 0, 'enterprise', '6-10 minuti', 'Report invalidita'),
(18, 'gestione-scadenze', 'Gestione Scadenze e Renewal', 'Calendario scadenze e alert automatici', 0, 'enterprise', '3-5 minuti', 'Calendario alert'),
(19, 'cad-professionale', 'Disegno CAD Professionale', 'Istruzioni disegni CAD per brevetto', 0, 'enterprise', '4-6 minuti', 'Istruzioni CAD')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - Ogni utente vede solo i propri dati
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cad_files ENABLE ROW LEVEL SECURITY;

-- Policy: users possono vedere solo i propri dati
CREATE POLICY "Users can view own data" ON public.users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can view own practices" ON public.practices
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own requests" ON public.service_requests
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own responses" ON public.ai_responses
  FOR ALL USING (auth.uid() = (SELECT user_id FROM public.service_requests WHERE id = request_id));

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payments" ON public.payments
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own usage" ON public.usage_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own cad files" ON public.cad_files
  FOR ALL USING (auth.uid() = user_id);

-- Servizi sono pubblici (read-only)
CREATE POLICY "Services are public" ON public.services
  FOR SELECT USING (true);

-- ============================================================
-- INDICI per performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_practices_user ON public.practices(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_user ON public.service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_service ON public.service_requests(service_id);
CREATE INDEX IF NOT EXISTS idx_responses_request ON public.ai_responses(request_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_user ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_created ON public.usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_cad_practice ON public.cad_files(practice_id);

-- ============================================================
-- FUNZIONE: conta utilizzo mensile per utente
-- ============================================================
CREATE OR REPLACE FUNCTION get_monthly_usage(user_uuid UUID, period_start TIMESTAMP WITH TIME ZONE)
RETURNS INTEGER AS $$
DECLARE
  usage_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO usage_count
  FROM public.usage_logs
  WHERE user_id = user_uuid
    AND created_at >= period_start;
  RETURN usage_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGER: auto-crea record user alla registrazione
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, NEW.email, NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FINE SCHEMA
-- ============================================================