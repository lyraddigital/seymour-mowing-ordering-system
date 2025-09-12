import { useRouter, useSearchParams } from 'next/navigation';

export default function useUpdateQueryString() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (key: string, value: string | number) => {
    const params = new URLSearchParams(searchParams.toString());
    
    params.set(key, String(value));
    router.replace(`?${params.toString()}`, { scroll: false });
  }
}
