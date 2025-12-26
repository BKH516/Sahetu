import React from 'react';

export const Table = ({ children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props}>{children}</table>
);

export const TableHeader = ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className="bg-gray-50 dark:bg-gray-800" {...props}>{children}</thead>
);

export const TableBody = ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700" {...props}>{children}</tbody>
);

export const TableRow = ({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" {...props}>{children}</tr>
);

export const TableCell = ({ children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200" {...props}>{children}</td>
);

export const TableHead = ({ children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" {...props}>{children}</th>
);

export const TableFooter = ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tfoot className="bg-gray-50 dark:bg-gray-800" {...props}>{children}</tfoot>
);

export const TableCaption = ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
  <caption className="text-sm text-gray-500 dark:text-gray-400 p-2" {...props}>{children}</caption>
); 