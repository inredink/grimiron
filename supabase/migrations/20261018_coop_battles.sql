-- ====================================================================
-- GrimIron Co-op Boss Battles: Supabase PostgreSQL Migration
-- Enables asynchronous cooperative boss raids for friends groups.
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. USER PROFILES
-- Mirrors auth.users to provide public warrior callsigns without leaking private emails.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  faction_id TEXT NOT NULL DEFAULT 'adeptus-astartes',
  avatar_glyph TEXT NOT NULL DEFAULT 'shield-outline',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, faction_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', 'Battle-Brother'),
    COALESCE(new.raw_user_meta_data->>'faction_id', 'adeptus-astartes')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. FRIENDS GROUPS (CRUSADE SQUADS)
-- Private squads with revocable invitation codes.
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- 4. GROUP MEMBERSHIP
CREATE TABLE IF NOT EXISTS public.group_members (
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Helper function to safely fetch user group IDs without RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_group_ids(p_user_id UUID)
RETURNS TABLE (group_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT gm.group_id
  FROM public.group_members gm
  WHERE gm.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Group RLS Policies
CREATE POLICY "Members can view their groups"
  ON public.groups FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR id IN (SELECT public.get_user_group_ids(auth.uid()))
  );

CREATE POLICY "Users can create groups"
  ON public.groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Leaders can update their groups"
  ON public.groups FOR UPDATE
  TO authenticated
  USING (
    id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid() AND role = 'leader')
  );

CREATE POLICY "Members can view fellow group members"
  ON public.group_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR group_id IN (SELECT public.get_user_group_ids(auth.uid()))
  );

CREATE POLICY "Users can join group members via RPC or own id"
  ON public.group_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 5. SHARED GROUP BOSSES (RAID TARGETS)
CREATE TABLE IF NOT EXISTS public.group_bosses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  boss_key TEXT NOT NULL,
  name TEXT NOT NULL,
  faction TEXT NOT NULL,
  lore_title TEXT NOT NULL,
  glyph_name TEXT NOT NULL DEFAULT 'skull',
  primary_color TEXT NOT NULL DEFAULT '#FF3838',
  max_hp INTEGER NOT NULL,
  current_hp INTEGER NOT NULL,
  is_defeated BOOLEAN NOT NULL DEFAULT FALSE,
  glory_xp INTEGER NOT NULL DEFAULT 600,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  defeated_at TIMESTAMPTZ
);

ALTER TABLE public.group_bosses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view shared bosses"
  ON public.group_bosses FOR SELECT
  TO authenticated
  USING (
    group_id IN (SELECT public.get_user_group_ids(auth.uid()))
  );

-- 6. COOPERATIVE ATTACK EVENTS (STRIKES)
-- Idempotent log of strikes landed by group members.
-- Raw workout weights, repetitions, and personal notes are KEPT PRIVATE.
CREATE TABLE IF NOT EXISTS public.coop_attacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_boss_id UUID NOT NULL REFERENCES public.group_bosses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  client_set_id TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  attack_name TEXT NOT NULL,
  style_name TEXT NOT NULL,
  damage INTEGER NOT NULL CHECK (damage > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_coop_boss_set UNIQUE (group_boss_id, client_set_id)
);

ALTER TABLE public.coop_attacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view attacks on their boss"
  ON public.coop_attacks FOR SELECT
  TO authenticated
  USING (
    group_boss_id IN (
      SELECT gb.id FROM public.group_bosses gb
      WHERE gb.group_id IN (SELECT public.get_user_group_ids(auth.uid()))
    )
  );

-- 7. STORED PROCEDURES (ATOMIC ACTIONS & IDEMPOTENCY)

-- A. Create Group Helper (Creates group and inserts creator as leader atomically)
CREATE OR REPLACE FUNCTION public.create_crusade_group(group_name TEXT)
RETURNS json AS $$
DECLARE
  new_group_id UUID;
  generated_code TEXT;
BEGIN
  -- Generate cryptographically random 8-character uppercase invite code
  generated_code := upper(substring(encode(gen_random_bytes(6), 'hex') from 1 for 8));
  
  INSERT INTO public.groups (name, created_by, invite_code)
  VALUES (group_name, auth.uid(), generated_code)
  RETURNING id INTO new_group_id;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (new_group_id, auth.uid(), 'leader');

  -- Create initial shared raid boss (e.g., Warboss Skullkrakka, 12,000 HP for groups)
  INSERT INTO public.group_bosses (
    group_id, boss_key, name, faction, lore_title, glyph_name, primary_color, max_hp, current_hp, glory_xp
  ) VALUES (
    new_group_id,
    'raid_ork_warboss',
    'Warboss Skullkrakka (Raid Titan)',
    'Orks',
    'Supreme Greenskin Warlord',
    'bonfire-outline',
    '#FF3838',
    10000,
    10000,
    800
  );

  RETURN json_build_object(
    'group_id', new_group_id,
    'name', group_name,
    'invite_code', generated_code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. Join Group by Invite Code
CREATE OR REPLACE FUNCTION public.join_group_by_code(code TEXT)
RETURNS json AS $$
DECLARE
  target_group RECORD;
BEGIN
  SELECT id, name INTO target_group
  FROM public.groups
  WHERE invite_code = upper(trim(code));

  IF target_group IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired crusade invite code.';
  END IF;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (target_group.id, auth.uid(), 'member')
  ON CONFLICT (group_id, user_id) DO NOTHING;

  RETURN json_build_object(
    'group_id', target_group.id,
    'name', target_group.name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. Revoke & Regenerate Invite Code (Only Leader can invoke)
CREATE OR REPLACE FUNCTION public.regenerate_invite_code(target_group_id UUID)
RETURNS TEXT AS $$
DECLARE
  is_leader BOOLEAN;
  new_code TEXT;
BEGIN
  SELECT (role = 'leader') INTO is_leader
  FROM public.group_members
  WHERE group_id = target_group_id AND user_id = auth.uid();

  IF NOT COALESCE(is_leader, false) THEN
    RAISE EXCEPTION 'Only squad leaders can regenerate the invite code.';
  END IF;

  new_code := upper(substring(encode(gen_random_bytes(6), 'hex') from 1 for 8));

  UPDATE public.groups
  SET invite_code = new_code
  WHERE id = target_group_id;

  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- D. Atomic Attack Contribution with Server-Side Validation & Idempotency
-- Client does NOT set boss HP directly!
CREATE OR REPLACE FUNCTION public.record_coop_attack(
  p_boss_id UUID,
  p_client_set_id TEXT,
  p_exercise_name TEXT,
  p_attack_name TEXT,
  p_style_name TEXT,
  p_damage INTEGER
)
RETURNS json AS $$
DECLARE
  v_boss RECORD;
  v_user_name TEXT;
  v_is_member BOOLEAN;
  v_new_hp INTEGER;
  v_is_slain BOOLEAN := false;
BEGIN
  -- 1. Fetch boss and lock row for atomic update
  SELECT * INTO v_boss
  FROM public.group_bosses
  WHERE id = p_boss_id
  FOR UPDATE;

  IF v_boss IS NULL THEN
    RAISE EXCEPTION 'Shared boss encounter not found.';
  END IF;

  -- 2. Verify caller is a verified member of this boss's group
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = v_boss.group_id AND user_id = auth.uid()
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RAISE EXCEPTION 'Caller is not an active member of this crusade squad.';
  END IF;

  -- 3. Fetch caller warrior callsign
  SELECT display_name INTO v_user_name
  FROM public.profiles
  WHERE id = auth.uid();

  v_user_name := COALESCE(v_user_name, 'Battle-Brother');

  -- 4. Idempotent Insert: Ignore if this client_set_id was already recorded
  BEGIN
    INSERT INTO public.coop_attacks (
      group_boss_id, user_id, user_name, client_set_id,
      exercise_name, attack_name, style_name, damage
    ) VALUES (
      p_boss_id, auth.uid(), v_user_name, p_client_set_id,
      p_exercise_name, p_attack_name, p_style_name, p_damage
    );
  EXCEPTION WHEN unique_violation THEN
    -- Duplicate attack detected; return current state idempotently without double-damaging
    RETURN json_build_object(
      'status', 'duplicate_ignored',
      'current_hp', v_boss.current_hp,
      'is_defeated', v_boss.is_defeated
    );
  END;

  -- 5. Atomically compute new boss health
  v_new_hp := GREATEST(0, v_boss.current_hp - p_damage);
  IF v_new_hp = 0 AND NOT v_boss.is_defeated THEN
    v_is_slain := true;
  ELSE
    v_is_slain := v_boss.is_defeated;
  END IF;

  UPDATE public.group_bosses
  SET current_hp = v_new_hp,
      is_defeated = v_is_slain,
      defeated_at = CASE WHEN v_is_slain AND defeated_at IS NULL THEN timezone('utc'::text, now()) ELSE defeated_at END
  WHERE id = p_boss_id;

  RETURN json_build_object(
    'status', 'attack_recorded',
    'damage_dealt', p_damage,
    'new_hp', v_new_hp,
    'is_defeated', v_is_slain
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. REALTIME REPLICATION PUBLICATION
-- Enables mobile clients to react immediately when friends land strikes.
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_bosses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.coop_attacks;
