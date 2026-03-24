
-- 1. Fix: Add restrictive INSERT policy on user_roles so only admins can insert
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);

-- 2. Atomic exchange settlement function
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
  -- Only admins can call this
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Lock the transfer row
  SELECT * INTO _transfer FROM transfers WHERE id = _transfer_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer not found';
  END IF;
  
  IF _transfer.status != 'pending' THEN
    RAISE EXCEPTION 'Transfer is not pending';
  END IF;

  -- Update transfer status
  UPDATE transfers SET status = _new_status, updated_at = now() WHERE id = _transfer_id;

  -- If approved, settle wallets atomically
  IF _new_status = 'completed' THEN
    -- Get sender wallet (from_currency)
    SELECT id INTO _sender_wallet_id FROM wallets 
      WHERE user_id = _transfer.user_id AND currency = _transfer.from_currency
      FOR UPDATE;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Sender wallet not found for currency %', _transfer.from_currency;
    END IF;

    -- Deduct from sender (amount + fee)
    UPDATE wallets 
      SET balance = balance - _transfer.amount - COALESCE(_transfer.fee, 0), updated_at = now()
      WHERE id = _sender_wallet_id;
    
    -- Check no negative balance
    IF (SELECT balance FROM wallets WHERE id = _sender_wallet_id) < 0 THEN
      RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- Credit recipient wallet (to_currency with converted_amount)
    SELECT id INTO _recipient_wallet_id FROM wallets 
      WHERE user_id = _transfer.user_id AND currency = _transfer.to_currency
      FOR UPDATE;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Recipient wallet not found for currency %', _transfer.to_currency;
    END IF;

    UPDATE wallets 
      SET balance = balance + _transfer.converted_amount, updated_at = now()
      WHERE id = _recipient_wallet_id;

    -- Log wallet transactions
    INSERT INTO wallet_transactions (user_id, wallet_id, type, amount, status, method, notes)
    VALUES 
      (_transfer.user_id, _sender_wallet_id, 'withdrawal', _transfer.amount + COALESCE(_transfer.fee, 0), 'approved', 'exchange', 'Settlement for transfer ' || _transfer_id),
      (_transfer.user_id, _recipient_wallet_id, 'deposit', _transfer.converted_amount, 'approved', 'exchange', 'Settlement for transfer ' || _transfer_id);
  END IF;
END;
$$;
