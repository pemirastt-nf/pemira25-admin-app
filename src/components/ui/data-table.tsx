/* eslint-disable react-hooks/incompatible-library */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
     DropdownMenu,
     DropdownMenuCheckboxItem,
     DropdownMenuContent,
     DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
     toolbar?: React.ReactNode
     isLoading?: boolean
     loadingRows?: number
}

export function DataTable<TData, TValue>({
     columns,
     data,
     toolbar,
     isLoading = false,
     loadingRows = 10,
}: DataTableProps<TData, TValue>) {
     const [sorting, setSorting] = React.useState<SortingState>([])
     const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
     const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
     const [rowSelection, setRowSelection] = React.useState({})

     const table = useReactTable({
          data: isLoading ? [] : data,
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
          <div className="w-full space-y-4">
               <div className="flex items-center justify-between">
                    <div className="flex flex-1 items-center space-x-2">
                         {toolbar}
                    </div>
                    <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="ml-auto">
                                   Columns <ChevronDown className="ml-2 h-4 w-4" />
                              </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end">
                              {table
                                   .getAllColumns()
                                   .filter((column: any) => column.getCanHide())
                                   .map((column: any) => {
                                        return (
                                             <DropdownMenuCheckboxItem
                                                  key={column.id}
                                                  className="capitalize"
                                                  checked={column.getIsVisible()}
                                                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                             >
                                                  {column.id}
                                             </DropdownMenuCheckboxItem>
                                        )
                                   })}
                         </DropdownMenuContent>
                    </DropdownMenu>
               </div>
               <div className="rounded-md border">
                    <Table>
                         <TableHeader>
                              {table.getHeaderGroups().map((headerGroup: any) => (
                                   <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header: any) => {
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
                              {isLoading ? (
                                   Array.from({ length: loadingRows }).map((_, index) => (
                                        <TableRow key={index}>
                                             {columns.map((_, cellIndex) => (
                                                  <TableCell key={cellIndex}>
                                                       <div className="h-4 bg-muted animate-pulse rounded" />
                                                  </TableCell>
                                             ))}
                                        </TableRow>
                                   ))
                              ) : table.getRowModel().rows?.length ? (
                                   table.getRowModel().rows.map((row: any) => {
                                        const isDeleted = !!(row.original as { deletedAt?: string }).deletedAt
                                        return (
                                             <TableRow
                                                  key={row.id}
                                                  data-state={row.getIsSelected() && "selected"}
                                                  className={isDeleted ? "opacity-50 bg-destructive/5 hover:bg-destructive/10" : ""}
                                             >
                                                  {row.getVisibleCells().map((cell: any) => (
                                                       <TableCell key={cell.id}>
                                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                       </TableCell>
                                                  ))}
                                             </TableRow>
                                        )
                                   })
                              ) : (
                                   <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
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