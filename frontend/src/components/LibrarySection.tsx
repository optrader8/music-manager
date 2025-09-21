import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { cn } from '../lib/utils';

interface LibrarySectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  actions?: React.ReactNode;
}

export function LibrarySection({
  title,
  children,
  className,
  collapsible = false,
  defaultExpanded = true,
  actions,
}: LibrarySectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card className={cn('bg-white dark:bg-gray-900 border-none shadow-none', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle
            className={cn(
              'text-xl font-semibold text-gray-900 dark:text-gray-100',
              collapsible && 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400'
            )}
            onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
          >
            <div className="flex items-center space-x-2">
              {collapsible && (
                <span
                  className={cn(
                    'transition-transform duration-200',
                    isExpanded ? 'rotate-90' : 'rotate-0'
                  )}
                >
                  ▶
                </span>
              )}
              <span>{title}</span>
            </div>
          </CardTitle>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      </CardHeader>

      {(!collapsible || isExpanded) && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  );
}
