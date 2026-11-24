import { useCallback, useEffect, useState } from 'react'
import type { Singer, SingerPrivate } from '../../data/types'
import { useAuth } from '../../lib/auth'
import { repo } from '../../lib/repo'

export function useMine() {
  const { ready, email } = useAuth()
  const [state, setState] = useState<{ loading: boolean; singer: Singer | null; priv: SingerPrivate | null }>({ loading: true, singer: null, priv: null })
  const load = useCallback(() => {
    if (!email) { setState({ loading: false, singer: null, priv: null }); return }
    repo.mine().then((m) => setState({ loading: false, singer: m?.singer ?? null, priv: m?.priv ?? null })).catch(() => setState({ loading: false, singer: null, priv: null }))
  }, [email])
  useEffect(() => { if (ready) load() }, [ready, load])
  return { ...state, loading: !ready || state.loading, email, reload: load }
}
