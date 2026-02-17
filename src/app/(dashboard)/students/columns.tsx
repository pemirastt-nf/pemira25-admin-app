/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Mail, 
  CheckCircle2, 
  Trash2, 
  Undo2, 
  XCircle, 
  Pencil,
  ArrowUpDown
} from "lucide-react"

export type Student = {
  id: string
  nim: string
  name: string
  email?: string
  batch?: string
  accessType: 'online' | 'offline'
  hasVoted: boolean
  deletedAt?: string
  role?: string
}

interface ColumnActionsProps {
  onEdit: (student: Student) => void
  onDelete: (student: Student) => void
  onRestore: (student: Student) => void
  onPermanentDelete: (student: Student) => void
  onResendOtp: (student: Student) => void
  onMarkAttendance: (nim: string) => void
  getCooldownRemaining: (nim: string) => number
  isSuperAdmin: boolean
}

const getMajorFromNim = (nim: string) => {
  if (!nim || nim.length < 5) return "-";
  
  if (nim.startsWith("01101")) return "Sistem Informasi";
  if (nim.startsWith("01102")) return "Teknik Informatika";
  if (nim.startsWith("01103")) return "Bisnis Digital";
  
  return "Lainnya";
};

export const createColumns = (actions: ColumnActionsProps): ColumnDef<Student>[] => [
  {
    accessorKey: "nim",
    header: ({ column }: { column: any }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 hover:bg-transparent"
        >
          NIM
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }: { row: any }) => {
      const isDeleted = !!row.original.deletedAt
      return (
        <div className="font-medium">
          {row.getValue("nim")}
          {isDeleted && (
            <Badge variant="destructive" className="ml-2 text-[10px] px-1">
              DELETED
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "name",
    header: ({ column }: { column: any }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 hover:bg-transparent"
        >
          Nama
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }: { row: any }) => <div className="capitalize">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "major",
    header: ({ column }: { column: any }) => (
       <div className="text-center">Jurusan</div>
    ),
    cell: ({ row }: { row: any }) => {
      const nim = row.original.nim;
      const major = getMajorFromNim(nim);
      
      let badgeColor = "bg-gray-100 text-gray-800 border-gray-200";
      // SI -> Orange
      if (major === "Sistem Informasi") badgeColor = "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200";
      // TI -> Blue 
      if (major === "Teknik Informatika") badgeColor = "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200";
      // BD -> Red
      if (major === "Bisnis Digital") badgeColor = "bg-red-100 text-red-800 border-red-200 hover:bg-red-200";

      return (
        <div className="flex justify-center">
          <Badge variant="outline" className={`${badgeColor} w-35 justify-center text-center py-1 whitespace-nowrap`}>
            {major}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "batch",
    header: "Angkatan",
    cell: ({ row }: { row: any }) => <div>{row.getValue("batch") || "-"}</div>,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }: { row: any }) => <div className="lowercase">{row.getValue("email")}</div>,
  },
  {
    accessorKey: "accessType",
    header: ({ column }: { column: any }) => (
       <div className="text-center">Akses</div>
    ),
    cell: ({ row }: { row: any }) => {
      const accessType = row.getValue("accessType") as string
      return (
        <div className="flex justify-center">
          <Badge 
            variant="outline"
            className={`${
              accessType === 'offline' 
                ? "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200" 
                : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
            } w-30 justify-center py-1 whitespace-nowrap`}
          >
            {accessType === 'offline' ? "Offline (TPS)" : "Online (Web)"}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "hasVoted",
    header: ({ column }: { column: any }) => (
       <div className="text-center">Status Voting</div>
    ),
    cell: ({ row }: { row: any }) => {
      const hasVoted = row.getValue("hasVoted") as boolean
      return (
        <div className="flex justify-center">
          <Badge 
            variant="outline"
            className={`${
              hasVoted
                ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200" 
                : "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200"
            } w-32.5 justify-center py-1 whitespace-nowrap`}
          >
            {hasVoted ? "Sudah Memilih" : "Belum Memilih"}
          </Badge>
        </div>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }: { row: any }) => {
      const student = row.original
      const isDeleted = !!student.deletedAt
      const cooldown = actions.getCooldownRemaining(student.nim)

      return (
        <div className="flex items-center justify-end gap-1">
          {!student.hasVoted && !isDeleted && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => actions.onResendOtp(student)}
              disabled={cooldown > 0}
              title={cooldown > 0 ? `Tunggu ${cooldown}d` : "Kirim Ulang OTP"}
            >
              {cooldown > 0 ? (
                <span className="text-xs font-mono">{cooldown}s</span>
              ) : (
                <Mail className="h-4 w-4" />
              )}
            </Button>
          )}
          {!student.hasVoted && !isDeleted && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={() => actions.onMarkAttendance(student.nim)}
              title="Tandai Hadir (Offline)"
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
          {!isDeleted && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => actions.onEdit(student)}
              title="Edit Data"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {actions.isSuperAdmin && !isDeleted && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => actions.onDelete(student)}
              title="Hapus Data (Soft Delete)"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {actions.isSuperAdmin && isDeleted && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => actions.onRestore(student)}
                title="Pulihkan Data (Restore)"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-red-700 hover:text-red-800 hover:bg-red-100"
                onClick={() => actions.onPermanentDelete(student)}
                title="Hapus Permanen"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      )
    },
  },
]