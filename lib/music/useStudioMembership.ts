import useSWR from "swr";

export type ViewerMembership = {
  active: boolean;
  expiresAt: string | null;
  startedAt: string | null;
  planName: string | null;
  isFounding: boolean;
};

type PlansPayload = {
  plans: unknown[];
  viewerMembership: ViewerMembership | null;
};

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  const body = await res.json();
  if (!res.ok || !body.success) return null;
  return body.data as PlansPayload;
};

export function useStudioMembership() {
  const { data, mutate, isLoading } = useSWR(
    "/api/music/membership-plans",
    fetcher,
    { revalidateOnFocus: false }
  );
  return {
    membership: data?.viewerMembership ?? null,
    isLoading,
    mutate,
  };
}
