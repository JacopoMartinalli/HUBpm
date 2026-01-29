import { redirect } from 'next/navigation'

export default function PortalePage() {
  // Redirect alla pagina di login
  // Il middleware gestira' il redirect a dashboard se gia' autenticato
  redirect('/portale/login')
}
