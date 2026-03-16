
-- Fix: Users can manipulate financial amounts on pending transfers
-- Drop the overly permissive update policy
DROP POLICY IF EXISTS "Users can update their pending transfers" ON public.transfers;

-- Create restricted policy: users can only cancel their pending transfers (set status to cancelled)
-- They cannot modify financial fields
CREATE POLICY "Users can cancel their pending transfers"
ON public.transfers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending'::transfer_status)
WITH CHECK (
  auth.uid() = user_id 
  AND status = 'cancelled'::transfer_status
  AND amount = (SELECT amount FROM public.transfers t WHERE t.id = id)
  AND converted_amount = (SELECT converted_amount FROM public.transfers t WHERE t.id = id)
  AND exchange_rate = (SELECT exchange_rate FROM public.transfers t WHERE t.id = id)
  AND fee = (SELECT fee FROM public.transfers t WHERE t.id = id)
);
