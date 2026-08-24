-- Harden transfer settlement so only completed settlements are applied to wallets.
-- Reject cancellation or failure through this RPC to prevent accidental accounting logic.
CREATE OR REPLACE FUNCTION public.settle_transfer(
  _transfer_id uuid,
  _new_status transfer_status
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _transfer transfers%ROWTYPE;
  _sender_wallet_id uuid;
  _recipient_wallet_id uuid;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF _new_status <> 'completed' THEN
    RAISE EXCEPTION 'Only completed transfers can be settled';
  END IF;

  SELECT * INTO _transfer
  FROM transfers
  WHERE id = _transfer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer not found';
  END IF;

  IF _transfer.status <> 'pending' THEN
    RAISE EXCEPTION 'Transfer is not pending';
  END IF;

  SELECT id INTO _sender_wallet_id
  FROM wallets
  WHERE user_id = _transfer.user_id
    AND currency = _transfer.from_currency
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sender wallet not found for currency %', _transfer.from_currency;
  END IF;

  SELECT id INTO _recipient_wallet_id
  FROM wallets
  WHERE user_id = _transfer.user_id
    AND currency = _transfer.to_currency
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recipient wallet not found for currency %', _transfer.to_currency;
  END IF;

  IF (SELECT balance FROM wallets WHERE id = _sender_wallet_id)
      < _transfer.amount + COALESCE(_transfer.fee, 0) THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  UPDATE transfers
  SET status = 'completed', updated_at = now()
  WHERE id = _transfer_id;

  UPDATE wallets
  SET balance = balance - _transfer.amount - COALESCE(_transfer.fee, 0),
      updated_at = now()
  WHERE id = _sender_wallet_id;

  UPDATE wallets
  SET balance = balance + _transfer.converted_amount,
      updated_at = now()
  WHERE id = _recipient_wallet_id;

  INSERT INTO wallet_transactions
    (user_id, wallet_id, type, amount, status, method, notes)
  VALUES
    (_transfer.user_id, _sender_wallet_id, 'withdrawal',
     _transfer.amount + COALESCE(_transfer.fee, 0), 'approved', 'exchange',
     'Settlement for transfer ' || _transfer_id),
    (_transfer.user_id, _recipient_wallet_id, 'deposit',
     _transfer.converted_amount, 'approved', 'exchange',
     'Settlement for transfer ' || _transfer_id);
END;
$$;

-- Prevent users from editing financial fields or status through the broad pending-update policy.
DROP POLICY IF EXISTS "Users can update their pending transfers" ON public.transfers;

CREATE POLICY "Users can cancel their pending transfers"
ON public.transfers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending'::transfer_status)
WITH CHECK (
  auth.uid() = user_id
  AND status = 'cancelled'::transfer_status
);
