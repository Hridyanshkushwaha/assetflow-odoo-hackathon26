export default function DataTable({ columns, rows, onRowClick, emptyMessage = 'No records found' }) {
  if (!rows?.length) {
    return (
      <div className="rounded-lg border border-dashed border-line py-14 text-center text-sm text-ink-faint">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg ring-1 ring-line">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-surface-sunken/80">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-surface-raised">
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-line/80 last:border-0 ${onRowClick ? 'cursor-pointer hover:bg-accent-muted/20' : ''}`}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3.5 text-ink-muted">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
