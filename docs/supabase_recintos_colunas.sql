-- Colunas que o app Criador Pro usa em "recintos" e que não existem na tabela.
-- Rodar uma vez no Supabase: SQL Editor -> New query -> colar -> Run.
-- É seguro rodar de novo: "if not exists" não mexe no que já existe.

alter table public.recintos add column if not exists ala text;
alter table public.recintos add column if not exists tipo_comp text;
alter table public.recintos add column if not exists qtd_comp integer default 1;
alter table public.recintos add column if not exists dimensoes text;
alter table public.recintos add column if not exists anilha_casal text;

-- Atualiza o cache da API para enxergar as colunas novas na hora.
notify pgrst, 'reload schema';
