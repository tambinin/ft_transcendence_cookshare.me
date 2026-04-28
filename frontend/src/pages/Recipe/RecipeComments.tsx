import Comment from '../../components/Comment';
import type { RecipeComment } from '../../types/recipe.type';

interface RecipeCommentsProps {
	comments: RecipeComment[];
	onReply: (commentId: string, content: string) => Promise<void>;
	onEdit?: (commentId: string, content: string) => Promise<void>;
	onDelete?: (commentId: string) => Promise<void>;
	onReport: (commentId: string) => void;
	currentUserAvatar?: string;
	currentUserId?: string;
	isAuthenticated: boolean;
}

const RecipeComments = ({ comments, onReply, onEdit, onDelete, onReport, currentUserAvatar, currentUserId, isAuthenticated }: RecipeCommentsProps) => {
	if (comments.length === 0) return null;

	return (
		<section className="space-y-4">
			<h3 className="text-lg font-semibold">Comments ({comments.length})</h3>
			<div className="space-y-1">
				{comments.map((c) => (
					<Comment
						key={c.id}
						comment={c}
						onReply={onReply}
						onEdit={onEdit}
						onDelete={onDelete}
						onReport={onReport}
						currentUserAvatar={currentUserAvatar}
						currentUserId={currentUserId}
						isAuthenticated={isAuthenticated}
					/>
				))}
			</div>
		</section>
	);
};

export default RecipeComments;
