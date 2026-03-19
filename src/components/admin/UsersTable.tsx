"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Id } from "@/convex/_generated/dataModel";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";

export function UsersTable() {
  const users = useQuery(api.admin.listUsers);
  const updateRole = useMutation(api.admin.updateUserRole);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q) ||
        u.subscription?.status?.toLowerCase().includes(q)
    );
  }, [users, search]);

  if (!users) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-lg border border-border bg-surface"
          />
        ))}
      </div>
    );
  }

  const handleToggleRole = async (
    userId: Id<"users">,
    currentRole: string | undefined
  ) => {
    setLoadingId(userId);
    try {
      await updateRole({
        userId,
        role: currentRole === "admin" ? "user" : "admin",
      });
    } catch (err) {
      console.error("Failed to update role:", err);
    } finally {
      setLoadingId(null);
    }
  };

  const formatDate = (ms: number) => {
    return new Date(ms).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
        <p className="text-sm text-text-secondary">
          {search
            ? `${filteredUsers.length} of ${users.length} users`
            : `${users.length} user${users.length !== 1 ? "s" : ""}`}
        </p>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Subscription</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-8 text-center text-text-secondary"
              >
                {search ? "No users match your search." : "No users found."}
              </TableCell>
            </TableRow>
          ) : (
            filteredUsers.map((user) => {
              const isLoading = loadingId === user._id;
              return (
                <TableRow key={user._id}>
                  <TableCell className="font-medium text-text-primary">
                    {user.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {user.email ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role === "admin" ? "destructive" : "secondary"
                      }
                    >
                      {user.role ?? "user"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.subscription?.status === "active"
                          ? "default"
                          : "outline"
                      }
                    >
                      {user.subscription?.status ?? "none"}
                    </Badge>
                    {user.subscription?.cancelAtPeriodEnd && (
                      <span className="ml-1 text-xs text-red-400">
                        (canceling)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    {user._creationTime ? formatDate(user._creationTime) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isLoading}
                      onClick={() => handleToggleRole(user._id, user.role)}
                    >
                      {isLoading
                        ? "Updating…"
                        : user.role === "admin"
                          ? "Demote"
                          : "Make Admin"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
