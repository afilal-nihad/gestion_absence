import React from 'react';
import { useTranslation } from 'react-i18next';

// Tableau générique simple et responsive
function DataTable({ columns, data, emptyMessage, onRowClick }) {
  const { t } = useTranslation();
  const displayEmpty = emptyMessage || t('common.empty', 'Aucune donnée');

  return (
    <div className="card">
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="empty-cell">
                  {displayEmpty}
                </td>
              </tr>
            )}
            {data.map((row) => (
              <tr
                key={row.id || row.key}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? 'clickable-row' : ''}
              >
                {columns.map((col) => (
                  <td key={col.key}>{col.render ? col.render(row[col.key], row) : row[col.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
