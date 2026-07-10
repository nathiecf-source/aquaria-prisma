-- Script SQL para atualizar o banco de dados Supabase

-- 1. Criação do ENUM para o nível de assinatura (opcional, pode ser texto simples para flexibilidade)
-- CREATE TYPE public.subscription_tier_enum AS ENUM ('FREE', 'PLUS');

-- 2. Criação da tabela de Perfis de Usuário
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  whatsapp_number TEXT NOT NULL,
  subscription_tier TEXT DEFAULT 'FREE', -- 'FREE' ou 'PLUS'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Habilitação de RLS (Row Level Security) na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Criação de Políticas de Segurança (Policies) para profiles
-- Permite que qualquer usuário autenticado leia seu próprio perfil
CREATE POLICY "Permitir leitura do próprio perfil" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Permite que o próprio usuário atualize seu perfil (ex: upgrade de tier)
CREATE POLICY "Permitir atualização do próprio perfil" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Permite que novos registros sejam inseridos na criação de conta
CREATE POLICY "Permitir inserção de novos perfis" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 5. Trigger Automatizado para preenchimento de Perfis na criação de conta
-- NOTA: Caso use metadados customizados na criação de conta (como full_name e whatsapp_number),
-- esta trigger irá lê-los e gravar na tabela pública profiles automaticamente.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, whatsapp_number, subscription_tier)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário Astrológico'),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp_number', '+55 00 00000-0000'),
    'FREE'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Associa o Trigger à tabela auth.users do Supabase
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
