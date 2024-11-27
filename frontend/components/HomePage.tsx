'use client';

import { useState } from 'react';
import ThreadList from '@/components/ThreadList';
import ChatThread from '@/components/ChatThread';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { Menu, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import UserProfile from '@/components/UserProfile';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [selectedThread, setSelectedThread] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    auth.logout();
    // Redirect to login page if needed
    router.push('/auth');
  };

  return (
    <div className="flex h-screen w-full">
      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="m-2">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 flex flex-col">
            <ThreadList
              selectedThread={selectedThread}
              onSelectThread={(thread) => {
                setSelectedThread(thread);
                // Close the sidebar after selecting a thread
                document.body.click(); // This will trigger the Sheet to close
              }}
            />
            <div className="p-4 border-t flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setShowProfile(true)}>
                <User className="w-6 h-6" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-6 h-6" />
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col">
        <ThreadList
          selectedThread={selectedThread}
          onSelectThread={setSelectedThread}
        />
        <div className="p-4 border-t flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setShowProfile(true)}>
            <User className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Chat Thread */}
      {selectedThread ? (
        <div className="flex-1 flex flex-col">
          <div className="border-b p-4 flex items-center">
            <h2 className="text-lg font-semibold">{selectedThread.title}</h2>
          </div>
          <ChatThread threadId={selectedThread.id} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center w-full">
          <p className="text-muted-foreground">Select a chat to get started.</p>
        </div>
      )}

      {/* User Profile Drawer */}
      {showProfile && (
        <UserProfile open={showProfile} onClose={() => setShowProfile(false)} handleLogout={handleLogout}/>
      )}
    </div>
  );
}