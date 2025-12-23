import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Phone, Mail, Briefcase, ShieldAlert, ShieldCheck, Clock, FileText } from "lucide-react";
import type { TeamMember, EmployeeCertificationSummary, CertificationDetails } from "@/lib/data-service";
import { formatDateToAmerican } from "@/lib/utils";

interface CrewTechnicianProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember | null;
  summaries: EmployeeCertificationSummary[];
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0].length > 0) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return '??'; // Fallback for empty/whitespace-only names
}

function getOverallStatus(certs: CertificationDetails[]) {
  if (!certs || certs.length === 0) {
    return { label: "MISSING DOCS", color: "red", icon: ShieldAlert };
  }
  const hasExpired = certs.some((c) => c.daysLeft < 0);
  const hasExpiringSoon = certs.some((c) => c.daysLeft >= 0 && c.daysLeft <= 30);
  if (hasExpired) return { label: "NON-COMPLIANT", color: "red", icon: ShieldAlert };
  if (hasExpiringSoon) return { label: "ACTION REQUIRED", color: "yellow", icon: Clock };
  return { label: "COMPLIANT", color: "green", icon: ShieldCheck };
}

function CertStatusBadge({ cert }: { cert: CertificationDetails }) {
  const isExpired = cert.daysLeft < 0;
  const isSoon = cert.daysLeft >= 0 && cert.daysLeft <= 30;
  const cls = isExpired
    ? "bg-red-50 text-red-700 border border-red-100"
    : isSoon
      ? "bg-yellow-50 text-yellow-800 border border-yellow-100"
      : "bg-green-50 text-green-800 border border-green-100";
  const label = isExpired ? "EXPIRED" : isSoon ? `DUE IN ${cert.daysLeft} DAYS` : "VALID";
  return <span className={`px-2 py-1 text-[10px] font-mono font-bold uppercase ${cls}`}>{label}</span>;
}

export const CrewTechnicianProfileModal: React.FC<CrewTechnicianProfileModalProps> = ({
  isOpen,
  onClose,
  member,
  summaries,
}) => {
  const certs = useMemo(() => {
    if (!member) return [];
    const found = summaries.find((s) => s.employeeName === member.name);
    return found?.certifications ?? [];
  }, [member, summaries]);

  const status = useMemo(() => getOverallStatus(certs), [certs]);
  const StatusIcon = status.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl p-0 gap-0 bg-white border-2 border-[#050505] shadow-[8px_8px_0px_#0038FF] sm:rounded-none [&>button]:hidden">
        <DialogHeader className="p-6 border-b border-gray-100 bg-gray-50 flex flex-row items-center justify-between">
          <DialogTitle className="font-display text-2xl font-bold uppercase flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0038FF]" />
            Technician Profile
          </DialogTitle>
          <DialogClose className="text-gray-400 hover:text-[#050505] transition-colors">
            <X className="w-6 h-6" />
          </DialogClose>
        </DialogHeader>

        {!member ? (
          <div className="p-6">
            <div className="font-mono text-sm text-gray-600">No technician selected.</div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Header block */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 flex items-center justify-center font-mono font-bold text-lg ${
                    status.color === "green" ? "bg-gray-200 text-gray-700" : "bg-[#050505] text-white"
                  }`}
                >
                  {getInitials(member.name)}
                </div>
                <div>
                  <div className="font-display text-2xl font-bold">{member.name}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge
                      className={`font-mono text-[10px] uppercase ${
                        status.color === "red"
                          ? "bg-red-50 text-red-700 hover:bg-red-50"
                          : status.color === "yellow"
                            ? "bg-yellow-50 text-yellow-800 hover:bg-yellow-50"
                            : "bg-green-50 text-green-800 hover:bg-green-50"
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </Badge>
                    {member.status && (
                      <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 font-mono text-[10px] uppercase">
                        {member.status}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 text-xs font-mono text-gray-500">
                    Joined: {member.created_at ? formatDateToAmerican(member.created_at) : "N/A"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 text-sm">
                {member.role && (
                  <div className="flex items-center gap-2 font-mono text-xs text-gray-700">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span className="font-bold uppercase">{member.role}</span>
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center gap-2 font-mono text-xs text-gray-700">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="font-bold">{member.phone}</span>
                  </div>
                )}
                {member.email && (
                  <div className="flex items-center gap-2 font-mono text-xs text-gray-700">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="font-bold">{member.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Certifications table */}
            <div className="border border-gray-200 bg-white">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="font-mono text-xs font-bold uppercase text-[#0038FF]">{`/// CERTIFICATIONS & LICENSES ///`}</div>
                <div className="font-mono text-[10px] text-gray-500">
                  {certs.length} on file
                </div>
              </div>

              {certs.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="font-display text-lg font-bold uppercase text-gray-900">No certifications on file</div>
                  <div className="mt-2 font-mono text-xs text-gray-600">
                    Upload MA licenses/certs to mark this technician dispatch-ready.
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {certs.map((cert) => (
                    <div key={cert.id} className="p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                      <div className="md:col-span-4">
                        <div className="font-display font-bold text-gray-900 truncate" title={cert.type}>
                          {cert.type}
                        </div>
                        <div className="mt-1">
                          <CertStatusBadge cert={cert} />
                        </div>
                      </div>

                      <div className="md:col-span-3 font-mono text-xs text-gray-700">
                        <div className="text-gray-500 uppercase text-[10px] font-bold">Issued</div>
                        <div>{cert.issueDate ? formatDateToAmerican(cert.issueDate) : "N/A"}</div>
                      </div>

                      <div className="md:col-span-3 font-mono text-xs text-gray-700">
                        <div className="text-gray-500 uppercase text-[10px] font-bold">Expires</div>
                        <div>{cert.expirationDate ? formatDateToAmerican(cert.expirationDate) : "N/A"}</div>
                      </div>

                      <div className="md:col-span-2 font-mono text-xs text-gray-700">
                        <div className="text-gray-500 uppercase text-[10px] font-bold">Priority</div>
                        <div className="uppercase font-bold">
                          {(() => {
                            if (cert.daysLeft < 0 || (cert.daysLeft >= 0 && cert.daysLeft <= 30)) {
                              return "URGENT";
                            }
                            if (cert.daysLeft <= 90) return "MEDIUM";
                            return "LOW";
                          })()}
                        </div>
                      </div>

                      {cert.notes && (
                        <div className="md:col-span-12 font-mono text-xs text-gray-600">
                          <div className="text-gray-500 uppercase text-[10px] font-bold">Notes</div>
                          <div>{cert.notes}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 font-mono rounded-none border-gray-200 hover:bg-gray-50"
                onClick={onClose}
              >
                CLOSE
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};


