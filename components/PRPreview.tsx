"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, FileText } from "lucide-react";

interface PRPreviewProps {
  campus?: "shenzhen" | "harbin" | "weihai";
  course_code?: string;
  course_name?: string;
  branch?: string;
  base_commit?: string;
  operations?: Array<{
    op: string;
    title?: string;
    content?: string;
    section_title?: string;
    lecturer_name?: string;
    teacher_name?: string;
    item?: {
      content?: string;
    };
  }>;
  preview_url?: string;
  pr_url?: string;
  pr_number?: number;
  status?: "pending" | "submitted" | "error";
  message?: string;
}

export function PRPreview({
  campus,
  course_code,
  course_name,
  branch,
  base_commit,
  operations = [],
  preview_url,
  pr_url,
  pr_number,
  status = "pending",
  message,
}: PRPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <div>
              <h3 className="font-semibold">
                {status === "submitted" ? "PR 已提交" : "PR 预览"}
              </h3>
              {course_code && (
                <p className="text-sm text-muted-foreground">
                  {course_name || course_code}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Badge
              variant={
                status === "submitted"
                  ? "default"
                  : status === "error"
                    ? "destructive"
                    : "secondary"
              }
            >
              {status === "pending" && "待提交"}
              {status === "submitted" && "已提交"}
              {status === "error" && "错误"}
            </Badge>
            {campus && <Badge variant="outline">{campus}</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {branch && (
          <p className="text-sm">
            <span className="font-medium">分支:</span> {branch}
          </p>
        )}
        {base_commit && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">基准:</span> {base_commit.slice(0, 8)}
          </p>
        )}

        {operations.length > 0 && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              操作列表 ({operations.length})
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              {operations.map((op, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg bg-muted/50 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {op.op}
                    </Badge>
                    {op.title && (
                      <span className="font-medium">{op.title}</span>
                    )}
                  </div>
                  {op.content && (
                    <p className="mt-1 text-muted-foreground line-clamp-2">
                      {op.content}
                    </p>
                  )}
                  {op.section_title && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      章节: {op.section_title}
                    </p>
                  )}
                  {op.lecturer_name && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      讲师: {op.lecturer_name}
                    </p>
                  )}
                  {op.teacher_name && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      老师: {op.teacher_name}
                    </p>
                  )}
                  {op.item?.content && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      内容: {op.item.content}
                    </p>
                  )}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}

        <div className="flex gap-2 pt-2">
          {preview_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={preview_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" />
                预览
              </a>
            </Button>
          )}
          {pr_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={pr_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" />
                查看 PR #{pr_number}
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
