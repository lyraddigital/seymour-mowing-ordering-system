import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export default function useUpdateQueryString() {
  const router = useRouter();  

  return useCallback((...queryStringUpdates: { key: string; value: string | number }[]) => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);    

    queryStringUpdates.forEach(({ key, value }) => {
      params.set(key, String(value));
    });

    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router]);
}
