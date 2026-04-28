import React from 'react';
import PostCardAuthor from './PostCardAuthor';
import PostCardMeta from './PostCardMeta';
import PostCardActions from './PostCardActions';
import PostCardComments from './PostCardComments';
import type {
	PostCardAuthorProps,
	PostCardActionsProps,
	PostCardMetaProps,
	PostCardCommentsProps,
} from './postCard.types';

interface PostCardMobileProps {
	imageUrl: string;
	title: string;
	author: PostCardAuthorProps;
	meta: PostCardMetaProps;
	actions: PostCardActionsProps;
	comments: PostCardCommentsProps;
	onImageClick: () => void;
}

const PostCardMobile = React.memo(({ imageUrl, title, author, meta, actions, comments, onImageClick }: PostCardMobileProps) => (
	<div className="sm:hidden">
		<div className="px-4 pt-4 pb-2">
			<PostCardAuthor {...author} />
		</div>

		<div className="px-4" onClick={onImageClick}>
			<img
				src={imageUrl}
				alt={title}
				loading="lazy"
				className="w-full aspect-[4/3] object-cover rounded-xl border border-white/10 shadow-2xl"
			/>
		</div>

		<div className="px-4 pt-4">
			<PostCardMeta {...meta} />
			<PostCardActions {...actions} />
		</div>

		<div className="mt-3">
			<PostCardComments {...comments} />
		</div>
	</div>
));

PostCardMobile.displayName = 'PostCardMobile';

export default PostCardMobile;
