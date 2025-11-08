import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

interface Column {
  label: string;
  accessor: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DynamicTableProps {
  data: any[];
  columns: Column[];
}


export const DynamicTable: React.FC<DynamicTableProps> = ({ data, columns }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.accessor}>{column.label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, index) => (
          <TableRow key={index}>
            {columns.map((column) => (
              <TableCell key={column.accessor}>
                {column.render
                  ? column.render(row[column.accessor], row)
                  : row[column.accessor]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};


export const TableCustom = DynamicTable; 