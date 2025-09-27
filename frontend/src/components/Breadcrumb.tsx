import React from 'react';

interface BreadcrumbProps {
  path: string;
  onNavigate: (newPath: string) => void;
}

export default function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
  const parts = path.split('/').filter(Boolean);
  const crumbs = [
    { label: 'Root', path: '/' },
    ...parts.map((part, index) => ({
      label: part,
      path: '/' + parts.slice(0, index + 1).join('/'),
    })),
  ];

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      {crumbs.map((crumb, index) => (
        <React.Fragment key={crumb.path}>
          {index > 0 && <span>/</span>}
          <button
            className="hover:text-blue-600 hover:underline"
            onClick={() => onNavigate(crumb.path)}
          >
            {crumb.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
