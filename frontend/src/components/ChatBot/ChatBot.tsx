import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { ragService } from "../../services/rag.service";
import CookShareLogo from "./CookShareLogo";

interface Message {
	id: number;
	role: "user" | "assistant";
	content: string;
	timestamp: Date;
}

const SUGGESTIONS = [
	"Donne-moi une recette de carbonade flamande",
	"Quels ingredients pour un risotto ?",
	"Adapte la recette du poulet pour 6 personnes",
	"Liste-moi les recettes d'entrees",
];

const formatTime = (date: Date) =>
	date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

const ChatBot = () => {
	const [isOpen, setIsOpen] = useState(false);

	const initialMessage: Message = {
		id: 0,
		role: "assistant",
		content:
			"Bonjour ! Je suis l'assistant **CookShare**. Posez-moi vos questions sur les recettes !",
		timestamp: new Date(),
	};

	const [messages, setMessages] = useState<Message[]>([initialMessage]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isClearing, setIsClearing] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const clearChat = () => {
		if (isLoading) return;
		setIsClearing(true);
		setTimeout(() => {
			setMessages([{ ...initialMessage, timestamp: new Date() }]);
			setInput("");
			setIsClearing(false);
			inputRef.current?.focus();
		}, 400);
	};

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	useEffect(() => {
		if (isOpen) {
			inputRef.current?.focus();
		}
	}, [isOpen]);

	const sendMessage = async (text?: string) => {
		const messageText = text || input.trim();
		if (!messageText || isLoading) return;

		const userMsg: Message = {
			id: Date.now(),
			role: "user",
			content: messageText,
			timestamp: new Date(),
		};
		setMessages((prev) => [...prev, userMsg]);
		setInput("");
		setIsLoading(true);

		try {
			const history = [...messages, userMsg]
				.filter((m) => m.id !== 0)
				.map((m) => ({ role: m.role, content: m.content }));
			const response = await ragService.chat(messageText, history);
			const botMsg: Message = {
				id: Date.now() + 1,
				role: "assistant",
				content: response.answer,
				timestamp: new Date(),
			};
			setMessages((prev) => [...prev, botMsg]);
		} catch (error) {
			console.error("Chat error:", error);
			setMessages((prev) => [
				...prev,
				{
					id: Date.now(),
					role: "assistant",
					content: "Sorry, an error occurred. Please try again later.",
					timestamp: new Date(),
				},
			]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	};

	return (
		<>
			{/* RESPONSIVE FIX: Floating bubble — offset above mobile bottom nav */}
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="fixed bottom-[72px] md:bottom-4 right-4 z-50
					w-12 h-12 sm:w-14 sm:h-14
					rounded-full bg-gradient-to-br from-orange-400 to-orange-600
					hover:from-orange-500 hover:to-orange-700
					text-white shadow-lg shadow-orange-500/30
					flex items-center justify-center
					transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
				aria-label="Ouvrir le chat"
			>
				{isOpen ? (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-5 w-5 sm:h-6 sm:w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				) : (
					<CookShareLogo size={28} />
				)}
			</button>

			{/* RESPONSIVE FIX: Chat window — fullscreen on mobile, offset above bottom nav on small */}
			{isOpen && (
				<div
					className="fixed z-50
						inset-0 sm:inset-auto
						sm:bottom-20 sm:right-4
						md:bottom-22 md:right-6
						sm:w-[360px] md:w-[400px] lg:w-[420px]
						sm:h-[500px] md:h-[540px] lg:h-[580px]
						sm:max-h-[calc(100vh-6rem)]
						bg-[var(--cook-bg)] sm:rounded-2xl
						shadow-2xl shadow-black/40
						sm:border sm:border-white/10
						flex flex-col overflow-hidden
						animate-[slideUp_0.3s_ease-out]"
				>
					{/* Header */}
					<div className="flex items-center gap-3 px-4 py-3 bg-[var(--cook-bg-elevated)] border-b border-white/10 shrink-0">
						<div className="relative">
							<div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
								<CookShareLogo size={20} />
							</div>
							<span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--cook-bg-elevated)]" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-white font-semibold text-sm truncate">
								<span className="text-orange-400">Cook</span>Share AI
							</p>
							<p className="text-gray-400 text-xs">
								En ligne
							</p>
						</div>
						{/* New conversation button */}
						{messages.length > 1 && (
							<button
								onClick={clearChat}
								disabled={isLoading || isClearing}
								className="group relative flex items-center gap-1.5 text-gray-400 hover:text-orange-400
									transition-all duration-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40
									px-2 py-1.5 rounded-lg hover:bg-orange-500/10 active:scale-95"
								title="Nouvelle conversation"
								aria-label="Nouvelle conversation"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className={`h-4 w-4 transition-transform duration-300 ${isClearing ? 'animate-spin' : 'group-hover:rotate-90'}`}
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={2}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M12 4v16m8-8H4"
									/>
								</svg>
								<span className="hidden sm:inline text-xs font-medium">Nouveau</span>
							</button>
						)}
						<button
							onClick={() => setIsOpen(false)}
							className="text-gray-400 hover:text-white transition cursor-pointer p-1"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						</button>
					</div>

					{/* Messages area */}
					<div className={`flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-3 chatbot-scrollbar transition-all duration-300 ${isClearing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
						{messages.map((msg) => (
							<div
								key={msg.id}
								className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"
									}`}
							>
								{/* Avatar for assistant */}
								{msg.role === "assistant" && (
									<div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shrink-0 mb-5">
										<CookShareLogo size={14} />
									</div>
								)}

								<div
									className={`flex flex-col max-w-[80%] sm:max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"
										}`}
								>
									<div
										className={`px-3 py-2 text-sm leading-relaxed ${msg.role === "user"
											? "bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl rounded-br-sm"
											: "bg-[var(--cook-bg-surface)] text-gray-100 rounded-2xl rounded-bl-sm border border-white/5"
											}`}
									>
										{msg.role === "assistant" ? (
											<div className="chatbot-markdown">
												<ReactMarkdown>{msg.content}</ReactMarkdown>
											</div>
										) : (
											msg.content
										)}
									</div>
									<span className="text-[10px] text-gray-500 mt-1 px-1">
										{formatTime(msg.timestamp)}
									</span>
								</div>
							</div>
						))}

						{/* Loading indicator */}
						{isLoading && (
							<div className="flex items-end gap-2">
								<div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shrink-0">
									<CookShareLogo size={14} />
								</div>
								<div className="bg-[var(--cook-bg-surface)] px-4 py-3 rounded-2xl rounded-bl-sm border border-white/5">
									<div className="flex gap-1.5">
										<span className="w-2 h-2 bg-orange-400/60 rounded-full animate-bounce [animation-delay:0ms]" />
										<span className="w-2 h-2 bg-orange-400/60 rounded-full animate-bounce [animation-delay:150ms]" />
										<span className="w-2 h-2 bg-orange-400/60 rounded-full animate-bounce [animation-delay:300ms]" />
									</div>
								</div>
							</div>
						)}

						<div ref={messagesEndRef} />
					</div>

					{/* Suggestions (shown only at start) */}
					{messages.length <= 1 && !isLoading && (
						<div className="px-3 sm:px-4 pb-2 shrink-0">
							<div className="flex flex-wrap gap-1.5 sm:gap-2">
								{SUGGESTIONS.map((s, i) => (
									<button
										key={i}
										onClick={() => sendMessage(s)}
										className="text-xs bg-[var(--cook-bg-surface)] text-gray-300 hover:bg-orange-500/20
											hover:text-orange-300 hover:border-orange-500/30
											px-3 py-1.5 rounded-full transition cursor-pointer
											border border-white/5"
									>
										{s}
									</button>
								))}
							</div>
						</div>
					)}

					{/* Input bar */}
					<div className="px-3 sm:px-4 py-3 bg-[var(--cook-bg-elevated)] border-t border-white/10 shrink-0">
						<div className="flex items-center gap-2 bg-[var(--cook-bg-surface)] rounded-full px-4 py-2 border border-white/5 focus-within:border-orange-500/40 transition-colors">
							<input
								ref={inputRef}
								type="text"
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Posez votre question..."
								disabled={isLoading}
								className="flex-1 bg-transparent text-white text-sm placeholder-gray-500
									focus:outline-none disabled:opacity-50"
							/>
							<button
								onClick={() => sendMessage()}
								disabled={!input.trim() || isLoading}
								className="text-orange-400 hover:text-orange-300 disabled:text-gray-600
									transition cursor-pointer disabled:cursor-not-allowed
									active:scale-90"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-5 w-5"
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
								</svg>
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default ChatBot;
