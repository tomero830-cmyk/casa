import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { notifyError } from "@/lib/notify";

/** The current user's saved strength-workout templates (e.g. "Workout A"). */
export function useGymTemplates() {
  const { user } = useAuth();
  const email = user?.email;
  const queryClient = useQueryClient();
  const key = ["gym-templates", email];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

  const query = useQuery({
    queryKey: key,
    queryFn: () => base44.entities.GymTemplate.filter({ created_by: email }, "order", 50),
    enabled: !!email,
    retry: false,
  });

  const save = useMutation({
    mutationFn: ({ id, data }) => (id ? base44.entities.GymTemplate.update(id, data) : base44.entities.GymTemplate.create(data)),
    onSuccess: invalidate,
    onError: (err) => notifyError(err, "שמירת התוכנית נכשלה"),
  });

  const remove = useMutation({
    mutationFn: (id) => base44.entities.GymTemplate.delete(id),
    onSuccess: invalidate,
    onError: (err) => notifyError(err, "מחיקת התוכנית נכשלה"),
  });

  const templates = [...(query.data || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.name).localeCompare(String(b.name)));
  return { templates, isLoading: query.isLoading, error: query.error, save, remove };
}
