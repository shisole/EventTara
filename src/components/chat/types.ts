export interface MiniEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string;
  price: number;
  cover_image_url: string | null;
}

export interface ToolCallInfo {
  name: string;
  status: "running" | "done";
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  events?: MiniEvent[];
  totalCount?: number;
  filterUrl?: string;
  isStreaming?: boolean;
  toolCalls?: ToolCallInfo[];
}

export interface ChatResponse {
  reply: string;
  events: MiniEvent[];
  totalCount: number;
  filterUrl: string;
  error?: string;
}
