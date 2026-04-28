interface SenderProps {
    message: string;
    time: string;
}

const Sender = ({ message, time }: SenderProps) => {
    return (
        <div>
            <div className="chat chat-end">
                <div className="chat-header">
                    you
                    <time className="text-xs opacity-50">{time}</time>
                </div>
                <div className="chat-bubble">{message}</div>
            </div>
        </div>
    );
}

export default Sender;