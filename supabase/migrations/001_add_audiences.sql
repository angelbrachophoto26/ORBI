-- Migration: add audience fields to projects table
-- Run this in Supabase > SQL Editor

alter table public.projects
  add column if not exists audiences            jsonb default '[]'::jsonb,
  add column if not exists selected_audience_ids text[] default '{}',
  add column if not exists keywords             jsonb default '[]'::jsonb;
