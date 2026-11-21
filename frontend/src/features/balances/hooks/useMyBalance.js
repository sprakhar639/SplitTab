import { useCallback, useEffect, useState } from "react";

import { getMyBalance } from "../balance.service";

export default function useMyBalance(groupId, myId) {
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(
    () =>
      getMyBalance(groupId, myId)
        .then((data) => {
          setBalance(data);
          setError("");
        })
        .catch((err) => setError(err.message)),
    [groupId, myId],
  );

  useEffect(() => {
    if (myId) load();
  }, [myId, load]);

  return { balance, error, reload: load };
}
