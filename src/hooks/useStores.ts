"use client";

import { useState, useEffect, useCallback } from "react";
import { STORES as DEFAULT_STORES, type Store } from "@/lib/stores";

export function useStores() {
  const [stores, setStores] = useState<Store[]>(DEFAULT_STORES);
  const [loading, setLoading] = useState(true);

  const fetchStores = useCallback(async () => {
    try {
      const res = await fetch("/api/stores");
      if (res.ok) {
        const data = await res.json();
        setStores(data.stores);
      }
    } catch {
      // Fallback to defaults on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const addStore = async (id: string, name: string) => {
    const res = await fetch("/api/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }
    await fetchStores();
  };

  const updateStore = async (id: string, name: string) => {
    const res = await fetch(`/api/stores/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }
    await fetchStores();
  };

  const deleteStore = async (id: string) => {
    const res = await fetch(`/api/stores/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }
    await fetchStores();
  };

  return { stores, loading, addStore, updateStore, deleteStore, refetch: fetchStores };
}
