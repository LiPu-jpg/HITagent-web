"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UnifiedScoreItemProps {
  course_code: string;
  course_name?: string;
  campus?: "shenzhen" | "harbin" | "weihai";
  semester?: string;
  year?: number;
  score?: number | string;
  grade?: string;
  credits?: number;
  rank?: string;
  gpa?: number;
  is_pass?: boolean;
  is_retake?: boolean;
}

export function UnifiedScoreItem({
  course_code,
  course_name,
  campus,
  semester,
  year,
  score,
  grade,
  credits,
  rank,
  gpa,
  is_pass,
  is_retake,
}: UnifiedScoreItemProps) {
  const getScoreColor = (s: number | string) => {
    const numScore = typeof s === "string" ? parseFloat(s) : s;
    if (isNaN(numScore)) return "bg-muted";
    if (numScore >= 90) return "bg-green-500";
    if (numScore >= 80) return "bg-green-400";
    if (numScore >= 70) return "bg-yellow-500";
    if (numScore >= 60) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{course_name || course_code}</h3>
            <p className="text-sm text-muted-foreground">{course_code}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {score !== undefined && (
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getScoreColor(score)}`}
              >
                {score}
              </div>
            )}
            {grade && <Badge variant="outline">{grade}</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-4 text-sm">
          {campus && <span className="text-muted-foreground">{campus}</span>}
          {semester && <span>{semester}</span>}
          {year && <span>{year}</span>}
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          {credits !== undefined && <span>学分: {credits}</span>}
          {rank && <span>排名: {rank}</span>}
          {gpa !== undefined && <span>GPA: {gpa.toFixed(2)}</span>}
        </div>
        <div className="flex gap-2">
          {is_pass === false && (
            <Badge variant="destructive">不及格</Badge>
          )}
          {is_retake && (
            <Badge variant="secondary">重修</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
