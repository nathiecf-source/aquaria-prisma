-- ============================================================
-- MIGRAÇÃO: Adiciona coluna "analysis" à tabela user_chart
-- Armazena a síntese astrológica dos 7 caminhos (texto JSON gerado pelo Gemini)
-- para evitar chamadas repetidas à API a cada carregamento do app.
-- Execute no SQL Editor do Supabase.
-- ============================================================

ALTER TABLE public.user_chart
  ADD COLUMN IF NOT EXISTS analysis TEXT;
