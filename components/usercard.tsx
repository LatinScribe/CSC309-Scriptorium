import { User } from "@/utils/types";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
  } from "@/components/ui/hover-card"
import { CalendarIcon, ClockIcon, MailIcon, UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge"

export default function UserCard({ user }: { user: User }) {
    // console.log(user);
    return (
        <HoverCard>
            <HoverCardTrigger>
                <div className="text-primary">
                    @
                    <span className="underline">{user.username}</span>
                </div>
            </HoverCardTrigger>
            <HoverCardContent className='bg-background'>
                <div className="flex flex-row gap-2 items-center">
                    <div className='w-10 h-10 flex items-center justify-center'>
                    { user.avatar ? (
                        <div className="overflow-hidden h-full w-full">
                            <img
                                src={user.avatar}
                                alt={user.username}
                                className="object-cover rounded-full h-full w-full"
                            />
                        </div>
                    ) :
                    <UserIcon />}
                    </div>
                    <div className="flex flex-col gap-2">
                        { user.firstName ? (
                            <div className='text-primary'>
                                {user.firstName}
                                {user.lastName && ` ${user.lastName}`}
                            </div>
                        ) :
                        <div className="text-gray-500">No name</div>}
                        { user.role === "ADMIN" && (
                            <Badge className='w-fit'>Admin</Badge>
                        )}
                        <div className='flex items-center text-gray-500'>
                            <CalendarIcon className='h-4'/>
                            <span>Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown date"}</span>
                        </div>
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    )
}