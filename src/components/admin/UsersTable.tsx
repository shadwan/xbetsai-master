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
import { Id } from "@/convex/_generated/dataModel";

export function UsersTable() {
  const users = useQuery(api.admin.listUsers);
  const updateRole = useMutation(api.admin.updateUserRole);

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

  const handleToggleRole = (
    userId: Id<"users">,
    currentRole: string | undefined
  ) => {
    updateRole({
      userId,
      role: currentRole === "admin" ? "user" : "admin",
    });
  };

  return (
    <div className="rounded-xl border border-border bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Subscription</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user._id}>
              <TableCell className="font-medium text-text-primary">
                {user.name ?? "—"}
              </TableCell>
              <TableCell className="text-text-secondary">
                {user.email ?? "—"}
              </TableCell>
              <TableCell>
                <Badge
                  variant={user.role === "admin" ? "destructive" : "secondary"}
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
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleRole(user._id, user.role)}
                >
                  {user.role === "admin" ? "Demote" : "Make Admin"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
