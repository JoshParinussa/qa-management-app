"use client";

import { useActionState, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/types";

type AssignableUser = {
  id: string;
  name: string;
  email: string;
};

type ProjectMemberFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  users: AssignableUser[];
};

function UserCombobox({
  users,
  value,
  onValueChange,
}: {
  users: AssignableUser[];
  value: string;
  onValueChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedUser = users.find((user) => user.id === value);
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(query));
  }, [search, users]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-labelledby="userId-label userId-value"
          className="h-9 w-full justify-between px-3 font-normal shadow-sm"
        >
          <span id="userId-value" className={cn("truncate", !selectedUser && "text-muted-foreground")}>
            {selectedUser ? `${selectedUser.name} (${selectedUser.email})` : "Pilih user"}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <div className="border-b p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama atau email..."
              className="h-9 pl-8"
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {filteredUsers.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">User tidak ditemukan.</p>
          ) : (
            filteredUsers.map((user) => {
              const selected = user.id === value;
              return (
                <button
                  key={user.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onValueChange(user.id);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
                >
                  <Check className={cn("size-4 shrink-0", selected ? "opacity-100" : "opacity-0")} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{user.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ProjectMemberForm({ action, users }: ProjectMemberFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [selectedUserId, setSelectedUserId] = useState("");

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      {state.error ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive sm:w-full">{state.error}</p> : null}
      <div className="flex-1 space-y-2">
        <Label id="userId-label">User</Label>
        <input name="userId" type="hidden" value={selectedUserId} />
        <UserCombobox users={users} value={selectedUserId} onValueChange={setSelectedUserId} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="assignmentRole">Role</Label>
        <select
          id="assignmentRole"
          name="assignmentRole"
          defaultValue="QA_MEMBER"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="QA_MEMBER">QA Member</option>
          <option value="QA_PIC">QA PIC</option>
        </select>
      </div>
      <Button type="submit" disabled={pending || !selectedUserId}>
        {pending ? "Assigning..." : "Assign"}
      </Button>
    </form>
  );
}
