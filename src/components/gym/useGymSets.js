import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { notifyError } from "@/lib/notify";

/** The current user's strength-training sets, with optimistic add / update / delete. */
export function useGymSets() {
  const { user } = useAuth();
  const email = user?.email;
  const queryClient = useQueryClient();
  const key = ["gym-sets", email];

  const query = useQuery({
    queryKey: key,
    queryFn: () => base44.entities.GymSet.filter({ created_by: email }, "-date", 3000),
    enabled: !!email,
    staleTime: 60 * 1000,
  });

  const optimistic = (apply) => async (vars) => {
    await queryClient.cancelQueries({ queryKey: key });
    const previous = queryClient.getQueryData(key);
    queryClient.setQueryData(key, (old = []) => apply(old, vars));
    return { previous };
  };
  const rollback = (message) => (err, _vars, ctx) => {
    if (ctx?.previous) queryClient.setQueryData(key, ctx.previous);
    notifyError(err, message);
  };
  const settle = () => queryClient.invalidateQueries({ queryKey: key });

  const addSet = useMutation({
    mutationFn: (data) => base44.entities.GymSet.create(data),
    onMutate: optimistic((old, data) => [
      ...old,
      { ...data, id: `temp-${Date.now()}`, created_by: email, created_date: new Date().toISOString(), _pending: true },
    ]),
    onError: rollback("שמירת הסט נכשלה"),
    onSettled: settle,
  });

  const updateSet = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GymSet.update(id, data),
    onMutate: optimistic((old, { id, data }) => old.map(s => (s.id === id ? { ...s, ...data } : s))),
    onError: rollback("עדכון הסט נכשל"),
    onSettled: settle,
  });

  const deleteSet = useMutation({
    mutationFn: (id) => base44.entities.GymSet.delete(id),
    onMutate: optimistic((old, id) => old.filter(s => s.id !== id)),
    onError: rollback("מחיקת הסט נכשלה"),
    onSettled: settle,
  });

  return { sets: query.data || [], isLoading: query.isLoading, error: query.error, addSet, updateSet, deleteSet };
}
