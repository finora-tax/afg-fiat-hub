
-- Fix the self-referential bug in transfer cancellation policy
DROP POLICY IF EXISTS "Users can cancel their pending transfers" ON public.transfers;

CREATE POLICY "Users can cancel their pending transfers"
ON public.transfers
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = user_id) AND (status = 'pending'::transfer_status)
)
WITH CHECK (
  (auth.uid() = user_id)
  AND (status = 'cancelled'::transfer_status)
  AND (amount = (SELECT t.amount FROM transfers t WHERE t.id = transfers.id))
  AND (converted_amount = (SELECT t.converted_amount FROM transfers t WHERE t.id = transfers.id))
  AND (exchange_rate = (SELECT t.exchange_rate FROM transfers t WHERE t.id = transfers.id))
  AND (fee = (SELECT t.fee FROM transfers t WHERE t.id = transfers.id))
);
