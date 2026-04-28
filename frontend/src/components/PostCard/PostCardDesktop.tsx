import React from 'react';
import PostCardImage from './PostCardImage';
import PostCardAuthor from './PostCardAuthor';
import PostCardMeta from './PostCardMeta';
import PostCardActions from './PostCardActions';
import PostCardComments from './PostCardComments';
import type {
	PostCardImageProps,
	PostCardAuthorProps,
	PostCardActionsProps,
	PostCardMetaProps,
	PostCardCommentsProps,
} from './postCard.types';

interface PostCardDesktopProps {
	image: PostCardImageProps;
	author: PostCardAuthorProps;
	meta: PostCardMetaProps;
	actions: PostCardActionsProps;
	comments: PostCardCommentsProps;
}

const PostCardDesktop = React.memo(({ image, author, meta, actions, comments }: PostCardDesktopProps) => (
	<div className="hidden lg:grid grid-cols-12">
		<div className="col-span-4 bg-gradient-to-br from-[#1e293b] to-[#0f172a]">
			<PostCardImage {...image} />
		</div>

		<div className="col-span-5 bg-slate-900/50 backdrop-blur-xl border-x border-white/5 p-5 flex flex-col">
			<div className="mb-4">
				<PostCardAuthor {...author} />
			</div>
			<PostCardMeta {...meta} />
			<PostCardActions {...actions} />
		</div>

		<div className="col-span-3 bg-black/10">
			<PostCardComments {...comments} />
		</div>
	</div>
));

PostCardDesktop.displayName = 'PostCardDesktop';

export default PostCardDesktop;
