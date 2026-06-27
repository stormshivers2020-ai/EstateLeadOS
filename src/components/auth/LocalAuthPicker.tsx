"use client";

import { useRouter } from "next/navigation";
import { loginAsRole, LOCAL_PREVIEW_USERS } from "@/lib/local/localAuth";
import type { UserRoleId } from "@/lib/constants/roles";

const ROLE_LABELS: Record<UserRoleId, string> = {
  solo_investor: "Solo Investor",
  acquisition_manager: "Acquisition Manager",
  team_member: "Team Member",
  compliance_reviewer: "Compliance Reviewer",
  org_admin: "Organization Admin",
  scs_nova_admin: "SCS Nova Admin",
  scs_nova_super_admin: "SCS Nova Super Admin",
};

export function LocalAuthPicker() {
  const router = useRouter();

  function continueAs(role: UserRoleId) {
    loginAsRole(role);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mt-8 space-y-3">
      <p className="text-center text-xs font-medium uppercase tracking-widest text-slate-500">
        Local Preview — Continue as Role
      </p>
      <div className="grid gap-2">
        {LOCAL_PREVIEW_USERS.map((user) => (
          <button
            key={user.id}
            type="button"
            onClick={() => continueAs(user.role)}
            className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-left text-sm transition-colors hover:border-sky-600/40 hover:bg-sky-950/20"
          >
            <div>
              <p className="font-medium text-slate-200">{ROLE_LABELS[user.role]}</p>
              <p className="text-xs text-slate-500">{user.organizationName}</p>
            </div>
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-amber-200/80">
        Authentication is simulated for development preview.
      </p>
    </div>
  );
}
