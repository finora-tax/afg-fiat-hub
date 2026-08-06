import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Rate {
  id: string;
  from_currency: string;
  to_currency: string;
  buy_rate: number;
  sell_rate: number;
  updated_at: string;
}

export interface Wallet {
  id: string;
  currency: string;
  balance: number;
  frozen_balance: number;
}

export const useExchangeRates = () => {
  const [rates, setRates] = useState<Rate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase.from("exchange_rates").select("*");
      if (active) {
        setRates((data as Rate[]) ?? []);
        setIsLoading(false);
      }
    };
    load();

    const channel = supabase
      .channel("dashboard-rates")
      .on("postgres_changes", { event: "*", schema: "public", table: "exchange_rates" }, load)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { rates, isLoading };
};

export const useWallets = () => {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWallets([]);
      setIsLoading(false);
      return;
    }
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from("wallets")
        .select("id, currency, balance, frozen_balance")
        .eq("user_id", user.id);
      if (active) {
        setWallets((data as Wallet[]) ?? []);
        setIsLoading(false);
      }
    };
    load();

    const channel = supabase
      .channel("dashboard-wallets")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${user.id}` },
        load
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { wallets, isLoading };
};

export const rateFor = (rates: Rate[], from: string, to: string) =>
  rates.find((r) => r.from_currency === from && r.to_currency === to);

/** Approximate value of `amount` of `currency` expressed in AFN. */
export const toAfn = (rates: Rate[], currency: string, amount: number) => {
  if (currency === "AFN") return amount;
  const direct = rateFor(rates, currency, "AFN");
  if (direct) return amount * Number(direct.buy_rate);
  const inverse = rateFor(rates, "AFN", currency);
  if (inverse && Number(inverse.sell_rate) > 0) return amount / Number(inverse.sell_rate);
  return 0;
};
