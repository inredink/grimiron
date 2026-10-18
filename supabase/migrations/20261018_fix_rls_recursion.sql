-- ====================================================================
-- GrimIron Hotfix: Eliminate RLS Circular Recursion on group_members
-- ====================================================================

-- 1. Security Definer Helper Function
-- Bypasses RLS recursion by querying group_id directly with elevated privileges.
CREATE OR REPLACE FUNCTION public.get_user_group_ids(p_user_id UUID)
RETURNS TABLE (group_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT gm.group_id
  FROM public.group_members gm
  WHERE gm.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Update Groups Policies
DROP POLICY IF EXISTS "Members can view their groups" ON public.groups;
CREATE POLICY "Members can view their groups"
  ON public.groups FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR id IN (SELECT public.get_user_group_ids(auth.uid()))
  );

-- 3. Update Group Members Policies (Breaks the circular self-query)
DROP POLICY IF EXISTS "Members can view fellow group members" ON public.group_members;
CREATE POLICY "Members can view fellow group members"
  ON public.group_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR group_id IN (SELECT public.get_user_group_ids(auth.uid()))
  );

-- 4. Update Group Bosses Policies
DROP POLICY IF EXISTS "Group members can view shared bosses" ON public.group_bosses;
CREATE POLICY "Group members can view shared bosses"
  ON public.group_bosses FOR SELECT
  TO authenticated
  USING (
    group_id IN (SELECT public.get_user_group_ids(auth.uid()))
  );

-- 5. Update Coop Attacks Policies
DROP POLICY IF EXISTS "Group members can view attacks on their boss" ON public.coop_attacks;
CREATE POLICY "Group members can view attacks on their boss"
  ON public.coop_attacks FOR SELECT
  TO authenticated
  USING (
    group_boss_id IN (
      SELECT gb.id FROM public.group_bosses gb
      WHERE gb.group_id IN (SELECT public.get_user_group_ids(auth.uid()))
    )
  );
