import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import Root from './Root'

const el = document.getElementById('root')!
const app = <StrictMode><Root /></StrictMode>
// Pages are pre-rendered to HTML for SEO; hydrate when that HTML is present.
if (el.firstElementChild && import.meta.env.VITE_HASH !== '1') hydrateRoot(el, app)
else createRoot(el).render(app)
