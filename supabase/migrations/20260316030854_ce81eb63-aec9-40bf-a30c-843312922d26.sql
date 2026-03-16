
-- Drop the overly permissive user update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create a function that allows users to update only non-sensitive fields
CREATE OR REPLACE FUNCTION public.update_own_profile(
  _full_name text DEFAULT NULL,
  _phone text DEFAULT NULL,
  _address text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    full_name = COALESCE(_full_name, full_name),
    phone = COALESCE(_phone, phone),
    address = COALESCE(_address, address),
    updated_at = now()
  WHERE user_id = auth.uid();
END;
$$;

-- Create restricted update policy: users can only update their own non-kyc fields
-- We still need a basic update policy for the RPC to work, but restrict with WITH CHECK
CREATE POLICY "Users can update own non-sensitive fields"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND kyc_status = (SELECT kyc_status FROM public.profiles WHERE user_id = auth.uid()));
