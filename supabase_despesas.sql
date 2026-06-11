-- =============================================
-- ALDINA GEST — Tabela: despesas
-- Executar no Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS despesas (
  id           text PRIMARY KEY,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria    text NOT NULL DEFAULT 'outras',
  ndoc         text,
  descricao    text NOT NULL,
  fornecedor   text,
  data         date NOT NULL,
  valor        numeric(15,2) NOT NULL DEFAULT 0,
  notas        text,
  "criadoEm"   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS despesas_user_id_idx ON despesas(user_id);
CREATE INDEX IF NOT EXISTS despesas_data_idx    ON despesas(data);
CREATE INDEX IF NOT EXISTS despesas_categoria_idx ON despesas(categoria);

-- Row Level Security (RLS) — cada utilizador só vê as suas despesas
ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilizador vê as suas despesas"
  ON despesas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Utilizador insere as suas despesas"
  ON despesas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilizador actualiza as suas despesas"
  ON despesas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Utilizador elimina as suas despesas"
  ON despesas FOR DELETE
  USING (auth.uid() = user_id);

-- Admin (service role) ignora RLS automaticamente
-- Não é necessária policy adicional para admin.
