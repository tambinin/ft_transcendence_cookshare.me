interface ReceverProps {
    sender: string;
    picture: string;
    message: string;
    time: string;
}

const Recever = ({ picture, message, sender, time }: ReceverProps) => {
    return (
        <div>
            <div className="chat chat-start">
                <div className="chat-image avatar">
                    <div className="w-10 rounded-full">
                        <img
                            alt={sender}
                            src={picture}
                        />
                    </div>
                </div>
                <div className="chat-header">
                    {sender}
                    <time className="text-xs opacity-50">{time}</time>
                </div>
                <div className="chat-bubble">{message}</div>
                <div className="chat-footer opacity-50">Delivered</div>
            </div>
        </div>
    );
}

export default Recever;