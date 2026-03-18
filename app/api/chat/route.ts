import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

const BACKEND_URL = process.env.AGENT_BACKEND_URL || "http://localhost:8080";
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_API_BASE = process.env.MINIMAX_API_BASE || "https://api.minimaxi.com";
const MINIMAX_MODEL = process.env.MINIMAX_MODEL || "MiniMax-M2.7";

const ASYNC_SKILLS = new Set([
  "rag.ingest",
  "rag.ingest_from_github",
  "rag.intake_manual_folder",
  "rag.sync_to_repo",
  "github.batch_download",
  "crawl4ai.site",
  "pr.preview",
  "pr.submit",
  "data.ingest",
  "data.ingest_batch",
  "aggregator.summarize",
]);

interface SkillResponse {
  ok: boolean;
  output?: unknown;
  job_id?: string;
  error?: {
    code: string;
    message: string;
    retryable?: boolean;
  };
}

interface JobResponse {
  ok: boolean;
  job?: {
    status: "queued" | "running" | "succeeded" | "failed";
    output_json?: unknown;
  };
  error?: {
    code: string;
    message: string;
  };
}

async function invokeSkill(
  skillName: string,
  input: Record<string, unknown>
): Promise<SkillResponse> {
  logger.info(`Invoking skill: ${skillName}`, { input, url: `${BACKEND_URL}/v1/skills/${skillName}:invoke` });

  try {
    const res = await fetch(`${BACKEND_URL}/v1/skills/${skillName}:invoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });

    if (!res.ok) {
      const text = await res.text();
      logger.error(`Skill ${skillName} HTTP error`, { status: res.status, body: text });
      return { ok: false, error: { code: "HTTP_ERROR", message: `HTTP ${res.status}: ${text}` } };
    }

    const data: SkillResponse = await res.json();
    logger.info(`Skill ${skillName} response`, data);
    return data;
  } catch (error) {
    logger.error(`Skill ${skillName} network error`, { error: String(error) });
    return {
      ok: false,
      error: { code: "NETWORK_ERROR", message: error instanceof Error ? error.message : String(error) }
    };
  }
}

async function pollJob(
  jobId: string,
  maxAttempts = 60,
  intervalMs = 2000
): Promise<JobResponse> {
  logger.info(`Polling job: ${jobId}`);

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${BACKEND_URL}/v1/jobs/${jobId}`);
      const data: JobResponse = await res.json();

      if (!data.ok) {
        logger.error(`Job ${jobId} error`, data.error);
        return data;
      }

      const status = data.job?.status;
      logger.info(`Job ${jobId} status: ${status}`);

      if (status === "succeeded" || status === "failed") {
        return data;
      }
    } catch (error) {
      logger.error(`Job ${jobId} poll error`, { error: String(error) });
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return {
    ok: false,
    error: { code: "TIMEOUT", message: "Job polling timed out" },
  };
}

async function callSkill(
  skillName: string,
  input: Record<string, unknown>
): Promise<{ output: unknown }> {
  const response: SkillResponse = await invokeSkill(skillName, input);

  if (!response.ok) {
    throw new Error(
      `Skill ${skillName} failed: ${response.error?.code} - ${response.error?.message}`
    );
  }

  if (ASYNC_SKILLS.has(skillName) && response.job_id) {
    const jobResult = await pollJob(response.job_id);
    if (!jobResult.ok) {
      throw new Error(
        `Job ${response.job_id} failed: ${jobResult.error?.message}`
      );
    }
    return { output: jobResult.job?.output_json };
  }

  return { output: response.output };
}

const TOOLS = {
  search: {
    description: "统一搜索入口，支持 rag/brave/course/hit_teacher 等多种数据源",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "搜索查询词" },
        sources: { type: "array", items: { type: "string" } },
        top_k: { type: "number" },
        summarize: { type: "boolean" },
      },
      required: ["query"],
    },
  },
  "data.ingest": {
    description: "统一数据接入入口",
    parameters: {
      type: "object",
      properties: {
        source_type: { type: "string", enum: ["github", "manual", "annas", "arxiv", "crawl"] },
        source_name: { type: "string" },
        content: { type: "string" },
        store_in_cos: { type: "boolean" },
        auto_ingest_rag: { type: "boolean" },
        overwrite: { type: "boolean" },
      },
      required: ["source_type"],
    },
  },
  "data.ingest_batch": {
    description: "批量数据接入",
    parameters: { type: "object", properties: { items: { type: "array" } }, required: ["items"] },
  },
  "rag.query": {
    description: "向量检索问答",
    parameters: { type: "object", properties: { query: { type: "string" }, top_k: { type: "number" }, collection: { type: "string" } }, required: ["query"] },
  },
  "rag.ingest": {
    description: "RAG数据接入（异步）",
    parameters: { type: "object", properties: { repo: { type: "string" }, ref: { type: "string" }, path_prefix: { type: "string" }, collection: { type: "string" }, dry_run: { type: "boolean" }, max_files: { type: "number" }, max_chunks: { type: "number" } } },
  },
  "rag.ingest_from_github": {
    description: "从GitHub仓库批量下载并接入RAG（异步）",
    parameters: { type: "object", properties: { repos: { type: "array" }, max_file_size: { type: "number" }, max_repo_size_mb: { type: "number" }, convert_to_md: { type: "boolean" }, push_to_github: { type: "boolean" }, target_repo: { type: "string" }, store_in_cos: { type: "boolean" } } },
  },
  "rag.intake_manual_folder": {
    description: "手动目录入库到RAG intake（异步）",
    parameters: { type: "object", properties: { folder_path: { type: "string" }, collection: { type: "string" } }, required: ["folder_path"] },
  },
  "rag.sync_to_repo": {
    description: "同步RAG数据到目标仓库（异步）",
    parameters: { type: "object", properties: { repo: { type: "string" }, branch: { type: "string" }, daily: { type: "boolean" } }, required: ["repo"] },
  },
  "pr.preview": {
    description: "预览课程改动",
    parameters: { type: "object", properties: { campus: { type: "string", enum: ["shenzhen", "harbin", "weihai"] }, course_code: { type: "string" }, ops: { type: "array" } }, required: ["campus", "course_code"] },
  },
  "pr.submit": {
    description: "提交PR",
    parameters: { type: "object", properties: { campus: { type: "string", enum: ["shenzhen", "harbin", "weihai"] }, course_code: { type: "string" }, ops: { type: "array" }, idempotency_key: { type: "string" } }, required: ["campus", "course_code"] },
  },
  "pr.lookup": {
    description: "查看PR状态",
    parameters: { type: "object", properties: { campus: { type: "string", enum: ["shenzhen", "harbin", "weihai"] }, number: { type: "number" }, pr: { type: "string" } } },
  },
  "courses.search": {
    description: "课程搜索",
    parameters: { type: "object", properties: { keyword: { type: "string" }, campus: { type: "string", enum: ["shenzhen", "harbin", "weihai"] } }, required: ["keyword"] },
  },
  "course.read": {
    description: "读取课程README",
    parameters: { type: "object", properties: { campus: { type: "string", enum: ["shenzhen", "harbin", "weihai"] }, course_code: { type: "string" }, include_toml: { type: "boolean" } }, required: ["campus", "course_code"] },
  },
  "hit.teacher": {
    description: "查找单个老师信息",
    parameters: { type: "object", properties: { name: { type: "string" } }, required: ["name"] },
  },
  "hit.teachers": {
    description: "批量查找老师信息",
    parameters: { type: "object", properties: { names: { type: "array", items: { type: "string" } } } },
  },
  "crawl4ai.page": {
    description: "抓取单个网页内容",
    parameters: { type: "object", properties: { url: { type: "string" }, content_filter: { type: "string" }, output_format: { type: "string" }, wait_for: { type: "string" }, exclude_paths: { type: "array", items: { type: "string" } } }, required: ["url"] },
  },
  "crawl4ai.site": {
    description: "全站抓取（异步）",
    parameters: { type: "object", properties: { url: { type: "string" }, max_pages: { type: "number" }, content_filter: { type: "string" }, output_format: { type: "string" } }, required: ["url"] },
  },
  "crawl4ai.status": {
    description: "查询抓取任务状态",
    parameters: { type: "object", properties: { job_id: { type: "string" } }, required: ["job_id"] },
  },
  "github.batch_download": {
    description: "批量下载GitHub仓库内容（异步）",
    parameters: { type: "object", properties: { repos: { type: "array" }, max_file_size: { type: "number" }, max_repo_size_mb: { type: "number" }, convert_to_md: { type: "boolean" } }, required: ["repos"] },
  },
  "document.convert": {
    description: "文档转换为Markdown格式",
    parameters: { type: "object", properties: { content_base64: { type: "string" }, filename: { type: "string" }, chunking_strategy: { type: "string", enum: ["by_title", "by_size", "none"] } }, required: ["content_base64", "filename"] },
  },
  "cos.save_file": {
    description: "保存文件到COS",
    parameters: { type: "object", properties: { key: { type: "string" }, content: { type: "string" }, content_type: { type: "string" } }, required: ["key", "content"] },
  },
  "cos.delete_file": {
    description: "删除COS文件",
    parameters: { type: "object", properties: { key: { type: "string" } }, required: ["key"] },
  },
  "cos.list_files": {
    description: "列出COS文件",
    parameters: { type: "object", properties: { prefix: { type: "string" }, max_keys: { type: "number" } } },
  },
  "cos.get_presigned_url": {
    description: "获取COS预签名URL",
    parameters: { type: "object", properties: { key: { type: "string" }, expires_in: { type: "number" } }, required: ["key"] },
  },
  "cos.get_quota": {
    description: "获取COS存储配额",
    parameters: { type: "object", properties: {} },
  },
  "files.upload": {
    description: "上传文件到COS存储",
    parameters: { type: "object", properties: { key: { type: "string" }, content_base64: { type: "string" }, content_type: { type: "string" }, files: { type: "array" } } },
  },
  "files.download": {
    description: "从COS下载文件",
    parameters: { type: "object", properties: { key: { type: "string" } }, required: ["key"] },
  },
  "mcp.list_servers": {
    description: "列出已注册的MCP服务器",
    parameters: { type: "object", properties: {} },
  },
  "mcp.list_tools": {
    description: "列出MCP服务器上的工具",
    parameters: { type: "object", properties: { server: { type: "string" } }, required: ["server"] },
  },
  "mcp.call_tool": {
    description: "调用MCP工具",
    parameters: { type: "object", properties: { server: { type: "string" }, tool: { type: "string" }, arguments: { type: "object" } }, required: ["server", "tool"] },
  },
  "aggregator.summarize": {
    description: "AI-powered搜索结果汇总（异步）",
    parameters: { type: "object", properties: { query: { type: "string" }, results: { type: "array" }, style: { type: "string", enum: ["concise", "detailed"] }, max_length: { type: "number" }, language: { type: "string" } }, required: ["query", "results"] },
  },
  echo: {
    description: "测试回显",
    parameters: { type: "object", properties: { message: { type: "string" } }, required: ["message"] },
  },
  sleep_echo: {
    description: "延迟测试",
    parameters: { type: "object", properties: { message: { type: "string" }, delay_ms: { type: "number" } }, required: ["message"] },
  },
};

export async function POST(request: NextRequest) {
  try {
    if (!MINIMAX_API_KEY) {
      logger.error("MINIMAX_API_KEY not configured");
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const { messages } = await request.json();
    logger.info("Chat request", { messageCount: messages?.length, lastMessage: messages?.[messages?.length - 1] });

    const response = await fetch(`${MINIMAX_API_BASE}/v1/text/chatcompletion_v2`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MINIMAX_API_KEY}`,
      },
      body: JSON.stringify({
        model: MINIMAX_MODEL,
        messages: [
          {
            role: "system",
            content: `你是一个智能助手，调用后端技能完成用户任务。
2026-03-18 PR归一化规则：
- 禁用 append_course_review 操作
- 用户表达"对子课程评价"时，使用 append_course_section_item
- 用户表达"评价某位老师"时，使用 add_course_teacher_review
- 深圳(shenzhen)支持 multi-project 操作，哈工大本部/威海(harbin/weihai)不支持`,
          },
          ...messages,
        ],
        tools: Object.entries(TOOLS).map(([name, tool]) => ({
          type: "function",
          function: {
            name,
            description: tool.description,
            parameters: tool.parameters,
          },
        })),
        tool_choice: "auto",
      }),
    });

    const data = await response.json();
    logger.info("MiniMax response", data);

    if (data.choices?.[0]?.message?.tool_calls) {
      const toolCalls = data.choices[0].message.tool_calls;
      logger.info("Tool calls received", { count: toolCalls.length });

      const toolResults: { name: string; result: unknown }[] = [];

      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        logger.info(`Executing tool: ${toolName}`, { args });

        try {
          const { output } = await callSkill(toolName, args);
          toolResults.push({ name: toolName, result: output });
          logger.info(`Tool ${toolName} success`, { output });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error";
          toolResults.push({ name: toolName, result: { error: errorMsg } });
          logger.error(`Tool ${toolName} failed`, { error: errorMsg });
        }
      }

      logger.info("Making follow-up request to MiniMax with tool results");

      const toolMessages = [
        ...messages,
        data.choices[0].message,
      ];

      for (const toolCall of toolCalls) {
        const toolResult = toolResults.find((r) => r.name === toolCall.function.name);
        toolMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          tool_name: toolCall.function.name,
          content: JSON.stringify(toolResult?.result || { error: "No result" }),
        });
      }

      const toolResponse = await fetch(`${MINIMAX_API_BASE}/v1/text/chatcompletion_v2`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${MINIMAX_API_KEY}`,
        },
        body: JSON.stringify({
          model: MINIMAX_MODEL,
          messages: [
            {
              role: "system",
              content: `你是一个智能助手，调用后端技能完成用户任务。
2026-03-18 PR归一化规则：
- 禁用 append_course_review 操作
- 用户表达"对子课程评价"时，使用 append_course_section_item
- 用户表达"评价某位老师"时，使用 add_course_teacher_review
- 深圳(shenzhen)支持 multi-project 操作，哈工大本部/威海(harbin/weihai)不支持`,
            },
            ...toolMessages,
          ],
        }),
      });

      const finalData = await toolResponse.json();
      logger.info("Final response", finalData);
      return NextResponse.json(finalData);
    }

    return NextResponse.json(data);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    logger.error("Chat handler error", { error: errorMsg, stack: error instanceof Error ? error.stack : undefined });
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
