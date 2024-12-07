import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useAuth } from '@/hooks/useAuth'
import { LogOut } from 'lucide-react'
import Image from 'next/image'
import DefaultAvatar from '../public/default-avatar.svg'

interface UserProfileProps {
  open: boolean
  onClose: () => void
  handleLogout: () => void
}

export default function UserProfile({ open, onClose,handleLogout }: UserProfileProps) {
  const auth = useAuth()

  // const handleLogout = async () => {
  //   auth.logout()
  //   onClose()
  // }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle>User Profile</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col items-center space-y-4 mt-6">
          <Image
            src={auth.user?.image_url || DefaultAvatar}
            alt="User Avatar"
            width={80}
            height={80}
            className="rounded-full"
          />
          <h2 className="text-xl font-semibold">{auth.user?.name}</h2>
          <p className="text-muted-foreground">{auth.user?.email}</p>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-red-600 hover:text-red-800"
          >
            <LogOut />
            <span>Logout</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}