
-- Fix the RLS bug on transfers cancellation policy
DROP POLICY IF EXISTS "Users can cancel their pending transfers" ON public.transfers;
CREATE POLICY "Users can cancel their pending transfers"
ON public.transfers
FOR UPDATE
TO authenticated
USING ((auth.uid() = user_id) AND (status = 'pending'::transfer_status))
WITH CHECK (
  (auth.uid() = user_id) 
  AND (status = 'cancelled'::transfer_status) 
  AND (amount = (SELECT t.amount FROM transfers t WHERE t.id = transfers.id)) 
  AND (converted_amount = (SELECT t.converted_amount FROM transfers t WHERE t.id = transfers.id)) 
  AND (exchange_rate = (SELECT t.exchange_rate FROM transfers t WHERE t.id = transfers.id)) 
  AND (fee = (SELECT t.fee FROM transfers t WHERE t.id = transfers.id))
);

-- Create wallets table
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  frozen_balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, currency),
  CONSTRAINT positive_balance CHECK (balance >= 0),
  CONSTRAINT positive_frozen CHECK (frozen_balance >= 0)
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallets" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all wallets" ON public.wallets FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage wallets" ON public.wallets FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Auto-create wallets for new users
CREATE OR REPLACE FUNCTION public.create_user_wallets()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.wallets (user_id, currency) VALUES 
    (NEW.id, 'AFN'),
    (NEW.id, 'USD'),
    (NEW.id, 'EUR');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_wallets
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_user_wallets();

-- Create wallet_transactions table for deposit/withdrawal tracking
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  method TEXT DEFAULT 'cash' CHECK (method IN ('cash', 'wire', 'hawala')),
  notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet transactions" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own wallet transactions" ON public.wallet_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all wallet transactions" ON public.wallet_transactions FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage wallet transactions" ON public.wallet_transactions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create fee_configs table
CREATE TABLE public.fee_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  currency_pair TEXT NOT NULL,
  fee_type TEXT NOT NULL DEFAULT 'fixed' CHECK (fee_type IN ('fixed', 'percentage', 'tiered')),
  fixed_fee NUMERIC DEFAULT 0,
  percentage_fee NUMERIC DEFAULT 0,
  tiers JSONB DEFAULT '[]'::jsonb,
  min_fee NUMERIC DEFAULT 0,
  max_fee NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(currency_pair)
);

ALTER TABLE public.fee_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view fee configs" ON public.fee_configs FOR SELECT USING (true);
CREATE POLICY "Admins can manage fee configs" ON public.fee_configs FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default fee configs
INSERT INTO public.fee_configs (currency_pair, fee_type, percentage_fee) VALUES
  ('AFN-USD', 'percentage', 1.0),
  ('AFN-EUR', 'percentage', 1.5),
  ('USD-AFN', 'percentage', 1.0),
  ('EUR-AFN', 'percentage', 1.5),
  ('AFN-IRR', 'percentage', 2.0),
  ('IRR-AFN', 'percentage', 2.0);

-- Fee calculation function
CREATE OR REPLACE FUNCTION public.calculate_fee(
  _currency_pair TEXT,
  _amount NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _config fee_configs%ROWTYPE;
  _fee NUMERIC := 0;
  _tier JSONB;
BEGIN
  SELECT * INTO _config FROM fee_configs WHERE currency_pair = _currency_pair AND is_active = true LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN _amount * 0.01; -- default 1%
  END IF;
  
  IF _config.fee_type = 'fixed' THEN
    _fee := _config.fixed_fee;
  ELSIF _config.fee_type = 'percentage' THEN
    _fee := _amount * (_config.percentage_fee / 100);
  ELSIF _config.fee_type = 'tiered' THEN
    FOR _tier IN SELECT * FROM jsonb_array_elements(_config.tiers)
    LOOP
      IF _amount >= (_tier->>'min_amount')::NUMERIC AND 
         (_tier->>'max_amount' IS NULL OR _amount <= (_tier->>'max_amount')::NUMERIC) THEN
        _fee := _amount * ((_tier->>'percentage')::NUMERIC / 100);
        EXIT;
      END IF;
    END LOOP;
  END IF;
  
  -- Apply min/max
  IF _config.min_fee IS NOT NULL AND _fee < _config.min_fee THEN
    _fee := _config.min_fee;
  END IF;
  IF _config.max_fee IS NOT NULL AND _fee > _config.max_fee THEN
    _fee := _config.max_fee;
  END IF;
  
  RETURN _fee;
END;
$$;

-- Updated_at triggers
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallet_transactions_updated_at BEFORE UPDATE ON public.wallet_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fee_configs_updated_at BEFORE UPDATE ON public.fee_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
