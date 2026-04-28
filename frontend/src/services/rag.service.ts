import axios from "axios";

const ragClient = axios.create({
	baseURL: "/rag",
	timeout: 120000,
	headers: {
		"Content-Type": "application/json",
	},
});

export interface RagChatResponse {
	answer: string;
}

export const ragService = {
	async chat(message: string, history: { role: string; content: string }[] = []): Promise<RagChatResponse> {
		const { data } = await ragClient.post<RagChatResponse>("/chat", { message, history });
		return data;
	},

	async health(): Promise<{ status: string }> {
		const { data } = await ragClient.get("/health");
		return data;
	},
};

