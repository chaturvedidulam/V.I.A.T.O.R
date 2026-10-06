import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";

import { getFirebaseAuth } from "@/lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      return onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
        setUser(nextUser);
        setLoading(false);
      });
    } catch {
      setUser(null);
      setLoading(false);
      return undefined;
    }
  }, []);

  return { user, loading };
}
