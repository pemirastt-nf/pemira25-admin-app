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
    header: "Akses",
    cell: ({ row }: { row: any }) => {
      const accessType = row.getValue("accessType") as string
      return (
        <Badge 
          variant={accessType === 'offline' ? 'secondary' : 'default'}
          className={`${
            accessType === 'offline' 
              ? "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200" 
              : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
          }`}
        >
          {accessType === 'offline' ? "Offline (TPS)" : "Online (Web)"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "hasVoted",
    header: "Status Voting",
    cell: ({ row }: { row: any }) => {
      const hasVoted = row.getValue("hasVoted") as boolean
      return (
        <Badge 
          variant={hasVoted ? 'default' : 'outline'}
          className={`${
            hasVoted
              ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200 text-wra" 
              : "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200"
          }`}
        >
          {hasVoted ? "Sudah Memilih" : "Belum Memilih"}
        </Badge>
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