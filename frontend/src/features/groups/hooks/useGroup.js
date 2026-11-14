import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../../../context/AuthContext";
import { getGroup, getMembers } from "../group.service";

// Loads a group with its members, and works out which member is me.
export default function useGroup(groupId) {
  const { user, updateUser } = useAuth();
  const [state, setState] = useState({
    group: null,
    members: [],
    loading: true,
    error: "",
  });

  const reload = useCallback(async () => {
    try {
      const [group, members] = await Promise.all([
        getGroup(groupId),
        getMembers(groupId),
      ]);

      setState({ group, members, loading: false, error: "" });
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }));
    }
  }, [groupId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const me = state.members.find((member) =>
    user?.id
      ? member.id === user.id
      : Boolean(user?.email) && member.email === user.email,
  );

  useEffect(() => {
    if (me && (me.id !== user?.id || me.name !== user?.name)) {
      updateUser({ id: me.id, name: me.name, email: me.email });
    }
  }, [me, user?.id, user?.name, updateUser]);

  const setGroup = useCallback((changes) => {
    setState((prev) => ({ ...prev, group: { ...prev.group, ...changes } }));
  }, []);

  return {
    ...state,
    myId: user?.id ?? null,
    isAdmin: me?.role?.toUpperCase() === "ADMIN",
    reload,
    setGroup,
  };
}
