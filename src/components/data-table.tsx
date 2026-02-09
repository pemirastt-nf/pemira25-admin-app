/* eslint-disable react-hooks/incompatible-library */
"use client"

import * as React from "react"
import {
     ColumnDef,
     ColumnFiltersState,
     SortingState,
     VisibilityState,
     flexRender,
     getCoreRowModel,
     getFilteredRowModel,
     getPaginationRowModel,
     getSortedRowModel,
     useReactTable,
} from "@tanstack/react-table"
import { Check, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
     DropdownMenu,
     DropdownMenuItem,
     DropdownMenuContent,
     DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
     Table,
     TableBody,
     TableCell,
     TableHead,
     TableHeader,
     TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
     columns: ColumnDef<TData, TValue>[]
     data: TData[]
}

export function DataTable<TData, TValue>({
     columns,
     data,
}: DataTableProps<TData, TValue>) {
     const [sorting, setSorting] = React.useState<SortingState>([])
     const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
     const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
     const [rowSelection, setRowSelection] = React.useState({})

     const table = useReactTable({
          data,
          columns,
          onSortingChange: setSorting,
          onColumnFiltersChange: setColumnFilters,
          getCoreRowModel: getCoreRowModel(),
          getPaginationRowModel: getPaginationRowModel(),
          getSortedRowModel: getSortedRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
          onColumnVisibilityChange: setColumnVisibility,
          onRowSelectionChange: setRowSelection,
          state: {
               sorting,
               columnFilters,
               columnVisibility,
               rowSelection,
          },
     })

     return (
          <div className="w-full">
               <div className="flex items-center py-4">
                    <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="ml-auto">
                                   Columns <ChevronDown className="ml-2 h-4 w-4" />
                              </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end" className="w-auto">
                              {table
                                   .getAllColumns()
                                   .filter((column) => column.getCanHide())
                                   .map((column) => {
                                        // Get better display names for columns
                                        const getColumnDisplayName = (id: string) => {
                                             switch(id) {
                                                  case 'nim': return 'NIM'
                                                  case 'name': return 'Nama'
                                                  case 'batch': return 'Angkatan'
                                                  case 'email': return 'Email'
                                                  case 'accessType': return 'Tipe Akses'
                                                  case 'hasVoted': return 'Status Vote'
                                                  case 'actions': return 'Aksi'
                                                  default: return id
                                             }
                                        }
                                        
                                        return (
                                             <DropdownMenuItem
                                                  key={column.id}
                                                  className="flex justify-between items-center px-3 py-2 cursor-pointer"
                                                  onSelect={(e) => {
                                                       e.preventDefault()
                                                       column.toggleVisibility(!column.getIsVisible())
                                                  }}
                                             >
                                                  <span className="text-sm">{getColumnDisplayName(column.id)}</span>
                                                  {column.getIsVisible() && (
                                                       <Check className="h-4 w-4 text-primary" />
                                                  )}
                                             </DropdownMenuItem>
                                        )
                                   })}
                         </DropdownMenuContent>
                    </DropdownMenu>
               </div>
               <div className="rounded-md border">
                    <Table>
                         <TableHeader>
                              {table.getHeaderGroups().map((headerGroup) => (
                                   <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => {
                                             return (
                                                  <TableHead key={header.id}>
                                                       {header.isPlaceholder
                                                            ? null
                                                            : flexRender(
                                                                 header.column.columnDef.header,
                                                                 header.getContext()
                                                            )}
                                                  </TableHead>
                                             )
                                        })}
                                   </TableRow>
                              ))}
                         </TableHeader>
                         <TableBody>
                              {table.getRowModel().rows?.length ? (
                                   table.getRowModel().rows.map((row) => (
                                        <TableRow
                                             key={row.id}
                                             data-state={row.getIsSelected() && "selected"}
                                        >
                                             {row.getVisibleCells().map((cell) => (
                                                  <TableCell key={cell.id}>
                                                       {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext()
                                                       )}
                                                  </TableCell>
                                             ))}
                                        </TableRow>
                                   ))
                              ) : (
                                   <TableRow>
                                        <TableCell
                                             colSpan={columns.length}
                                             className="h-24 text-center"
                                        >
                                             No results.
                                        </TableCell>
                                   </TableRow>
                              )}
                         </TableBody>
                    </Table>
               </div>
               <div className="flex items-center justify-end space-x-2 py-4">
                    <div className="flex-1 text-sm text-muted-foreground">
                         {table.getFilteredSelectedRowModel().rows.length} of{" "}
                         {table.getFilteredRowModel().rows.length} row(s) selected.
                    </div>
                    <div className="space-x-2">
                         <Button
                              variant="outline"
                              size="sm"
                              onClick={() => table.previousPage()}
                              disabled={!table.getCanPreviousPage()}
                         >
                              Previous
                         </Button>
                         <Button
                              variant="outline"
                              size="sm"
                              onClick={() => table.nextPage()}
                              disabled={!table.getCanNextPage()}
                         >
                              Next
                         </Button>
                    </div>
               </div>
          </div>
     )
}