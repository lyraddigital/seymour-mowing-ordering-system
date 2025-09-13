
import { TableBody, TableRow } from "@mui/material";

import { useData } from "@/app/core/hooks";
import {
  TableColumnAlignmentOptions,
  TableColumnContentOptions,
  TableColumnHiddenOptions,
  TableColumnWidthOptions
} from "@/app/core/types";

import DataTableCell from "./data-table-cell";

interface DataTableBodyProps<T> {
  contentConfigurations: TableColumnContentOptions<T>[];
  alignmentConfigurations?: TableColumnAlignmentOptions[];
  hiddenConfigurations?: TableColumnHiddenOptions[];
  widthConfigurations?: TableColumnWidthOptions[]
};

export default function DataTableBody<T>({
  contentConfigurations,
  alignmentConfigurations,
  hiddenConfigurations,
  widthConfigurations
}: DataTableBodyProps<T>) {
  const data = useData<T>();

  return (
    <TableBody>
      {data.map((item, rowIdx) => (
        <TableRow key={rowIdx}>
          {contentConfigurations.map((content, colIdx) => {
            const columnHiddenConfig = !!hiddenConfigurations ? hiddenConfigurations[colIdx]: undefined;
            const columnWidthConfig = !!widthConfigurations ? widthConfigurations[colIdx]: undefined;
            const alignmentConfig = !!alignmentConfigurations ? alignmentConfigurations[colIdx]: undefined;

            return <DataTableCell 
                      key={colIdx}
                      data={item}                      
                      content={content}
                      alignmentConfiguration={alignmentConfig}
                      hiddenConfiguration={columnHiddenConfig}                      
                      widthConfiguration={columnWidthConfig} />;
          })}
        </TableRow>
      ))}
    </TableBody>
  );
}
