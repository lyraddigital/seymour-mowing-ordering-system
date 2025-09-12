
import { TableBody, TableRow } from "@mui/material";

import { useData } from "@/app/core/hooks";
import {
  TableColumnContentOptions,
  TableColumnHiddenOptions,
  TableColumnWidthOptions
} from "@/app/core/types";

import DataTableCell from "./data-table-cell";

interface DataTableBodyProps<T> {
  bodyConfiguration: TableColumnContentOptions<T>[];
  hiddenConfiguration?: (TableColumnHiddenOptions | undefined)[];
  widthConfiguration?: (TableColumnWidthOptions | undefined)[]
};

export default function DataTableBody<T>({
  bodyConfiguration,
  hiddenConfiguration,
  widthConfiguration
}: DataTableBodyProps<T>) {
  const data = useData<T>();

  return (
    <TableBody>
      {data.map((item, rowIdx) => (
        <TableRow key={rowIdx}>
          {bodyConfiguration.map((column, colIdx) => {
            const columnHiddenConfig = !!hiddenConfiguration ? hiddenConfiguration[colIdx]: undefined;
            const columnWidthConfig = !!widthConfiguration ? widthConfiguration[colIdx]: undefined;

            return <DataTableCell 
                      key={colIdx}
                      data={item}                      
                      content={column}
                      hiddenConfiguration={columnHiddenConfig}                      
                      widthConfiguration={columnWidthConfig} />;
          })}
        </TableRow>
      ))}
    </TableBody>
  );
}
