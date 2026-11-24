import App from './App'
import { AuthProvider } from './lib/auth'
import { DataProvider, type PublicData } from './lib/data'
import { RouterProvider } from './lib/router'

export default function Root({ path, data }: { path?: string; data?: PublicData }) {
  return <RouterProvider initial={path}><AuthProvider><DataProvider initial={data}><App /></DataProvider></AuthProvider></RouterProvider>
}
