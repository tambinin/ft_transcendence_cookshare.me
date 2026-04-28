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

interface PostCardTabletProps {
	image: PostCardImageProps;
	author: PostCardAuthorProps;
	meta: PostCardMetaProps;
	actions: PostCardActionsProps;
	comments: PostCardCommentsProps;
}

const PostCardTablet = React.memo(({ image, author, meta, actions, comments }: PostCardTabletProps) => (
	<>
		<div className="hidden sm:grid lg:hidden grid-cols-12">
			<div className="col-span-5 bg-gradient-to-br from-[#1e293b] to-[#0f172a]">
				<PostCardImage {...image} />
			</div>

			<div className="col-span-7 bg-slate-900/50 backdrop-blur-xl border-l border-white/5 p-5 flex flex-col">
				<div className="mb-4">
					<PostCardAuthor {...author} />
				</div>
				<PostCardMeta {...meta} maxTags={3} />
				<PostCardActions {...actions} />
			</div>
		</div>

		<div className="hidden sm:block lg:hidden">
			<PostCardComments {...comments} />
		</div>
	</>
));

PostCardTablet.displayName = 'PostCardTablet';

export default PostCardTablet;
