-- 暗标检测系统 V2 — Supabase 数据库初始化脚本
-- 在 Supabase 控制台 → SQL Editor 中执行此脚本

-- ============================================
-- 1. 用户资料表（扩展 auth.users）
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 自动创建 profile 的触发器
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. 激活记录表
-- ============================================
CREATE TABLE IF NOT EXISTS public.activations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  activation_code TEXT UNIQUE NOT NULL,
  mode TEXT CHECK (mode IN ('time', 'count')) NOT NULL,
  total_count INT,
  remaining_count INT,
  expire_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. 用户自定义地区规则表
-- ============================================
CREATE TABLE IF NOT EXISTS public.custom_regions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. 检测历史表
-- ============================================
CREATE TABLE IF NOT EXISTS public.detection_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  file_name TEXT,
  region_code TEXT,
  overall_result TEXT,
  total_issues INT DEFAULT 0,
  result_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. Row Level Security (RLS)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detection_history ENABLE ROW LEVEL SECURITY;

-- profiles: 用户只能读写自己的
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- activations: 用户只能查看自己的
CREATE POLICY "Users can view own activations" ON public.activations
  FOR SELECT USING (auth.uid() = user_id);

-- custom_regions: 用户可以增删改查自己的
CREATE POLICY "Users can CRUD own regions" ON public.custom_regions
  FOR ALL USING (auth.uid() = user_id);

-- detection_history: 用户可以查看自己的
CREATE POLICY "Users can view own history" ON public.detection_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON public.detection_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. 索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_activations_user ON public.activations(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_regions_user ON public.custom_regions(user_id);
CREATE INDEX IF NOT EXISTS idx_detection_history_user ON public.detection_history(user_id);
CREATE INDEX IF NOT EXISTS idx_detection_history_created ON public.detection_history(created_at DESC);

-- 完成！
SELECT 'Supabase 初始化完成！' AS status;
