import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export function MetadataPage(): JSX.Element {
  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Metadata Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Edit and manage music metadata</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">
              Metadata editing features will be available soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
