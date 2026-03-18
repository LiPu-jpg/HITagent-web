"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UnifiedCourseItemProps {
  course_code: string;
  name?: string;
  campus?: "shenzhen" | "harbin" | "weihai";
  teachers?: string[];
  aliases?: string[];
  credits?: number;
  semester?: string;
  department?: string;
  description?: string;
  rating?: number;
  review_count?: number;
}

export function UnifiedCourseItem({
  course_code,
  name,
  campus,
  teachers,
  aliases,
  credits,
  semester,
  department,
  description,
  rating,
  review_count,
}: UnifiedCourseItemProps) {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{name || course_code}</h3>
            <p className="text-sm text-muted-foreground">{course_code}</p>
          </div>
          <div className="flex gap-2">
            {campus && <Badge variant="outline">{campus}</Badge>}
            {rating !== undefined && (
              <Badge variant="secondary">★ {rating.toFixed(1)}</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {teachers && teachers.length > 0 && (
          <p className="text-sm">
            <span className="font-medium">教师:</span> {teachers.join(", ")}
          </p>
        )}
        {aliases && aliases.length > 0 && (
          <p className="text-sm">
            <span className="font-medium">别名:</span> {aliases.join(", ")}
          </p>
        )}
        <div className="flex gap-4 text-sm text-muted-foreground">
          {credits !== undefined && <span>学分: {credits}</span>}
          {semester && <span>学期: {semester}</span>}
          {department && <span>院系: {department}</span>}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
        {review_count !== undefined && (
          <p className="text-xs text-muted-foreground">
            {review_count} 条评价
          </p>
        )}
      </CardContent>
    </Card>
  );
}
