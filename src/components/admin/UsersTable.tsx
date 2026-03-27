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
import { Search, Plus } from "lucide-react";

export function UsersTable() {
  const users = useQuery(api.admin.listUsers);
  const updateRole = useMutation(api.admin.updateUserRole);
  const grantAccess = useMutation(api.admin.grantManualAccess);
  const revokeAccess = useMutation(api.admin.revokeManualAccess);
  const createUser = useMutation(api.admin.createManualUser);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Create user form
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newGrantAccess, setNewGrantAccess] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q) ||
        u.subscription?.status?.toLowerCase().includes(q) ||
        (u.manualSubscription?.status === "active" && "manual".includes(q))
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
    setLoadingId(`role-${userId}`);
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

  const handleGrantAccess = async (userId: Id<"users">) => {
    setLoadingId(`grant-${userId}`);
    try {
      await grantAccess({ userId });
    } catch (err) {
      console.error("Failed to grant access:", err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleRevokeAccess = async (userId: Id<"users">) => {
    setLoadingId(`revoke-${userId}`);
    try {
      await revokeAccess({ userId });
    } catch (err) {
      console.error("Failed to revoke access:", err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      await createUser({
        email: newEmail,
        name: newName || undefined,
        grantAccess: newGrantAccess,
        note: newNote || undefined,
      });
      setNewEmail("");
      setNewName("");
      setNewNote("");
      setShowCreate(false);
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (ms: number) => {
    return new Date(ms).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getAccessStatus = (user: (typeof users)[number]) => {
    if (user.subscription?.status === "active") return "paid";
    if (user.subscription?.status === "trialing") return "trialing";
    if (user.manualSubscription?.status === "active") return "manual";
    if (user.subscription?.status === "canceled") return "canceled";
    return "none";
  };

  const accessBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default">paid</Badge>;
      case "trialing":
        return <Badge variant="secondary">trialing</Badge>;
      case "manual":
        return (
          <Badge className="bg-purple-400/10 text-purple-400 border-purple-400/20">
            manual
          </Badge>
        );
      case "canceled":
        return <Badge variant="outline">canceled</Badge>;
      default:
        return <Badge variant="outline">none</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Create user form */}
      {showCreate && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="text-sm font-bold text-text-primary mb-3">
            Add User Manually
          </h3>
          <form onSubmit={handleCreateUser} className="space-y-3">
            {createError && (
              <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {createError}
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Email (required)"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="h-8 text-sm"
              />
              <Input
                placeholder="Name (optional)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <Input
              placeholder="Note (optional) — e.g. &quot;Beta tester&quot;, &quot;Partner&quot;"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="h-8 text-sm"
            />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  checked={newGrantAccess}
                  onChange={(e) => setNewGrantAccess(e.target.checked)}
                  className="rounded"
                />
                Grant pro access (no payment required)
              </label>
              <div className="ml-auto flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={creating}>
                  {creating ? "Creating…" : "Create User"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <p className="text-sm text-text-secondary">
              {search
                ? `${filteredUsers.length} of ${users.length} users`
                : `${users.length} user${users.length !== 1 ? "s" : ""}`}
            </p>
            {!showCreate && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => setShowCreate(true)}
              >
                <Plus className="mr-1 h-3 w-3" />
                Add User
              </Button>
            )}
          </div>
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
              <TableHead>Access</TableHead>
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
                  {search
                    ? "No users match your search."
                    : "No users found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const access = getAccessStatus(user);
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
                          user.role === "admin"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {user.role ?? "user"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {accessBadge(access)}
                      {user.subscription?.cancelAtPeriodEnd && (
                        <span className="ml-1 text-xs text-red-400">
                          (canceling)
                        </span>
                      )}
                      {user.manualSubscription?.note && access === "manual" && (
                        <span className="ml-1 text-xs text-text-tertiary">
                          ({user.manualSubscription.note})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-text-secondary">
                      {user._creationTime
                        ? formatDate(user._creationTime)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={loadingId === `role-${user._id}`}
                        onClick={() =>
                          handleToggleRole(user._id, user.role)
                        }
                      >
                        {loadingId === `role-${user._id}`
                          ? "…"
                          : user.role === "admin"
                            ? "Demote"
                            : "Make Admin"}
                      </Button>
                      {access !== "paid" &&
                        access !== "trialing" &&
                        access !== "manual" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-purple-400 hover:text-purple-300"
                            disabled={
                              loadingId === `grant-${user._id}`
                            }
                            onClick={() =>
                              handleGrantAccess(user._id)
                            }
                          >
                            {loadingId === `grant-${user._id}`
                              ? "…"
                              : "Grant Access"}
                          </Button>
                        )}
                      {access === "manual" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                          disabled={
                            loadingId === `revoke-${user._id}`
                          }
                          onClick={() =>
                            handleRevokeAccess(user._id)
                          }
                        >
                          {loadingId === `revoke-${user._id}`
                            ? "…"
                            : "Revoke"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
