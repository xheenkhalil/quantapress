import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DashboardHeaderProps {
  user: {
    name: string;
    email?: string;
    avatarUrl?: string;
  };
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  // Get initials from name or fallback to 'U'
  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-sm px-6 py-3">
      <div className="flex items-center justify-end gap-4">
        <div className="flex flex-col items-end">
          <span className="text-sm font-semibold text-slate-900">{user.name || 'Admin'}</span>
          <span className="text-xs text-slate-500">{user.email}</span>
        </div>
        <Avatar>
          <AvatarImage src={user.avatarUrl} alt={user.name} />
          <AvatarFallback className="bg-maroon-100 text-maroon-700 font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
