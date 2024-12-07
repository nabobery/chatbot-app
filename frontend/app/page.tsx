import HomePage from '@/components/HomePage';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function Page() {
  return (
    <SidebarProvider>
      <HomePage />
    </SidebarProvider>
  )
}